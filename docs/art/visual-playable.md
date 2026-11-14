# Playable visual foundation

2026-11-14 · DBL-035/375/379 · playable visual review; user acceptance pending

The user approved the static composition in `b92c035`. This increment preserves
that exact artwork and adds an isolated Phaser4.2.1 movement/depth review at
`?visualPlayable=1`. No campaign migration, enemies, combat, stats, quests, loot,
new animation production or expanded world. Original normal/Classic routes and
production save ownership remain unchanged.

## Review and comparison

Local: `npm run build`, then `npm run preview -- --host 127.0.0.1` and open
`http://127.0.0.1:4173/hollowbane/?visualPlayable=1`.
**Verified public prototype:**
<https://tobisen.github.io/hollowbane/?visualPlayable=1>.

The default review canvas is at most960×600 inside the browser viewport, always
at one artwork pixel per CSS pixel. WASD/arrows steer; click visible ground for
existing pathfinding. Buttons initiate real walks to path, woodland, ruin, behind
foliage and in front of the foreground trunk. Full composition switches to1280×800
with no camera travel. Hide Warrior also hides its contact shadow. Pause freezes
movement and camera for comparison; Reset returns to the authored spawn. Approved
still opens the exact original image. Small windows scroll the full composition
rather than scaling it. Invalid route modifiers/missing assets fail explicitly.

Comparison A is the unchanged
[approved still](../../experiments/visual-foundation/review/actual-1280x800.png).
Its SHA256 is pinned by a unit test:
`c4c39c505631ad26e5ec400d060bce158d32b56ade80a8e650c64cac0b880589`.
B is the full playable canvas, paused with Warrior hidden; its RGB pixels equal
A **exactly**. A second browser assertion compares a camera-offset960×600 hidden
view to the corresponding original crop, also exactly. These tests cover color,
missing branches, seams and layer registration rather than merely checking that
a background loaded. C/D/E captures show real Warrior/behind/front traversal.

Raw local evidence is under `/private/tmp/hollowbane-playable-visual/`:
`hidden.png`, `visible.png`, `native-{behind,front,ruin,camera}.png`, browser traces,
`native.json`, and `review.html` with the41.48s native movement/camera recording.
`motion-{1.4,1.55,1.7,5,8,11}.png` are timed video inspection frames.
Playwright acceptance captures live under ignored `test-results/`. These are
local evidence, not committed test artifacts; the approved still and source
provenance remain permanent repository artifacts. Release identity is recorded
below only after exact-SHA external verification.

## Layers and preserved versus reconstructed pixels

Available source is a flat1586×992 generated master and its approved1280×800
browser-rendered plate, not an editable3D scene or object/terrain layers. The
runtime uses **the approved plate**, without regeneration, color grading,
resampling, expansion or moving scenery. The original source and prompt remain
in `experiments/visual-foundation/source/`.

The base is that whole opaque image. Eight small transparent overlay textures
reuse its exact RGB pixels inside hand-authored conservative silhouettes:
left trunk, left oak, two west/corner ruin slices, east ruin, foreground foliage,
foreground trunk/root and a ruin rock. Their source-image origins and ground
anchors are explicit in `src/world/visual-foundation.ts`. Runtime Canvas2D clips
only an alpha matte; a binary matte copies original RGB rather than introducing
premultiplication color changes. The pieces then share stable foot-y ordering
with the Warrior. Thus the character can be behind foliage/stone or in front of
the same registered pixels without moving or changing those features.

**Reconstructed/inpainted artwork: zero.** The full base retains all original
objects and shadows. This technique does not reveal or fabricate hidden ground;
no object is removable/movable and no claim is made that its unseen side exists.
Matte boundaries are deliberately conservative interior contours, not perfect
branch/leaf segmentation. Small holes between leaves and precise sloping-wall
depth are approximate. The safe walk region excludes unsupported outer/hidden
ground. A later broader scene would require new independently authored layers,
not pretending this plate is a general3D world.

An early comparison showed a clipped right edge from the inherited menu-width
constraint; the isolated layout now removes that constraint. Edge alpha initially
introduced3461 changed RGB channels with maximum1/255 difference; exact-RGB binary
mattes remove it. Final A/B is zero different channels. No accepted tolerances were
increased to hide either problem.

## Geometry, character and motion

Visible ground defines the navigation polygon,8px ground-plane clearance and
ellipse obstacles for trunk/root footings, overlapping wall-footing segments and
rocks. The canopy's full visual footprint is not collision. Shared
`navigation.ts` owns containment, swept collision, route planning and sliding.
The actual actor uses unchanged `createWalker`, `retarget`, `moveTick` at60Hz:
walk3 world units/s, existing acceleration/deceleration180/240, no combat actor
or alternate movement engine. The spawn is image(620,495). The existing128×64
projection and inverse map to image pixels with the existing(768,512) datum.
This is a chosen2:1 movement metric, not proof of calibrated generated geometry.

The real production Warrior's existing eight directional movement atlases are
loaded, with idle8/walk16 poses per direction and no new frames. Source cells
256×264/root(128,210), fixed display scale0.5 and source camera elevation30°
provide the scale rule. Head-to-ground-root is about94.5–95.5px in the inspected
idle directions; full alpha bounds including weapon range96.5–106.5px. Run poses
exist in the reused atlases but are not used in this scoped walk prototype.
Walk phase follows actual traveled distance and the original authored world
stride1.0417198071343716. Idle starts at its first pose after stopping. Direction
selection follows actual accepted movement, including sliding, without mirroring.

