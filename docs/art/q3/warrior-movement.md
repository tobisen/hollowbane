# Q3-A Warrior movement — DBL-023/024/025/026

2026-10-25. Current authorization is an isolated eight-direction **idle / walk /
run** set using the accepted Blender4.5.3 rig and Python/Sharp pipeline. Preserve
the original sources, refined materials, production sprites, movement speeds and
simulation timing. No combat clips, other classes, monsters, audio or environment
production. This supersedes the earlier complete-animation scope in the recovery
notes. No AI-generated sheets or mirrored asymmetric equipment.

## Release checkpoints

1. Prerequisite: exact refinement SHA
   `30deedabcdab090a7057184ad44eb94799702845`,
   [CI40231348823](https://github.com/tobisen/hollowbane/actions/runs/40231348823).
   Require classifier-selected Full, Pages, hosted acceptance and independent
   hosted animation verification before new production.
2. **A:** reviewed idle/walk cadence and distinct southeast run pilot. Verify at
   gameplay and increased zoom, actual walk3/run5.4 world units per second.
   Commit/push, required CI, Pages and hosted preview must pass before B.
3. **B:** N/NE/E/SE/S/SW/W/NW idle/walk/run, isolated comparative showcase and
   movement preview; commit/push, required CI, Pages and hosted verification.
   Stop at movement quality review; production adoption is separate.

Retain the same model, rig, camera elevation, lighting and uniform frame window.
Validate unique ordered frame names/counts, atlas references, alpha margins,
constant roots/scale, foot pivots, bone lengths, weapon bounds and texture budgets.
Review contact/passing poses, loop seams, facing, transition continuity and
dark/light edges. Exercise keyboard and virtual controller, camera follow, wall
sliding, idle/walk/run transitions and distance-based animation at gameplay scale.
Tests do not provide user art approval or physical-controller evidence.

Cadence diagnosis from the unchanged pilot:0.9 model-meter stride, display
scale0.5 and the existing projection produce0.568210806 world units per cycle.
Walk3 therefore demands5.27973 cycles/s (84.4757fps for16 poses). Applying the
same walk to run5.4 would demand9.50352 cycles/s. These are calculated limitations,
not approved motion targets. Checkpoint A must review authored stride/contact
motion against actual travel; slowing playback alone creates foot sliding.

## Prerequisite verification checkpoint

The sealed `release-bundle` passes the existing SHA/inventory verifier. All48
files match `/private/tmp/hollowbane-warrior-refinement/tested-files.json` exactly.
Independent hosted identity and preview checks remain pending deployment; no
new animation has been produced. CI status is recorded in STATUS.md.

Raw evidence and the sealed bundle are under
`/private/tmp/hollowbane-warrior-movement`. Later performance comparisons must
reuse the P2 native Metal forest seed42 /1280×800/DPR1 warmed route and matched
quality/input conditions. Record p50/p95/p99, intervals>25ms, camera/tick behavior,
atlas download and decoded sizes. Empty-stage measurements remain separately
labeled; no performance improvement is inferred from asset or correctness checks.

## Native prerequisite baseline

The sealed prerequisite was served locally without rebuilding. Native visible
Chromium156.0.8078.4 / Apple M4 Metal / macOS15.7.4, full1280×800/DPR1,
Haunted Forest seed42/layout2, peaceful, warmed ten alternating36-tick legs and
the existing P2 harness. Both cohorts begin at(-14,-10.5);359 measured frames each.

| Input              | p50/p95/p99 (ms) | Longest (ms) | Frames>25ms | Zero/double ticks |
| ------------------ | ---------------- | ------------ | ----------- | ----------------- |
| Keyboard           | 16.7/17.7/17.7   | 17.8         | 0           | 0/0               |
| Virtual controller | 16.7/17.6/17.7   | 17.7         | 0           | 0/0               |

Camera movement is uniformly3.10455 CSS pixels per moving frame, with zero
player-relative camera drift. Both captures were inspected; shipped graphics
remain visible. These are **before-production baseline** measurements; the
refined atlas is not drawn in this forest route. No new-set performance or
improvement claim. The refined preview's existing atlas is746968bytes /6MiB
decoded; the new movement atlas does not exist yet. Physical input and display
scanout are unmeasured. Raw report and captures:
`/private/tmp/hollowbane-warrior-movement/prerequisite-native-baseline.json`.
