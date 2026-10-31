# Classic visual completion — actor and scene candidate

2026-10-31, DBL-035/375/379. The isolated `?classicVisual=1` now combines the
painted environment with an original Warrior, Cinder raider and Thorn runner.
Campaign maps, default artwork, saves, balance and Phaser4.2.1 remain unchanged.
Human visual approval is pending. This is a bounded review candidate, not a full
character/monster library or authorization for Q3-B production.

## Art and animation

The original project rig supplies four genuine geometry-rotated diagonal views,
without mirroring. Eight logical movement directions select the nearest available
view. Each actor has one idle, eight walk, eight attack, three hit and six death
poses per view:104 frames each,312 total. Running reuses distance-driven walk
poses at the actual movement cadence. Existing attack timing, active pose5,
hitstun,30-tick death and terminal hold remain authoritative; presentation only
observes copies of simulation state. No new combat or AI behavior.

Shared43.43253656° camera, fixed root and uniform scale replace the old viewpoint
mismatch. Muted steel/red identifies the Warrior; broader brown/pale raider and
narrower olive runner distinguish the two existing roles. Micro-rivets, hair
strands and selected armor detail are removed. Broad stable pigment, roughness0.83
and a warm soft key replace the rejected flat/clay stills. Feet share a soft
contact texture with the environment; corpse shadows approximate the settled
silhouette. Painted props remain more textured than the rendered actors, and
four-facing turns, single idle, sparse floor repetition and simple corpse shadows
remain visible pilot limitations.

