# Smallest decisive visual foundation experiment

2026-11-14 · DBL-035/375/379 · **SPECIFICATION ONLY — NOT IMPLEMENTED**

## Question and decision

Can one original outdoor view, built from layered/pre-rendered environment chunks
inside Phaser4.2.1, produce coherent dark wilderness while the existing Warrior
moves through it? The test must distinguish failures of composition/materials,
projection/actor integration and runtime layering. It is not another miniature
campaign. Implementation requires user approval after this research.

The hypothesis is that connected material transitions and boundary volumes will
improve the desired atmosphere more than another isolated actor or tree upgrade.
One assembled still is the first gate. If it fails, stop before motion or further
asset production. The [gap report](hollowbane-visual-gap.md) identifies the causal
claims this experiment can falsify.

## One original scene

Working description: **an abandoned field edge beside a broken stone enclosure**.
No Diablo names, maps, recognizable buildings, sprites, textures or sounds.

A worn diagonal soil track enters an uneven grass opening, bends around a short
broken wall, and meets a darker group of trees. One foreground trunk/crown edge
partly overlaps the route; another tree mass sits behind the opening. Exposed
roots and soil connect those masses to the field. Loose wall stones and a worn
approach establish why that ground is bare. Leave a quiet travel region around
the actor. Use only one local landmark: the wall, not several competing props.

Bound the scene to about **1.5–2 view widths and 1.5 view heights**, enough to
cross one chunk seam and reveal a second composition while following the actor.
These are proposed limits, not inferred Diablo map dimensions. Compose at
1280×800, plus an 800×600 4:3 comparison crop. No world generator, new terrain
collision rules, exits, quests, enemies, loot, persistence or deployment.

## Required assets and authorship limits

| Asset                                          | Minimum purpose / limit                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One editable original environment source scene | Shared projection/light/material settings; reproducible export manifest.                                                                                                                         |
| Ground chunks                                  | Maximum six 1024×1024-equivalent RGBA sheets initially; grass, worn soil, root transition and wall footing authored together. May crop/pack smaller regions. No full-screen mirrored earth fill. |
| Tree silhouettes                               | Two distinct source silhouettes, reused as a connected rear grove and one split foreground volume; variation from placement, not dozens of new trees.                                            |
| Broken wall/rubble                             | One small original wall segment plus a few adjoining stones; base shadow and terrain transition included.                                                                                        |
| Shadows and depth pieces                       | Ground-cast shadow layer plus at most two foreground/depth slices per tall form; explicit anchors and ground extents.                                                                            |
| Actor                                          | Existing original Warrior only; existing idle and walk clips. Initial single facing for still, existing facing coverage for movement. No new full animation library.                             |
| Diagnostics                                    | Optional debug anchors/collision overlay for inspection; hidden in art-review captures. No player-facing diagnostic panels.                                                                      |

Record source identity, author/tool, license, generation prompts if applicable,
export settings and hashes. Existing generated paintings and Blender sources
have existing provenance; reuse does not imply new acceptance. Do not introduce
third-party art or copy reimplementation code. All new imagery must be original.
If the current Warrior cannot match the chosen ground view, report the mismatch;
a separately approved minimal actor still re-render may be needed before motion.
Do not silently substitute a new character production task.

## Rendering and projection contract

Retain Phaser4.2.1. Use a presentation-only scene and existing deterministic input
and locomotion, with no campaign/save connection. Ground chunks and static ground
shadows remain below actors. Vertical pieces and the actor share a stable ground
anchor/depth convention. Split the foreground tree/wall where a single foot-y
sprite cannot represent passage. Do not solve overlap by excluding every canopy
near walkable ground or fading every large object to a uniform rectangle.

Use `screenX = (worldX-worldY)×s + originX` and
`screenY = (worldX+worldY)×h + originY`, with a documented inverse.
First review a coherent **h/s=0.5** ground variant, corresponding to the reported
legacy floor ratio. Retain the current **h/s=0.6875** as a controlled alternative
only if the actor/source viewpoint cannot support the first variant. Do not
stretch only the ground or squash an existing sprite and call the result a
matched camera. Any offline re-render must use the same projection and fixed root.
These are experiment choices, not claims about every remaster asset camera.

Hold visible head-to-foot body height at **90±5px at1280×800** between Hollowbane
variants. Report weapon/alpha bounding box separately. For legacy reference
comparison, normalize a separate copy by body height H and inspect a 10H-wide
world crop; never use raw source-screen pixels as equal physical size. Report
full viewport, HUD-free crop and scale factor. Keep original aspect ratios.

Start with a locked camera, then direct follow using a single documented sampling
policy. No camera rotation, zoom animation, parallax or smoothing experiments in
the same test. The objective is consistent space and ground contact.

## Minimal movement

Reuse existing walk input, eight logical directions and actual movement distance.
One repeatable route travels across the grass/soil transition, across one chunk
boundary, behind the foreground volume, then in front of the wall. Stop and turn
once. Keep actor speed, collision radius and combat rules unchanged. Use measured
input/tick traces; capture at least two complete walk cycles per relevant facing.
No run animation, attacks, enemies or sound production is required for the first
decision. Four-facing limitations remain visible and documented.

Measure screen displacement relative to a fixed ground marker, cycle distance,
planted-foot drift and root position across the turn. A target **≤3px planted-foot
slip during a visible support interval** and **≤1px root discontinuity** at a
seam/turn are proposed guardrails, not legacy reference measurements. If the
current clip fails them, record that independently and do not retune simulation
to conceal an environment problem.

## Exact comparisons and visual acceptance

