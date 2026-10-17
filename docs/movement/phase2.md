# Phase 2 movement checkpoint

G1 is technically approved; user authorizes character movement through a separate movement quality gate. The source roadmap puts movement in DBL-028–035 and combat in DBL-036 onwards. Preserve all original IDs/dependencies; DBL-240–244 are scoped authorized movement increments. Full combat parents stay open. No combat, monster AI, loot or approval of later gates is implied.

## DBL-240 — deterministic idle/move foundation

Pure 60 Hz locomotion uses world units: default walk 3/s, run 5.4/s, acceleration 180/s², deceleration 240/s². External tuning is finite, positive and bounded. Walking responds on the first tick; running reaches speed within two ticks. Facing reverses immediately. Explicit stop clears velocity; ordinary release decelerates within two ticks. Arrival clamps exactly; short and zero-length waypoints share one tick's travel budget instead of imposing a pause at each node. Animation timing is derived from traveled distance and the selected gait's stride, with the original eight-direction atlas. Renderer integration follows in DBL-243. No original run artwork exists: the walk cycle will be reused at run cadence and tracked as provisional.

This is an original responsiveness design based on the user's functional reference. No original game's code, data, names or assets are copied, and exact historical movement constants are not claimed.

## Work queue and nonblocking follow-ups

DBL-241: stable navigation and swept collision. DBL-242: pure command handling and input preferences. DBL-243: rendered controls/feedback/camera integration. DBL-244: browser movement gate and measured latency/frame pacing. Work sequentially; commit only verified increments. DBL-245–251 separately track Chromium full-detail, Firefox pacing, mist overdraw, lighting, background fill, sprite consistency and baked/contact-shadow limitations. These are planned, not implemented or blockers for movement.

## Baseline

Public G1: https://tobisen.github.io/hollowbane/ at 13317df, CI/Pages run 39007914224 succeeded and hosted Chromium 10/10 plus Firefox/WebKit smoke checks passed. G1 sustained Chromium balanced: median 59.9 FPS, frame p95 33.4 ms, input p95 35.1 ms; short full-detail SwiftShader sample: 20 FPS / 66.6 ms. Firefox short balanced/full: ~30 FPS / 33.7–34 ms. Compare identical workloads; avoid claiming causal improvements across differing durations or renderer backends.

DBL-240 verification: 45 unit tests, check/format, and all 10 original Chromium E2E cases pass. Existing visuals remain unchanged. Backlog validates all 251 records without changing source requirements.
