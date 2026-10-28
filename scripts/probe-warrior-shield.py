"""Offline original bark-guard grip/occlusion proof; never changes runtime assets.

Blender --background --python-exit-code 1 --python scripts/probe-warrior-shield.py
  -- /private/tmp/shield-proof [--render idle-se-00 ...] [--death-roll]

Reuses the 512-pose exporter and the exact approved procedural authoring code.
AST instrumentation adds one observation AFTER records.append, without changing
pose calculations, geometry, cameras, assertions or approved source files.
Outputs diagnostic metadata and optional equipment-only body-holdout renders.
--death-arm tests a targeted left-arm landing variant; --death-roll adds its
physically attached handle turn. --render se-all emits complete SE motion.
--sweep with --only-death checks 73 handle angles per SE death pose.
These are unapproved developer assets, not a production compatibility claim.
"""
import argparse
import ast
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
parser.add_argument('--render', nargs='*', default=[])
parser.add_argument('--bare', nargs='*', default=[])
parser.add_argument('--reference', nargs='*', default=[])
parser.add_argument('--death-roll', action='store_true')
parser.add_argument('--only-death', action='store_true')
parser.add_argument('--death-arm', action='store_true')
parser.add_argument('--sweep', action='store_true')
parser.add_argument('--half-width', type=float, default=.22)
OPTIONS = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
OUT = OPTIONS.output
RENDER = set(OPTIONS.render)
ROLL = OPTIONS.death_roll
ONLY_DEATH = OPTIONS.only_death
DEATH_ARM = OPTIONS.death_arm
SWEEP = OPTIONS.sweep
HALF_WIDTH = OPTIONS.half_width
assert .14 <= HALF_WIDTH <= .22
OUT.mkdir(parents=True, exist_ok=True)
poses = []
state = None


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def rounded(values):
    return [round(float(v), 6) for v in values]


