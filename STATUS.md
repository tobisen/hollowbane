# Status

## DBL-010 Fast skip-propagation failure — release blocked and repaired locally (2026-10-21)

- Ordinary candidate13f82fee03f58fee375213643cf162cae4b7a256 /39659571759 correctly selected Fast, skipped Full and passed verify; GitHub implicit transitive success then skipped Pages/hosted. Overall CI green did NOT satisfy the release gate. No Fast release/timing success is claimed. Last accepted deployment remains Full-verifiede356700 /39656421994 /Pages7234892160.
- Deploy/hosted now use explicit !cancelled()/successful-predecessor guards. Added always-run final Release acceptance requiring verify+Pages+hosted success on main, permitting intentional nonpublishing PR/tag gates. New negative matrix rejects every skipped/failed/cancelled/missing required release result. Workflow/DAG/permission/guard validation, lint and all nine Python tooling tests pass. Accepted-history lookup also rejects green workflows with skipped verify/Pages/hosted jobs. No gameplay/browser/assertion/timeout changes.
- Corrected workflow requires a fresh exact Full+Pages+hosted+final acceptance gate before another ordinary Fast-only proof. Repeat Full is justified solely by this demonstrated release-policy failure; do not rerun locally or start gameplay. Keep docs/ci/measurements.md failure evidence, preserve unrelated edits, and stop only once Fast is verified active.

## DBL-010 new policy Full gate passed — ordinary Fast proof next (2026-10-21)

- Exacte356700a035f7cbb6229873bd152d3f5e0263a77 / CI39656421994 SUCCESS in19m41s including Full, Pages7234892160 and hosted acceptance.481 units/143 Chromium/15 compatibility retained; two Fast and two hosted cases pass, zero browser skips/flakes/unexpected failures. Hosted full SHA/all26 application files verified; one Vite build. All production bytes match prior baseline. This validates the new testing policy through Full; it is not an ordinary Fast duration.
- Corrected accepted-history planning requires all unaccepted prior changes; cancellation guards permit obsolete Full runs to stop. Actual wrong-SHA browser failure rejected the deployment gate. Local29 core units/eight Python gate-integrity/seven additive Deep domain checks and unchanged-runtime assertions pass. Complete Deep browser/performance QA was not run or claimed.
- Next evidence-only increment (this STATUS section plus docs/ci/measurements.md) must select Fast, skip optional Full without pending verify status, pass exact CI/Pages/two hosted checks, and record the actual total duration/source SHA. No gameplay. Preserve unrelated edits and stop after the verified Fast policy is active.

## DBL-010 cancellation repair — final policy validation pending (2026-10-21)

- Reusable Full jobs now use !cancelled() guards instead of always(), preserving skipped-prepare reuse while permitting obsolete expensive runs to stop. The final short verify aggregate remains always() and rejects cancellation/failure. Workflow/DAG/permissions/cancellation validation and scoped lint pass; no runtime/test assertion changes.
- Unaccepted39655244274 required force-cancel because its old always guards resisted ordinary cancellation; queued39656274265 was cancelled before its Full run. Neither authorizes release or a speed claim. Read-only accepted-history correction and six policy cases remain intact. Last accepted runtime stays80185a6; corrected final candidate still requires Full+Pages+hosted before the ordinary Fast proof.

## DBL-010 accepted-release baseline correction — verification pending (2026-10-21)

- Review found that a Pages SHA can precede a failed hosted gate. Planner now reads the last successful main Verify-and-deploy run (including hosted acceptance), validates its full SHA/ancestor, and compares all changes since that accepted release. Missing/invalid history requires Full. Only Fast receives additional Actions read permission. No gameplay/browser assertion changes.
- Added a sixth policy case proving failed/cancelled/pending candidates cannot establish the baseline;29 selected core units, strict TypeScript/scoped lint and workflow/DAG/permission validation pass. Full retains481 units/143 Chromium/15 compatibility; Deep remains manual. Candidatefeab0ac /39655244274 was deliberately cancelled before release to correct this policy; it is not a successful timing sample. Last accepted runtime remains80185a6.
- Next require the corrected candidate's exact Full+Pages+hosted gate, then an ordinary Fast-only measurement. No new deliverable while this release gate is pending. Prior baseline/local/negative-failure and unchanged-runtime evidence remain valid; preserve unrelated edits.

## DBL-010 Fast/Full/Deep policy — local candidate, release pending (2026-10-21)

- User explicitly authorizes risk-based Fast default and retained Full/Deep tiers; no gameplay changes. Last verified runtime remains80185a6183370995869348f95a754027715a1c11 / CI39632464485 (20m23s). New policy changes require Full before activation; ordinary Fast duration is not measured yet.
- Added reviewable domain/content/transitive-import planning, deployed-SHA baseline (failed prior changes cannot be bypassed), selected unit/integration groups and fail-closed Full fallback. Fast retains static/build/core contracts and two real browser cases; Full retains all480 units/143 Chromium/15 compatibility; manual Deep adds broader compatibility,64-seed/two-area generation,3x50000 loot reports and performance measurements. Old workflow remains a manual rollback.
- Local28 Fast units/eight Python gate-integrity checks/seven additive Deep cases/strict TypeScript/scoped lint/build/143-case shard coverage and2 real browser cases (8.4s) pass. Actual wrong-SHA browser failure must reject the Pages gate; evidence in /private/tmp/hollowbane-fast-negative-*. Full GitHub, exact Pages and hosted acceptance remain required, then one ordinary Fast evidence release. No local Full rerun or gameplay. Preserve all preexisting documentation edits.
- Resume: inspect exact pushed candidate run, fix demonstrated relevant failures without weakening assertions; require Full+Pages+two hosted checks before ordinary Fast proof. Record both actual durations/tier/SHA in docs/ci/measurements.md, final checkpoint in STATUS and stop. See docs/ci/fast-policy.md and test-inventory.json.

## DBL-010 prototype input correction — local checks pass, release pending (2026-10-21)

- 883431a88d8ab78bdd9d3ad32ab9e6ec55f7cd9f / CI39628338010 failed only legacy prototype retargeting: actual destination12.557 pixels from requested point versus existing<12 requirement, then arrival cleared destination.475 units,15 compatibility and142 other Chromium cases pass, including all25 controller corrections. Aggregate verify blocked Pages/hosted. Last verified deployed runtime remains41e35912782e8f335aaab6327469ed4e702d0969 / CI39620543633 (20m37s including hosted). Failed19m49s is not a successful speed sample.
- Trace shows57ms locator-click delay after a moving-camera screen projection. Test-only ground-click helper now sends actual mouse input directly after sampling, avoiding actionability waits. Original12-pixel precision,0.5 arrival, retarget/direction/collision/zoom/depth/snapshot assertions and all deadlines remain. All five prototype cases pass three traced repetitions15/15 in56.574s; TypeScript/scoped lint/format pass. No gameplay, dependency, snapshot, test retry or simulation-state changes.
- Next commit/push this verified correction, require exact CI/Pages/manifest/all26 production files/three hosted cases, record the second successful sample and STOP. No further measurement-only source commit or gameplay/D08-B. Source/failed-run/trace evidence: docs/ci/release-pipeline.md and /private/tmp/hollowbane-ci-optimized-4-*; preserve unrelated edits and all earlier failure evidence.

## DBL-010 controller harness correction — local checks pass, external gate pending (2026-10-21)

- Evidence-only85a4d7b59ecd885420d820948e3035ea805e525c / CI39624226982 failed two legacy gamepad cases;475 units,15 compatibility and141 other Chromium cases passed, including the prior expedition acquisition correction. Aggregate verify blocked Pages/hosted. Last verified deployed SHA remains41e35912782e8f335aaab6327469ed4e702d0969 / CI39620543633 (20m37s including hosted).85a4d7b is not released; failed timings are not successful performance evidence.
- Trace proves short windup was missed while held attacks actually killed the dummy, and a D-pad "tap" lasted1.26s, triggering repeat/focus twice. Test-only repair latches actual windup/untouched160HP on render frames and releases a navigation tap on real UI consumption. Original damage/focus/menu/held-input assertions and deadlines retained; no gameplay/dependency/snapshot/test-retry changes. Full affected gamepad file passes25/25 with tracing in35.670s; TypeScript/scoped lint/full143-case shard collection pass. Successful menu screenshot reviewed; no full local regression repeated.
- Next commit/push this verified test-only correction, and require exact CI/Pages/manifest/all26 production bytes/three hosted cases. Its green run supplies the second successful sample; no further measurement-only source commit is needed. Keep all failed-run evidence, unrelated edits and soft-budget checkpoint intact. Stop only after CI optimization release verification; no gameplay/D08-B.

## DBL-010 CI optimization — first full optimized release verified (2026-10-21)

- Exact41e35912782e8f335aaab6327469ed4e702d0969 / CI39620543633 succeeded through all regression, Pages deployment7229523464 and hosted acceptance. Hosted manifest/full SHA plus26 production files verified; all3 application/boss/controller/save-isolation smoke cases pass42.920s.475 units (473 retained+2),143 Chromium (72+71),15 compatibility, seven integrity/gate cases and existing static/Python/dry-run coverage retained. Corrected real expedition kill/save scenario passes Linux50.550s. No gameplay/dependency/snapshot/timeout changes.
- Measured workflow20m37s including hosted, versus baseline26m02s/34m14s excluding then-manual hosted. Browser steps703s/807s overlap; npm ci6s, check116s (units87.45s), format10s, actual collection34s, one Vite build8.72s, bundle/Pages uploads2s each, deploy85s and hosted identity5s/browser44s. These are observed timings with runner/deployment variance, not predicted or guaranteed gains. Full table/caveats: docs/ci/release-pipeline.md.
- Failed diagnostic8ae4501/39616857577 remains explicit: one stale mouse-acquisition case failed and verify blocked deployment; trace/screenshot retained. Driver-only correction preserves all original kill/XP/loot/save assertions/deadlines and adds acquisition confirmation. No test retries or assertions removed. Unrelated documentation preserved byte for byte.
- Next publish documentation-only measured evidence and require that exact commit's unchanged CI/Pages/hosted gate for a second representative sample. Do not start another deliverable while pending. Stop after optimization verification; no D08-B or unrelated gameplay. Post-release source/artifact evidence is under /private/tmp/hollowbane-ci-optimized-2-*.

## DBL-010 CI optimization — failure isolated, deployment blocked (2026-10-21)

- Exact candidate8ae450197c41ee23a8da638420e08b6b1928051e / CI39616857577 failed only the existing expedition kill case (world-encounters.spec.ts:168): target90 HP unchanged, player dead.475 units,83 other shard1 cases,59 shard2 and15 compatibility cases pass. New aggregate verify correctly failed and Pages/hosted were skipped; no release claim. Verified deployed runtime remains D08-A5f086ef9aecc01fe5d9758ea85c9fd65f3c368bc. No new gameplay.
- Retained screenshot/trace show stale screen-point mouse input while camera/enemy moved and no target acquired. Driver-only correction confirms the same target through real mouse input/presentation frames, keeping every kill/XP/loot/save/reload assertion and25s/90s deadlines. Three traced repetitions pass; final frame-synchronized case passes1/1 in22.4s. No runtime, snapshots, dependency, test retry or timeout change.
- Required next: finish focused correction/static checks, commit/push, exact successor CI/Pages/full artifact/hosted verification. Do not advance on this failed run. Its16m41s is not a valid successful-release timing sample. Keep unrelated documentation preserved. Details and diagnostics: docs/ci/release-pipeline.md; /private/tmp/hollowbane-ci-optimized-1-{run.json,log,results,failure}.

## DBL-010 CI optimization — local candidate, external release pending (2026-10-21)

- User authorizes CI/deployment optimization only; no gameplay or D08-B. D07-B gate is complete at6729315c887a51a736cc91247b0da1783e11f142 (CI39497061101/Pages7211673339/hosted), and D08-A at5f086ef9aecc01fe5d9758ea85c9fd65f3c368bc (CI39548208049/Pages7218647544/two hosted cases). Existing post-release evidence and unrelated local documentation are preserved.
- Measured baseline workflow34m14s/26m02s; main Chromium1702s/1252s dominates, npm ci5s/4s. New candidate retains every143 Chromium/15 compatibility/473 existing unit case and all static/format/validator/orchestrator checks. Two duration-balanced, isolated one-worker Chromium jobs (84+59 cases) and parallel compatibility consume one sealed production bundle; exact full SHA and every file are validated before testing/deployment and hosted. Ubuntu24.04 matches baseline snapshots, npm caching retained, lockfile-matched browser install retained after evaluation. No dependency/gameplay/snapshot/assertion/timeout changes.
- Local two shard units, seven Python integrity/gate cases, unchanged actual test collection, TypeScript/full lint/scoped format/build pass. Three release-smoke cases pass35.6s with genuine boss fight/controller/save isolation and application/SHA load; phase screenshot reviewed. Wrong-SHA smoke intentionally fails with screenshot/trace, and gate tests reject failed/canceled/skipped jobs. Full local regression was not repeated.
- Exact candidate CI/Pages/hosted gate and representative timing comparison remain PENDING. Do not claim predicted602s shard weights as measured speedup. Next commit/push this scoped increment, watch exact run once, resolve relevant failures, verify Pages full SHA/all artifact bytes/hosted smoke, then obtain a second representative sample when practical. Stop after optimization release verification. Details: docs/ci/release-pipeline.md.

