"""Rotate the approved SE attacks as complete geometry; never mirror or reauthor.
Blender --background --python-exit-code 1 --python <this> -- <out> n e s w
--audit writes metadata only; --frame <0..23> renders one pose per view.
Approved SE pixels and the saved source blend remain untouched.
"""
import bpy
import copy
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[4]
args = sys.argv[sys.argv.index('--')+1:]
OUT = Path(args[0])
angles = {'n': 135, 'ne': 90, 'e': 45, 's': 315, 'sw': 270, 'w': 225, 'nw': 180}
directions = [a for a in args[1:] if a in angles]
assert directions and len(directions) == len(set(directions))
selected = int(args[args.index('--frame')+1]) if '--frame' in args else None
assert selected is None or 0 <= selected < 24
source = ROOT/'assets/source/q3/warrior-combat-se/warrior.blend'
approved = json.loads((ROOT/'public/dev/warrior-combat/warrior.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == approved['provenance']['rigSha256']
bpy.ops.wm.open_mainfile(filepath=str(source))
assert bpy.app.version_string == approved['blender'] == '4.5.3 LTS'
scene = bpy.context.scene
camera = scene.camera


def project(p):
    v = world_to_camera_view(scene, camera, Vector(p))
    return [round(v.x*scene.render.resolution_x/2, 5),
            round((1-v.y)*scene.render.resolution_y/2, 5)]


# Fixed overscan, not a character resize. Old 256px coordinates translate +32,+64.
# Measured original weapon envelope: x=-15.426..271.426, y=-41.764..234.737.
# 320px preserves the original pixels-per-meter and gives >=16px weapon margin.
probes = [Vector(p) for p in [(0, 0, 0), (1, 0, 0), (0, 1, 1), (-1, -1, 2)]]
before = [project(p) for p in probes]
scene.render.resolution_x = scene.render.resolution_y = 640
camera.data.ortho_scale *= 320/256
camera.data.shift_x *= 256/320
camera.data.shift_y = camera.data.shift_y*256/320 + .1
for p, old in zip(probes, before):
    assert max(abs(a-b-offset) for a, b, offset in zip(project(p), old, [32, 64])) < .001
rig = bpy.data.objects['Warrior rig']
objects = [o for o in scene.objects if o.type in ('MESH', 'ARMATURE')]
assert len([o for o in objects if o.type == 'MESH']) == 135
assert len(rig.pose.bones) == 15
base = {o.name: o.matrix_world.copy() for o in objects}
weapons = [o for o in objects if o.type == 'MESH' and o.name.startswith(
    ('Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'))]
assert len(weapons) == 4


for direction in directions:
    output = OUT/direction
    output.mkdir(parents=True, exist_ok=True)
    rotation = Matrix.Rotation(math.radians(angles[direction]), 4, 'Z')
    for obj in objects:
        obj.matrix_world = rotation @ base[obj.name]
    records = []
    for index, original in enumerate(approved['frames']):
        scene.frame_set(index+1)
        bpy.context.view_layer.update()
        record = copy.deepcopy(original)
        for key in ['x', 'y', 'width', 'height', 'pixelSha256']:
            record.pop(key, None)
        record['name'] = f"{record['action']}-{direction}-{record['index']:02}"
        record['root'] = project((0, 0, 0))
        record['feet'] = []
        for side, original_foot in zip(['L', 'R'], original['feet']):
            foot = rig.matrix_world @ rig.pose.bones['foot'+side].head
            assert (foot-rotation @ Vector(original_foot)).length < 1e-5
            record['feet'].append(list(foot))
        record['boneLengths'] = {b.name: round(b.length, 7) for b in rig.pose.bones}
        assert all(abs(length-original['boneLengths'][name]) < 1e-5
                   for name, length in record['boneLengths'].items())
        for side in ['L', 'R']:
            for parent, child in [('upper', 'fore'), ('fore', 'hand'), ('thigh', 'shin')]:
                assert (rig.pose.bones[parent+side].tail-rig.pose.bones[child+side].head).length < 1e-5
        depsgraph = bpy.context.evaluated_depsgraph_get()
        points, bounds = [], []
        for obj in objects:
            if obj.type != 'MESH':
                continue
            evaluated = obj.evaluated_get(depsgraph)
            if obj in weapons:
                mesh = evaluated.to_mesh()
                points.extend(project(evaluated.matrix_world @ v.co) for v in mesh.vertices)
                evaluated.to_mesh_clear()
            bounds.extend(project(evaluated.matrix_world @ Vector(v)) for v in evaluated.bound_box)
        record['weaponBounds'] = [min(p[0] for p in points), min(p[1] for p in points),
                                  max(p[0] for p in points), max(p[1] for p in points)]
        record['conservativeBounds'] = [min(p[0] for p in bounds), min(p[1] for p in bounds),
                                        max(p[0] for p in bounds), max(p[1] for p in bounds)]
        assert all(8 <= x <= 312 and 8 <= y <= 312 for x, y in points), (
            'Weapon outside approved window', direction, index, record['weaponBounds'])
        assert max(abs(a-b) for a, b in zip(record['root'], [160, 274])) < .001
        records.append(record)
        # Endpoint art is the approved directional idle0, copied by the packager.
        if '--audit' not in args and index not in [0, 11, 12, 23] and (selected is None or selected == index):
            scene.render.filepath = str(output/(record['name']+'.png'))
            bpy.ops.render.render(write_still=True)
    origin, heading = project((0, 0, 0)), project(rotation @ Vector((0, -1, 0)))
    dx, dy = heading[0]-origin[0], heading[1]-origin[1]
    metadata = {k: copy.deepcopy(approved[k]) for k in
                ['version', 'blender', 'cell', 'root', 'displayScale', 'clips']}
    metadata.update({'renderSize': 640, 'cell': 320, 'root': [160, 274],
                     'originalPixelOffset': [32, 64],
                     'direction': direction, 'rotationDegrees': angles[direction],
                     'facing': [dx/math.hypot(dx, dy), dy/math.hypot(dx, dy)],
                     'mirrored': False, 'frames': records,
                     'sourceRigSha256': approved['provenance']['rigSha256'],
                     'rendererSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()})
    (output/'rig.json').write_text(json.dumps(metadata, indent=2)+'\n')
    print('WARRIOR_ATTACK_DIRECTION', direction, len(records),
          [min(f['conservativeBounds'][i] for f in records) if i < 2
           else max(f['conservativeBounds'][i] for f in records) for i in range(4)], flush=True)
