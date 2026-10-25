# DBL-035 — P2 native Mac movement pacing

2026-10-25. P1 accepted at c4321a6. **P2 verified deployed SHA: `2b29458d774cda4576ea64bab8ce7a8d8e005e19`**, [exact CI40218730021](https://github.com/tobisen/hollowbane/actions/runs/40218730021), all required regression/compatibility, Pages, hosted critical flow and Release acceptance **success**. All41 public files match the sealed/local-tested production build. Independent hosted native-Metal keyboard/controller movement checks pass and captures are reviewed. Stop at **P2 quality review**; user approval remains false and Q3 stays paused.

## Measured mechanism and change

Intermittent movement judder occurs even with steady RAF timing and substantial CPU headroom. The former callback-arrival clock (`performance.now()` differences) includes changes in when the browser begins the CPU callback. The trailing fixed-step accumulator can sit at its tick boundary: small arrival jitter produces alternating zero/two ticks, immediately reflected by the player and camera. Native headless full-keyboard capture showed72 zero and72 double-tick frames; visible-window keyboard53/53 and controller54/55. This establishes a mechanism in the tested forest, not proof that every reported Mac stall has this cause.

The small production correction uses **unsmoothed RAF elapsed time** and a **centered fixed-step residual**. Full ticks still subtract1/60s; unused elapsed time is retained in[-1/120,1/120)s. Scheduler phase error is bounded to half a tick (8.33ms), rather than trailing by up to a full tick. The100ms catch-up cap/dropped-time accounting remain. Simulation rules, collision, wall sliding, speeds, animation/combat durations in ticks, saves, camera centering, graphics and Phaser4.2.1 are unchanged. There is no interpolation buffer or deliberate render delay; physical input-to-photon latency was not measured. No effects or detail were removed.

A RAF-clock-only candidate was insufficient (e.g. balanced controller35 zero/34 double frames) and was replaced by the centered scheduler. The new deterministic browser regression fails the old implementation with exactly0,2,0,2… under callback jitter. The final implementation yields one tick each frame under that jitter and quantized16.6/16.7/16.7ms RAF intervals, conserves60 ticks per second at30/60/120Hz, and retains six catch-up ticks/nine dropped ticks for a250ms interval.

## Conditions

- MacBook Air `Mac16,12`, Apple M4 (10-core GPU),16GB RAM, macOS15.7.4 (24G517).
- Chromium156.0.8078.4, native `ANGLE Metal Renderer: Apple M4`; WebGL and GPU compositing enabled. Both headless and visible-window runs are native GPU results, **not SwiftShader**. Physical display scanout, physical controllers and the feedback author's hardware/browser remain unverified.
- Seed42, Haunted Forest generated layout2, peaceful isolated developer fixture; viewport1280×800/DPR1. Full render1280×800; balanced960×600 uses existing profile, with the same CSS viewport.
- Warm-up:120 ticks plus both ends of the route; ten alternating36-tick screen-right/left legs, trusted keyboard or standard virtual-controller API. Each cohort is approximately6s.1138 scene display objects, one live simulation actor, zero particle emitters; no combat stress claim.
- Paired primary captures use identical harness/seed/profile/viewport/input macro and warmed assets. Actual positions/ticks are retained. Initial visible-controller baseline start differed by one tick (0.05 world unit); the final tool returns through real click navigation to the exact origin before capture. A later normalized baseline repeat had no zero/double ticks: the old defect is phase-dependent, not present in every run.
- Frames are sampled after render; raw RAF intervals, CPU submission intervals, full scene update, summed simulation work, existing renderer CPU timer, camera/player deltas and observable heap are separate fields. GL submission cost is not GPU completion time. No CPU tracing during the reported comparison. The first interval crossing the collection boundary is excluded consistently.

## Hosted acceptance

[Live game](https://tobisen.github.io/hollowbane/) serves exactly `2b29458d774cda4576ea64bab8ce7a8d8e005e19`. Native Apple M4 Metal, full1280×800, same seed42/input macro: keyboard/controller each359 complete RAF frames; p50/p95/p99=16.7/16.7/16.8ms, longest16.8ms; >25/>33/>50 counts0/0/0. Every measured inter-frame tick increment is1 (358 intervals each); zero/double counts0/0. Moving player step0.050 logical units; camera3.104 CSS pixels; player-relative camera drift0. Update p95≤2.1ms, simulation≤0.2ms, render≤2.9ms. Both captures reviewed. This is native-GPU hosted evidence, not physical-controller or input-to-photon measurement.

`/private/tmp/hollowbane-p2/hosted.json` and accompanying captures retain raw evidence. Exact sealed artifact: `release-2b29458`; all41 files match `tested-files.json` and public bytes. Final post-release evidence is committed locally without publishing another runtime.

## Native visible-window comparison

| Input      | Frame p50/p95/p99 before → after (ms)   | Longest before → after (ms) | >25 / >33 / >50 before → after | Zero / double ticks before → after | Camera step p95 before → after (CSS px) |
| ---------- | --------------------------------------- | --------------------------- | ------------------------------ | ---------------------------------- | --------------------------------------- |
| keyboard   | 16.7 / 18.6 / 18.7 → 16.7 / 18.6 / 18.7 | 18.7 → 18.7                 | 0/0/0 → 0/0/0                  | 53 / 53 → 0 / 0                    | 6.209 → 3.105                           |
| controller | 16.7 / 18.6 / 18.7 → 16.7 / 18.6 / 18.7 | 18.7 → 18.7                 | 0/0/0 → 0/0/0                  | 54 / 55 → 0 / 0                    | 6.209 → 3.105                           |

About60 FPS both before and after; the improvement is uniform motion delivery, not higher average FPS. Moving player step p95 changed0.100→0.050 logical units; camera3.104 CSS pixels per normal frame, versus earlier0/6.209 jumps. Player screen position relative to camera remains stable; no camera drift or rounding change. Final visible-window CPU p95: update1.9–2.0ms, simulation0.2ms, renderer2.9–3.0ms. No visual compromise.

## Native headless matrix

| Profile / input       | RAF p50/p95/p99 before → after (ms)     | Longest before → after (ms) | >25 / >33 / >50 before → after | Zero / double before → after |
| --------------------- | --------------------------------------- | --------------------------- | ------------------------------ | ---------------------------- |
| full / stationary     | 16.7 / 16.7 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 0 / 0 → 0 / 0                |
| full / keyboard       | 16.7 / 16.7 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 72 / 72 → 0 / 0              |
| full / controller     | 16.7 / 16.7 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 0 / 0 → 0 / 0                |
| balanced / stationary | 16.7 / 16.7 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 0 / 0 → 0 / 0                |
| balanced / keyboard   | 16.7 / 16.8 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 0 / 0 → 0 / 0                |
| balanced / controller | 16.7 / 16.7 / 16.8 → 16.7 / 16.7 / 16.8 | 16.8 → 16.8                 | 0/0/0 → 0/0/0                  | 0 / 0 → 0 / 0                |

Headless final update p95≤2.4ms, simulation≤0.2ms, render≤3.5ms. Submission-interval tails are recorded separately (not presented as physical display latency). Static layers/depth work, fog/transparency, lighting and HUD work remained intact; their combined CPU cost did not explain the steady-RAF zero/double-step pattern. No texture-upload/GPU bottleneck was established in the warmed route. Optional CPU profiles showed sampled GC runs up to5.35ms; heap reclamation is frequent but was not established as the cause of the movement pattern. Rare/long traversal, texture startup, combat and other browsers/hardware can still stall.

## Release observation correction

[CI40216406346](https://github.com/tobisen/hollowbane/actions/runs/40216406346) for5e560d0 passed static/unit/compatibility, all other Chromium shards and62 cases in shard4. Its only failure was the existing fresh-Ranger test waiting for transient selection after its first real bow critical had already dealt55 damage at tick242 and killed2030. The reviewed trace/event log records that valid kill, player sequence1/locked2030, and normal subsequent selected=null. Pages/hosted were skipped; that failed run deployed nothing; the accepted2b29458 release supersedes it.

The bounded test correction observes acquisition at RAF cadence and accepts either selection or already recorded positive damage to that exact target. Final damage assertion is strengthened to require the same target. Five/15-second deadlines, damage rules, critical chance, equipment and gameplay are unchanged. Normal Ranger check17.5s passes. A diagnostic deliberately delays host observation until a real held-bow kill and cleared selection (2× CPU only during attack); corrected check passes12.1s, exercising precisely the CI race. Six-times CPU stress over the entire scenario failed in earlier navigation setup, not this assertion, and remains separate excluded diagnostics. No route/deadline adjustment was made.

TypeScript/affected ESLint/Prettier pass. This correction changes only the test/evidence, preserving all41 tested runtime bytes and native measurements. Successor2b29458 now passes exact CI/Pages/hosted acceptance; Q3 remains paused. Artifacts: `ci-regression-failure`, `ranger-observation-normal`, `ranger-observation-post-kill` and the excluded `ranger-observation-throttled` under /private/tmp/hollowbane-p2.

## Local reproduction

In one terminal:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

In another, without concurrent builds/tests:

```sh
node scripts/mac-frame-profile.mjs --output /private/tmp/hollowbane-mac.json
node scripts/mac-frame-profile.mjs --headed --quality full --input keyboard,controller --output /private/tmp/hollowbane-mac-headed.json
```

For a60-second manual capture through the actual problem passage (native controller API retained; wait for the console's “move now” message):

```sh
node scripts/mac-frame-profile.mjs --headed --quality full --input manual --seconds 60 --output /private/tmp/hollowbane-mac-manual.json
```

Repeat the same route/profile/window on the before and after builds. `--url` selects a locally served build or hosted candidate with developer profiling enabled. `--renderer swiftshader` explicitly selects software and is labeled separately; none of the native results above use it. `--trace` writes DevTools CPU profiles and marks results as instrumented; do not mix those timings with untraced runs. Manual mode was smoke-tested without physical input, not physically verified. The optional developer-only game hook is absent on ordinary/character routes and removed when its game is destroyed.

## Verification and release

- 13 focused camera/wall-sliding/replay unit cases pass. Final targeted Chromium clock regression passes; the unchanged baseline fails it. TypeScript, affected ESLint/Prettier and production build pass. Captures reviewed. No local Full Regression/campaign/loot run or screenshot threshold changes.

- Existing risk classifier selects **Full for this P2 increment**: shared `combat-arena.ts` timing and a new profiling script. This is the required new-change release gate, not a rerun of the accepted P1 SHA. No tier override or pipeline modification.
- Tested41-file inventory: `/private/tmp/hollowbane-p2/tested-files.json`. Exact CI/Pages, sealed/tested/public-byte identity and hosted native keyboard/controller profiles now pass for2b29458. User quality approval remains false; Q3 stays paused.
- Raw JSON/CPU traces/screenshots stay uncommitted in `/private/tmp/hollowbane-p2`: `native-final`, `native-centered-final`, `native-headed-baseline`, `native-headed-centered`, plus normalized `headed-before-final`/`headed-after-final`. Baseline-build is P1 behavior plus the identical opt-in profiling hook. Source regression diagnostics in `clock-regression-before`; final pass in `browser-final`.
- Excluded diagnostics: first pilot used the wrong update hook (CPU totals invalid) and recorded one unattributed49.9ms controller-frame interval, which is not claimed fixed; CPU-profiler startup generated a50ms boundary interval, excluded from untraced comparisons. Those attempts and the rejected RAF-only candidate remain available separately. No reported-frame threshold was relaxed.

Remaining: long human play on the feedback device, actual input latency/vibration, other browser/refresh rates (120Hz still presents a60Hz simulation), reference-hardware/native GPU follow-ups, and occasional GC/loading/compositing stalls. This measured fix is not a universal stutter guarantee. P2 technical release is accepted; stop for user quality review with approval false. No Q3 work.
