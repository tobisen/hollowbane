# Classic visual reboot — environment checkpoint

2026-10-30, scoped DBL-035/375/379. The latest user request supersedes B
campaign migration and mass Warrior projection/equipment work. This is a local,
playable first increment, **not the complete cohesive slice or a visual gate**.
No new publication is claimed. Keep Phaser4.2.1, production and real saves intact.

## Comparison and five changes

Production's128×64 ground, smaller effective actor presentation, dense vegetation,
fine texture contrast and foreground fading compete with its player. These are
measured in `act1-readability.md`; no new production benchmark is implied here.
B's128×88 ground, unit zoom, broad connected clearings and permanent cutaways
improve spatial readability. Its flat polygons and unchanged G1 actor viewpoint
still do not establish a shared painted identity. The requested classic target
uses composition and hierarchy, not detail reduction alone.

1. Replace fine ground marks with broad subdued earth tones and a restrained
   painted texture. Implemented initial texture; screenshot review reduced its
   overlay opacity to0.38. Reflected repetition remains a visible limitation.
2. Frame spaces with grouped, asymmetrical, painted vegetation. Original oak
   pilot replaces geometric full crowns; unsafe crowns are omitted permanently.
   35 full oaks/76 omissions from111 placements. Empty clearing centres and missing
   low boundary growth still need deliberate composition, not random clutter.
3. Share matte olive/grey/charcoal materials and upper-left diffuse lighting.
   Oak and ruined bell monument are first material pilots. Primitive rocks and
   G1 actors remain explicit placeholders; shared character treatment is pending.
4. Preserve a clear, grounded actor silhouette with stable foot depth and shadows.
   Existing83–93px G1 actor and contact ellipse remain provisional; foot gaps,
   pseudo combat poses and enemy identity are not accepted Warrior/enemy art.
5. Keep the image stable: world-fixed textures, unit zoom, rounded camera, no
   animated foliage, point lighting, opacity transitions or detail shader.
   Movement evidence below is bounded; no general shimmer-fix claim.

## Shared specification and implemented scene

The current **starting** ground projection is x=64(x−y), y=44(x+y), camera unit
zoom/RESIZE/integer centre. Equal-axis orthographic interpretation implies43.43°
elevation. Generated object prompts request43°/45° azimuth; these are approximate
painted views, not measured source cameras. G1 actor viewpoint is still mismatched.
Target actor height90–100px; trees roughly210px, landmark roughly170px. Soft
upper-left light, rough surfaces, softened painted edges, bilinear sampling and
quiet3–12px forms at gameplay scale; no bright foliage outlines. Ground shadows
use two subdued nested ellipses; actor shadows remain the original placeholder.
Use foot-world depth, static canopy clearance including a100px actor envelope,
and no per-frame fitting or opacity switching. Do not accept projection based
on metadata alone: compare bodies, weapons, stones and the landmark together.

`?classicVisual=1` lazily enters an isolated scene after the existing character
owner guard. It uses B's authored four clearings, broad loop/optional north route,
five collision objects and existing melee/flanker brains. Actual movement,
attack, damage and death are unchanged. Woodland edge and bell buttons issue
normal navigation commands. No character storage/session or generator is opened.
B and production source modules remain unchanged apart from the new main route.
The environment scene is separate so later art experiments cannot alter B.

## Original assets and rejection record

Built-in imagegen skill/tool generated three paintings without reference images:
`assets/source/classic-visual/{oak,bell,earth}.png`. Exact prompts, including the
rejected rock requests, are retained in that directory's `prompts.json`.
Two rock generations were rejected for a visible beige halo; neither is loaded
or committed. Their originals remain in the tool's generated_images directory.
No copied game assets, textures, map, names or sound are introduced.

`node scripts/package-classic-environment.mjs` retains the originals, reduces
object paintings into232px content with12px padding in256px cells, and builds a
512px reflected earth texture from one256px reduction. Reflected boundary texels
match; this prevents a seam but does not establish natural-looking repetition.
Runtime textures are in `public/dev/classic-visual`; they are actual scene assets,
not test output. `environment.json` records source/output SHA256 and dimensions.

