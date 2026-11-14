# Hollowbane: actual visual gap

2026-11-14 · DBL-035/375/379 · human visual approval remains pending

## Conclusion

The largest gap is **environment composition without a shared material and scale
plan**. Normal forest constructs a heavily repeated perimeter around cell-based
terrain. Classic removes visible tile seams but replaces the field with a soft
repeating surface and excludes many boundary canopies. These are different local
fixes with opposite visual failures: crowded repeated walls versus unstructured
empty ground. Neither establishes the field/path/root/structure relationships
visible in the inspected legacy Act 1 stills.

This is the user's reassessment, supported by fresh output inspection; earlier
Classic approvals are history, not current visual acceptance. The reference is
partially accessible and explicitly separated into legacy stills and a remaster
interior frame in [the evidence ledger](diablo2-visual-forensics.md).

## Inspection conditions and limits

Read STATUS's latest checkpoint, `docs/art/classic-foundation.md`,
`docs/art/classic-act1.md`, relevant Classic Visual provenance, and actual source:

- `src/rendering/world-environment.ts`, `src/world/environment-view.ts`:
  normal forest floor and props.
- `src/rendering/classic-environment.ts`, `src/world/act1-view.ts`:
  Classic floor, paths, canopy filtering, shadows and projection.
- `src/rendering/classic-campaign.ts`, `src/rendering/classic-visual.ts`,
  `src/rendering/combat-arena.ts`: integrations, actual camera and actor selection.
- `src/simulation/{act1-readability,classic-act1-layout,locomotion}.ts`,
  `src/world/{isometric,arena-view,depth}.ts`: layout, speeds, framing and sorting.
- `src/rendering/{classic-actor-frame,warrior-pose,warrior-attack-frame}.ts`,
  `scripts/{package-classic-environment.mjs,render-classic-actors.py}`,
  `public/dev/classic-visual/{actors,environment}.json`: authoring and cadence.

Browser: local existing `dist` preview, Chromium headless/SwiftShader,
1280×800 CSS pixels, DPR1, fresh temporary browser contexts. No production save
was opened. Source HEAD was `9436c8555b4876eee9f012a005fa30caa2fdd08a`;
17 pre-existing documentation edits were present. The existing dist is a separately
identified binary snapshot, not a newly built exact-HEAD release. Sampled bundle:
`combat-arena-v0etwkNb.js` SHA256
`a3f76b47982a9fc017e1a6d00b00b919ab596b32bcc845328084fcc96a17b85f`;
`classic-visual-BjuTwhme.js` SHA256
`43fc5d635969022906e48d05710edf7a9f52111aacb80cbbac3071d1a757b4d7`.
Source and output were inspected together; sealed source/binary equivalence was
not re-established. No hosted verification or new performance benchmark claimed.

| Capture                         | Route / what was actually inspected                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal forest start + movement  | `?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42&quality=full`; normal environment renderer, diagnostic fixture without a selected production Warrior. Do not infer selected-Warrior proportions from its small legacy actor.                |
| Normal selected Warrior camp    | Fresh character created through the normal menu, `?world=1&character={new-id}`; waited for `data-warrior-renderer="warrior"`, inspected original production Warrior in Ashen Refuge at effective zoom0.711. Separate camp composition, not a matched forest comparison. |
| Classic Visual start + movement | `?classicVisual=1`; isolated pilot, fixed four-clearing map and Warrior art.                                                                                                                                                                                            |
| Classic Act 1 start + movement  | `?classicAct1=1&class=warrior`; real candidate renderer, isolated anonymous developer checkpoint; not the owner-menu acceptance flow.                                                                                                                                   |

Paired stills and recorded short movement sequences are in
`/private/tmp/hollowbane-visual-forensics/`. The paired start/moving images were
visually reviewed. This is a sampled motion review, not full animation/audio or
physical-controller acceptance. Initial capture attempts failed on an incorrect
input selector and on assuming the world observation had a tick; these were
harness errors. An invalid Classic URL with diagnostic modifiers was correctly
rejected and was replaced by the supported URL. No runtime fix was made.

Durable capture identities (SHA256):

