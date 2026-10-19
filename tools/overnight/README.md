# Hollowbane overnight activation

The queue is configured; activation remains NOT READY until integration,
publication and real implementation-worktree permissions are verified.
No D00 or other gameplay development is performed during activation.

## Queue and dependencies

`config.json` names `tasks.json`; `runner.load_config()` loads all fifteen detailed
specifications. Each includes original DBL aliases/parent edges, scoped foundation
prerequisites, acceptance criteria, local/hosted checks, evidence and exclusions.
D00 validates the existing W4 release. D01–D14 depend on the preceding deliverable's
verified deployment SHA. Only D00 is initially eligible. Raw backlog numbering,
original dependency edges and broader partial/planned parent statuses are preserved.
These are explicitly authorized narrow slices: e.g. vendor buying/selling does not
claim repair/restock or the entire build benchmark prerequisite complete. The
`backlog_dependencies` list names the actual completed foundations needed by each
slice; `original_parent_dependencies` retains broader roadmap context unchanged.
The runner checks both scoped foundations and predecessor release evidence before
starting a task. No alias is a new DBL issue or authority to complete broader scope.

D01–D14 require task-specific unit and browser tests named in their specifications.
Those tests must be implemented alongside the deliverable; missing test files fail
the gate. They are not pre-created empty fixtures. Tests must assert the stated
acceptance criteria using real browser inputs and storage, with no completion
shortcuts. Screenshot review is required for visible changes. Physical controller
and native GPU limits remain explicit. D14 runs the integrated regression.

## Worktrees and publication safety

Activation branch/worktree:
`overnight/activation` at
`/Users/tobiasbertilsson/kod/hallowbane/.local/overnight-activation`.

Implementation branch/worktree:
`overnight/development` at
`/Users/tobiasbertilsson/kod/hallowbane/.local/overnight-development`.

Activation is tooling, never a gameplay candidate. The runner rejects execution
and release from any branch except `overnight/development`. Before starting it
fetches main, requires origin/main to be an ancestor, and requires its orchestrator
files to match origin/main. Thus activation tooling must first be reviewed and
integrated into main using a non-destructive fast-forward or merge. Inspect remote
divergence and preserve the original checkout's dirty documents; do not force,
reset, stash, clean, or merge through that dirty checkout. A safe fast-forward
push from a reviewed integration worktree is distinct from the runner publishing
an activation branch. Never publish an unreviewed activation candidate as gameplay.

Before unattended execution a verified local permissions receipt bound to this
worktree and configuration is also required under `.local/overnight/permissions.json`.
No receipt is manufactured from unit mocks or push dry-runs. A failed probe blocks
readiness. A branch permission probe cannot prove protected-main push permission;
that must be established by the actual authorized integration push and repository
policy inspection. No one-off approval here implies future unattended approval.

## Exact commands (after READY only)

```sh
cd /Users/tobiasbertilsson/kod/hallowbane/.local/overnight-development
mkdir -p .local
(umask 077; nohup python3 tools/overnight/runner.py start </dev/null >.local/overnight-launch.log 2>&1 &)
```

Monitor, stop and resume from that directory:

```sh
python3 tools/overnight/runner.py status
python3 tools/overnight/runner.py stop
(umask 077; nohup python3 tools/overnight/runner.py resume </dev/null >.local/overnight-launch.log 2>&1 &)
```

`nohup` handles terminal closure; the computer must remain awake and connected.
No daemon, login service or scheduled task is installed. Shell launch success is
not readiness: inspect status and `.local/overnight-launch.log` immediately.

Harmless preflight (does not invoke an agent or mutate gameplay/Git/publication):

```sh
python3 tools/overnight/runner.py dry-run
python3 -m unittest discover -s tools/overnight -p 'test_*.py'
```

Tooling-only publication verification, after integration and a genuine permission receipt:

```sh
python3 tools/overnight/runner.py verify-activation
```

This action runs the local tooling release checks and hosted baseline smoke without
Codex or D00. It records the exact deployment SHA only after CI/Pages/hosted gates
pass. Start/resume reject a receipt lacking that verified activation gate.

The dry run loads every deliverable, evaluates prerequisites, reports D00 next,
and selects Sol High. Tests cover invalid/wrong-SHA CI, skipped Pages, stale
artifacts and failed hosted smoke blocking release, checkpoint resume, actual
cross-process lock exclusion, cancellation, child termination and deadline.
Mocks are not deployment or network permission evidence.

## Models and resilience

Exact locally supported identifiers: `gpt-6.1-sol` with `high`, escalating to
`gpt-6-astra` with `max` only after two distinct evidence-bearing complex failed
approaches with different candidate commits. Formatting/configuration work does
not qualify. Resolution returns the next task to Sol High. Both pairs passed
real read-only CLI probes; permissions evidence must additionally exercise actual
tool use. No global model changes or Ultra/automatic delegation.

Existing rules, workspace sandbox and on-request approval requests remain in force.
The supported `--approve-for-me` flag routes eligible requests through automatic
review; it does not suppress approval. The explicit reviewed probe actually
exercised Git metadata writes, CI reads, remote authentication and a real harmless
probe-branch push. A rejected/unavailable/manual-only approval still blocks.
`workspace-write` never becomes full access. Permission/quota/network failures
stop for inspection. Do not suppress approvals to make unattended execution work.

The original eight-hour deadline persists across sessions; a sixty-second shutdown
margin prevents starting new work near expiry. Codex sessions are bounded to ten
minutes, with a cumulative 24-session cap. Stable diagnostic hashes exclude timing
noise. New conditions reset only the short sequence count; new diagnostics permit
continued investigation. Identical diagnostic recurrence stops. Cumulative history,
usage and deadline never reset. Config changes invalidate checkpoint/permission
bindings. Account limits remain in force; no paid services are introduced.

Private ignored `.local/overnight/` holds atomic checkpoints, structured logs and
active-child records. Worktree and common-repository OS locks enforce one writer.
Stop/SIGTERM/Ctrl-C terminate the active child group and checkpoint; SIGKILL follows
only after ten seconds without graceful exit. A crash may leave a child: resume
checks the recorded PID and blocks for inspection rather than risking a second
writer or killing a reused PID. Resume recomputes release gates. Completed/expired
windows require deliberate archival; never delete a live lock to start another run.

## Strict release evidence

Only the runner advances the queue, after relevant tests, TypeScript/lint/format,
production build, committed/pushed candidate, exact-SHA successful CI and successful
Pages deploy job, byte-identical hosted build and all specified hosted tests.
Remote/local SHA and clean state are checked again after hosted tests. The verified
SHA is stored under the completed Dxx checkpoint before the next task.
Pending, red, mismatched or unverifiable CI/Pages never advances. Documentation-only
main pushes follow the actual existing verify/deploy workflow, which also redeploys
the unchanged game; no fictitious tooling files are claimed as Pages artifacts.
Source tooling is verified through Git blobs separately from hosted game bytes.

See `activation-evidence.json` and STATUS.md for actual checks and remaining
blockers. These records must not be interpreted as a successful release gate.

Official CLI reference: [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).

Approval reviewer reference: [Sandbox and approval modes](https://learn.chatgpt.com/docs/sandboxing).
