# Dungeon environment reset — DBL-035/370/377/379

2026-10-30. User-authorized environment/feel reset; Warrior equipment expansion
paused. This is a bounded developer direction study, not a new campaign phase or
final art acceptance. Original issue IDs/dependencies remain unchanged.

Launch `?d2slice=1` from the normal Vite/Pages base. WASD/arrows/left stick move,
ground click walks, R toggles run, P opens the existing controller menu. Return to
gate resets the study. Previous crypt links to the peaceful developer expedition
for comparison. There is no character, loot, combat or persistence binding.

## Diagnosis and treatment

The existing `dungeon-layout.ts` generator carves one-cell centerline passages
between 5–9-cell templates. With the existing 0.2-unit actor radius, a straight
one-cell passage has only 0.6 units of center clearance. The study uses four-cell
passages (3.6 units of center clearance), 10×10/12×10/12×12/10×10 chambers in a
loop, generous right-angle junctions and a 7×6 side chapel. Only two blocking
stone props sit off the main route. Existing `moveTick`, swept collision, corner
sliding and pathfinding run unchanged against the new logical map.

`WorldEnvironment` repeats a cropped detailed arena image for every floor cell
and adds repeated mortar strokes to sampled wall textures. These are plausible
spatial-aliasing sources, not a measured universal cause of the user's flicker.
The separate Mac zero/double-tick mechanism was already corrected in P2; this
study retains its centered 60Hz residual using raw RAF elapsed time.

The study instead draws low-contrast chipped flagstones, large masonry courses,
thick wall caps, near-wall cutaways, sparse original tomb/pier forms and steady
amber pools against black void. Unit zoom, a resize-to-viewport render buffer and
integer camera positions avoid FIT scaling and moving fractional texture samples.
There are no environment bitmap samples, moving fog, pulsing lights or thin bright
floor outlines. This is deliberately simplified vector art; a painted production
crypt, more distinct room silhouettes and human movement/atmosphere approval are
still outstanding. No claim that all visible flicker is fixed.

## Provenance and isolation

All environment geometry, colors and deterministic appearance variation are
original source in `src/rendering/dungeon-slice.ts`. Environment rasters added: 0.
The player reuses the repository's original G1 `public/assets/wanderer.webp`,
128×128 frames, existing foot pivot and eight-direction locomotion. Run still
reuses its walk artwork; equipment production is not resumed. These environment
primitives and the reused player are explicit study placeholders. No third-party
names, art or assets are shipped in the study.

The map does not enter saved-world generator dispatch, fingerprints, area travel
or any checkpoint schema. Character-bearing mixed routes still fail closed before
the study entry. Browser evidence confirms no IndexedDB databases are created.

## Focused local evidence

- Three unit cases: deterministic valid map and corridor clearance; full chamber
  loop/chapel through real walker ticks; perimeter sliding and blocked tomb sweep.
- Three Chromium cases, final run 48.4s: keyboard/reset/blur/resize, six real
  ground-click destinations around the entire loop and chapel, standard virtual
  stick movement and existing menu resume/focus. All pass. Initial harness defects
  (missing scene-ready wait; Escape is cancel, not pause) were corrected without
  changing runtime or assertion deadlines. No physical-controller claim.
- Strict TypeScript, scoped ESLint/Prettier and production build pass. No broad
  unrelated local test sweep. Start/room/passage/chapel screenshots reviewed;
  raw captures remain ignored under `test-results/`.
- Native headless Chromium, Apple M4 / ANGLE Metal, 1280×800/DPR1: final 30-frame
  horizontal scroll, 29 RAF intervals, p95/max16.8ms, zero browser errors. A fixed
  180×80 floor patch below the actor, compared after exact136px camera translation,
  has 0 changed channels out of43200, mean absolute channel difference0. The patch
  retains coarse diagonal joints: this checks actual pixel stability, not merely
  whether textures loaded. This short single-patch result does not establish all
  directions, long-session performance, old/new quantitative superiority, physical
  display stability or campaign performance acceptance.

Reproduce after build with preview on4174:
`node scripts/dungeon-slice-profile.mjs`. Native renderer identity and raw
frames/captures are retained in `/private/tmp/hollowbane-dungeon-slice-final/`.

## Publication checkpoint

Focused candidate is locally verified; exact-commit CI/Pages and hosted slice
acceptance remain pending until explicitly recorded. `gh auth status` reports an
invalid stored token; SSH remote reads and the public Pages manifest work. Last
verified deployed SHA before this candidate:
`c437335844e4f82e30b00da2967d4f64c9614a64` (public manifest checked this session).
Do not label this candidate hosted until its exact release SHA and focused hosted
slice scenarios pass. No second expansion or equipment continuation is authorized
by this checkpoint.

### First candidate: static formatting blocked publication

Candidate `93ae977ddc3ae64a888da0ff0bd348fc2d3b9ebe` was pushed. Exact
[CI41080322980](https://github.com/tobisen/hollowbane/actions/runs/41080322980)
failed static checks before browser/deploy. The committed STATUS.md contained an
unquoted inherited staff-evidence glob which Prettier rewrote as emphasis. The
literal path is now quoted; no runtime, tests or acceptance thresholds changed.
Full local lint passed; the other local format warnings are two pre-existing,
uncommitted documentation edits and remain untouched. A successor exact release
gate is required; the failed candidate is not a deployed slice.
