"""Original SE attack pilot; animate the approved rig, never rebuild its art.
Blender --background --python-exit-code 1 --python <this> -- <out> [--audit]
Two nonlooping phase ranges: anticipation 0..4, impact 5, follow-through 6..11.
Runtime maps these poses to existing combat phases, rather than changing ticks.
"""
import bpy
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
OUT.mkdir(parents=True, exist_ok=True)
source = ROOT/'assets/source/q3/warrior-rig-v2/warrior.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
assert bpy.app.version_string == '4.5.3 LTS'
scene = bpy.context.scene
rig = bpy.data.objects['Warrior rig']
rest = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in rig.data.bones}
assert len(rest) == 15
assert len([o for o in scene.objects if o.type == 'MESH']) == 135
scene.frame_set(1)
neutral = {b.name: b.matrix.copy() for b in rig.pose.bones}
anchors = {b.name: b.head.copy() for b in rig.pose.bones}
rig.animation_data_clear()
weapons = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith(
    ('Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'))]
assert len(weapons) == 4


def project(p):
    v = world_to_camera_view(scene, scene.camera, Vector(p))
    return [round(v.x*256, 5), round((1-v.y)*256, 5)]


def around(point, rotation):
    return Matrix.Translation(point) @ rotation.to_4x4() @ Matrix.Translation(-point)


def blend_keys(keys, index):
    for (a, values), (b, target) in zip(keys, keys[1:]):
        if a <= index <= b:
            t = (index-a)/(b-a)
            t = t*t*(3-2*t)
            return [x+(y-x)*t for x, y in zip(values, target)]
    raise AssertionError(index)


# torso twist, shoulder pitch/yaw, elbow pitch, wrist pitch. Radians.
# Primary: descending diagonal cut; secondary: low lateral returning sweep.
keys = {
    'primary': [(0, [0, 0, 0, 0, 0]),
                (3, [-.24, -.55, -.30, -1.05, -.55]),
                (4, [-.29, -.58, -.34, -1.12, -.55]),
                (5, [.12, -.35, .12, -.25, .20]),
                (7, [.25, -.24, .40, -.12, .22]),
                (11, [0, 0, 0, 0, 0])],
    'secondary': [(0, [0, 0, 0, 0, 0]),
                  (3, [.28, -.20, .75, -.40, .20]),
                  (4, [.31, -.22, .82, -.42, .22]),
                  (5, [-.12, -.60, -.70, -.30, 0]),
                  (7, [-.28, -.30, -.70, -.20, .10]),
                  (11, [0, 0, 0, 0, 0])],
}
records = []
for action, controls in keys.items():
    for index in range(12):
        frame = len(records)+1
        scene.frame_set(frame)
        twist, pitch, yaw, elbow, wrist = blend_keys(controls, index)
        body = around(anchors['torso'], Matrix.Rotation(twist, 3, 'Z'))
        transforms = {name: Matrix.Identity(4) for name in rest}
        transforms['torso'] = transforms['head'] = body
        for side in ['L', 'R']:
            shoulder = anchors['upper'+side]
            rotation = (Matrix.Rotation(pitch if side == 'R' else -.12*abs(twist), 3, 'X')
                        @ Matrix.Rotation(yaw if side == 'R' else -.15*twist, 3, 'Z'))
            upper = body @ around(shoulder, rotation)
            fore = upper @ around(anchors['fore'+side],
                                  Matrix.Rotation(elbow if side == 'R' else -.25*abs(twist), 3, 'X'))
            hand = fore @ around(anchors['hand'+side],
                                 Matrix.Rotation(wrist if side == 'R' else 0, 3, 'X'))
            for name, transform in [('upper', upper), ('fore', fore), ('hand', hand)]:
                transforms[name+side] = transform
        for name, transform in transforms.items():
            bone = rig.pose.bones[name]
            bone.matrix = transform @ neutral[name]
            bone.rotation_mode = 'QUATERNION'
            bone.keyframe_insert(data_path='location', frame=frame)
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)
        bpy.context.view_layer.update()
        for name, (a, b) in rest.items():
            assert abs(rig.pose.bones[name].length-(b-a).length) < 1e-5, name
        for side in ['L', 'R']:
            for parent, child in [('upper', 'fore'), ('fore', 'hand'), ('thigh', 'shin')]:
                assert (rig.pose.bones[parent+side].tail-rig.pose.bones[child+side].head).length < 1e-5
            assert (rig.pose.bones['foot'+side].head-rest['foot'+side][0]).length < 1e-5
        depsgraph = bpy.context.evaluated_depsgraph_get()
        points = []
        for obj in weapons:
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            points.extend(project(evaluated.matrix_world @ v.co) for v in mesh.vertices)
            evaluated.to_mesh_clear()
        assert all(8 <= x <= 248 and 8 <= y <= 248 for x, y in points), (
            'Weapon outside eight-pixel window', action, index)
        assert max(abs(a-b) for a, b in zip(project((0, 0, 0)), [128, 210])) < .001
        name = f'{action}-se-{index:02}'
        records.append({'name': name, 'action': action, 'index': index,
                        'phase': 'windup' if index < 5 else 'active' if index == 5 else 'recovery',
                        'root': project((0, 0, 0)),
                        'feet': [list(rig.pose.bones['foot'+s].head) for s in ['L', 'R']],
                        'weaponBounds': [min(p[0] for p in points), min(p[1] for p in points),
                                         max(p[0] for p in points), max(p[1] for p in points)],
                        'boneLengths': {b.name: round(b.length, 7) for b in rig.pose.bones}})
        if '--audit' not in args:
            scene.render.filepath = str(OUT/(name+'.png'))
            bpy.ops.render.render(write_still=True)
scene.frame_start, scene.frame_end = 1, 24
scene.timeline_markers.clear()
for action, start in [('primary', 0), ('secondary', 12)]:
    for phase, offset in [('anticipation', 0), ('impact', 5), ('recovery', 6)]:
        scene.timeline_markers.new(action+' '+phase, frame=start+offset+1)
if '--audit' not in args:
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'warrior.blend'), compress=True)
(OUT/'rig.json').write_text(json.dumps({
    'version': 1, 'blender': bpy.app.version_string, 'direction': 'se',
    'renderSize': 512, 'cell': 256, 'root': [128, 210], 'displayScale': .5,
    'baseRigSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'producerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'clips': {action: {'start': start, 'count': 12, 'impact': 5, 'loop': False}
              for action, start in [('primary', 0), ('secondary', 12)]},
    'frames': records}, indent=2)+'\n')
print('WARRIOR_COMBAT_AUDITED', len(records), flush=True)
