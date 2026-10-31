# Classic Visual production foundation

2026-10-31 · DBL-035/375/379 · Deliverable A

Human art-direction approval applies to release
`65e49feab52a072dfc00fa6a4d7b29800b431f0a`,
[Classic Visual](https://tobisen.github.io/hollowbane/?classicVisual=1).
The current assignment authorizes A → B → C, with a verified release at each
boundary. The integrated campaign stays opt-in; the default campaign and its
saves remain protected. This specification records the approved implementation,
not a new style or authorization for mass asset production.

## Reusable art bible

| Convention           | Approved implementation and production constraint                                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection           | `act1Project(p, "b")`: x = (p.x − p.y) × 64 + 768; y = (p.x + p.y) × 44 + 512. Diamond 128 × 88; orthographic source elevation asin(44/64) = 43.43253656°. World/collision coordinates remain independent.                                                                                    |
| Camera               | Unit zoom; centre on rounded projected player coordinates. Phaser RESIZE, antialias/antialiasGL/roundPixels true. Keep this sampling and scale when comparing motion.                                                                                                                         |
| Actor scale/contact  | All actors share 184 × 176 atlas cells and root (92,119), displayed at scale 1. Source window 360 × 344/root (180,234), rendered at 2× then reduced to 180 × 172 and padded 2px. Never fit individual frames or directions.                                                                   |
| Relative silhouettes | Warrior source scale (1,1,1), broad raider (1.12,1.06,0.94), narrow runner (0.87,0.9,0.94). Shared elevation/root; nearest four genuine views, no mirroring.                                                                                                                                  |
| Ground               | Continuous cell contours, three 0.75/0.25 corner smoothing passes. Background #272d21; ground #383b2d; edge #303628 at 0.4 alpha/24px. One world-fixed 512px earth texture at tile scale 2.7/alpha 0.24. No per-cell texture seams.                                                           |
| Paths/contrast       | Broad 104px #494333/0.18 and 64px #514735/0.16 path strokes. Muted olive/brown scenery stays subordinate to steel/burgundy Warrior and pale/brown versus narrow olive enemies. No extra lighting or dense decoration.                                                                         |
| Trees                | Original 256px oak; origin (0.5,0.91), scale 0.82–1.00. Deterministic boundary groves/jitter; clear traversable centres. Current map: 72 candidates, 26 full canopies, 46 omissions.                                                                                                          |
| Occlusion            | Permanent canopy omission using the full envelope (256 × scale, 244 × scale), projected ground cells plus 28px horizontal and 100px actor clearance. Never toggle foliage alpha on player movement. Low growth replaces selected omitted trees.                                               |
| Other props          | Bell origin (0.5,0.84), scale 0.8; rocks origin (0.5,0.75), scale 0.65; growth origin (0.5,0.75), scale 0.65–0.7. Current four paths/bell coordinates belong to the pilot, not a generic campaign layout.                                                                                     |
| Depth                | Props/actors sort by projected foot y; player adds 0.01. Actor contact y − 1; bars y + 1. Ground layers −1000/−998, prop contact −997, low growth −996. Retain a stable foot anchor through turns/reactions.                                                                                  |
| Edges/filtering      | Lanczos3 reduction; two packing pixels; alpha ≤ 2/255 cleared. Existing actors have ≥6px transparent margin, props have a 10px clear outer margin. No opaque fringe or per-frame trimming. Runtime retains approved antialiasing.                                                             |
| Lighting             | Baked, broad warm soft key, RGB (1,0.92,0.78), size 5; warm rim disabled. Source key at (−3,−4,6) aims at (0,0,1), as authored in `assets/source/q3/warrior-rig-v2/warrior.py`; preserve it. Roughness 0.83; steel metallic 0.24 on Warrior, otherwise 0.04. No runtime point lights.         |
| Contact shadows      | Shared generated 128 × 64 radial texture: RGB (9,12,8), alpha 0.55 at centre, 0.24 at radius 0.5, 0 at edge. Living actors 38 × 16, foot y + 2. Props share the texture with bounded offsets. Corpse size/offset follows alpha bounds after pose 9; approximate, not baked per-pose lighting. |
| Detail frequency     | Actor pigment noise scale 4/detail 1, no micro-bump; rivets/chasing/strands/small clasps removed. Quiet enlarged earth texture, sparse boundary growth, no moving foliage/noise. Preserve spacious composition rather than increasing asset density.                                          |

Implementation sources: `src/world/act1-view.ts`,
`src/rendering/classic-environment.ts`, `src/rendering/classic-visual.ts`,
`scripts/render-classic-actors.py`, `scripts/package-classic-actors.mjs`.
Asset/source hashes remain in `public/dev/classic-visual/{actors,environment}.json`
and `docs/assets.json`; no new assets or changed authoring sources in this increment.

## Minimum campaign animation coverage

Each of Warrior/raider/runner has four views (SE/SW/NW/NE): one idle, eight walk,
eight primary attack, three hit and six death samples: 104 poses each, 312 total.
Eight logical directions map SW/SW/NW/NW/NE/NE/SE/SE. Run uses walk at actual
distance cadence; it needs no new pose library. Hit/death take priority; death
uses the existing 30-tick timeline and holds its final sample. Existing atlas
tests verify every view/state, common root, source identity and transparent apron.

Warrior Sundering Fan (`iron-fan`) and Oath Echo (`oath-echo`) can reuse the
approved primary body poses. The Classic selector now accepts the authoritative
cast and normalizes the second ability's pose offset; effects stay owned by the
existing skill renderer. This is a deliberate shared body-motion limitation,
not dedicated ability artwork. Read-only replay checks cover both skills, eight
directions, four speed breakpoints, exact release pose 5 and one effect per cast.
The isolated Classic pilot still has no skill input/runtime; visible campaign
ability/effect acceptance is required in B. Do not claim it from selector tests.

The first actual outdoor is `haunted-forest`, reached from `ashen-refuge`.
Its five three-member packs contain melee, flanker **and ranged** roles. The two
approved pilots cover body states, but ranged presentation/projectile readability
must be verified in B; never change the role or omit those encounters to fit art.
Sorcerer/Ranger retain existing art. Static idle, four-facing turns and approximate
corpse shadows remain accepted baseline limitations pending integrated review.

## Integration boundary discovered before B

Use `startCombatArena` and its existing `WorldSession`, `WorldTravel`, skill,
inventory, quest, container and waypoint integrations. Do not extend the isolated
pilot into a second campaign. `worldLayout` pins legacy/generated versions;
`layoutFingerprint` and `WorldSession` save validation bind snapshots to their
maps. A candidate map cannot be substituted into a normal saved session.

B must provide a dedicated opt-in/disposable ownership boundary before adapting
only Haunted Forest. Retain exits, encounter identities, objective/waypoint/
container anchors and reachable camp NPC flows. Validate every route at actor
radius; use the same combat/quest execution. Existing character data may be
copied for compatibility checks without allowing candidate map state to overwrite
the owner. No schema or world-generator rewrite is justified by this audit.

## Acceptance and release ledger

- A1 specification: complete. A2 projection/root/edge audit and A3/A4 bounded
  coverage: existing assets retained; cast adapter added without asset growth.
- A5 local checks: 13 focused asset/selection/projection/replay tests pass;
  TypeScript, scoped lint, asset validator and build pass. Three Chromium
  SwiftShader scenarios pass (29.3s): eight-direction traversal/four views,
  combat/deaths, camera/shrine/edge/reset, exact checkpoint isolation and virtual
  controller pause/focus/resize. Start/combat/bell/edge screenshots reviewed.
  This is software-browser evidence, not new native performance or hardware
  acceptance. Baseline movement evidence remains separately recorded.
- A6: commit/push, required risk-based CI, exact-SHA Pages/hosted checks and
  sealed public-byte verification are mandatory before B. Record results in
  `classic-visual.md` and STATUS; a queued/pending run is not acceptance.
- A6 complete: `954032834f88ea2cc02570851ecca3d56f30e391` passed Full
  CI41228393310, Pages, hosted/final acceptance and all 189 public-file byte checks.
  Four additional hosted native Metal cases pass34.4s; captures reviewed.
- B started with a bounded layout and deterministic reachability/travel checks;
  runtime/save/render integration and C remain pending. See [integration checkpoint](classic-act1.md).
  No default/campaign/save migration, new art library or balance change.

Approved baseline cost: 3,409,658 PNG bytes, 42,348,544 calculated decoded RGBA
bytes including contact shadow (40.39 MiB), nine textures. Incremental asset cost
here: zero. These numbers are not measured GPU memory. Baseline native M4/Metal
steady movement: 540 intervals, p50/p95/p99/max 16.7/16.7/16.8/16.8ms, zero >25ms.
Separate shrine requests still cause 50–66.6ms hitches. Neither those historical
measurements nor bounded ground-scroll samples establish integrated performance
or universal shimmer clearance. C requires matched native movement/load/reload
and long-request measurements against the integrated candidate.