## D08-A local candidate — exact release gate pending (2026-10-21)

- DBL-146 scoped finale mechanics implemented: Sevra, the Vaultbound in Ancient Crypt, four elemental/physical telegraphs, two different attack pools at50% HP,150-frame transition safety, existing damage/resistance/status/interrupt rules, reachable clear chamber and freely escapable arena. Original parent dependencies and broader three-miniboss scope remain unchanged/partial. D08-B campaign conclusion is excluded.
- `?world=1&developer=1&cryptBossTrial=1` is deterministic seed42, boss-only and memory-only: inventory/storage construction and area travel disabled even with conflicting parameters. No permanent character save is read or written. Normal world uses the existing identity/death/XP/loot persistence path; no quest/save/map schema change. Original lantern/arch/cloak geometry and inherited provisional artwork/audio are tracked in ASSET_MANIFEST.md and docs/assets.json.
- Local28 unique focused units pass (14 crypt placement/mechanics,11 engine,3 miniboss); TypeScript/relevant lint/format/assets and production build pass. Two genuine Chromium scenarios pass in39.9s: keyboard movement, mouse fight, real hostile damage, phase change and phase-two strike, survival/death, virtual target lock/assigned-skill damage, unchanged permanent IndexedDB sentinel/no new database and reload resetting the isolated fixture. Warning/phase screenshots reviewed. No full CI was repeated locally; physical controllers remain unverified.
- Next commit/push after normal fast-forward dry-run; require exact successful CI/Pages, full-SHA hosted file identity and focused hosted D08 scenarios before marking released. Stop after D08-A release verification; no D08-B. Details/commands/evidence: docs/overnight/d08.md. Preserve unrelated working documentation.

## D07-B complete — hosted release verified (2026-10-21)

- Exact deployed SHA `6729315c887a51a736cc91247b0da1783e11f142`; CI39497061101 verify/deploy succeeded, Pages deployment7211673339 succeeded for that full SHA. All26 hosted files match the reviewed build byte for byte. Public demo: https://tobisen.github.io/hollowbane/ .
- Existing hosted D07-A/B tests passed4/4 in46.3s: genuine strikes/player damage, mouse combat and keyboard Run, virtual stick/target lock/assigned skill, two phases, death/completion, exact160 XP, one additional seeded loot roll, unchanged quests, atomic save/reload and no repeated reward/respawn. Read-only fight observations confirm all three telegraphs: cairn-cleave, oath-fault, broken-binding. Warning/phase screenshots reviewed. Evidence: docs/overnight/d07.md and /private/tmp/hollowbane-d07b-hosted-6729315.json.
- D07-B release gate is complete. Current user authorizes D08-A final-boss mechanics only after this gate, then exact CI/Pages/hosted release and STOP. D08-B campaign conclusion is excluded. Preserve original dependencies, broad partial parents, unrelated local edits and physical/art follow-ups. CI459 units/141 Chromium/15 cross-browser passed; no full local CI repetition.

## D07-B CI correction — successor release required (2026-10-20)

- Runtime candidate23314be failed exact CI39496483195 solely on new miniboss save/reload unit6066ms/default5000ms;458 other units passed. Pages skipped. D07-B remains incomplete; D08 has not started. Last verified deployed SHA remains ec9aa2babe9e5bbbce7a5eed2ec2fb2f95f1e37b.
- Profile demonstrated102 layout generations/four inputs,1594ms of1625ms locally. Test-local real-fixture cache now returns independent clones without changing assertions, validators, gameplay or timeouts. All three affected cases pass in228ms total (reward/save case25ms); TypeScript/scoped lint/format pass. Prior local browser evidence is reused because production code is unchanged. Details/logs: docs/overnight/d07.md.
- Next publish this verified correction after dry-run, require its exact successful CI/Pages, hosted byte identity and hosted D07-A/B cases before D08-A. Preserve unrelated local documentation. No release success is inferred from partial tests.

## D07-B miniboss candidate — release gate pending (2026-10-20)

- Extended user assignment authorizes sequential D07-B, D08-A/B, D09 and D10, then conditional existing D11–D14; no old orchestrator. Rechecked D07-A exact workflow39486202514: successful ec9aa2babe9e5bbbce7a5eed2ec2fb2f95f1e37b. That remains the last verified deployed runtime at https://tobisen.github.io/hollowbane/ .
- Cairnwarden Rhusk upgrades one existing graveyard Stonebound identity, with original crown silhouette, three locked telegraphs, two different phase pools, shared combat/navigation/controls, fixed160 XP and existing seeded loot. Saved deaths prevent respawn/repeated rewards, including already defeated legacy identities. No map/save version or D06 quest changes. Original DBL-069/070 parents/dependencies remain partial; physical controllers and production creature art remain unverified.
- Local:28 focused units (including D06/save/encounter compatibility), TypeScript/scoped lint/format/assets and production build pass; four Chromium campaign/engine cases pass. Genuine strike/player damage, mouse fight, phase transition, virtual target lock/assigned skill, exact XP, atomic save/reload and duplicate prevention verified. Screenshots exposed/fixed campaign HUD overlap. Evidence and commands: docs/overnight/d07.md.
- Next commit/push the verified candidate after dry-run; require exact successful CI/Pages, matching hosted build bytes and hosted D07-A/B cases before marking D07-B complete or starting D08-A. Preserve unrelated BACKLOG/L3/D05 and historical STATUS changes. D08–D14 have not started.

## D07-A CI recovery — correction verified locally (2026-10-20)

- Candidatef14788e failed CI39484783592 only on D01 ordered-expedition unit5308ms/default5000ms;455 other tests passed. Pages skipped. No D01-specific timeout or CI override exists.
- Root cause:99 real layout generations for four identical seeded fixtures across travel/save/reload. Test-local memoization with independent cloned outputs retains every assertion and all real validators. Three affected tests now pass in105ms total; TypeScript/scoped lint/format pass. No production/boss/gameplay/global-timeout changes; no local broad regression rerun.
- Next publish correction and require exact CI/Pages, hosted artifact identity and both hosted boss smoke cases. D07-A remains incomplete; D07-B has not started and is excluded from this recovery session. Last verified runtime remains D06/50bd6a5. Details: docs/overnight/d07.md. Unrelated working edits remain preserved.

## D07-A engine local candidate (2026-10-20)

- DBL-069/070 scoped engine candidate: seeded attack pools, locked cone/circle/line warnings, shared combat timing/damage/stagger, health/encounter phases, escape/reset/death/completion and health/phase HUD. Developer trial only; no campaign boss or D08. Original dependencies/broader parents stay partial.
- 32 focused units, TypeScript/scoped lint/format/build and2 Chromium warning/damage/mouse/virtual-controller cases pass; warning screenshot reviewed. Physical controller verification is not claimed. Provenance and continuation: docs/overnight/d07.md.
- Exact new CI/Pages, hosted artifact identity and hosted boss smoke remain required. D07-A release is incomplete; D07-B has not started. D06 remains verified at50bd6a5. Preserve unrelated working documentation. Publish the reviewed candidate, verify its exact release gate, then implement D07-B.

## D06 complete — verified release (2026-10-20)

- Exact release `50bd6a580bf7d3fdcae7e32f15f8a1bca75ede87` passed both verify and deploy jobs in CI run39477757637: https://github.com/tobisen/hollowbane/actions/runs/39477757637 . GitHub Pages deployment7208853800 reports success for that same full SHA at https://tobisen.github.io/hollowbane/ . All26 hosted publication files match the local production build byte for byte.
- Hosted D06 acceptance passed9/9 in1.6min: forest input handoff and both transitions; genuine normal-AI Stonebound combat with player damage and survival; all three quest claims, exact rewards, equipment, save/reload and duplicate prevention; crypt beacon attunement/reload; briefing and fresh quest prerequisites. Stonebound, final journal and beacon screenshots reviewed. Evidence: `/private/tmp/hollowbane-d06-hosted-50bd6a5.log` and `/private/tmp/hollowbane-d06-hosted-50bd6a5/`.
- D06/DBL-145 release gate is complete. Constructed legitimate intermediate checkpoints verify campaign progression; uninterrupted three-quest player-driven combat survival is not claimed. The pending sections below record earlier checkpoints and are superseded by this verified release. D07 has not started. Unrelated working edits remain preserved.

## D06 release CI correction verified locally — exact release pending (2026-10-20)

- Run39477131491 for `fabb06421bad6d9cb65da423ce0cfb9fd822a376` failed only the D06 fixture unit timeout: two full deterministic builds took27.04s in CI against the unchanged25s case limit;113 other unit files passed. No browser or Pages job ran. The first fixture build now runs as immutable module setup; the timed test retains an independent full rebuild and complete equality assertion. Focused local test passes (8.17s test time;14.87s total), TypeScript, scoped lint and formatting pass. The next release commit/push and exact CI/Pages/hosted verification remain required.
- Formatting-only follow-up `fabb06421bad6d9cb65da423ce0cfb9fd822a376` was committed and pushed; failed exact workflow: https://github.com/tobisen/hollowbane/actions/runs/39477131491 . The intended D06 runtime and browser tests are unchanged from `9041a1e`.
- Exact correction run39476628948 for `9041a1ed3a38220baf59b37d359909bdff413434` passed `npm run check`, then failed only `format:check`: the committed STATUS section lacked one blank line before its next heading. No browser test or Pages deployment ran. This follow-up fixes that formatting error only; a new exact CI/Pages/hosted gate is required.
- Verified correction `9041a1ed3a38220baf59b37d359909bdff413434` was committed and safely pushed after a fast-forward dry-run. Failed exact workflow: https://github.com/tobisen/hollowbane/actions/runs/39476628948 . D06 remains incomplete until CI, matching Pages and hosted D06 acceptance pass; D07 has not started.
- Exact run39467714491 for `8ea7531c092fcb3f1e542be4efffc53fc53ceb11` failed four browser contracts after130 passes; Pages was skipped. D01 died on its historical navigation-only route after D06 enabled normal AI. D06 forest and three-return cases exhausted whole-test60s limits. The legacy world case exhausted180s during final restart after its long mouse route. No gameplay defect was demonstrated in these failures.
- Test-only corrections make D01's prior AI-off fixture explicit through its existing control; keep generated enemies and all original assertions. D06 shares immutable fixture text, runs native path turns in one frame-driven route, and separates full outbound/return navigation and the three already-independent reward checkpoints. The legacy world route uses ordinary Run input. No gameplay rules, assertion or timeout limits changed.
- Final local evidence: D06 acceptance9/9 (1.6min), affected D01 route pass (2.4min), legacy world route pass (57.3s), six focused driver/fixture units, TypeScript, relevant lint/format and production build pass. Reviewed final Stonebound, quest journal and crypt screenshots. Continuous three-quest player-driven combat survival is not claimed; real Stonebound combat is verified separately. Artifacts: `/private/tmp/hollowbane-d06-release-candidate/`, `/private/tmp/hollowbane-d06-ci-corrections-final.log`, `/private/tmp/hollowbane-d06-world-run/`.
- Next commit/push only these reviewed corrections; require successful exact new CI, matching Pages deployment and hosted D06 acceptance before marking D06 complete. Until then verified hosted release is D05 `2eda0e7`; do not start D07. Preserve unrelated working edits.

## D06 acceptance stabilized — local release candidate (2026-10-20)