def material(name, color, metal=0, rough=.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = rough
    return mat


def shield_mesh(rig):
    """Original small center-grip shield, no external model/texture/reference.

    Default dimensions: 0.44m wide, 0.64m tall, 0.035m thick. Vertical handle
    passes through the mitten palm 0.045m beyond the wrist, leaving the
    plate 0.14m outside the hand. No arbitrary screen-space offsets.
    """
    hand = rig.data.bones['handL'].matrix_local
    wrist = rig.data.bones['handL'].head_local
    grip = wrist + Vector((0, 0, -.045))
    normal = Vector((-.94, -.342, 0)).normalized()
    across = Vector((normal.y, -normal.x, 0))
    up = Vector((0, 0, 1))
    center = grip + normal * .14
    wood = material('Bark-guard original stained wood', (.105, .055, .024))
    rim = material('Bark-guard dark iron rim', (.12, .14, .15), .7, .48)
    bronze = material('Bark-guard worn bronze boss', (.26, .17, .065), .7, .45)
    leather = material('Bark-guard leather center grip', (.028, .018, .012))
    vertices, faces, materials = [], [], []

    def point(u, v, depth):
        return center + across * u + up * v + normal * depth

    def solid(ring, back, front, mat):
        start = len(vertices)
        vertices.extend(point(u, v, depth) for depth in (back, front) for u, v in ring)
        n = len(ring)
        faces.extend([tuple(start + i for i in reversed(range(n))),
                      tuple(start + n + i for i in range(n))])
        materials.extend([mat, mat])
        for i in range(n):
            j = (i + 1) % n
            faces.append((start + i, start + j, start + n + j, start + n + i))
            materials.append(mat)

    outline = [(math.cos(i * math.tau / 32) * HALF_WIDTH,
                math.sin(i * math.tau / 32) * .32) for i in range(32)]
    solid(outline, -.0175, .0175, 0)
    # Closed metal rim strips. Five raised stave seams read at gameplay scale.
    for i, (u, v) in enumerate(outline):
        u2, v2 = outline[(i + 1) % len(outline)]
        solid([(u, v), (u2, v2), (u2 * .92, v2 * .94), (u * .92, v * .94)],
              -.02, .023, 1)
    for u in (-.13, -.065, 0, .065, .13):
        half = .30 * math.sqrt(1 - (u / HALF_WIDTH) ** 2)
        solid([(u - .003, -half), (u + .003, -half),
               (u + .003, half), (u - .003, half)], .0175, .0195, 1)
    solid([(math.cos(i * math.tau / 16) * .062,
            math.sin(i * math.tau / 16) * .062) for i in range(16)], .018, .055, 2)
    # Handle is modeled at the physical palm. It is excluded from plate/body
    # penetration diagnostics because contact with the gripping hand is intended.
    plate_count = len(vertices)
    solid([(-.018, -.075), (.018, -.075), (.018, .075), (-.018, .075)], -.15, -.13, 3)
    data = bpy.data.meshes.new('Original bark-guard probe geometry')
    # Store in wrist-local space; matrix_world is the evaluated wrist each pose.
    inverse = hand.inverted()
    data.from_pydata([inverse @ v for v in vertices], [], faces)
    data.update()
    obj = bpy.data.objects.new('Original bark-guard probe', data)
    bpy.context.scene.collection.objects.link(obj)
    for mat in (wood, rim, bronze, leather):
        data.materials.append(mat)
    for poly, mat in zip(data.polygons, materials):
        poly.material_index = mat
    return obj, inverse @ grip, plate_count


def observe(group, direction, ordinal, approved, scene, rig):
    global state
    if state is None or not rig.get('_shield_probe_initialized', False):
        body = [o for o in scene.objects if o.type == 'MESH']
        assert len(body) == 135
        shield, grip, count = shield_mesh(rig)
        state = (shield, grip, count, body, {o.name: o.matrix_world.copy() for o in body})
        rig['_shield_probe_initialized'] = True
    shield, local_grip, plate_count, body, body_base = state
    if group in ('movement', 'attacks'):
        # The metadata-only exporter rotates wrists, but does not need mesh
        # transforms. A visual/depth probe must also rotate the original meshes,
        # exactly as the approved directional renderers do.
        rotation = Matrix.Rotation(math.radians(exporter.ANGLES[direction]), 4, 'Z')
        for obj in body:
            obj.matrix_world = rotation @ body_base[obj.name]
    wrist = rig.matrix_world @ rig.pose.bones['handL'].matrix
    roll = 0
    if ROLL and group == 'death':
        # A center grip can swivel about its vertical handle on landing.
        # The pose is still diagnostic until hand/floor/transition review passes.
        t = max(0, min(1, (ordinal - 7) / 4))
        # Bounded 5-degree handle sweep found -20deg clears floor and body
        # at every settled pose of the targeted left-arm landing variant.
        roll = math.radians(-20) * t * t * (3 - 2 * t)
    swivel = (Matrix.Translation(local_grip) @ Matrix.Rotation(roll, 4, 'Y')
              @ Matrix.Translation(-local_grip))
    shield.matrix_world = wrist @ swivel
    bpy.context.view_layer.update()
    grip = wrist @ local_grip
    assert (shield.matrix_world @ local_grip - grip).length < 1e-6
    def project(point):
        p = world_to_camera_view(scene, scene.camera, point)
        return rounded((p.x * scene.render.resolution_x / 2,
                        (1 - p.y) * scene.render.resolution_y / 2, p.z))
    vertices = [shield.matrix_world @ v.co for v in shield.data.vertices]
    plate = vertices[:plate_count]
    plate_faces = [tuple(p.vertices) for p in shield.data.polygons
                   if all(i < plate_count for i in p.vertices)]
    shield_tree = BVHTree.FromPolygons(plate, plate_faces)
    graph = bpy.context.evaluated_depsgraph_get()
    low = Vector(tuple(min(v[i] for v in plate) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in plate) for i in range(3)))
    intersections = []
    body_trees = []
    arm_ground = math.inf
    for obj in body:
        evaluated = obj.evaluated_get(graph)
        bounds = [evaluated.matrix_world @ Vector(v) for v in evaluated.bound_box]
        modified_arm = DEATH_ARM and group == 'death' and ordinal >= 8 and any(
            obj.vertex_groups.get(name) is not None for name in ('upperL', 'foreL', 'handL'))
        if not SWEEP and not modified_arm and any(
            max(v[i] for v in bounds) < low[i] or min(v[i] for v in bounds) > high[i]
            for i in range(3)):
            continue
        mesh = evaluated.to_mesh()
        points_world = [evaluated.matrix_world @ v.co for v in mesh.vertices]
        if modified_arm:
            arm_ground = min(arm_ground, min(v.z for v in points_world))
        tree = BVHTree.FromPolygons(points_world,
                                   [tuple(p.vertices) for p in mesh.polygons])
        if shield_tree.overlap(tree):
            intersections.append(obj.name)
        body_trees.append(tree)
        evaluated.to_mesh_clear()
    feasible = []
    if SWEEP and group == 'death':
        for degrees in range(-180, 181, 5):
            matrix = (wrist @ Matrix.Translation(local_grip)
                      @ Matrix.Rotation(math.radians(degrees), 4, 'Y')
                      @ Matrix.Translation(-local_grip))
            trial = [matrix @ v.co for v in list(shield.data.vertices)[:plate_count]]
            if min(v.z for v in trial) < -.001:
                continue
            tree = BVHTree.FromPolygons(trial, plate_faces)
            if not any(tree.overlap(body_tree) for body_tree in body_trees):
                feasible.append(degrees)
    action, index = approved['action'], approved['index']
    name = f'{action}-{direction}-{index:02}'
    alias = None
    if ((group in ('attacks', 'abilities') and index in (0, 11))
        or (group == 'hit' and index == 5) or (group == 'death' and index == 0)):
        alias = f'idle-{direction}-00'
    elif group == 'death' and index in (14, 15):
        alias = f'death-{direction}-13'
    requested = name in RENDER or 'all' in RENDER or direction + '-all' in RENDER
    root = project(Vector((0, 0, 0)))
    assert max(abs(a - b) for a, b in zip(root, approved['root'])) < .001
    for bone in rig.pose.bones:
        assert abs(bone.length - approved['boneLengths'][bone.name]) < 1e-5
    points = [project(v) for v in plate]
    poses.append({'name': name, 'set': group, 'direction': direction,
                  'ordinal': ordinal, 'action': action, 'index': index,
                  'rasterAlias': alias, 'renderRequested': requested,
                  'root': root, 'grip': project(grip),
                  'matrixWorld': [rounded(row) for row in shield.matrix_world],
                  'swivelRadians': round(roll, 6),
                  'feasibleSwivelsDegrees': feasible if SWEEP else None,
                  'shieldBounds': [min(p[0] for p in points), min(p[1] for p in points),
                                   max(p[0] for p in points), max(p[1] for p in points)],
                  'plateGroundMinimum': round(min(v.z for v in plate), 6),
                  'leftArm': {name: rounded(rig.pose.bones[name + 'L'].head)
                              for name in ('upper', 'fore', 'hand')},
                  'bodyOverride': DEATH_ARM and group == 'death' and ordinal >= 8,
                  'modifiedArmGroundMinimum': round(arm_ground, 6) if math.isfinite(arm_ground) else None,
                  'plateBodyIntersections': intersections})
    if requested and alias is None:
        if DEATH_ARM and group == 'death' and ordinal >= 8:
            shield.hide_render = True
            scene.render.filepath = str(OUT / (name + '-body.png'))
            bpy.ops.render.render(write_still=True)
            shield.hide_render = False
        # Holdouts retain exact body geometry/depth, with no body PNG duplication.
        holdout = bpy.data.materials.new('Probe body camera holdout')
        holdout.use_nodes = True
        nodes = holdout.node_tree.nodes
        nodes.clear()
        node = nodes.new('ShaderNodeHoldout')
        output = nodes.new('ShaderNodeOutputMaterial')
        holdout.node_tree.links.new(node.outputs[0], output.inputs['Surface'])
        originals = [(o, list(o.data.materials)) for o in body]
        for obj, mats in originals:
            for i in range(len(mats)):
                obj.data.materials[i] = holdout
        scene.render.filepath = str(OUT / (name + '-overlay.png'))
        bpy.ops.render.render(write_still=True)
        for obj, mats in originals:
            for i, mat in enumerate(mats):
                obj.data.materials[i] = mat
        bpy.data.materials.remove(holdout)
        if name in OPTIONS.bare:
            visibility = [(o, o.hide_render) for o in body]
            for obj, _hidden in visibility:
                obj.hide_render = True
            scene.render.filepath = str(OUT / (name + '-bare.png'))
            bpy.ops.render.render(write_still=True)
            for obj, hidden in visibility:
                obj.hide_render = hidden
        if name in OPTIONS.reference:
            scene.render.filepath = str(OUT / (name + '-reference.png'))
            bpy.ops.render.render(write_still=True)
        print('SHIELD_RENDER', name, flush=True)


