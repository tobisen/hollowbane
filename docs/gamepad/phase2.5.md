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
