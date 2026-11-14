# Woodland boundary — static visual candidate

2026-11-14 · DBL-035/375/379 · user art-direction review pending

One original outdoor composition: an earth path through uneven grass, a grouped
woodland boundary, and a small ruined stone enclosure. The foreground oak/root
mass, central opening and rear woodland establish three overlapping depth regions.
Grass, soil, root litter, moss and wall footing were generated as one image with
a shared muted olive/umber/gray-brown palette and intended upper-left soft key.

## Inspect at actual gameplay size

From the repository root:

```sh
python3 -m http.server 4182 --bind 127.0.0.1 --directory experiments/visual-foundation
```

Open **http://127.0.0.1:4182/** at browser zoom100%. The environment remains exactly
**1280×800 CSS pixels**; smaller windows scroll rather than silently shrinking it.
An optional90px neutral human silhouette provides a scale reference. It is a
measurement diagram, not character artwork or proof of actor integration.
Stop the server with Ctrl-C. No install, build, game save or network service is
required. Opening [index.html](index.html) directly also loads the relative image.
This is a loopback local preview, not a published review URL.

Permanent review deliverables:

- [Full original environment](source/environment.png) —1586×992 generated master.
- [Gameplay-size environment](review/actual-1280x800.png) —1280×800, no overlays.
- [Neutral scale reference](review/scale-reference-1280x800.png) —same view,90px guide.
- [Terrain transition](review/terrain-transition.png),
  [woodland roots](review/woodland-roots.png),
  [ruin footing](review/ruin-footing.png) —400×280 crops at the same display scale.
- [Exact generation prompt and provenance](source/generation.json).
- [Integrity manifest](manifest.json), including all raster dimensions and SHA256.

These PNGs are intentional visual-review deliverables requested by the user.
Raw browser logs and capture scripts remain in `/private/tmp/hollowbane-visual-poc/`
and are not committed as test artifacts.

## Construction and experiment adjustments

The built-in imagegen tool generated one original raster master without input
images or proprietary reference artwork. The exact prompt is retained in
`source/generation.json`; the original output is copied byte for byte into this
folder. No tile scattering, collision-derived composition, duplicated earth
quadrants, post-generation repainting or separate sprite assembly was used.

The preview displays that master using aspect-preserving `object-fit: cover`.
Its native aspect ratio differs slightly from16:10: at1280px width the image is
800.605px high, so the800px view clips approximately0.303px at top and bottom.
The master is never stretched. Browser captures preserve the1280×800 viewport;
detail crops use the same rendering transform, without magnification.

The research proposes layered/chunked runtime presentation. This increment is
**only its first still-image gate**, as explicitly requested. It therefore uses
a flat original pre-rendered plate and a script-free static HTML viewer, instead
of implementing Phaser adapters, camera motion or depth slices before artistic
approval. The master plus separate optional vector scale overlay are the only
presentation layers; trees, terrain and shadows are **not independently editable
or depth-sortable**. No3D source scene exists. The prompt and retained raster are
the source material. The preview is reproducible; image generation is not claimed
to be deterministic or exactly regenerable.

The intended environmental camera is fixed axonometric, approximately30° elevation
with2:1 ground-axis proportions. A generated bitmap does not establish calibrated
geometry. Wall orientations, tree scale and future character projection require
measurement and possible re-authoring after this visual gate. One still cannot
prove a future ground transform, cutaway/occlusion policy or camera-follow quality.
The original1.5–2-view movement/seam area was reduced to one viewport because this
request explicitly stops at a static visual experiment and prohibits map expansion.

Production campaign assets, rendering, Phaser4.2.1, simulation, routes and saves
are unchanged. This folder is outside Vite's production entrypoints/public tree.
There is no movement, game input, enemy, combat, quest, character animation,
world-generation change or publication.

## Why this targets the observed gaps

| Research finding                  | Specific change in this image                                                                            | What still needs judgment                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Disconnected terrain surfaces     | Grass intrudes into the worn track; compacted soil, leaf litter and root marks connect woodland to field | Whether the ground feels natural rather than uniformly busy                   |
| Collision-boundary prop placement | Connected irregular trunk/crown groups and one foreground overlap frame a traversable-looking opening    | Whether the visible opening and enclosure feel right at gameplay scale        |
| Unrelated materials               | Stone, moss, dry grass and earth share exposure, edge treatment and contact shading                      | Whether the overall value range is too compressed or foliage too repetitive   |
| Inconsistent projection/scale     | One environmental plate, with optional90px scale reference and a modest ruin                             | Bitmap perspective is approximate; actual actor matching is untested          |
| Empty Classic starting field      | A readable path, rooted boundary and wall approach organize the full viewport                            | Whether this has enough visual depth and reads as a finished game environment |

This is an author's assessment of visible changes, **not user artistic acceptance**.
The leaf/grass detail may still be too even in frequency, and foreground foliage
might compete with a future actor. Camera-relative detail stability, foot contact,
independent shadows, layer extraction and reusable chunk production are untested.
Lighting is baked into the image; there are no physically calibrated materials
or dynamic light/shadow behavior.

## Reference comparison, with evidence limits

The [research ledger](../../docs/research/diablo2-visual-forensics.md) identifies
the inspected legacy outdoor sources. The [Tradia legacy Blood Moor still](https://tradia.me/diablo2/quest/4703882)
shows irregular worn soil/grass and tree-root integration; the new scene applies
those general relationships to an original layout. It does not reuse its imagery,
structure, objects or texture samples. No reference image was supplied to imagegen.
The earlier field diagnosis is in
[Hollowbane's gap report](../../docs/research/hollowbane-visual-gap.md).

At1280×800 this image replaces Classic's soft largely uninterrupted starting
field with a path and connected material boundaries. Compared with the normal
forest's repeated large crowns/cell ground, tree silhouettes and ruin placement
are composed in the image rather than chosen from solid cells. Those scenes have
different layouts; this is a visual-direction comparison, not a pixel A/B or a
performance comparison. There is no new selected-Warrior comparison here.

The supplied Resurrected video was only partially accessible during research;
its00:15 decoded frame is an interior. It does not support an outdoor fidelity
claim. No claim is made that this image matches Diablo II or its remaster to an
accepted quality level. No proprietary imagery is embedded in the preview.

## Verification and next decision

Chromium at DPR1 verifies image decode, exact1280×800 stage,90px guide,400×280
detail views, small-window scrolling and no page errors, failed responses,
external requests, cookies, IndexedDB databases or local/session storage writes.
Exported PNG headers/dimensions, file hashes and decoded RGBA estimates are
checked against `manifest.json`. Artwork, scale guide and all detail captures
were visually inspected. No unrelated gameplay regression/build/release is run.

Static image decode size is accounting only, **not measured GPU residency**.
No movement or native rendering performance result is claimed. Proposed motion/
frame-time guardrails in the research remain untested because they are outside
this authorization.

**STOP for the user's visual review.** Review the actual-size plate first:
cohesion, natural ground, composed vegetation, rooted structure, atmosphere and
depth. No movement, layers extraction, additional scene or gameplay integration
is authorized by a technically successful preview. Acceptance remains false.
