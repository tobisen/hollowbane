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

1. Measure extreme-pose alpha in a shared expanded camera window; prove a
   bounded corrected-angle playable presentation with original timing. Keep
   current proof pixels diagnostic and retain existing approved source art.
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
