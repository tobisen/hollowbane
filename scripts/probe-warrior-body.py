"""Bounded sword-free body diagnostic; never writes approved art or blend files.

Blender --background --python-exit-code 1 --python scripts/probe-warrior-body.py
  -- /private/tmp/warrior-body-proof [--audit] [--render idle-se-00 ...]

Audit all 880 poses through the approved exporter/authoring scripts. Render at
most twelve selected reference/clean pairs, using unchanged cameras, lighting,
materials, geometry and motion. Only the four sword meshes change visibility.
This proves neither weapon choreography nor production compatibility.
"""
import argparse
import ast
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

sys.dont_write_bytecode = True

import bpy
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
FOLDERS = {
    'movement': 'warrior-directions',
    'attacks': 'warrior-attack-directions',
    'abilities': 'warrior-abilities',
    'hit': 'warrior-reactions',
    'death': 'warrior-death',
}
DEFAULT_POSES = [
    'idle-se-00', 'idle-w-00', 'walk-se-04', 'run-w-04',
    'primary-nw-05', 'secondary-w-05', 'iron-fan-se-05',
    'oath-echo-w-05', 'hit-w-02', 'death-se-13', 'death-n-13',
]
SWORDS = {'Sword grip', 'Bronze crossguard', 'Sword pommel', 'Straight sword blade'}


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--audit', action='store_true')
    parser.add_argument('--render', nargs='+', default=DEFAULT_POSES)
    options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    output = options.output.resolve()
    assert not output.is_relative_to(ROOT), 'Keep diagnostic output outside the repository'
    selected = set(options.render)
    assert 0 < len(selected) <= 12 and len(selected) == len(options.render)
    output.mkdir(parents=True, exist_ok=True)
    manifests = {group: json.loads((ROOT / 'public/dev' / folder / 'warrior.json').read_text())
                 for group, folder in FOLDERS.items()}
    spec = importlib.util.spec_from_file_location('attachments', ROOT / 'scripts/export-warrior-attachments.py')
    exporter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exporter)
    poses, samples = [], []
    mesh_base = None

    def observe(group, direction, ordinal, approved, scene, rig):
        nonlocal mesh_base
        if not rig.get('_body_probe_initialized', False):
            body = [obj for obj in scene.objects if obj.type == 'MESH']
            assert len(body) == 135
            assert {obj.name for obj in body if obj.name in SWORDS} == SWORDS
            mesh_base = {obj.name: obj.matrix_world.copy() for obj in body}
            rig['_body_probe_initialized'] = True
        if group in ('movement', 'attacks'):
            rotation = Matrix.Rotation(math.radians(exporter.ANGLES[direction]), 4, 'Z')
            for name, original in mesh_base.items():
                scene.objects[name].matrix_world = rotation @ original
            bpy.context.view_layer.update()
        name = f"{approved['action']}-{direction}-{approved['index']:02}"
        poses.append(name)
        if name not in selected:
            return
        # Shipped endpoints sometimes alias idle/settled pixels. Require an
        # actual authored pose; the pixel comparator handles no alias guessing.
        assert not (group in ('attacks', 'abilities') and approved['index'] in (0, 11))
        assert not (group == 'hit' and approved['index'] == 5)
        assert not (group == 'death' and approved['index'] in (0, 14, 15))
        manifest = manifests[group]
        point = world_to_camera_view(scene, scene.camera, Vector((0, 0, 0)))
        root = [point.x * scene.render.resolution_x / 2,
                (1 - point.y) * scene.render.resolution_y / 2]
        assert max(abs(a - b) for a, b in zip(root, manifest['root'])) < .001
        record = {'name': name, 'group': group, 'direction': direction,
                  'ordinal': ordinal, 'root': root, 'frame': approved,
                  'renderSize': [scene.render.resolution_x, scene.render.resolution_y],
                  'samples': scene.cycles.samples, 'seed': scene.cycles.seed,
                  'animatedSeed': scene.cycles.use_animated_seed,
                  'rendered': not options.audit}
        if not options.audit:
            swords = [scene.objects[key] for key in sorted(SWORDS)]
            visibility = [obj.hide_render for obj in swords]
            assert not any(visibility)
            before = {bone.name: bone.matrix.copy() for bone in rig.pose.bones}
            filepath = scene.render.filepath
            try:
                scene.render.filepath = str(output / (name + '-reference.png'))
                bpy.ops.render.render(write_still=True)
                for obj in swords:
                    obj.hide_render = True
                scene.render.filepath = str(output / (name + '-clean.png'))
                bpy.ops.render.render(write_still=True)
            finally:
                scene.render.filepath = filepath
                for obj, hidden in zip(swords, visibility):
                    obj.hide_render = hidden
            assert all(bone.matrix == before[bone.name] for bone in rig.pose.bones)
            record['referenceSha256'] = digest(output / (name + '-reference.png'))
            record['cleanSha256'] = digest(output / (name + '-clean.png'))
        samples.append(record)
        print('WARRIOR_BODY_SAMPLE', name, 'audit' if options.audit else 'rendered', flush=True)

    exporter.export(output / 'attachments.json', observe)
    authoring = {}
    for group, source in [('abilities', 'warrior-abilities'),
                           ('hit', 'warrior-reactions'), ('death', 'warrior-death')]:
        path = ROOT / 'assets/source/q3' / source / 'render.py'
        manifest = manifests[group]
        authoring[group] = digest(path)
        assert authoring[group] == manifest['provenance']['rendererSha256']
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
                    return [node, ast.Expr(value=ast.Call(
                        func=ast.Name(id='_observe', ctx=ast.Load()), args=[], keywords=[]))]
                return self.generic_visit(node)

        observer = Observe()
        tree = observer.visit(tree)
        assert observer.count == 1, 'Inspect changed authoring structure before adapting'
        ast.fix_missing_locations(tree)
        context = {'__file__': str(path), '__name__': '__body_probe__'}

        def capture():
            direction = context['direction']
            ordinal = len(context['records']) - 1
            shipped = manifest['views'][direction]['frames'][ordinal]
            generated = context['records'][-1]
            assert generated['action'] == shipped['action']
            assert generated['index'] == shipped['index']
            for actual, expected in zip(generated['feet'], shipped['feet']):
                assert (Vector(actual) - Vector(expected)).length < 1e-5
            assert max(abs(a - b) for a, b in zip(generated['root'], manifest['root'])) < .001
            observe(group, direction, ordinal, shipped, context['scene'], context['rig'])

        context['_observe'] = capture
        saved = sys.argv
        sys.argv = [str(path), '--', str(output / group), *manifest['directions'], '--audit']
        try:
            exec(compile(tree, str(path), 'exec'), context)
        finally:
            sys.argv = saved
    assert len(poses) == len(set(poses)) == 880
    assert {sample['name'] for sample in samples} == selected
    result = {'version': 1, 'producerSha256': digest(__file__),
              'blender': bpy.app.version_string, 'auditedPoses': len(poses),
              'rasterPairs': 0 if options.audit else len(samples),
              'sourceAuthoringSha256': authoring, 'removedMeshes': sorted(SWORDS),
              'productionApproved': False, 'samples': samples}
    (output / 'body.json').write_text(json.dumps(result, indent=2) + '\n')
    print('WARRIOR_BODY_PROOF', len(poses), result['rasterPairs'], digest(output / 'body.json'), flush=True)


if __name__ == '__main__':
    main()
