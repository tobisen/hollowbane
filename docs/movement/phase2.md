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

## DBL-241 — navigation and collision

Clear ground routes directly to the exact target. A* obstacle routes are simplified only across validated line-of-sight segments; grid ties remain deterministic. Analytic segment/ellipse and segment/boundary checks prevent thin-obstacle tunnelling and crossing concave walls regardless of speed. The authored scene adds a conservative 4-pixel circular foot clearance; inflated ellipses conservatively enclose that offset. If geometry blocks an accepted route, one replan per tick attempts the original endpoint; failure stops safely. Rejected clicks preserve the last accepted command. Tests cover thin obstacles, fractional joins, boundaries, exact arrival, short waypoints, deterministic paths and geometry changes. Verification: 51 unit tests, all checks/format and 10 original Chromium E2E cases pass.

## DBL-242 — commands and input contracts

Typed movement intents cover move, stop, face and gait. Ordinary moves replace the route and clear queued targets; explicit queueing accepts up to eight future targets and validates each connection. Keyboard movement clears both route and queue; stop/face clear velocity and all pending movement. Invalid targets preserve the current accepted move. Queue completion plans against current geometry, not a stale path. All commands consume event order with no implicit combat buffering. Version-1 preferences validate gait, tuning and unique physical key codes. Default WASD/arrows, R, Space and Shift bindings are remappable; Digit1/2 are reserved for future ability intents only. Position, held keys, routes and queued commands are deliberately transient. Verification: 57 unit tests, all checks/format and five original traversal browser cases pass.

## DBL-243 — playable integration

Run/R toggles gait, Space/Stop immediately cancels movement, Shift-click queues up to eight targets, right-click stops and faces a point, and holding left-click steers toward the displayed pointer. Pointer steering consumes the latest changed pointer target each rendered frame with a small 0.08-world-unit hysteresis; first click is immediate. Keyboard input takes priority. Blur/visibility interruption clears held input and all commands; UI focus does not drive the actor, and opening Controls cancels traversal. Controls dialog remaps physical keys and walk/run speed; versioned preferences persist safely even when storage is unavailable. Run intentionally reuses original walk frames at distance-based cadence; no new asset provenance is implied.

Pointer targeting uses pure bidirectional CSS-canvas/camera-view transforms and does not assume an internal resolution or viewport origin. Ground hover distinguishes reachable and blocked targets; destination and textual feedback make accepted, blocked, queued, arrived and stopped states visible. Camera follows an unclamped logical center with delta-based exponential smoothing and a 0.02-pixel snap threshold. Foot-depth sorting, lighting and authored art remain unchanged.

Verification: 59 unit tests and all static/build/format checks pass. Ten original browser cases retain their original screenshot baselines/tolerances; three new cases cover run/stop/facing, preference persistence/duplicate rejection, queue/held steering/blur. One test incorrectly assumed a diagonal angle; its destination assertion was corrected after observing the valid west heading. Inspected [balanced scene](phase2-balanced.png), [full scene](phase2-full.png) and [controls dialog](phase2-controls.png).

## DBL-244 — movement quality gate

Automated quality scenarios cover first-tick response, normalized diagonals, immediate reversal, bounded acceleration/deceleration, distance-driven eight-direction animation, precise endpoint clamping, thin-wall and concave-boundary sweeps, authored foot clearance, smoothed obstacle paths, geometry replanning, rapid retargeting, queue precedence, explicit interruption, facing, persisted/remapped input, maximum-speed collision and settled camera behavior. A seeded 1,000-tick replay checks every traversed segment and round-trips state through JSON while retaining deterministic results. Repeated routes around authored prop feet arrive without persistent oscillation.

Two test-fixture problems were corrected without weakening product behavior: one requested point lay outside the authored boundary, and startup tests read camera telemetry before the first pre-render. Tests now validate reachable fixtures and wait for displayed camera samples. Exact arrival is checked against the accepted click target, which may differ from a coordinate sampled before an asynchronous physical click as the camera follows.

