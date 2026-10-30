# Act 1 outdoor readability decision

2026-10-30. Original scoped DBL-035/375/379 environment follow-up. This is an
isolated presentation/layout experiment, not approval to migrate the campaign.
Warrior equipment work remains paused; Phaser stays at 4.2.1.

## Assessment before implementation

The supplied written reference observations are the design specification. No
supplied reference screenshot was found in the relevant project asset files.
The shared principles to retain are broad ground, clear silhouettes, perimeter
objects and restrained texture contrast; no reference asset or map is copied.

Source inspection and a deterministic seed-42 measurement found:

| Dimension       | Existing first outdoor area                                                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection      | `world/isometric.ts`: x = 64(x − y), y = 32(x + y), 128×64 diamonds. Under an equal-axis orthographic interpretation this implies 30° elevation; this is an inference, not a stored 3D camera.                                                                                                           |
| Camera          | `combat-arena.ts` uses FIT, HUD-dependent zoom, continuous camera coordinates and `roundPixels:false`. Previous matched 1280×800 evidence recorded 0.711015625 effective zoom; viewport/HUD/settings can change it.                                                                                      |
| Player          | G1 standing frames have alpha≥128 bounds 37–56×89–100 source pixels. Scale 0.93 gives approximately 34–52×83–93 pixels at unit zoom, or 24–37×59–66 at 0.711. This measures the reused prototype actor, not the separately supported production Warrior.                                                 |
| Playable ground | Twenty 7×7 modules form a 35×28 map. Seed42 has 430/980 ground cells (43.88%) and 11 blocking objects. The common clearing is only 5×5 world units.                                                                                                                                                      |
| Connections     | Nineteen spanning-tree links; each module port is one unit wide. Player collision diameter is 0.4: 2.5 body widths across, with only 0.6 units of center travel. The module graph has no optional loop.                                                                                                  |
| Forest scenery  | Seed42 has 137 props: 102 oaks, 24 dead trees, eight ruins and three rocks. Oaks have 420–509-pixel square display canvases; their actual opaque source bounds occupy 915×500/1024², approximately 375–455×205–249 pixels before zoom.                                                                   |
| Fade coverage   | Of 1,676 radius-safe half-unit lattice samples, 1,571 (93.74%) lie inside at least one full prop fade rectangle; maximum overlap is 12. This is coverage of the existing rectangular heuristic, **not measured opaque-pixel occlusion or time hidden**. Transparent canvas margins make it conservative. |
| Contrast        | Source opaque-pixel encoded weighted luma averages 49.8/255 for the oak and 51.7–60.6 for G1 standing directions. The palettes overlap; this is not a gameplay luminance/contrast ratio or a measure of every combat pose.                                                                               |

Measurements came from the current generator, `environmentProps`, `areaWalkable`
with radius0.2, `isOccluding`, and alpha bounds of the existing WebP files.
The temporary reproduction script is `/private/tmp/hollowbane-outdoor-measure.mjs`.
Source provenance is already recorded in [W3 art](w3.md) and [G1 prompts](prompts.md).

The strongest demonstrated composition problem is the combination of narrow
module connectors, frequent turns and very broad foreground canopies. A dark
small actor competes with similarly colored detailed leaves. Solid-cell trunk
placement does not constrain the screen-space crown. The fade implementation
sets alpha directly to 0.32 or 1 every frame, with no transition or hysteresis.

The current oak has dense individual leaves, thin hanging branches and many
small highlights. Floors repeat a detailed 128×64 sampled patch; rooted grass
adds one-pixel strokes. These, fractional camera placement and scaling are
credible scrolling-aliasing causes. Static artwork and stable foot-depth ties
do not establish temporal flicker by themselves. Native moving comparisons must
separate sampling shimmer, threshold alpha changes and animation/contact defects.

## Decision and alternatives

Build `?act1readability=1` using the existing deterministic movement/combat and a
separate handcrafted 54×48 map. Four overlapping organic spaces have ellipse
radii10×8,11×9,10×8 and8×8, with centers(12,30),(29,29),(23,11),(42,14).
Broad connectors target at least seven world units:17.5 collision diameters,
with6.6 units of actor-center clearance before any deliberate boundary shape.
The connected loop and optional route replace the module-tree traversal rhythm.
Actual collision-safe widths and area counts are acceptance measurements, not
inferred solely from these design dimensions.