A neutral dimming tint `#c8c8bf` is confined to this prototype's actor to subdue its
bright original materials; it does not change source atlases. A34×12 low-opacity
contact ellipse sits at root+(4,2), below the body and depth-sorted against props.
The source is still more cleanly rendered than the painterly scenery. No full
re-render, body reshape, arbitrary per-view scale or lighting-library change.
Silhouette, foot contact and animation start/stop transitions still need human
review; no universal planted-foot error bound is claimed from a video inspection.

Camera uses the existing exponential follow helper, then clamps and rounds its
scroll to authored1280×800 coverage. Zoom is always1. No repeating background,
stretching, parallax or invented map area. Pause freezes the follow state too.
Integer sampling prevents subpixel plate resampling; exact offset-crop acceptance
checks that all overlay slices move with the base. Motion and clamp transitions
were inspected; this is bounded evidence, not universal shimmer certification.

The initial browser wall check incorrectly expected a fixed y stop. Recorded
input showed legitimate shared sliding: a90-tick upward hold from(908,291)
deflects right along the west wall toward(1028,212). The corrected assertion
requires navigability, rightward deflection and clearance below that sloped
footing; it does not disable collision or weaken the source-image comparison.
The initial failure is not counted as a passing run. Its transient Playwright
archive was replaced by later runs; `collision-diagnostic.json` retains the
observed tick/position trace and original failed assertion, not that archive.

## Verification and performance

- Nine focused unit contracts pass, including the pinned approved image, all
  review paths using real movement, every obstacle center, eight directions,
  frame/anchor rules, camera bounds and stable depth anchors.
- Five Chromium acceptance cases pass: exact full/camera-crop RGB, movement and
  anchors, actual behind/front pixel ordering and wall sliding, strict error
  routes, actual normal-character/raw-registry/checkpoint isolation and normal
  campaign startup. The strengthened raw-record case passes separately.
- Four additional Firefox/WebKit cases pass: exact full RGB and eight-direction/
  camera-crop contracts on each engine. These are local compatibility samples.
- TypeScript, full lint and production build pass. No existing mandatory release
  coverage or timeouts were reduced. The normal/Classic suites remain required
  through exact-commit CI; local focused cases are not a substitute for that gate.

[Native measurements](visual-playable-performance.json): installed Chrome157,
Apple M4/ANGLE Metal, DPR1, local production build,960×600 canvas in1280×800 CSS
viewport. After one traversal warm-up, three540-RAF-interval moving-camera samples:

| Repetition |    p50 |    p95 |    p99 |    Max | >25ms |
| ---------- | -----: | -----: | -----: | -----: | ----: |
| 1          | 16.7ms | 16.7ms | 16.8ms | 16.8ms |     0 |
| 2          | 16.7ms | 16.8ms | 16.8ms | 16.8ms |     0 |
| 3          | 16.7ms | 16.8ms | 16.8ms | 16.8ms |     0 |

All camera observations were integer and within bounds. These are RAF intervals,
not GPU completion timestamps. Software browser tests overlapped part of the
native observation; no claim of an isolated or controlled baseline comparison.
Native full-composition occlusion stills were additionally captured.

17 textures: approved plate, eight reused movement atlases and eight generated
small matte slices. PNG transfer9,826,668bytes; calculated decoded RGBA91,259,816
bytes (about87.03MiB), including slices. These numbers are **not measured GPU
residency** and exclude browser/driver overhead and transient source-pixel buffers.
Only1,888,475 encoded bytes are new environment payload; existing actor PNGs are
reused through their approved production URLs. No duplicate background PNG added.

Three fresh-context local loads report scene asset readiness238.0–256.0ms and
navigation/readiness observation392.1–592.3ms. HTTP-cache-cold contexts, warm OS/
GPU conditions; no network/OS/GPU cold-start claim. Each observed PNG transfer
matches the expected sum. No page errors in native run. Physical-controller
verification is outside this prototype and remains unclaimed.

## Release checkpoint

Verified deployed **`aefe578fa26e675e74e25051ce29ed22ca8356c8`**.
[CI43637850526](https://github.com/tobisen/hollowbane/actions/runs/43637850526)
passes static/Fast2,727 units/validators, all351 Chromium cases
(98+91+91+71, zero failed/skipped/flaky),15 required compatibility cases,
verify, Pages deployment7793767040, hosted2 and final release acceptance.
The final91-case shard took23.6 minutes of browser execution; it passed without
retries or assertion/deadline changes. All196 sealed artifact files equal the
locally tested native build, and all196 public files independently match the
sealed artifact byte for byte.

Five additional hosted prototype cases pass in35.0s with zero failures/skips/
flaky results: exact full/camera pixels, eight directions, actual behind/front
occlusion and wall sliding, strict errors and raw normal-character isolation/
normal startup. A separate native hosted Chrome/M4/Metal check confirms real
behind-foliage traversal and zero hidden-Warrior RGB differences. Classic Visual,
bare Classic Act1 selection and normal selection also open correctly, with zero
page errors. Hosted screenshots were inspected. This does not claim a hosted
quest/combat replay beyond the existing CI contracts.

Raw final evidence: `ci-final.json`, `ci-browser-summary.json`, the sealed
`release-bundle/`, `build-identity.json`, `public-integrity.log`,
`hosted-browser.json`, `hosted-native.json`, `pages-status.json` and screenshots
in the temporary evidence directory above. Final documentation checkpoint stays
local; public runtime remains the exact SHA above. Production saves and all17
prior unrelated edits are preserved. Native/other hardware follow-ups remain
scoped as described; no physical-controller acceptance is claimed.

**STOP for human playable visual approval.** Static-art approval does not imply
approval of the Warrior, conservative mattes, physical presence or moving camera.
No more gameplay, art production, map growth or campaign integration is authorized
by the successful technical release. No automatic continuation.
