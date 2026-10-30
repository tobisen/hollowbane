"""Bounded Variant B camera proof using the original approved movement source.

Blender --background --python-exit-code 1 --python scripts/probe-act1-projection.py
  -- /private/tmp/act1-projection [--render]
  [--window-from retained/projection.json --render-extremes]

Audits all 320 movement poses at each elevation. Optional renders are only idle
and one walk pose in SE/W, paired at 30 degrees and asin(44/64). Never saves a
blend, writes shipping assets, changes motion, fits individual poses or expands
equipment. The retained-audit option derives a shared rectangular window and
revalidates every pose against prior bounds. --render-extremes selects six
unique extreme/regression poses per angle from that audit. Outputs diagnostics,
not a production animation package.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from act1_export_window import shared_window, contains

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
ANGLES = {'se': 0, 's': 315, 'sw': 270, 'w': 225,
          'nw': 180, 'n': 135, 'ne': 90, 'e': 45}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--render', action='store_true')
    parser.add_argument('--window-from', type=Path,
                        help='Derive a common padded window from the retained 640-pose audit')
    parser.add_argument('--render-extremes', action='store_true',
                        help='Render only measured extrema and the previously tight west walk')
    options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    output = options.output.resolve()
    assert not output.is_relative_to(ROOT), 'Diagnostics belong outside the repository'
    output.mkdir(parents=True, exist_ok=True)
    source = ROOT / 'assets/source/q3/warrior-movement-se/warrior.blend'
    manifest_path = ROOT / 'public/dev/warrior-movement/warrior.json'
    manifest = json.loads(manifest_path.read_text())
    assert digest(source) == manifest['provenance']['rigSha256']
    retained = json.loads(options.window_from.read_text()) if options.window_from else None
    window = None
    extremes = set()
    if retained:
        assert retained['sourceSha256'] == digest(source)
        assert retained['manifestSha256'] == digest(manifest_path)
        assert [v['name'] for v in retained['variants']] == ['source', 'b']
        assert all(len(v['poses']) == 320 for v in retained['variants'])
        window = shared_window([p['conservativeBounds'] for v in retained['variants']
                                for p in v['poses']])
        for variant in retained['variants']:
            for axis in range(4):
                select = min if axis < 2 else max
                extremes.add(select(variant['poses'],
                                    key=lambda p: p['conservativeBounds'][axis])['name'])
        extremes.add('walk-w-04')
    assert not options.render_extremes or window
    bpy.ops.wm.open_mainfile(filepath=str(source))
    assert bpy.app.version_string == manifest['blender']
    scene = bpy.context.scene
    camera = scene.camera
    assert camera.data.type == 'ORTHO'
    rig = bpy.data.objects['Warrior rig']
    objects = [o for o in scene.objects if o.type in ('MESH', 'ARMATURE')]
    base = {o.name: o.matrix_world.copy() for o in objects}
    assert len([o for o in objects if o.type == 'MESH']) == 135
    initial_camera = camera.matrix_world.copy()
    initial_scale = camera.data.ortho_scale
    initial_rotation = camera.rotation_euler.copy()
    initial_fit = camera.data.sensor_fit
    cell = manifest['cell']
    root = Vector((manifest['root'][0] / cell, 1 - manifest['root'][1] / cell))

    def project(point):
        p = world_to_camera_view(scene, camera, Vector(point))
        return Vector((p.x * scene.render.resolution_x / 2,
                       (1 - p.y) * scene.render.resolution_y / 2))

    report = {
        'sourceSha256': digest(source), 'manifestSha256': digest(manifest_path),
        'blender': bpy.app.version_string, 'groundHalfWidth': 64,
        'groundHalfHeight': 44, 'orthoScale': initial_scale,
        'root': manifest['root'], 'displayScale': manifest['displayScale'],
        'clips': manifest['clips'], 'shippingAssetsChanged': False,
        'scope': 'geometry audit and bounded optional stills; no playable acceptance',
        'variants': [],
        'window': window,
        'retainedAuditSha256': digest(options.window_from) if retained else None,
    }
    for label, elevation in [('source', 30.0), ('b', math.degrees(math.asin(44 / 64)))]:
        camera.matrix_world = initial_camera.copy()
        camera.data.sensor_fit = initial_fit
        camera.data.ortho_scale = initial_scale
        scene.render.resolution_x = scene.render.resolution_y = cell * 2
        camera.rotation_euler = initial_rotation.copy()
        camera.rotation_euler.x = math.pi / 2 - math.radians(elevation)
        bpy.context.view_layer.update()
        # One camera translation retains the shared root for every pose/direction.
        # Horizontal scale, frame size and pose geometry stay untouched.
        if label == 'b':
            p = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
            camera.location += camera.rotation_euler.to_matrix() @ Vector(
                ((p.x - root.x) * initial_scale, (p.y - root.y) * initial_scale, 0))
            bpy.context.view_layer.update()
        origin = project((0, 0, 0))
        axes = [project(p) - origin for p in [(1, 0, 0), (0, 1, 0), (0, 0, 1)]]
        slopes = [abs(p.y / p.x) for p in axes[:2]]
        assert max(abs(s - math.sin(math.radians(elevation))) for s in slopes) < 1e-5
        assert camera.data.ortho_scale == initial_scale
        expected_root = manifest['root']
        if window:
            camera.data.sensor_fit = 'HORIZONTAL'
            camera.data.ortho_scale = initial_scale * window['width'] / cell
            scene.render.resolution_x = window['width'] * 2
            scene.render.resolution_y = window['height'] * 2
            bpy.context.view_layer.update()
            current = project((0, 0, 0))
            expected_root = window['root']
            camera.location += camera.rotation_euler.to_matrix() @ Vector((
                (current.x - expected_root[0]) * initial_scale / cell,
                (expected_root[1] - current.y) * initial_scale / cell, 0))
            bpy.context.view_layer.update()
            shifted_origin = project((0, 0, 0))
            new_axes = [project(p) - shifted_origin
                        for p in [(1, 0, 0), (0, 1, 0), (0, 0, 1)]]
            assert max((a - b).length for a, b in zip(axes, new_axes)) < .001
        variant = {'name': label, 'elevationDegrees': elevation,
                   'groundSlopes': slopes, 'projectedAxes': [list(p) for p in axes],
                   'cameraMatrix': [list(row) for row in camera.matrix_world],
                   'maxRootErrorPixels': 0, 'maxContactErrorMeters': 0,
                   'maxRetainedBoundsErrorPixels': 0,
                   'posesOutsidePaddedWindow': [],
                   'conservativeBounds': [cell, cell, 0, 0],
                   'posesOutsideOriginalCell': [],
                   'poses': [], 'renders': []}
        for direction, angle in ANGLES.items():
            rotation = Matrix.Rotation(math.radians(angle), 4, 'Z')
            for obj in objects:
                obj.matrix_world = rotation @ base[obj.name]
            for index, frame in enumerate(manifest['frames']):
                scene.frame_set(index + 1)
                bpy.context.view_layer.update()
                bones = {b.name: b.matrix.copy() for b in rig.pose.bones}
                error = max(abs(a - b) for a, b in zip(project((0, 0, 0)), expected_root))
                variant['maxRootErrorPixels'] = max(variant['maxRootErrorPixels'], error)
                assert error < .001
                contacts = []
                for contact in frame['contacts']:
                    sole = rotation @ Vector(contact['sole'])
                    ankle = rig.matrix_world @ rig.pose.bones['foot' + contact['side']].head
                    expected = rotation @ (Vector(contact['sole']) + Vector((0, 0, .09)))
                    error = (ankle - expected).length
                    variant['maxContactErrorMeters'] = max(variant['maxContactErrorMeters'], error)
                    assert error < 1e-5
                    contacts.append({'side': contact['side'], 'planted': contact['planted'],
                                     'pixel': list(project(sole))})
                name = f"{frame['action']}-{direction}-{frame['index']:02}"
                depsgraph = bpy.context.evaluated_depsgraph_get()
                points = []
                for obj in objects:
                    if obj.type != 'MESH':
                        continue
                    evaluated = obj.evaluated_get(depsgraph)
                    points.extend(project(evaluated.matrix_world @ Vector(corner))
                                  for corner in evaluated.bound_box)
                bounds = [min(p.x for p in points), min(p.y for p in points),
                          max(p.x for p in points), max(p.y for p in points)]
                if window:
                    prior = next(p for v in retained['variants'] if v['name'] == label
                                 for p in v['poses'] if p['name'] == name)
                    offset = [window['left'], window['top']] * 2
                    error = max(abs(a - b + delta) for a, b, delta
                                in zip(bounds, prior['conservativeBounds'], offset))
                    variant['maxRetainedBoundsErrorPixels'] = max(
                        variant['maxRetainedBoundsErrorPixels'], error)
                    assert error < .001, (name, bounds, prior['conservativeBounds'])
                    if not contains(window, bounds):
                        variant['posesOutsidePaddedWindow'].append(name)
                variant['conservativeBounds'] = [
                    min(variant['conservativeBounds'][i], value) if i < 2
                    else max(variant['conservativeBounds'][i], value)
                    for i, value in enumerate(bounds)]
                if min(bounds[:2]) < 0 or max(bounds[2:]) >= cell:
                    variant['posesOutsideOriginalCell'].append(name)
                variant['poses'].append({'name': name, 'contacts': contacts,
                                         'conservativeBounds': bounds})
                if ((options.render and direction in ('se', 'w') and index in (0, 12))
                        or (options.render_extremes and name in extremes)):
                    path = output / f'{label}-{name}.png'
                    scene.render.filepath = str(path)
                    bpy.ops.render.render(write_still=True)
                    variant['renders'].append({'file': path.name, 'sha256': digest(path)})
                    assert all(b.matrix == bones[b.name] for b in rig.pose.bones)
        assert len(variant['poses']) == 320
        assert not variant['posesOutsidePaddedWindow']
        report['variants'].append(variant)
        print('ACT1_PROJECTION', label, elevation, len(variant['poses']), flush=True)
    assert digest(source) == report['sourceSha256']
    (output / 'projection.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
