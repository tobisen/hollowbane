import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from release_artifact import hosted, seal, verify


class ReleaseIntegrity(unittest.TestCase):
    sha = 'a' * 40

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        (self.directory / 'index.html').write_text('<script src="app.js"></script>')
        (self.directory / 'app.js').write_text('original bytes')
        seal(self.directory, self.sha)

    def test_exact_build_survives_sealing_and_verification(self):
        self.assertEqual(verify(self.directory, self.sha)['sha'], self.sha)

    def test_wrong_commit_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'SHA mismatch'):
            verify(self.directory, 'b' * 40)
        with self.assertRaisesRegex(ValueError, 'full commit SHA'):
            seal(self.directory, 'abcdef1')

    def test_changed_missing_and_extra_files_are_rejected(self):
        for mutation in ['changed', 'missing', 'extra']:
            with self.subTest(mutation=mutation):
                app = self.directory / 'app.js'
                app.write_text('original bytes')
                seal(self.directory, self.sha)
                if mutation == 'changed':
                    app.write_text('different bytes')
                elif mutation == 'missing':
                    app.unlink()
                else:
                    (self.directory / 'extra.js').write_text('unexpected')
                with self.assertRaisesRegex(ValueError, 'inventory or bytes mismatch'):
                    verify(self.directory, self.sha)

    def test_manifest_cannot_substitute_a_path_outside_the_artifact(self):
        manifest = self.directory / 'release.json'
        data = json.loads(manifest.read_text())
        data['files']['../private'] = '0' * 64
        manifest.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'inventory or bytes mismatch'):
            verify(self.directory, self.sha)

    def test_symlinks_are_rejected(self):
        (self.directory / 'alias.js').symlink_to('app.js')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            verify(self.directory, self.sha)

    def test_hosted_stale_manifest_and_changed_bytes_fail(self):
        for stale_manifest in [True, False]:
            with self.subTest(stale_manifest=stale_manifest):
                def response(request, timeout):
                    relative = request.full_url.split('/')[-1].split('?')[0]
                    body = (self.directory / relative).read_bytes()
                    if stale_manifest or relative == 'app.js':
                        body = b'stale release'
                    from io import BytesIO
                    return BytesIO(body)

                with patch('release_artifact.urlopen', side_effect=response):
                    with self.assertRaisesRegex(ValueError, 'hosted.*mismatch'):
                        hosted(self.directory, self.sha, 'https://example.invalid/')
