# Warrior integration — Phase 2

2026-11-15 · DBL-035/375/379 · bounded character presentation review

## Diagnosis recorded before changes

Baseline is deployed `aefe578fa26e675e74e25051ce29ed22ca8356c8`.
The unchanged local production build was inspected in Chrome157/M4/Metal,
DPR1,1280×800 full-composition canvas in1440×1050 browser viewport. Real keyboard
movement in all eight directions, source/empty snapshots and a movement recording
are captured in `/private/tmp/hollowbane-warrior-integration/`. This diagnosis
precedes character, rendering or locomotion changes. No environment pixels change.

The three largest observed mismatches are:

1. **Near-black, cool manufactured surfaces against warmer granular ground.**
   The actual actor reads as hard plate segments separated by very dark joints;
   the soil, wall and roots share softer intermediate values and irregular material
   breakup. The existing `#c8c8bf` whole-actor tint darkens every material by roughly
   22%, without separating metal highlights from cloth or skin. Source materials
   corroborate, but do not replace, that observation: steel metallic0.78, blade0.85,
   a cool500W key and almost equally strong400W warm rim. Tone adjustments cannot
   truly rotate those baked lights or change the modeled armor. A narrowly scoped
   material proof must be assessed before processing the existing animation set;
   if it still reads as incompatible3D art, use the authorized single replacement
   candidate rather than accumulating filters.
2. **Walking motion runs at near-running physical cadence.** Real unobstructed
   rightward input moves image(620,495)→(891.529,495) in60 ticks:271.529px/s,
   approximately2.86 body heights/s. The authored1.04172-world-unit cycle combined
   with walk speed3 produces2.88 full cycles/s (46.08 pose samples/s). The source
   calls that cycle1.65m, implying4.75m/s if its physical calibration is adopted.
   These are measured/derived baseline values, not a claim of universal human
   gait constants. The tiny moving figure reads as rapidly cycling limbs at this
   scene scale. There is evidence for prototype-only walking calibration; changing
   animation rate alone would create foot sliding. Production speed/stats stay
   protected and any correction must keep phase tied to actual travel.
3. **Diagonal stride/facing and abrupt contact transitions.** Native eight-direction
   captures move on screen diagonals45° while the corresponding authored views
   face26.565° (18.435° discrepancy). Their source-ground movement therefore cannot
   align with the baked planted-foot vector merely by changing pose rate. Cardinal
   headings already agree. On release, the current selector jumps
   from whichever walking pose was sampled to idle0, despite a fixed ground root.
   The34×12 constant-alpha ellipse has a hard edge, whereas nearby root/wall contact
   transitions are softer. Fixed anchoring itself is already correct. The actual
   screenshots show a body close to95px, compatible with the modest wall and path;
   no evidence supports independently scaling facings or changing the30° camera.

Scale rule remains256×264 source cells, root(128,210), display0.5. Head-to-root is
approximately94.5–95.5px across directions. The environment has approximate rather
than calibrated geometry; wall/path proportions are visual scale references,
not recovered physical measurements. Current occlusion is conservative and the
integer camera preserves the still exactly with the actor hidden. Do not replace
those working parts without visible evidence.

## Single-proof decision before runtime changes

The matched one-pose proof retains geometry/alpha and raises dark material values
instead of further darkening the whole actor. Opaque source-sample luminance
p10/p50/p90 becomes40.8/62.4/101.6; baseline screenshot samples were23.5/39.5/75.2,
and ground at those positions66.9/82.5/99.2. These are screen/code-value comparisons,
not physical radiometry. The inspected proof retains body/readability and reduces
the charcoal/cool contrast. Existing30° framing and silhouette are usable for a
bounded improvement; a replacement animation pipeline is not yet justified.

Selected scope: deterministic prototype-only treatment of existing idle/walk
cells (zero new poses), preserve scale0.5/root(128,210), remove the old blanket
dimming tint, soften contact, and reuse the existing short presentation transition.
Prototype walking is calibrated to1.2 authored cycles/s: world speed1.25006,
nominal source1.98m/s, approximately113px/s horizontally. This explicit speed
correction is supported by the measured2.88-cycle/4.75m/s mismatch; global movement
constants and character stats remain unchanged. Prototype diagonal input intents
follow the baked2:1 ground axes, keeping shared movement/pathfinding/collision.
Arbitrary mouse paths retain nearest-eight-view approximation. No subjective
artistic approval is claimed; baked light direction/geometry remain limitations.

## Delivered bounded treatment