- D01–D05 remain verified at `2eda0e7adbac7ec2079c5c6d0b8803019bfa8cfc`. D06 local acceptance passes; exact candidate CI/Pages and hosted verification remain required before completion. No D07. Unrelated files and historical STATUS edits are preserved separately.
- Forest root cause: mouse/keyboard ownership disarms the virtual gamepad; held axes cannot rearm. The test driver now releases while unarmed and cancels stale movement. No shared mutable browser state/order dependency was found. Each test has a fresh context and seeded checkpoint. Restored live class/level/area replace a transient autosave-status readiness assumption.
- Removed automatic tactical targeting, pursuit, retreat and cast scheduling. Separate contracts cover forest transitions, real generated Stonebound combat, quest objectives, reward persistence/duplicates and all four campaign areas. Seeded intermediate checkpoints use actual combat/death/world transactions, normal derived resources and unmodified enemies. They do not claim uninterrupted campaign survival. A genuine browser attack defeats full-health Stonebound with all normal graveyard enemies/AI retained and positive damage received.
- Final local checks:23 focused units; D06 browser group6/6 in one complete run (1.7min); directly affected D05 browser1/1; TypeScript, relevant lint/format and production build pass. Stonebound, final quest journal and crypt beacon screenshots reviewed. Existing timeouts preserved. A stale beacon-copy assertion was corrected only after evidence, retaining exact XP/gold, save and duplicate checks; equivalent previous progression assertions remain across the separated contracts.
- Review includes intended three-quest D06 content/UI/persistence and the previously demonstrated normal-AI/obstructed-melee-approach repairs. No gameplay changes during this stabilization. Evidence: docs/overnight/d06.md and `/private/tmp/hollowbane-d06-acceptance-local/`. Next commit/push this verified candidate, require exact CI/Pages identity, compare hosted artifacts and run the same six hosted acceptance scenarios. Keep D06 incomplete until those release gates pass.

## D05 sequence correction verified locally (2026-10-20)

- Corrected late-acceptance finite encounter handling passes10/10 new units plus final live/restored case rerun, TypeScript/relevant lint/format/build and journal browser1/1 (21.9s). No current kill-source or replay assertions removed; no duplicate XP/loot. Two engine fixtures remain; no D06 content.
- Publish scoped correction, then verify its exact CI/Pages, all hosted artifacts and NPC/journal smoke before D06. Previous bcea516 release candidate is superseded; last verified deployed remains D04/e21dc00. Original three local docs remain retained.

## D05 pre-publication sequence correction (2026-10-20)

- Final review reproduced late-acceptance softlock against a saved, already defeated forest encounter. Added regression before correction; acceptance now reconciles durable visits/deaths, including uncheckpointed live deaths, without issuing kill XP/loot or changing current death source checks. Repeatable NPC/pickup events still require acceptance.
- Verify10 D05 cases, TypeScript/relevant lint/format and production browser flow, commit/push correction, then require its new exact CI/Pages/artifact/hosted gates. Prior bcea516/39391716134 is superseded as release candidate; no D06. Original local docs/stash/worktrees retained.

## D05 exact release pending (2026-10-20)

- D05 committed/pushed `bcea516ac6208c2fd3f6f6dc87ee6febb234a17a`; main equals origin/main. Exact workflow39391716134 in_progress: https://github.com/tobisen/hollowbane/actions/runs/39391716134 . Last verified deployed remains D04/e21dc00 until this gate passes. Original three local docs remain unstaged; backup /private/tmp/hollowbane-workspace-reconcile/d05-publication-local.patch, stash and all historical worktrees retained.
- Stay on D05: require exact verify/deploy success and Pages identity; compare every hosted production file with current dist; run `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/overnight-d05.spec.ts tests/e2e/overnight-d04.spec.ts`; immediately retain screenshots /private/tmp/hollowbane-d05-hosted/, review and record deployed SHA. Fix any CI/hosted failure on D05; no D06 while pending/red/unverified. Continue the normal live session after this gate; no overnight runner.

## D05 local quest-engine candidate (2026-10-20)

- Scoped DBL-136–141 engine: two original fixtures, explicit acceptance/prerequisites, bounded identity counters for travel/interact/defeat/collect, current-player kill credit, tracked journal, keyboard/mouse/virtual-controller menu access and atomic once-only XP/gold/nearby-item claims. Exploration6/quests1 defaults older saves to empty quest state; semantic visit/meeting/death and XP validation retains original ownership/seeds/character5.
- 45 unique scoped units pass across runs (final new9/9); TypeScript/relevant lint/format/build and backlog validation pass. Final NPC/journal browser2/2 passes28.4s; three journal screenshots and camp launcher reviewed under /private/tmp/hollowbane-d05-local/. Evidence docs/overnight/d05.md. Commit/push and exact CI/Pages/hosted gate remain; no D06 until verified. Original three local docs/stash/worktrees preserved.

## D04 verified release / D05 active (2026-10-20)

- D04 deployed `e21dc00979ba56d0a5b4ea97de06d931a0ff3c03`: exact CI39386922407 verify/deploy success,127 browser/15 final cross-browser; Pages7194535597 success. All26 hosted files match; hosted NPC scenario1/1 passes9.0s. Three screenshots reviewed and retained /private/tmp/hollowbane-d04-hosted/. Evidence docs/overnight/d04.md.
- D05 quest-engine slice now active: data-driven prerequisites/objectives/counters/journal, once-only atomic rewards and versioned persistence, reusing existing systems. D06 story content remains gated on D05 exact release. Original local docs/stash/worktrees preserved; normal main equals origin/main. No orchestrator.

## D04 exact release pending (2026-10-20)

- D04 committed/pushede21dc00979ba56d0a5b4ea97de06d931a0ff3c03; main equals origin/main. Exact workflow39386922407 in_progress: https://github.com/tobisen/hollowbane/actions/runs/39386922407 . Last verified deployed release remains D03/6b61be0 until this gate passes. Original three local docs remain unstaged with backup /private/tmp/hollowbane-workspace-reconcile/d04-publication-local.patch and retained stash/worktrees.
- Stay on D04: exact verify/deploy success, Pages identity, compare all hosted files with current dist, hosted `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/overnight-d04.spec.ts`, review/copy three screenshots to /private/tmp/hollowbane-d04-hosted/, record deployed SHA. Then begin approved D05 quest-engine slice. No D05 while pending/red/unverified; no overnight runner.

## D04 local NPC/dialogue candidate (2026-10-20)

- D04/DBL-131 delivers original Edda Vey/Orren Thale data-driven camp dialogue, validated proximity/alive/idle intents, safe text/native modal focus and keyboard/mouse/virtual-controller cancel/navigation. Exploration5 dialogue1 flags explicitly migrate1–4 with empty meetings, preserving maps/items/expedition/character5. No NPC quest reward/vendor functionality.
- 31 focused cases pass across runs, final NPC8/8 and browser1/1 (8.1s); held-stick isolation, field focus, both greetings/reload, no XP/gold/expedition side effects and explicit controller focus verified. TypeScript/relevant lint/format/build and asset24-record validation pass. Three reviewed screenshots retained /private/tmp/hollowbane-d04-local/. Original shared-sheet NPC costume placeholders tracked in docs/assets.json and docs/overnight/d04.md. Ready for scoped commit/push; no D05 until exact CI/Pages/artifact/hosted NPC gate.

## D03 verified release / D04 active (2026-10-20)

- D03 deployed6b61be0d4f4c524f8c00d381beb8a0bd3027dee8: exact CI39379908466 and Pages7193421628 success; all26 hosted files match. Hosted3/3 route/encounter cases pass2.9min; screenshots reviewed and retained /private/tmp/hollowbane-d03-hosted/. Initial637f02b was not deployed; measured integration-budget correction preserves every assertion. Evidence docs/overnight/d03.md.
- D04/DBL-131 now active: two original camp NPCs, data-driven dialogue/proximity interactions, safe text presentation, keyboard/mouse and controller focus/cancel, versioned conversation flags. Reuse simulation/save/modal systems; no quests/rewards/vendors in D04. D05 remains blocked until D04 exact release gate. Preserve original local docs and worktrees; continue normal live session through approved D14 scope.

## D03 corrected exact release pending (2026-10-20)

- Correction6b61be0d4f4c524f8c00d381beb8a0bd3027dee8 pushed; main equals origin/main. New exact workflow39379908466 verify/deploy and Pages7193421628 succeeded for6b61be0; hosted gates are running: https://github.com/tobisen/hollowbane/actions/runs/39379908466 . Prior637f02b/39379427445 failed only two new15s integration budgets (408pass;19.244/17.279s cases), no Pages. Correction uses measured25s budgets only for these cases; all assertions and runtime unchanged.
- Continue D03 gate: require replacement exact verify/deploy success, record Pages identity, compare26 hosted bytes, run hosted overnight-d01 + world-encounters (3 cases), review/copy screenshots, record deployed SHA, then begin authorized D04. No D04 while pending/red/unverified. Original local docs retained; backup d03-correction-local.patch and stash under prior reconciliation checkpoint.

## D03 CI correction (2026-10-20)

- Exact637f02b workflow39379427445 failed standard check:408 pass; only two new complete-checkpoint integration cases exceeded15s (19.244/17.279s), with no assertion failures. No Pages deployment. Log /private/tmp/hollowbane-workspace-reconcile/d03-ci-failed.log.
- Scoped measured25s budgets for those two cases preserve every check and all global/browser limits. Runtime unchanged. Verify targeted cases, commit/push correction, then require new exact SHA CI/Pages,26 hosted files and3 route/encounter cases before D04.

## D03 exact release pending (2026-10-20)

- Verified D03 committed/pushed637f02b081bfeff5a040eae60fe45428043e3e33; main equals origin/main. Exact workflow39379427445 in_progress: https://github.com/tobisen/hollowbane/actions/runs/39379427445 . Original three documentation edits retained with backup /private/tmp/hollowbane-workspace-reconcile/d03-publication-local.patch and stash; all historical worktrees remain.
- Continue normal session through this gate; do not start D04 while pending/red/unverified. After exact verify/deploy success, record Pages deployment, compare26 public files via read-only verify_hosted helper and run `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/overnight-d01.spec.ts tests/e2e/world-encounters.spec.ts` (3 real deployed route/encounter cases). Review/copy screenshots immediately to /private/tmp/hollowbane-d03-hosted/ before another Playwright run clears them. Then record deployed SHA and begin approved D04 NPC/dialogue slice from tools/overnight/tasks.json and the extended-day request. No orchestrator.

## D03 local persistence candidate (2026-10-20)

- D03/DBL-387,135,211 validates generated death-area/member identities and claimed-reward XP coherence; existing schemas/seeds/items retained. Valid-revision records with malformed/missing text can explicitly recover the validated backup with raw quarantine and CAS intact. Unsupported revision metadata stays locked with originals retained. No new storage engine.
- 27 focused cases pass across runs, including final nine D03 cases: mixed/embedded ownership, all route checkpoints, character1–4/exploration1–3 migrations, corruption/backup and duplicate reward protection. Browser3/3 passes including outbound/attuned/completed reloads; exact quarantine2/2 rerun passes. TypeScript/relevant lint/format/build pass; screenshots reviewed. Evidence docs/overnight/d03.md. Ready for scoped commit/push; no D04 until exact CI/Pages, artifact identity and hosted route + encounter checks pass.

## D02 verified release / D03 active (2026-10-20)

- D02 deployedfe895909f8e266f92d5b3a91428283868e535cd3: exact CI39375269166 and Pages7192683755 success; all26 hosted files match. Hosted full-expedition reward/point/ownership/reload/repeat scenario passes2.5min; both screenshots reviewed. Evidence docs/overnight/d02.md and /private/tmp/hollowbane-d02-hosted/.
- D03/DBL-387,135,211 now active: validate existing atomic expedition/character persistence across travel/objective/reload, old snapshots, corruption and backup recovery. Reuse IndexedDB/CAS/ownership architecture; no new storage engine or D04 before D03 exact release gate. Preserve unrelated edits and worktrees.

## D02 exact release pending (2026-10-20)

- Verified D02 committed/pushedfe895909f8e266f92d5b3a91428283868e535cd3. Normal main equals origin/main; original three unrelated documentation edits remain uncommitted and backed up in /private/tmp/hollowbane-workspace-reconcile/d02-publication-local.patch plus retained stash.
- Exact workflow39375269166 and Pages7192683755 succeeded for the exact SHA; all26 hosted files match. Hosted strengthened full-expedition acceptance is currently running. Release reference: https://github.com/tobisen/hollowbane/actions/runs/39375269166 . Stay on D02 until hosted acceptance succeeds. Required hosted check: `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/overnight-d01.spec.ts` (strengthened D02 rewards/reload/repeat protection), review screenshots and record deployed SHA. Do not start D03 with pending/red/unverified release. No overnight orchestrator.

## D02 local candidate (2026-10-20)

