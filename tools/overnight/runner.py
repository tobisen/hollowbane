#!/usr/bin/env python3
"""Bounded, fail-closed local Codex release orchestrator (POSIX, Python 3.9+)."""
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
import re
from pathlib import Path
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / '.local/overnight'
STOP = False


class Repairable(RuntimeError):
    """A stable failure condition with diagnostic evidence, not a log pathname."""
    def __init__(self, message, condition=None, evidence=None):
        super().__init__(message)
        self.condition = condition or message
        self.evidence = evidence or message
        self.complex = False


class CommandFailure(RuntimeError):
    def __init__(self, argv, output, path):
        super().__init__(f'command failed; inspect {path}')
        self.argv, self.output = argv, output


def diagnostic(output):
    # Only diagnostics count as new evidence; timestamps/durations/temp paths do not.
    lines = [line for line in output.splitlines()
             if re.search(r'FAIL|Error|error:|Assertion|expected|Expected|failed|✘|×', line)]
    text = '\n'.join(lines) or 'command failed without diagnostic evidence'
    text = re.sub(r'\x1b\[[0-9;]*m', '', text)
    text = re.sub(r'\b\d+(?:\.\d+)?(?:ms|s)\b', '<duration>', text)
    text = re.sub(r'20\d\d-\d\d-\d\dT[\d:.]+Z', '<time>', text)
    text = re.sub(r'/[^\s:]+/(?:test-results|tmp)/[^\s]+', '<temporary-path>', text)
    return hashlib.sha256(text.encode()).hexdigest()


def record_failure(state, failure, config):
    history = state.setdefault('history', [])
    entry = dict(task=state['index'], attempt=state['attempts'],
                 condition=failure.condition, evidence=failure.evidence, time=time.time(),
                 complex=failure.complex, candidate=state.get('candidate'))
    prior = [h for h in history if h['task'] == state['index']]
    repeated = any(h['condition'] == entry['condition'] and
                   h['evidence'] == entry['evidence'] for h in prior)
    if prior and prior[-1]['condition'] == entry['condition']:
        state['sequence_attempts'] = state.get('sequence_attempts', 0) + 1
    else:
        state['sequence_attempts'] = 1
    history.append(entry)
    state['failures'].append(str(failure))
    if repeated:
        raise RuntimeError('identical diagnostic failure repeated; human review required')
    # New evidence allows continuation, but never resets cumulative usage or deadline.
    if state.get('total_attempts', state['attempts']) >= config.get('max_total_attempts', 24):
        raise RuntimeError('cumulative attempt limit reached')



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


def repository_lock():
    common = Path(subprocess.check_output(
        ['git', 'rev-parse', '--git-common-dir'], cwd=ROOT, text=True).strip())
    if not common.is_absolute():
        common = ROOT / common
    return common.resolve().parent / '.local' / 'overnight-repository-lock'


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
        raise CommandFailure(argv, output, path)
    return output.strip()


