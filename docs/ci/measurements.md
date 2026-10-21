# DBL-010 Fast policy measurements

Release timing includes required verification, Pages and hosted acceptance. Individual job timing is identified separately. A cancelled/failed run is never a successful speed sample. The2–5minute target applies to ordinary Fast changes; broad contracts and policy changes still require Full.

## Baseline and policy validation

| Source/run                                              | Required tier              | Whole workflow including hosted | Evidence                                                                    |
| ------------------------------------------------------- | -------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `41e3591` /39620543633                                  | Previous mandatory full    | 20m37s                          | 475 units,143 Chromium,15 compatibility,3 hosted                            |
| `80185a6` /39632464485                                  | Previous mandatory full    | 20m23s                          | 475 units,143 Chromium,15 compatibility,3 hosted                            |
| `e356700a035f7cbb6229873bd152d3f5e0263a77` /39656421994 | New policy Full validation | 19m41s                          | 481 units,143 Chromium,15 compatibility; Pages7234892160; two hosted15.117s |

The exact new Full source passed CI39656421994, Pages deployment7234892160 and hosted SHA/all26 application bytes plus two browser checks. All143 Chromium (72+71),15 compatibility, two Fast smoke and two hosted cases have zero skipped/flaky/unexpected results. Logs prove one Vite build. The Full run took1181s from18:51:07Z to19:10:48Z. Fast component74s, Full unit/validator job142s, Chromium jobs960s/1017s (actual browser913.012s/979.020s), compatibility job212s, verify7s, deployment8s, hosted job60s/browser15.117s. Pages succeeded at2026-10-21T19:09:44Z.

No ordinary Fast-only release has been measured yet. Comparing the74-second Fast component to a complete20-minute release would overstate improvement. The first new policy candidate39655244274 was cancelled during Full to repair accepted-history and cancellation semantics; successor39656274265 was cancelled before Full. Neither counts as a speed sample or accepted release.

Local validation retained all143 Chromium identities and all15 required compatibility cases. The existing broader Deep compatibility configuration collects162 cases. All prior runtime source, public assets, browser tests/snapshots and dependency lockfile remain byte-identical. Full now includes481 units (473 original, two existing shard cases, six policy cases); Fast selects29 core unit cases plus affected units. Eight Python integrity/gate cases run in Fast. Seven additive Deep domain cases pass locally in6.81s; complete Deep browser/performance QA has not been run for this change and is not claimed.

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
