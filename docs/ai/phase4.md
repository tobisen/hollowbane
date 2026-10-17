# Phase 4 Monster AI

User approved G2.5 and authorized Monster AI through quality review. Preserve Phaser 4.2.1, combat timing/damage, controller and mouse/keyboard. Delivery Phase 4 maps to original topic 08/09 without renumbering the master roadmap. Original DBL-058 depends on the full spell-chain DBL-057: scoped slices instead depend on already completed combat/controller increments. No spell completion or broad parent completion is implied.

Sequential scope: DBL-275 model, 276 perception/navigation, 277 behaviors/archetypes, 278 pack/separation, 279 lifecycle/champion, 280 playable diagnostics, 281 browser/performance quality gate. No loot, inventory, skill trees or campaign. Physical Xbox/PlayStation/vibration/disconnect/latency checks remain planned DBL-282–286.

## DBL-275

Deterministic serializable monster/brain models and six role profiles, seeded staggered think schedules, champion stat foundation and existing movement configuration extension. No default combat behavior changed. Full check/format passes: 117 tests. G2.5 approval recorded; twelve scoped and hardware-follow-up records preserve all original IDs/dependencies.

## DBL-276

Perception uses resolved positions/damage with conservative obstacle line of sight, last-seen threat memory, dead-target clearing and home leash. Shared per-tick path budget, cached goals and 30+ tick retry cooldown bound navigation requests. Three targeted tests and full check pass: 120 tests.

## DBL-277

Explicit validated idle/patrol/alert/chase/attack/retreat/return/dead transitions, staggered decisions, six distinct profiles, flanking approach and ranged retreat. Existing combat commands retain attack/recovery/hitstun commitment and projectile strike boundaries; caster/support currently use physical projectiles (no new spell system). Four behavior tests cover deterministic replay, actual projectile launches, return/death and interruption ownership. Full check/format: 124 tests.

## DBL-278

Pack alerts require an actually visible live threat and a same-pack neighbor with unobstructed communication; support heralds rally a wider radius. At most three committed melee attackers per target, with remaining actors approaching via existing navigation. Deterministic two-pass separation preserves player position and attack/hitstun commitment, checks swept obstacle clearance, and excludes corpses. Two pack/crowd tests plus behavior suite pass; full check: 126 tests.

## DBL-279

Seeded encounter composition supports 1–50 monsters with bounded safe-spawn searches, monotonically increasing IDs, champion stat/label foundation and obstacle geometry. Death/corpse expiry uses simulation ticks; despawn clears stale selection/projectiles without cancelling committed attack timing. Deterministic 5/10/20/30/50-enemy replay/obstacle tests, corpse/identity and invalid spawn tests pass. Full check/format: 129 tests. Corpses have no loot, resurrection or inventory behavior.

## DBL-280

Dedicated ?monsters=1 Cinder Watch arena reuses the combat renderer, targeting, keyboard/mouse and semantic controller adapters. Count/AI/practice/pause controls, role/champion tints, health/death transforms, obstacle silhouettes, optional state/home/path/perception overlay and AI CPU diagnostics. Two new browser cases and all five original combat cases pass; original screenshots unchanged and new arena screenshot reviewed. Repeated patrol-leg test repairs a reached-goal cache bug. Full check: 130 tests. Original monster parents remain partial; original atlas reuse/proxy provenance recorded.

## DBL-287 dependency split

Short keyboard taps could be released between browser polls; trusted key pulses now latch for one semantic sample and reset with focus/device safety. Same-tick melee reservations now include queued commands, preventing eight attackers from all claiming three slots before combat advanced. Regression reproduces the overbooking before repair. Full check: 131 tests; nine quick-tap/handoff/editable-field cases across Chromium/Firefox/WebKit pass. No attack cancellation or physical mapping change. Resume DBL-281 quality verification.

## Quality measurements (DBL-281)

Matched Apple M4 / Chromium 156 / explicit SwiftShader software WebGL, 1920×1080 viewport and 960×540 balanced buffer. Twenty-second samples after two-second warmup; no competing browser tests during measurement. Virtual standard Xbox stick pulses with independent right-stick aim; AI encounters use the explicitly labeled immortal test player to preserve sustained enemy pressure. No player attacks during these samples; enemy attacks use the real combat timeline/projectiles. Each enemy count remained constant throughout; zero page errors and twenty successful movement samples per workload. Raw frames, per-second snapshots and latency samples: performance.json. Reproduce after build/preview using `node scripts/monster-benchmark.mjs PREVIEW_URL`.