def codex(model, effort, prompt):
    return ['codex', '--approve-for-me', 'exec', '-s', 'workspace-write',
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
    except CommandFailure as exc:
        if re.search(r'permission denied|operation not permitted|approval|usage limit|rate limit|quota|ENETUNREACH|ENOTFOUND|error connecting|could not resolve', exc.output, re.I):
            raise RuntimeError('permission, usage or network blocker; inspect command log') from exc
        failure = Repairable(str(exc), json.dumps(exc.argv), diagnostic(exc.output))
        failure.complex = any(word in exc.argv for word in ('vitest', 'playwright', 'test'))
        raise failure from exc
    if run(['git', 'rev-parse', 'HEAD']) != sha or run(['git', 'status', '--porcelain']):
        raise RuntimeError('local gates changed the candidate')
    branch = run(['git', 'branch', '--show-current'])
    if branch != 'overnight/development':
        raise RuntimeError('activation branch must never publish itself as gameplay')
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
                output = run(['gh', 'run', 'view', str(result['databaseId']), '--log-failed'])
                if result['conclusion'] != 'failure':
                    raise RuntimeError('CI cancelled or unavailable; no automatic code repair')
                failure = Repairable('exact-commit CI/Pages failed; failed-job log captured',
                                     'CI verify-deploy', diagnostic(output))
                failure.complex = bool(re.search(r'FAIL|AssertionError|tests/e2e', output))
                raise failure
            details = json.loads(run(['gh', 'run', 'view', str(result['databaseId']), '--json', 'jobs']))
            if not any(j['name'] == 'deploy' and j['conclusion'] == 'success' for j in details['jobs']):
                raise RuntimeError('Pages deploy job not successful')
            break
        command([sys.executable, '-c', 'import time; time.sleep(15)'], deadline)
    run([sys.executable, 'tools/overnight/verify_hosted.py', task['hosted_url']])
    env = dict(os.environ, PLAYWRIGHT_BASE_URL=task['hosted_url'])
    for argv in task['hosted_tests']:
        command(argv, deadline, env)
    if (run(['git', 'ls-remote', 'origin', 'refs/heads/main']).split()[0] != sha
            or run(['git', 'rev-parse', 'HEAD']) != sha
            or run(['git', 'status', '--porcelain'])):
        raise RuntimeError('candidate changed during hosted verification')
    log('release_passed', sha=sha, run=result['databaseId'])
    return sha


def load_config():
    directory = Path(__file__).parent
    config = json.loads((directory / 'config.json').read_text())
    queue = directory / config['queue_file']
    if queue.resolve().parent != directory.resolve():
        raise RuntimeError('queue must be version-controlled beside config')
    config['tasks'] = json.loads(queue.read_text())
    for task in config['tasks']:
        task['specification'] = json.dumps(task, ensure_ascii=False)
        task['prompt'] = task['specification']
    validate(config)
    return config


def prerequisites(task, state):
    completed = state.get('completed', {})
    missing = [dep for dep in task.get('dependencies', []) if not completed.get(dep)]
    records = {record['id']: record for record in
               json.loads((ROOT / 'docs/backlog.json').read_text())}
    missing.extend(dep for dep in task.get('backlog_dependencies', [])
                   if records.get(dep, {}).get('status') not in ('completed', 'complete'))
    return missing


def model_for(config, state):
    history = [entry for entry in state.get('history', [])
               if entry['task'] == state['index'] and entry.get('complex')]
    approaches = {entry.get('candidate') for entry in history if entry.get('candidate')}
    evidence = {entry['evidence'] for entry in history}
    escalate = len(approaches) >= 2 and len(evidence) >= 2
    return ((config['escalation_model'], config['escalation_reasoning']) if escalate
            else (config['model'], config['reasoning']))


def execution_worktree(config, deadline, require_release=True):
    branch = command(['git', 'branch', '--show-current'], deadline)
    if branch != config['implementation_branch']:
        raise RuntimeError('execution/publication forbidden from activation or unrelated branch')
    command(['git', 'fetch', 'origin', 'main'], deadline)
    command(['git', 'merge-base', '--is-ancestor', 'origin/main', 'HEAD'], deadline)
    command(['git', 'diff', '--exit-code', 'origin/main', '--', 'tools/overnight'], deadline)
    receipt = json.loads((STATE / 'permissions.json').read_text())
    expected = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
    if (receipt.get('worktree') != str(ROOT) or receipt.get('config_hash') != expected
            or not receipt.get('verified')):
        raise RuntimeError('actual execution-worktree permission verification is missing or stale')
    if require_release and not receipt.get('activation_release_verified'):
        raise RuntimeError('activation CI/Pages/hosted gate is not yet verified; D00 must not start')
    if require_release:
        command(['git', 'merge-base', '--is-ancestor', receipt['deployment_sha'], 'HEAD'], deadline)


def validate(config):
    if not 0 < config['window_seconds'] <= 28800:
        raise RuntimeError('window must be within eight hours')
    if not config['tasks']:
        raise RuntimeError('no explicitly authorized tasks')
    identifiers = [task['id'] for task in config['tasks']]
    if len(set(identifiers)) != len(identifiers):
        raise RuntimeError('duplicate queue IDs')
    for position, task in enumerate(config['tasks']):
        if any(dep not in identifiers[:position] for dep in task.get('dependencies', [])):
            raise RuntimeError('task dependency must reference an earlier deliverable')
        if task.get('blocked') or not task.get('specification'):
            raise RuntimeError(f"{task['id']}: approved specification missing; queue blocked")
        for key in ('id', 'authorization', 'prompt', 'local_tests', 'hosted_tests', 'hosted_url'):
            if not task.get(key):
                raise RuntimeError(f'missing task {key}')
        if not task['hosted_url'].startswith('https://'):
            raise RuntimeError('hosted URL must use HTTPS')


def execute(config, resume):
    validate(config)
    fingerprint = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
    checkpoint = STATE / 'checkpoint.json'
    with lock(STATE), lock(repository_lock()):
        execution_worktree(config, time.time() + 120)
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
                         index=0, attempts=0, total_attempts=0, sequence_attempts=0,
                         phase='develop', failures=[], history=[], completed={})
        (STATE / 'stop').unlink(missing_ok=True)
        atomic(checkpoint, state)
        try:
            while state['index'] < len(config['tasks']):
                task = config['tasks'][state['index']]
                missing = prerequisites(task, state)
                if missing:
                    raise RuntimeError(f'unsatisfied prerequisites: {missing}')
                if time.time() >= state['deadline'] - config.get('shutdown_margin_seconds', 60):
                    raise RuntimeError('shutdown margin reached; checkpoint preserved')
                if state['phase'] == 'develop':
                    if state.get('total_attempts', state['attempts']) >= config.get('max_total_attempts', 24):
                        raise RuntimeError('attempt limit reached; human review required')
                    model, effort = model_for(config, state)
                    before = command(['git', 'rev-parse', 'HEAD'], state['deadline'])
                    state['attempts'] += 1
                    state['total_attempts'] = state.get('total_attempts', 0) + 1
                    atomic(checkpoint, state)
                    prompt = (f"Read STATUS.md and AGENTS.md. Work ONLY on {task['id']}. "
                              f"Authorization: {task['authorization']}\n{task['prompt']}\n"
                              'Preserve unrelated edits. No next issue, no gate approval. '
                              'Diagnose failures with new evidence and alternative approaches. '
                              'For known Git metadata/network sandbox limits request narrow supported approval from the configured reviewer. '
                              'Stop on rejected/unavailable/human-only approvals, quota, missing authorization or infrastructure blockers. '
                              'Run relevant tests and commit verified scoped changes; title MUST include this Dxx ID and its existing DBL ID. '
                              'Do not push; the runner independently gates publication. '
                              f"Prior failures: {state['failures'][-2:]} "
                              'Inspect local command logs for diagnosis; do not repeat an identical failed fix.')
                    command(codex(model, effort, prompt), min(state['deadline'] - config.get('shutdown_margin_seconds', 60), time.time() + 600))
                    after = command(['git', 'rev-parse', 'HEAD'], state['deadline'])
                    subject = command(['git', 'log', '-1', '--format=%s'], state['deadline'])
                    if (after == before or task['id'] not in subject
                            or (task.get('backlog_ids') and not any(
                                identifier in subject for identifier in task['backlog_ids']))):
                        raise RuntimeError('agent did not create a scoped DBL commit')
                    state['candidate'] = after
                    state['phase'] = 'release'
                    atomic(checkpoint, state)
                try:
                    sha = release(task, state['deadline'])
                except Repairable as exc:
                    if STOP or (STATE / 'stop').exists() or time.time() >= state['deadline']:
                        raise RuntimeError('interrupted; release checkpoint retained') from exc
                    record_failure(state, exc, config)
                    state['phase'] = 'develop'
                    atomic(checkpoint, state)
                    log('repair_required', reason=str(exc), attempt=state['attempts'])
                    continue
                state.setdefault('completed', {})[task['id']] = sha
                state.update(index=state['index'] + 1, attempts=0, sequence_attempts=0,
                             phase='develop', released=sha)
                atomic(checkpoint, state)
            state['phase'] = 'complete'
        except RuntimeError as exc:
            # Fail closed. Resumption is explicit, retaining release phase after interruption.
            state['failures'].append(str(exc))
            log('blocked', reason=str(exc))
            raise
        finally:
            atomic(checkpoint, state)


