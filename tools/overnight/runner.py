#!/usr/bin/env python3
"""Bounded, fail-closed local Codex release orchestrator (POSIX, Python 3.9+)."""
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / '.local/overnight'
STOP = False


class Repairable(RuntimeError):
    """Evidence-backed test or CI failure eligible for bounded repair."""


def atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    with temp.open('w') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)


@contextlib.contextmanager
def lock(directory):
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / 'writer.lock').open('a+') as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError('another runner holds the single-writer lock') from exc
        yield


def log(event, **fields):
    with (STATE / 'events.jsonl').open('a') as stream:
        stream.write(json.dumps(dict(time=time.time(), event=event, **fields)) + '\n')


def terminate(signum, frame):
    global STOP
    STOP = True


def command(argv, deadline, env=None):
    """No shell, bounded children, inherited approvals; private local output only."""
    if STOP or (STATE / 'stop').exists() or time.time() >= deadline:
        raise RuntimeError('stopped or execution window expired')
    path = STATE / f'command-{time.time_ns()}.log'
    with path.open('w+') as stream:
        child = subprocess.Popen(argv, cwd=ROOT, stdin=subprocess.DEVNULL,
                                 stdout=stream, stderr=subprocess.STDOUT,
                                 env=env, start_new_session=True)
        atomic(STATE / 'active-child.json', dict(pid=child.pid, output=str(path)))
        log('command', argv=argv, pid=child.pid, output=str(path))
        try:
            while child.poll() is None:
                if STOP or (STATE / 'stop').exists() or time.time() >= deadline:
                    raise RuntimeError('interrupted; checkpoint retained')
                try:
                    child.wait(timeout=0.25)
                except subprocess.TimeoutExpired:
                    pass
        finally:
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGTERM)
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                    child.wait()
            (STATE / 'active-child.json').unlink(missing_ok=True)
        stream.seek(0)
        output = stream.read()
    if child.returncode:
        raise RuntimeError(f'command failed ({child.returncode}); inspect {path}')
    return output.strip()


def codex(model, effort, prompt):
    return ['codex', '-a', 'on-request', 'exec', '-s', 'workspace-write',
            '-m', model, '-c', f'model_reasoning_effort={effort}', '--json', prompt]


def release(task, deadline):
    """Recompute gates on recovery; never trust agent claims or stale evidence."""
    run = lambda argv: command(argv, deadline)
    if run(['git', 'status', '--porcelain']):
        raise RuntimeError('release requires clean committed worktree')
    sha = run(['git', 'rev-parse', 'HEAD'])
    try:
        for argv in task['local_tests']:
            run(argv)
        for script in ('typecheck', 'lint', 'format:check', 'build'):
            run(['npm', 'run', script])
    except RuntimeError as exc:
        raise Repairable(str(exc)) from exc
    if run(['git', 'rev-parse', 'HEAD']) != sha or run(['git', 'status', '--porcelain']):
        raise RuntimeError('local gates changed the candidate')
    run(['git', 'push', '--dry-run', 'origin', 'HEAD:main'])
    run(['git', 'push', 'origin', 'HEAD:main'])
    remote = run(['git', 'ls-remote', 'origin', 'refs/heads/main']).split()[0]
    if remote != sha:
        raise RuntimeError('remote SHA does not match candidate')
    # Poll with a subprocess wait interval; all waits remain deadline/stop bounded.
    while True:
        runs = json.loads(run(['gh', 'run', 'list', '--workflow', 'verify-deploy.yml',
                              '--commit', sha, '--json', 'databaseId,headSha,status,conclusion']))
        matching = [r for r in runs if r['headSha'] == sha]
        if matching and matching[0]['status'] == 'completed':
            result = matching[0]
            if result['conclusion'] != 'success':
                run(['gh', 'run', 'view', str(result['databaseId']), '--log-failed'])
                raise Repairable('exact-commit CI/Pages failed; failed-job log captured')
            details = json.loads(run(['gh', 'run', 'view', str(result['databaseId']), '--json', 'jobs']))
            if not any(j['name'] == 'deploy' and j['conclusion'] == 'success' for j in details['jobs']):
                raise RuntimeError('Pages deploy job not successful')
            break
        command([sys.executable, '-c', 'import time; time.sleep(15)'], deadline)
    run([sys.executable, 'tools/overnight/verify_hosted.py', task['hosted_url']])
    env = dict(os.environ, PLAYWRIGHT_BASE_URL=task['hosted_url'])
    for argv in task['hosted_tests']:
        command(argv, deadline, env)
    if run(['git', 'ls-remote', 'origin', 'refs/heads/main']).split()[0] != sha:
        raise RuntimeError('remote changed during hosted verification')
    log('release_passed', sha=sha, run=result['databaseId'])
    return sha


