"""Original SE movement only; loads the approved Blender4.5.3 model unchanged.
Blender --background --python-exit-code 1 --python <this> -- <output> [--audit]
No geometry, materials, camera, lights or simulation settings are authored here.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(sys.argv[sys.argv.index('--') + 1])
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/source/q3/warrior-rig-v2/warrior.blend'))
assert bpy.app.version_string == '4.5.3 LTS'
scene = bpy.context.scene
rig = bpy.data.objects['Warrior rig']
rest = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in rig.data.bones}
idle = []
for frame in range(1, 9):
    scene.frame_set(frame)
    idle.append({b.name: b.matrix.copy() for b in rig.pose.bones})
rig.animation_data_clear()
cam = scene.camera
weapon = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith(
    ('Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'))]
assert len(weapon) == 4


def project(p):
    v = world_to_camera_view(scene, cam, Vector(p))
    return [round(v.x*256, 5), round((1-v.y)*256, 5)]


def foot_path(phase, stride, duty, lift):
    """Linear planted travel; Hermite swing matches stance velocity at both seams."""
    phase %= 1
    half = stride*duty/2
    if phase < duty:
        return -half+stride*phase, 0.0, True
    t = (phase-duty)/(1-duty)
    tangent = stride*(1-duty)
    y = ((2*t**3-3*t*t+1)*half + (t**3-2*t*t+t)*tangent
         + (-2*t**3+3*t*t)*(-half) + (t**3-t*t)*tangent)
    return y, lift*math.sin(math.pi*t)**2, False


def pose_bone(name, a, b):
    a, b = Vector(a), Vector(b)
    ra, rb = rest[name]
    rotation = (rb-ra).rotation_difference(b-a).to_matrix().to_4x4()
    rig.pose.bones[name].matrix = (Matrix.Translation(a) @ rotation
                                  @ Matrix.Translation(-ra) @ rig.data.bones[name].matrix_local)


def knee(hip, ankle, upper, lower):
    v = ankle-hip
    d = v.length
    assert abs(upper-lower) < d < upper+lower, ('Unreachable ankle', action, index, side, d, upper+lower)
    along = (upper*upper-lower*lower+d*d)/(2*d)
    direction = v.normalized()
    perpendicular = Vector((0, -1, 0))
    perpendicular = (perpendicular-direction*perpendicular.dot(direction)).normalized()
    return hip+direction*along+perpendicular*math.sqrt(upper*upper-along*along)


records = []
clips = {
    'idle': {'start': 0, 'count': 8, 'fps': 2.5, 'strideMeters': 0, 'duty': 1},
    'walk': {'start': 8, 'count': 16, 'strideMeters': 1.65, 'duty': .55},
    'run': {'start': 24, 'count': 16, 'strideMeters': 2.5, 'duty': .34},
}
for action, clip in clips.items():
    if action != 'idle':
        clip['worldStride'] = clip['strideMeters']*math.sqrt(.5)*256/cam.data.ortho_scale*.5/64
        clip['fps'] = (3 if action == 'walk' else 5.4)/clip['worldStride']*clip['count']
    for index in range(clip['count']):
        frame = len(records)+1
        scene.frame_set(frame)
        phase = index/clip['count']
        theta = phase*math.tau
        contacts = []
        if action == 'idle':
            for name, matrix in idle[index].items():
                rig.pose.bones[name].matrix = matrix
            contacts = [{'side': side, 'planted': True, 'sole': [x, 0, 0],
                         'pixel': project((x, 0, 0))}
                        for side, x in [('L', -.16), ('R', .16)]]
        else:
            running = action == 'run'
            hip_z = (.745+.018*(1-math.cos(2*theta)) if running
                     else .79+.01*(1-math.cos(2*theta)))
            shift = Vector(((.012 if running else .018)*math.sin(theta), 0, hip_z-.895))
            lean = Matrix.Rotation(.12 if running else .025, 3, 'X')
            pivot = Vector((0, 0, .94))
            upper_point = lambda p: pivot+lean@(Vector(p)-pivot)+shift
            pose_bone('root', *rest['root'])
            for name in ['torso', 'head']:
                pose_bone(name, *(upper_point(p) for p in rest[name]))
            for side, offset in [('L', 0), ('R', .5)]:
                x = -.16 if side == 'L' else .16
                y, z, planted = foot_path(phase+offset, clip['strideMeters'],
                                          clip['duty'], .24 if running else .14)
                hip, ankle = Vector((x+shift.x, 0, hip_z)), Vector((x, y, .09+z))
                upper = (rest['thigh'+side][1]-rest['thigh'+side][0]).length
                lower = (rest['shin'+side][1]-rest['shin'+side][0]).length
                k = knee(hip, ankle, upper, lower)
                pose_bone('thigh'+side, hip, k)
                pose_bone('shin'+side, k, ankle)
                pose_bone('foot'+side, ankle, ankle+Vector((0, -.21, 0)))
                contacts.append({'side': side, 'planted': planted, 'sole': [x, y, z],
                                 'pixel': project((x, y, z))})
                angle = ((.38 if side == 'L' else .12) if running
                         else (.16 if side == 'L' else .055))*math.sin(theta+offset*math.tau)
                shoulder = rest['upper'+side][0]
                rotation = Matrix.Rotation(angle, 3, 'X')
                for name in ['upper'+side, 'fore'+side, 'hand'+side]:
                    pose_bone(name, *(upper_point(shoulder+rotation@(p-shoulder)) for p in rest[name]))
        bpy.context.view_layer.update()
        for b in rig.pose.bones:
            b.rotation_mode = 'QUATERNION'
            b.keyframe_insert(data_path='location', frame=frame)
            b.keyframe_insert(data_path='rotation_quaternion', frame=frame)
        for c in contacts:
            ankle = rig.pose.bones['foot'+c['side']].head
            assert (ankle-Vector((c['sole'][0], c['sole'][1], .09+c['sole'][2]))).length < 1e-5
            assert (rig.pose.bones['shin'+c['side']].tail-ankle).length < 1e-5
        depsgraph = bpy.context.evaluated_depsgraph_get()
        wp = []
        for obj in weapon:
            evaluated = obj.evaluated_get(depsgraph)
            geometry = evaluated.to_mesh()
            wp.extend(project(evaluated.matrix_world@v.co) for v in geometry.vertices)
            evaluated.to_mesh_clear()
        name = f'{action}-se-{index:02}'
        records.append({'name': name, 'action': action, 'index': index,
                        'root': project((0, 0, 0)), 'contacts': contacts,
                        'weaponBounds': [min(p[0] for p in wp), min(p[1] for p in wp),
                                         max(p[0] for p in wp), max(p[1] for p in wp)],
                        'boneLengths': {b.name: round(b.length, 7) for b in rig.pose.bones}})
        if '--audit' not in sys.argv:
            scene.render.filepath = str(OUT/(name+'.png'))
            bpy.ops.render.render(write_still=True)
scene.frame_start, scene.frame_end = 1, 40
scene.timeline_markers.clear()
for name, clip in clips.items():
    scene.timeline_markers.new(name.upper(), frame=clip['start']+1)
if '--audit' not in sys.argv:
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'warrior.blend'), compress=True)
(OUT/'rig.json').write_text(json.dumps({'version': 1, 'blender': bpy.app.version_string,
    'renderSize': 512, 'cell': 256, 'root': [128, 210], 'direction': 'southeast',
    'orthoScale': cam.data.ortho_scale, 'elevationDegrees': 30, 'displayScale': .5,
    'clips': clips, 'frames': records}, indent=2)+'\n')
print('WARRIOR_MOVEMENT_AUDITED', len(records))