| Image                       | Hash                                                               |
| --------------------------- | ------------------------------------------------------------------ |
| `normal-start.png`          | `ee32f3f3a1c45a45496df1306025d4e46f7c2edd225c32ee7b15fc35bb74f841` |
| `normal-moving.png`         | `db773011ac0712b67d0eb0f3eb1be9141898f0b4fbb220abc9121d04f9e46f16` |
| `classic-visual-start.png`  | `28625346ab6d827f080a87ab659547db517d9929bfc2bf8a6a9ed200a40f769b` |
| `classic-visual-moving.png` | `7fc8de81f732e8d1e940c542f72f11baaeaee4334093a8be51b01e96e8a73096` |
| `classic-act1-start.png`    | `c8cbfab8818f1cdffbc39ab2038e106dca7ad855bc76c88522dea05b4cfa320d` |
| `classic-act1-moving.png`   | `0a113abbd204e87970372fd49f496e1b6c981f126d570145cd8dc5d8f297846b` |

Additional ready-state normal Warrior camp capture SHA256: `3473f9d6d9ae423416deca4f4740368369340aa47f5e5f796121441c54acdbcf`.

Temporary screenshots are not portable repository evidence; the source paths,
route settings, hashes and written observations preserve a reproducible audit.
No copyrighted reference images or test artifacts are committed.

## Concrete source/output findings

**O, high:** normal terrain draws a 128×64 clipped crop of `arena-plate` at each
cell, then applies one of a small set of hash-selected tints. The inspected field
has conspicuous repeated diagonal slabs. Forest prop placement samples solid
cells (`hash % 4`, capped at 140), mostly oaks with nominal widths 420–509px,
plus narrower tree sprites. The large repeated crowns dominate the sampled view.
Actors behind their rectangular envelopes trigger alpha 0.32. Foot-y sorting is
already implemented; its existence alone does not solve composition or fading.

**O, high:** Classic draws continuous smoothed collision contours, strokes four
hardcoded paths at 104px and 64px, and overlays one 512×512 earth image at tile
scale 2.7/alpha 0.24. Packaging constructs that image from four reflected copies
of one resized quadrant. This provides edge continuity, not independent field
variation. The source does not have grass/path/root material adjacency metadata.
In both Classic starting captures most unobscured ground is a soft olive/brown
field; one rock reaches the upper left, no enclosing tree mass is visible near
the actor. Paths are too weak there to organize the view.

**O, high:** Classic boundary placement filters a conservative full canopy envelope
against _all_ ground cells, adding 28px horizontal and 100px actor clearance.
Many potential trees are omitted entirely. Existing foundation evidence reports
26 full canopies from 72 candidates on its measured map; those counts are
historical, not newly measured for every candidate seed. This rule protects
readability by sacrificing some enclosing forms. Low growth is only a selected
replacement. This is a stronger causal explanation for emptiness than a global
shortage of texture resolution.

**O, high:** Classic uses 64/44 projected half-axes: ratio 0.6875, versus normal
64/32 = 0.5. For equal-scale orthographic assumptions those correspond to
43.43° versus 30° elevation. Classic expands projected vertical ground extent by
37.5% at equal half-width. Ground footprint area per unit is `2×64×44 = 5632px²`,
versus 4096px² at 64/32. Projection alone changes on-screen density, travel speed
and how much of a clearing fits in view. It is not a valid isolated art comparison.

**O, high:** Classic actor atlas cells are 184×176 with root (92,119); idle alpha
bounds are only 92–102px high including all visible pixels, varying by facing.
Atlas dimensions are not character height. The screenshot body is approximately
85–95px from head to foot. At zoom1 the 256px oak canvas at scale0.82–1.00 is
210–256px before transparent margins: roughly 2–3 actor heights, with actual
painted extent smaller. R2's near tree is approximately 4–5 body heights. This is
a meaningful local scale gap, not proof that every Diablo tree must be taller.

**O, high:** the actual arena centers directly on the projected player; Classic
rounds that center. Normal also offsets for the lower HUD and uses `arenaView`
scale, while Classic forest uses unit effective zoom. The unrelated exponential
helper in `src/world/camera.ts` is **not** the follow algorithm observed here.
Normal diagnostic panels and Classic's loot/map/skill panels obscure substantial
world space. The lower Classic panel begins around y566 in the 800px capture;
comparing actor height against the whole canvas hides that framing difference.

