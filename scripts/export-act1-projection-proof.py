"""Bounded SE all-state projection proof; original authoring and timings retained.

First run --movement-audit retained/projection.json to measure 86 representative
poses. Then --render-from audit/proof.json renders that measured common window.
No production assets, sources, other directions or equipment are modified.
"""
import argparse
import ast
import hashlib
import json
import math
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from act1_export_window import shared_window, contains
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--movement-audit', type=Path, required=True)
    parser.add_argument('--render-from', type=Path)
    options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    output = options.output.resolve()
    assert not output.is_relative_to(ROOT)
    output.mkdir(parents=True, exist_ok=True)
    movement = json.loads(options.movement_audit.read_text())
    assert movement['sourceSha256'] == digest(ROOT / 'assets/source/q3/warrior-movement-se/warrior.blend')
    assert len(movement['variants']) == 2 and all(len(v['poses']) == 320 for v in movement['variants'])
    audit = json.loads(options.render_from.read_text()) if options.render_from else None
    window = audit['window'] if audit else {'width': 256, 'height': 256, 'root': [128, 210], 'left': 0, 'top': 0}
    if audit:
        assert audit['movementAuditSha256'] == digest(options.movement_audit)
    records, sources = [], {}

    def capture(group, ordinal, action, index):
        scene = bpy.context.scene
        rig = bpy.data.objects['Warrior rig']
        camera = scene.camera
        data = camera.data
        before = (camera.matrix_world.copy(), data.ortho_scale, data.sensor_fit,
                  data.shift_x, data.shift_y, scene.render.resolution_x, scene.render.resolution_y)
        bones = {b.name: b.matrix.copy() for b in rig.pose.bones}
        objects = [o for o in scene.objects if o.type == 'MESH']
        assert len(objects) == 135
        width, height = window['width'], window['height']

        def project(point):
            p = world_to_camera_view(scene, camera, Vector(point))
            return Vector((p.x * width, (1 - p.y) * height))

        try:
            # Normalize all legacy frame sizes to the original movement sampling.
            data.ortho_scale = movement['orthoScale'] * width / 256
            data.sensor_fit = 'HORIZONTAL'
            data.shift_x = data.shift_y = 0
            camera.rotation_euler.x = math.pi / 2 - math.asin(44 / 64)
            scene.render.resolution_x, scene.render.resolution_y = width * 2, height * 2
            bpy.context.view_layer.update()
            p = project((0, 0, 0))
            camera.location += camera.rotation_euler.to_matrix() @ Vector((
                (p.x - window['root'][0]) * movement['orthoScale'] / 256,
                (window['root'][1] - p.y) * movement['orthoScale'] / 256, 0))
            bpy.context.view_layer.update()
            root = project((0, 0, 0))
            assert max(abs(a - b) for a, b in zip(root, window['root'])) < .001
            depsgraph = bpy.context.evaluated_depsgraph_get()
            points = []
            for obj in objects:
                evaluated = obj.evaluated_get(depsgraph)
                points.extend(project(evaluated.matrix_world @ Vector(p)) for p in evaluated.bound_box)
            bounds = [min(p.x for p in points), min(p.y for p in points),
                      max(p.x for p in points), max(p.y for p in points)]
            name = f'{action}-se-{index:02}'
            record = {'name': name, 'set': group, 'frame': ordinal, 'action': action,
                      'index': index, 'root': list(root), 'bounds': bounds}
            if audit:
                old = next(p for p in audit['frames'] if p['name'] == name)
                assert old['set'] == group and old['frame'] == ordinal
                assert max(abs(a - b + offset) for a, b, offset in
                           zip(bounds, old['bounds'], [window['left'], window['top']] * 2)) < .001
                assert contains(window, bounds), name
                path = output / (name + '.png')
                scene.render.filepath = str(path)
                bpy.ops.render.render(write_still=True)
                record['sha256'] = digest(path)
            records.append(record)
        finally:
            camera.matrix_world, data.ortho_scale, data.sensor_fit = before[:3]
            data.shift_x, data.shift_y = before[3:5]
            scene.render.resolution_x, scene.render.resolution_y = before[5:]
            bpy.context.view_layer.update()
        assert all(b.matrix == bones[b.name] for b in rig.pose.bones)

    for group, folder, manifest_folder, count in [
        ('movement', 'warrior-movement-se', 'warrior-movement', 40),
        ('attacks', 'warrior-combat-se', 'warrior-combat', 12),
    ]:
        source = ROOT / 'assets/source/q3' / folder / 'warrior.blend'
        manifest = json.loads((ROOT / 'public/dev' / manifest_folder / 'warrior.json').read_text())
        assert digest(source) == manifest['provenance']['rigSha256']
        sources[str(source.relative_to(ROOT))] = digest(source)
        bpy.ops.wm.open_mainfile(filepath=str(source))
        assert bpy.app.version_string == '4.5.3 LTS'
        for ordinal, frame in enumerate(manifest['frames'][:count]):
            bpy.context.scene.frame_set(ordinal + 1)
            bpy.context.view_layer.update()
            capture(group, ordinal, frame['action'], frame['index'])

    for group, folder in [('abilities', 'warrior-abilities'), ('hit', 'warrior-reactions'), ('death', 'warrior-death')]:
        path = ROOT / 'assets/source/q3' / folder / 'render.py'
        manifest = json.loads((ROOT / 'public/dev' / folder / 'warrior.json').read_text())
        assert digest(path) == manifest['provenance']['rendererSha256']
        sources[str(path.relative_to(ROOT))] = digest(path)
        tree = ast.parse(path.read_text(), filename=str(path))

        class Observe(ast.NodeTransformer):
            count = 0

            def visit_Expr(self, node):
                if (isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute)
                        and isinstance(node.value.func.value, ast.Name)
                        and node.value.func.value.id == 'records' and node.value.func.attr == 'append'):
                    self.count += 1
                    return [node, ast.Expr(value=ast.Call(func=ast.Name(id='_capture', ctx=ast.Load()), args=[], keywords=[]))]
                return self.generic_visit(node)

        observer = Observe()
        tree = observer.visit(tree)
        assert observer.count == 1
        ast.fix_missing_locations(tree)
        context = {'__file__': str(path), '__name__': '__act1_projection__'}

        def observe():
            frame = context['records'][-1]
            ordinal = len(context['records']) - 1
            if group == 'abilities' and ordinal >= 12:
                return
            capture(group, ordinal, frame['action'], frame['index'])

        context['_capture'] = observe
        saved = sys.argv
        sys.argv = [str(path), '--', str(output / 'authoring' / group), 'se', '--audit']
        try:
            exec(compile(tree, str(path), 'exec'), context)
        finally:
            sys.argv = saved
    assert len(records) == len({r['name'] for r in records}) == 86
    if audit:
        assert sources == audit['sources']
    else:
        window = shared_window([p['bounds'] for p in records] + [p['conservativeBounds']
                               for v in movement['variants'] for p in v['poses']])
    for path, sha in sources.items():
        assert digest(ROOT / path) == sha
    result = {'version': 1, 'scope': 'bounded SE all-state proof; other facings not rendered',
              'productionApproved': False, 'window': window, 'frames': records,
              'sources': sources, 'movementAuditSha256': digest(options.movement_audit),
              'rendered': bool(audit), 'elevationDegrees': math.degrees(math.asin(44 / 64))}
    (output / 'proof.json').write_text(json.dumps(result, indent=2) + '\n')
    print('ACT1_ALL_STATE_PROOF', len(records), window, bool(audit), flush=True)


if __name__ == '__main__':
    main()
