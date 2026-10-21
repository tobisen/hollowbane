# DBL-010 — measured release pipeline

The D07-B and D08-A release gates were complete before this work. This increment changes release infrastructure only; gameplay, existing assertions, snapshots, timeouts, Phaser 4.2.1 and lockfile dependencies are unchanged. One existing encounter driver now confirms real mouse acquisition before its unchanged kill/save assertions, following the failure documented below.

## Baseline

GitHub step timestamps (seconds, rounded to whole seconds) and existing hosted JSON reports:

| Measurement                                              | D07-B / 39497061101 | D08-A / 39548208049 |
| -------------------------------------------------------- | ------------------: | ------------------: |
| Commit                                                   |             6729315 |             5f086ef |
| Workflow creation → completion                           |              34m14s |              26m02s |
| npm ci                                                   |                  5s |                  4s |
| check: TypeScript, lint, units, validators, build        |                120s |                 86s |
| Format                                                   |                  8s |                  7s |
| Browser/system dependency installation                   |                 45s |                 46s |
| Main Chromium, including redundant server build          |   1702s / 141 cases |   1252s / 143 cases |
| Required compatibility, including redundant server build |     130s / 15 cases |     107s / 15 cases |
| Pages artifact upload                                    |                  2s |                  1s |
| Pages deployment step                                    |                 22s |                 33s |
| Separate hosted boss scenarios                           |   46.269s / 4 cases |   32.538s / 2 cases |

Workflow totals include queue/setup/transfer overhead but exclude the formerly manual hosted checks. The D08 check step includes 65.21s of units and approximately 11s of production build/typecheck (Vite itself 6.43s). Browser tests dominate; npm installation is already fast and cached. Before this change, `check` builds once, then each of the two Playwright invocations builds again. Their build/start costs are included above, not claimed as separately measured savings. D07-B's additional three-pattern hosted strike audit took 34.774s.