- D02/DBL-382,116 adds generated area/tier XP and atomic once-only250 XP/120 gold at crypt attunement. Existing difficulty/composition, level1/3/5 loot, map/encounter identities and item ownership retained. Expedition2 ledger explicitly migrates legacy ready/outbound versus already-attuned/completed states without retroactive rewards; exploration4/character schema unchanged.
- 27 focused tests pass, including all nine class/biome live-AI fights, gold overflow rollback, XP/point budgets, ledger corruption and legacy/replay protection. Strengthened browser expedition passes2.5min; rewards, reload, ownership and repeated return verified; screenshots reviewed. TypeScript/relevant lint/format/build pass. See docs/overnight/d02.md for configurations, metrics and fixture diagnoses. Ready for scoped commit/push and exact CI/Pages/hosted gates; no D03.

## D01 verified release / D02 active (2026-10-20)

- D01 deployed6b7cbce786fb0ee664c167494907a6f73a6f1b42: exact CI39371839831 verify/deploy success,394 unit/125 browser/15 final cross-browser; Pages7192178220 success. All26 hosted files match; hosted full-expedition acceptance passes2.4min and screenshots reviewed. Original local documentation/worktrees retained.
- D02/DBL-382,116 now active: preserve existing area1/3/5 loot context, encounter composition/identity and scaling; add area/tier XP and one ledger-bound crypt-objective XP/gold transaction with explicit old-state migration. No new balance engine, class or reward-item ownership path. D03 remains blocked until D02 exact release gates pass.

## Extended day authorization (2026-10-20)

- User authorizes sequential normal-workspace D01–D14 through Act1 release, continuing while the live session/permissions/capacity support it; supersedes soft-budget/one-task stops for this batch. Do not invoke overnight orchestrator or change models automatically. Preserve original IDs, prior worktrees and unrelated local edits.
- Mandatory per-deliverable boundary: targeted checks → commit/push → exact-SHA CI and successful Pages → relevant hosted acceptance and deployed-SHA record → next deliverable. Pending/failed/unverified release blocks advancement. D01 exact run39371839831 for6b7cbce completed success:394 unit/125 browser/15 final cross-browser cases; Pages deployment7192178220 succeeds. Hosted artifact/full-expedition gates are running; no D02 work begun. Prior394-test local evidence remains valid; do not repeat unchanged unit suite.

## D01 publication checkpoint (2026-10-20)

- Verified local D01 committed and pushed as6b7cbce786fb0ee664c167494907a6f73a6f1b42. Normal main equals origin/main. Exact workflow39371839831 and Pages deployment7192178220 completed success; hosted acceptance remains pending. No D02 started.
- Repository soft-session-budget checkpoint: next inspect https://github.com/tobisen/hollowbane/actions/runs/39371839831 for that exact SHA; fix any failing CI before advancing. After successful verify/deploy, compare all production bytes with `python3 tools/overnight/verify_hosted.py https://tobisen.github.io/hollowbane/`, then run `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/overnight-d01.spec.ts` and review hosted screenshots. Only then advance approved D02. Continue normal VS Code workflow; do not restart overnight runner.
- Original BACKLOG.md/STATUS.md/docs/items/l3.md edits remain uncommitted and retained in stash plus /private/tmp/hollowbane-workspace-reconcile/main-local.patch. This publication note is an additional uncommitted continuation checkpoint. All original worktrees/D01 source retained; no reset/clean/force push.

## D01 / DBL-386 continuation (2026-10-20)

- Existing implementation recovered into synchronized normal main; expedition start, ordered travel, crypt attunement, once-only completion and nested exploration4 migration reviewed. Strict stage validation now rejects non-string data. Standard check394 tests passes;17 focused cases and final three-case validator rerun pass. TypeScript/lint/build and scoped format pass.
- Real-input browser acceptance passes (2.4min): deliberate mouse start, ordered outbound/controller travel, keyboard crypt attunement, return to camp, atomic checkpoint/reload, unchanged character/loot and repeated exit protection. Crypt and completed-camp screenshots reviewed. Pointer-driver failure retained in D01 evidence; established controller driver passes both legs. Ready for scoped D01 commit/push; exact-SHA CI/Pages and hosted acceptance remain pending. No D02 until release gates pass.

## VS Code workflow reconciliation (2026-10-20)

- Normal main fast-forwarded from35ab99b to origin/main312182a; overnight/development shares that base. D00 exact workflow39343312275 verify and Pages deploy independently confirmed successful. Original local documentation retained, with backup patch in /private/tmp/hollowbane-workspace-reconcile and retained Git stash. STATUS top-section overlap resolved by preserving both histories.
- No active overnight runner found by process inspection. Overnight worktrees/tooling retained. Existing unfinished D01 files copied unchanged into normal workspace for review and continuation; original worktree preserved. D01 is not verified or published. Continue approved D01/DBL-386 specification in tools/overnight/tasks.json; use normal main commit/push and exact CI/Pages gates, superseding runner-only publication wording.

## D00 / DBL-385 exact-CI retry (2026-10-20)

- Exact candidate0f86c38 workflow39341023318 failed:123 browser cases pass; live-kill assertion inspected actors before asynchronous IndexedDB restoration. Pages did not deploy it. Captured log/source diagnosis recorded in docs/overnight/d00.md.
- Scoped test waits for initial storage/controller readiness and restored-checkpoint status before strict actor/reward ownership checks. No runtime/save/gameplay changes. Fourteen focused units, TypeScript/lint/format and production build pass. Five unaffected W4 browser cases pass; corrected live-kill passes3/3 repetitions. Reload screenshot reviewed.
- Follow-up release remains pending runner-owned exact SHA CI/Pages, artifact identity and hosted six-case verification. No push, D01 or gate approval. Original parent/hardware limits retained.

## D00 / DBL-385 W4 verification candidate (2026-10-20)

- Verification only; runtime/save formats, assets, dependencies and gate approvals unchanged. Added graveyard discovery unit coverage, real-input seed42 discovery/reload in all three generated environments, persisted container ownership/repeat-open checks and a natural monster kill→XP/loot→atomic save/reload check.
- Fourteen focused units, TypeScript/lint/format and Playwright production build pass. Shipped baseline6d26ad3 exact CI/Pages39331041663 successful;26 hosted files match the local build. Hosted six-case W4 verification and reviewed screenshots documented in docs/overnight/d00.md.
- Scoped verification commit publication remains runner-owned and pending: exact new SHA CI/Pages, hosted bytes/tests and machine checkpoint must pass before advancement. No push, D01 or user gate approval in this session. Physical-controller/native-GPU limits retained.

## DBL-010 actual implementation permissions (2026-10-19)

- Supported explicit approval path verified from overnight/development: automatic-review workspace-write Codex executed approved Git index refresh, exact CI read, authenticated remote read and an actual harmless push to overnight/permission-probe-33a3fc5. Ordinary sandbox Git metadata remains protected. No unrestricted mode, rules changes, D00 or tracked gameplay edits. Astra6 Max probe passes.
- Sixteen offline tests and complete15-task dry-run pass; actual implementation build and hosted minimap/movement/save smoke pass, all26 hosted files match. Added tooling-only verify-activation action: D00 start is blocked until exact activation release gates pass and verified SHA is recorded. Existing CI now also runs Python tests/queue dry-run.
- Prior preflight35ab99b now has successful exact CI/Pages39326566635 and deployment7185581214; actual-worktree hosted bytes/smoke verified. This tooling-only integration/publication remains pending at commit time. Final live result/verified SHA will be persisted in .local/overnight/permissions.json and events.jsonl without triggering a self-referential evidence commit. Original main checkout dirty documents retained byte-for-byte.

## DBL-010 D00–D14 activation specification checkpoint (2026-10-19)

- Supplied user specifications now define all15 D00–D14 tasks in tools/overnight/tasks.json; runner loads the versioned queue. Dry-run: D00 eligible, D01–D14 pending predecessor release evidence. Existing DBL numbering/parent edges preserved through explicit narrow slices. No gameplay/D00 executed.
- Fifteen offline tests pass; task prerequisites, exact release gates, isolated branch guards, history/deadline preservation, cancellation/lock/resume and evidence-based model selection verified. Sol6.1 High escalates only after two distinct complex failures to Astra6 Max, returning to Sol after resolution. Static/build verification and real implementation-worktree permission/publication checks are recorded separately below/in activation-evidence.json.
- Original checkout edits remain untouched. Activation branch cannot publish itself through the runner; integration into origin/main and actual implementation-worktree Git/network/Codex permissions are required before READY.

## DBL-010 overnight activation checkpoint (2026-10-19)

- Setup only; no gameplay/unattended execution. Isolated overnight/activation worktree preserves original modified BACKLOG.md, STATUS.md and docs/items/l3.md. D00–D14 authorized, but exact approved specifications unavailable: 15 blocked slots, zero executable deliverables. Dry-run stops safely at D00.
- Twelve offline tests, TypeScript/lint/format/build pass. Evidence-based bounded retries retain cumulative history/deadline; exact-SHA CI, Pages, artifact and smoke failures block release. Added shared repository lock and terminal-independent launch commands. Sol6.1 High/Astra6 Max catalog and prior live probes verified.
- Confirmed Pages4fd6646 deployment7184782837 success; 26 hosted files match and hosted minimap/movement/save smoke passes. Six35ab99b source blobs verified; its CI39326566635 still running. Activation publication and unattended worktree permissions remain unverified. NOT READY. Evidence: tools/overnight/activation-evidence.json.

## W4 / DBL-385 persistent automap checkpoint (2026-10-19)

- DBL-384 runtime dce178e CI/Pages workflow39317420535 completed success (checked once). DBL-385 adds bounded radial terrain-cell reveal and a cached isometric minimap: unexplored cells remain dark; player, discovered spawn/exits and treasure are marked. Tab or controller Map toggles without modal/combat capture; existing M menu/V inventory and non-world routes retain their behavior.
- Exploration state3 explicitly migrates state1/2 with empty discovery per area. Each discovery record binds to the saved area seed/content/layout fingerprint; unknown versions, stale fingerprints, duplicate/out-of-range cells reject safely. Existing character/items/gold/deaths, map fingerprints and generators remain unchanged. Reveal updates only on cell changes; terrain redraw only on layout/discovery/container changes; stop/manual/transition checkpoints reuse atomic persistence.
- Ten focused discovery/container/save cases pass, including wilderness/crypt, repeat reveal, seed/layout isolation and legacy migration. One critical Chromium map-toggle/movement/save-reload case passes6.6s; screenshot test-results/w4-minimap.png reviewed. TypeScript/relevant lint/format/build pass. Reused prior integration evidence; no long route, full regression, loot simulations or GPU claim.
- DBL-385 is the last W4 backlog issue; dependency-ready386 belongs to W5 and is not started. Stop at session budget/W4 review checkpoint: technical380–385 delivered, but new CI/deployment and hosted W4 gameplay gate evidence remain pending. Do not mark W4 quality approved or start W5. Preserve unrelated local edits.

## W4 / DBL-384 container interaction checkpoint (2026-10-19)

- DBL-383 committed f802e61. DBL-384 renders original code-drawn chest/crate/barrel wood/iron props with world depth/occlusion, rare trim, opened lids and nearby highlight. Pointer click or nearby button, keyboard E and existing controller Interact share the validated transaction; dead/paused/modal input is blocked. Existing automatic safe exit travel remains unchanged. Gold/opened HUD and reward sound/state feedback trigger existing atomic autosave.
- One focused browser scenario passes10s: real mouse route to nearby treasure, virtual-controller opening, repeat keyboard input, atomic save/reload and persisted gold/opened identity. Closed/opened screenshots reviewed under test-results/w4-treasure-*.png (not committed); HUD moved away from existing controls. TypeScript/relevant lint/format/build pass; seven383/save cases reused. No long forest route/full regression rerun, no hardware/GPU claim.
- Session checkpoint after383–384.385 persistent discovery/minimap remains dependency-ready and authorized; W4 is incomplete and hosted gate verification remains pending. No W5. Existing save layouts/seeds/fingerprints/progression retained; nested exploration state migration is explicit. Preserve unrelated local edits.

## W4 / DBL-383 seeded one-time containers (2026-10-19)

- Prior checkpoint1e77cd7 CI39314212850 completed success.383 adds container-rule1: up to six deterministic reachable nonblocking chest/barrel/crate positions outside safe camp/anchors, common/rare gold amounts and existing item generator/table rewards. No layout/encounter seeds, fingerprints or character schema changes.
- Exploration state2 explicitly migrates state1 with zero gold/no opened containers while preserving original layout rules. Gold, opened identity and ground rewards share the existing atomic character checkpoint. Drop-capacity/placement failure commits nothing; duplicate opening/reload cannot repeat rewards. Old snapshots remain accepted; malformed/duplicate opened identities rejected.
- Three container cases plus four existing save cases pass; reachability/repeatability/seed variation, ownership/reload and full-drop rollback covered. TypeScript/relevant lint pass. Runtime controls/rendering are next384;385 discovery/minimap remains. W4 incomplete; no new hosted claim or W5 work. Unrelated edits preserved.