The authored candidate contains1,083 ground cells versus430 (2.52× absolute
ground area), five blocking objects versus11, and4,272 radius-safe half-unit
lattice samples versus1,676 (2.55×). Its rectangular envelope is also larger,
so its ground-cell percentage is41.78%; percentage alone would misdescribe the
improvement. The connector test samples full3.5-unit-radius discs at half-unit
intervals along the loop, separately from the player0.2-unit clearance test.

Use original code-drawn earth masses, restrained grass bands, boundary tree
groups, low rocks/fences and one landmark. Remove sampled floor detail, tiny
grass strokes and animated environmental overlays in this isolated mode.
Prioritize keeping crowns out of the route; foreground suppression must be
based on actual visual intersection, remain stable during movement and cover
combat actors where needed. Avoid solving a composed obstruction with a bright
modern character outline.

| Comparison                        | A                            | B                               |
| --------------------------------- | ---------------------------- | ------------------------------- |
| Ground transform                  | Half-width64, half-height32  | Half-width64, half-height44     |
| Ratio / inferred elevation        | 0.5 / 30°                    | 0.6875 / approximately43.43°    |
| Camera / actor                    | Unit zoom, same0.93 G1 scale | Identical zoom/actor scale      |
| Vertical environment height       | Baseline new low silhouettes | 80% of A                        |
| Full1280×800 viewport ground area | 250 world units²             | Approximately181.8 world units² |

B genuinely changes ground projection and lowers obstructions. It does **not**
change zoom to impersonate another angle. Higher ground slope at fixed
horizontal scale reduces the numerical world area visible; map openness and
removing canopies expose more usable ground, which is a different benefit.
Unit zoom makes this actor about41% larger than the cited campaign framing and
reduces full-viewport area from approximately494.5 to250 units² in A. These
figures ignore HUD coverage and therefore are not usable-screen area claims.

The existing character and enemy rasters remain unwarped placeholders with
their original baked viewpoint. B is a bounded environment projection pilot,
not a coherent full sprite-angle migration. Approval of B would require
rerendering character/enemy/prop families at the chosen elevation and checking
contact/occlusion throughout animation. Zoom changes require no rerender;
changing painted perspective does. Presentation input/picking must invert the
selected projection without altering the shared simulation or saved geometry.

Retain the slice's resize/unit-zoom/integer-camera approach. Reject engine
migration: no demonstrated Phaser limitation requires it. Reject only darkening
or blurring the old art, enlarging the whole campaign, uniform obstacle removal,
and a full raster-production pass before this composition earns human approval.
The cost is deliberately simpler provisional art, possible camera pixel steps,
and the explicit B sprite-angle mismatch.

## Acceptance and provenance limits

All new environment geometry/palette/landmarks are original TypeScript artwork;
no new raster asset, external franchise art or protected map is needed. G1
`wanderer.webp` is reused and remains a placeholder with inherited provenance.
Gameplay-scale initial captures retain its known run-frame foot/contact-shadow
separation: a stable world root does not fix a baked animation contact error.
The broad vector forms remain provisional art; improved actor visibility does
not establish painted-material quality or the requested classic atmosphere.
No save schema, generator, combat balance or production equipment asset changes
are part of this decision.

Required evidence is real traversal/combat, eight directions, collision/sliding,
controller paths, visible contact and depth, campaign/dungeon/save isolation,
gameplay-scale screenshots and moving A/B captures. Native matched measurements
must report cold readiness, timing percentiles/max/over25ms, camera movement and
world-aligned temporal pixels. Texture byte estimates are not GPU residency.
Browser/virtual input does not establish physical controller/display quality.
Technical release checks do not establish the user's artistic approval.

## Implemented candidate and bounded acceptance