Produce original Hollowbane-only comparison captures, keeping copyrighted
reference imagery out of the repository. Link reference source/timestamp instead.
The existing audit's R2 legacy image is the confirmed outdoor still; R1 00:15 is
an interior and must never be used as an outdoor side-by-side proxy. Before
claiming fidelity to the supplied remaster's outdoors, obtain an accessible,
verified outdoor frame or ask the user to identify a legitimately accessible one.
No such frame was confirmed during this research.

| Comparison                                   | Controlled variables / required observation                                                                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current Classic versus proposed layered view | Same body H, same viewport/crop, camera target, actor pose and exposure; report different scene geometry rather than pretending it is a pixel A/B.                           |
| Current normal forest versus layered view    | Show normal render at its actual framing and an additional H-normalized crop. Label diagnostic fixture versus selected character correctly.                                  |
| Legacy R2 versus original proposed view      | Separately opened linked reference; H-normalized 10H-wide crops and 4:3 framing. Compare path/grass junction, tree/body ratio, boundary mass and contact, not copied layout. |
| Full color / grayscale / small thumbnail     | Same original scene at native size, grayscale and quarter-size. Materials remain distinct and one main travel opening remains legible without relying on HUD.                |
| Motion/contact strip                         | Same ground markers and actor, sequential tick-labelled frames through seam, overlap, stop and turn. Record view/facing changes, no hand-selected best frame only.           |

Proposed **visual pass** requires all of the following and explicit human review:

1. At native size and quarter-size, the main opening and path are legible. At
   least three distinct large masses are visible: travel ground, boundary grove
   and wall/foreground form. No full starting view of largely undifferentiated fill.
2. Grass/soil, root/ground and wall/ground junctions show authored irregular
   interlocking edges and accumulated wear/shadow. A hue change or line stroke
   alone does not count as a material transition.
3. Use one near tree of approximately **3–5H visible height** and localized track
   wear around **1.5–3H width**; these are test targets informed by a limited legacy
   still, not requirements for every future tree/path. Record actual sizes.
4. Actor and environment agree on ground axes, key-light direction and edge
   treatment. Human review must reject a pasted-on actor even if anchor math passes.
5. No repeated distinctive tree crown or ground feature dominates adjacent views.
   Review both viewpoints and the moving seam, including obvious mirrored patterns.
6. Foreground overlap produces correct front/behind order and retains enough
   silhouette to locate the actor. No missing canopy creates an empty boundary;
   no persistent whole-object transparency makes the grove look insubstantial.
7. Ground contacts remain attached during motion. Quantitative foot/root findings
   are reported separately from still-image approval; no altered gameplay speed.

These thresholds operationalize a proposed experiment. They are not a scientific
measurement of atmosphere and cannot substitute for the user's visual decision.
A technically correct but disliked scene fails the intended art gate.

## Performance and integrity guardrails

No new performance acceptance is claimed in this specification. Once authorized:

- Match one named native GPU/browser configuration to the existing 1280×800/DPR1
  baseline; separately report software Chromium. Warm up by completing the route,
  then record three repetitions of at least540 RAF intervals each. No artificial
  waiting or false cold-cache claim. Include p50/p95/p99/max, >25ms count and
  simulation/update costs, not just average FPS.
- Proposed native 60Hz target: p95≤18ms, p99≤25ms and no >50ms **steady-route**
  stall; also report relative regression against an unchanged Classic capture on
  the same device. Report startup/decode separately. Historical M4 steady results
  and known shrine hitches in `classic-act1.md` are context, not this test's result.
- Incremental environment textures ≤32MiB calculated RGBA residency, ≤8MiB encoded
  download, no sheet >2048px on either axis initially. Include shadows and padding;
  six1024² RGBA sheets alone are24MiB. Report total actor+environment cost too.
  Calculated pixels are not measured GPU memory; distinguish both if GPU data is
  available. Inspect actual device texture limits and transparent overdraw.
- No persistent storage access in the experiment, no production route changes,
  no simulation RNG consumption for presentation, no wall clock in simulation.
  Add only tests necessary for projection inversion, depth/anchor contract and the
  short browser path. Full game regression belongs to later integration.

Budgets are proposed ceilings chosen to keep a tiny experiment bounded, not
certified browser/device limits. Missing native hardware yields **performance
pending**, not a fabricated native pass. Software-only timing cannot certify it.

## Stop/go and work boundary

**Stage 1 — still:** stop at one assembled original view. If the user rejects
composition/material coherence, stop and revise the visual target before exporting
more assets. Do not continue animation or runtime integration on a rejected still.

**Stage 2 — movement/layering:** after still approval, implement only the specified
walk/seam/overlap route. Incorrect layering, perspective mismatch or failed frame/
memory guardrails blocks a complete pass. Separate an art failure from an engine
failure; only a reproducible architectural limitation supports investigating C.

**GO:** user explicitly accepts the still and motion view, quantitative checks
pass on named hardware, provenance is complete and no simulation/save behavior
changed. This permits a proposal for a reusable environment kit, not automatic
campaign conversion or a new gameplay phase.

**HOLD:** visual pass with missing hardware or missing remaster outdoor evidence
remains conditional. Record the exact missing evidence. Do not call it a full
Diablo II: Resurrected match or a performance pass.

**NO-GO:** failed still → revisit composition/art direction; repeated chunk cost
or seam/occlusion failure → evaluate fallback A; demonstrated unavoidable
rendering limitation or explicit demand for dynamic 3D → request a separate C
feasibility scope. Never migrate because a single painting looks wrong.

Estimated boundary: one scene, one actor, one route, one reviewable evidence set;
checkpoint after each stage. No new monsters, abilities, gameplay, saves, art
library, overnight orchestration, public release or automatic continuation.
**Stop here: research is complete; this experiment is not built.**