def verify_activation(config):
    """Release this tooling only. Never invokes Codex or executes a Dxx task."""
    deadline = time.time() + 1800
    with lock(STATE), lock(repository_lock()):
        execution_worktree(config, deadline, require_release=False)
        task = dict(local_tests=[[sys.executable, '-m', 'unittest', 'discover',
                                 '-s', 'tools/overnight', '-p', 'test_*.py']],
                    hosted_url='https://tobisen.github.io/hollowbane/',
                    hosted_tests=[['npx', 'playwright', 'test', 'tests/e2e/world-minimap.spec.ts']])
        sha = release(task, deadline)
        receipt = json.loads((STATE / 'permissions.json').read_text())
        receipt.update(activation_release_verified=True, deployment_sha=sha)
        atomic(STATE / 'permissions.json', receipt)
        print(json.dumps(dict(status='READY', deployment_sha=sha, gameplay_started=False)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'resume', 'status', 'stop', 'dry-run', 'verify-activation'])
    args = parser.parse_args()
    STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.umask(0o077)
    if args.action == 'status':
        path = STATE / 'checkpoint.json'
        if path.exists():
            state = json.loads(path.read_text())
            print(json.dumps({key: state.get(key) for key in
                              ('index', 'phase', 'attempts', 'total_attempts', 'deadline', 'released')}))
        else:
            print('Not started; no checkpoint.')
        return
    if args.action == 'stop':
        (STATE / 'stop').touch()
        print('Stop requested; runner terminates child and retains checkpoint.')
        return
    if args.action == 'dry-run':
        config = load_config()
        print(json.dumps(dict(mode='dry-run', gameplay_started=False,
                              deliverables=len(config['tasks']), model=config['model'],
                              reasoning=config['reasoning'],
                              escalation=config['escalation_model'],
                              window_seconds=config['window_seconds'],
                              next_task=config['tasks'][0]['id'],
                              ready=[t['id'] for t in config['tasks'] if not prerequisites(t, {})],
                              pending=[t['id'] for t in config['tasks'] if prerequisites(t, {})],
                              default_strategy=model_for(config, {'index': 0}))))
        validate(config)
        print('Queue valid. No agent, Git mutation or publication executed.')
        return
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, terminate)
    config = load_config()
    if args.action == 'verify-activation':
        verify_activation(config)
    else:
        execute(config, args.action == 'resume')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        print(f'NOT READY: {error}', file=sys.stderr)
        sys.exit(1)