def procedural(group, folder, public_folder):
    global state
    state = None
    path = ROOT / 'assets/source/q3' / folder / 'render.py'
    manifest = json.loads((ROOT / 'public/dev' / public_folder / 'warrior.json').read_text())
    assert digest(path) == manifest['provenance']['rendererSha256'], 'Unapproved pose authoring code'
    tree = ast.parse(path.read_text(), filename=str(path))
    class Observe(ast.NodeTransformer):
        count = 0
        def visit_Expr(self, node):
            if (isinstance(node.value, ast.Call)
                and isinstance(node.value.func, ast.Attribute)
                and isinstance(node.value.func.value, ast.Name)
                and node.value.func.value.id == 'records'
                and node.value.func.attr == 'append'):
                self.count += 1
                return [node, ast.Expr(value=ast.Call(func=ast.Name(id='_observe', ctx=ast.Load()),
                                                     args=[], keywords=[]))]
            return self.generic_visit(node)
    observer = Observe()
    tree = observer.visit(tree)
    assert observer.count == 1, 'Authoring structure changed; inspect before adapting'
    ast.fix_missing_locations(tree)
    context = {'__file__': str(path), '__name__': '__shield_probe__'}
    def capture():
        direction = context['direction']
        ordinal = len(context['records']) - 1
        shipped = manifest['views'][direction]['frames'][ordinal]
        generated = context['records'][-1]
        # Independent shipped geometry anchors detect drift in reused authoring.
        assert generated['action'] == shipped['action'] and generated['index'] == shipped['index']
        for actual, expected in zip(generated['feet'], shipped['feet']):
            assert (Vector(actual) - Vector(expected)).length < 1e-5
        if DEATH_ARM and group == 'death' and ordinal >= 8:
            # Targeted presentation-only landing variant: the shield arm opens
            # beside the torso. Keep shoulder, hand orientation, all other bones,
            # root, camera and bone lengths. Reuse the approved two-bone IK.
            rig = context['rig']
            landing = min(1, (ordinal - 7) / 4)
            shoulder = rig.pose.bones['upperL'].head.copy()
            wrist = rig.pose.bones['handL'].head.copy()
            target = wrist + Vector((-.20 * landing, 0, 0))
            lengths = context['lengths']
            reach = (lengths['upperL'] + lengths['foreL']) * .97
            delta = target - shoulder
            if delta.length > reach:
                target = shoulder + delta.normalized() * reach
            joint = context['resting_elbow'](shoulder, target, lengths['upperL'], lengths['foreL'], 'L')
            hand = rig.pose.bones['handL'].matrix.copy()
            hand.translation = target
            rig.pose.bones['upperL'].matrix = context['pose_bone']('upperL', shoulder, joint)
            rig.pose.bones['foreL'].matrix = context['pose_bone']('foreL', joint, target)
            rig.pose.bones['handL'].matrix = hand
            bpy.context.view_layer.update()
            for parent, child in [('upper', 'fore'), ('fore', 'hand')]:
                assert (rig.pose.bones[parent + 'L'].tail - rig.pose.bones[child + 'L'].head).length < 1e-5
        observe(group, direction, ordinal, shipped, context['scene'], context['rig'])
    context['_observe'] = capture
    saved = sys.argv
    directions = ['se'] if ONLY_DEATH else manifest['directions']
    sys.argv = [str(path), '--', str(OUT / group), *directions, '--audit']
    try:
        exec(compile(tree, str(path), 'exec'), context)
    finally:
        sys.argv = saved
    return digest(path)


