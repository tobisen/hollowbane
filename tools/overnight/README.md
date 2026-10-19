# Hollowbane overnight preflight

Status: NOT READY for development. No overnight development has started.
W4 quality review remains pending; W5 is not authorized. The checked-in queue
is deliberately empty. Existing BACKLOG.md, STATUS.md and docs/items/l3.md edits
are unrelated and must be preserved.

## Commands

From the repository root, after explicit scope approval, a populated reviewed
queue, a clean worktree and successful preflight publication:

```sh
python3 tools/overnight/runner.py start
python3 tools/overnight/runner.py status
python3 tools/overnight/runner.py stop
python3 tools/overnight/runner.py resume
```

Run `start` in a terminal that will remain open. No daemon/service is installed.
`stop` requests graceful termination, also supported by Ctrl-C/SIGTERM. Resume
keeps the original eight-hour deadline, task index, attempt count and release
phase. It starts a fresh Codex session using disk checkpoints rather than relying
on model conversation memory. Codex CLI also supports `exec resume SESSION_ID`.
A completed/expired window requires explicitly archiving `.local/overnight/`
before starting a new one. Never remove a lock file to unlock a live runner.

```sh
python3 -m unittest discover -s tools/overnight -p 'test_*.py'
```

Nine tests use disposable state and mocked release operations; they never develop,
push or claim hosted evidence. They cover checkpoint restoration, real
cross-process lock exclusion, failed gate preventing push, interruption/resume,
active child termination, deadline and permission/model flags.

## Configuration and limits

Local runner defaults only: `gpt-6.1-sol`, `high`; escalation after two failed
attempts to `gpt-6-astra`, `max`, at most three development sessions per issue.
No global Codex settings are changed. The installed 0.163.0 catalog lists
Sol 6.1, Astra 6, Sol 6, Sol/Terra 5.6 with low/medium/high/xhigh/max/ultra;
Luna 6, Reserve and Auto Review list low/medium/high/xhigh/max. This is local
catalog evidence, not proof of account access to every model. Astra Max is a
configured complex-problem escalation candidate; its live read-only probe returned `ESCALATION_OK`. Ultra is avoided because it enables automatic delegation.

The eight-hour limit includes gates and repair. Each development session is
bounded to ten minutes. Existing account quotas and approval controls remain
in force; no paid service, full-access mode or approval bypass is added.
Noninteractive permissions that need a human may block; that is a stop condition.
The runner uses `on-request` and `workspace-write`, retaining existing config and
rules. It does not grant itself network or filesystem permissions.

Each task needs `id`, `authorization` (exact approved scope and stop gate),
`prompt`, nonempty `local_tests` and `hosted_tests` arrays of argument arrays,
and `hosted_url`. Use relevant local and hosted Playwright checks for UI changes,
and explicit hosted smoke checks even for tooling-only deliverables. Never add
W5 or infer authorization from dependency readiness. No shell command strings.

## Release and recovery

The agent commits one authorized task; the runner independently checks clean Git
state, relevant tests, typecheck, lint, formatting and build, pushes with a dry
run first, compares remote SHA, checks the exact-SHA workflow and successful
Pages deploy job, then runs required hosted checks. Only then advances the queue.
Hosted tests must assert the deployed runtime identity, not merely HTTP 200.
The runner compares every built publication file with its hosted bytes before smoke tests.

Local test/CI failures trigger bounded repair sessions with prior evidence and
instructions to change approach. CI failed-job output is captured. Infrastructure,
permission and usage failures stop for inspection; no gate is skipped. There is
no unbounded retry. `retry` can explicitly queue repair after two recorded
failures, without resetting the attempt or time limits. Green gates are recomputed
on recovery rather than trusted from an agent statement.

State lives under ignored `.local/overnight/`: atomic fsynced checkpoint JSON,
structured `events.jsonl`, command output and active-child record. The status
command gives a concise checkpoint summary. Logs are private local files and
are never committed; do not ask agents to print credentials. Only one runner
can hold the OS lock, which is released on process exit. SIGTERM terminates the
child process group, escalating to SIGKILL after ten seconds. A hard crash may
leave a child; resume detects its PID and stops for inspection. Verify that
process and terminate it safely before recovery; never kill a reused PID based
only on the record. Power-loss directory-fsync guarantees are not claimed.

## Evidence and remaining preflight gates

A real read-only `codex exec` with Sol 6.1 High returned `PREFLIGHT_OK`.
Nested sandbox startup was denied; a separately approved probe retained Codex's
read-only sandbox. Persistent resume returned `RESUME_OK`. No real gameplay development was permitted.

Before READY: run repository release checks, commit/push only tooling, verify that exact commit's
CI/Pages and hosted smoke. Keep unrelated local edits intact. A clean isolated
checkout may be used for release verification. Existing W4 publication evidence
cannot substitute for the preflight commit's release gate. Actual overnight
work also requires explicit scoped queue authorization after W4 review.

Official CLI guidance: [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).
Installed `codex --help` and `codex exec --help` are the source of verified flags.
