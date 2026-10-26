# Q3-A Warrior movement — DBL-023/024/025/026

2026-10-26. The extended Warrior request authorizes eight-direction movement,
combat/cast, hit/recovery/death and an isolated playable arena through final
Warrior quality review. Southeast pilot517ed70 is released. Public checkpoint1
covers all movement assets and the showcase; checkpoint2 covers combat/hit/death
in the disposable arena; checkpoint3 is the final visual/performance candidate.
Verify each public release before advancing to the next public deliverable.
Reuse the approved Blender4.5.3 model, rig, materials, lighting and camera. Preserve
Southeast pixels, production sprites, movement physics and unrelated local edits.
No live activation, balancing changes, other classes, monsters or new campaign.
No new AI-generated sheets or mirrored asymmetric geometry.

## Extended movement candidate — checkpoint1

All eight directions now have idle8 / walk16 / run16: **320 poses /24 clips**.
The seven additional views rotate the complete approved geometry/armature; camera,
lights, materials and animation keys remain unchanged. Approved SE pixels are
copied exactly, without rendering or modifying its original files. The original
Blender sources are intact. All assets remain developer-only, unapproved for live
adoption. No combat clips have been authored yet.

All160 cardinal renders were completed before the120 diagonal renders. Full
measured silhouettes fit the original256px render window. A shared **eight-row
bottom extension** produces256×264 export cells; original pixels stay at the same
coordinates, root128,210 and display scale0.5. This is3.125% extra decoded space,
not a scale/camera/pose adjustment. South's minimum alpha margin is now12px.
The original SE eight-pixel validator remains unchanged. The new validator uses
the same eight-pixel edge policy against the new window, source/clip hashes,
rig/root invariants, exactly rotated planted contacts, contained weapon geometry,
transparent black RGB/fringes, ordered unique pixels and loop-seam checks.

Eight2048×1320 PNGs total7,938,193bytes /82.5MiB decoded (10.3125MiB/view).
These are texture payloads, not total browser/GPU memory. Assets and metadata:
`public/dev/warrior-directions`; authoring source:
`assets/source/q3/warrior-directions/render.py`. No placeholders or external art
were introduced; provenance records source rig, renderer, packager and approved
SE atlas fingerprints. Frame names retain action/direction/two-digit index.

Showcase route: `?developer=1&warriorPilot=1&warriorDirections=1`.
Direction/state selection, simultaneous gameplay-scale clips, pause/rate/stepping,
root/foot guides, dark/light backgrounds and shipped comparison are available.
The Phaser stage selects facing from the existing walker, uses actual-distance
phase, retains walk/run speeds and collision sliding, follows the root and accepts
keyboard or focused standard virtual-controller input. Source switching remains
isolated; normal entry does not fetch these assets, and no save storage is opened.

All additional280 poses and light/dark browser captures were inspected. No cell
clipping or distracting matte halos observed. Sculptural finish, brisk stylized
cadence,16-pose sampling and quantized eight-way facing remain review limitations.
Timed native playback strips cover all24 loops; raw diagnostics and measurements
are retained under `/private/tmp/hollowbane-warrior-cardinals`. User art/quality
approval and physical-controller verification remain false.

Local checks:12 focused asset/negative/loop units, all8 focused Chromium cases
(four existing SE /four new directions), TypeScript/build, affected ESLint and
complete asset validation pass. The first new wall assertion incorrectly assumed
a rectangular collider; it was corrected to assert the unchanged expanded ellipse,
continued sliding and fixed camera-relative root. No physics/tolerance change.
No unrelated loot/campaign suite was run locally. Existing risk classification
still controls mandatory release CI; no tier or acceptance threshold is lowered.

Native visible M4/Metal,1280×800/DPR1, full P2 seed42/layout2 peaceful forest,
same warmed10×36-tick legs and start(-14,-10.5),359 frames/input/variant:

| Input              | Baseline p50/p95/p99 ms | Candidate p50/p95/p99 ms | >25ms |
| ------------------ | ----------------------- | ------------------------ | ----- |
| Keyboard           | 16.7/17.1/18.4          | 16.7/18.0/18.6           | 0 /0  |
| Virtual controller | 16.7/17.1/18.4          | 16.7/17.1/18.5           | 0 /0  |

