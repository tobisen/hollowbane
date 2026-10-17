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
