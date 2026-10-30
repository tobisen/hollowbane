"""Bounded original two-hand cinder-staff pilot, never production compatibility.

Blender --background --python-exit-code 1 --python scripts/probe-warrior-staff.py
  -- /private/tmp/warrior-staff-proof [--audit]

Default twelve static poses; --motion gives twelve primary poses per selected
direction. --motion --carry gives forty locomotion poses per selected direction.
--motion --ability <iron-fan|oath-echo> gives twelve staff-specific ability poses.
--motion --reaction hit gives six staff-compatible hit recovery poses.
--motion --death reuses sixteen approved collapse poses with staff arm IK.
Uses the approved rig/materials/camera and hash-verified two-bone IK authoring.
No blend/public writes, gameplay callbacks, mechanics or save changes.
"""
import argparse
import ast
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--audit', action='store_true')
    parser.add_argument('--motion', action='store_true', help='Bounded SE primary choreography instead of legacy static study')
    parser.add_argument('--carry', action='store_true', help='Staff guard over approved forty movement poses')
    parser.add_argument('--ability', choices=['iron-fan', 'oath-echo'], help='Original staff-compatible assigned Warrior ability')
    parser.add_argument('--reaction', choices=['hit', 'hit-extended'], help='Existing six-pose hitstun presentation, with held-weapon entry')
    parser.add_argument('--reuse-prefix', type=Path, help='Prior death proof: reuse identical poses before release')
    parser.add_argument('--death', action='store_true', help='Staff over the approved sixteen grounded collapse poses')
    parser.add_argument('--reuse-guards', type=Path, help='Reviewed primary source directory for exact ability guard aliases')
    parser.add_argument('--subframes', type=int, choices=[1, 8], default=1)
    parser.add_argument('--directions', nargs='+', choices=['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'])
    options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    assert options.subframes == 1 or (options.audit and options.motion)
    assert options.directions is None or (options.motion and len(options.directions) == len(set(options.directions)))
    assert not options.carry or (options.motion and options.subframes == 1)
    assert not options.ability or (options.motion and not options.carry)
    assert not options.reaction or (options.motion and not options.carry and not options.ability)
    assert not options.reuse_guards or ((options.ability or options.reaction or options.death) and not options.audit)
    assert not options.death or (options.motion and not options.carry and not options.ability and not options.reaction and options.subframes == 1)
    action = 'death' if options.death else options.ability or options.reaction or 'primary'
    motion_path = ROOT / ('assets/source/q3/warrior-staff-se/' + (action + '.json' if options.ability or options.reaction or options.death else 'motion.json'))
    motion = json.loads(motion_path.read_text()) if options.motion else None
    guard_source = None
    if options.reuse_guards:
        primary_path = ROOT / 'assets/source/q3/warrior-staff-se/motion.json'
        primary_controls = json.loads(primary_path.read_text())
        assert motion['geometry'] == primary_controls['geometry']
        for endpoint in [0] if options.death else [-1] if options.reaction else [0, -1]:
            assert {k:motion['keys'][endpoint][k] for k in ['palm','axis','lean','yaw']} == {k:primary_controls['keys'][endpoint][k] for k in ['palm','axis','lean','yaw']}
        if action == 'hit-extended':
            active = next(k for k in primary_controls['keys'] if k['pose'] == 5)
            assert {k:motion['keys'][0][k] for k in ['palm','axis','lean','yaw']} == {k:active[k] for k in ['palm','axis','lean','yaw']}
        guard_bytes = (options.reuse_guards / 'staff.json').read_bytes()
        guard_source = json.loads(guard_bytes)
        guard_review = json.loads((options.reuse_guards / 'review.json').read_text())
        assert guard_review['sampledGeometryPassed']
        assert guard_review['proofSha256'] == hashlib.sha256(guard_bytes).hexdigest()
        assert not guard_source['productionApproved']
        if guard_source['motionSha256'] != digest(primary_path):
            consumed = options.reuse_guards.parent / 'motion-consumed.json'
            assert digest(consumed) == guard_source['motionSha256']
            assert json.loads(consumed.read_text()) == primary_controls
    output = options.output.resolve()
    assert not output.is_relative_to(ROOT)
    output.mkdir(parents=True, exist_ok=True)
    assert bpy.app.version_string == '4.5.3 LTS'
    movement_path = ROOT / 'public/dev/warrior-directions/warrior.json'
    movement = json.loads(movement_path.read_text())
    carry = []
    carry_controls_path = ROOT / 'assets/source/q3/warrior-staff-se/carry.json'
    carry_controls = json.loads(carry_controls_path.read_text()) if options.carry else None
    carry_source = ROOT / 'assets/source/q3/warrior-movement-se/warrior.blend'
    if options.carry:
        assert digest(carry_source) == movement['provenance']['rigSha256']
        bpy.ops.wm.open_mainfile(filepath=str(carry_source))
        carry_rig = bpy.data.objects['Warrior rig']
        for ordinal, approved in enumerate(movement['views']['se']['frames']):
            bpy.context.scene.frame_set(ordinal + 1)
            bpy.context.view_layer.update()
            matrices = {bone.name: bone.matrix.copy() for bone in carry_rig.pose.bones}
            for contact in approved['contacts']:
                expected = Vector(contact['sole']) + Vector((0, 0, .09))
                assert (carry_rig.pose.bones['foot' + contact['side']].head - expected).length < 1e-5
            carry.append((approved, matrices))
        assert len(carry) == 40
    prefix = json.loads((options.reuse_prefix / 'staff.json').read_text()) if options.reuse_prefix else None
    assert prefix is None or (options.death and not options.audit and not prefix['productionApproved'])
    death = []
    death_authoring = ROOT / 'assets/source/q3/warrior-death/render.py'
    death_manifest_path = ROOT / 'public/dev/warrior-death/warrior.json'
    if options.death:
        approved_death = json.loads(death_manifest_path.read_text())
        assert digest(death_authoring) == approved_death['provenance']['rendererSha256']
        # Observe after every approved pose and all its assertions. The original
        # authoring runs unchanged in audit mode; never duplicate its fall logic.
        class CacheDeath(ast.NodeTransformer):
            count = 0
            def visit_Expr(self, node):
                if (isinstance(node.value, ast.Call)
                    and isinstance(node.value.func, ast.Attribute)
                    and isinstance(node.value.func.value, ast.Name)
                    and node.value.func.value.id == 'records'
                    and node.value.func.attr == 'append'):
                    self.count += 1
                    return [node, ast.Expr(value=ast.Call(func=ast.Name(id='_cache_staff_death', ctx=ast.Load()), args=[], keywords=[]))]
                return self.generic_visit(node)
        observer = CacheDeath()
        tree = observer.visit(ast.parse(death_authoring.read_text()))
        assert observer.count == 1, 'Death authoring changed; inspect before adapting'
        ast.fix_missing_locations(tree)
        context = {'__file__': str(death_authoring), '__name__': '__staff_death_cache__'}
        def capture():
            generated = context['records'][-1]
            shipped = approved_death['views']['se']['frames'][len(death)]
            assert generated['index'] == shipped['index']
            assert generated['feet'] == shipped['feet']
            death.append((generated, {b.name: b.matrix.copy() for b in context['rig'].pose.bones}))
        context['_cache_staff_death'] = capture
        saved = sys.argv
        sys.argv = [str(death_authoring), '--', str(output / 'approved-body-cache'), 'se', '--audit']
        try:
            exec(compile(tree, str(death_authoring), 'exec'), context)
        finally:
            sys.argv = saved
        assert len(death) == 16
    manifest = json.loads((ROOT / 'public/dev/warrior-refined/warrior.json').read_text())
    source = ROOT / 'assets/source/q3/warrior-rig-v2/warrior.blend'
    assert digest(source) == manifest['provenance']['rigSha256']
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene, rig = bpy.context.scene, bpy.data.objects['Warrior rig']
    scene.frame_set(1)
    rig.animation_data_clear()
    assert len(rig.pose.bones) == 15
    neutral = {bone.name: bone.matrix.copy() for bone in rig.pose.bones}
    rest = {bone.name: (bone.head_local.copy(), bone.tail_local.copy()) for bone in rig.data.bones}
    lengths = {bone.name: bone.length for bone in rig.pose.bones}
    body = [obj for obj in scene.objects if obj.type == 'MESH']
    assert len(body) == 135
    base = {obj.name: obj.matrix_world.copy() for obj in body}
    swords = [obj for obj in body if obj.name in {
        'Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'}]
    assert len(swords) == 4
    for obj in swords:
        obj.hide_render = True
    # Reuse the approved analytical bone placement without executing its scene
    # construction/animation loop or changing the original authoring source.
    authoring = ROOT / 'assets/source/q3/warrior-death/render.py'
    approved_death = json.loads((ROOT / 'public/dev/warrior-death/warrior.json').read_text())
    assert digest(authoring) == approved_death['provenance']['rendererSha256']
    functions = [node for node in ast.parse(authoring.read_text()).body
                 if isinstance(node, ast.FunctionDef) and node.name == 'pose_bone']
    assert len(functions) == 1
    context = {'Matrix': Matrix, 'rest': rest, 'rig': rig}
    exec(compile(ast.Module(body=functions, type_ignores=[]), str(authoring), 'exec'), context)
    pose_bone = context['pose_bone']
    # A raised1.7m staff exceeds the death cell's top edge in NW. Increase only
    # transparent overscan to512; retain the exact256px source world scale.
    def project(point):
        p = world_to_camera_view(scene, scene.camera, point)
        return [p.x * scene.render.resolution_x / 2,
                (1 - p.y) * scene.render.resolution_y / 2]

    probes = [Vector(p) for p in [(0, 0, 0), (1, 0, 0), (0, 1, 1)]]
    before = [project(p) for p in probes]
    scene.render.resolution_x = scene.render.resolution_y = 1024
    camera = scene.camera.data
    camera.ortho_scale *= 512 / 256
    camera.shift_x *= 256 / 512
    camera.shift_y *= 256 / 512
    for point, old in zip(probes, before):
        assert max(abs(a - b - 128) for a, b in zip(project(point), old)) < .001

    def material(name, color, metal=0, rough=.6):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*color, 1)
        shader.inputs['Metallic'].default_value = metal
        shader.inputs['Roughness'].default_value = rough
        return mat

    wood = material('Original cinder-staff dark wood pilot', (.065, .034, .018), rough=.7)
    bronze = material('Original cinder-staff bronze pilot', (.23, .16, .075), .72, .42)
    ember = material('Original cinder-staff amber stone pilot', (.38, .105, .019), .15, .48)
    staff = []

    def cylinder(name, radius, depth, z, mat, vertices=16):
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth,
                                            location=(0, 0, z))
        obj = bpy.context.object
        obj.name = name
        obj.data.materials.append(mat)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        staff.append(obj)

    # Entirely original primitive geometry:1.70m shaft,2cm radius. Grip center
    # is localZ0; second hand is0.24m toward the ornamented tip. No new effect.
    geometry = motion['geometry'] if motion else {
        'shaftLength': 1.70, 'shaftCenter': .60, 'tailFerrule': -.20,
        'headFerrule': 1.35, 'cap': 1.45, 'tip': 1.5}
    cylinder('Original staff shaft', .020, geometry['shaftLength'], geometry['shaftCenter'], wood)
    cylinder('Original staff tail ferrule', .024, .10, geometry['tailFerrule'], bronze)
    cylinder('Original staff head ferrule', .029, .12, geometry['headFerrule'], bronze)
    cylinder('Original staff amber cap', .042, .10, geometry['cap'], ember, 8)

    def joint(shoulder, wrist, upper, lower, side, staff_height):
        delta = wrist - shoulder
        distance = delta.length
        assert abs(upper - lower) + 1e-5 < distance < upper + lower - 1e-5, (side, distance, upper + lower)
        direction = delta.normalized()
        along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
        if options.motion:
            # One elbow pole throughout the attack; no branch at a shaft angle
            # that could abruptly flip the analytic IK between two solutions.
            pole_z = -.6 if side == 'L' else .8
        else:
            pole_z = -.6 if side == 'L' and staff_height > .6 else .8
        pole = Vector((-.5 if side == 'L' else .5, .1, pole_z))
        perpendicular = (pole - direction * pole.dot(direction)).normalized()
        return shoulder + direction * along + perpendicular * math.sqrt(upper * upper - along * along)

    poses = [
        ('guard', (.13, -.35, 1.08), (-.50, -.15, .85), .12, .10),
        ('anticipation', (.12, -.35, 1.06), (-.55, -.08, .83), .08, .08),
        ('active', (.13, -.43, 1.12), (-.50, -.70, .50), .35, .25),
        ('recovery', (.13, -.36, 1.09), (-.50, -.30, .81), .15, .10),
    ]
    if motion:
        count = 16 if options.death else 6 if options.reaction else 12
        assert motion['poseCount'] == count
        assert options.death or motion['impactPose'] == (0 if options.reaction else 5)
        if options.death:
            assert 0 <= motion['releasePose'] < 13 and motion['armSettleFrames'] > 0
            assert [k['pose'] for k in motion['releasedStaff']] == list(range(motion['releasePose'] + 1, 16))
        keys = motion['keys']
        assert keys[0]['pose'] == 0 and keys[-1]['pose'] == count - 1
        assert all(a['pose'] < b['pose'] for a, b in zip(keys, keys[1:]))

        def controls(index):
            for a, b in zip(keys, keys[1:]):
                if a['pose'] <= index <= b['pose']:
                    t = (index - a['pose']) / (b['pose'] - a['pose'])
                    t = t * t * (3 - 2 * t)
                    blend = lambda x, y: x + (y - x) * t
                    return (f'{action}-{index:06.3f}',
                            [blend(x, y) for x, y in zip(a['palm'], b['palm'])],
                            [blend(x, y) for x, y in zip(a['axis'], b['axis'])],
                            blend(a['lean'], b['lean']), blend(a['yaw'], b['yaw']),
                            blend(a.get('referenceLean',a['lean']),b.get('referenceLean',b['lean'])),
                            blend(a.get('referenceYaw',a['yaw']),b.get('referenceYaw',b['yaw'])))
            raise AssertionError(index)
        poses = [controls(index / options.subframes)
                 for index in range((count - 1) * options.subframes + 1)]
        if options.carry:
            poses = [(f"{approved['action']}-{approved['index']:02}",
                      keys[0]['palm'], keys[0]['axis'], keys[0]['lean'], keys[0]['yaw'])
                     for approved, _ in carry]
    records = []
    directions = ([(name, movement['views'][name]['rotationDegrees'])
                   for name in options.directions or ['se']] if motion
                  else [('se', 0), ('w', 225), ('nw', 180)])
    for facing, angle in directions:
        rotation = Matrix.Rotation(math.radians(angle), 4, 'Z')
        rig.matrix_world = rotation
        for obj in body:
            obj.matrix_world = rotation @ base[obj.name]
        for ordinal, pose in enumerate(poses):
            phase, position, shaft, lean, yaw = pose[:5]
            axis, palm_r = Vector(shaft).normalized(), Vector(position)
            anchor = Vector(rest['torso'][0])
            torso = (Matrix.Translation(anchor) @ Matrix.Rotation(yaw, 4, 'Z')
                     @ Matrix.Rotation(lean, 4, 'X') @ Matrix.Translation(-anchor))
            if motion and motion.get('followTorso') and (pose[5] != lean or pose[6] != yaw):
                reference_lean, reference_yaw = pose[5:]
                reference = (Matrix.Translation(anchor) @ Matrix.Rotation(reference_yaw, 4, 'Z')
                             @ Matrix.Rotation(reference_lean, 4, 'X') @ Matrix.Translation(-anchor))
                operator = torso @ reference.inverted()
                palm_r = operator @ palm_r
                axis = (operator.to_3x3() @ axis).normalized()
            for name, matrix in neutral.items():
                rig.pose.bones[name].matrix = matrix
            expected_feet = {side: Vector(rest['foot' + side][0]) for side in ['L', 'R']}
            lower_error = 0
            if options.carry:
                approved, original = carry[ordinal]
                # Reuse the exact approved lower-body matrices, not another gait
                # or wall-clock animation. Upper-body guard follows its torso.
                operator = original['torso'] @ neutral['torso'].inverted()
                torso = operator @ torso
                palm_r = operator @ (palm_r + Vector(carry_controls['palmOffsets'][approved['action']]))
                axis = (operator.to_3x3() @ axis).normalized()
                for name in ['root', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR']:
                    rig.pose.bones[name].matrix = original[name]
                expected_feet = {c['side']: Vector(c['sole']) + Vector((0, 0, .09))
                                 for c in approved['contacts']}
            if options.death:
                approved, original = death[ordinal]
                operator = Matrix.Identity(4) if ordinal == 0 else original['torso'] @ neutral['torso'].inverted()
                torso = operator @ torso
                # Controls are in the original body frame. Torso-following
                # placement preserves the two-hand hold through the collapse.
                if ordinal != 0:
                    palm_r = operator @ palm_r
                    axis = (operator.to_3x3() @ axis).normalized()
                for name, matrix in original.items():
                    rig.pose.bones[name].matrix = matrix
                expected_feet = {side: original['foot' + side].translation for side in ['L', 'R']}
            for name in ['torso', 'head']:
                rig.pose.bones[name].matrix = torso @ neutral[name]
            across = ((operator.to_3x3() @ Vector((0, 0, 1)).cross(Vector(shaft).normalized())).normalized()
                      if options.death else Vector((0, 0, 1)).cross(axis).normalized())
            up = axis.cross(across).normalized()
            # A staff crosses the palm perpendicular to the wrist. The sword's
            # down-axis attachment made a longer shaft penetrate both forearms.
            hand_rotation = Matrix((axis, across, up)).transposed().to_4x4()
            contact_errors, held_hands = [], {}
            for side, palm in [('R', palm_r), ('L', palm_r + axis * .24)]:
                rest_palm = Vector(rest['hand' + side][0]) + Vector((0, -.060, -.080))
                # Opposing overhand/underhand grips keep the left wrist on its
                # own side of the shaft rather than crossing it with the cuff.
                grip_rotation = hand_rotation @ Matrix.Rotation(math.pi if side == 'L' else 0, 4, 'X')
                hand = Matrix.Translation(palm) @ grip_rotation @ Matrix.Translation(-rest_palm) @ rig.data.bones['hand' + side].matrix_local
                held_hands[side] = hand.copy()
                wrist = hand.translation
                shoulder = torso @ Vector(rest['upper' + side][0])
                if options.death:
                    inverse = operator.inverted()
                    elbow = operator @ joint(inverse @ shoulder, inverse @ wrist, lengths['upper' + side], lengths['fore' + side], side, Vector(shaft).normalized().z)
                else:
                    elbow = joint(shoulder, wrist, lengths['upper' + side], lengths['fore' + side], side, axis.z)
                rig.pose.bones['upper' + side].matrix = pose_bone('upper' + side, shoulder, elbow)
                rig.pose.bones['fore' + side].matrix = pose_bone('fore' + side, elbow, wrist)
                rig.pose.bones['hand' + side].matrix = hand
                actual_palm = hand @ rig.data.bones['hand' + side].matrix_local.inverted() @ rest_palm
                contact_errors.append((actual_palm - palm).length)
            released = options.death and ordinal > motion['releasePose']
            if released:
                t = min(1, (ordinal - motion['releasePose']) / motion['armSettleFrames'])
                t = t * t * (3 - 2 * t)
                for side in ['L', 'R']:
                    hand = held_hands[side]
                    target = original['hand' + side]
                    if t == 1:
                        for name in ['upper', 'fore', 'hand']:
                            rig.pose.bones[name + side].matrix = original[name + side]
                    else:
                        wrist = hand.translation.lerp(target.translation, t)
                        q = hand.to_quaternion().slerp(target.to_quaternion(), t)
                        blended = q.to_matrix().to_4x4()
                        blended.translation = wrist
                        shoulder = torso @ Vector(rest['upper' + side][0])
                        elbow = operator @ joint(operator.inverted() @ shoulder, operator.inverted() @ wrist, lengths['upper' + side], lengths['fore' + side], side, Vector(shaft).normalized().z)
                        rig.pose.bones['upper' + side].matrix = pose_bone('upper' + side, shoulder, elbow)
                        rig.pose.bones['fore' + side].matrix = pose_bone('fore' + side, elbow, wrist)
                        rig.pose.bones['hand' + side].matrix = blended
                flight = next(k for k in motion['releasedStaff'] if k['pose'] == ordinal)
                palm_r, axis = Vector(flight['palm']), Vector(flight['axis']).normalized()
            transform = rotation @ Matrix.Translation(palm_r) @ Vector((0, 0, 1)).rotation_difference(axis).to_matrix().to_4x4()
            for obj in staff:
                obj.matrix_world = transform
            bpy.context.view_layer.update()
            floor_correction = 0
            if released and ordinal >= 13:
                # Resolve only sub-micron rotated-mesh roundoff at the support
                # plane. Preserve the accepted SE transform when already clear.
                floor = min((obj.matrix_world @ v.co).z for obj in staff for v in obj.data.vertices)
                if floor < 0:
                    assert floor > -1e-6
                    floor_correction = -floor + 5e-7
                    for obj in staff:
                        obj.matrix_world.translation.z += floor_correction
                    bpy.context.view_layer.update()
            if not released:
                contact_errors = []
                for side, palm in [('R', palm_r), ('L', palm_r + axis * .24)]:
                    rest_palm = Vector(rest['hand' + side][0]) + Vector((0, -.060, -.080))
                    actual = rig.pose.bones['hand' + side].matrix @ rig.data.bones['hand' + side].matrix_local.inverted() @ rest_palm
                    contact_errors.append((actual - palm).length)
                assert max(contact_errors) < 1e-6
            else:
                contact_errors = []
            for bone in rig.pose.bones:
                assert abs(bone.length - lengths[bone.name]) < 1e-5
            for side in ['L', 'R']:
                for parent, child in [('upper', 'fore'), ('fore', 'hand')]:
                    assert (rig.pose.bones[parent + side].tail - rig.pose.bones[child + side].head).length < 1e-5
                assert (rig.pose.bones['foot' + side].head - expected_feet[side]).length < 1e-5
            if options.carry or options.death:
                lower_error = max(abs(a - b) for name in ['root', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR']
                                  for actual, expected in zip(rig.pose.bones[name].matrix, original[name])
                                  for a, b in zip(actual, expected))
                assert lower_error < 1e-5
            if options.carry:
                facing_contacts = movement['views'][facing]['frames'][ordinal]['contacts']
                foot_world_error = max((rig.matrix_world @ rig.pose.bones['foot' + c['side']].head
                                        - Vector(c['sole']) - Vector((0, 0, .09))).length
                                       for c in facing_contacts)
                assert foot_world_error < 1e-5
            assert max(abs(a - b) for a, b in zip(project(Vector((0, 0, 0))), [256, 338])) < .001
            graph = bpy.context.evaluated_depsgraph_get()
            staff_trees, bounds, minimum = [], [], math.inf
            for obj in staff:
                evaluated = obj.evaluated_get(graph)
                mesh = evaluated.to_mesh()
                points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
                staff_trees.append(BVHTree.FromPolygons(points, [tuple(p.vertices) for p in mesh.polygons]))
                bounds.extend(project(point) for point in points)
                minimum = min(minimum, min(point.z for point in points))
                evaluated.to_mesh_clear()
            intersections = []
            body_minimum = math.inf
            for obj in body:
                if obj in swords or (not released and obj.name.startswith(('Gauntlet ', 'Finger plate '))):
                    continue  # Intended closed-palm contact only; do not hide arm intersections.
                evaluated = obj.evaluated_get(graph)
                mesh = evaluated.to_mesh()
                points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
                body_minimum = min(body_minimum, min(point.z for point in points))
                tree = BVHTree.FromPolygons(points, [tuple(p.vertices) for p in mesh.polygons])
                if any(tree.overlap(other) for other in staff_trees):
                    intersections.append(obj.name)
                evaluated.to_mesh_clear()
            record = {'name': f'staff-{facing}-{phase}', 'phase': phase, 'direction': facing,
                      'root': [256, 338], 'renderSize': 1024, 'cell': 512,
                      'contactErrors': contact_errors,
                      'staffBodyIntersections': intersections, 'staffGroundMinimum': minimum,
                      'staffBounds': [min(p[0] for p in bounds), min(p[1] for p in bounds),
                                      max(p[0] for p in bounds), max(p[1] for p in bounds)],
                      'productionApproved': False}
            if options.carry:
                record.update(action=approved['action'], index=approved['index'], ordinal=ordinal,
                              lowerBodyMatrixMaximumError=lower_error, footWorldMaximumError=foot_world_error,
                              contacts=facing_contacts,
                              palmR=list(palm_r), axis=list(axis))
            elif motion:
                index = float(phase.removeprefix(action + '-'))
                tip = palm_r + axis * geometry['tip']
                record.update(action=action, index=index,
                              phase=('collapse' if index < 13 else 'terminal') if options.death else ('hit' if index < 5 else 'recovery') if options.reaction else ('windup' if index < 5 else 'active' if index == 5 else 'recovery'),
                              palmR=list(palm_r), axis=list(axis), tip=list(tip),
                              wrists={side: list(rig.pose.bones['hand' + side].head) for side in ['L', 'R']},
                              elbows={side: list(rig.pose.bones['fore' + side].head) for side in ['L', 'R']})
            if options.death:
                record.update(lowerBodyMatrixMaximumError=lower_error, bodyGroundMinimum=body_minimum,
                              staffFloorRoundoffCorrection=floor_correction,
                              staffReleased=released, gripRequired=not released,
                              approvedBodyPose=approved['name'],
                              bodyTorsoMatrix=[list(row) for row in original['torso']])
            records.append(record)
            if not options.audit:
                destination = output / (record['name'] + '.png')
                if guard_source and index in ([0] if options.death else [0, 5] if action == 'hit-extended' else [5] if options.reaction else [0, 11]):
                    assert guard_source['rigSha256'] == digest(source)
                    assert guard_source['ikAuthoringSha256'] == digest(authoring)
                    source_index = 5 if action == 'hit-extended' and index == 0 else 0
                    candidates = [s for s in guard_source['samples'] if s['direction'] == facing and s['index'] == source_index]
                    assert len(candidates) == 1
                    original = candidates[0]
                    assert original['palmR'] == record['palmR'] and original['axis'] == record['axis']
                    assert original['root'] == record['root'] and original['staffBounds'] == record['staffBounds']
                    assert original['wrists'] == record['wrists'] and original['elbows'] == record['elbows']
                    image = options.reuse_guards / (original['name'] + '.png')
                    assert digest(image) == original['pngSha256']
                    shutil.copyfile(image, destination)
                    record['reusedPrimaryGuard'] = {'proofSha256': hashlib.sha256(guard_bytes).hexdigest(),
                                                  'name': original['name'], 'pngSha256': original['pngSha256']}
                elif prefix is not None and ordinal <= motion['releasePose']:
                    previous = prefix['samples'][ordinal]
                    assert all(previous[k] == record[k] for k in ['name', 'root', 'palmR', 'axis', 'wrists', 'elbows', 'staffBounds', 'bodyTorsoMatrix', 'bodyGroundMinimum'])
                    image = options.reuse_prefix / (previous['name'] + '.png')
                    assert digest(image) == previous['pngSha256']
                    shutil.copyfile(image, destination)
                    record['reusedDeathPrefix'] = {'proofSha256': digest(options.reuse_prefix / 'staff.json'), 'name': previous['name'], 'pngSha256': previous['pngSha256']}
                elif options.death and ordinal >= 14:
                    original = records[-2]
                    assert original['direction'] == facing
                    assert all(record[k] == original[k] for k in ['palmR', 'axis', 'wrists', 'elbows', 'bodyTorsoMatrix'])
                    shutil.copyfile(output / (original['name'] + '.png'), destination)
                    record['reusedTerminal'] = original['name']
                else:
                    scene.render.filepath = str(destination)
                    bpy.ops.render.render(write_still=True)
                record['pngSha256'] = digest(output / (record['name'] + '.png'))
            print('STAFF_PILOT', record['name'], intersections, minimum, flush=True)
    (output / 'staff.json').write_text(json.dumps({
        'version': 1, 'producerSha256': digest(__file__), 'rigSha256': digest(source),
        'ikAuthoringSha256': digest(authoring), 'blender': bpy.app.version_string,
        'provenance': 'Original primitive wood/bronze/amber staff; existing approved Warrior rig and materials',
        'productionApproved': False, 'genuineMotionQualityAccepted': False,
        'motionSha256': digest(motion_path) if motion else None,
        'clipAction': action, 'poseCount': motion['poseCount'] if motion else None,
        'deathAuthoringSha256': digest(death_authoring) if options.death else None,
        'deathManifestSha256': digest(death_manifest_path) if options.death else None,
        'carrySourceSha256': digest(carry_source) if options.carry else None,
        'carryControlsSha256': digest(carry_controls_path) if options.carry else None,
        'movementManifestSha256': digest(movement_path),
        'subframes': options.subframes,
        'samples': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