All eight candidate textures load via the **test driver only**; production still
draws shipped sprites normally. Zero zero/double ticks, uniform3.10455px camera
steps and zero player-relative camera drift in all cohorts. Longest18.7ms. This
single matched pair is insufficient for an improvement/regression estimate;
cold loading, long sessions and physical input remain unmeasured. The tool now
accepts both the earlier SE manifest and the new directional manifest.

Reproduce (do not rerender completed/approved poses unnecessarily):

```sh
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-directions/render.py -- /private/tmp/warrior-views n e s w
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-directions/render.py -- /private/tmp/warrior-views ne sw nw
node scripts/package-warrior-directions.mjs /private/tmp/warrior-views n e s w ne se sw nw
node scripts/validate-warrior-directions.mjs
```

Required CI/Pages/hosted acceptance is pending. Do not begin combat production
before checkpoint1's exact release is verified. Final Warrior quality gate has
not been reached. Concise machine evidence: [movement-review.json](movement-review.json).

## Cardinal renderer checkpoint

The original approved blend is opened directly; all135 meshes and the armature
rotate together about the fixed root. Camera/lights and motion keys stay intact.
`assets/source/q3/warrior-directions/render.py` excludes SE deliberately. Direction
angles N135/E45/S315/W225 degrees project to the expected screen headings.
All160 cardinal pose records pass root, ankle and bone-length invariants. Native
sample renders cover one run pose per direction; this is not a completed atlas
batch or full motion review.

South run07's actual256px alpha bounds are77,39–197,251 after the existing2:1
Sharp reduction and alpha>4 threshold: **four pixels of bottom clearance**. This
is contained but tighter than the existing SE eight-pixel audit margin. Review
all rendered bounds before export; do not silently weaken the SE validator or
change approved framing. Conservative South/West bounds alone overestimate the
visible silhouette. Source and samples are in
`/private/tmp/hollowbane-warrior-cardinals`; no runtime assets/preview changed.
This historical source checkpoint is superseded by the extended candidate above.

## Release checkpoints

