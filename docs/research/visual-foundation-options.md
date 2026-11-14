# Visual foundation: realistic options

2026-11-14 · DBL-035/375/379 · decision proposal, not implementation authority

## Recommendation

**Primary: B, an original layered/pre-rendered environment presentation inside
Phaser 4.2.1. Fallback: A, a bounded material/chunk improvement to the existing
renderer if B's production cost or chunk integration fails.** Do not migrate
engines on the present evidence. Escalate to a C feasibility investigation only
if an approved B experiment identifies a reproducible renderer limitation, or
user review establishes that modern dynamic 3D response is essential.

This recommendation addresses the observed field/path/vegetation integration gap.
It does not claim that pre-rendered art automatically looks like Diablo II, or
that Phaser has already proved the target. The exact supplied reference is
Resurrected, with only one decoded interior frame accessible in this audit. Its
outdoor lighting/motion still needs direct evidence. See
[reference limitations](diablo2-visual-forensics.md) and
[ranked actual gaps](hollowbane-visual-gap.md).

## A — Improve the existing Phaser environment renderer

Retain cell/contour construction and existing depth integration. Add a small set
of original grass/soil transitions and root dressing; place connected grove
silhouettes from an authored visual plan; replace broad whole-prop fade tests
where necessary. Establish material/scale rules before adding assets.

- **Visual potential:** credible stylized legacy-inspired outdoors if terrain
  relationships and composition change. Merely substituting higher-resolution
  textures has low expected value given the inspected failures.
- **Art/workflow:** smallest runtime disruption, but substantial artistic effort
  remains. Existing isolated prop packaging cannot supply terrain junctions.
  Need connected edges and a final-size scene review, not an unbounded sprite list.
- **Projection/camera:** already invertible and shared with picking; fixing a
  chosen ratio is easy in code but must agree with actor source cameras.
- **Lighting/integration:** offline ground shadows and contacts are possible;
  a single alpha layer does not provide modern material-dependent lighting.
- **Reuse/maintenance:** strongest reuse of scene code, navigation and existing
  packaged props. Risk: accumulating exceptions to cell tint, canopy omission and
  crop-based ground until the renderer becomes harder to reason about.
- **Performance:** potential to batch static ground; extra sprites/shadows can
  increase overdraw. Existing large tileSprite bounds are not proof of cost-free
  scale. Profile the real draw, not just simulation CPU.
- **Small-team feasibility:** best fallback when limited to existing art tools,
  provided one assembled field is acceptable before production expansion.

**Cheapest disproof:** one original static camera-sized composition in the
existing renderer, using material transition patches and a connected edge. Keep
actor size and exposure fixed. If repeated tile cadence, ground/prop seams or
occlusion rules still prevent a coherent scene, reject a tuning-only A strategy.
A failed art direction alone does not prove Phaser incapable. Estimated effort:
2–4 focused working days with an experienced environment artist, low confidence;
not an approved schedule or promise.

## B — Layered/pre-rendered environment, Phaser retained

Author an original small outdoor composition as a unified offline scene or
painted assembly. Export bounded ground chunks including material transitions,
separate ground-shadow layers and individually anchored vertical/foreground
slices. Runtime actors sort against explicit foot/depth anchors. Collision and
simulation remain pure and independent. **Do not flatten every tree and wall into
one background image:** an actor must pass both behind and in front of volumes.

- **Visual potential:** highest near-term chance of solving coherence, since
  grass, soil, roots, wall footings and key light can be reviewed together. Suitable
  for a fixed camera. Modern dynamic remaster lighting is not automatically gained.
- **Art/workflow:** use the existing original-source Blender capability plus
  paint-over where needed; lock projection, scale, key direction and pixel density
  once. Export manifests with anchors, extents and provenance. Terrain chunks need
  overlap/edge rules, so this is not a new giant painting for every camera position.
- **Asset requirements:** more environment authoring and export metadata than A;
  far fewer camera-facing versions for static scenery than actors. Chunk variants
  and transition coverage become the main production cost for a future large world.
- **Camera/integration:** fixed ground transform; actors, shadows, clicks and
  occluders share it. Prototype reuses only a minimal movement adapter. Actor
  perspective mismatch is an explicit stop condition, not hidden by scaling.
- **Lighting:** unified baked key/occlusion is inexpensive to display. Changes of
  light, weather or destructibility would need authored variants or new rendering
  work; none is required in this one-scene proposal.
- **Code reuse:** preserve domain rules, saves, seeded layouts, encounters,
  controller intent and combat timing; replace the environment view adapter and
  export pipeline, not authoritative simulation.
- **Performance:** fewer larger surfaces can reduce object overhead but increase
  texture residency, bandwidth and transparent overdraw. Use bounded chunks,
  view culling and measured decoded-byte accounting. Texture size limits and
  device memory must be validated; offline bake cost is separate from runtime.
- **Maintenance/small-team feasibility:** strong if a tiny reusable kit produces
  multiple convincing adjacent views. Poor if every path bend requires bespoke
  repainting. Keep an editable source scene and deterministic export contract.

