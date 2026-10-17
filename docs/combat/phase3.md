# Phase 3 combat fundamentals

Phase 2 explicitly approved by user on 2026-10-17. Phase 3 authorized through combat quality gate. One normal issue per session; DBL-253 is the first increment. Original backlog dependencies are unchanged; scoped slices do not close their parents.

Sequence: DBL-253 timing → DBL-254 targeting/integration → DBL-255 damage/reactions → DBL-256 projectiles → DBL-257 arena/feedback/diagnostics → DBL-258 quality evidence/publication. Each is split further if it exceeds a focused session. DBL-036 remains partial, including outstanding block and full actor integration. No loot, inventory, advanced AI, skill trees or campaign.

## DBL-253 contract

`src/simulation/combat-timing.ts` is independent of rendering, DOM and clocks. Each call advances exactly one existing 60 Hz simulation tick. The caller supplies attack/hit/death commands; later damage resolution will use the existing seeded RNG primitive. No random draws or damage occur in the timeline.

Idle accepts attack; windup → active → recovery → idle. An accepted attack consumes its first windup frame on that tick. Transition into active emits exactly one typed strike opportunity; an extended active window never repeats damage. Melee and projectile consumers must resolve that event separately. Held attack must be resubmitted after recovery. Movement and further attack commands cannot cancel commitment. Hit interrupts windup/active/recovery; repeated hits during hitstun do not extend its duration. Kill wins over phase expiry and is terminal. Hitstun is not invulnerability: damage rules remain DBL-255 scope. Move is a permission query; movement integration remains DBL-254.

Timing configuration is copied and requires positive integer frame durations. Inclusive, strictly increasing configurable thresholds select discrete frame counts for either attack speed or hit recovery. Thresholds and formulas are original configuration, not copied balance values. The module has no defaults for attack balance and no production integration yet.

## Verification and limitations

Seven targeted tests cover exact boundaries, held input, movement commitment, interruption, anti-extension, terminal death, replay/immutability, thresholds and invalid configuration. No visible changes or new assets; screenshot baselines remain unchanged. No combat demo or measured performance comparison yet: production does not import this module. Movement baseline remains median 59.9 FPS, frame p95 33.4 ms, movement input p95 38.8 ms; this is historical movement evidence, not a combat measurement.

Public demo remains https://tobisen.github.io/hollowbane/ (approved Phase 2). Combat publication and hosted verification belong to DBL-258. No external issue sync attempted in this increment; prior unauthenticated GitHub CLI limitation remains recorded. Combat quality gate has not been reached.

Milestone result: `npm run check` passes (68 tests across 16 files, strict typecheck/lint, six asset records, 258 backlog records, production build); `npm run format:check` passes. All 15 Chromium Playwright regressions pass, including existing visual comparisons with unchanged baselines and tolerance. Initial sandbox attempt could not bind localhost (`EPERM`); authorized rerun passed in 27.1 seconds. No visible changes were introduced, so no baseline refresh was required. Existing build chunk-size warning remains unchanged. Phaser stays pinned to 4.2.1. Commit reference: `git log --grep DBL-253`.

## DBL-259 damage prerequisite

Split the pure calculation from DBL-255 to implement damage first without modifying existing dependencies. `damage.ts` uses injected seeded RNG (two draws per resolution), accuracy/(accuracy+defense) with configurable caps, multiplicative armor and physical resistance, capped vulnerabilities, critical multiplier and floor rounding. Invalid configurations fail explicitly. Four tests cover exact formulas, boundaries, seeded replay and invalid inputs. No production import or visible change yet. Full check: 72 unit tests plus typecheck/lint/build/asset/backlog validation pass. Previous 15 browser regressions from DBL-253 remain the scene baseline.

## DBL-254 targeting controller

Pure controller composes the existing Walker and combat timeline: stable screen-space hover picking, selected versus committed target, range/line-of-sight validation, approach inset/hysteresis, bounded route refresh for moving targets, facing on commitment, deferred ground movement through recovery, single-click/held/release behavior and dead-target cancellation. Five tests cover stationary/moving/dead targets, range/obstacles, exact recovery movement boundary and held-release commitment. Scene adapter is grouped with DBL-257 to avoid half-integrated controls. Full check: 77 unit tests; existing scene remains unchanged. Test development caught and corrected an extra attack after releasing held input.