`experiments/warrior-integration/` contains the single proof, reproducible derivative
manifest, matched1280×800 before/after images, real path/foliage/front/ruin captures
and a short continuous eight-direction native recording. The standalone comparison
is a production build input and is linked from the playable prototype. No static
actor compositing substitutes for the runtime captures.

The derivative raises dark material values, reduces cool chroma and compresses
highlights, without sampling environmental colors at runtime or applying a screen
filter. Original alpha, geometry, edge resolution, pivot and scale remain exact.
Unused run rows are omitted from the prototype derivative;192 existing idle/walk
cells are reused, zero new poses. The source eight atlases and normal runtime
assets remain unchanged. This improves tonal compatibility provisionally, not
physical roughness or the direction of the already baked key/rim lights.

A soft34×14 contact texture replaces the hard ellipse. The current body stays
opaque beneath a100ms previous-pose fade on starts/stops/turns. Both bodies share
the same position and depth convention, and both disappear with Hide Warrior.
Brief overlapping silhouettes remain possible; there is no invented skeletal
interpolation. Real accepted velocity selects the nearest actual source view,
including arbitrary paths and collision sliding. Keyboard diagonals now align
with source headings. The pure source-contact audit has<0.001px planted-foot
vector error at authored frame samples in all eight directions. Discrete16-pose
sampling, arbitrary mouse-path angles and transitions can still show sliding;
the analytical audit does not claim zero visible live foot drift.

## Visual and performance evidence

Reviewed actual main comparison, all eight moving directions, timed film samples,
real path and behind/front/ruin stills. The conservative foreground masks still
hide the behind-foliage stop almost completely. At the front stop the body remains
in front of the root/trunk; at the ruin it stands against the existing wall/rocks.
No environment, masks, navigation bounds, pathfinding, collision or camera algorithm
was replaced. Hidden-Warrior full/camera-crop RGB equality remains the strict
regression check. No hidden ground is reconstructed; fine leaves/sloped depth and
a finite flattened environment remain approximate. Scale0.5/body~95px and30°
authored projection are preserved across facings.

Fresh matched Chrome157/M4/Metal, DPR1,960×600 canvas within1280×800 browser:
three warmed540-interval samples each baseline and candidate. Both p5016.7ms,
p9516.7–16.8, p99/max16.8, zero>25ms; every sampled camera integer and in bounds.
These are RAF intervals, not GPU completion measurements. Same key/tick trace,
but intentionally slower calibrated motion means different positions/pose workload;
this is not a pure-material benchmark. No universal hardware acceptance is claimed.
See `warrior-integration-performance.json` for exact values/conditions.

Playable candidate18 textures,6,560,315 PNG bytes,56,665,000 calculated RGBA bytes,
versus17/9,826,668/91,259,816. The additional texture is the soft contact texture;
smaller atlases omit unused run rows. RGBA is an allocation calculation, not GPU
residency. Review gallery PNG/video bytes are separate and only requested on the
comparison page. Fresh-context HTTP-cache-cold scene readiness96.7–100.5ms versus
175.5–192ms baseline; OS/GPU caches were warm. No claim of universal cold startup.

## Verification and release gate

Thirteen focused movement/source-alpha/stride/facing/navigation tests pass;
TypeScript, full lint and production build pass. Seven focused Chromium cases
pass48.9s, including exact image/camera pixels, all directions, real occlusion and
wall sliding, strict route/asset failure, actual normal-checkpoint byte isolation,
normal startup, calibrated rate/contact and matched comparison pixels. The wall
slide replay preserves the original physical distance by adjusting held-input
ticks for the explicitly slower prototype speed, not assertion bounds/deadlines.

The first optional Firefox/WebKit run passed both pixel cases and WebKit motion;
Firefox exposed a test synchronization race: a pre-stop transition0 could be read
before the release generated its next transition. The wait now atomically requires
walking=false, transition0 and previousRoot=null. No runtime/deadline/pixel tolerance
was changed to address that test failure. Final compatibility replay and hosted
release evidence follow below.

At this checkpoint public runtime remains `aefe578fa26e675e74e25051ce29ed22ca8356c8`.
Exact-commit risk-based CI, Pages, hosted route/save isolation and sealed/public
asset-byte verification are required before calling this candidate published.
Human visual approval remains false. Stop there; no gameplay/campaign expansion.
Raw evidence: `/private/tmp/hollowbane-warrior-integration/`.

Final optional motion replay passes Firefox and WebKit2/2 (7.2s); their two exact
hidden-background cases already passed. The11.8-second1280×800 native film's
2/4/6/8-second decoded frames were inspected, along with the rendered comparison
page and source-size occlusion captures. Browser review exports are intentional
deliverables; raw traces/logs remain outside Git.