**O:** one Classic Act 1 rightward-input sample moved from (12,30) to
(13.59099,28.40901), combat tick26→88. Camera world-view x moved −1024→−820 at
zoom1 with unchanged y1960. The ∼204px horizontal ground displacement agrees with
64/44 projection; the actor remains near camera center. This is measured tick
sampling, not a wall-clock latency benchmark. Source default walk/run speeds are
3/5.4 units per second, acceleration/deceleration180/240. At full speed the ideal
Classic horizontal rate is ∼272/489px/s; vertical is ∼187/336px/s. These are
projection-derived bounds before collisions or modifiers, not observed reference
speeds. Directional variation follows projected world speed.

Classic maps eight logical directions onto four views, with one idle pose, eight
walk samples reused for run, eight primary attack, three hit and six death
samples. Motion phase is distance-driven. These are measurable limitations, but
normal Warrior's separate directional/gait libraries must not be described as
having the same four-view limitation. Foot sliding has not been quantitatively
measured in this audit.

## Structured gap analysis

Evidence R1–R6 refers to the [reference ledger](diablo2-visual-forensics.md).
Complexity is a relative estimate: S = bounded tuning; M = new scoped authoring or
adapter; L = coordinated content/pipeline work. Impact is on visual identity,
not on correctness or gameplay importance. Rows are ranked by world priority.

| Category                   | Reference observation / evidence                                                                             | Hollowbane implementation                                                                                               | Specific mismatch                                                                                             | Impact; confidence                                              | Suggested direction; complexity                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Environment composition | O: open field interrupted by tree/edge/track landmarks, R2/R3                                                | Normal: solid-cell scattering; Classic: broad four-ellipse clearings plus canopy exclusion                              | Neither crowding nor emptiness yields authored foreground/middle/ground hierarchy                             | Very high; high for local samples, medium generalization        | Design one camera-sized composition with a connected edge and interrupted opening; L                                |
| 2. Terrain construction    | O: dirt/grass intrude into each other; material patches span several scales, R2/R3                           | Normal: repeated tinted crop; Classic: smoothed fill plus reflected texture and broad strokes                           | Repetition is either visible slab cadence or soft undifferentiated coverage; no material-transition grammar   | Very high; high                                                 | Original terrain chunks with authored grass/soil/root transitions and low-frequency regional variation; L           |
| 3. Tree/vegetation         | O: root/trunk/crown and lower growth connect boundary, R2/R3                                                 | Normal: very large repeated oaks and rectangular fades; Classic: small repeated oak, conservative omissions             | Inconsistent tree/body proportions, weak rooting and missing foreground enclosure                             | Very high; high/medium                                          | Shared scale sheet, grove silhouettes, local ground dressing, depth-split occluders; L                              |
| 4. Palette/materials       | O: dark clustered vegetation, worn soil and small highlight accents, R2/R3                                   | Painted props/soft field versus sharply rendered actor; normal crop reused as ground                                    | Material identity and edge frequency differ across asset families                                             | High; medium                                                    | Review one assembled scene at final pixel size; align exposure, light direction and medium-scale material marks; L  |
| 5. Projection              | R5 reported 2:1 legacy floor; fixed axonometric reading                                                      | Normal128×64; Classic128×88 plus actor render elevation43.43°                                                           | Classic makes ground37.5% taller at equal horizontal scale; candidate atmosphere changed with camera geometry | High; high math, medium target choice                           | Compare coherent whole-scene 2:1 and current ratios with matched body size; never squash only actors; M–L           |
| 6. Architecture            | O: limited stone/edge marks; full building evidence U, R2/R3                                                 | Normal ruins from prop atlas; Classic uses bell/rocks without a complete ruin-edge kit                                  | Landmark is a standalone prop with little surrounding material history                                        | High locally; medium/low reference architecture                 | Test one original broken wall with footing, rubble and worn approach; M                                             |
| 7. Lighting/shadows        | O: cast actor shadows R3; local warm emphasis in remaster interior R1; modern dynamic lighting documented R4 | Classic actor/prop contact blobs, fixed low-layer prop shadows; baked soft actor key; no shared terrain cast-light plan | Contact exists, but shadows do not unify larger masses and ground; remaster light response absent             | High; medium                                                    | Bake shared scene key/occlusion, separate ground shadows and contact; dynamic lighting only if later justified; M–L |
| 8. Camera                  | Reference follow law U; sampled central framing R1–R3                                                        | Direct follow, normal HUD offset/framing scale; Classic rounded center/unit zoom                                        | Different playable crop and zoom undermine comparisons; panels hide composition                               | Medium–high; high on Hollowbane, low reference dynamics         | Match unobstructed world crop and normalized H; lock camera for still gate, then follow test; S–M                   |
| 9. Character scale         | E: legacy body40–45px in ∼370px playfield R2                                                                 | Classic visible body∼85–95px at1280×800; canvas176px is mostly not body                                                 | No consistent human/tree/door/ground-detail scale contract; raw pixels alone overstate difference             | Medium; medium                                                  | Body-height-normalized sheet with tree/door/path ratios, report full canvas and playable crop; M                    |
| 10. Movement               | Reference velocity, directional coverage and cycle timing U                                                  | Deterministic locomotion; Classic four views/static idle/shared walk-run; normal separate Warrior library               | Observable turn steps and limited gait range; relative D2 timing difference unproven                          | Medium after world; high implementation, low reference dynamics | Keep simulation; measure planted-foot drift and turn silhouette in coherent environment before new production; M–L  |
| 11. Combat presentation    | Reference anticipation/duration/audio U; remaster upgraded effects R4                                        | Real windup/active/recovery, strike-bound frame selection, shared Classic ability/ranged poses                          | Body action variety is constrained; no evidence that gameplay timing is root visual cause                     | Secondary; high implementation, low comparative timing          | Later single-attack event-aligned comparison; retain timings, bound effects to silhouettes; M                       |

