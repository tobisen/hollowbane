# DBL-010 Fast policy measurements

Release timing includes required verification, Pages and hosted acceptance. Individual job timing is identified separately. A cancelled/failed run is never a successful speed sample. The2–5minute target applies to ordinary Fast changes; broad contracts and policy changes still require Full.

## Baseline and policy validation

| Source/run                                              | Required tier                    | Whole workflow including hosted | Evidence                                                                                             |
| ------------------------------------------------------- | -------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `41e3591` /39620543633                                  | Previous mandatory full          | 20m37s                          | 475 units,143 Chromium,15 compatibility,3 hosted                                                     |
| `80185a6` /39632464485                                  | Previous mandatory full          | 20m23s                          | 475 units,143 Chromium,15 compatibility,3 hosted                                                     |
| `e356700a035f7cbb6229873bd152d3f5e0263a77` /39656421994 | New policy Full validation       | 19m41s                          | 481 units,143 Chromium,15 compatibility; Pages7234892160; two hosted15.117s                          |
| `7b462637722af4c922a2608f4f35233164cca698` /39664666807 | Corrected Full policy acceptance | 14m22s                          | 482 units,143 Chromium,15 compatibility; Pages7235958766; two hosted10.857s; final acceptance passed |

The exact new Full source passed CI39656421994, Pages deployment7234892160 and hosted SHA/all26 application bytes plus two browser checks. All143 Chromium (72+71),15 compatibility, two Fast smoke and two hosted cases have zero skipped/flaky/unexpected results. Logs prove one Vite build. The Full run took1181s from18:51:07Z to19:10:48Z. Fast component74s, Full unit/validator job142s, Chromium jobs960s/1017s (actual browser913.012s/979.020s), compatibility job212s, verify7s, deployment8s, hosted job60s/browser15.117s. Pages succeeded at2026-10-21T19:09:44Z.

The verified ordinary Fast-only measurement is recorded below. Comparing the74-second Fast component to a complete20-minute release would overstate improvement. The first new policy candidate39655244274 was cancelled during Full to repair accepted-history and cancellation semantics; successor39656274265 was cancelled before Full. Neither counts as a speed sample or accepted release.

Local validation retained all143 Chromium identities and all15 required compatibility cases. The existing broader Deep compatibility configuration collects162 cases. All prior runtime source, public assets, browser scenario assertions/snapshots and dependency lockfile remain byte-identical; the test-driver repair below changes only steering input. Full now includes482 units (473 original, two existing shard cases, six policy cases, one navigation driver regression); Fast selects29 core unit cases plus affected units. Nine Python integrity/gate cases run in Fast. Seven additive Deep domain cases pass locally in6.81s; complete Deep browser/performance QA has not been run for this change and is not claimed.

## Review of long integration cases

These are actual durations from the last successful baseline39632464485, not estimates. The50-second threshold identifies the largest cases; normal VM variance can change their durations.

| Existing scenario                                             | Seconds | Why retained / ordinary-push policy                                                                                                                            |
| ------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 real-input camp→forest→graveyard→crypt→camp               | 242.214 | End-to-end campaign/atomic ownership acceptance; retained unchanged in Full. Fast domain units use existing deterministic fixtures.                            |
| World mouse travel, atomic reload, developer restart          | 91.013  | Real navigation/persistence integration; Full and affected world gate; hosted when world is affected.                                                          |
| Real expedition kill, XP/loot ownership, reload               | 69.044  | Combat→rewards→atomic save integration; retained unchanged in Full. Broad combat/reward contracts force Full.                                                  |
| D05 prerequisites/reward/tracked objectives/controller/reload | 54.085  | Cross-system quest acceptance; retained unchanged in Full; affected quest gate also runs D06 idempotency/reload.                                               |
| Nearby treasure mouse travel/controller opening/reload        | 50.165  | World/loot/ownership integration; retained unchanged in Full. Container/world changes select affected domain units/travel; shared public contracts force Full. |

The cost comes from real travel, combat and save transitions that the scenarios assert. Replacing those flows with state injection would reduce integration value. The strategy removes their repetition on unrelated pushes while preserving them for Full/affected gates. It reuses the existing isolated boss/controller smoke instead of full-campaign setup for ordinary release. No assertion, time limit, retry policy or snapshot environment was changed.

## Gate and classification evidence

- An actual browser check with an intentionally wrong full SHA failed. Feeding that failure to the same deployment gate rejected Pages. Negative trace/screenshot and gate results are in `/private/tmp/hollowbane-fast-negative-*`.
- Six policy cases cover save/ownership integration, boss/quest/navigation groups, transitive import dependencies, public/shared contracts, deletion/unknown/broad fallback, explicit Full and the requirement for an accepted successful main workflow baseline.
- All five hosted selections collect exactly two cases: application/full SHA plus core-controller, boss fight, corruption recovery, travel/reload or quest reward/reload.
- Workflow validation checks triggers, valid dependency edges, read/write permissions, Full cancellation guards, stable `verify` identity and Pages→hosted ordering. Only the short aggregate uses `always()`; long Full jobs are cancellable.
- Main plans from the last successful complete Verify-and-deploy workflow, so a failed hosted deployment cannot become the baseline for a later docs push. Missing history/API access fails closed to Full.