## W4 / DBL-382 browser travel CI follow-up (2026-10-19)

- CI39311124008 at542b4af passes check and formatting;118 browser cases pass, only generated forest travel exhausts its total120s budget. The failure is not the historical unit timeout or formatting. Public annotations identify world.spec.ts:101; full log access requires authentication.
- Forest pointer travel retains every pathfinder turn but uses three-unit rather than1.5-unit subdivisions, reducing repeated stop/project/click/wait work on straight segments. Existing arrival, transition, atomic reload and isolated restart assertions and per-hop10s timeout are unchanged. Only this full-trip case receives180s total CI headroom; global settings remain unchanged. No runtime/save/seed changes.
- Local baseline passes49.9s; reduced-stop route passes46.3s with identical assertions. TypeScript/relevant lint/format and build pass. No full regression repeated. Publication is a candidate fix pending CI; no W4 hosted claim. W4 remains380–382 delivered,383–385 pending; W5 untouched.

## W4 / DBL-382 reward context and safe checkpoint (2026-10-19)

-380/381 delivered as0831dff/363e1c5.382 binds future generated-world loot levels1/3/5 on load/restore/travel, retaining content tables, global seed/sequence, reserved/parked ownership and existing pickup transactions. Legacy content1 loot policy, item rolls, maps/fingerprints and character save schema remain unchanged. Version1 encounter plan checksum is pinned against accidental identity drift.

- Seven focused reward/lifecycle/save cases plus seeded placement case pass. Targeted Chromium live-ID checkpoint/reload passes and asserts stored forest reward level1; earlier screenshot reviewed. TypeScript/relevant lint/format/build pass. No broad regression, loot simulation, hardware/GPU or hosted-completion claim.
- Session-budget checkpoint after the three related380–382 increments. Next383 containers/one-time item+gold rewards,384 interactions,385 persistent discovery/minimap remain authorized. W4 remains incomplete; stop before W5. Preserve unrelated local edits. W4 evidence docs/world/w4.md; hosted gameplay verification belongs at the W4 gate.

## W4 / DBL-381 encounter lifecycle (2026-10-19)

- Existing AI/skills/lifecycle now run in generated world scenes, retaining the one player/progression authority. Packs defer within9 units of a restored player, use existing50-actor/path limits and champion mechanics, with provisional area/elite stat scaling. Camp/legacy small floors stay safe; survivors reset home, defeated IDs remain defeated.
- Existing per-area death snapshots and global loot sequence/ownership are reused; XP death ledger restores all area-namespaced IDs. Two lifecycle/reward replay tests plus four save cases pass,380 placement case passes. One Chromium live-ID save/reload case passes; screenshot reviewed. TypeScript/relevant lint/build pass. No schema, map seed or fingerprint changes.
  -380 committed0831dff. Next382 area-level loot binding before publication, then383–385 containers/discovery. Developer-only peaceful option isolates old visual/navigation scenarios, never default gameplay. W4 is incomplete; no hosted completion claim or W5 work. Unrelated edits preserved.

## W4 / DBL-380 seeded encounters (2026-10-19)

- User approves W3 and authorizes W4 DBL-380–385 only; stop before W5 IDs386+. Outstanding audit CI39307638495 inspected once:still in_progress, no new deployment claim.
  -380 adds pure encounter-plan1: forest skirmishers, graveyard mixed shield/support groups, crypt tank/caster groups; normal/champion/occasional elite leaders. Up to15/18/28 actors, stable area-namespaced IDs and independent RNG,9-unit anchor protection, actor-clear placement and swept intra-pack connections. Maps/fingerprints/save data unchanged. No runtime/reward adoption under380 alone.
- Focused12-layout/seed placement case, TypeScript/relevant lint/format pass. Next381 lifecycle/death persistence,382 loot scaling. W4 remains incomplete; no containers/minimap or hosted claim. Unrelated edits preserved. Evidence docs/world/w4.md.

## DBL-379 / W3 final technical review (2026-10-19)

- DBL-378 committedfb24201.379 connected review complete: four existing hosted environment cases4/4 (48.9s), one inspected screenshot per area, exact fingerprint/camera/real input/travel checks. Reused successful broad CI and earlier ownership/save/transition evidence; no unrelated regression, benchmarks or regenerated art.
- Exact public runtime7b268e87f5d7985de3d27f65f682cf6580fc760d verified: CI39302518214 verify/deploy success; Pages deployment7181832950 success, public index-DjRiEKMB.js matches local build, all7 bitmap hashes match audited source/exports. Evidence and screenshot hashes: docs/world/w3-review.md; review copies /private/tmp/hollowbane-w3-final-review/.
- Failed39290173775 tested533740e with a missing first-case local timeout; existing6bccd6f fixed it minimally. Both affected unit cases pass locally; no global timeout/assertion changes now. Asset/detail audit validates23 records,7 hashes and4.216MB transfer budget; native GPU/physical controller/release rights limits remain open.
- Stop at W3 quality gate: scoped374–379 technically complete, user visual approval pending. No W4/W5. Audit commits change validation/docs only; their post-push CI/Pages outcome must be recorded separately, not claimed from the deployed runtime's success. Preserve unrelated local edits.

## DBL-378 asset/detail audit (2026-10-19)

- Exact CI39290173775 failed on533740e: first world-layout case omitted a per-test timeout and inherited Vitest5s; only the second case then had15s. Existing6bccd6f minimally corrected the first case, preserving assertions/global unit settings. Reran affected file2/2 plus two appearance/camp cases:4 focused tests pass. Later runtime7b268e8 passed complete CI/Pages39302518214; no duplicate timeout fix introduced.
- DBL-378 now pins seven original source/export pairs by SHA256 and byte size, registers native world/camp code provenance and verifies per-file/aggregate/nominal decoded texture budgets through existing asset validation. Source art unchanged. Four-seed static scene counts/bounds and remaining release/hardware limitations recorded in docs/art/w3.md and w3-inventory.json.23 asset records and alpha/pivots/budgets pass; relevant lint/format pass.
- Next379 connected visual/navigation and hosted verification only. Preserve original IDs/dependencies and unrelated local edits. W3 review remains pending; no W4/W5.

## DBL-114/004 skill confirmation CI repair (2026-10-19)

- Quick mouse→Tab→Enter confirmation could be canceled by the click callback's device handoff before it read pending state. The callback now matches prompt policy: mouse/keyboard preserve pending confirmation; transitions to/from gamepad cancel. Added explicit focus assertions to legacy discipline/keyboard allocation browser coverage. No timeout/skill/save rule changes.
- All4 targeted skill-tree Chromium cases pass (mouse/save/reload, keyboard confirmation/repeat, virtual Xbox/PlayStation/cancel/disconnect). TypeScript/relevant lint/format/build pass. No full regression or physical-controller claim. W3 review stop remains; no W4/W5 or new phase work. Unrelated edits preserved.

## DBL-373 / W3 browser CI repair (2026-10-19)

- Attached CI log exposed a camp click outside the displayed viewport after travel, a forest waypoint wait and a legacy save expectation still pinned to schema4. Destination travel now precedes layout/camera presentation updates, and world diagnostics publish after rendering so area/position/camera describe the same displayed frame. Mouse waypoint checks stop prior movement and await walking=false before projection. Legacy browser assertion expects CHARACTER_SCHEMA while retaining previous schema1/item identity checks.
- Only three failing browser cases rerun: legacy IndexedDB upgrade, camp→forest→camp and forest mouse/keyboard/save/reload/isolated restart pass. Camera-centering regression assertion added after each camp transition; no forced clicks, skipped assertions or relaxed collision tolerances. Three focused view/runtime unit cases, TypeScript/relevant lint/format/build pass; camp screenshot reviewed.
- Existing unit5s failure was already fixed by6bccd6f; no further timeout increases. No save format, seeds, fingerprints or simulation rules changed. W3 review stop remains; no W4/W5. Preserve unrelated local documentation and external-result notes.

## DBL-375 / W3 CI timeout follow-up (2026-10-19)

- User CI evidence: historical/reproducibility world case exceeded5000ms at5439ms; the separate roundtrip case passed7461ms with its existing15s limit. The first case now also explicitly allows15s. Both cases retain every assertion, seed, path and fingerprint sample; no runtime/global unit timeout changes.
- Only world-layout.test.ts rerun:2/2 pass. TypeScript/relevant lint/format pass. No browser/full regression needed for a test timeout-only fix. W3 review stop remains; no W4/W5 work. Unrelated local edits preserved.

## DBL-377 / scoped W3 environment review candidate (2026-10-19)

- DBL-375 forest committed4d6995a;376 graveyard committed88bc39c.377 crypt now renders textured modular stone walls on existing solid boundary cells, original-footprint pillars, floor variations, torch-bearing arches and bounded static lantern pools. Existing generated rooms/corridors, exits and collision remain authoritative; no seeds/fingerprints/save contracts changed.
- Targeted appearance tests cover four seeds, legacy/current dispatch and all three biomes, scenery placement and unchanged fingerprints. TypeScript/relevant lint/build and21 asset records/alpha/pivots/budgets pass. One representative browser travel case per new environment passes; screenshots reviewed. No unrelated simulations, broad regression, physical-controller or GPU benchmark claim. Art provenance/budgets: docs/art/w3.md.
- Browser default timeout60s and slow world roundtrip unit timeout15s replace30s/5s; assertions unchanged. No remote timeout fix is claimed before CI evidence.
- Stop for scoped374–377 W3 environment quality review; user approval pending. Dedicated378–379 follow-ups remain open, not silently closed. No W4/W5 begun. CI/Pages check once after push; do not claim hosted verification without success evidence. Unrelated local documentation preserved.

## DBL-376 graveyard checkpoint (2026-10-19)

- Generated graveyard now renders gothic monuments, dead trees, fallen masonry, iron fence details, mist and labelled forest/crypt connections. Original transparent torch-lit crypt portal is anchored to existing solid terrain near the exit. Foot depth/occlusion shared with forest; no maps/seeds/navigation/fingerprints changed.
- Focused appearance/placement test across both biomes and legacy/current rules, TypeScript/relevant lint/build and asset alpha/pivot validation pass. One virtual-controller graveyard→forest browser case passes; screenshot reviewed at test-results/w3-forgotten-graveyard.png. No unrelated simulations or performance benchmark.
- DBL-375 committed4d6995a. Next377 crypt remains authorized. W3 quality review pending; no W4/W5. CI/Pages check after publication only; unrelated edits preserved.

## DBL-375 forest checkpoint (2026-10-19)

- Original leafy oak plus reused dead trees/fallen masonry, mossy path edges, rooted vegetation, bounded mist, foot-depth sorting and near-player canopy fading decorate existing generated forest cells. No navigation, seed or saved fingerprint changes. Sources/exports/provenance retained in docs/art/w3.md.
- Three focused environment/world-layout cases, TypeScript/relevant lint/build and alpha/pivot asset validation pass. Forest mouse travel/return passes; screenshot reviewed at test-results/w3-haunted-forest.png. No broad simulations or benchmark claim.
- Standard browser timeout60s; slow world roundtrip unit case15s, with assertions unchanged. Next376 graveyard then377 crypt remain authorized; W3 review pending. No W4/W5. CI/Pages check deferred until publication as requested. Unrelated edits preserved.

## W3 / DBL-374 checkpoint (2026-10-19)

- W2 approved; W3 DBL-374–377 authorized.374 camp technical candidate delivered: textured paving/apron, original transparent shelters/fire, reused ruins/trees/lanterns, static amber pools, exit sign and foot-depth layering. No generator/map/navigation/save changes; legacy/current camp fingerprint preserved.
- Seven targeted camp/layout/save tests, TypeScript/relevant lint/build and asset transparency/pivot/budget checks pass. Chromium camp→forest→camp passes; revised screenshot reviewed at test-results/w3-ashen-refuge.png. Source art/runtime exports/provenance retained in docs/art/w3.md. Bounded static layers only; no measured hardware-performance claim.
- Safe session-budget stop after374. Next375 forest, then376 graveyard and377 crypt; other areas retain W2 previews. W3 quality gate remains pending. No W4/W5 begun. Latest CI checked once but gh unauthenticated; no CI/Pages/public demo verification.
- Preserve unrelated BACKLOG/STATUS/L3 edits. W3 continuation remains authorized; do not infer completion of375–377 or broaden scoped IDs.