## Five root causes, ranked

1. **C — layout/composition is derived from walkability rather than a view's visual
   structure.** Ground contours and solid-cell props do not encode foreground
   enclosure, material transitions or landmark approaches. Canopy omission makes
   this worse in Classic. Correctable in Phaser: author visual chunks independently
   of collision with explicit occluders and view checks. Needs a foundational
   environment-authoring change, not necessarily an engine replacement.
2. **A — asset families have no demonstrated assembled-scene material contract.**
   Painted props, soft repeated earth and Blender actors differ in sharpness,
   exposure and spatial frequency. Individual provenance and clean atlas margins
   are useful but cannot establish cohesion. Correctable in Phaser/offline tools:
   one light rig, scale sheet, original terrain/prop junctions and final-size review.
3. **B — the terrain/occlusion representation is too coarse for those relationships.**
   One image/fill or independently tinted cells, whole-tree fading/omission and
   low global shadow layers constrain integration. Correctable in Phaser with
   layered chunks, split foreground volumes and independently registered shadows;
   this is the recommended renderer-boundary replacement, not more prop scatter.
4. **D — projection and scale choices changed together without normalized evidence.**
   128×88 Classic ground, small tree canvases and a different HUD crop alter space
   even with consistent foot anchors. Correctable in Phaser, but a chosen ground
   camera may require re-rendering original actor sources; that cost is real.
5. **E — Classic's motion compression weakens presence.** Four facings, one idle
   and shared gait/action poses reduce orientation and weight cues. Correctable
   while retaining simulation and Phaser; delay broad production until terrain
   and camera pass. Reference timing is still unknown, so no speed retuning now.

Root causes overlap; the ranking is a judgment from the inspected samples, not a
statistical causal attribution. The biggest cause is #1 together with its material
consequences: Hollowbane assembles objects around a navigable map without first
establishing a coherent, camera-scale outdoor scene.

## Next action and preserved work

Seek user approval for the [one-scene experiment](visual-experiment-spec.md).
No prototype, asset generation, gameplay/rendering edits, balancing, save changes,
release or approval-gate transition is performed in this research. Reuse the
simulation and save/controller/combat systems; validate environment identity
before integrating them into a larger world. Hardware, art, performance and
broader issue follow-ups stay open.

## Research verification

Documentation formatting, local Markdown link checks, whitespace checks and
TypeScript checks pass. Eight existing focused projection and Classic
actor-selector tests pass as a check on the measured source contracts; this is not a gameplay milestone regression. The browser work was
read-only observation of existing output, with supported routes and readiness
checks; no browser/UI implementation changed. Full regression/build/deployment
was intentionally not repeated for documentation-only changes. Existing native
performance and controller hardware evidence is neither refreshed nor inferred.
