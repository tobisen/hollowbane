import os
from pathlib import Path
import subprocess
import unittest


class RequiredChecks(unittest.TestCase):
    def gate(self, results):
        script = Path(__file__).with_name('required_checks.sh')
        return subprocess.run(['bash', str(script)], env={**os.environ, **results},
                              capture_output=True, check=False).returncode

    def test_every_required_job_must_succeed(self):
        success = dict.fromkeys(['CHECKS_RESULT', 'CHROMIUM_RESULT',
                                 'COMPATIBILITY_RESULT'], 'success')
        self.assertEqual(self.gate(success), 0)
        for job in success:
            for result in ['failure', 'cancelled', 'skipped', '']:
                with self.subTest(job=job, result=result):
                    self.assertNotEqual(self.gate({**success, job: result}), 0)
