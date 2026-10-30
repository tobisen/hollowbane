# Dungeon environment reset — DBL-035/370/377/379

**Current release:** `fd11b936988088a8a6d4d0296906f3bf2ecbb4d3`, exact CI/Pages
and public bytes verified2026-10-30. [Play the study](https://tobisen.github.io/hollowbane/?d2slice=1).
Technical release evidence below supersedes historical pending checkpoints.
Human layout/graphics/gameplay-feel approval is **false**; no wider adoption.

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

### Session boundary: exact successor pending

Documentation-only repair `fd11b936988088a8a6d4d0296906f3bf2ecbb4d3` is
committed/pushed; [exact CI41080721674](https://github.com/tobisen/hollowbane/actions/runs/41080721674)
is in progress. Runtime source and the locally reviewed build are unchanged from
93ae977. This local evidence checkpoint is intentionally not pushed over that run.

Next action: inspect that run, repair only demonstrated failures, then verify
Pages release.json/byte identity for fd11b93 and run
`PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/dungeon-slice.spec.ts`.
Repeat the bounded native probe with the hosted URL as its second positional
argument, review captures and record the actual deployed SHA. Do not call the
study released before those checks. Last verified deployed SHA remains
`c437335844e4f82e30b00da2967d4f64c9614a64`. No physical-controller or final
painted-art approval; no equipment or other expansion work.

## Release and visual acceptance follow-up — 2026-10-30

Scope: verify fd11b93; no additional environment production, campaign migration or
Warrior equipment expansion. Human approval of layout, graphics and gameplay feel
remains explicitly outstanding after technical acceptance.

The comparison driver is `scripts/dungeon-slice-acceptance.mjs`. Both routes use
Chromium headless / Apple M4 ANGLE Metal, 1280×800 render and viewport, DPR1,
isolated fresh contexts, HTTP cache disabled and Full presentation preferences.
Order alternates across three repetitions. Readiness means the first observed
render frame with at least two real simulation ticks. This measures uncached
application navigation in an already running browser, not OS/browser startup or
human input-to-photon latency. Warmup is120 ticks plus two36-tick keyboard legs;
measurement is ten alternating36-tick left/right legs through real keyboard
input. Raw frame observations and actual positions are retained.

The campaign comparison is the unchanged peaceful developer Ancient Crypt,
seed42. Normal camera presentation and HUD remain visible: campaign zoom is
0.711015625, slice zoom1, and their HUD/scene workloads differ. These are matched
device/buffer/input conditions for the two actual presentations, not equal-work
GPU microbenchmarks. Camera pixels/second consequently differ; neither mode's
pixel speed should be mistaken for a gameplay speed change.

Local network-independent comparison (three cohorts per route):

| Route          | Uncached readiness range / median | RAF p95 / max | >25ms  | Zero/multiple tick intervals |
| -------------- | --------------------------------- | ------------- | ------ | ---------------------------- |
| Slice          | 121.0–241.0 /121.7ms              | 16.8 /16.8ms  | 0/1077 | 0/0                          |
| Campaign crypt | 487.7–504.8 /504.1ms              | 16.8 /16.8ms  | 0/1077 | 0/0                          |

Both returned exactly to their measured starting positions. Slice camera steps
alternate4/5 CSS pixels, campaign steps3.217689 CSS pixels at its existing zoom.
The slice's integer sampling is a presentation tradeoff, not smoother fractional
camera motion. ResourceTiming transferSize at readiness is912826 versus4766285
bytes locally; it includes HTTP response overhead and is not the total deployed
asset inventory. First-context/shader and network effects limit the startup
comparison. Raw local evidence: `/private/tmp/hollowbane-slice-local-performance/`.

Visual capture runs are separate and instrumented:1280×800 screenshots and25fps
WebM recording include the keyboard route and four screen-facing walk directions.
Their timings are excluded from the untraced performance results. Local harness
captures were inspected before hosted collection. The study has static lighting
and sparse low-contrast surfaces, but retains visibly repeated slab patterns,
simple masonry/prop geometry, abrupt tall-to-cutaway wall joins and the original
G1 walk/run artwork. Some G1 walk phases show visible foot/shadow separation.
These remain human-review defects; no new art or animation was produced.

Campaign protection: the runtime arena, world generator dispatch, world/save
schemas and character/IndexedDB storage modules have no changes against the
previous public c437335 build. The only normal entry change is a lazy study route
after the existing character-route validation. The new browser regression seeds
a complete campaign checkpoint, visits/moves through the study and rejects a
mixed character-bearing study link, then compares the entire serialized save and
registry exactly. It passes locally. Real user browser profiles are never opened
by these isolated test contexts. Pre-existing local documentation edits remain
separate.

### Exact hosted release evidence

[Requested CI41080721674](https://github.com/tobisen/hollowbane/actions/runs/41080721674)
completed **success** for full SHA `fd11b936988088a8a6d4d0296906f3bf2ecbb4d3`.
Fast static/core/browser, complete units/validators/tooling, all four Chromium
regression shards and required Chromium/Firefox/WebKit compatibility succeeded.
Verify succeeded16:56:10CET, Pages16:56:36CET, hosted smoke16:57:40CET and final
Release acceptance16:57:53CET (Europe/Stockholm). No genuine failure or runtime correction was needed
in this follow-up. No assertion, deadline or release tier changed.

Independent hosted manifest and SHA256 verification matches **all167 production
files** against the locally tested build. Production source/assets/configuration
remain exactly the accepted candidate; this follow-up adds diagnostics, a save
regression and documentation only. Its evidence commit stays local to preserve
the exact accepted public release, rather than triggering another publication.

Six hosted native-Metal browser cases pass in122.2s, zero skipped/flaky/unexpected:
keyboard/reset/blur/resize; the entire four-chamber loop and chapel via real ground
clicks; virtual stick/menu resume; complete campaign-save/registry isolation and
rejected mixed character links; independent inventory/progression/campaign/stash
saves for three owners; original crypt→graveyard virtual-controller travel.
Test captures retain the full loop plus six representative room/passage views.
Raw report/captures/videos: `/private/tmp/hollowbane-slice-hosted-browser/` and
`/private/tmp/hollowbane-slice-hosted-browser-results.json`.

Hosted untraced comparison, Chromium156.0.8078.4 / Apple M4 Metal, three cohorts
per route under the conditions above:

| Route          | Uncached readiness range / median | RAF p50 / p95 / p99 / max | >25ms  | Zero/multiple tick intervals |
| -------------- | --------------------------------- | ------------------------- | ------ | ---------------------------- |
| Slice          | 329.6–1005.7 /844.5ms             | 16.7 /16.8 /16.8 /16.8ms  | 0/1077 | 0/0                          |
| Campaign crypt | 1037.1–1537.3 /1411.5ms           | 16.7 /16.8 /16.8 /16.8ms  | 0/1077 | 0/0                          |

All six routes returned exactly to their measured origin. Camera steps match the
local results: slice4/5 CSS pixels; campaign3.217689 at its current0.711015625
zoom. At readiness, ResourceTiming reports915159 versus4768842 transfer bytes.
Both are stable60Hz presentations in this short sample; the study starts sooner
here but no universal startup/FPS or equal-work GPU improvement is claimed. Small
sample size, warmed browser/GPU process, different scene/HUD/zoom and variable
network remain material limits. No physical-controller/display or long-session
acceptance. Raw samples: `/private/tmp/hollowbane-slice-hosted-performance/`.

Hosted native pixel checks compare fixed world patches after136px horizontal
translation: floor0/43200 changed channels, wall edge0/33600, static light
pool0/24000; mean absolute difference0 in all three. No browser errors. This is
bounded horizontal pixel-stability evidence, not proof for every map position,
refresh rate, browser or physical display. Raw PNGs/JSON:
`/private/tmp/hollowbane-slice-hosted-pixels/`.

Normal-scale hosted captures are retained in
`/private/tmp/hollowbane-slice-hosted-visual/`: `slice-movement.webm` and
`campaign-movement.webm`,1280×800/25fps, plus original PNG motion samples and
extracted video frames. Representative room, chapel, wall-edge, light-pool and
four-facing movement samples were inspected. No environment flashing/popping was
seen in those slice samples; repeated patterns, simplified geometry, wall joins
and the G1 foot/shadow issue above remain. Video compression/25fps capture cannot
establish60Hz physical-display acceptance. The separately instrumented campaign
capture records one416.6ms interval, absent from all three untraced cohorts; it
is retained, excluded from the untraced table and not claimed fixed or conclusively
attributed to capture overhead. The instrumented slice has no>25ms interval.

Focused TypeScript, affected ESLint/Prettier and the new local save-isolation
regression pass. Reuse the exact candidate's successful Full/build/compatibility
gate and inventory of all167 verified production files; no redundant local broad rebuild or
regression was required. No production assets, mechanics or save code changed.

Reproduce:

```sh
node scripts/dungeon-slice-acceptance.mjs /private/tmp/slice-performance https://tobisen.github.io/hollowbane/
node scripts/dungeon-slice-acceptance.mjs /private/tmp/slice-visual https://tobisen.github.io/hollowbane/ --capture
node scripts/dungeon-slice-profile.mjs /private/tmp/slice-pixels https://tobisen.github.io/hollowbane/
```

Human review must decide whether the larger spaces, coarse graphics, darkness and
movement feel are the desired direction. Keep the study isolated. Do not migrate
campaign maps or resume equipment production before that decision.