Sources: [D07-B run](https://github.com/tobisen/hollowbane/actions/runs/39497061101), [D08-A run](https://github.com/tobisen/hollowbane/actions/runs/39548208049), recorded D07/D08 release evidence in their issue documents. The two baselines have different test counts and runner conditions; they are observations, not a controlled speedup experiment.

## Required release graph

1. `checks`: existing Python orchestrator tests/dry-run (never starts that orchestrator), new release integrity/gate tests, full `npm run check`, format and actual test-collection coverage validation. Build once; seal `dist/release.json` with the full GitHub commit SHA and SHA-256 of every production file; upload immutable `release-bundle`.
2. In parallel: Chromium shards 1/2 and 2/2, and all existing required inventory compatibility cases in Chromium/Firefox/WebKit. Every runner downloads and validates the same bundle. Preview serves it without a build.
3. Existing `verify` check waits for all required jobs and explicitly rejects failed/canceled/skipped results. Only successful verification may upload that same bundle as `github-pages`.
4. `deploy` retains the sole Pages/OIDC write permissions. Pull requests cannot publish.
5. `hosted-smoke` verifies full SHA, exact manifest and every artifact byte, then application load plus both existing D08 boss scenarios verbatim: genuine keyboard/mouse fight through phases/death/save isolation, and virtual controller lock/skill damage. Both input paths are retained because they were the current deliverable's release-critical flows. No unrelated hosted regression is repeated. Workflow success now includes hosted acceptance; deployment success alone is insufficient.

Do not begin another deliverable until this exact commit's full workflow, Pages identity and hosted smoke are green. A hosted failure marks the workflow failed after deployment; it does not roll back automatically. Concurrency still cancels superseded runs, so a canceled run is never release evidence.

## Balance and isolation

`browser-durations.json` initially used the successful D08 run (predicted 602.539s/601.433s). It now uses successful file measurements from the traced diagnostic run; the failing encounter file keeps its prior successful D08 weight rather than incorporating timeout time. Longest-first deterministic assignment uses these measured weights; they are not guaranteed CI runtimes. Files stay intact with one worker each; no extra within-run parallelism, shared browser context, external save account or snapshot update. Fresh browser contexts, seed fixtures and runner-local IndexedDB remain isolated. New spec files are recursively discovered and always included, with a default 60s weight until measured. `test:release:coverage` compares actual unsharded Playwright collection with both shards, rejecting gaps/overlap. The initial split was 84 + 59 = 143 cases; a measured profile refresh can change per-shard counts while the coverage validator requires the same union; compatibility remains exactly 15. All 473 existing units remain mandatory, with two new shard cases and separate Python integrity/gate cases.

Ubuntu is pinned to 24.04, matching both baseline runs; npm lockfile, viewport, software renderer flags and snapshots are preserved. npm download caching stays enabled in every Node job; `npm ci` always recreates dependencies. Browser binaries are installed by the lockfile-resolved Playwright version (currently 1.64.1), with system libraries. Browser cache and a new container were evaluated but not adopted: installation is under a minute, caching still requires system dependencies and can cost as much as download; a container would change the snapshot environment. See [Playwright's browser caching guidance](https://playwright.dev/docs/ci#caching-browsers) and [sharding guidance](https://playwright.dev/docs/test-sharding). Revisit only with measured evidence.

## Test tiers

| Tier      | Commands and scope                                                                                                                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fast      | `npm run test:fast -- <relevant.test.ts>` and `npm run typecheck`; relevant lint and focused browser checks for infrastructure/UI changes. No default full local CI repeat.                                                                                                                                              |
| release   | This workflow: all units/static/format/validators/tooling, every main Chromium case (including current campaign, bosses, controllers, saves and Linux snapshots), the existing 15 compatibility cases, one build, exact artifact deployment and three hosted smoke cases. Nothing formerly mandatory moved to milestone. |
| milestone | Release plus `npm run test:milestone` (existing broader Firefox/WebKit regression config), and risk-selected campaign/browser suites or hardware checks. Campaign contracts already mandatory in main Chromium remain there. Physical controller evidence cannot be inferred from virtual tests.                         |

Change `playwright.release.config.ts` explicitly when a later authorized deliverable needs another hosted critical flow. Preserve deeper regression in release; add hosted scenarios only for identified deployment/browser risks.

## Diagnostics and measurements

Named matrix jobs and list/GitHub reporters identify failing files/cases. No retry masks failures. Traces are retained on failure; automatic screenshots only on failure. Existing explicit screenshots still run, but passing image/trace artifacts are not uploaded. Each browser job retains a machine-readable JSON result for 14 days (for duration analysis), and failing jobs retain `test-results` for 10 days. Production bundle retention is 14 days. Shard failure does not cancel the other shard, preserving diagnostics. No new third-party dependency or broad token permission was added.

Use one `gh run watch <id> --interval 60 --exit-status` monitor, then fetch the final jobs/logs once. Record exact full SHA and job/step timestamps; do not repeatedly poll CI or rebuild locally to infer hosted identity. For a representative second sample, dispatch the same verified commit only after its first full gate is green. Record both runs, including variability, rather than claiming the predicted split as a speed improvement.

## Optimization release evidence

Local validation passed: TypeScript, lint, scoped format, build, two shard units, seven Python integrity/gate cases, unchanged 143/15 collection and three real release smoke cases in 35.6s. A deliberately wrong SHA fails the smoke and retains screenshot/trace diagnostics; no passing trace is retained. Exact candidate CI/Pages/hosted verification and a second representative optimized run are pending. This section must not be read as release success until those external checks pass. No gameplay work is authorized by this infrastructure task.

## First diagnostic run — release correctly blocked

Candidate `8ae450197c41ee23a8da638420e08b6b1928051e`, [run 39616857577](https://github.com/tobisen/hollowbane/actions/runs/39616857577), failed after 16m41s. It is **not a successful deployment sample**. Static/build passed (475 units), compatibility passed 15/15, shard 2 passed 59/59 in 609s of browser execution. Shard 1 passed 83/84 in 740s but the existing expedition kill case failed: selected enemy retained all 90 HP while the player died. Failure screenshot and trace were retained. Aggregate `verify` explicitly rejected `CHROMIUM_RESULT=failure`; Pages artifact upload, deployment and hosted smoke were skipped. Last verified deployed runtime remains D08-A `5f086ef9aecc01fe5d9758ea85c9fd65f3c368bc`.

Trace evidence: the target screen point was sampled around 633992ms, followed by separate mouse move/down calls at 633995/634139ms while camera/enemy motion continued. Subsequent frames still show no target acquired. The test previously clicked once and waited blindly for HP zero. Its driver now stops queued movement, recomputes the same target identity's current screen coordinates, sends real mouse input and confirms acquisition after presentation frames; a miss releases/stops/re-aims within the existing default assertion deadline. The original 25s kill deadline, 90s test deadline, generated monsters, damage, XP/loot, death identity, save/reload and no-respawn assertions are preserved. No runtime input/combat changes or automatic test retries. Focused traced repetitions passed 3/3 (74.0s) before the final render-frame synchronization; final frame-synchronized verification passed 1/1 in 22.4s. TypeScript, scoped lint and complete shard collection also pass before correction publication.

The failed sample also measured 4s npm installation, 127s check, 10s format, 39s actual collection validation, 26s/21s Chromium installation, 56s three-browser installation and 1s bundle upload. Unit execution was 100.77s (runner variation); only one production Vite build appears in the entire run. Passing images/traces were not uploaded. The failed workflow demonstrates the gate and diagnostic behavior, but cannot establish a release speed improvement. Required correction CI/Pages/hosted and representative successful samples remain pending.

The profile refresh uses 31 completely successful files from run39616857577; only `world-encounters.spec.ts` retains its prior successful baseline weight. Current predicted shard totals: 654.061s / 655.876s. This is a balance estimate, not a measured release speedup.