Reproduction: Blender4.5.3 LTS executes `scripts/render-classic-actors.py -- OUT`
(with Blender's normal `--background --python-exit-code 1 --python` prefix), then
`node scripts/package-classic-actors.mjs OUT`. Original rig/authoring hashes and
renderer identity are retained in `public/dev/classic-visual/actors.json` and
`docs/assets.json`. All312 selected bounds were audited before rendering. The
measured common360×344/root180,234 window fixes the raised-sword overrun; final
184×176 cells include two packing pixels and have at least six transparent pixels
around actual content.312 PNG-to-atlas RGBA round trips pass. Original sources
are unchanged. Raw render/audit/stills live under `/private/tmp/hollowbane-classic-*`.

## Scene and comparison

The scene retains1083 ground cells, four large clearings, loop/branches and five
existing blockers.72 grouped boundary placements comprise26 full trees and46
permanent canopy omissions; low growth occupies selected safe boundary positions.
Open centres, four quiet paths, coarse rocks and the bell preserve traversal
space. No per-frame foliage fades or animated ground detail.

1280×800/DPR1 screenshots and short videos compare the actual production Warrior
in a fresh isolated forest character fixture, approved B and Classic. B/Classic
share the authored map, start and unit zoom. Production uses its existing map,
zoom, UI and supported40-texture Warrior, so apparent scale and workload differ.
The earlier legacy developer-forest capture is retained separately and is not
substituted for the production Warrior. Actual attacks/hits/enemy deaths, edge
navigation, shrine travel and reset are covered. Start/encounter/corpse/edge/bell
screenshots and timed movement samples were inspected: player visible, role
silhouettes distinct, smaller foot-shadow gap than G1, no obvious flashing in the
sampled motion. This is not human art approval or physical-display acceptance.

A translated120×60 ground patch changes3/21600 RGB channels in Classic over81px,
versus0/21600 in B over82px. This bounded result does not establish all-route
foliage/actor shimmer clearance. The first comparison driver used stale camera
coordinates after reset and timed out; the corrected driver waits for the actual
reset frame without changing gameplay or deadlines. Failed capture retained.
Review files: `/private/tmp/hollowbane-classic-review/`, especially `review.html`,
`capture-v2/` and `production-warrior/`; recordings remain outside the repository.

## Budget and native performance

| Asset set               | PNG bytes | Calculated RGBA bytes |
| ----------------------- | --------: | --------------------: |
| Five environment images |    632934 |               1900544 |
| Warrior104 frames       |   1003011 |              13471744 |
| Raider104 frames        |    975843 |              13471744 |
| Runner104 frames        |    797870 |              13471744 |
| Total file textures     |   3409658 |              42315776 |

The generated contact shadow adds32768RGBA bytes: total42348544bytes/40.39MiB,
nine named textures. This is calculated texture payload, **not measured GPU
memory**. Three actors add2.78MB PNG/38.54MiB RGBA versus the environment-only
checkpoint in exchange for actual distinct locomotion/attack/hit/death coverage.
No full880-frame library; no default-campaign texture increase.

Native Apple M4/ANGLE Metal, Chromium,1280×800/DPR1, three fresh contexts per mode,
30 warm and180 measured RAF intervals per cohort; no video recording during
profiling. B and Classic each540 measured intervals: p50/p95/p99/max
16.7/16.7/16.8/16.8ms, zero>25ms, zero missed/doubled simulation ticks, integer
camera centres, zero errors. Local cold-readiness medians B179.2ms (177.1–193.0),
Classic209.1ms (208.6–209.8). Actual production Warrior also540 intervals at
16.7/16.7/16.8/16.8ms, zero>25/errors; readiness1663.1ms (1544.1–1727.4).
Its narrow corridor blocks the horizontal input after36 of181 sampled positions
per cohort; this mixes walking and held-against-wall frames, unlike the open
Classic/B path. Neither equal-work nor universal startup-speed superiority is
claimed. Raw conditions/positions/timestamps: `profile.json` and
`production-warrior/profile.json` in the review directory. Separate recording
cohorts are excluded from these figures.

## Additional live checks

Additional local release evidence (2026-10-31): real-input361-frame boundary
audit stays walkable at the unchanged actor radius and deflects1.0 world unit
from the requested unobstructed diagonal. Actual Warrior hit poses and both
enemies' six death samples are observed; texture count remains9; player survives
with250HP. Native check passes25.0s. The first additional driver assumed a fixed
kill order after allowing an enemy hit; it was corrected to observe the existing
nearest-target behavior, without changing runtime, deadlines or assertions about
pose coverage. Failed evidence remains in contact-test/.

Separate real-navigation request profile: three repetitions each of edge,
clearing and shrine,34 measured RAF intervals per request. Edge/clearing maxima
16.8ms with zero>25ms. Shrine maxima66.6/50.0/66.6ms, one>25ms each; zero errors.
This retains the known long-route pathfinding hitch and is excluded from the
steady horizontal movement table. No claim that every gameplay frame stays
below25ms. Raw contact.json and click-profile.json in the review directory.

## Validation and release state

Thirteen focused units pass, including all atlas/source identities, pixel borders,
actual strike timing, interrupt/death hold and distance-driven gait selection.
The first pixel audit exceeded5s because it made an assertion for every border
pixel; it now aggregates the same checks once per frame and finishes under1s,
with unchanged timeout and bounds. Three native browser scenarios pass27.97s:
eight directions/four art views, actual encounter/deaths, rounded camera,
edge/shrine/reset, exact save/registry protection and rejected character binding,
virtual-controller focus/pause/resize/resume. Physical controller not tested.
TypeScript, full lint, asset validation, build and changed-file formatting pass.
Repository-wide formatting flags only preserved unrelated edits in STATUS,
menu/experience and quality/early-game; committed STATUS is formatted.

Candidate9f60cc4/CI41148758459 stopped in static checks. A committed STATUS
format audit reproduces one missing blank line at the selectively staged prefix
join; corrected without touching unrelated working changes. Changed committed
files otherwise pass formatting; nine release-tooling contracts also pass. No
threshold, assertion or CI tier changed.

Candidate3489feb/CI41148980813 passed static, all units/validators/tooling,
compatibility and three Chromium shards; shard4 failed two existing A/B study
checks, so Pages remained blocked. One compared patrolling enemies across
unequal ticks; the other sampled a running camera and clicked a head that could
be covered by the other enemy. The repair holds the existing blur pause through
the presentation restart, adds tick equality to the unchanged complete-state
assertion, and keeps the camera/enemies paused until an actual uppermost-head
pointer click resumes play. Both enemy-death assertions and all deadlines remain;
no runtime/simulation change. The first repaired software replay passes both
cases twice (four passes,1.4m); final paused-pointer combat/loop verification also
passes twice59.6s. TypeScript/scoped lint/format pass. Runtime bytes are unchanged.
Raw failures: shard4-annotations.json; local replays: ab-repair* in the review
folder. No failed CI gate was bypassed.

Next: publish the verified browser setup repair, run required exact-commit Full CI, verify
Pages/hosted Classic and campaign protection, independently verify public bytes,
then stop for user visual approval. Last verified public deployment remains
`c4f38010814b6ec39d489023f550f122c9b8fd99`/CI41100773664 until that verification.

---

# Classic visual completion — composition increment

2026-10-31, scoped DBL-035/375/379. Latest completion request authorizes the
remaining scene and public review release, preserving campaign/default artwork.
Painted rocks and low undergrowth now replace primitive rock geometry, matching
the original bell/oak style references. Exact built-in imagegen prompts and source
references: `assets/source/classic-visual/completion-prompts.json`; source PNGs
and runtime PNGs are retained beside the existing environment assets. No external
art references or copied assets. A procedural Blender prop attempt was rejected
as overly faceted: raw/script retained under `/private/tmp/hollowbane-classic-props-v2/`
and `/private/tmp/hollowbane-classic-rejected-source/`, never loaded by the scene.

The original broad clearings/collision remain intact. Grove bands, deterministic
position jitter and restrained uniform scale variation break the old tree rows.
Small low growth replaces some unsafe crowns without covering actor upper bodies.
Four broad worn paths connect existing spaces; floor texture contrast drops from
0.38 to0.24 and its repetition period grows. Repetition and the large empty centre
still need judgment with final actors. A shared128×64 soft contact texture replaces
hard nested ellipse rings on trees/rocks/landmark. G1 actor shadow remains pending.

Added rocks67068PNG bytes/262144RGBA bytes and undergrowth11635/65536: incremental
78703PNG/327680RGBA bytes. Environment total632934PNG/1900544RGBA bytes; generated
shadow adds32768RGBA bytes. Six file image textures including G1 plus one generated
shadow texture. Calculated payload is not GPU memory. Original three asset hashes
are unchanged. Nine focused units, TypeScript/scoped lint/build and two native
browser cases pass24.8s; real movement/combat, edge/bell travel and save protection.
Start/edge/bell captures inspected; source silhouettes are clean, gameplay remains
open. No current performance claim while Blender is running. Browser evidence:
`/private/tmp/hollowbane-classic-composition-browser/` and sibling JSON.

Next increment is the bounded Warrior/two-enemy pilot, then complete scene,
controller/contact/motion comparison and release gates. Six opposed actor stills
were inspected at gameplay scale; the flat-material attempt was rejected as
clay-like. Revised broad pigment, muted steel/red Warrior, broader pale/brown
raider and narrower olive runner are provisional. A312-pose conservative audit
caught a raised-sword top overrun; common360×344/root180,234 now contains all
selected poses. No full library/equipment expansion or default campaign change.
Last verified public SHA remains `c4f38010814b6ec39d489023f550f122c9b8fd99`;
no new CI/Pages/release is claimed by this increment.

---

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
