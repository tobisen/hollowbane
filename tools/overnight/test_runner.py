"""Offline orchestration tests: no agent, gameplay, network, or publication."""
import importlib.util
import json
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('runner', Path(__file__).with_name('runner.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old = r.STATE
        r.STATE = Path(self.temp.name)
        r.STOP = False
        self.repo_lock = patch.object(r, 'repository_lock', return_value=r.STATE / 'repository')
        self.repo_lock.start()

    def tearDown(self):
        self.repo_lock.stop()
        r.STATE = self.old
        r.STOP = False
        self.temp.cleanup()

    def test_checkpoint_atomic_restore(self):
        state = dict(index=2, phase='release', deadline=123, attempts=1)
        r.atomic(r.STATE / 'checkpoint.json', state)
        self.assertEqual(json.loads((r.STATE / 'checkpoint.json').read_text()), state)
        self.assertFalse((r.STATE / 'checkpoint.tmp').exists())

    def test_single_writer_cross_process(self):
        with r.lock(r.STATE):
            code = (f"import sys;sys.path.insert(0,{str(Path(__file__).parent)!r});"
                    f"import runner;from pathlib import Path;"
                    f"ctx=runner.lock(Path({str(r.STATE)!r}));ctx.__enter__()")
            child = subprocess.run([sys.executable, '-c', code], capture_output=True)
            self.assertNotEqual(child.returncode, 0)
            self.assertIn(b'single-writer', child.stderr)
        with r.lock(r.STATE):
            pass

    def test_failed_gate_never_pushes(self):
        calls = []
        def fake(argv, deadline, env=None):
            calls.append(argv)
            if argv[:2] == ['git', 'status']:
                return ''
            if argv[:2] == ['git', 'rev-parse']:
                return 'abc'
            raise r.CommandFailure(argv, 'FAIL targeted assertion', 'test.log')
        with patch.object(r, 'command', fake), self.assertRaises(RuntimeError):
            r.release({'local_tests': [['false']]}, time.time() + 10)
        self.assertFalse(any('push' in c for c in calls))

    def test_interruption_retains_release_phase_and_resumes(self):
        config = dict(window_seconds=100, tasks=[dict(id='DBL-test', authorization='test',
                      prompt='no gameplay', local_tests=[['true']], hosted_tests=[['true']],
                      hosted_url='https://example.test', specification='approved test fixture')], max_attempts=3,
                      model='gpt-6.1-sol', reasoning='high', escalation_model='gpt-6-astra',
                      escalation_reasoning='max')
        with patch.object(r.subprocess, 'check_output', return_value=b''), \
             patch.object(r, 'command', side_effect=['before', '', 'after', 'DBL-test: verified']), \
             patch.object(r, 'release', side_effect=RuntimeError('simulated interruption')):
            with self.assertRaises(RuntimeError):
                r.execute(config, False)
        state = json.loads((r.STATE / 'checkpoint.json').read_text())
        deadline = state['deadline']
        self.assertEqual(state['phase'], 'release')
        with patch.object(r, 'command', side_effect=AssertionError('must not redevelop')), \
             patch.object(r, 'release', return_value='verified'):
            r.execute(config, True)
        restored = json.loads((r.STATE / 'checkpoint.json').read_text())
        self.assertEqual(restored['phase'], 'complete')
        self.assertEqual(restored['deadline'], deadline)

    def test_graceful_termination_and_deadline(self):
        r.terminate(signal.SIGTERM, None)
        with self.assertRaises(RuntimeError):
            r.command([sys.executable, '-c', 'raise Exception()'], time.time() + 1)
        r.STOP = False
        with self.assertRaises(RuntimeError):
            r.command([sys.executable, '-c', 'pass'], time.time() - 1)

    def test_signal_terminates_active_child(self):
        import threading
        timer = threading.Timer(0.1, lambda: r.terminate(signal.SIGTERM, None))
        started = time.monotonic()
        timer.start()
        try:
            with self.assertRaises(RuntimeError):
                r.command([sys.executable, '-c', 'import signal;signal.pause()'], time.time() + 5)
        finally:
            timer.join()
        self.assertLess(time.monotonic() - started, 2)

    def test_model_and_security_flags(self):
        argv = r.codex('gpt-6.1-sol', 'high', 'preflight')
        self.assertIn('model_reasoning_effort=high', argv)
        self.assertIn('workspace-write', argv)
        self.assertIn('on-request', argv)
        self.assertFalse(any('bypass' in word for word in argv))

    def test_hosted_identity_rejects_stale_bytes(self):
        import io
        hosted_spec = importlib.util.spec_from_file_location(
            'hosted', Path(__file__).with_name('verify_hosted.py'))
        hosted = importlib.util.module_from_spec(hosted_spec)
        hosted_spec.loader.exec_module(hosted)
        (r.STATE / 'index.html').write_bytes(b'current')
        with patch.object(hosted, 'urlopen', return_value=io.BytesIO(b'stale')):
            with self.assertRaisesRegex(RuntimeError, 'mismatch'):
                hosted.verify('https://example.test', r.STATE)

    def test_retry_evidence_and_cumulative_history(self):
        state = dict(index=0, attempts=2, total_attempts=5, failures=[], history=[], deadline=42)
        config = dict(max_total_attempts=24)
        r.record_failure(state, r.Repairable('first', 'test-a', 'evidence-a'), config)
        r.record_failure(state, r.Repairable('progress', 'test-a', 'evidence-b'), config)
        self.assertEqual(state['sequence_attempts'], 2)
        r.record_failure(state, r.Repairable('new condition', 'test-b', 'evidence-c'), config)
        self.assertEqual(state['sequence_attempts'], 1)
        self.assertEqual(state['total_attempts'], 5)
        self.assertEqual(state['deadline'], 42)
        with self.assertRaisesRegex(RuntimeError, 'identical'):
            r.record_failure(state, r.Repairable('again', 'test-a', 'evidence-a'), config)
        self.assertEqual(len(state['history']), 4)

    def test_diagnostic_ignores_timing_noise(self):
        self.assertEqual(r.diagnostic('FAIL foo 32ms'), r.diagnostic('FAIL foo 99ms'))
        self.assertNotEqual(r.diagnostic('FAIL foo'), r.diagnostic('FAIL bar'))

    def test_ci_pages_and_hosted_gates_are_mandatory(self):
        task = dict(local_tests=[['targeted']], hosted_url='https://example.test',
                    hosted_tests=[['hosted-smoke']])
        for failure in ('wrong-sha', 'ci', 'pages', 'artifact', 'smoke', None):
            calls = []
            def fake(argv, deadline, env=None):
                calls.append(argv)
                if argv[:2] == ['git', 'status']:
                    return ''
                if argv[:2] == ['git', 'rev-parse']:
                    return 'candidate'
                if argv[:2] == ['git', 'ls-remote']:
                    return 'candidate refs/heads/main'
                if argv[:3] == ['gh', 'run', 'list']:
                    return json.dumps([dict(headSha='other' if failure == 'wrong-sha' else 'candidate',
                                           databaseId=1, status='completed',
                                           conclusion='failure' if failure == 'ci' else 'success')])
                if argv[:3] == ['gh', 'run', 'view']:
                    if '--log-failed' in argv:
                        return 'FAIL real test'
                    return json.dumps(dict(jobs=[dict(name='deploy',
                            conclusion='skipped' if failure == 'pages' else 'success')]))
                if 'verify_hosted.py' in ' '.join(argv) and failure == 'artifact':
                    raise RuntimeError('stale artifact')
                if argv == ['hosted-smoke'] and failure == 'smoke':
                    raise RuntimeError('hosted smoke failed')
                if failure == 'wrong-sha' and 'import time; time.sleep(15)' in argv:
                    raise RuntimeError('correct commit unavailable')
                return ''
            with patch.object(r, 'command', fake):
                if failure:
                    with self.assertRaises(RuntimeError):
                        r.release(task, time.time() + 10)
                else:
                    self.assertEqual(r.release(task, time.time() + 10), 'candidate')
            if failure in ('ci', 'pages', 'wrong-sha', 'artifact'):
                self.assertNotIn(['hosted-smoke'], calls)

    def test_empty_authorization_queue_blocks(self):
        with self.assertRaises(RuntimeError):
            r.validate(dict(window_seconds=28800, tasks=[]))


if __name__ == '__main__':
    unittest.main()
