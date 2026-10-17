# Status

- Controller quality fixes: DBL-289 published as 87d9342, CI/Pages 39032057748 succeeded. D-pad no longer steals game focus. DBL-290 generic layout/identity/readiness fixes published as b6497ac; CI/Pages 39032749390 succeeded and all 25 hosted controller scenarios pass. Full check 135 tests; Chromium controller 25 and Firefox/WebKit 48 pass. User's friend reports Unknown layout and saved #0 not connected; exact native metadata is requested, so physical Xbox/handheld mapping is not claimed fixed. Details: docs/gamepad/DBL-289.md and DBL-290.md.

- G4 Monster AI explicitly approved by user. Skills & Spell Systems (original topic 10) authorized through its quality gate; DBL-291–298 execute sequentially. No loot/inventory/itemization/character skill trees/campaign. Native friend controller metadata remains pending.

- G2.5 explicitly approved. **Phase 4 Monster AI approved.** Skills work now authorized. No loot, inventory, skill trees, campaign or later phase work. Preserve Phaser 4.2.1 and completed movement/combat/controller systems.
- Completed scoped DBL-275–281 and dependency corrections DBL-287–288. Original 36-phase roadmap/IDs/dependencies preserved; DBL-036 and DBL-058–065 remain partial. No completed combat/controller architecture was reimplemented.
- Playable The Cinder Watch: `?monsters=1`; count 5/10/20/30. Six profiles; idle/patrol/alert/chase/attack/retreat/return/dead; conservative LOS/threat memory/leash; bounded cached navigation; pack/support rally; three melee reservations including queued commands; collision-safe separation; existing timed melee/projectiles/reactions/death; champion stats; safe spawn/despawn and ten-second corpses. AI cannot cancel attack or hit recovery; low-health retreat survives hitstun.
- Verified runtime ab46984: CI/Pages https://github.com/tobisen/hollowbane/actions/runs/39027371132 passed full check/format, 133 unit tests and all 43 Chromium cases. Added corpse lifecycle fixture subsequently passed Chromium/Firefox/WebKit and hosted build. Full monster coverage: six Chromium cases and ten Firefox/WebKit behaviors. Complete legacy cross-browser controller 34, movement 15, combat eight and Firefox/WebKit smoke pass. All 29 hosted monster/controller/movement scenarios pass. Original screenshots retain their tolerance; initial and live 30-enemy screenshots reviewed.
- Public monster demo: https://tobisen.github.io/hollowbane/?monsters=1 ; movement root; controller settings `?controller=1`; preserved combat `?combat=1`. Prior Phase 4 gate runtime is ab46984; user-reported input focus correction DBL-289 follows it (see top checkpoint).
- Final Apple M4 / Chromium 156 / SwiftShader / 1920×1080 viewport, balanced 960×540: 5/10/20/30 enemies held constant; AI CPU p95 ~0.10 ms each; frame p50 16.7 ms each and p95 16.8/16.7/33.2/33.3 ms; twenty virtual injection-to-observed-movement samples per count, p95 33.4/16.8/33.3/16.8 ms. Zero page errors or missing samples. Short repeats vary by about one frame. Software 20–30-enemy tails miss provisional 20 ms target; native GPU/long-session/50-entity reference budgets remain unverified. Raw data and method: docs/ai/performance.json and phase4.md. No physical or photon-latency claim.
- Physical Xbox, PlayStation, vibration, disconnect/reconnect and latency follow-ups DBL-282–286 remain planned and unverified. Standard virtual mappings and keyboard/mouse pass; they do not prove hardware/driver/radio behavior.
- Limitations: original wanderer atlas/tints/transforms are provisional monster art; dense developer overlay labels overlap at 30 enemies. Caster/support foundations use physical bolts and rallying; no spell/heal library, unique elite affixes, persistent corpse gameplay or loot. Original production-art/performance requirements and prior DBL-245–251/260 follow-ups remain open.
- First arena CI 39026478414 failed one original reset-zoom projection fixture (38 passed), deployment skipped. Fixture now waits for actual view stability and asserts the same blocked point/rejection; subsequent e762842 and ab46984 CI/Pages passed. Detailed failures/repairs and all issue/commit evidence: docs/ai/phase4.md.
- GitHub import: final 288-record dry-run inspected. Earlier apply attempt stopped before requests because GITHUB_TOKEN is absent. Local scoped records authoritative; authorized SSH pushes/CI/Pages succeeded. No secrets or transient test captures committed.
- Monster AI approval received; resume at DBL-292 execution engine. Prior evidence retained under docs/gamepad, docs/combat and docs/movement; structured gate record: docs/gamepad/gates.json.

- DBL-291 complete: six original prototype definitions + passive, atomic validation; 137 unit tests/full check pass. DBL-292 execution next.

- DBL-292 complete: shared timeline execution/resources/breakpoints, 141 unit tests/full check. DBL-293 effects next.

- DBL-293 complete: elements, geometry, projectiles and statuses; full check 150 tests. DBL-294 playable skill arena next.

- DBL-294 complete: ?skills=1 playable laboratory, semantic/controller/mouse activation, prompts/resources and procedural effects. 151 unit/full check; five Chromium/eight Firefox-WebKit skill scenarios pass, baseline/unmasked screenshots reviewed. DBL-295 monster integration next.

- DBL-295 complete: shared caster/support/flanker skill decisions, lifecycle sync, 154 unit/full check; live monster skill browser scenario passes. DBL-296 regression/performance gate next.

- DBL-296 complete: 161 unit/full check, full Chromium 58/58 and final Firefox/WebKit skill behavior 12/12; existing screenshot tolerances preserved. Initial local build/navigation race caused one blank reload; stable-build complete rerun passed. DBL-297 paired performance measurements next.

- DBL-297 measurement checkpoint: full check 161 tests; explicit ?durable=1 high-HP target fixture and unchanged normal visual baseline pass. Skill HUD request latency labeled separately from injected-input measurement. Initial 30-enemy run drifted to 29; retained as preliminary and will not be used as constant-count evidence. Final paired profiling underway.

- CI follow-up DBL-296: behavioral suites pass, new skill snapshot differs by system fonts on Linux. Actual/diff inspected; use Darwin/Linux baselines as existing combat suite does, preserving masks/2% tolerance. Publication not yet claimed until corrected CI passes.

- DBL-297 HUD checkpoint: constant-count baseline and skill CPU measured; diagnostic-panel A/B implicates UI cost in Chromium 10-enemy p95 jump. Avoid redundant unchanged DOM text/attribute writes, retaining refresh cadence. Full check 161 tests and all eight Chromium skill scenarios pass. Final profiling follows.

- DBL-297 complete: constant 5/10/20/30 enemy paired profiles, 15/15 injected-start samples per case/no errors or drift; Chromium skills p95 16.8/33.2/33.3/33.3 ms, sim .1/.1/.2/.2 ms; Firefox default headless p95 17.7/17.9/18.0/18.1 ms. Hardware/backends differ. Detailed before/after and failed initial drift sample retained in docs/skills/performance.json. DBL-299 HUD renderer investigation remains open; DBL-298 CI/hosted gate evidence next.