## DBL-373 / W2 runtime checkpoint (2026-10-19)

- New content2 expeditions integrate generator1 forest/graveyard/crypt geometry, live terrain/prop rendering, following camera, existing logical navigation and safe travel. Original primitives preview W2 geometry; W3 appearance placeholders remain. No W3 work started.
- Content1 restores exact original layouts/seeds and two-area availability. Content2 requires per-area layout fingerprints; drift/invalid data rejects before character mutation. Existing atomic checkpoint/CAS and single player/progression/item/loot authorities remain; no automatic layout conversion.
- Isolated developer seed/start-area/restart controls and current area/seed/layout/generator display use separate test-run databases; normal player storage is untouched. See docs/world/expedition.md.
- 378 unit tests, TypeScript/relevant lint/build/backlog validation pass. Two Chromium forest mouse/keyboard/save/reload/restart and crypt virtual-controller corridor/travel cases pass; screenshots reviewed. No physical-controller claim. Latest CI inspected once but gh unauthenticated; no remote CI/Pages/public demo verification.
- DBL-373 and W2 technically complete; stop here per current request. No W3 authorization inferred. Preserve unrelated BACKLOG/STATUS/L3 edits and historical external-result notes.

## DBL-372 checkpoint (2026-10-19)

- Bounded three deterministic candidate attempts for wilderness/dungeon, then validated fallback. Reuses371 placement/navigation validation; first-attempt version1 fingerprints unchanged. Registered area seeds and character/loot streams preserved; invalid input/fallback fail closed.
- 14 focused generation/retry/validation tests, TypeScript/relevant lint pass. No runtime/save/browser change. CI39275923451 checked once but gh unauthenticated; no CI/deployment claim.
- Next373 versioned runtime integration is authorized; W2 incomplete, no W3 started. Unrelated local documentation preserved.

## Generation validation checkpoint — DBL-371 (2026-10-19)

- DBL-370 committed99e995b.371 extracts shared actor-clearance/swept connectivity from wilderness, validates prop footprints against actual ground, prop/placement overlaps, reserved spawn/exit/arrival zones and bounded room placements. Dungeon checks room bounds/overlap, unique connected corridor metadata and actual swept room connections. Outdoor/dungeon version1 fingerprints remain unchanged.
- 18 focused dungeon/wilderness/shared-validation/save/travel checks, TypeScript/relevant lint pass. Pure candidate generation only: no live world/save contract/rendering changes or browser/full regression/loot simulations. Existing schema5/content1 areas stay pinned; no silent migration.
- Git sync published four prior commits through993f1cc after review/dry-run. CI39275311814 checked once at993f1cc was in progress; no deployment claim. This newly verified370/371 batch is ready for normal fast-forward publication; record push outcome in final report rather than assume success.
- Exact next DBL-372 bounded generation retries/fallback, then373 reproducibility/versioned integration before runtime adoption. Stop after the selected370/371 batch; W2 and full expedition remain incomplete. Preserve unrelated BACKLOG/STATUS/L3 edits.

## Dungeon checkpoint — DBL-370 / Git sync (2026-10-19)

- Reviewed unpublished8090595/3a220b5/b7606a9/993f1cc against remote b737d96: fast-forward ancestry, intended source/docs/tests only, no artifacts or credential-pattern matches. Formatting fix verified;13 focused checks/TypeScript pass. Dry-run then normal push succeeded through993f1cc; no history rewrite/unrelated edits staged.
- Resulting CI39275311814/993f1cc checked once: in progress, not successful/deployed evidence.
- DBL-370 adds versioned pure dungeon candidates: three reusable room sizes, seeded connected corridors, optional leaf rooms/dead ends, entrance/exit anchors, circular pillar footprints and future monster/treasure placement zones. Four focused deterministic/connectivity/invalid-input/fallback cases pass; TypeScript/relevant lint pass. Logical pillar appearance is a W3 placeholder, no artwork added.
- Next371 shared placement/navigation validation, then372 bounded retries. Runtime/save adoption remains later373; existing world content1/schema5 layouts remain untouched. Current dungeon authorization supersedes historical exclusions below. W1–W5 incomplete.

## Outdoor composition checkpoint — DBL-369 (2026-10-19)

- DBL-368 committed b7606a9;369 composes20 modules through a seeded spanning tree, winding passages, clearings and exact named entrances/arrivals. Original circular footprints follow rotated stamps. All walkable cell centers and anchors are checked with actor clearance/swept collision; invalid outdoor candidates use a deterministic validated clearing fallback.
- 13 focused module/generation/save/travel tests pass, including nine representative seeds, route variation, an exact version1 digest, blocked entrances, split terrain and forced disconnected-extension fallback. TypeScript/relevant lint pass. Pure generation only: no rendering changes, browser tests, loot simulations or benchmarks. W1 runtime/schema5/layout1 saves remain pinned and unchanged; new layout1 is separately scoped to the wilderness generator, not installed as world content1.
- No additional ready authorized issue: next graph node DBL-370 is dungeon generation, expressly excluded.371 navigation validation and372 general retries/fallback retain their dependencies and remain planned;369 includes only its local outdoor safety guard, not their broader acceptance.373 remains later seeded/runtime integration. Stop before370; W1–W5 expedition incomplete.
- Remote main remains b737d96 and latest CI39267892319 is the old formatting failure. Local366 onward have not been pushed; no new CI/Pages success claimed. Unrelated local documentation preserved.

## Wilderness modules checkpoint — DBL-368 (2026-10-19)

- Five original data-driven logical module kinds: path, clearing, forest, obstacles and ruins; seeded selection, quarter-turn masks and matching circular collision footprints. Two focused tests cover all20 rotated modules, ports, deterministic choices and invalid inputs; TypeScript/relevant lint pass.
- Collision-only appearance tags `wilderness-boulder-footprint` / `wilderness-ruin-footprint` are unresolved W3 renderer placeholders, not external artwork. Pure generator foundation only; version-one saved layouts and runtime remain unchanged.
- Remote main is b737d96; local366/367 have not reached GitHub. Latest CI39267892319 failed pre-fix formatting; no new deployment evidence.
- Next DBL-369 seeded outdoor composition. DBL-370 dungeon work is explicitly excluded this session;371/372 retain their original370/371 dependencies and cannot be closed as ready wilderness issues. W1–W5 remains incomplete.

## World persistence checkpoint — DBL-367 (2026-10-19)

- Schema5 adds optional versioned exploration to the existing checksum/CAS/current+previous IndexedDB transaction. Persists area, four derived seeds, position, discovery, parked ground items and per-area loot death identities. One global loot stream and nested item ownership remain authoritative. Schema1–4 saves migrate without inventing exploration.
- World route restores validated layout/navigation/position and character together; exit-zone positions resume at a clear spawn. Invalid/unknown/unavailable area references reject without partial load, retain originals and leave the safe camp session available with explicit backup recovery. Character-only routes refuse exploration restoration and lock saving rather than overwrite world state. Out-of-bounds legacy ground items require retained-original recovery/export, never silent relocation/deletion.
- 31 focused save/progression/equipment/runtime/navigation/ownership checks pass; TypeScript/relevant lint pass. Chromium save→reload in forest→camp and IndexedDB world+character backup/stale-tab/corruption recovery pass. No loot simulations or physical-controller claim. Original temporary W1 floors remain; complete expedition is not delivered.
- CI inspected once: latest39267892319 still targets b737d96 and failed formatting;8090595 has no published run, so its correction is not remotely verified. No new Pages claim.
- W1 technical scope362–367 is complete. No dependency-ready W1 issues remain: exact next DBL-368 is W2 reusable wilderness modules, followed369 seeded outdoor composition. Session-budget stop; W1–W5 authorization remains active through World review.

## World runtime checkpoint — DBL-366 (2026-10-19)

- `?world=1` integrates original temporary logical camp/forest floors and exit markers with the existing Phaser scene, pointer/keyboard/virtual-controller movement and logical swept navigation adapter. One live player/progression authority survives travel; area-local actors/projectiles clear only after validated commit. W2 generation/W3 art remain pending; no external assets added.
- 13 focused unit checks, TypeScript/relevant lint, build and two Chromium mouse/virtual-controller camp→forest→camp cases pass; screenshot reviewed. Prototype intentionally has no storage/inventory binding until DBL-367; no physical-controller claim.
- Latest CI39267892319 at b737d96 failed format:check; deploy skipped. Reproduced committed BACKLOG missing blank lines, fixed only that formatting in the index while preserving unrelated local edits. No new hosted claim.
- Soft session-budget checkpoint: next DBL-367 atomic world/character persistence, then DBL-368 W2 modules. W1–W5 authorization remains active through World quality review; complete expedition is pending.

## World & Exploration checkpoint — DBL-365 (2026-10-19)

- DBL-365 owns only immutable travel/layout state. Prepared transitions verify proximity, registered destination and area seed, deep-copy validated destinations, reject forged/canceled/stale/cross-session/replayed handles and retain old state on failure. Three focused transition cases plus two anchor cases, TypeScript and relevant lint pass; no character/save mutation.
- Next: DBL-366 runtime lifecycle/two-area prototype, then367 atomic world persistence. W2–W5 remain pending.
- W1–W5 remains authorized; stop at World quality review. No complete expedition or new hosted claim. Preserve pre-existing L3 changes; physical-controller evidence remains open.

## World & Exploration checkpoint — DBL-364 (2026-10-19)

- DBL-364 validates exact registered exits, clear actor-radius spawns/triggers/arrivals and separation from every exit interaction zone. Two focused tests, TypeScript and relevant lint pass. Logical anchors only; runtime integration follows DBL-366.
- Next: DBL-365 prepared atomic transition domain; then366 runtime prototype and367 save binding.
- W1–W5 remains authorized; stop at World quality review. No complete expedition or new hosted claim. Preserve pre-existing L3 changes; physical-controller evidence remains open.

## World & Exploration checkpoint — DBL-362–363 (2026-10-19)

- User authorizes autonomous W1–W5 through World quality review. C13 technical prerequisite complete: CI39165184187 / e14335fad98afbc7464ae2c2a0505ce465af619b verify+Pages success; public index-DBDMEo57.js matches; three hosted class cases pass, Warrior screenshot reviewed. No physical-controller/balance claim.
- DBL-362 pure four-area registry, reciprocal connections and stable versioned area seeds delivered; three focused tests, TypeScript/relevant lint and backlog validation pass. No runtime world integration or public expedition yet.
- Thirty increments DBL-362–391 registered without renumbering original IDs/parents; scope and continuation docs/world/expedition.md. DBL-363 logical terrain/object/navigation contracts also delivered: two focused clearance/validation tests (five combined), TypeScript/relevant lint pass. Next DBL-364 spawn/entrance anchors, then365 safe transitions,366 runtime prototype,367 persistence. Continue sequentially under W1–W5 authorization; no new approval required before World review. Soft session checkpoint; resume at DBL-364. Existing src/world/navigation.ts uses projected ground-image pixels; preserve it and add an explicit logical-map adapter at366 rather than mixing units.
- Preserve pre-existing BACKLOG.md/docs/backlog.json/docs/items/l3.md/STATUS.md changes separately. Hardware, artwork, provisional class balance, broader parent and issue-sync follow-ups remain open. This checkpoint supersedes historical “no world authorized” notes below.

## C13 Linux inventory references reviewed (2026-10-18)

- CI39164518366 /63bd4c8 passed check/format and110 Chromium cases; only two Linux inventory visual references failed. Advanced browser verification and Pages deployment were skipped; C13/user quality approval remain pending.
- Retrieved public artifact12150163212, verified artifact expected images exactly matched repository references, and reviewed both Linux actual/diff pairs. Copied only the exact1920/1024 Linux actuals for the intended Skills summary/layout shift (1920 height858→930). No tolerance/assertion changes or platform substitution. Provenance/full hashes: docs/character-classes.md.
- Reference-only follow-up; reused CI simulation/type/lint evidence, no local broad tests or loot simulations. Next: push this increment, confirm regular Linux/advanced CI checks and exact Pages SHA/assets, then run hosted class tests. Stop at C13; physical hardware, provisional balance/planned nodes and unrelated local edits stay open.

## C13 CI failure / safe publication checkpoint (2026-10-18)

