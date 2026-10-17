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
| 5                                | 16.7 / 16.7          | 0.10          | 0.10                  | 0.20                         | 0.20               | 16.8                             |
| 10                               | 16.7 / 16.7          | 0.10          | 0.10                  | 0.20                         | 0.30               | 16.8                             |
| 20                               | 16.7 / 16.8          | 0.10          | 0.20                  | 0.20                         | 0.40               | 33.3                             |
| 30                               | 16.7 / 33.3          | 0.10          | 0.10                  | 0.30                         | 0.40               | 33.4                             |

The reference trial differs in geometry/content and has its sentinel disabled; this is an encounter-scale envelope, not isolated causal AI overhead. Frame values are complete workload rAF samples; CPU values are final rolling diagnostic p95 windows with browser timer quantization. The software renderer misses the provisional 20 ms tail-frame target at 30 enemies, while remaining inside the previously reported software 33.4 ms envelope. Native GPU and the provisional 50-entity/60-second reference-hardware budgets remain unverified. CPU submission is not GPU execution time. API injection-to-observed simulation movement includes callback sampling; it is neither physical-device nor photon latency. The immortality diagnostic avoids player hitstun/death during latency measurements; normal encounters and committed attacks are tested separately.

CI checkpoint 39026478414 at 14ae5e9 failed one original cloister projection test (38 passed); Pages correctly skipped deployment. The fixture clicked a precise blocked point while reset zoom was easing: it now waits for actual view stability and explicitly verifies the blocked-feedback message, retaining the original zero-route assertion and coordinates. No movement implementation or screenshot tolerance changed. Final regression/publication results follow below.

GitHub import dry-run inspected for 287 unique records; apply stopped before requests because GITHUB_TOKEN is absent. No external issue creation is claimed. SSH publication remains available. Physical follow-ups DBL-282–286 are planned, never satisfied by the virtual mapping scenarios.

## DBL-281 verification checkpoint

Full check/format: 132 tests; complete Chromium suite 43 cases passes, including all original screenshots and the strengthened blocked-point fixture. Eight Firefox/WebKit encounter behaviors and nine targeted input-boundary cases pass. Complete legacy cross-browser, final CI/Pages and hosted verification remain in progress. This checkpoint preserves reviewable implementation, benchmark runner/raw data and reproducible fixtures without marking the gate approved.
