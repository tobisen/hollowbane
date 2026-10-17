# Skills & Spell Systems

User G4 approval authorizes this delivery, mapped to original topic 10. DBL-291–296 split source requirements without completing broader parents.

## DBL-291

Six active original names: Ember Lance (fire projectile), Rime Ring (cold nova), Storm Thread (lightning chain), Iron Fan (melee cone), Oath Echo (area power buff), Briar Edge (poison melee). Still Well is a passive mana regeneration definition. Data rejects duplicates, unsafe timing/ranges/numbers/elements/status policy. No external assets added. Full check passes 137 unit tests. Renderer unchanged, browser checks deferred to playable integration.

Physical controller metadata/DBL-282–286, provisional monster art, native/full-detail/Firefox performance and GitHub synchronization remain open. No skill trees or item systems.

## DBL-292

Optional combat hooks reuse the original controller timeline; legacy callers have no skill runtime. Costs/cooldowns start at accepted tick, interruption does not refund; effects occur once at active boundary. Movement cannot cancel commitment. Passive mana regeneration uses simulation ticks. Discrete cast thresholds use authored scaling; no reference-game formula. Four execution tests cover timing, duplicate commands, cost/cooldown/target rejection, movement commitment, hitstun and replay. Full check: 141 tests.

## DBL-293

Elements reuse combat mitigation/reactions/death, armor applies only to physical damage. Elemental spells and poison use guaranteed hit with no critical; physical abilities retain accuracy/critical. Resistance cap remains configurable (-100% to 75% default); elemental tests cover vulnerability/caps. Bolts use swept collision and walls; area/chain selection uses stable distance then ID and LOS. Slow/power never permanently mutate base stats; poison refresh keeps next interval, six pulses including duration boundary. Strongest rejects weaker refresh; refresh replaces magnitude/duration. Buff applies to nearby same-faction actors including self. Source death cancels bolts and further poison pulses, consistent with existing projectile policy. No cleanse/immunity/absorb library is claimed; original parents remain partial. Nine new tests; full check 150 tests. Initial projectile fixture aimed tangentially; corrected its target placement to the intended centerline.

## DBL-294

The Kindled Circle (`?skills=1`; add `&monsters=1` for encounters) preserves the legacy combat arena. Six semantic slots: primary/secondary/skill1–4; keyboard X/Q/1–4; controller prompts use actual remapped bindings. D-pad left/right selects, interact casts selected, right stick aims independently and target lock selects. Press only, no hold-repeat; existing recovery rejects early follow-up. Mouse right-click casts selected; left click retains movement/basic attack. Area effects are original procedural Graphics geometry, no borrowed assets/shaders or extra textures. Renderer consumes deterministic events. Existing wanderer casts use provisional windup/strike/recovery transforms. Costs/cooldowns/status messages and input latency are observable. Skill CPU metric explicitly includes combat tick cost. 151 unit/full check, five Chromium and eight Firefox/WebKit scenarios pass; visual baseline and unmasked capture reviewed. The mouse trajectory test caught body-hover aiming above ground center; corrected selected-target aim. Physical hardware remains unverified.

## DBL-295

AI integration only replaces an already-authorized queued attack while idle: caster Ember Lance, support Oath Echo, flanker Briar Edge. Threat/LOS/range/resources/cooldowns are checked, original AI decision cadence/path budget preserved, and unavailable skills fall back to normal combat. The adapter reads no player input. Encounter actor removal prunes ability owners/base stats; new owners synchronize on the next tick. Three unit tests cover deterministic 600-tick replay, fallback and lifecycle; full check 154 tests. Browser live encounter verifies caster and support effects through shared engine. Legacy monster scene remains the approved baseline; shared skills enabled only with skills query.

## DBL-296

Final full check: 161 tests, strict typecheck/lint/assets/backlog/build and format pass. Full Chromium regression 58/58, final skill Firefox/WebKit 12/12; all six playable effects exercised across keyboard/mouse, plus virtual Xbox/PlayStation primary/selection/independent aim. Original snapshots retain their tolerances; new skill baseline and unmasked screenshot reviewed. Cast edges 24/25, 59/60, 99/100 verified; physical abilities use existing attack-speed breakpoints, elemental abilities use separate cast-speed thresholds. The first local full run passed 57/58 but a dist rebuild during navigation caused one blank reload; repeated full suite against an immutable build passed 58/58 with no fixture or tolerance changes. Performance/final publication split to DBL-297–298 to keep evidence tasks focused.

## DBL-297 measurement checkpoint

Benchmark scripts separate pure simulation, request-to-start HUD timing and injected button-to-observed-start timing. Initial 30-enemy sample lost one target to real player fire and is preliminary, not constant-count evidence. Explicit `?durable=1` sets enemy HP/maxHP to 100000 for measurements and labels the header DURABLE TARGET BENCHMARK; it does not grant immunity or change damage/resistances. Both baseline and skills use the same fixture. Player uses existing immortal option; high target HP reduces proportional stagger/retreat, an explicit workload limit. Full check 161 tests; dedicated fixture and unchanged normal visual baseline pass. No normal-play stats changed.

