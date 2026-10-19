# Overnight activation checkpoint

NOT READY. No gameplay or unattended development has started.
The user authorized D00–D14, but the approved specifications are absent from the
repository and available conversation. Configuration contains 15 blocked slots,
zero executable deliverables. Do not infer their scope from W5 or other backlog
records. Supply each approved specification, acceptance criteria, DBL mapping,
local tests and hosted smoke commands before unblocking the queue.

Activation changes live in the isolated `overnight/activation` branch/worktree:
`/Users/tobiasbertilsson/kod/hallowbane/.local/overnight-activation`.
The original BACKLOG.md, STATUS.md and docs/items/l3.md edits remain untouched.
The parent checkout's main branch must be reconciled normally after publication;
never reset it, stash, or discard those documents to start the runner.

## Exact commands

These commands are documented only; setup does not run them. They currently
stop at the missing-specification guard. Start only after all activation and
permission checks pass, from this directory:

```sh
cd /Users/tobiasbertilsson/kod/hallowbane/.local/overnight-activation
mkdir -p .local
(umask 077; nohup python3 tools/overnight/runner.py start </dev/null >.local/overnight-launch.log 2>&1 &)
```

`nohup` handles terminal closure; ordinary foreground execution does not.
The computer must remain awake and connected. No daemon, login service or
scheduled task is installed. Do not confuse shell launch success with readiness:
inspect status and the launch log immediately. Missing approvals stop execution.

Monitor:

```sh
python3 tools/overnight/runner.py status
tail -n 20 .local/overnight/events.jsonl
```

Stop safely:

```sh
python3 tools/overnight/runner.py stop
```

Resume the same window after inspecting its checkpoint and failures:

```sh
(umask 077; nohup python3 tools/overnight/runner.py resume </dev/null >.local/overnight-launch.log 2>&1 &)
```

Dry run, with no Codex invocation, Git mutation, publication or gameplay:

```sh
python3 tools/overnight/runner.py dry-run
python3 -m unittest discover -s tools/overnight -p 'test_*.py'
```

Dry run intentionally exits nonzero until every specification is resolved.
It reports model strategy, deliverable slots, deadline and the first blocker.

## Models, permissions and limits

Default `gpt-6.1-sol` / `high`; escalation after two unsuccessful development
sessions to `gpt-6-astra` / `max`. Both model/effort pairs are present in the
installed CLI catalog and passed real read-only probes in the original preflight.
No global model configuration changes. No Ultra/automatic delegation.

Existing sandbox/rules and `on-request` approvals are retained with
`workspace-write`. No full-access or approval-bypass flags. Authentication is not
proof of permission: unattended Git commit/push, network, and Codex tool access
must be verified in this worktree before activation. An approval request that
cannot be handled unattended is a blocker, not a reason to weaken protections.

The original eight-hour deadline persists through interruption and retry. Each
Codex development session has a ten-minute bound; the entire run has a cumulative
24-session resource cap. Account usage/quota controls still apply.

## Evidence-driven repair and release gates

Failures retain stable command/CI condition IDs and normalized diagnostic hashes,
not timestamped log filenames. A new condition resets only the short sequence
counter. New diagnostics within a condition permit continued investigation;
identical diagnostic recurrence stops, even after intervening different failures.
Cumulative history/session usage/deadline never reset. Two failed development
sessions select Astra Max. Quota, permission and network blockers stop; cancelled
CI is not treated as a gameplay defect. No manual retry command can clear history.

The existing runner architecture independently gates each candidate: clean
scoped commit, relevant local tests, TypeScript, lint, formatting, production
build, push dry-run/push, remote SHA equality, exact-commit successful workflow,
successful Pages deploy job, byte-for-byte identity of every built published file,
and required hosted smoke checks. Remote and local candidate identity/cleanliness
are checked again afterward. Queue advancement follows only a complete release.
Tests explicitly cover wrong-SHA CI, failed CI, skipped Pages, stale artifact and
failed hosted smoke blocking release; mocked passes are not deployment evidence.

Every task needs `id`, `authorization`, `specification`, `prompt`, nonempty
`local_tests`/`hosted_tests` arrays of argv arrays, and HTTPS `hosted_url`.
Resolve the Dxx-to-DBL mapping explicitly in its specification and prompt; scoped
commits must include the configured task ID. No shell command strings.

## Checkpoints and recovery

Private ignored `.local/overnight/` stores atomic fsynced checkpoint JSON,
structured event history and command logs. OS `flock` excludes concurrent runners in this execution worktree and a second
shared lock derived from the Git common directory excludes runners in sibling
worktrees using this runner version. Never delete a live lock.
SIGTERM/Ctrl-C/stop file terminate the active child process group and retain state;
SIGKILL follows after ten seconds only if graceful termination fails. A hard crash
can leave a child: resume detects its PID and blocks for inspection. Never kill a
reused PID based only on a stale record. Resume recomputes release evidence rather
than trusting model claims. Config changes require explicit checkpoint review;
expired/completed windows require deliberate archival before a new run.

## Publication evidence

Commit `35ab99bfb11c26e06c43dcac3857ab3abc7b6da6` was pushed.
Workflow `39326566635` passed repository checks/formatting and was still running
browser tests at activation inspection; do not claim its Pages release yet.
Source tooling is published in Git, not served directly by Vite/Pages. Pages
publishes the game build; verify source Git blob identities and Pages build
identities separately. This activation update also needs its own commit release
verification before READY. No previous runtime deployment substitutes for it.

Official CLI guidance: [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).