- Runtime83593130685becfcbaa40d65f67f98ee24c2427c pushed; CI39164311209 FAILED in npm run check; Pages skipped. Public index-BJpbzwJa.js is still the prior progression build; candidate index-DBDMEo57.js is NOT hosted-verified. C13 and user quality approval remain pending.
- Fixed stale future-schema assertion at advanced-loot.test.ts:235: schema3 replacement was a no-op for schema4. Both schema assertions now use CHARACTER_SCHEMA. Three focused save tests, TypeScript/relevant lint pass; no local full regression/million-roll initializer/loot simulations rerun. Existing31 focused class/persistence checks and three keyboard/mouse/virtual-controller class scenarios passed. Two reviewed Darwin references pass normal comparisons.
- Resume: inspect successor CI triggered by this commit, resolve actual failures; Linux inventory references likely need actual Linux image review for the intended Skills summary. Do not copy Darwin references or relax tolerances. Confirm exact CI/Pages runtime SHA, then run three hosted class flows. Prior failed run: https://github.com/tobisen/hollowbane/actions/runs/39164311209 . Detailed evidence/hashes: docs/character-classes.md.
- Candidate URLs: https://tobisen.github.io/hollowbane/?developer=1&classLab=warrior (also sorcerer/ranger); deployment pending. STOP at C13; no world/campaign. Preserve unrelated L3/backlog edits, provisional balance/planned nodes and physical-controller follow-ups.

## C13 class quality publication candidate (2026-10-18)

- Scoped DBL-113/115/116:31 focused unit checks, three keyboard/mouse/virtual Xbox–PlayStation class combat flows, TypeScript/relevant lint pass. Reused prior class/save/equipment evidence. Fixed bare class-lab routing and conflicting encounter/loot flags; class lab creates no inventory/IndexedDB access and no NPC spell casts.
- Reviewed/refreshed only two Darwin inventory references for the intended Skills summary; assertions/tolerances unchanged. Linux references require real Linux evidence. No full local regression or loot simulations; existing CI requires full regression.
- Publication authorized; inspected SSH push dry-run (remote1ce9e92 → local25fb180 before this increment). Next: push this verified candidate, record exact CI/Pages SHA/result, review real failures/Linux images and run hosted class scenarios. C13/user quality approval remains false until review. Candidate demo: https://tobisen.github.io/hollowbane/?developer=1&classLab=warrior (also sorcerer/ranger); hosted verification NOT yet claimed.
- STOP at C13; no world/campaign. Preserve unrelated local edits and provisional balance/planned-node/physical-controller follow-ups. Evidence: docs/character-classes.md.

## C10–C12 class gameplay complete (2026-10-18)

- C10–C11 domain committed f1c50ed (scoped DBL-110/112/113). C12 connects shared class mechanics/descriptions/HUD/skillbar and correct pointer-source aiming; schema4, old ranks/items and six legacy abilities preserved. No permanent class switching/respec/new tree UI.
- Developer-only `?developer=1&classLab=warrior|sorcerer|ranger` creates memory-only level12 starter fixtures and passive targets; inventory/save UI is excluded. Browser checks deny IndexedDB access, proving no character checkpoint reads/writes on this route.
- 59 focused unit/7 targeted Chromium cases pass; TypeScript, relevant lint/format/build pass. Class/skill screenshots reviewed. Provisional balancing, planned nodes, physical controllers and broader parents remain open; no full regression/loot simulation/publication claim. Details: docs/character-classes.md.
- STOP after C12. Await explicit continuation; preserve unrelated local L3/backlog edits and all hardware/art/performance follow-ups.

## C10–C11 class combat domain verified (2026-10-18)

- Scoped DBL-110/112/113: heavy guarded-stagger Warrior melee/defensive armor buff; Sorcerer projectile/slow control; Ranger precise poison/piercing projectiles. Attribute scaling, one ranked passive and conditional direct-hit synergy per class use existing modifiers, fresh baselines and duplicate-hit prevention.
- 59 focused unit tests, TypeScript/relevant lint pass. Schema4, existing IDs/ranks and six unclassed abilities preserved; no switching/respec. Original broader parents remain partial.
- C12 remaining: commit browser/HUD/description integration and isolated memory-only developer fixture route with final seven-case browser evidence/screenshot review. No next-phase authorization. Details: docs/character-classes.md; preserve unrelated local edits.

## C7–C9 skill-tree UI complete (2026-10-18)

- Scoped DBL-111/114/204/004/210 delivered: gothic Skills panel, three branches per discipline, prerequisite/state/rank display, shared-rule current/next effect inspector, confirmed allocation and learned-active skillbar assignment. No new abilities/respec.
- Existing semantic keyboard/mouse/controller input retained; repeated input, stale state, cancel/disconnect/device changes protected. Optional validated schema4 bar preserves prior saves and legacy six-skill access. Permanent discipline choice is explicit and changes skill access only, preserving attributes/items.
- 33 focused unit/8 targeted Chromium cases, TypeScript/relevant lint/format/build pass; desktop/narrow screenshots reviewed. Controller evidence is virtual Xbox/PlayStation only. Planned nodes/hardware/broader parents remain open. Evidence: docs/character-classes.md.
- STOP after C9. Await new authorization before further classes/gameplay; preserve unrelated local L3/backlog edits and hardware/art/performance follow-ups.

## C4–C6 skill progression/combat complete (2026-10-18)

- Authorized C4–C6 delivered under scoped DBL-103/111/110/210; original broader parents/dependencies remain partial. One skill point per gained level, separate immutable budget/high-water ledger; atomic validated rank increments and stale-state rejection. No respec/UI.
- Existing cast intents enforce class unlocks and configurable ranked damage/poison/power; timing/cooldowns/input rules unchanged. Committed casts/projectiles snapshot rank effects. Unclassed compatibility retains all six existing skills and passive.
- Schema4 strictly persists ranks/budgets/class/tree versions; explicit1/2/3 migration preserves prior progression/items and awards unspent level−1 skills without assigning a class. Runtime save/restore/encounter resets retain the ledger.
- 56 focused tests, TypeScript, focused lint/format pass. No E2E/full regression/loot simulations. See docs/character-classes.md. STOP after C6; await new scope, no skill-tree UI. Preserve pre-existing local L3/backlog edits and hardware/art/performance follow-ups.

## C1–C3 class/skill-tree foundations complete (2026-10-18)

- User approves P1–P11 (1ce9e92); C1–C3 bounded scope delivered under DBL-113/111/115. Broader original parents/dependencies remain partial and unchanged.
- Warrior/Sorcerer/Ranger configurable class data; shared XP/attribute/equipment engines; versioned nine-branch tree data, ranked prerequisites and unavailable planned ability extension points. Existing six active skills and saves unchanged.
- Eight focused unit tests, TypeScript, focused lint/format pass. No browser changes/E2E, full regression or loot simulation. Evidence and provisional-data limitations: docs/character-classes.md.
- STOP after C3. Next: await user-defined continuation scope before runtime class selection, skill point allocation or rendering. Preserve pre-existing local L3/backlog edits and hardware/art/performance follow-ups.

## P11 release verified — DBL-109 complete (2026-10-18)

- Verified runtime51a943ac96f845a9f749262436c146ea9244511f: CI39159873168 success;105 Chromium and15 advanced cross-browser cases pass, including unchanged Linux visual comparisons. Existing320 unit evidence reused locally; CI check/format passed.
- Pages deployment7159839021 success, exact same SHA; public index-BJpbzwJa.js matches the local production build. Seven hosted panel/allocation/save/reload/migration/virtual-controller cases pass; hosted screenshot reviewed.
- DBL-109 / P11 technically complete. STOP at Character Progression quality review; user approval remains false. No Character Classes/Skill Trees or further gameplay. Physical controllers/reference hardware and broader partial parents remain open. Detailed release/provenance evidence: docs/progression.md.
- Commits994eac1, a7f1868 and51a943a pushed. Pre-existing L3 documentation/backlog edits remain separate and uncommitted; do not discard them.

## P11 Linux visual follow-up (2026-10-18)

- Successor39158266321 /a7f1868:103 Chromium passed, only2 Linux inventory references failed; advanced cross-browser step/deploy skipped. Controller fixes confirmed by CI.
- Retrieved current public test-evidence through nightly.link, resolving direct API401. Reviewed both Linux actual/diff images: intended Character summary/layout and progression footer changes, no unexplained geometry/control regression. Updated only matching1920/1024 Linux baselines; assertions/tolerance unchanged. Provenance/hashes: docs/progression.md.
- Next: regular successor Linux comparisons, advanced browser step, CI/Pages SHA, then hosted critical character/allocation/save/reload flows. DBL-109 remains partial and user quality approval false. No classes/skill trees. Existing320 unit evidence reused; no new simulation/benchmark.

## P11 release verification checkpoint (2026-10-18)

- CI39156818075 /466bf7c FAILED: check/format passed; Chromium95 passed/10 failed; deploy skipped. Eight failures were controller-route/laboratory-text regressions; two Linux inventory comparisons remain unreviewed. DBL-109 stays partial; quality approval false.
- Restored right from Close to Equipment, retaining down to Character; updated laboratory assertion to starts-at40. Verified15 affected/critical Chromium cases, including allocation/save/reload/migration and virtual controllers;2 Darwin visual comparisons pass without updates. Reviewed both references and character screenshot. TypeScript, focused ESLint/format and production build pass; reused320 unit passes, no unit/benchmark rerun.
- Reviewed local994eac1 as appropriate for publication. Linux artifacts12147467280 require authenticated download (401); failed-job log403; gh has no authentication. Public annotations identify exact failures. No Linux references changed or tolerances relaxed. Hosted index remains index-DnCJfCbe.js; progression hosted verification is blocked by skipped deployment.
- Resume: obtain/review Linux actual/diff images from test-evidence; resolve only justified reference changes, verify regular comparisons and advanced checks, then confirm successor CI/Pages and hosted character/allocation/save flows. Stop at progression review; no classes/skill trees. Detailed evidence: docs/progression.md. Pre-existing L3 edits preserved separately.

## Latest progression checkpoint — P11 publication/visual checkpoint (2026-10-18)

- Soft-budget checkpoint: P10 delivered/pushedfcd3af1; P11 local check/build320 units and7 focused browser flows pass; runtime466bf7c pushed to main. Character Progression quality gate remains INCOMPLETE/user approval false. No new gameplay work.
- CI39156818075 for466bf7c was in progress, last step browser dependency installation. Inspect its final jobs/artifacts before proceeding: https://github.com/tobisen/hollowbane/actions/runs/39156818075 . Prior L3 CI39117110123 independently confirmed success, not progression evidence.
- Directly affected inventory visuals failed against old references. Reviewed both Darwin actuals (1920/1024), replaced baselines and verified2/2 without update mode. This reference/checkpoint follow-up commit remains local to avoid canceling the currently collecting CI run. Inspect git log/status for the exact local head; do not discard it. Pre-existing L3 docs/backlog edits remain separately unstaged.
- NEXT: resolve actual CI failures; capture/review Linux inventory and advanced-item references affected by panel/footer; retain all assertions/tolerances. Do not substitute Darwin baselines or call exclusions passes. Check critical normal-character gear/loot flows at new level1. Then push verified follow-up, confirm full CI/Pages, and run hosted character-controller plus allocation/save/migration checks. No large loot simulations needed.
- Public index still index-DnCJfCbe.js; progression build index-CVMXKv8V.js/combat-arena-BRv-XqEg.js. Hosted progression/save NOT verified. Schema1/2→3 compatibility locally covered; physical controllers and reference GPU unverified. See docs/progression.md. Stop at progression review; no classes/skill trees/vendors.

## Latest progression checkpoint — P11 technical candidate (2026-10-18)

- P10 committedfcd3af1. P11 technical candidate verified: npm run check320 unit tests/80 files, TypeScript/lint/assets/backlog/build; formatting passes.4 Chromium panel/allocation/persistence/migration cases and3 virtual controller cases pass. Actual timed monster kill→XP→points→equipment→save and all99 level budgets covered.
- Stop at Character Progression quality review; user quality approval remains false. No classes/skill trees/vendors. Balance is provisional (quadratic costs, fixed monster base XP, no level scaling/champion premium); see docs/progression.md. Physical controllers/reference hardware unverified. Schema1/2→3 item ownership/migration remains covered.
- Publication authorized. Remote main verified2c8218d; local P1–P11 commits need push to existing verify-deploy workflow. Required CI full browser regression/Pages and hosted character/save checks are NOT yet verified. Local combat-arena asset is combat-arena-BRv-XqEg.js. Record exact CI/run/runtime evidence after publication.
- Prior uncommitted L3 documentation/backlog changes remain separate. Original broad source issue parents remain partial. If session limit interrupts publication, resume external verification only; no further gameplay work.

## Latest progression checkpoint — P10 (2026-10-18)