| Asset       | PNG bytes | Calculated RGBA bytes |
| ----------- | --------: | --------------------: |
| Oak256²     |     75413 |                262144 |
| Bell256²    |     71854 |                262144 |
| Earth512²   |    406964 |               1048576 |
| Added total |    554231 |               1572864 |

Four loaded image textures including the reused511732-byte wanderer atlas;
combined calculated texture payload5.5MiB. This excludes framebuffer/masks/driver
allocations and is **not measured GPU memory**. No new actor atlas was produced.

## Validation and visual review

Nine focused units cover source/output hashes, dimensions, margins, identical
texture edges, budgets, actual navigation/collision and deterministic encounter
replay. Strict TypeScript, scoped lint/format and build pass. Two native Chromium
cases exercise eight directions, camera centre, actual combat/deaths, bell/edge
navigation, reset, no fresh IndexedDB, existing serialized checkpoint equality
and rejection of real-character modifiers. No assertion/balance/save rule changed.

Gameplay-scale start/combat/bell screenshots were inspected. The bell's painted
stone and oak provide a useful material pilot, but the initial ground dominated
the actor and was subsequently subdued. Large empty clearings, repeated texture,
primitive rocks, G1 floating feet and proxy corpses prevent whole-scene acceptance.
No Warrior/enemy pilot, complete vegetation-motion acceptance, full production/B/
classic comparison, physical input or artistic approval is claimed.

Raw browser evidence: `/private/tmp/hollowbane-classic-environment-browser/` and
its sibling JSON. Native comparison driver/report:
`/private/tmp/hollowbane-classic-native.mjs` / `.json`;1280×800/DPR1, actual
AppleM4/Metal device verified. Initial pre-opacity-change180-interval horizontal
movement cohorts: B p50/p95/p99/max16.7/16.8/16.8/16.8ms; classic16.7/16.7/16.8/16.8ms;
zero>25ms/errors. Cold observed readiness330.2/190.5ms, one cohort only, not a
startup improvement claim. Both translated ground patches0/21600 changed channels
over82px scroll. This is ground-only evidence, not actor/foliage shimmer approval.
Final continuous-contour revision: two browser cases pass27.9s; final edge,
start, combat and bell captures reviewed. The staircase boundary is replaced by
three-pass softened contours with reverse-wound solid islands retained. Trees
still repeat conspicuously and low boundary composition remains unfinished.
Rejected staircase captures remain in `/private/tmp/hollowbane-classic-staircase-rejected/`.
Final native180-interval cohorts for both B/classic: p50/p95/p99/max
16.7/16.7/16.8/16.8ms, zero>25/errors; readiness487.5/228.8ms. Both ground patches
0/21600 changed channels over81px scroll. Four named image textures in classic.
Earlier reports retained with `-initial` and `-contrast` suffixes. These revisions
are not repeated cohorts of identical art and do not prove a speed improvement.

## Next executable increment and release boundary

1. Replace primitive rocks with a clean
   original source and compose low boundary masses/paths to resolve empty framing
   and reflected floor repetition. Keep the broad navigable layout.
2. Use the existing original Blender Warrior rig to author a bounded material/
   projection pilot. Compare two opposed views first, then minimum fair directional
   idle/walk/primary/hit/death coverage at unchanged timing. Reuse source motions,
   not fixed-SE art for every facing. Do not rerender the complete library.
3. Adapt two existing enemy roles to the same silhouette, palette, scale, shadow
   and projection conventions. Retain actual existing brains and combat balance.
4. Capture matched production/B/classic static/movement/combat/vegetation/light-dark
   evidence. Validate live contact, wall sliding, facing, hit/death, controller/menu,
   camera and storage. Profile repeat native cohorts and investigate demonstrated
   shimmer/long frames. Reassess asset budget before additional art.
5. Only once coherent: required CI tier, focused commit/push, exact CI/Pages,
   hosted candidate plus original campaign/save protection and deployed byte
   integrity. Record exact SHA and stop for human visual review.

Last verified deployment remains `c4f38010814b6ec39d489023f550f122c9b8fd99`,
CI41100773664. Public B reference:
<https://tobisen.github.io/hollowbane/?act1readability=1&view=b>.
`?classicVisual=1` is local only until the later release step; do not advertise
that public URL as available. All17 unrelated dirty documents are preserved.