1. Prerequisite **passed**: refinement30deeda required the test-only correction
   `86b816904ebbd75c603518ee28ee08b46f45facb`,
   [CI40233360148](https://github.com/tobisen/hollowbane/actions/runs/40233360148).
   Classifier-selected Full, Pages, hosted acceptance and independent hosted
   animation verification all pass. Checkpoint A may now begin.
2. **Southeast pilot passed:** `517ed7013e393cf62770a12dea4415a812683638`,
   [CI40237453552](https://github.com/tobisen/hollowbane/actions/runs/40237453552).
   Exact SHA rechecked: required CI, Pages, hosted smoke and release acceptance
   succeed. User confirms hosted preview verification. Idle8/walk16/run16 retained.
3. **Checkpoint1:** N/NE/E/SE/S/SW/W/NW idle/walk/run, isolated comparative showcase and
   movement preview; commit/push, required CI, Pages and hosted verification.
   Then the extended request permits combat-preview production. Production adoption
   remains separate; stop at the final Warrior quality gate.

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
This closed the prerequisite release gate only; animation authoring had not yet
begun at that checkpoint. The approved source opens natively in
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

## Checkpoint A — Southeast cadence and run candidate

Original animation-only source: `assets/source/q3/warrior-movement-se/motion.py`.
It loads the approved v2 `.blend`; all135 meshes,15 bones, materials, camera,
lights, framing and root remain intact. No model rebuild or AI trial. The retained
new `.blend` has40 keyed poses and separate idle/walk/run range markers.

- Idle retains the approved8 poses, slowed to a3.2s breathing loop.
- Walk has16 new poses:1.65 model-meter stride,55% stance, alternating supports,
  weight transfer, compressed knees and restrained sword-hand swing. Hermite
  recovery matches planted-foot velocity at both seams. Actual3 world/s playback
  drops from5.28 to2.88 cycles/s; it remains a brisk, stylized armored gait.
- Run has16 separate poses:2.5 model-meter stride,34% stance, four airborne poses,
  forward lean, deeper compression and stronger free-arm swing. Actual5.4 world/s
  yields3.42 cycles/s. The weapon remains rigidly attached to its hand.

The first audit rejected an unreachable run ankle; compression was corrected
without stretching bones. The first render caught a one-pixel margin shortfall;
slightly reducing run extension retained the approved camera. Final40-frame
atlas:2048×1280,1132558bytes,10MiB decoded, minimum8px margin. All poses have
strict hashes, fixed roots, invariant bone lengths and contained weapons. The
validator checks source/base-rig provenance, ordering, duplicates, alpha,
planted velocity, cadence/displacement and actual run flight. Loop-seam pixel
changes remain below the largest internal pose step (10% tolerance).

Preview: `?developer=1&warriorPilot=1&warriorCadence=1`. Three simultaneous clips
at128px gameplay display size,384px inspector, exact stepping, playback rate,
dark/light backgrounds and root/foot guides. The shipped comparison uses shipped
cadence during playback. Phaser stage consumes the unchanged `moveTick` at60Hz
with3/5.4 speeds; gait phase accumulates actual distance and survives walk/run
switches and collision sliding. A120ms visual crossfade bridges posture changes.
Keyboard and standard virtual axes support input-direction checks; artwork stays
SE and is never mirrored. No settings, saves or production atlases change.

All40 poses, light/dark captures and native actual-playback sequences at zoom1/2
were inspected; no visible cell clipping or distracting halos. Run reads as a
separate gait. The sculptural finish, brisk walking rhythm, discrete16-pose foot
sampling and brief transition crossfade remain review limitations, not claims of
human quality approval. No eight-direction or physical-controller verification.

Thirteen focused asset/negative/loop tests and eight Chromium preview cases pass;
the corrected gameplay-scale layout was captured again. TypeScript, affected
lint/format, full asset validation and build pass. Local campaign/loot/full
regression suites were not run. Runtime release acceptance remains separate;
use the existing classifier without lowering mandatory gates.

Reproduce:

```sh
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-movement-se/motion.py -- /private/tmp/warrior-cadence
node scripts/package-warrior-pilot.mjs /private/tmp/warrior-cadence movement
node scripts/validate-warrior-movement.mjs
```

### Matched native Mac measurements

Native visible Chromium156.0.8078.4 / M4 Metal / macOS15.7.4, full1280×800/DPR1,
P2 peaceful Haunted Forest seed42/layout2,1138 display objects, one actor and no
particles; same warmed ten36-tick legs/origin as the recorded baseline. A
**test-driver-only** `--warrior-atlas-url` option swaps the player texture after
scene update; no application skin or gameplay hook is installed. Both existing
and new atlas use identical conditions. It is performance evidence, not evidence
of production activation or correct facing outside SE.

| Input              | Shipped p50/p95/p99 (ms) | Candidate p50/p95/p99 (ms) | >25ms before/after |
| ------------------ | ------------------------ | -------------------------- | ------------------ |
| Keyboard           | 16.7/18.4/18.5           | 16.7/18.5/18.6             | 0/0                |
| Virtual controller | 16.7/18.2/18.3           | 16.7/18.2/18.4             | 0/0                |

359 frames/cohort; zero zero/double ticks and3.10455px camera steps in all.
Longest candidate18.7ms. No meaningful pacing regression or improvement claim.
The actual isolated preview with comparisons paused/walking measured240
intervals:16.7/16.8/18.3ms, longest18.6ms, zero>25ms, no missed movement frames and
max0.05 world-unit step. With all comparison clips playing and run active,240
intervals measured16.7/18.1/18.6ms, longest18.6ms and zero>25ms.
No concurrent build/tests or CPU tracing during these captures. Cold uploads,
long sessions, physical devices and other hardware remain unmeasured.

Raw profiles, video, temporal strips and browser captures:
`/private/tmp/hollowbane-warrior-cadence`. Concise record:
[cadence-review.json](cadence-review.json). Commit/push and exact required CI,
Pages and independent hosted preview verification must complete before this
candidate is called released. This historical Southeast stop is superseded by the
extended request and the verified517ed70 prerequisite above.
