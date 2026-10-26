"""Directional views of the approved SE movement rig; no new model or motion.
Blender --background --python-exit-code 1 --python <this> -- <out> n e s w
Use --audit for metadata only, or --frame <zero-based-index> for one render/view.
SE is deliberately excluded: its approved pixels are reused without rendering.
"""
import bpy
import copy
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[4]
args = sys.argv[sys.argv.index('--')+1:]
OUT = Path(args[0])
angles = {'n': 135, 'ne': 90, 'e': 45, 's': 315, 'sw': 270, 'w': 225, 'nw': 180}
directions = [a for a in args[1:] if a in angles]
assert directions and len(directions) == len(set(directions))
selected = int(args[args.index('--frame')+1]) if '--frame' in args else None
assert selected is None or 0 <= selected < 40
source = ROOT/'assets/source/q3/warrior-movement-se/warrior.blend'
approved = json.loads((ROOT/'public/dev/warrior-movement/warrior.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == approved['provenance']['rigSha256']
bpy.ops.wm.open_mainfile(filepath=str(source))
assert bpy.app.version_string == '4.5.3 LTS'
scene = bpy.context.scene
camera = scene.camera
rig = bpy.data.objects['Warrior rig']
objects = [o for o in scene.objects if o.type in ('MESH', 'ARMATURE')]
assert len([o for o in objects if o.type == 'MESH']) == 135
base = {o.name: o.matrix_world.copy() for o in objects}
weapons = [o for o in objects if o.type == 'MESH' and o.name.startswith(
    ('Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'))]
assert len(weapons) == 4


def project(p):
    v = world_to_camera_view(scene, camera, Vector(p))
    return [round(v.x*256, 5), round((1-v.y)*256, 5)]


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
        for contact in record['contacts']:
            local = Vector(contact['sole'])
            sole = rotation @ local
            contact['localSole'] = list(local)
            contact['sole'] = list(sole)
            contact['pixel'] = project(sole)
            ankle = rig.matrix_world @ rig.pose.bones['foot'+contact['side']].head
            expected = rotation @ (local+Vector((0, 0, .09)))
            assert (ankle-expected).length < 1e-5, ('ankle', direction, index)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        weapon_points, bounds = [], []
        for obj in objects:
            if obj.type != 'MESH':
                continue
            evaluated = obj.evaluated_get(depsgraph)
            if obj in weapons:
                mesh = evaluated.to_mesh()
                weapon_points.extend(project(evaluated.matrix_world @ v.co) for v in mesh.vertices)
                evaluated.to_mesh_clear()
            bounds.extend(project(evaluated.matrix_world @ Vector(v)) for v in evaluated.bound_box)
        record['weaponBounds'] = [min(p[0] for p in weapon_points), min(p[1] for p in weapon_points),
                                  max(p[0] for p in weapon_points), max(p[1] for p in weapon_points)]
        record['conservativeBounds'] = [min(p[0] for p in bounds), min(p[1] for p in bounds),
                                        max(p[0] for p in bounds), max(p[1] for p in bounds)]
        record['boneLengths'] = {b.name: round(b.length, 7) for b in rig.pose.bones}
        assert set(record['boneLengths']) == set(original['boneLengths'])
        assert all(abs(length-original['boneLengths'][name]) < 1e-5
                   for name, length in record['boneLengths'].items())
        assert max(abs(a-b) for a, b in zip(record['root'], approved['root'])) < .001
        records.append(record)
        if '--audit' not in args and (selected is None or selected == index):
            scene.render.filepath = str(output/(record['name']+'.png'))
            bpy.ops.render.render(write_still=True)
    origin, heading = project((0, 0, 0)), project(rotation @ Vector((0, -1, 0)))
    dx, dy = heading[0]-origin[0], heading[1]-origin[1]
    facing = [dx/math.hypot(dx, dy), dy/math.hypot(dx, dy)]
    metadata = {k: copy.deepcopy(approved[k]) for k in
                ['version', 'blender', 'cell', 'root', 'orthoScale', 'elevationDegrees', 'displayScale', 'clips']}
    metadata.update({'renderSize': 512, 'direction': direction, 'rotationDegrees': angles[direction],
                     'facing': facing, 'mirrored': False, 'frames': records})
    (output/'rig.json').write_text(json.dumps(metadata, indent=2)+'\n')
    print('WARRIOR_DIRECTION', direction, facing, len(records),
          [min(f['conservativeBounds'][i] for f in records) if i < 2
           else max(f['conservativeBounds'][i] for f in records) for i in range(4)], flush=True)