| Enemies                          | rAF frame p50/p95 ms | AI CPU p95 ms | Total tick CPU p95 ms | Render submission CPU p95 ms | View update p95 ms | Virtual input-to-movement p95 ms |
| -------------------------------- | -------------------- | ------------- | --------------------- | ---------------------------- | ------------------ | -------------------------------- |
| 0 (prior combat trial reference) | 16.7 / 16.7          | —             | 0.10                  | 0.20                         | 0.20               | 16.8                             |
| 5                                | 16.7 / 16.8          | 0.10          | 0.10                  | 0.20                         | 0.20               | 33.4                             |
| 10                               | 16.7 / 16.7          | 0.10          | 0.10                  | 0.20                         | 0.30               | 16.8                             |
| 20                               | 16.7 / 33.2          | 0.10          | 0.10                  | 0.20                         | 0.40               | 33.3                             |
| 30                               | 16.7 / 33.3          | 0.10          | 0.20                  | 0.30                         | 0.40               | 16.8                             |

The reference trial differs in geometry/content and has its sentinel disabled; this is an encounter-scale envelope, not isolated causal AI overhead. Frame values are complete workload rAF samples; CPU values are final rolling diagnostic p95 windows with browser timer quantization. The software renderer misses the provisional 20 ms tail-frame target at 20–30 enemies in the final repeat, while remaining inside the previously reported software 33.4 ms envelope. Native GPU and the provisional 50-entity/60-second reference-hardware budgets remain unverified. CPU submission is not GPU execution time. API injection-to-observed simulation movement includes callback sampling; it is neither physical-device nor photon latency. The immortality diagnostic avoids player hitstun/death during latency measurements; normal encounters and committed attacks are tested separately.

CI checkpoint 39026478414 at 14ae5e9 failed one original cloister projection test (38 passed); Pages correctly skipped deployment. The fixture clicked a precise blocked point while reset zoom was easing: it now waits for actual view stability and explicitly verifies the blocked-feedback message, retaining the original zero-route assertion and coordinates. No movement implementation or screenshot tolerance changed. Final regression/publication results follow below.

GitHub import dry-run inspected for 287 unique records; apply stopped before requests because GITHUB_TOKEN is absent. No external issue creation is claimed. SSH publication remains available. Physical follow-ups DBL-282–286 are planned, never satisfied by the virtual mapping scenarios.

## DBL-281 verification checkpoint

Full check/format: 132 tests; complete Chromium suite 43 cases passes, including all original screenshots and the strengthened blocked-point fixture. Eight Firefox/WebKit encounter behaviors and nine targeted input-boundary cases pass. Complete legacy cross-browser, final CI/Pages and hosted verification remain in progress. This checkpoint preserves reviewable implementation, benchmark runner/raw data and reproducible fixtures without marking the gate approved.

## DBL-288 reaction dependency

Final audit found one-shot damage awareness was consumed during hitstun before low-health retreat could execute. Brain now latches a 90-tick retreat deadline on resolved health loss, while leaving the entire combat recovery timeline untouched. Regression explicitly schedules the AI during hitstun, checks unchanged recovery frames, then verifies retreat movement. Full check/format: 133 tests; all five Chromium and eight Firefox/WebKit monster cases pass. Complete legacy cross-browser controller 34, movement 15, combat eight and Firefox/WebKit smoke passed at preceding checkpoint; this correction only changes monster low-health decisions. Final profiles will be repeated on this runtime.

## Simulation and presentation contracts

Owned plain-data brains/actors are serializable and replay at the existing 60 Hz combat timestep. AI reads positions and resolved health loss, never queued player input. Think intervals are staggered 6–8 ticks; alert delays and attack cooldowns vary by role. Shared path allowance is two requests per tick, cached endpoints and 30+ tick retry backoff; LOS uses the same conservative swept obstacle geometry as movement and strikes. Return-to-home completes before ordinary reacquisition, reducing leash oscillation. Pack communication needs an actual visible threat and an unobstructed same-pack neighbor; memory alone cannot relay omniscient alerts. Support heralds widen rally distance. Melee reservations include same-tick queued commands and committed windup/active/recovery.

Attack/hit/death ownership remains in the existing combat module. AI decisions during commitment may update perception/retreat memory but cannot move or cancel the actor. Low-health retreat is retained until recovery allows movement. Crowd separation is two bounded pair passes, capped by the 50-actor spawn limit; it never displaces the player, corpses or committed actors and checks swept walkability before corrections. This is a small-encounter solver, not a claim of unlimited crowd scaling.

