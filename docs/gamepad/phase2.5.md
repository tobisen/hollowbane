# Phase 2.5 gamepad support

Authorized insertion on 2026-10-17. Preserve Phaser 4.2.1, keyboard/mouse and completed combat through 4f68d1f. No further combat development. Original 36-phase roadmap and all DBL numbers preserved. Requested DBL-GP01–12 are unique aliases for DBL-263–274. G2.5 approval remains user-owned; phase3 resumption depends on completion plus approval, recorded in gates.json.

## Input contract

Browser adapters produce sampled physical state; pure modules normalize it to semantic actions with press/hold/release transitions plus separate movement/aim vectors. Simulation consumes only normalized values and fixed ticks. Direct analog movement replaces click routes and queued destinations on meaningful stick input; neutral sticks never cancel mouse routes. Latest meaningful device input selects presentation/input ownership; idle connected pads never steal it. Explicit controller selection excludes other pads. Focus/pause/disconnect clears held state and requires neutral before rearming.

Unfinished interact/pickup/map/inventory/skills are semantic reservations with honest unavailable feedback, not new gameplay systems. Existing completed combat may receive semantic attack commands without changes to its mechanics. Physical-controller testing has not been performed.

## DBL-263 / DBL-GP01

Semantic actions and device-independent edge frames implemented; keyboard defaults use the same action vocabulary. Two targeted tests; full check passes with 92 unit tests. Twelve unique aliases scoped, original numbering/roadmap preserved; Phase 3 resumption dependency recorded explicitly.

## DBL-264 / DBL-GP02

Pure lifecycle ownership and explicit active-controller selection implemented. Neutral-on-rearm protects focus/disconnect/reconnect; idle pads do not steal keyboard/mouse input. Three lifecycle tests plus semantic tests, typecheck and lint pass.

## DBL-265 / DBL-GP03

Xbox, PlayStation and generic standard-compatible layouts map to identical semantics. Extensible typed vendor profiles can override axes/buttons; unknown nonstandard devices require explicit override. Conflict validation and text glyph fallback covered by four tests; typecheck/lint pass.

## DBL-266 / DBL-GP04

Radial deadzone, outer saturation, sensitivity and configurable power curve preserve 360-degree heading and bounded magnitude. Three analog tests cover drift, diagonals, monotonic response and invalid configuration; typecheck/lint pass.

## DBL-267 / DBL-GP05

Established walker now accepts bounded analog speed scaling without changing keyboard/click defaults. Browser adapter polls Gamepad API with Phaser gamepad enabled; meaningful direct movement clears routes/queues, neutral pads preserve click-to-move. Full check: 104 unit tests. Two virtual-pad scenarios plus five original movement cases pass in Chromium; physical hardware not tested.

## DBL-268 / DBL-GP06

Independent right-stick facing preserves eight-direction visuals without altering analog movement. L3 uses existing persistent gait command. Semantic primary/target selection adapt preserved combat only; unfinished skills/interact/pickup/secondary remain honest reservations. Four virtual-pad browser scenarios and 105 unit tests pass. Fixed a same-poll DOM/gamepad arbitration race; new sampled pad edges win ties, stationary held axes do not steal ownership. No combat mechanics changed.

## DBL-269 / DBL-GP07

Shared controller pause/menu and focus navigation cover cloister, movement dialog, preserved combat, atelier, controller page and both engine screens. D-pad/stick focus, activate/back, select/number adjustment and keyboard-remap field cycling are supported. Gameplay pauses under controller UI focus. Targeted menu/atelier/engine browser checks and original movement checks pass; menu screenshot inspected. Full check 105 tests passes.

## DBL-270 / DBL-GP08

Context prompts use active-device ownership, Xbox/PlayStation/generic text glyphs and actual remapped buttons. Movement avoids advertising unavailable attacks; menu/combat contexts differ. Unit prompt test and PlayStation/generic/mouse switching browser case pass. First pointer movement now switches correctly even when movementX/Y are zero. No copied graphical glyph assets.

## DBL-271 / DBL-GP09

Versioned atomic settings persist custom button bindings, selected controller, profile override, axis assignment, independent move/aim deadzones/curves/sensitivity and vibration preference. Duplicate/invalid bindings rejected; interact/cancel/pause remain remappable but cannot all be unbound, preserving menu recovery. Four persistence tests; full check 110 tests; browser reload/conflict/custom-button and menu checks pass. Settings screenshot inspected. Missing/denied storage has a usable session-only fallback.

## DBL-272 / DBL-GP10

Controller laboratory exposes raw/processed separate stick vectors, buttons, profile/ownership/connection/rearm status and polling cost. Stable twenty-frame center calibration persists and rejects held/moving sticks; disconnect/change cancels capture. Pure calibration test plus two browser calibration/visual cases pass; full check 111 unit tests. Original SVG stick visual baseline inspected; no vendor graphical assets copied. Physical-controller verification remains unperformed.