The study lazily loads after the existing character-link validation. No saved
world generator, campaign renderer, schema or owner binding changes. The original
campaign and `?d2slice=1` remain separate. A/B switches preserve the actual owned
encounter and position while reconstructing only its renderer. Reset creates a
fresh unsaved seed42 encounter. Two existing melee/flanker profiles use unchanged
AI, targeting, damage, movement, collision and death rules; no new balancing.

111 boundary placements produce38 full crowns/73 permanent cutaways in A and
48/63 in B. New crowns are106–128 pixels wide. Their conservative projection test
includes a100px-high,56px-wide actor envelope over every ground cell. Cutaway
foliage is permanently low; there is no opacity threshold to oscillate during
movement. This is geometric classification, not a measured percentage of time
that every animated pixel remains unobscured. Rocks and the shrine retain normal
foot-depth ordering and real collision.

Original broad earth regions, asymmetric coarse soil marks, quiet road centers,
forest masses and a broken shrine replace sampled microdetail. First captures
were rejected internally as too flat; the next material pass was too uniformly
spotted. Final reduced angular marks cluster near margins. All three stages are
retained under `/private/tmp/act1-first-a.png`, `/private/tmp/act1-material-a.png`
and `/private/tmp/act1-final-a.png`. This is provisional vector art, not a painted
production biome. Near boundaries, permanent cutaways can read as felled trees. Geometric crowns,
slab-like rocks and sparse olive ground still read as a composition blockout;
gritty gothic material and structural identity remain unapproved visual criteria.

G1 player/enemy sprites remain placeholders. Some walking/running phases visibly
lift the feet above the fixed ground shadow; this inherited animation/contact
limitation is not fixed by the new environment. Combat uses the existing motion
cues and a restrained enemy tint. The new pointer target covers the full unit-zoom
silhouette; the previous shared training region missed the top20–25px. The browser
regression attacks a real enemy through its head before traversing the loop.

The final build passes strict TypeScript, full ESLint and eight focused units in
two files. Six new browser cases cover both projections/eight directions,
reset/blur/resize, real ground clicks around the full loop, head-click combat,
northern/shrine routes, virtual-controller movement/menu/primary, and byte-exact
serialized character/registry preservation through both variants and rejected
owner links. Two existing browser cases protect dungeon movement/reset/resize
and generated-forest arrival/mouse-return. Real user profiles were never opened.

The initial save test stopped before assertions because the plain local preview
lacked the expected release manifest; the sealed-build rerun passed unchanged.
Original setup failure is retained. Three route cases now explicitly establish
Running before issuing mouse input, avoiding a synthetic zero-duration R tap
followed by an immediate input-device change. No deadline/assertion was weakened.
Local precommit manifest uses all-zero SHA to identify an uncommitted build;
this is not a publication identity. Browser evidence lives in
`/private/tmp/hollowbane-act1-final-browser/`. No raw artifacts are committed.

The study loads one existing1024² RGBA sprite sheet:511732 compressed WebP bytes,
4MiB calculated decoded pixels. Environment graphics create no new bitmap asset.
These are asset counts/estimates, **not measured GPU residency**. Production
Warrior assets and unfinished equipment work are untouched.

Initial visual preference is A: wider overview and more surrounding orientation
cues at the same zoom. B exposes depth between ground rows but crops nearby
boundaries and keeps a knowingly mismatched baked actor viewpoint. Neither choice
establishes the user's atmosphere/gameplay-feel approval.

The retained developer forest screenshot also exposes large diagnostic/skill
panels; its bottom panel covers roughly27% of viewport height. The study uses a
smaller interface as well as larger player presentation. This comparison is of
the actual playable presentations, not a canopy-only controlled experiment or an
equal-HUD workload. Original saved-Warrior presentation is separately preserved.

Review routes (publication must be verified below before claiming these serve the candidate):