Reproduction:

```sh
npm ci
npm run check
npm run format:check
npm run test:e2e
npx playwright install firefox webkit
npm run test:movement
npm run test:browsers
# Verify an already deployed build without starting a local server:
PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npm run test:e2e
PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npm run test:movement
# Isolated production-preview workload (start npm run preview separately):
BENCHMARK_SECONDS=30 npm run benchmark
```

Final automated results: 61 unit tests; all 15 Chromium E2E cases (including the original ten); all five movement cases in each of Chromium, Firefox 157 and WebKit 27.2; Firefox/WebKit HTTP/WebGL/movement/zoom smoke checks. Existing screenshot baselines and 1% tolerances remain unchanged. Full-detail, balanced and controls-dialog captures were inspected again after toolbar changes. This does not certify real Safari, other hardware or subjective historical-game equivalence.

### Input and future action boundaries

Movement commands are independent of DOM/Phaser and animation playback. A future action controller can interrupt with stop/face intents and later extend command/state types under new authorization. Reserved ability bindings execute no abilities. There are no attacks, skills, hit recovery, knockback, monsters, stamina, loot or combat queues in this implementation. Navigable geometry is authored for the existing plate, not a general streamed or elevated world.

### Review boundary

Implementation stops here for user movement-feel review. Evaluate ordinary click and held steering, a rapid reversal around the cenotaph, Shift-click queue then Space interruption, walk/run pacing, camera settling and remapped keys. Default speeds are tunable starting values, not reverse-engineered historical constants. Run-specific artwork and final sprite consistency remain open in DBL-250; the in-game controls explicitly disclose walk-frame reuse. DBL-245–251 retain the seven requested performance/art follow-ups independently. No later gate is crossed by passing automated movement checks.

### Matched performance samples

Apple M4 / macOS arm64, Chromium 156 SwiftShader, 1920×1080 viewport, balanced 960×540 buffer, decorative effects active, continuous keyboard traversal, 10-second warmup and 30-second frame sample. Twelve alternating click routes then sample event-to-movement-update feedback. Baseline is the public G1 build at 13317df; after is the local production Phase 2 build. Network startup/readiness is therefore not a comparable before/after metric.

| Sample                  | Median FPS | Frame p95 | Input feedback p95 | Frames sampled |
| ----------------------- | ---------: | --------: | -----------------: | -------------: |
| G1 before               |       59.9 |   33.4 ms |            36.6 ms |           1299 |
| Phase 2 initial toolbar |       30.0 |   33.4 ms |            38.1 ms |           1116 |
| Phase 2 final toolbar   |       59.9 |   33.4 ms |            38.8 ms |           1451 |

Raw retained evidence: [before](phase2-before.json), [initial after](phase2-after-initial.json), [final after](phase2-after.json). The initial median drop prompted consolidating eight independent button blur surfaces into one toolbar blur and avoiding redundant live-region text mutations. The final repeat recovered the median target. This is sequential measurement, not randomized causal attribution; scheduling/thermal/software-renderer variability remains possible. Median FPS does not mean every frame reaches 60 FPS: frame p95 remains above the provisional 20 ms budget. Input p95 increased by 2.2 ms in this comparison, rather than improving; it remains below the 50 ms reference target. This telemetry is event-to-movement-update timing, not certified physical-input-to-display latency. Twelve GL submissions, approximately 14.3 MB reported JS heap and zero exceptions remain unchanged. No broad rendering or Firefox performance fix is claimed; DBL-245–249 retain that work.

Measurement provenance: the final performance sample was captured after toolbar consolidation, before the final held-steering throttle removal and duplicate-status guard. The timed keyboard traversal and alternating click routes use the same movement configuration and rendering pipeline; held dragging is covered by browser interaction tests rather than this benchmark. No held-drag performance certification is claimed.
