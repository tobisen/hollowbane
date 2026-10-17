# Phase 3 combat fundamentals

Phase 2 explicitly approved by user on 2026-10-17. Phase 3 authorized through combat quality gate. One normal issue per session; DBL-253 is the first increment. Original backlog dependencies are unchanged; scoped slices do not close their parents.

Sequence: DBL-253 timing → DBL-254 targeting/integration → DBL-255 damage/reactions → DBL-256 projectiles → DBL-257 arena/feedback/diagnostics → DBL-258 quality evidence/publication. Each is split further if it exceeds a focused session. DBL-036 remains partial, including outstanding block and full actor integration. No loot, inventory, advanced AI, skill trees or campaign.

## DBL-253 contract

`src/simulation/combat-timing.ts` is independent of rendering, DOM and clocks. Each call advances exactly one existing 60 Hz simulation tick. The caller supplies attack/hit/death commands; later damage resolution will use the existing seeded RNG primitive. No random draws or damage occur in the timeline.

Idle accepts attack; windup → active → recovery → idle. An accepted attack consumes its first windup frame on that tick. Transition into active emits exactly one typed strike opportunity; an extended active window never repeats damage. Melee and projectile consumers must resolve that event separately. Held attack must be resubmitted after recovery. Movement and further attack commands cannot cancel commitment. Hit interrupts windup/active/recovery; repeated hits during hitstun do not extend its duration. Kill wins over phase expiry and is terminal. Hitstun is not invulnerability: damage rules remain DBL-255 scope. Move is a permission query; movement integration remains DBL-254.

Timing configuration is copied and requires positive integer frame durations. Inclusive, strictly increasing configurable thresholds select discrete frame counts for either attack speed or hit recovery. Thresholds and formulas are original configuration, not copied balance values. The module has no defaults for attack balance and no production integration yet.

## Verification and limitations

Seven targeted tests cover exact boundaries, held input, movement commitment, interruption, anti-extension, terminal death, replay/immutability, thresholds and invalid configuration. No visible changes or new assets; screenshot baselines remain unchanged. No combat demo or measured performance comparison yet: production does not import this module. Movement baseline remains median 59.9 FPS, frame p95 33.4 ms, movement input p95 38.8 ms; this is historical movement evidence, not a combat measurement.

Public demo remains https://tobisen.github.io/hollowbane/ (approved Phase 2). Combat publication and hosted verification belong to DBL-258. No external issue sync attempted in this increment; prior unauthenticated GitHub CLI limitation remains recorded. Combat quality gate has not been reached.

Milestone result: `npm run check` passes (68 tests across 16 files, strict typecheck/lint, six asset records, 258 backlog records, production build); `npm run format:check` passes. All 15 Chromium Playwright regressions pass, including existing visual comparisons with unchanged baselines and tolerance. Initial sandbox attempt could not bind localhost (`EPERM`); authorized rerun passed in 27.1 seconds. No visible changes were introduced, so no baseline refresh was required. Existing build chunk-size warning remains unchanged. Phaser stays pinned to 4.2.1. Commit reference: `git log --grep DBL-253`.

## DBL-259 damage prerequisite

Split the pure calculation from DBL-255 to implement damage first without modifying existing dependencies. `damage.ts` uses injected seeded RNG (two draws per resolution), accuracy/(accuracy+defense) with configurable caps, multiplicative armor and physical resistance, capped vulnerabilities, critical multiplier and floor rounding. Invalid configurations fail explicitly. Four tests cover exact formulas, boundaries, seeded replay and invalid inputs. No production import or visible change yet. Full check: 72 unit tests plus typecheck/lint/build/asset/backlog validation pass. Previous 15 browser regressions from DBL-253 remain the scene baseline.

## DBL-254 targeting controller

Pure controller composes the existing Walker and combat timeline: stable screen-space hover picking, selected versus committed target, range/line-of-sight validation, approach inset/hysteresis, bounded route refresh for moving targets, facing on commitment, deferred ground movement through recovery, single-click/held/release behavior and dead-target cancellation. Five tests cover stationary/moving/dead targets, range/obstacles, exact recovery movement boundary and held-release commitment. Scene adapter is grouped with DBL-257 to avoid half-integrated controls. Full check: 77 unit tests; existing scene remains unchanged. Test development caught and corrected an extra attack after releasing held input.

## DBL-255 combat world and reactions

Plain serializable world state stores the RNG seed and bounded 256-event log. One call advances a fixed 60 Hz tick in stable authored actor order; an earlier actor can interrupt a later actor on that tick. Strike events recheck living target, range and line of sight before seeded damage. Health clamps to zero, death is terminal, dead-target pursuit stops. Accumulated damage at 8% maximum health triggers configurable hit recovery; recovery plus a 12-frame reaction guard prevents repeated stun extension without preventing damage. Explicit invulnerability skips resolution. Optional knockback uses swept navigation checks. Defaults are original training balance, not reference-game formulas.

Five integration tests cover exact damage frame, serialized replay, moving-target whiff, death/pursuit, interruption/guard/invulnerability and knockback/breakpoints. Full check passes with 82 tests. Player/dummy/patrol/hostile initial data is simulation-only until arena integration; no production scene change yet. DBL-036 remains partial (block and full integrated actor validation outstanding).

## DBL-256 projectile foundation

Ranged weapons share the committed attack timeline. A strike launches a non-homing projectile at the target's current position; damage occurs only at swept segment-circle contact. First eligible opposing body intercepts; dead actors are skipped. Projectiles expire after 180 frames, at navigation boundaries, or on source death (explicit training rule). Target movement can dodge a launched shot. Four tests cover launch/impact timing, moving-target miss/expiry, fast swept contact, degenerate segments and dead-target behavior. Full check passes with 86 unit tests. No graphical effects or assets added yet.
