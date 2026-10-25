# Q3-A Warrior movement — DBL-023/024/025/026

2026-10-25. Current authorization is an isolated eight-direction **idle / walk /
run** set using the accepted Blender4.5.3 rig and Python/Sharp pipeline. Preserve
the original sources, refined materials, production sprites, movement speeds and
simulation timing. No combat clips, other classes, monsters, audio or environment
production. This supersedes the earlier complete-animation scope in the recovery
notes. No AI-generated sheets or mirrored asymmetric equipment.

## Release checkpoints

1. Prerequisite **passed**: refinement30deeda required the test-only correction
   `86b816904ebbd75c603518ee28ee08b46f45facb`,
   [CI40233360148](https://github.com/tobisen/hollowbane/actions/runs/40233360148).
   Classifier-selected Full, Pages, hosted acceptance and independent hosted
   animation verification all pass. Checkpoint A may now begin.
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
Exact CI40231348823 for30deeda failed the two browser observations detailed below;
it deployed nothing. Successor **86b816904ebbd75c603518ee28ee08b46f45facb** now
passes all required jobs in CI40233360148: Full, all four Chromium shards,
compatibility, Pages, hosted smoke and Release acceptance. Independent hosted
verification matches all48 sealed/reviewed files byte for byte. All four focused
hosted Warrior preview cases pass: stepping/playback, movement/root/zoom/save
isolation, normal-entry exclusion and refined art/comparison. Light/dark and
gameplay-stage captures were inspected: existing armor/fabric and weapon remain
intact, with no visible clipping or distracting halos. Cadence is unchanged.

[Released refined preview](https://tobisen.github.io/hollowbane/?developer=1&warriorPilot=1&warriorRefined=1).
This closes the prerequisite release gate only. No new movement animation has
been produced; A and B remain incomplete. The approved source opens natively in
Blender4.5.3 LTS with15 bones,135 meshes, the original orthographic camera and
three lights. It was inspected without modification or rendering. Reuse this
saved rig for animation-only authoring; do not rebuild the character or repeat
the art trials. Session checkpoint evidence may remain local without deploying
identical runtime bytes again; the next runtime release is checkpoint A.

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

## Demonstrated release blockers and focused repair

Both downloaded traces and screenshots were inspected. The melee assertion
observed windup and then read HP through a separate host call after the first
valid42-damage strike (160→118). It now pre-arms an atomic first-sequence
windup/HP snapshot and additionally checks the first damage tick against the
remaining windup. A diagnostic delays the host read until that real strike:
snapshot HP160 at tick35/remaining11, later HP118/damage tick46. No phase or
damage rule changes; the original held-attack/death deadline remains12s.

The Ranger trace shows a2.7s gap between observing hover and pressing the mouse;
the moving target left the old aim point. Player sequence remained0 and no
player attack occurred. The test now refreshes aim and retries trusted mouse
input within the original5s acquisition budget. It retains the same enemy,
path, real starter bow, positive target-specific damage assertion and15s damage
deadline. No gameplay, AI, item, input-handler or timeout changes.

The focused melee and Ranger cases pass in5.2s and10.7s against the unchanged
sealed build. A temporary diagnostic deliberately misses the first trusted
Ranger click; re-aiming recovers and the same damage assertion passes in18.0s.
TypeScript, affected lint and formatting pass. All48 runtime files remain
identical; no local campaign/loot/full regression or rebuild is needed for this
test-only repair. The existing classifier controls required successor CI;
no release-tier override or failed-run rerun is used as acceptance.