- Current user authorizes P10 then P11 and existing CI/Pages publication through Character Progression quality review. This supersedes the prior P9 stop only for this scope; no classes/skill trees/vendors.
- P10 controller implementation verified:3 Chromium scenarios for virtual Xbox/PlayStation/remapped generic, held allocation and disconnect/mouse/reconnect/cancel;19 focused units, TypeScript and relevant lint pass. Screenshot reviewed. Physical hardware remains unverified.
- P11 quality work now has2 passing focused tests for actual timed monster kill→XP→points→equipment→save, deduplicated XP/loot and all99 level budgets. These tests are not yet part of a verified P11 commit.
- Next: run required final check/build once, critical character persistence/browser checks, commit P11 evidence, push existing main CI/Pages workflow and verify hosted panel/save. Record inaccessible/pending external results honestly. Pre-existing L3 documentation edits remain separate.

## Latest progression checkpoint — P9 complete (2026-10-18)

- P7–P9 technically delivered. P7 commit8e72707, P8 commit14a22b6; this P9 increment completes current authorization. STOP: do not begin P10/P11 or later work without a new request. Broad DBL-108/104/210 parents remain partial beyond these scoped slices.
- Schema3 persists strict versioned progression; schema1/2 migrations preserve all item/embedded ownership and loot state, map legacy level to threshold XP/unspent budget. New normal characters start1; separate item laboratory starts40. Single progression authority supplies UI, requirements and saves. See docs/progression.md.
- P9:24 focused save/runtime cases pass; full unit run316/318 initially (2 hardcoded schema2 assertions), both updated and verified in targeted rerun. TypeScript/relevant lint/backlog checks pass. Four Chromium scenarios pass across corrected runs; reviewed panel screenshot at P7/P8. No final P11 quality gate claim or physical-controller verification.
- Browser evidence includes earned-point allocation, duplicate-click rejection, corrupt-import atomicity, save/reload and legacy IndexedDB upgrade retaining schema1 previous checkpoint. Unit evidence covers levels1–99 and schema2 mixed-content sockets/runes. Existing CAS/backup/quarantine policy unchanged.
- No publication/deployment performed. P10 controller-specific focus/prompts and P11 balancing/quality review remain pending. Pre-existing local L3 docs/backlog edits are preserved separately; final L3 playable review still pending.

## Latest progression checkpoint — P8 (2026-10-18)

- P7 committed8e72707; P8 allocation verified:12 focused unit/runtime tests,2 Chromium panel/keyboard/disabled-controls scenarios; TypeScript/lint pass and screenshot reviewed.
- P9 remains: strict versioned progression snapshot, legacy level-to-XP migration preserving gear and ownership, single runtime progression authority, atomic load/save and funded allocation/reload browser evidence. Current data is still session-only.
- Authorization is now only P7–P9. Stop after P9 or checkpoint at soft session limit. P10/P11 are not authorized in this continuation. Pre-existing L3 edits remain untouched.

## Latest progression checkpoint — P7 (2026-10-18)

- P7 delivered; P6 preserved. P8 allocation and P9 persistence remain next under current authorization. Stop after P9; P10/P11 are outside this session.
- Shared panel has no duplicate stat formulas;1 new view-state +3 runtime tests and1 Chromium browser scenario pass, screenshot reviewed.
- Current XP is still session-only and inventory requirement level remains legacy12/laboratory40 until P9 migration. Preserve existing item/save data and all pre-existing local L3 edits.
- Next: P8 allocate through immutable domain logic with ready-state protection and requirement validation; P9 schema3 snapshot plus explicit schema1/2 migration, progression authority binding and atomic restore. Original broad issue parents remain partial.

## Active progression batch — P6–P11 (2026-10-18)

- User authorizes autonomous sequential P6–P11 through progression quality review, superseding prior P5 stop. Preserve all prior mechanics/items/saves and pre-existing local L3 documentation. No classes/skill trees/vendors/campaign.
- P6 / DBL-106 requirement domain delivered and verified: configurable minima for level/Strength/Dexterity, equip/swap/world checks, immutable atomic invalidation reconciliation with full-bag rejection. Legacy content stat minima remain0; future requirement tuning uses base rules without rewriting items. Runtime uses innate/allocated attributes; no gear self-support cycles.
- Six new tests;19 targeted equipment/world/save/runtime tests, TypeScript and relevant lint pass. No visual change in P6.
- Next P7–P8 / DBL-108/104: accessible gothic character panel and transactional allocation using existing modal/controller input; P9 / DBL-210: versioned progression snapshot/legacy migration with full item preservation; P10 / DBL-004: controller focus/prompts; P11 / DBL-109: one final broad regression and quality evidence. These are not yet delivered. Existing broad parents remain partial.
- P9 must bind the single progression authority to inventory session snapshots and synchronize effective requirement level. Current saves remain unchanged/session XP is not persisted. Legacy inventory starts at12 (separate item laboratory40); migration must preserve equipped identities and explicitly document initial XP/attribute budget mapping. Current HP/mana policy: retain absolute amounts/clamp, no refill or resurrection.

## Current session — DBL-103/104/105 / P3–P5 (2026-10-18)

- Completed the explicitly authorized cohesive P3–P5 increment. Five attribute points per gained level, high-water reward ledger, immutable attribute allocation and shared combat/equipment derivation. No P6 authorization; stop after this commit.
- Configurable defaults: starting Strength/Dexterity/Vitality/Energy all0 to preserve baseline; flat coefficients per point Strength→physical damage0.5, Dexterity→accuracy2/defense1, Vitality→max HP5, Energy→max mana3. Bonuses precede advanced gear multipliers; Strength is a physical-only modifier, excluding proc damage. Default coefficients/starts live in src/simulation/attributes.ts; EquipmentBase accepts overrides.
- Resource policy remains absolute amounts clamped to new maxima, never proportional refill or resurrection. Inventory stat refresh/comparisons share the same attribute-aware base; no character UI or new browser interaction.
- Eight new tests;29 focused progression/XP/equipment/hit-rule/runtime tests, TypeScript and relevant lint pass. No browser suite: simulation changes and runtime wiring are unit-tested; no UI/browser API changes.
- Progression is session-only as in P2. Future saves must persist total XP/versioned curve, starting/allocated attributes, available/spent budget and rewarded-level high-water mark with validation; skill points remain separate and unimplemented. Original parent IDs/dependencies and pre-existing L3 edits preserved; final playable-demo review remains pending.

## Current session — DBL-103 / P2 (2026-10-18)

- P2 monster XP rewards completed: configurable base rewards for six authored roles (champions share base), exactly once per encounter monster identity, eligible player kills only. Immediate death-event consumption survives bounded log eviction; environmental/non-player/training deaths cannot later gain credit by replay.
- Five new focused tests;16 targeted XP/combat-hit-trace/encounter tests, TypeScript and targeted lint pass. Session-only XP uses P1 progression/level99 cap; no save migration, loot, UI or combat-rule changes.
- P2 explicitly authorized after P1; stop now, no P3. DBL-103 remains partial; preserve prior local L3 documentation edits and pending playable-demo review.

## Current session — DBL-103 / P1 (2026-10-18)

- P1 character level/XP foundation completed and verified; stop after this task. No P2 authorization or runtime/save changes.
- Five focused XP unit tests, TypeScript and targeted lint pass. Default provisional curve costs100 × L² per advancement; configurable cumulative thresholds cap at99. Persist total XP with a versioned curve in future; no migration now.
- User reports L3 CI/deployment successful after2c8218d; final playable-demo review remains pending. No known local blocking implementation defect. Independent CI recheck unavailable (gh unauthenticated; public API DNS unavailable). Earlier L3 checkpoint below is historical and does not override this report.
- Pre-existing documentation/backlog edits retained separately. DBL-103 remains partial; no new issue IDs or dependencies changed.

- **L2 approved; L3 Advanced Itemization active.** DBL-320–332 complete. DBL-334–350 authorized sequentially through five increments/L3 review. No vendors, crafting, character progression or campaign.
- Playable demo: https://tobisen.github.io/hollowbane/?inventory=1 · V / View/Create opens inventory. Phaser4.2.1, all prior gameplay, original36 topics/231 requirements and unchanged L1 content2 preserved; versioned L2 content3 adds equipment bases.
- Verified application9288dd1; CI/Pages39071489421 success; hosted `index-puSphf0k.js` matches tested local build. Full check213, complete Chromium85, complete Firefox/WebKit134 and hosted inventory29 pass (4 intended non-Chromium visual skips). Evidence/screenshots: docs/inventory/l2.md.
- Deterministic grid/gear/world transactions, single stat pipeline, mouse/semantic-controller lifecycle, IndexedDB atomic checkpoints, validation and explicit corruption recovery delivered. No prototype archive migration claimed; storage errors retain session items and expose export/retry.
- Repeated SwiftShader combat RAF p9516.7–16.8ms at5/10/20/30 enemies after inline navigation fix; open modal33.4ms retained as DBL-333 follow-up. Native GPU/physical latency unverified.
- DBL-282–286 physical-controller tasks, friend native-layout metadata, provisional art/audio, native/full-detail/software/Firefox performance and GitHub issue synchronization remain open. Import dry-run333 records/36 milestones; no token-based synchronization claimed. Original parents036/074/079/080/081/082/083/084 remain partial.

L3 issue334 complete: typed deterministic modifier/event foundation,5 targeted tests/full check218. 335 complete:12 unique definitions/3 complete sets,5 new tests/full check223.351 complete: isolated version4 registry and legacy replay,2 new tests/full check225.336 complete: version4 unique/set generation and equipment-only activation,4 new tests/full check229; existing browser inventory scenario passes.352 complete: generic derived unique/set stats and comparisons,3 new tests/full check232, actual committed strike damage verified.353 complete: explicit schema2 content4 save support and validated1→2 migration; legacy-only saves preserve schema1. Full check233 and inventory Chromium/Firefox/WebKit29 pass/4 intentional visual skips, virtual Xbox/PlayStation included.337 complete: playable unique/set inspection at ?inventory=1&advanced=1, full check235, inventory38 pass/4 tracked old visual exclusions; three new Darwin browser visual references reviewed. Linux advanced visual exception tracked348.338 complete: socket limits and12 typed original gems,3 targeted tests/full check238.339 complete: isolated content5, atomic insertion/extraction, bounded ownership trees and compatible schema2 manifests;5 targeted/full check243 and12 cross-browser persistence scenarios pass.340 complete:12 original weighted sigils/8 ordered combination definitions,2 targeted/full check245.341 complete: isolated content6 and exact ordered combinations via shared modifiers;4 targeted/full check249,9 cross-browser advanced/controller scenarios pass.342 complete: frozen content7 expanded affix generation,4 targeted/full check253 and3 cross-browser set/save scenarios.354 complete: typed bounded hit resolution/context,3 targeted/full check256 and8 combat/skill browser scenarios.355 complete: scene weapon/speed repair and real casting/recovery bridge;2 targeted/full check258 and inventory41 pass/4 tracked visual exceptions.356 complete: actual contextual hit/skill/DoT arithmetic from shared baselines,6 targeted/full check264 and12 advanced/controller/bow browser cases pass.343 complete: real generic proc/leech/status execution,8 targeted/full check272 and15 advanced/controller/bow/gem browser scenarios.344 complete: bounded corruption validation, all save prefixes2–8, final registry8 legacy-table compatibility and safe old-route fallback;5 targeted/full check277,15 persistence browser cases +3 table/diagnostic cases.357 complete: readable component/pattern inspection, full modifier differences and original provisional glyphs;3 new/full check280,6 browser cases/6 reviewed Darwin references matched.358 complete: explicit atomic socket UI, contextual controller read/navigation and error handling; full check280, inventory62 pass/4 tracked visual exceptions and9 Darwin references matched.359 complete: actual non-damaging buff ranks,2 new/full check282 and2 Firefox/WebKit skill regressions.345 complete: final content8, isolated requirement laboratory, all components/host replays and controller-readable recipes;2 new/full check284, inventory68 pass/4 tracked exclusions plus6 strengthened isolation cases.346 complete: real set/pattern lifecycle tests, full check286, complete Chromium98 and Firefox/WebKit160 pass.347 complete:2.4m rolls/1099029 replay-validated items, zero invalid/distribution failures;2 extreme-cap tests/full check288.348 performance/Linux visuals next, then349–350. Detailed docs/items/l3.md.

L3 checkpoint source through336 pushed520b7fd; public CI39105753079 was in progress when inspected.352/353 verified locally; CI/hosted completion for these increments is not claimed here. Hardware/GPU and GitHub Issues sync remain unverified/open.
