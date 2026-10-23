import os
from pathlib import Path
import subprocess
import unittest


class RiskGate(unittest.TestCase):
    def gate(self, fast, full, tier, integration='skipped'):
        return subprocess.run(['bash', str(Path(__file__).with_name('risk_gate.sh'))],
                              env={**os.environ, 'FAST_RESULT': fast,
                                   'FULL_RESULT': full, 'REQUIRED_TIER': tier,
                                   'INTEGRATION_RESULT': integration},
                              capture_output=True, check=False).returncode

    def test_required_failure_blocks_deployment(self):
        self.assertEqual(self.gate('success', 'skipped', 'fast'), 0)
        self.assertEqual(self.gate('success', 'success', 'full'), 0)
        self.assertEqual(self.gate('success', 'skipped', 'integration', 'success'), 0)
        for tier in ['fast', 'integration', 'full']:
            for result in ['failure', 'skipped', 'cancelled', '']:
                self.assertNotEqual(self.gate(result, 'success', tier), 0)
        for result in ['failure', 'skipped', 'cancelled', '']:
            self.assertNotEqual(self.gate('success', result, 'full'), 0)
        self.assertNotEqual(self.gate('success', 'success', ''), 0)
        self.assertNotEqual(self.gate('success', 'failure', 'fast'), 0)
        for result in ['failure', 'skipped', 'cancelled', '']:
            self.assertNotEqual(self.gate('success', 'skipped', 'integration', result), 0)
        for tier in ['fast', 'full', 'integration']:
            self.assertNotEqual(self.gate('success', 'success', tier, 'failure'), 0)