## DBL-255 combat world and reactions

Plain serializable world state stores the RNG seed and bounded 256-event log. One call advances a fixed 60 Hz tick in stable authored actor order; an earlier actor can interrupt a later actor on that tick. Strike events recheck living target, range and line of sight before seeded damage. Health clamps to zero, death is terminal, dead-target pursuit stops. Accumulated damage at 8% maximum health triggers configurable hit recovery; recovery plus a 12-frame reaction guard prevents repeated stun extension without preventing damage. Explicit invulnerability skips resolution. Optional knockback uses swept navigation checks. Defaults are original training balance, not reference-game formulas.

Five integration tests cover exact damage frame, serialized replay, moving-target whiff, death/pursuit, interruption/guard/invulnerability and knockback/breakpoints. Full check passes with 82 tests. Player/dummy/patrol/hostile initial data is simulation-only until arena integration; no production scene change yet. DBL-036 remains partial (block and full integrated actor validation outstanding).

## DBL-256 projectile foundation

Ranged weapons share the committed attack timeline. A strike launches a non-homing projectile at the target's current position; damage occurs only at swept segment-circle contact. First eligible opposing body intercepts; dead actors are skipped. Projectiles expire after 180 frames, at navigation boundaries, or on source death (explicit training rule). Target movement can dodge a launched shot. Four tests cover launch/impact timing, moving-target miss/expiry, fast swept contact, degenerate segments and dead-target behavior. Full check passes with 86 unit tests. No graphical effects or assets added yet.

## DBL-257 playable arena

Direct entry: `?combat=1`. Dedicated Phaser 4.2.1 scene loads original wanderer/cloister assets; original movement scene is preserved. Click a live target for one committed attack; hold to repeat. Click ground or WASD to move; movement waits through recovery. Space/focus loss clears pending actions without cancelling current attack. Weapon/speed changes take effect at idle; committed facing is fixed. Melee range is 1.05 world units; bolts have acquisition range 6, speed 10 units/second. Stationary dummy, patrol dummy, armored dummy (35 defense, 120 armor, 35% physical resistance) and minimal hostile melee sentinel are included. Reset restores seed 42; pause allows timing/art inspection.

Feedback: original procedural weapon gesture over existing atlas, windup/recovery lean, active strike, hit recoil/flash/ring, damage/miss/critical labels, health bars, selected/hover rings and 20-frame death fall; browser-synthesized short impact tone, optional. These are intentional provisional art/audio proxies, recorded in ASSET_MANIFEST.md/docs/assets.json and follow-up DBL-260. No dedicated attack/death sprite sheets are claimed.

Diagnostics expose phase/remaining frames, attack/hit-recovery breakpoints, health, rolling frame p50/p95, fixed-step CPU p95, display-update CPU p95, render-submission CPU p95, event-to-attack p95/sample count, active entities and capped/dropped ticks. CPU submission is not GPU execution time. Latency includes required approach/recovery; external measurements must state the workload.

Verification: 87 unit tests; full check and format check; all 20 Chromium E2E cases (five combat plus 15 existing), including unchanged original visual baselines and inspected first arena baseline. Browser tests caught a queued-new-attack release bug; controller now distinguishes pending single attacks from held repetition, with a dedicated unit regression. No tolerance increases. Combat browser scenarios cover melee approach/windup/held/death, ballistic launch-before-impact, moving target selection, deferred movement/breakpoints, hostile damage and terminal player death/reset. Full production artwork and subjective combat feel await review; DBL-036 remains partial because block is not implemented.

## DBL-261 measured rendering correction

Initial matched-machine 1920×1080 SwiftShader measurement exposed an arena full-resolution regression: median/p95 33.3/33.4 ms versus existing cloister 16.7/33.4 ms; simulation p95 was only 0.10 ms. Reused the existing `renderSize` 960×600 software limit and `shouldBalanceDetail` fallback, preserving logical camera/input projection and full native-GPU resolution. Also removed inherited document max-width/padding so the arena fills its viewport. Explicit browser assertion checks a 960-pixel software canvas. Updated arena baseline inspected; original scene baselines and 1% tolerances unchanged.

