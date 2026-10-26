"""Original six-pose guarded hit recovery on the approved Warrior rig.
Blender --background --python-exit-code 1 --python <this> -- <out> se n ...
--audit checks all requested views; --frame <0..5> renders only one sample.
There is one player hitstun state; no invented heavy-stagger clip or duration.
"""
import bpy
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
angles = {'n': 135, 'ne': 90, 'e': 45, 'se': 0,
          's': 315, 'sw': 270, 'w': 225, 'nw': 180}
directions = [a for a in args[1:] if a in angles]
assert directions and len(directions) == len(set(directions))
selected = int(args[args.index('--frame')+1]) if '--frame' in args else None
assert selected is None or 0 <= selected < 6
source = ROOT/'assets/source/q3/warrior-rig-v2/warrior.blend'
approved = json.loads((ROOT/'public/dev/warrior-refined/warrior.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == approved['provenance']['rigSha256']
bpy.ops.wm.open_mainfile(filepath=str(source))
assert bpy.app.version_string == '4.5.3 LTS'
scene, rig = bpy.context.scene, bpy.data.objects['Warrior rig']
scene.frame_set(1)
neutral = {b.name: b.matrix.copy() for b in rig.pose.bones}
anchors = {b.name: b.head.copy() for b in rig.pose.bones}
lengths = {b.name: b.length for b in rig.pose.bones}
assert len(neutral) == 15
rig.animation_data_clear()
objects = [o for o in scene.objects if o.type in ('MESH', 'ARMATURE')]
assert len([o for o in objects if o.type == 'MESH']) == 135
base = {o.name: o.matrix_world.copy() for o in objects}
weapons = [o for o in objects if o.type == 'MESH' and o.name.startswith(
    ('Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'))]
assert len(weapons) == 4


def project(p):
    v = world_to_camera_view(scene, scene.camera, Vector(p))
    return [round(v.x*scene.render.resolution_x/2, 5),
            round((1-v.y)*scene.render.resolution_y/2, 5)]


probes = [Vector(p) for p in [(0, 0, 0), (1, 0, 0), (0, 1, 1), (-1, -1, 2)]]
before = [project(p) for p in probes]
scene.render.resolution_x = scene.render.resolution_y = 640
camera = scene.camera.data
camera.ortho_scale *= 320/256
camera.shift_x *= 256/320
camera.shift_y = camera.shift_y*256/320 + .1
for p, old in zip(probes, before):
    assert max(abs(a-b-offset) for a, b, offset in zip(project(p), old, [32, 64])) < .001


def around(point, rotation):
    return Matrix.Translation(point) @ rotation.to_4x4() @ Matrix.Translation(-point)


# Immediate recoil, peak, then recovery. Lower-body contacts never move.
# torso pitch/yaw, sword shoulder pitch/elbow, offhand shoulder pitch/elbow.
poses = [(-.12, -.05, -.10, -.18, -.12, -.16),
         (-.20, -.09, -.20, -.32, -.23, -.28),
         (-.14, -.06, -.15, -.24, -.17, -.20),
         (-.07, -.03, -.08, -.12, -.09, -.10),
         (-.02, -.01, -.02, -.04, -.03, -.03),
         (0, 0, 0, 0, 0, 0)]
for direction in directions:
    output = OUT/direction
    output.mkdir(parents=True, exist_ok=True)
    rotation = Matrix.Rotation(math.radians(angles[direction]), 4, 'Z')
    for obj in objects:
        obj.matrix_world = rotation @ base[obj.name]
    records = []
    for index, (pitch, twist, arm, elbow, offhand, off_elbow) in enumerate(poses):
        body = around(anchors['torso'], Matrix.Rotation(twist, 3, 'Z')
                      @ Matrix.Rotation(pitch, 3, 'X'))
        transforms = {name: Matrix.Identity(4) for name in neutral}
        transforms['torso'] = transforms['head'] = body
        for side in ['L', 'R']:
            upper = body @ around(anchors['upper'+side], Matrix.Rotation(arm if side == 'R' else offhand, 3, 'X'))
            fore = upper @ around(anchors['fore'+side], Matrix.Rotation(elbow if side == 'R' else off_elbow, 3, 'X'))
            for name, transform in [('upper', upper), ('fore', fore), ('hand', fore)]:
                transforms[name+side] = transform
        for name, transform in transforms.items():
            rig.pose.bones[name].matrix = transform @ neutral[name]
        bpy.context.view_layer.update()
        assert max(abs(a-b) for a, b in zip(project((0, 0, 0)), [160, 274])) < .001
        for bone in rig.pose.bones:
            assert abs(bone.length-lengths[bone.name]) < 1e-5
        for side in ['L', 'R']:
            for parent, child in [('upper', 'fore'), ('fore', 'hand'), ('thigh', 'shin')]:
                assert (rig.pose.bones[parent+side].tail-rig.pose.bones[child+side].head).length < 1e-5
            assert (rig.pose.bones['foot'+side].head-anchors['foot'+side]).length < 1e-5
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
        weapon = [min(p[0] for p in points), min(p[1] for p in points),
                  max(p[0] for p in points), max(p[1] for p in points)]
        assert all(8 <= x <= 312 and 8 <= y <= 312 for x, y in points), (direction, index, weapon)
        name = f'hit-{direction}-{index:02}'
        records.append({'name': name, 'action': 'hit', 'index': index,
            'root': project((0, 0, 0)),
            'feet': [list(rig.matrix_world @ rig.pose.bones['foot'+s].head) for s in ['L', 'R']],
            'boneLengths': {b.name: round(b.length, 7) for b in rig.pose.bones},
            'weaponBounds': weapon,
            'conservativeBounds': [min(p[0] for p in bounds), min(p[1] for p in bounds),
                                   max(p[0] for p in bounds), max(p[1] for p in bounds)]})
        if '--audit' not in args and index != 5 and (selected is None or selected == index):
            scene.render.filepath = str(output/(name+'.png'))
            bpy.ops.render.render(write_still=True)
    (output/'rig.json').write_text(json.dumps({
        'version': 1, 'blender': bpy.app.version_string, 'direction': direction,
        'cell': 320, 'renderSize': 640, 'root': [160, 274], 'displayScale': .5,
        'rotationDegrees': angles[direction], 'mirrored': False,
        'clips': {'hit': {'start': 0, 'count': 6, 'loop': False}},
        'frames': records,
        'sourceRigSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'rendererSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }, indent=2)+'\n')
    print('WARRIOR_HIT_AUDIT', direction, len(records), flush=True)
