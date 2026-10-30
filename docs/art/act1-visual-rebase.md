> Superseded production direction (2026-10-30): the Classic Visual Reboot request
> pauses campaign migration, full Warrior rerenders and equipment expansion.
> Preserve this evidence; continue only the isolated slice in [classic-visual.md](classic-visual.md).

# Act 1 Variant B visual rebase

2026-10-30. Scoped DBL-035/375/379 continuation. The user personally approved B
for player visibility, openness, graphic style and reduced flicker. This
supersedes the study's pending visual-direction review and its provisional A
preference. It authorizes an opt-in real-campaign candidate, not a default-world
replacement. Warrior Q3-B equipment expansion remains paused. Phaser stays4.2.1.

## Approved reference and measured specification

Reference runtime: `c4f38010814b6ec39d489023f550f122c9b8fd99`.
[Approved B](https://tobisen.github.io/hollowbane/?act1readability=1&view=b).
The comparison measurements and native captures are recorded in
[the study evidence](act1-readability.md). Values below describe that exact
reference; map-specific counts are comparison evidence, not quotas for every
future forest or seed.

| Aspect                  | Approved B baseline                                                                                                                                                                  | Original first outdoor area / implication                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ground projection       | `x=64(x−y)+768`, `y=44(x+y)+512`;128×88 diamond. Pure forward/inverse and canopy tests share `ACT1_PROJECTION`.                                                                      | 128×64 diamond. Equal-axis orthographic interpretation changes elevation30°→43.43253656°; neither is a zoom setting.                                                                       |
| Camera                  | Unit zoom, RESIZE, integer follow center, rounded rendered pixels. Native1280×800/DPR1 reference.                                                                                    | FIT with HUD-dependent effective zoom;0.711015625 in the recorded comparison. Unit zoom must survive integration without covering destinations with HUD.                                   |
| Character               | G1 scale0.93, origin(64,112) in128² frame. Standing alpha≥128 envelope approximately34–52×83–93 displayed pixels.                                                                    | Same raster at recorded old zoom approximately24–37×59–66px. Apparent silhouette size is the acceptance measure; retain source scale and measure new-camera art before adjusting anything. |
| Traversable composition | Four overlapping organic clearings and a loop;1,083 ground cells,4,272 radius-safe half-unit samples, five blocking objects.                                                         | 430 ground cells,1,676 safe samples, eleven blockers; twenty modules connected as a tree. B ground area2.52×, not a uniform coordinate scale-up.                                           |
| Passage width           | Existing tests establish7-unit-wide terrain discs along the loop:17.5 player collision diameters,6.6 units of center clearance.                                                      | One-unit module ports:2.5 diameters,0.6 center clearance. Seven units is a reference target for main routes, not an instruction to widen every space identically.                          |
| Trees                   | 111 boundary placements:48 full crowns,63 permanent low cutaways. Crown width106–128px; full height99.2–118.4px.                                                                     | 102 sampled oaks among137 props. Old oak opaque width roughly375–455px before zoom. Keep grouped vegetation at clearing/route margins.                                                     |
| Occlusion               | Build-time conservative intersection with all ground cells plus56×100px actor envelope; no movement-triggered alpha switch. Foot-y depth ordering.                                   | Old rectangular fades toggle directly between1 and0.32. New production actor envelopes must include weapons, poses and enemies before this heuristic can claim adequate coverage.          |
| Detail / light          | Broad original earth polygons, sparse angular marks clustered at margins, quiet road centers, muted olive/earth palette, static subdued shadows. No animated environmental overlays. | Detailed sampled floor/leaves and one-pixel grass are removed in the study. No numeric detail-density or luminance target has been measured; do not invent one.                            |
| Sampling                | World-anchored opaque ground graphics, no sampled tile seams, antialias/antialiasGL enabled, roundPixels enabled. Actor raster remains unwarped.                                     | Continuous/subpixel camera and scaled sampled environment. Preserve temporal evidence rather than claiming integer placement alone eliminates shimmer.                                     |
| Contact                 | Logical root drives depth and shadow; existing actor shadow32×12px at root+(0,2).                                                                                                    | G1 foot gaps remain inherited. The shadow ellipse is an artistic footprint, not proof of matching 3D perspective or semantic planted feet.                                                 |

Preserve the approved simplicity and original gothic composition. Full foliage
must frame traversable space; suppress obstructing crowns permanently where
needed. Broad low-contrast forms, quiet light and a readable silhouette take
precedence over leaf detail. Existing coarse art is approved as a direction;
the integrated candidate still needs gameplay-scale visual review.

## Projection investigation and bounded original-source proof

The G1 raster has no equivalent rigged source. Its baked viewpoint and foot gap
cannot be corrected honestly with a vertical image stretch. The original
production Warrior movement source is available and hash-verified:
`assets/source/q3/warrior-movement-se/warrior.blend`,
SHA256 `5f6137be21f42035f07ce7a758372b214bee6143044388dd14b7796e2860954e`.
Its manifest and actual camera agree on30° elevation, orthographic scale
2.240000009536743,256px export width, root(128,210), display scale0.5.

`scripts/probe-act1-projection.py` compares30° with asin(44/64), preserving the
original model,135 meshes, rig, materials, lights, motion keys, horizontal
sampling scale, root and clip metadata. One camera translation keeps the root
fixed across every pose; there is no per-frame fitting or saved-source mutation.
The script audits40 movement poses×eight directions at each angle and optionally
renders only idle0/walk4 in SE/W: eight diagnostic stills total. No shipping
assets, equipment art or animation timing changes.

Measured results on Blender4.5.3 LTS:

- Ground-axis slope0.49999991–0.49999995 becomes0.68749982–0.68749995.
  Horizontal projected axes remain approximately80.8122 export pixels per source
  meter. Vertical-axis projection98.97435→82.99249px is expected foreshortening,
  not a scale adjustment. B's environment height multiplier0.8 is an artistic
  obstruction reduction; the physical vertical ratio here is about0.8385.
- All640 pose audits retain root error below0.000069 export pixels and maximum
  ankle/contact error1.34111e-7 source meters. These are geometry/contact audits,
  not640 combat runs or proof of every rendered foot pixel.
- Reviewed the eight stills at128px displayed frame width. More visible head,
  shoulder and foot top surfaces are consistent with the new angle; silhouette
  height naturally decreases. Alpha≥128 standing silhouette heights at display
  scale are104.5px source versus94.5/98px B for SE/W. They are not measurements
  of every class, body-only height or every combat pose.
- The original256² window is **not sufficient** for B. Conservative bounds over
  all320 movement poses change from y17.31485–252.23188 to43.88095–269.26993.
  Fifty-three poses extend beyond the original square; these are conservative
  evaluated mesh boxes, not53 confirmed clipped rasters. B walk-W4 has only7px
  alpha≥128 bottom margin at512² source resolution. Source/diagnostic images
  remain retained; this is not an accepted production export window.

Smallest supported correction: preserve B ground/camera/horizontal scale, rotate
the existing source camera, retain one shared root and enlarge only the common
export window where measured bounds require it. Recheck actual alpha at the
extreme poses before choosing padding. Do not stretch baked images, refit poses,
shorten strides, alter combat timing or rerender all animation families. A
representative playable corrected-angle proof is still required; these stills
alone do not complete Phase2. G1 enemies and unsupported classes remain explicit
viewpoint placeholders until investigated, without authorizing monster overhaul.

Raw reproducible evidence (not committed as test artifacts):
`/private/tmp/hollowbane-act1-rebase-projection/` contains eight stills, comparison
and alpha bounds; `hollowbane-act1-rebase-projection-bounds/projection.json`
contains all pose bounds/contact audits. The initial sandboxed Blender launch
crashed in Metal device discovery; native-access reruns succeeded. No renderer
or source defect is inferred from that launch failure.

```sh
BLENDER --background --python-exit-code 1 --python scripts/probe-act1-projection.py -- /private/tmp/act1-projection
BLENDER --background --python-exit-code 1 --python scripts/probe-act1-projection.py -- /private/tmp/act1-projection-stills --render
```

`BLENDER` denotes the existing4.5.3 executable, currently
`/private/tmp/hollowbane-q3-recovery/blender-mount/Blender.app/Contents/MacOS/Blender`.

## Integration constraints and exact continuation

The campaign saves derived area seeds, versioned layout fingerprints, discovery
cell indexes, actor/drop/container identities and quest evidence. `worldLayout`
pins versions1/2; `WorldSession` and `validateExploration` regenerate and validate
those layouts. Editing version2 generation would invalidate existing saves.
Do not silently swap the study map into a restored character. The existing
character-route whitelist deliberately rejects developer modifiers.

Next, in order:

1. Movement and the SE all-state window/proof below are verified locally. Next
   extend the bounded visual proof to representative non-SE views with correct
   live facing, contact/shadows, weapon alignment and transition review. Measure
   those action-family bounds before assuming the common window contains them.
   Preserve original timing/source art and reuse completed movement audits.
2. Implement an explicitly versioned or separately owned opt-in first-forest
   layout using real `WorldSession`, with isolated storage and creation/load
   paths. Preserve default dispatch, old-version layout fingerprints and owner
   validation. Map named camp/graveyard arrivals, waypoint, encounter/container
   identities and quest destinations deliberately into broad connected spaces.
   Exercise all routes and unchanged real gameplay; never move saved positions
   or drops silently into a different map.
3. Thread the candidate projection through environment, actors, shadows, effects,
   picking, loot, world UI and camera. `onGround`/`fromGround` are shared with
   legacy navigation: do not change their global behavior to activate B. Keep
   simulation entirely independent of renderer/browser/query state.
4. Profile the retained83.3–83.4ms shrine request using actual navigation calls
   and scene timing. Repair only a demonstrated cause. Then capture matched
   native M4/Metal movement, foliage/contact/depth/occlusion and p50/p95/p99/max,
   over25ms and loading results for integrated/default paths.
5. Real campaign acceptance: creation/load, eight directions, combat/AI, NPCs,
   quests, loot, containers, waypoints, transitions, Save & Exit/reload, keyboard
   and virtual controller. Run risk-based broader release coverage, build,
   exact-commit CI/Pages, hosted route and byte-integrity verification. Stop for
   integrated-candidate user review, without enabling it globally.

## Checkpoint

Phase1 is documented; Phase2 has a bounded source-camera proof and a measured
window defect to resolve. Phases3–8 remain incomplete. No candidate campaign
route, new native gameplay benchmark, full Act1 playthrough or new deployment is
claimed. The only runtime edit centralizes the existing projection constants
without changing their arithmetic. Eight focused existing units, strict
TypeScript and scoped lint pass. Source audit/still review is offline; no browser
behavior or shipped asset changed, so no browser release gate is claimed here.
The last verified public runtime remains `c4f38010814b6ec39d489023f550f122c9b8fd99`
with CI41100773664. The scope remains authorized across this safe session-budget
checkpoint; it does not require another design approval to resume.

## Continuation: shared movement export window corrected

2026-10-30, scoped DBL-035/375/379. The user's continuation explicitly authorizes
the padded-window repair and bounded all-state playable proof before campaign
integration. This supersedes the earlier next-action description of an unresolved
movement window; the integrated candidate remains incomplete.

`scripts/act1_export_window.py` derives a deterministic shared rectangle from the
retained640-pose bounds. It preserves the original256² canvas and extends only
edges requiring space. The sampling apron is four export pixels: three for the
Lanczos3 reduction support plus one for runtime linear sampling. At the measured
bottom269.26993, ceil269.26993 +4 gives274. The result is **256×274**, root(128,210),
display scale0.5, supersampling2×, no trimming or rotation. Only18 bottom rows are
added,7.03125% more pixels per cell than the original square; no power-of-two
rounding, arbitrary large padding or per-pose fitting. The helper also handles
negative left/top bounds by moving the canvas origin and metadata root together.

The Blender probe's `--window-from` option verifies retained source/manifest
hashes, applies horizontal camera fitting and one shared camera translation,
and revalidates all640 poses against the retained bounds. Actual outputs are
512×548; orthographic horizontal sampling, source geometry and clip timing stay
fixed. Both angles now have zero poses outside the padded window/filter apron,
including the53 formerly overrun B poses. Maximum root error1.52588e-5 export
pixels; maximum old-versus-padded bounds displacement9.91822e-5 pixels; maximum
contact error1.34111e-7m. This is a necessary corrected-window revalidation, not a
repeat of the original unchanged-angle investigation.

`--render-extremes` selects the union of measured left/right/top/bottom extremes
plus the earlier tight walk-W4 regression. Six unique poses per angle produce
12 renders: idle-SE2, idle-SW2, run-S7, run-W7, run-E7 and walk-W4. Reviewed at
128×137 displayed frame size on light and dark backgrounds, with root guides:
body and sword tips are contained; natural higher-angle foreshortening remains.
These stills do not establish animated continuity, semantic foot/shadow contact,
full directional playback or combat/death acceptance.

`scripts/pack-act1-projection-proof.mjs` verifies each render's hash and exact
dimensions, downsamples without fitting, retains the common root and writes a
bounded diagnostic atlas/metadata outside the repository. It retains the existing
alpha≤4 cleanup convention. All12 filtered frames have at least5 transparent
pixels of alpha>4 edge margin, exceeding the4px apron. All12 encoded-atlas
extractions reproduce their exact RGBA hashes. Atlas1024×822,397515PNG bytes,
3366912 calculated decoded RGBA bytes; this is not measured GPU memory. The
manifest includes roots, rectangular frame coordinates, dimensions, untrimmed
flags, source/image hashes, clip metadata and explicit diagnostic/non-production
status. No shipping image or original source asset changed.

Evidence: four focused Python edge cases pass (minimal bottom extension, negative
extents/root shift, no unnecessary shrink/fit, invalid bounds); strict TypeScript,
scoped ESLint/Prettier and Python syntax pass. Offline asset/tooling changes only;
no browser implementation changed and no new browser, build, CI, native gameplay
performance or hosted acceptance is claimed. Original17 dirty documentation files
are preserved, including staging only this session's STATUS prefix.

Raw evidence: `/private/tmp/hollowbane-act1-padded-window/projection.json`,12 PNGs,
and `/private/tmp/hollowbane-act1-padded-atlas/{proof.json,proof.png,review-dark.png,review-light.png}`.
These are diagnostic/test artifacts and are not committed. Reproduce using the
previous retained audit, without rerendering the character's full animation set:

```sh
BLENDER --background --python-exit-code 1 --python scripts/probe-act1-projection.py -- /private/tmp/act1-padded --window-from /private/tmp/hollowbane-act1-rebase-projection-bounds/projection.json --render-extremes
PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_act1_export_window.py
node scripts/pack-act1-projection-proof.mjs /private/tmp/act1-padded /private/tmp/act1-padded-atlas
```

This movement correction was followed in the same session by the bounded
all-state work below. The movement-only window must not be used for unmeasured
sword sweeps or corpse poses.

## Bounded all-state SE playable proof

`scripts/export-act1-projection-proof.py` reuses the hash-verified movement/attack
blends and original ability/hit/death authoring scripts, observing their poses
without changing source files. Their legacy256/320/448px frame conventions are
normalized to the same original horizontal sampling and root-relative coordinates.
It measures only86 representative SE poses: idle8, walk16, run16, primary12,
Sundering Fan12, hit6 and death16. The retained640 movement bounds are reused,
not re-audited at the old angle. Original authored feet/bone validations run
before the observer; original camera settings are restored after each capture.

Combined bounds require **300×274**, canvas left−40/top0, root(168,210), scale0.5.
The new SE action union reaches x−35.09454 to255.07111; measured bounds plus the
same4px apron determine40 left/four right columns of padding. Height stays274.
All640 retained movement boxes fit after the exact40px canvas translation.
All86 action/movement poses were then revalidated in the common window and
rendered once at600×548. Source models, clips, timing and equipment are unchanged.
Every filtered frame has at least8px transparent margin;86 encoded-atlas RGBA
round trips pass. Nine representative gameplay-scale static poses and the browser
ability/death/menu captures were visually reviewed. No clipped body/sword is
visible in those captures.

New runtime proof assets are only `public/dev/act1-projection-proof/proof.png`
and `proof.json`:2400×3014 atlas,2553986PNG bytes,28934400 calculated RGBA bytes
(not measured GPU residency),86 frames plus two empty atlas cells. Metadata
records the common root, exact frame rectangles, source/image hashes, source
authoring hashes and non-production status. This is original project-source
art, not externally generated/copied imagery. Full existing Warrior families
were not rerendered; other views/equipment remain untouched.

Local opt-in route: `?developer=1&act1Projection=1`. It uses the existing seeded
Warrior arena, actual skill/combat stepping and shared read-only animation
selectors. No new combat timing, balance, save or world authority. It deliberately
displays **SE artwork for all logical facings**, labelled on screen, so this is
an interactive animation-angle inspection rather than a complete directional
character candidate. Input/picking use B projection; keyboard screen vectors use
the existing32/44 adapter; unit-zoom camera rounds its center. The rectangular
training field is disposable proof geometry, not the approved outdoor migration.
Original G1 enemy placeholders retain their known viewpoint/contact defects.

Keyboard/pad semantic actions are consumed once through the shared input hub.
Pointer/UI buttons use their explicit handlers; mouse pulses cannot trigger a
second attack. Shared controller-menu focus stops ticking; local Pause also
stops it. Diagnostic hit/death buttons call the existing real damage resolver.
The route remains behind the existing character-link rejection logic, cannot
bind a character and never instantiates storage. Default campaign and other
classes have no renderer/asset-selection changes.

Verification:15 existing arena/projection units, four Python window edge cases,
strict TypeScript, scoped ESLint/Prettier, Python syntax and production build
pass. Two native-browser scenarios pass9.0s: all eight logical movement
directions, walk/run, actual primary active pose, one ability effect, interrupted
ability without an effect, hit recovery, all16 death poses/one death/terminal
hold, virtual-pad movement, menu pause/resize/resume and rejected character
binding. This is not physical-controller evidence or eight-direction art
acceptance. Browser artifacts: `/private/tmp/hollowbane-act1-proof-browser-input/`
and corresponding JSON. Source/audit evidence is in
`hollowbane-act1-all-state-bounds/`, `hollowbane-act1-all-state-render/` and
`hollowbane-act1-all-state-review.png` under `/private/tmp/`.

Initial failures are retained: the first run exposed simulation continuing under
the shared menu plus a test reading a pre-reset frame. The next run exposed a
real double-consumed R action. Both input defects were repaired within this new
proof; tests now wait for an observed reset generation. Original assertions and
deadlines remain. Earlier failed reports under `hollowbane-act1-proof-browser/`
and `hollowbane-act1-proof-browser-fixed/` are not passing evidence.

One separate local cohort confirmed ANGLE Metal Renderer: Apple M4, macOS15.7.4,
1280×800/DPR1. After120 warmup frames,300 RAF intervals during the live training
encounter with stationary input measured p50/p95/p99/max16.7/16.7/16.8/16.8ms,
zero>25ms and no browser errors. Observed readiness400.7ms includes the readiness
poll and is not a repeated cold-load estimate. Raw frames/device data:
`/private/tmp/hollowbane-act1-proof-native.json`. This is bounded proof smoke,
not a matched walking/campaign comparison, shimmer test or physical display
acceptance. The shrine navigation hitch remains uninvestigated in this increment.

Remaining visual limits: fixed SE view does not face arbitrary live targets;
directional runtime continuity is pending. The corpse currently retains a simple
root ellipse rather than a body-shaped shadow; G1 enemy foot gaps remain visible.
No claim of complete projection, depth/occlusion, animated contact or aesthetic
acceptance across directions/classes. Do not render all remaining Warrior art
or start equipment expansion based on this bounded proof alone.

Session checkpoint: export-window correction and bounded SE playable work are
verified. Finish representative directional/contact/shadow acceptance, then the
isolated real forest migration, actual campaign/quest/save acceptance, shrine
hitch diagnosis, matched M4/Metal shimmer/performance and broader exact-release
gates. No push/CI/Pages or new public candidate in this session. Last verified
deployment remains `c4f38010814b6ec39d489023f550f122c9b8fd99`, CI41100773664.
The approved B link above still points to the earlier environment study.
