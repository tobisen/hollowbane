import os
from pathlib import Path
import subprocess
import unittest


class ReleaseAcceptance(unittest.TestCase):
    def gate(self, verify='success', deploy='success', hosted='success', publish='true'):
        return subprocess.run(['bash', str(Path(__file__).with_name('accept_release.sh'))],
                              env={**os.environ, 'VERIFY_RESULT': verify,
                                   'DEPLOY_RESULT': deploy, 'HOSTED_RESULT': hosted,
                                   'PUBLISH_RELEASE': publish},
                              capture_output=True, check=False).returncode

    def test_main_requires_pages_and_hosted_but_prs_do_not_publish(self):
        self.assertEqual(self.gate(), 0)
        self.assertEqual(self.gate(deploy='skipped', hosted='skipped', publish='false'), 0)
        for result in ['failure', 'cancelled', 'skipped', '']:
            for field in ['verify', 'deploy', 'hosted']:
                self.assertNotEqual(self.gate(**{field: result}), 0)
        self.assertNotEqual(self.gate(verify='failure', publish='false'), 0)
        self.assertNotEqual(self.gate(publish=''), 0)
