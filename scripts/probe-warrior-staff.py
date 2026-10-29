"""Bounded original two-hand cinder-staff pilot, never production compatibility.

Blender --background --python-exit-code 1 --python scripts/probe-warrior-staff.py
  -- /private/tmp/warrior-staff-proof [--audit]

Twelve diagnostic poses only: SE/W/NW guard, anticipation, jab and recovery.
Uses the approved rig/materials/camera and hash-verified two-bone IK authoring.
No blend/public writes, gameplay callbacks, mechanics or save changes.
"""
import argparse
import ast
import hashlib
import json
import math
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
    options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    output = options.output.resolve()
    assert not output.is_relative_to(ROOT)
    output.mkdir(parents=True, exist_ok=True)
    assert bpy.app.version_string == '4.5.3 LTS'
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
    cylinder('Original staff shaft', .020, 1.70, .60, wood)
    cylinder('Original staff tail ferrule', .024, .10, -.20, bronze)
    cylinder('Original staff head ferrule', .029, .12, 1.35, bronze)
    cylinder('Original staff amber cap', .042, .10, 1.45, ember, 8)

    def joint(shoulder, wrist, upper, lower, side, high_staff):
        delta = wrist - shoulder
        distance = delta.length
        assert abs(upper - lower) + 1e-5 < distance < upper + lower - 1e-5, (side, distance, upper + lower)
        direction = delta.normalized()
        along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
        pole = Vector((-.5 if side == 'L' else .5, .1,
                       -.6 if side == 'L' and high_staff else .8))
        perpendicular = (pole - direction * pole.dot(direction)).normalized()
        return shoulder + direction * along + perpendicular * math.sqrt(upper * upper - along * along)

    poses = [
        ('guard', (.13, -.35, 1.08), (-.50, -.15, .85), .12, .10),
        ('anticipation', (.12, -.35, 1.06), (-.55, -.08, .83), .08, .08),
        ('active', (.13, -.43, 1.12), (-.50, -.70, .50), .35, .25),
        ('recovery', (.13, -.36, 1.09), (-.50, -.30, .81), .15, .10),
    ]
    records = []
    for facing, angle in [('se', 0), ('w', 225), ('nw', 180)]:
        rotation = Matrix.Rotation(math.radians(angle), 4, 'Z')
        rig.matrix_world = rotation
        for obj in body:
            obj.matrix_world = rotation @ base[obj.name]
        for phase, position, shaft, lean, yaw in poses:
            axis, palm_r = Vector(shaft).normalized(), Vector(position)
            anchor = Vector(rest['torso'][0])
            torso = (Matrix.Translation(anchor) @ Matrix.Rotation(yaw, 4, 'Z')
                     @ Matrix.Rotation(lean, 4, 'X') @ Matrix.Translation(-anchor))
            for name, matrix in neutral.items():
                rig.pose.bones[name].matrix = matrix
            for name in ['torso', 'head']:
                rig.pose.bones[name].matrix = torso @ neutral[name]
            across = Vector((0, 0, 1)).cross(axis).normalized()
            up = axis.cross(across).normalized()
            # A staff crosses the palm perpendicular to the wrist. The sword's
            # down-axis attachment made a longer shaft penetrate both forearms.
            hand_rotation = Matrix((axis, across, up)).transposed().to_4x4()
            contact_errors = []
            for side, palm in [('R', palm_r), ('L', palm_r + axis * .24)]:
                rest_palm = Vector(rest['hand' + side][0]) + Vector((0, -.060, -.080))
                # Opposing overhand/underhand grips keep the left wrist on its
                # own side of the shaft rather than crossing it with the cuff.
                grip_rotation = hand_rotation @ Matrix.Rotation(math.pi if side == 'L' else 0, 4, 'X')
                hand = Matrix.Translation(palm) @ grip_rotation @ Matrix.Translation(-rest_palm) @ rig.data.bones['hand' + side].matrix_local
                wrist = hand.translation
                shoulder = torso @ Vector(rest['upper' + side][0])
                elbow = joint(shoulder, wrist, lengths['upper' + side], lengths['fore' + side], side, axis.z > .6)
                rig.pose.bones['upper' + side].matrix = pose_bone('upper' + side, shoulder, elbow)
                rig.pose.bones['fore' + side].matrix = pose_bone('fore' + side, elbow, wrist)
                rig.pose.bones['hand' + side].matrix = hand
                actual_palm = hand @ rig.data.bones['hand' + side].matrix_local.inverted() @ rest_palm
                contact_errors.append((actual_palm - palm).length)
            transform = rotation @ Matrix.Translation(palm_r) @ Vector((0, 0, 1)).rotation_difference(axis).to_matrix().to_4x4()
            for obj in staff:
                obj.matrix_world = transform
            bpy.context.view_layer.update()
            assert max(contact_errors) < 1e-6
            for bone in rig.pose.bones:
                assert abs(bone.length - lengths[bone.name]) < 1e-5
            for side in ['L', 'R']:
                for parent, child in [('upper', 'fore'), ('fore', 'hand')]:
                    assert (rig.pose.bones[parent + side].tail - rig.pose.bones[child + side].head).length < 1e-5
                assert (rig.pose.bones['foot' + side].head - Vector(rest['foot' + side][0])).length < 1e-5
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
            for obj in body:
                if obj in swords or obj.name.startswith(('Gauntlet ', 'Finger plate ')):
                    continue  # Intended closed-palm contact only; do not hide arm intersections.
                evaluated = obj.evaluated_get(graph)
                mesh = evaluated.to_mesh()
                tree = BVHTree.FromPolygons([evaluated.matrix_world @ vertex.co for vertex in mesh.vertices],
                                           [tuple(p.vertices) for p in mesh.polygons])
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
            records.append(record)
            if not options.audit:
                scene.render.filepath = str(output / (record['name'] + '.png'))
                bpy.ops.render.render(write_still=True)
                record['pngSha256'] = digest(output / (record['name'] + '.png'))
            print('STAFF_PILOT', record['name'], intersections, minimum, flush=True)
    (output / 'staff.json').write_text(json.dumps({
        'version': 1, 'producerSha256': digest(__file__), 'rigSha256': digest(source),
        'ikAuthoringSha256': digest(authoring), 'blender': bpy.app.version_string,
        'provenance': 'Original primitive wood/bronze/amber staff; existing approved Warrior rig and materials',
        'productionApproved': False, 'genuineMotionQualityAccepted': False,
        'samples': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
