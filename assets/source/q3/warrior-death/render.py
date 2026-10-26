"""Original non-looping death motion on the approved Warrior rig.
Blender --background --python-exit-code 1 --python <this> -- <out> se n ...
--audit checks all requested views; --frame <0..15> renders only one sample.
Presentation only: the real death event owns entry; the final pose is held.
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
minimum = int(args[args.index('--from')+1]) if '--from' in args else 0
assert selected is None or 0 <= selected < 16
assert 0 <= minimum < 16
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
scene.render.resolution_x = scene.render.resolution_y = 896
camera = scene.camera.data
camera.ortho_scale *= 448/256
camera.shift_x *= 256/448
camera.shift_y = camera.shift_y*256/448 - 32/448
for p, old in zip(probes, before):
    assert max(abs(a-b-offset) for a, b, offset in zip(project(p), old, [96, 64])) < .001


def around(point, rotation):
    return Matrix.Translation(point) @ rotation.to_4x4() @ Matrix.Translation(-point)


rest = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in rig.data.bones}


def pose_bone(name, a, b):
    ra, rb = rest[name]
    rotation = (rb-ra).rotation_difference(b-a).to_matrix().to_4x4()
    return Matrix.Translation(a) @ rotation @ Matrix.Translation(-ra) @ rig.data.bones[name].matrix_local


def knee(hip, ankle, upper, lower):
    v = ankle-hip
    d = v.length
    assert abs(upper-lower) < d < upper+lower
    along = (upper*upper-lower*lower+d*d)/(2*d)
    direction = v.normalized()
    perpendicular = Vector((0, -1, 0))
    perpendicular = (perpendicular-direction*perpendicular.dot(direction)).normalized()
    return hip+direction*along+perpendicular*math.sqrt(upper*upper-along*along)


def resting_elbow(shoulder, wrist, upper, lower, side):
    v = wrist-shoulder
    d = v.length
    assert abs(upper-lower) < d < upper+lower
    direction = v.normalized()
    along = (upper*upper-lower*lower+d*d)/(2*d)
    perpendicular = Vector((-.5 if side == 'L' else .5, 0, 1))
    perpendicular = (perpendicular-direction*perpendicular.dot(direction)).normalized()
    return shoulder+direction*along+perpendicular*math.sqrt(upper*upper-along*along)


# Grounded knee collapse, accelerating backward fall, restrained settling.
# whole-body angle, hip drop, torso fold, upper-arm brace, elbow flex.
poses = [(0, 0, 0, 0, 0),
         (0, .03, -.10, -.08, -.12),
         (0, .09, -.16, -.14, -.23),
         (0, .16, -.19, -.20, -.32),
         (.10, .20, -.17, -.26, -.38),
         (.27, .22, -.13, -.31, -.40),
         (.52, .22, -.08, -.34, -.38),
         (.82, .20, -.03, -.32, -.32),
         (1.10, .16, 0, -.28, -.26),
         (1.34, .11, 0, -.23, -.22),
         (1.50, .07, 0, -.20, -.18),
         (1.56, .04, 0, -.18, -.16),
         (1.53, .02, 0, -.18, -.16),
         (1.55, 0, 0, -.18, -.16),
         (1.55, 0, 0, -.18, -.16),
         (1.55, 0, 0, -.18, -.16)]
for direction in directions:
    output = OUT/direction
    output.mkdir(parents=True, exist_ok=True)
    rotation = Matrix.Rotation(math.radians(angles[direction]), 4, 'Z')
    for obj in objects:
        obj.matrix_world = rotation @ base[obj.name]
    records = []
    for index, (fall, drop, fold, arm, elbow) in enumerate(poses):
        matrices = {name: matrix.copy() for name, matrix in neutral.items()}
        shift = Matrix.Translation((0, 0, -drop))
        body = shift @ around(anchors['torso'], Matrix.Rotation(fold, 3, 'X'))
        matrices['torso'] = body @ neutral['torso']
        matrices['head'] = body @ neutral['head']
        for side in ['L', 'R']:
            if drop > 0:
                hip = anchors['thigh'+side]-Vector((0, 0, drop))
                ankle = anchors['foot'+side]
                k = knee(hip, ankle, lengths['thigh'+side], lengths['shin'+side])
                matrices['thigh'+side] = pose_bone('thigh'+side, hip, k)
                matrices['shin'+side] = pose_bone('shin'+side, k, ankle)
            upper = body @ around(anchors['upper'+side],
                Matrix.Rotation(arm*(1 if side == 'R' else .8), 3, 'X')
                @ Matrix.Rotation((.12 if side == 'R' else -.16)*math.sin(fall), 3, 'Z'))
            fore = upper @ around(anchors['fore'+side], Matrix.Rotation(elbow, 3, 'X'))
            for name, transform in [('upper', upper), ('fore', fore), ('hand', fore)]:
                matrices[name+side] = transform @ neutral[name+side]
        fallen = Matrix.Rotation(-fall, 4, 'X')
        for name, matrix in matrices.items():
            rig.pose.bones[name].matrix = neutral[name] if name == 'root' else fallen @ matrix
        bpy.context.view_layer.update()
        # Contact resolution for art only: a single whole-pose vertical offset.
        # It does not fit the camera or move the simulation root. Never sink armor,
        # weapon or cloak through the ground; all vertices retain their geometry.
        depsgraph = bpy.context.evaluated_depsgraph_get()
        low = math.inf
        shoe_low = {'L': math.inf, 'R': math.inf}
        for obj in objects:
            if obj.type != 'MESH':
                continue
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            low = min(low, min((evaluated.matrix_world @ v.co).z for v in mesh.vertices))
            for side in ['L', 'R']:
                if obj.vertex_groups.get('foot'+side):
                    shoe_low[side] = min(shoe_low[side], min((evaluated.matrix_world @ v.co).z for v in mesh.vertices))
            evaluated.to_mesh_clear()
        lift = max(0, .002-low) if index >= 4 else 0
        if lift:
            for name in matrices:
                if name != 'root':
                    rig.pose.bones[name].matrix = Matrix.Translation((0, 0, lift)) @ fallen @ matrices[name]
            bpy.context.view_layer.update()
        # On landing, heels settle onto the floor rather than following the
        # torso's cloak clearance into the air. Preserve limb lengths with IK;
        # knees remain free above the floor. No root or camera fitting.
        if index >= 8:
            landing = min(1, (index-7)/4)
            for side in ['L', 'R']:
                hip = rig.pose.bones['thigh'+side].head.copy()
                ankle = rig.pose.bones['foot'+side].head.copy()
                ankle.z += (.002-(shoe_low[side]+lift))*landing
                k = knee(hip, ankle, lengths['thigh'+side], lengths['shin'+side])
                foot = rig.pose.bones['foot'+side].matrix.copy()
                foot.translation = ankle
                rig.pose.bones['thigh'+side].matrix = pose_bone('thigh'+side, hip, k)
                rig.pose.bones['shin'+side].matrix = pose_bone('shin'+side, k, ankle)
                rig.pose.bones['foot'+side].matrix = foot
            bpy.context.view_layer.update()
            # Arms release their active brace as the torso lands. Keep the wrist
            # connected with two-bone IK and let the held sword rest alongside
            # the body rather than retaining a raised combat pose.
            for side in ['L', 'R']:
                shoulder = rig.pose.bones['upper'+side].head.copy()
                wrist = rig.pose.bones['hand'+side].head.copy()
                target = wrist.copy()
                target.z = .075
                reach = lengths['upper'+side]+lengths['fore'+side]
                delta = target-shoulder
                if delta.length > reach*.97:
                    target = shoulder+delta.normalized()*(reach*.97)
                wrist = wrist.lerp(target, landing)
                joint = resting_elbow(shoulder, wrist, lengths['upper'+side], lengths['fore'+side], side)
                current = rig.pose.bones['hand'+side].matrix.copy()
                rest_hand = fallen @ neutral['hand'+side]
                orientation = current.to_quaternion().slerp(rest_hand.to_quaternion(), landing).to_matrix().to_4x4()
                orientation.translation = wrist
                rig.pose.bones['upper'+side].matrix = pose_bone('upper'+side, shoulder, joint)
                rig.pose.bones['fore'+side].matrix = pose_bone('fore'+side, joint, wrist)
                rig.pose.bones['hand'+side].matrix = orientation
            bpy.context.view_layer.update()
        assert (rig.pose.bones['root'].head-anchors['root']).length < 1e-5
        assert max(abs(a-b) for a, b in zip(project((0, 0, 0)), [224, 274])) < .001
        for bone in rig.pose.bones:
            assert abs(bone.length-lengths[bone.name]) < 1e-5
        for side in ['L', 'R']:
            for parent, child in [('upper', 'fore'), ('fore', 'hand'), ('thigh', 'shin'), ('shin', 'foot')]:
                assert (rig.pose.bones[parent+side].tail-rig.pose.bones[child+side].head).length < 1e-5, (index, parent, child)
            if index <= 3:
                assert (rig.pose.bones['foot'+side].head-anchors['foot'+side]).length < 1e-5
        points, all_points, heights = [], [], []
        shoe_ground = {'L': math.inf, 'R': math.inf}
        for obj in objects:
            if obj.type != 'MESH':
                continue
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            for vertex in mesh.vertices:
                point = evaluated.matrix_world @ vertex.co
                pixel = project(point)
                all_points.append(pixel)
                heights.append(point.z)
                for side in ['L', 'R']:
                    if obj.vertex_groups.get('foot'+side):
                        shoe_ground[side] = min(shoe_ground[side], point.z)
                if obj in weapons:
                    points.append(pixel)
            evaluated.to_mesh_clear()
        bounds = [min(p[0] for p in all_points), min(p[1] for p in all_points),
                  max(p[0] for p in all_points), max(p[1] for p in all_points)]
        assert all(8 <= x <= 440 and 8 <= y <= 440 for x, y in all_points), (direction, index, bounds)
        assert min(heights) >= -.001, (direction, index, min(heights))
        if index >= 11:
            assert all(abs(z-.002) < .001 for z in shoe_ground.values()), (direction, index, shoe_ground)
        name = f'death-{direction}-{index:02}'
        records.append({'name': name, 'action': 'death', 'index': index,
            'root': project((0, 0, 0)),
            'feet': [list(rig.matrix_world @ rig.pose.bones['foot'+s].head) for s in ['L', 'R']],
            'footPixels': [project(rig.matrix_world @ rig.pose.bones['foot'+s].head) for s in ['L', 'R']],
            'boneLengths': {b.name: round(b.length, 7) for b in rig.pose.bones},
            'weaponBounds': [min(p[0] for p in points), min(p[1] for p in points),
                             max(p[0] for p in points), max(p[1] for p in points)],
            'geometryBounds': bounds, 'groundMinimum': min(heights),
            'shoeGroundMinimum': shoe_ground,
            'contactLift': lift, 'fallRadians': fall, 'hipDrop': drop})
        # Exact idle start and exact repeated settled pixels are packaged by copying.
        reuse_early = '--reuse-early' in args and index < 8 and (output/(name+'.png')).exists()
        if '--audit' not in args and not reuse_early and max(1, minimum) <= index < 14 and (selected is None or selected == index):
            scene.render.filepath = str(output/(name+'.png'))
            bpy.ops.render.render(write_still=True)
    (output/'rig.json').write_text(json.dumps({
        'version': 1, 'blender': bpy.app.version_string, 'direction': direction,
        'cell': 448, 'renderSize': 896, 'root': [224, 274], 'displayScale': .5,
        'rotationDegrees': angles[direction], 'mirrored': False,
        'clips': {'death': {'start': 0, 'count': 16, 'durationTicks': 30, 'loop': False, 'terminal': 15}},
        'frames': records,
        'sourceRigSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'rendererSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }, indent=2)+'\n')
    print('WARRIOR_DEATH_AUDIT', direction, len(records), flush=True)


