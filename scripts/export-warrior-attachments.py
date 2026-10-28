"""Metadata-only attachment feasibility probe; never renders or saves a blend.

Blender --background --python-exit-code 1 --python scripts/export-warrior-attachments.py -- output.json
Exports the saved movement/attack sources only. Procedural ability/hit/death
poses and per-pixel occlusion still require a separate implementation.
"""
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
ANGLES = {'n': 135, 'ne': 90, 'e': 45, 'se': 0,
          's': 315, 'sw': 270, 'w': 225, 'nw': 180}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rounded(values):
    return [round(float(v), 6) for v in values]


def export():
    assert bpy.app.version_string == '4.5.3 LTS', 'Use the approved Blender version'
    output = Path(sys.argv[sys.argv.index('--') + 1])
    result = {'version': 1, 'blender': bpy.app.version_string,
              'producerSha256': digest(Path(__file__)),
              'units': 'atlas pixels; camera depth in Blender units',
              'occlusionVerified': False, 'sets': {}}
    for name, folder, approved_folder in [
        ('movement', 'warrior-movement-se', 'warrior-directions'),
        ('attacks', 'warrior-combat-se', 'warrior-attack-directions'),
    ]:
        source = ROOT / 'assets/source/q3' / folder / 'warrior.blend'
        manifest_path = ROOT / 'public/dev' / approved_folder / 'warrior.json'
        manifest = json.loads(manifest_path.read_text())
        assert digest(source) == manifest['provenance']['rigSha256']
        bpy.ops.wm.open_mainfile(filepath=str(source))
        scene = bpy.context.scene
        camera = scene.camera
        assert camera.data.type == 'ORTHO'
        rig = bpy.data.objects['Warrior rig']
        original = rig.matrix_world.copy()
        # Match the approved attack overscan; movement's extra 8px are bottom padding.
        if name == 'attacks':
            scene.render.resolution_x = scene.render.resolution_y = 640
            camera.data.ortho_scale *= 320 / 256
            camera.data.shift_x *= 256 / 320
            camera.data.shift_y = camera.data.shift_y * 256 / 320 + .1

        def project(point):
            v = world_to_camera_view(scene, camera, point)
            return rounded((v.x * scene.render.resolution_x / 2,
                            (1 - v.y) * scene.render.resolution_y / 2, v.z))

        views = {}
        for direction, angle in ANGLES.items():
            rig.matrix_world = Matrix.Rotation(math.radians(angle), 4, 'Z') @ original
            frames = []
            for index, approved in enumerate(manifest['views'][direction]['frames']):
                scene.frame_set(index + 1)
                bpy.context.view_layer.update()
                root = project(Vector((0, 0, 0)))
                assert max(abs(a - b) for a, b in zip(root, manifest['root'])) < .001
                # Verify against shipped metadata, independently of attachment output.
                for bone in rig.pose.bones:
                    assert abs(bone.length - approved['boneLengths'][bone.name]) < 1e-5
                for side in ('L', 'R'):
                    assert (rig.pose.bones['fore' + side].tail
                            - rig.pose.bones['hand' + side].head).length < 1e-5
                    foot = rig.matrix_world @ rig.pose.bones['foot' + side].head
                    if name == 'movement':
                        contact = next(c for c in approved['contacts'] if c['side'] == side)
                        expected = Vector(contact['sole']) + Vector((0, 0, .09))
                    else:
                        expected = Vector(approved['feet'][0 if side == 'L' else 1])
                    assert (foot - expected).length < 1e-5, (name, direction, index, side)
                hands = {}
                for side in ('L', 'R'):
                    matrix = rig.matrix_world @ rig.pose.bones['hand' + side].matrix
                    assert abs(matrix.to_3x3().determinant() - 1) < 1e-5
                    # Bone origin is the wrist, not an approved weapon-specific grip.
                    # Full projected XYZ basis retains foreshortening; angle alone cannot.
                    origin = project(matrix.translation)
                    basis = []
                    for axis in (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))):
                        point = project(matrix @ axis)
                        basis.append(rounded(a - b for a, b in zip(point, origin)))
                    hands[side] = {'origin': origin, 'basis': basis,
                                   'matrixWorld': [rounded(row) for row in matrix]}
                frames.append({'action': approved['action'], 'index': approved['index'],
                               'root': root, 'hands': hands})
            views[direction] = frames
        result['sets'][name] = {'rigSha256': digest(source),
                               'manifestSha256': digest(manifest_path),
                               'root': manifest['root'], 'views': views}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, sort_keys=True, separators=(',', ':')) + '\n')
    print('WARRIOR_ATTACHMENTS', sum(len(v) for s in result['sets'].values()
                                    for v in s['views'].values()), digest(output))


if __name__ == '__main__':
    export()