Spawn selection rejects blocked/occupied positions, uses deterministic bounded alternatives and never reuses IDs inside an encounter. Despawn removes source projectiles and clears stale selection; rendering creates/destroys proxies by ID rather than array offsets. Reset creates a new seeded encounter. Corpse TTL is 600 simulation ticks; no loot/resurrection/corpse-skill behavior is implied. Champion foundation is a stat/name/tint flag; unique affix libraries remain outside this slice.

Melee raiders, slow heavy tanks, fast flankers, retreating slingers, slower high-damage channelers and wider-rally heralds share combat timing/damage. Caster/support attacks are physical training projectiles; no spell system, healing or status effect library was implemented. Provisional tinted original atlas/transforms communicate rhythms; production family art/audio remain original backlog follow-ups.

Final profiles repeat the complete workload on runtime ab46984; performance.json now records that exact source revision. Earlier checkpoint data remain in git at e762842. Between these two short samples, the 20-enemy frame p95 ranged 16.8–33.2 ms and virtual movement p95 varied by about one frame. Quantiles use the upper empirical index floor(n×p), so twenty-sample input p95 selects the largest recorded sample. These coarse samples do not establish a statistical hardware acceptance result. Final workload sampled up to 9/15/27/36 live entities (enemies, player and projectiles) at 5/10/20/30 enemies; this is the maximum of per-second observations, not an exact lifetime projectile peak.

## Final runtime verification

[CI/Pages 39027371132](https://github.com/tobisen/hollowbane/actions/runs/39027371132) at ab46984 passed verify and deploy: full check/format, 133 unit tests and all 43 Chromium cases. Preceding e762842 also passed [39027052362](https://github.com/tobisen/hollowbane/actions/runs/39027052362). Original visual references retain their tolerance; the new arena baseline is reviewed. The new corpse lifecycle browser fixture was added after runtime CI and separately passed Chromium, Firefox and WebKit: real attacks kill a monster, its corpse persists, then its ID disappears without stale selection or page errors. It changes no production source. Complete monster coverage is six Chromium cases and ten Firefox/WebKit behaviors; complete legacy cross-browser controller 34, movement 15, combat eight and Firefox/WebKit smoke pass.

Reviewed screenshots include the initial five-role arena and a live 30-enemy encounter paused after 303 simulation ticks. All thirty actors remained alive and simulated, with mixed chase/attack/idle/patrol states, real projectiles and navigation around obstacles. The dense developer overlay has overlapping labels at 30 enemies; hide it for normal play. Production family silhouettes/audio remain follow-ups, not completed art claims. Temporary captures remain ignored; the stable regression baseline is committed.

Commits: DBL-275 5cf036c; DBL-276 eedf84f; DBL-277 1d45184; DBL-278 d485e12; DBL-279 107c328; DBL-280 14ae5e9; DBL-287 637d613; DBL-281 verification checkpoint e762842; DBL-288 ab46984. Closing fixture/documentation changes do not change verified runtime ab46984.

Physical verification remains separate: DBL-282 Xbox, DBL-283 PlayStation, DBL-284 vibration, DBL-285 disconnect/reconnect and DBL-286 real-world input latency are planned with no hardware evidence. Virtual standard browser snapshots cannot verify drivers, radio transport, native haptics or physical latency. The final 288-record import dry-run was inspected; the apply attempt at the prior 287-record checkpoint failed before requests due to absent GITHUB_TOKEN. Local issue IDs are retained; no GitHub issue-sync success is claimed.

## Quality gate delivery

All 29 hosted monster/controller/movement cases pass against https://tobisen.github.io/hollowbane/ on runtime ab46984, including virtual Xbox/PlayStation, keyboard/mouse, independent aim, remapping safety, actual monster death and delayed corpse despawn. Public encounter: https://tobisen.github.io/hollowbane/?monsters=1 .

DBL-275–281 and DBL-287–288 technically complete. Stop for user Monster AI quality review. Phase 4 qualityGateApproved remains false; G2.5 is approved. Physical DBL-282–286, native GPU/long-duration budgets, full monster-family art/audio, broader spell/unique-elite/corpse-gameplay acceptance and DBL-036 remain open. No loot, inventory, skill trees or campaign work began. Closing commit contains only fixture/evidence/metadata changes and does not alter verified runtime.

Controller quality follow-up: DBL-289 (87d9342) fixes reproduced gameplay D-pad focus theft; DBL-290 (b6497ac) adds identity recovery, readiness explanations and safe denied-API scene startup. CI/Pages 39032749390 and all 25 hosted controller cases pass. Local controller coverage: 25 Chromium and 48 Firefox/WebKit behaviors; 135 unit tests. See ../gamepad/DBL-290.md. Physical native mapping remains pending the tester’s snapshot; no hardware verification or new quality approval is claimed. AI performance above remains measured on ab46984.