## DBL-273 / DBL-GP11

Optional short modern/legacy haptics are capability-checked, disabled by default, rejection-safe and stopped on reset. Input reset signals stop movement and held combat pursuit on disconnect/focus/menu/settings changes without cancelling attack commitment. Rearm requires neutral; keyboard handoff preserves its first key press. Haptics unit test, full check 112 tests and all 14 virtual-pad browser cases pass. Vibration fallback tested; physical vibration/controller hardware not verified.

## DBL-274 / DBL-GP12 — verification checkpoint

Full check/format: 114 unit tests, strict typecheck/lint/build, ten asset records, 274 backlog records. Complete Chromium suite passed 37 cases. Final calibrated-ownership follow-up passed all 17 Chromium controller scenarios; all 32 Firefox/WebKit controller behavioral cases pass (one native Tab assertion adjusted to accept each browser's native interactive focus policy). All 15 legacy movement cases and original Firefox/WebKit smoke checks pass.

Quality findings corrected: DOM/gamepad same-poll arbitration; first mouse move with zero movement deltas; deferred close cleanup erasing a new key press (now synchronous pre-dismiss); native Tab preserved (map hotkey V); existing custom movement bindings outrank new keyboard semantic defaults in gameplay focus. Maximum speed's short pre-collision window is now observed on requestAnimationFrame, retaining exact speed 12, endpoint and swept collision assertions; five repeated cases pass. Failure traces confirmed the later intermittent zero-speed reading was a correctly stopped actor at x=1006.274, not lost input.

Ownership/rearm now uses calibrated/deadzoned logical axes, so custom low deadzones and center offsets above the previous raw neutral threshold work. Calibration browser coverage captures a 0.23 center offset and verifies rearming. Bridge polling CPU includes full sampling/normalization/telemetry work; percentile sorting runs every thirty samples.

Vendor extension contract: `controllerInput.registerVendorProfile(profile)` accepts typed matcher, physical axis indices, physical button mappings and glyph family. Normalization converts a vendor layout to standard logical controls before persistent user remaps apply. Unknown nonstandard devices stay inactive until a matching extension or explicit standard override is selected; no untested vendor-specific physical layout is claimed.

Performance runner: scripts/gamepad-benchmark.mjs compares the published pre-2.5 keyboard build (asserts controller runtime absent), current keyboard and current virtual analog input on the same scene/machine/viewport/renderer. Loading is excluded by warmup. Virtual injection-to-movement timing is reported separately from poll-to-movement timing. No physical-controller, Bluetooth, OS-driver or physical vibration verification has been performed.

## Final local measurements

Retained evidence: performance.json. Same Apple M4, Chromium 156, explicit SwiftShader software WebGL, 1920×1080 viewport, 960×540 balanced render buffer, twenty seconds per workload after two seconds warmup. Pre-2.5 published runtime (`4f68d1f`, controller runtime absence asserted) versus local candidate `bc1dae7`:

| Workload              | Frame p50 | Frame p95 | Adapter feedback p95       | Controller bridge CPU p95 |
| --------------------- | --------- | --------- | -------------------------- | ------------------------- |
| Before: keyboard      | 16.7 ms   | 33.4 ms   | 19.4 ms                    | absent                    |
| After: keyboard       | 16.7 ms   | 33.4 ms   | 20.3 ms                    | 0.10 ms                   |
| After: virtual analog | 16.7 ms   | 33.4 ms   | 0.10 ms (poll-to-movement) | 0.10 ms                   |

Virtual API injection-to-movement (includes waiting for next poll): twenty samples, p50 20.8 ms, p95 38.8 ms. This is separate from the shorter poll-to-movement metric and is not hardware latency. All three workloads had zero page errors. The short sample shows no major frame-pacing regression; it does not establish physical-device, OS, Bluetooth, GPU or long-session performance.

Reproduction: `node scripts/gamepad-benchmark.mjs CURRENT_PREVIEW_URL BEFORE_PREVIEW_URL`. After publication the default public baseline is intentionally rejected because it now contains controller support. Recreate a baseline server from commit 4f68d1f in an isolated checkout/worktree, install/build it and preview on a different port; supply that URL explicitly. The original measurements used the pre-publication hosted baseline and local candidate, with asset loading excluded from samples.

## Physical verification matrix

| Device path                         | Browser/API emulation                                                  | Physical controller |
| ----------------------------------- | ---------------------------------------------------------------------- | ------------------- |
| Xbox standard                       | verified Chromium/Firefox/WebKit                                       | not performed       |
| PlayStation standard mapping/glyphs | verified with standard API snapshots                                   | not performed       |
| Generic standard-compatible         | verified with standard API snapshots                                   | not performed       |
| Multiple pads/manual selection      | verified with virtual snapshots                                        | not performed       |
| Vibration                           | mock modern/legacy API and disabled/unsupported browser paths verified | not performed       |

Virtual tests replace navigator.getGamepads with deterministic snapshots consumed by the same browser adapter/Phaser-enabled scenes. They do not validate native device drivers or every vendor's nonstandard layout. Stock automatic support uses the browser standard mapping; manual overrides and registered vendor normalization are explicit fallbacks.

Keyboard defaults preserve Tab navigation and existing remapped movement keys. New semantic defaults include X primary, Q secondary, P pause, M menu, V reserved map, Enter interact, Escape cancel, T target selection and F reserved pickup; available gameplay actions route to existing commands. Existing movement bindings take priority while the gameplay field is focused. Unfinished systems remain inactive with unavailable/reserved feedback.

G2.5 remains a review gate: technical implementation, CI/Pages and hosted verification are complete. Phase 3 stays frozen and no later gameplay systems are authorized.

Compatibility follow-up under DBL-274: explicit Xbox/XInput/vendor identifiers take priority over the PlayStation name fallback; the fallback no longer mislabels generic wireless device names. Regression coverage includes Xbox Wireless Controller, generic 8BitDo wireless naming and the common Sony Wireless Controller name. Full check now passes 115 unit tests; the expanded Xbox/PlayStation/generic/mouse prompt browser case passes. This label-classification correction does not change logical mappings or the recorded benchmark workloads.

Import/publication: the 274-record idempotent import dry-run was inspected. Apply stopped before requests because GITHUB_TOKEN is absent. Local scoped records are preserved and no GitHub issue import success is claimed. SSH publication works; first G2.5 candidate is 40081b7, CI run 39023176125. Final candidate status is recorded below after CI and hosted verification.

The expanded prompt fixture now waits for the replacement device identity and neutral rearm acknowledgement before pressing Menu. Its first draft pressed during the replacement guard and was correctly ignored; the fixture was corrected. Expanded Xbox Wireless/PlayStation/generic/mouse prompt checks pass in Chromium, Firefox and WebKit. No production input guard was relaxed.

CI run 39023539535 at 6532a6f failed two browser checks and did not deploy. Repairs under DBL-274: manual-controller selection now waits for Phaser scene readiness; real keyboard events inside editable/remapping fields no longer enter global action state, preventing a held remap key from opening Pause. The strengthened remap scenario holds P through multiple input polls. Synthetic controller navigation events remain excluded from device ownership. PlayStation prompts include Unicode shapes with accessible button names. These changes preserve input timing, logical mappings and recorded benchmark workloads. Full check/format passes with 115 unit tests.

## Final runtime verification (2026-10-17)

Runtime candidate 3ad5f5e passed check/format (115 unit tests) and the complete 37-case Chromium suite in [CI/Pages run 39024351109](https://github.com/tobisen/hollowbane/actions/runs/39024351109); both verify and deploy jobs succeeded. The complete final Firefox/WebKit controller suite passed all 32 cases. One earlier Firefox navigation attempt overlapped rebuilding dist and timed out before page load; its isolated rerun and the full final suite passed. No assertion tolerance or safety guard was relaxed. Earlier 15 three-browser legacy movement cases and original Firefox/WebKit smoke coverage remain passing. Visual evidence includes the controller-stick regression baseline and reviewed menu, remapping/settings and PlayStation prompt screenshots; transient captures stay ignored.

Verified increments: DBL-263 44c8446; DBL-264 2fe8a19; DBL-265 b27d71c; DBL-266 b47fed0; DBL-267 3c973e2; DBL-268 66b96e6; DBL-269 6614f17; DBL-270 952fd18; DBL-271 27fafc0; DBL-272 bf8e6c6; DBL-273 114e583. DBL-274 checkpoints: bc1dae7 (regression/profiling), 40081b7 (measurements), b7421b1 (wireless identity), 6532a6f (neutral handshake fixture) and 3ad5f5e (CI repairs/final runtime). Closing documentation does not change that verified runtime.

Hosted verification: all 22 controller/movement cases pass against https://tobisen.github.io/hollowbane/ . The first hosted run passed 21 and exposed a fixture reading combat diagnostics before Phaser finished loading; the shared fixture now waits for data-combat-ready and advancing simulation ticks before emitting combat input. No production change was required. Full check/format still passes 115 unit tests after this fixture correction.

G2.5 delivery: DBL-263–274 / DBL-GP01–12 technically complete. Public controller settings/diagnostics: https://tobisen.github.io/hollowbane/?controller=1 ; movement: root URL; preserved combat: ?combat=1. Stop for user quality review. G2.5 approved remains false, Phase 3 frozen remains true, physical-controller/vibration verification remains unperformed. DBL-036 and other broad original parents remain partial; DBL-260 and existing movement/art follow-ups remain visible. No further gameplay systems were added.