**Cheapest disproof:** the [one-scene experiment](visual-experiment-spec.md), first
as a still, then a short camera-follow walk across a ground-chunk boundary and
behind/in front of one split occluder. Reject B if composition cannot survive
those transitions within its memory/performance envelope, or if the needed
projection forces an unacceptable character re-render cost. Do not build a full
biome to answer that question. Estimated 4–7 focused working days including art,
export and measurement with experienced tooling; low confidence, excluding a
large new actor library. Stop earlier if the still fails.

## C — Another rendering architecture, potentially Godot

Distinguish a new 3D presentation from an engine migration. A locked orthographic
Godot scene could render original terrain/trees/characters with shared lighting
and depth. A separate web 3D view would have similar integration questions.
Moving the current inconsistent art into another 2D canvas would not resolve the
ranked causes by itself.

- **Visual potential:** strongest for changing light, true spatial occlusion and
  continuous character orientations if production uses coherent 3D assets.
  High potential is not evidence of superior final art or a necessary migration.
- **Workflow/assets:** requires original meshes/materials, consistent rigs,
  vegetation rendering and export discipline. Current pre-rendered actor PNGs
  alone do not become animated 3D actors. Some original Blender source assets
  might transfer; validate scene/rig/material compatibility before estimating it.
- **Camera/lighting:** Godot's [Camera3D](https://docs.godotengine.org/en/stable/classes/class_camera3d.html)
  supports orthographic projection. Its [2D lighting documentation](https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html)
  describes lights and explicit occluders; those capabilities are distinct from
  a 3D geometry/shadow workflow. Neither removes the need for art direction.
- **Character integration/reuse:** Phaser rendering and DOM UI adapters would
  need replacement. Deterministic TypeScript domain behavior remains valuable,
  but direct execution inside a Godot application is not assumed. Either a
  supported bridge must be proved or code ported and replay parity maintained.
  Save formats, ownership/CAS and controller behavior require explicit parity.
- **Performance:** 3D geometry, transparent foliage, shadows and browser export
  can cost more than static layers. Establish target hardware and a web-export
  benchmark before arguing for a native advantage. No benchmark performed here.
- **Maintenance/small-team feasibility:** two stacks or a broad port impose the
  highest risk. A locked camera reduces content complexity but does not reduce
  the number of gameplay/save/controller contracts needing protection.

**Cheapest disproof:** import one _existing original_ source prop and actor into
an isolated locked-camera scene, use one terrain patch, and test browser export,
scale/light agreement and domain boundary with a short known deterministic input
trace. No save migration or feature port. Reject C if it cannot outperform B's
visual/integration result enough to justify replacement work. Estimated 3–5 days
for a feasibility spike by someone familiar with that engine, low confidence;
complete migration would be a separate multi-week/month investigation, not a
credible commitment from this audit.

## Decision matrix

All ratings are estimates for this project, not general engine rankings.

| Criterion                              | A existing renderer                     | B layered original environment                | C locked-camera 3D/engine change                 |
| -------------------------------------- | --------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Solves observed terrain/prop coherence | Medium; depends on material kit         | High if authored together                     | High potential; still depends on art             |
| Cost to obtain decisive evidence       | Lowest                                  | Low–medium                                    | Medium, plus large integration unknowns          |
| Original art production burden         | Medium                                  | Medium–high, bounded by chunk reuse           | High, including compatible rigs/materials        |
| Fixed projection control               | Already present                         | Already present, shared offline/export camera | Strong, new adapters required                    |
| Shared baked lighting                  | Additional authoring                    | Natural workflow                              | Available but not the sole benefit               |
| Dynamic 3D lighting                    | Limited without additional architecture | Limited by bake                               | Strongest potential                              |
| Gameplay/save/controller preservation  | Very high                               | Very high through view boundary               | Behavioral reuse high; executable reuse unproved |
| Runtime memory risk                    | Repetition/overdraw                     | Chunk size/residency/overdraw                 | Geometry/textures/shadows/export                 |
| Maintenance risk                       | Exception accumulation                  | Export/anchor/variant discipline              | Highest: stack/port/parity                       |
| Small-team recommendation              | Fallback                                | **Primary, conditional on one-scene pass**    | Only after an evidence-based escalation          |

## Reuse estimate and uncertainty

For **B**, target retention is **all existing authoritative mechanics and save
formats**: combat, AI, skills, loot, inventory, progression, seeded generation and
controller intent. This is an architectural intention, not proof that no adapter
change will be needed. Existing original rig/motion sources, packaging/provenance
checks and browser harnesses are also useful. Current environment rasters,
scattering rules and renderer-specific integration are the least reliable reuse.

A coarse **70–90% of functional system work retained** is a planning estimate
with low confidence, based on preserving the simulation and most platform flows.
It is not a line-count audit, total project value estimate or a promise that
70–90% of existing art meets the new target. No defensible retained-art percentage
can be supplied before the assembled-scene review.

Approve only the bounded experiment next. Keep Phaser4.2.1 and existing game
unchanged until that approval; a successful experiment would authorize a new
review decision, not automatic campaign conversion or mass art production.