### DBL-296 CI platform correction

CI runs 39034032926 and 39034430507 passed all 56/57 behavioral scenarios respectively but failed the new full-page skill screenshot by ~25000 pixels. Public actual/expected/diff were downloaded read-only via nightly.link and visually inspected: differences are system-font metrics in title, labels, buttons and panel text; world geometry matches. The existing combat snapshot already separates Darwin/Linux. Apply the same pattern only to the new skill reference, using the inspected CI actual as Linux baseline and retained local reference as Darwin. Keep the 2% tolerance, masks and all pre-existing baselines unchanged. No functional or visual product change. Windows screenshot remains unverified.

### DBL-297 HUD investigation checkpoint

Constant-count pre-optimization runtime 957b219: Chromium/SwiftShader frame p95 baseline 16.8/16.7/33.3/33.3 ms versus skills 16.8/33.3/33.3/33.4 (5/10/20/30). Skill+combat CPU p95 0.1/0.1/0.2/0.3 ms, AI ~0.1 ms; 15/15 injected cast-start samples and zero errors at every count. At 10 enemies, hiding both diagnostic panels restored 16.7 ms; opaque skill background alone did not (33.4 ms). This implicates UI rendering/update/composition, not proof of a particular GPU bottleneck. Firefox default headless is ~17 ms but uses a different backend/timer resolution and is not a matched-GPU comparison.

HUD now avoids assigning identical resource/button/prompt text and selected attributes. It keeps the same six-frame refresh cadence, information, snapshots and effects. Full check 161 tests and all eight Chromium skills cases pass, including unchanged Darwin visual. Final paired measurements follow; no gain is assumed before measuring.

## DBL-297 final performance evidence

Runtime **5e09b03**, Apple M4, 1920×1080 viewport and balanced 960×540 canvas. Ten-second windows after two-second warmup; paired legacy/skills scenarios use identical 100000HP durable targets and immortal player. All 5/10/20/30 enemy counts remain constant. Each skill scenario has 15 injected primary press edges, zero misses and zero page errors. Up to three simultaneous skill bolts and twelve concurrent buff statuses; normal AI attacks/projectiles remain active. This is a short developer workload, not native/full-detail or long-session certification.

| Enemies | Chromium legacy p95 | Chromium skills p95 | Firefox legacy p95 | Firefox skills p95 | Chromium injected start p95 |
| ------- | ------------------- | ------------------- | ------------------ | ------------------ | --------------------------- |
| 5       | 16.7 ms             | 16.8 ms             | 18.1 ms            | 17.7 ms            | 16.8 ms                     |
| 10      | 16.7 ms             | 33.2 ms             | 18.1 ms            | 17.9 ms            | 16.7 ms                     |
| 20      | 33.3 ms             | 33.3 ms             | 17.9 ms            | 18.0 ms            | 16.8 ms                     |
| 30      | 33.3 ms             | 33.3 ms             | 18.2 ms            | 18.1 ms            | 33.4 ms                     |

Chromium explicitly uses SwiftShader software WebGL. Firefox uses its default headless backend, so this is not a matched renderer/GPU comparison. Firefox simulation p95 reads 1 ms and AI reads 0–1 ms with coarse timers; do not infer an exact speed ratio. Firefox injected-start p95: 18.5/33.4/33.3/18.3 ms. Fifteen samples make p95 the maximum with this quantile rule; repeated runs vary by about a frame. Measurement ends at observed cast start, not damage, hardware, display/photon response or completion of deliberate windup. HUD inputP95 field is request-to-start only and is labeled request p95 on screen.

Chromium skill+combat CPU p95: 0.1/0.1/0.2/0.2 ms; AI ~0.1 ms. Rendering CPU submission ~0.2–0.3 ms does not measure GPU/compositor completion. View update includes export/snapshot overhead. Full raw frame arrays, samples and before/after data are retained in performance.json.

Simulation-only benchmark: 31 actors, 100 fresh windows of 40 ticks; mean tick cost ~0.047 ms with no casts and ~0.060 ms with 30 simultaneous buff casts. Incremental window-mean cost per concurrent cast ~0.0004–0.0016 ms across 5/10/20/30; JIT/order/allocation noise dominates tiny differences, so this is not isolated instruction cost. Its reported p95 is a percentile of window means, not raw individual ticks. Simulation sources were unchanged from measured 3fd059a through final runtime.

Investigation: pre-optimization Chromium skills p95 was 16.8/33.3/33.3/33.4 ms, versus final 16.8/33.2/33.3/33.3. No meaningful p95 improvement is claimed from avoiding redundant DOM writes. At ten enemies, hiding both diagnostic panels restored ~16.7 ms; making only the skill background opaque did not (~33.4 ms). This narrows investigation toward UI paint/layout/composition, without a proven GPU/root-cause trace. DBL-299 remains planned; native/full-detail and broader Firefox reference-machine work stay open. The initial nonconstant 30→29 run is retained separately as preliminary evidence, excluded from the constant-count table.