Policy and complete retained file assignments: [fast-policy.md](fast-policy.md), [test-inventory.json](test-inventory.json). Raw prior baseline measurements remain in [release-pipeline.md](release-pipeline.md).

## Fast proof revealed a blocking skip-propagation defect

Candidate13f82fee03f58fee375213643cf162cae4b7a256 /39659571759 selected Fast and correctly skipped Full; static/unit/browser and verify passed. However, implicit success conditions then skipped Pages and hosted through the skipped Full ancestor. The overall Actions result was green, but the required release gate failed and this is not a successful release timing sample. No subsequent deliverable was started.

Repair: explicit !cancelled()/successful-predecessor conditions on deploy/hosted, plus an always-run final Release acceptance that requires CI, Pages and hosted success on main. PR/tag verification may intentionally omit publication. Accepted-history lookup also verifies the actual verify/Pages/hosted job conclusions, rejecting a historic green run with skipped publication. Added a Python negative matrix for skipped/failed/cancelled/missing verification/deploy/hosted results and workflow assertions for these job conditions/dependencies. This relevant workflow failure requires another Full policy gate before activation; browser/gameplay/assertion/environment changes remain zero.

## Full correctly rejected a controller-driver failure

Corrected release-policy sourcee694a1d0e55954eac3a2d633dd7224dbb1702f72 /39660428508 passed481 units,142 Chromium and15 compatibility cases, then failed the existing strict D06 forest navigation case. Both verify and final Release acceptance rejected it; Pages/hosted were skipped. This is actual CI evidence that a critical browser failure blocks publication; it is not a successful timing sample.

Retained trace/diagnostics show an alive player repeatedly crossing a clear waypoint at full stick input: distances0.250644 and0.289356, separated by six ticks/0.54world units. The old gain saturated too close to the target and never entered the unchanged0.1-unit arrival radius. Test-only steering now brakes for the runtime's existing100ms/six-tick update bound and inverts the existing stick deadzone/curve. Real virtual input, the exact path,0.1 precision,10-second waypoint and60-second case deadlines, UI handoff, progression/health/save assertions are preserved. No gameplay source or snapshot changes. A deterministic replay reproduces the captured old oscillation and verifies corrected arrival at every1–6tick cadence. Three traced real browser repetitions pass82.540s total; the remaining10 affected D06/D07-B scenarios also pass with tracing in124.475s, including real boss death/reward/save and campaign reward idempotency.

## Corrected Full release accepted

Source7b462637722af4c922a2608f4f35233164cca698 /39664666807 completed its full required gate in862s (19:47:19Z–20:01:41Z). Pages7235958766 succeeded20:00:32Z; hosted manifest/full SHA/all26 application bytes and two browser cases passed10.857s; final Release acceptance passed. Full482 units/143 Chromium (72+71)/15 compatibility all pass with zero skipped/flaky/unexpected results. The formerly failing navigation case and both boss navigation cases pass. One Vite build; all26 application files match the original baseline bytes.

Fast component101s; Full units/validators136s; Chromium jobs621s/655s (actual browser588.861s/615.265s); compatibility job150s; verify14s; Pages11s; hosted job56s; final acceptance7s. Compared with the previous19m41s Full sample, runner performance and a test-driver repair differ; this is not a controlled speed comparison. The following ordinary Fast proof completed those publication and final-acceptance requirements with Full skipped.

## Ordinary Fast release verified and active

Evidence-only source955d696af2b6a641756e3ce3c9b49713b26887d8 /39667084907 completed the required Fast release gate in249s /4m09s (20:04:11Z–20:08:20Z). Its actual plan selected Fast with only STATUS.md and measurements.md changed, no affected gameplay groups, and optional Full intentionally skipped. The stable verify check completed successfully; Pages7236077171 succeeded20:07:14Z, hosted exact SHA/all26 tested application files and both smoke cases passed12.060s, and final Release acceptance passed. No pending required checks. No Full or Deep execution is claimed for this source.

Fast static/core/build/browser job95s; verify9s; Pages70s; hosted52s; final acceptance8s. Core browser2/2 passed16.127s, hosted2/2 passed12.060s, with zero skipped/flaky/unexpected cases.29 core units and nine Python integrity/gate checks passed. One Vite build; all26 application bytes match the previously Full-verified game. npm download caching, lock/browser/OS versions and all assertions/time limits remain intact. The70-second Pages wait illustrates service variance inside the measured complete release time.

This is a measured ordinary prose/evidence release, compared with the previous mandatory full20m23s/20m37s baselines. Affected gameplay groups can take longer, and shared/unknown contracts still require Full. The corrected Full implementation was accepted before this push. All482 units,143 Chromium and15 compatibility scenarios remain available and required at the mapped Full/milestone gates; complete Deep browser/performance QA remains manual and was not run. A final evidence commit records this first Fast measurement and receives its own exact-commit Fast/Pages/hosted/final verification.