def validate(config):
    if not 0 < config['window_seconds'] <= 28800:
        raise RuntimeError('window must be within eight hours')
    if not config['tasks']:
        raise RuntimeError('no explicitly authorized tasks; W4 review is pending')
    for task in config['tasks']:
        for key in ('id', 'authorization', 'prompt', 'local_tests', 'hosted_tests', 'hosted_url'):
            if not task.get(key):
                raise RuntimeError(f'missing task {key}')
        if not task['hosted_url'].startswith('https://'):
            raise RuntimeError('hosted URL must use HTTPS')


def execute(config, resume):
    validate(config)
    fingerprint = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
    checkpoint = STATE / 'checkpoint.json'
    with lock(STATE):
        active = STATE / 'active-child.json'
        if active.exists():
            pid = json.loads(active.read_text())['pid']
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                active.unlink()
            else:
                raise RuntimeError(f'possible orphan child {pid}; inspect before resuming')
        if resume:
            state = json.loads(checkpoint.read_text())
            if state['config_hash'] != fingerprint:
                raise RuntimeError('config changed; review checkpoint before starting a new window')
        else:
            if checkpoint.exists():
                raise RuntimeError('checkpoint exists; resume or archive it explicitly')
            if subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT).strip():
                raise RuntimeError('dirty worktree; preserve or isolate unrelated changes first')
            state = dict(config_hash=fingerprint, deadline=time.time() + config['window_seconds'],
                         index=0, attempts=0, phase='develop', failures=[])
        (STATE / 'stop').unlink(missing_ok=True)
        atomic(checkpoint, state)
        try:
            while state['index'] < len(config['tasks']):
                task = config['tasks'][state['index']]
                if state['phase'] == 'develop':
                    if state['attempts'] >= config['max_attempts']:
                        raise RuntimeError('attempt limit reached; human review required')
                    escalation = state['attempts'] >= 2
                    model = config['escalation_model'] if escalation else config['model']
                    effort = config['escalation_reasoning'] if escalation else config['reasoning']
                    before = command(['git', 'rev-parse', 'HEAD'], state['deadline'])
                    state['attempts'] += 1
                    atomic(checkpoint, state)
                    prompt = (f"Read STATUS.md and AGENTS.md. Work ONLY on {task['id']}. "
                              f"Authorization: {task['authorization']}\n{task['prompt']}\n"
                              'Preserve unrelated edits. No next issue, no gate approval. '
                              'Diagnose failures with new evidence and alternative approaches. '
                              'Stop on permissions, quota, missing authorization or infrastructure blockers. '
                              'Run relevant tests and commit only verified scoped changes with the DBL ID. '
                              'Do not push; the runner independently gates publication. '
                              f"Prior failures: {state['failures'][-2:]} "
                              'Inspect local command logs for diagnosis; do not repeat an identical failed fix.')
                    command(codex(model, effort, prompt), min(state['deadline'], time.time() + 600))
                    after = command(['git', 'rev-parse', 'HEAD'], state['deadline'])
                    subject = command(['git', 'log', '-1', '--format=%s'], state['deadline'])
                    if after == before or task['id'] not in subject:
                        raise RuntimeError('agent did not create a scoped DBL commit')
                    state['phase'] = 'release'
                    atomic(checkpoint, state)
                try:
                    sha = release(task, state['deadline'])
                except Repairable as exc:
                    if STOP or (STATE / 'stop').exists() or time.time() >= state['deadline']:
                        raise RuntimeError('interrupted; release checkpoint retained') from exc
                    state['failures'].append(str(exc))
                    state['phase'] = 'develop'
                    atomic(checkpoint, state)
                    log('repair_required', reason=str(exc), attempt=state['attempts'])
                    continue
                state.update(index=state['index'] + 1, attempts=0, phase='develop', released=sha)
                atomic(checkpoint, state)
            state['phase'] = 'complete'
        except RuntimeError as exc:
            # Fail closed. Resumption is explicit, retaining release phase after interruption.
            state['failures'].append(str(exc))
            log('blocked', reason=str(exc))
            raise
        finally:
            atomic(checkpoint, state)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'resume', 'status', 'stop', 'retry'])
    args = parser.parse_args()
    STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.umask(0o077)
    if args.action == 'status':
        path = STATE / 'checkpoint.json'
        print(path.read_text() if path.exists() else 'Not started; no checkpoint.')
        return
    if args.action == 'stop':
        (STATE / 'stop').touch()
        print('Stop requested; runner terminates child and retains checkpoint.')
        return
    if args.action == 'retry':
        with lock(STATE):
            path = STATE / 'checkpoint.json'
            state = json.loads(path.read_text())
            if len(state['failures']) < 2:
                raise RuntimeError('escalation requires two evidence-bearing failed attempts')
            state['phase'] = 'develop'
            atomic(path, state)
        print('Repair queued; resume explicitly. Attempt/window limits remain unchanged.')
        return
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, terminate)
    config = json.loads((Path(__file__).parent / 'config.json').read_text())
    execute(config, args.action == 'resume')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        print(f'NOT READY: {error}', file=sys.stderr)
        sys.exit(1)