- [A: classic ground](https://tobisen.github.io/hollowbane/?act1readability=1&view=a)
- [B: raised ground](https://tobisen.github.io/hollowbane/?act1readability=1&view=b)
- [Existing first outdoor area](https://tobisen.github.io/hollowbane/?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42&quality=full)
- [Existing dungeon study](https://tobisen.github.io/hollowbane/?d2slice=1)

## Initial candidate native local evidence

Before the later shared navigation repair below: Chromium156.0.8078.4, Apple
M4/ANGLE Metal,1280×800/DPR1. Three fresh/cache-disabled
contexts per presentation,120 warmup ticks plus two36-tick input legs, then ten
alternating36-tick horizontal legs. No screenshot/video or other local browser
suite ran during these timing cohorts. All12 cohorts returned exactly to their
starting position; each mode has1,077 measured intervals, zero browser errors,
zero zero/multiple-tick intervals and zero frames above25ms.

| Presentation   | Uncached readiness range / median (ms) | RAF p50 / p95 / p99 / max (ms) |
| -------------- | -------------------------------------- | ------------------------------ |
| Outdoor A      | 138.8–221.7 /139.5                     | 16.7 /16.8 /16.8 /16.8         |
| Outdoor B      | 121.3–138.5 /121.4                     | 16.7 /16.7 /16.8 /16.8         |
| Dungeon study  | 121.6–122.0 /121.8                     | 16.7 /16.7 /16.8 /16.8         |
| Current forest | 471.4–488.3 /487.9                     | 16.7 /16.8 /16.8 /16.8         |

A has a17.7ms higher median startup than the simpler dungeon here. Observed encoded
resource bodies are938440 bytes for A/B versus909338 for the dungeon (+29102,
3.2%) and4758526 for the forest; the document is excluded. A/B load more simulation
code for actual combat. Camera steps in A/B and the dungeon alternate4/5 pixels;
the original forest moves3.217689 CSS pixels per measured moving frame at its
0.711015625 zoom. Integer sampling avoids fractional texture scroll but is not
smoother subpixel motion. These are short60Hz observations on one native host,
not universal FPS, cold OS launch or equal-work GPU comparisons. B's0.1ms p95
rounding difference is not a demonstrated speed advantage.

Raw timing: `/private/tmp/hollowbane-act1-local-performance/matched-performance.json`.
The separately instrumented capture run records actual movement, boundary trees,
combat and shrine in both variants, plus existing dungeon/forest presentations;
25fps video and screenshots cannot establish physical60Hz display acceptance.
Raw PNG/WebM/state records: `/private/tmp/hollowbane-act1-local-visual/`.

World-aligned pixel comparisons cover a180×80 ground-material patch and a95×80
rock/shadow patch per variant. Both are unchanged during30 stationary frames and
a136px horizontal camera translation: ground0/43200 changed channels and
rock/shadow0/22800, mean absolute difference0. Screen-fixed DOM captions are hidden
only during diagnostic capture. The initial B rock sample overlapped the title
and reported7687 changed channels; that rejected UI-contaminated measurement is
retained at `/private/tmp/hollowbane-act1-local-pixels/`. Correct world-only
captures are `/private/tmp/hollowbane-act1-local-pixels-world/`. This does not
measure every foliage edge, actor animation, route, scroll direction or display.
No claim that every source of shimmer has been eliminated.

Reproduce against a sealed preview or verified deployment:

```sh
node scripts/act1-readability-profile.mjs /private/tmp/act1-performance http://127.0.0.1:4175/hollowbane/
node scripts/act1-readability-profile.mjs /private/tmp/act1-visual http://127.0.0.1:4175/hollowbane/ --capture
node scripts/act1-readability-pixels.mjs /private/tmp/act1-pixels http://127.0.0.1:4175/hollowbane/
```

## Publication checkpoint

Local candidate is coherent and verified. Exact-commit required CI/Pages, hosted
browser checks and byte-for-byte asset verification are pending; no new public
release is claimed here. Last independently verified deployed SHA remains
`fd11b936988088a8a6d4d0296906f3bf2ecbb4d3`. The stored gh token is invalid; SSH
remote access and public HTTP are available. Import dry-run made no requests;
no issue or milestone import was needed for this original scoped follow-up.

Stop after exact publication/hosted verification for human review. Artistic
approval remains **false**. No campaign migration or Warrior equipment work.

The instrumented forest capture records a300ms maximum and two>25ms intervals,
with multiple simulation ticks; this was absent from all three untraced forest
cohorts. It remains visible in the capture report, is excluded from the timing
table, and is not claimed fixed or conclusively attributed to recording overhead.
Instrumented A/B/dungeon maxima were16.8ms. Both visual encounter runs defeated
the two real enemies and reached the shrine with278HP remaining.

### CI repair checkpoint

Candidate `155c6e71223ed4830b864c6c4f76e67b43fcb441` was committed/pushed.
[CI41093055890](https://github.com/tobisen/hollowbane/actions/runs/41093055890)
selected Full. Fast static/contracts/Chromium smoke and required cross-browser
compatibility passed. Complete units failed because the new full-loop traversal
unit exceeded its existing5000ms deadline. The fixture redundantly found each
path before `retarget` found it again. The repair asserts the actual returned
route and removes that duplicate computation; every leg, per-tick walkability,
endpoint assertion and deadline remain. All five focused simulation units pass
locally, with the loop taking2137ms; scoped format/lint pass. Production navigation
and release asset bytes are unchanged. Exact successor Full CI, Pages, hosted
acceptance and public bytes remain required; no gate is waived.

### Long-route performance repair

A follow-up request-time probe exposed a release blocker missed by the steady
walking cohorts. On the sealed test-only successor49ff677, native M4/Metal
start-to-shrine requests produced RAF maxima1133.2/1149.9/2000ms in A and
1216.5/1200/1233.4ms in B. The original dungeon's obstructed request measured
200/200/199.9ms. Direct outdoor requests were33.3–33.4ms; direct dungeon requests
16.8–33.4ms. All pre/post windows returned to16.8ms maximum with no browser errors.
The2s outlier is retained. These request-time results are separate from the
earlier untraced walking table; that table does not establish hitch-free input.

The shared logical segment sweep scanned every terrain cell for every A*edge.
The repair restricts candidate cells to the segment's radius-expanded bounds
plus a conservative one-cell margin, retaining all exact edge/object predicates,
path ordering and collision rules. This changes shared navigation cost, not the
generator, saved geometry or gameplay balance. Fifty focused navigation/sliding/
replay/analog/movement/AI/area tests pass, including an exhaustive-sweep oracle
across seeded terrain, negative origins, cell sizes0.125/0.5/1/1.75, tangencies,
short/long/reversed/zero segments and large objects. The full-loop unit now takes
81ms locally. Strict TypeScript, scoped lint/format and the production build pass.
Baseline evidence: `/private/tmp/hollowbane-act1-local-clicks/`; steady movement
profiles and instrumented recordings remain separately identified.

Identical fifteen-request native rerun: all six A/B shrine requests now have
83.3ms maximum RAF intervals (first motion91.5–92.8ms), with all pre/post windows
at16.8ms maximum and zero errors. Dungeon obstructed requests now16.7–16.8ms;
direct requests16.7–33.4ms. The dungeon direct median changed16.8→33.3ms across
only three samples, within the original maximum; retain this variation rather
than claiming every metric improved. The shrine still has a visible brief hitch;
this repair does not establish hitch-free input. Four original path arrays and
direct-route predicates match exactly. Separate cold Node timings were
shrine1642.9→76.0ms and dungeon206.0→8.5ms; these are not RAF timings.

Repaired request evidence: `/private/tmp/hollowbane-act1-local-clicks-repaired/`,
including `route-equality.json` and `comparison.json`. Reproduce separately from
steady walking/capture workloads:

```sh
node scripts/act1-navigation-profile.mjs /private/tmp/act1-requests http://127.0.0.1:4175/hollowbane/
```

All eight native Metal browser regressions pass83.8s: six study cases plus
existing dungeon/forest checks, zero skipped/flaky/unexpected/errors and unchanged
60s deadlines/assertions. New A start/combat and B shrine captures were reviewed;
no gross visual regression, with the documented placeholder/contact limits
unchanged. Evidence: `/private/tmp/hollowbane-act1-navigation-browser.json` and
`hollowbane-act1-navigation-browser/`. Exact successor Full CI/Pages/hosted
acceptance remains required before accepting this repaired runtime. Test-only49ff677 passed
Full units/validators/tooling and compatibility in CI41094686460; it is superseded
for the independently demonstrated request-time problem, not accepted as final.