spec = importlib.util.spec_from_file_location('attachments', ROOT / 'scripts/export-warrior-attachments.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
if not ONLY_DEATH:
    exporter.export(OUT / 'attachments.json', observe)
authoring = {}
for group, folder, public in [('abilities', 'warrior-abilities', 'warrior-abilities'),
                               ('hit', 'warrior-reactions', 'warrior-reactions'),
                               ('death', 'warrior-death', 'warrior-death')]:
    if ONLY_DEATH and group != 'death':
        continue
    authoring[group] = procedural(group, folder, public)
expected = 16 if ONLY_DEATH else 880
assert len(poses) == expected and len({p['name'] for p in poses}) == expected
by_name = {p['name']: p for p in poses}
for pose in poses:
    if pose['rasterAlias'] and pose['rasterAlias'] in by_name:
        source = by_name[pose['rasterAlias']]
        delta = [a - b for a, b in zip(pose['root'], source['root'])]
        pose['rasterGrip'] = rounded(a + b for a, b in zip(source['grip'], delta))
        pose['rasterMatrixWorld'] = source['matrixWorld']
result = {'version': 1, 'productionApproved': False,
          'producerSha256': digest(__file__), 'poseAuthoringSha256': authoring,
          'grip': 'left wrist local palm at rest z=-0.045m; 0.14m plate clearance',
          'occlusion': 'equipment-only render with original body geometry as camera holdout',
          'deathSwivelCandidate': ROLL, 'poses': poses}
result['shieldWidthMeters'] = HALF_WIDTH * 2
result['targetedDeathArmCandidate'] = DEATH_ARM
result['coverage'] = 'SE death only' if ONLY_DEATH else 'all eight directions / 880 authored poses and packed-pose aliases'
result['attachmentsExporterSha256'] = digest(ROOT / 'scripts/export-warrior-attachments.py')
result['units'] = 'atlas pixels; Blender world meters; pose BVH surface intersections only'
result['diagnosticFailures'] = [p['name'] for p in poses
                                if p['plateBodyIntersections'] or p['plateGroundMinimum'] < -.001
                                or (p['modifiedArmGroundMinimum'] is not None
                                    and p['modifiedArmGroundMinimum'] < -.001)]
(OUT / 'shield.json').write_text(json.dumps(result, sort_keys=True, separators=(',', ':')) + '\n')
bad = result['diagnosticFailures']
print('SHIELD_PROBE', len(poses), 'diagnostic failures', len(bad), bad[:16],
      digest(OUT / 'shield.json'), flush=True)