After resolution correction, same 20-second workloads plus two-second warmup: cloister 16.7/33.4 ms; arena 16.7/16.8 ms. Arena fixed-step p95 0.10 ms, render submission p95 0.20 ms, view update p95 0.30 ms; 31 attack samples, attack latency p95 82.9 ms (includes queued recovery), peak six entities. No page errors. Evidence: performance-initial.json and performance-balanced.json; reproducible runner scripts/combat-benchmark.mjs. These different scene workloads establish a rendering envelope, not isolated causal combat cost. Final viewport-corrected sample is recorded under DBL-258.

## DBL-258 combat quality candidate

Final local 1920×1080 SwiftShader sample (20 seconds each, two-second warmup, Apple M4, Chromium 156): current cloister median/p95 16.7/33.4 ms; final arena median/p95 16.7/16.7 ms. Historical Phase 2 frame p95 was also 33.4 ms. Arena fixed-step p95 0.10 ms, render-submission CPU p95 0.20 ms, display update p95 0.40 ms; peak six entities; event-to-attack p95 79.8 ms across 31 commands. This workload includes queued recovery; it is not a pure input-device latency benchmark. Six capped startup/measurement ticks were recorded; zero page errors. Retained raw evidence: performance-final.json. Original movement input p95 38.8 ms is historical, not directly comparable to attack latency.

Reproduce performance: `npm run build`, `npm run preview -- --host 127.0.0.1`, then `node scripts/combat-benchmark.mjs http://127.0.0.1:4173/hollowbane/`. Preview may choose another port; use its printed URL. Two earlier measurements are retained to explain the discovered and fixed renderer regression. In the initial two measurement files, baseline maxEntities=0 means baseline entity instrumentation was unavailable; the final runner correctly records its one actor.

Quality coverage expanded to 90 unit tests, including earlier-body projectile interception, pre-strike interruption/lethal cancellation and boundary-blocked knockback. All 15 previous movement cases pass across Chromium/Firefox/WebKit. Eight new combat behavioral cases pass across Firefox/WebKit; reproduction: `npx playwright test --config playwright.combat.config.ts`. Chromium includes the full original suite and combat screenshot. Original scene baselines/tolerances are preserved. Additional local windup/death captures were inspected (ignored .local artifacts). Player/enemy labels are separated vertically for melee readability; reset clears stale death feedback and hover.

External issue sync: idempotent import dry-run inspected (260 records at that point). Apply failed before making requests because GITHUB_TOKEN is absent; gh auth remains unavailable. Local backlog is authoritative and retains 261 stable records. SSH push works. Candidate code through `08437f4` pushed; CI run 39015793783 is the first combat publication run. Final deployment and hosted verification outcome follow below.

Remaining limitations for user review: procedural animation/audio proxies (DBL-260), no block (DBL-036 explicitly partial), physical damage type only, authored open arena with minimal pursuit/patrol, modest entity-count performance sample, CPU submission rather than GPU timing, no isolated hardware latency claim. Existing DBL-245–251 movement/art follow-ups remain. No loot, inventory, advanced AI, skill trees, campaign, mana/regen, resurrection or broader parent completion is claimed. Stop at the Phase 3 combat quality review after publication/hosted verification; subjective timing/feel approval remains user-owned.

First publication outcome: CI 39015793783 failed only the new arena screenshot (13,072 differing pixels, 2% rounded); 19 other browser cases passed. Deploy was skipped. Public check annotations and the actual/expected/diff artifact were inspected; differences are platform fonts in DOM/canvas text, not world geometry or simulation. Artifact accessed read-only through nightly.link because anonymous GitHub log download returned 403. Keep the existing 1% tolerance and existing scene baselines. A scoped follow-up will give only the new arena screenshot separate Darwin/Linux expectations. DBL-258 remains in progress until that fix and hosted verification pass.
