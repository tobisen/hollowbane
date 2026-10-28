# Q3-B Warrior equipment compatibility — DBL-023/024/025

2026-10-28. User authorizes modular Warrior equipment work through public
Checkpoints A/B/C. This supersedes the earlier production-publication stop for
this scope. Other classes, monsters, balance, saves and Phaser4.2.1 remain intact.
This includes the shield proof, opt-in showcase and now the local campaign
vertical slice below. **Checkpoint A is pending exact publication acceptance.**
Prior accepted production revision remains
`ee03e81964bb597636aa2d96f64716268e5c1d81`; see
[warrior-production.md](warrior-production.md). Historical sections retain their
then-current counts and restrictions.

## Production sword/shield release candidate — 2026-10-29

The normal campaign now selects the original sword/shield candidate from actual
`ash-blade`/`bark-guard` equipment. Standard body frames remain shared; only the
late-death left arm uses the48 unique variants. Two optional, reference-counted
textures load after the existing40 finish, under the existing presentation
barrier. A single overlay follows the existing deterministic pose, root, actor
depth and hit tint. Hidden/disposed sprites restore their original textures
before release. Failed partial loads release all candidate textures, preserve
legacy presentation and do not retry every simulation tick; reload can recover.
No simulation, equipment rule/statistic, save format or Phaser4.2.1 change.

Empty offhand retains40 textures; shield uses42. Sorcerer/Ranger, bow/staff,
empty/unknown main, unknown offhand, committed projectiles, explicit legacy and
failed assets retain fallback. The original baked sword is never mislabeled as
another weapon. The source package's `productionApproved:false` describes its
immutable developer proof; the compact hash-pinned production descriptor is the
reviewed promotion path. Public acceptance remains separate and pending.

Full `npm run check` passes **682 tests/150 files**, TypeScript, lint,45 asset
records, backlog/dependency validation and build. **16 distinct production
Chromium scenarios** pass across bounded runs: character creation, existing
character, live inventory equip/unequip including persisted unequip, Save & Exit,
re-entry, three42→0→42 resource cycles, both missing-equipment-atlas recoveries,
cross-class isolation, actual movement/combat/both abilities, three terrains,
eight-way walk/run, natural held corpse, saved waypoint and actual portal travel.
Six additional Firefox/WebKit restore and failure/recovery cases pass. Earlier
14 developer Chromium/four compatibility cases remain recorded below. All tests
use real inputs and established simulation; no timing/stat/AI bypass was added.

The first local production invocation mistakenly selected hosted fixture mode
without a release receipt; corrected local invocation passed. The new travel
case initially called a developer-only route helper unavailable in campaign;
it now uses pure navigation and the existing trusted virtual-input driver.
Original arrival bounds remain. Native combat profiling preserves the already
approved Run/current-target driver; a snapshot/hash records that exact protocol.
All failure artifacts remain in the temporary evidence directory.

Gameplay-scale light/dark source, sixteen live walk/run facings, actual
camp/forest/marsh/crypt, melee/abilities and natural corpse captures were reviewed.
No demonstrated detached grip, body intersection or alpha halo remains in these
samples. Existing brisk cadence, rigid cloak and sculptural finish remain;
sampled geometry and automated motion do not replace a full human playthrough.

### Resource and native evidence

The two additional PNGs total **3688973 bytes**, plus313826 uncompressed atlas
JSON bytes and **24MiB calculated base RGBA**. Candidate total is42 textures,
373.25MiB calculated base RGBA. This is not GPU residency. Production requests
only the four hash-pinned aliases; no `/dev/` asset requests. Three tested cycles
release/reacquire cleanly; no general leak-free claim beyond these observations.

Native Chromium156.0.8078.4 /Apple M4/verified ANGLE Metal,1280×800/DPR1/Full,
HTTP cache disabled, balanced repeated orders and identical real shield snapshots:

| Measurement                                                    | Candidate                                                          | Same-equipment legacy baseline                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Movement (three pairs per keyboard/virtual-pad;420 frames/run) | p5016.7, p9518.6–18.7, p9918.7, max18.8ms;0>25                     | p9517.3–18.7, p9918.7, max18.8ms;0>25                             |
| Camera relative movement range                                 | 0px both axes                                                      | 0px both axes                                                     |
| Real16-actor forest combat (three pairs;584–619 frames/run)    | p5016.7, p9517.9–18.3, p9918.7–383.3, max415.7–416.5ms;5–13>25/run | p5016.7, p9517.8–18.4, p9918.7–267.4, max416.5–416.7ms;5–9>25/run |
| Cold navigation to renderer ready                              | 1699–1944ms; body492–558.4ms, extra shield38.5–54.8ms              | 1157–1178ms; no Warrior textures                                  |
| Production load                                                | 42PNG +2JSON;27147568 encoded PNG bytes/49721 encoded JSON bytes   | No Warrior requests                                               |
| Actual inventory equip click→observed ready (three pairs)      | 168.7–276.1ms; shield loader45.6–47.5ms                            | 121.4–123.9ms                                                     |
| Equip frame maximum                                            | 99.3–100.1ms                                                       | 99.9–100.1ms                                                      |
| Unequip click→observed ready                                   | 260.1–267.4ms                                                      | 263.4–268.8ms                                                     |
| Unequip frame maximum                                          | 200–216.6ms                                                        | 200–216.6ms                                                       |

Movement has5040 sampled frames total and16 actors. Each cohort proves actual
travel; prior idle-keyboard results are not reused. Combat includes real primary,
hit and both abilities. Legacy baseline is the last released fallback for this
same shield equipment, not a different body-only load. Existing variable
checkpoint/combat and inventory stalls remain; no tail-latency improvement or
globally hitch-free claim. No unrelated persistence optimization. Click-to-ready
includes browser driver observation/redraw overhead and two post-ready paint
intervals are retained in frame sampling. OS/GPU cache was not reset. Virtual
pads/browser keyboard/mouse are not physical-controller evidence.

Machine evidence: [equipment-production-review.json](equipment-production-review.json).
Raw renders, browser captures/results, matched movement, battle and inventory
switch samples plus a163-file tested client seal remain under
`/private/tmp/hollowbane-warrior-equipment`. Next commit/push this coherent
candidate, require exact **Full +Pages +hosted** acceptance and byte identity,
then record the published SHA before any B/C expansion. No public A/B/C receipt
is claimed yet. Bows/staffs/unarmed still need a shared sword-free body and genuine
category-specific choreography; full armor production remains outside scope.

## Packaged equipment / playable study — 2026-10-28

The original sword/shield candidate now has all784 unique shield overlays and48
limited death-body variants. A single cropped shield atlas supplies880 logical
frames; one cropped body atlas supplies64 logical late-death frames. All96
idle/settled aliases share pixels and preserve the appropriate body root.
The two atlases add **3688973PNG bytes /24MiB calculated base RGBA**, plus313826
atlas-JSON bytes. The approved40 body atlases remain byte-identical. No complete
880-frame body copy was made for this shield. These are developer assets, not new
campaign support or a GPU residency measurement.

The packer refuses incomplete/stale/failed proofs before writing. Every native
source raster is fingerprinted. Asset validation checks all cropped pixels,
source sizes, aliases/roots, atlas bounds and provenance. A944-frame round trip
(880 shield +64 body) reconstructs the native proof pixels exactly above the
existing alpha cutoff4. Native M4/Metal Phaser4.2.1 validates all880 trim/origin
contracts; its actual eight-way corpse captures were reviewed. All144 native
offline direction/clip/rate pairs observe every pose name;15 additional slow-idle
completion runs close the coverage missed by the initial short samples. Preview
combat/cast cadence remains diagnostic, not authoritative gameplay timing.

Local route: `?developer=1&warriorPilot=1&warriorArena=1&warriorEquipment=1`.
This opts into the existing playable arena with a visual-configuration selector,
grip marker and per-frame/fallback diagnostics. The same live pose selectors
drive both layers and the targeted late-death body. The overlay sits immediately
after its body at the same actor depth. Unsupported bow/staff/empty-hand choices
show legacy graphics; blade/empty offhand uses the approved body. These are real
base IDs on a disposable melee fixture, **not actual item transactions**. No
character owner, save, statistic or combat rule is changed by the selector.

Four new focused packing/asset cases, TypeScript, affected lint, asset validation
and build pass. **14 Chromium /4 Firefox-WebKit** cases pass across bounded runs:
all prior seven arena cases, live eight-way walk/run with bounded released-input
captures, actual secondary/Oath outcome parity, natural hit/lethal landing,
appearance/fallback switching, virtual controller, save isolation and resource
cycles. The initial new direction test incorrectly projected screen-relative
keyboard intent as world intent; its corrected expectation retains all original
movement/facing/overlay/camera assertions and5s bound. Failure evidence is retained.
No simulation or renderer repair was required for that test error.

Three unload/reload cycles return42→0→42 candidate textures, with stable total
texture counts and unchanged encounter state;168 PNG requests total across initial
load and three reloads. Developer resident payload is373.25MiB calculated RGBA.
Hidden sprites restore the original texture before removal. Ordinary entry and
the original arena request no equipment assets; the latter remains40 textures.
This is not measured GPU memory, a general leak proof or campaign switch latency.
Light/dark source proofs, actual ability/corpse captures and all16 live facing
captures were reviewed. Existing brisk cadence, rigid cloak and sculptural finish
remain. Physical-controller evidence is still absent.

Machine evidence: [equipment-review.json](equipment-review.json); source assets
and hashes: `public/dev/warrior-equipment/equipment.json`. Raw complete renders,
round-trip/Phaser checks,144 playback pairs/idle completions and browser captures
remain under `/private/tmp/hollowbane-warrior-equipment`. The earlier shield proof
below and `shield-review.json` retain their historical partial-render counts.

**Campaign shield selection remains legacy.** Conditional production ownership,
real equipment/save/reload/travel/death scenarios, cold/switch measurements,
matched native campaign profiling and exact CI/Pages/hosted publication are next.
The developer entry changes its route bundle; the earlier153-file identity claim
applies to the preceding offline-only increment, not this new developer build.
No public checkpoint is accepted and no release has been pushed. Do not advance
equipment expansion B/C past mandatory A acceptance.

## Shield proof checkpoint — 2026-10-28

Original `bark-guard` geometry and materials now have a fixed left-palm grip.
The plate is0.44×0.64×0.035m with0.14m hand clearance. All880 authored poses in
eight directions pass bone/root/foot checks, grip invariance, shield/body BVH
surface checks and shield-floor checks. Two independent executions have identical
core880-pose transforms/geometry diagnostics (canonical SHA256
`0df3b039aeddd400eeb8a4d106b2e8d7daf0d18f6a72eb9efdf264c6885ce64c`).
Whole JSONs differ in provenance and additional diagnostic fields; no byte-equality
claim is made for those files. See [shield-review.json](shield-review.json).

The original unchanged death arm **cannot fit this shield**: the rigid fit
intersects the forearm and sinks below ground. A73-angle handle sweep found no
valid late pose, including a narrower0.32m shield trial. A targeted left-arm
landing variant opens the arm nominally0.20m, constrained by the original two-bone
IK/reach, and turns the shield−20° around its physical handle over poses8–11.
Bone lengths, shoulder, hand orientation, all other bones, root, camera, combat
timing and simulation remain intact. Minimum sampled shield clearance0.010744m;
modified arm clearance0.037257m. Surface checks are not continuous collision proof.

This requires **48 unique late-death body variant images**, plus the two held
aliases per direction. All other body art reuses approved pixels. A shield-only
layer cannot fix the original death geometry. Do not cover or translate the
incorrect hand with arbitrary screen offsets or enable the unchanged death art.

`scripts/probe-warrior-shield.py` reuses the512-pose exporter via a read-only
observation callback. For procedural poses, it hash-checks and runs the existing
approved authoring scripts with one AST observation after `records.append`;
their pose code/assertions and source files are unchanged. The optional death-arm
candidate runs the existing IK in that callback. Renders use original body
geometry as camera holdouts, producing an equipment-only alpha overlay that can
be composited above the exact approved body. The probe rotates both rig **and
meshes** like the approved directional renderers; rotating only metadata wrists
does not rotate body geometry for this visual/depth test.

All96 packed idle/settled aliases are explicit, including root translation when
reusing a movement shield image in attack/ability/death cells. There are784 unique
equipment rasters to finish. Current proof contains126 unique overlays and138
composites: all110 SE poses and eight-way idle/primary/Oath/settled-death samples.
Light/dark stills and complete SE sequence strips were reviewed at gameplay scale.
Native Chromium passes18 offline playback cases (nine clips/two preview speeds),
with zero browser errors. Preview combat/cast cadence is diagnostic; these are not
actual campaign combat, controller or authoritative timing tests. Full eight-way
motion/transition review remains required.

`scripts/review-warrior-shield.mjs` verifies approved body hashes, handles alias
padding and emits comparison sheets, an isolated `motion.html` and pixel-depth
diagnostics. Sample West idle correctly hides1670 opaque shield pixels behind the
body; SE primary/Oath/death have front-facing overlaps. These samples do not prove
a single whole-sprite ordering fails within one frame. Per-pixel holdouts avoid
assuming one ordering for every pose. The full lit references and light/dark
composites retain no demonstrated gameplay-scale halo; shadow/contact appearance
and all remaining directions still need the developer/campaign review.

Four focused suites/14 tests, TypeScript, affected ESLint and build pass. All153
accepted runtime files match the new build byte for byte. No source blend,
approved PNG, renderer, save, balance or Phaser4.2.1 change. Runtime asset delta
remains0; the temporary138 composite overlays total924132PNG bytes **before**
tight atlas packing and are not a production payload/GPU residency measurement.
No new campaign/native performance or CI/Pages/hosted verification is claimed.

Raw evidence: `/private/tmp/hollowbane-warrior-equipment/shield-motion` (metadata,
overlays, limited body variants, depth references, light/dark sheets, motion HTML,
sequence strips and18-case browser results). Earlier `shield-rigid`,
`shield-corrected`, `shield-landing`, `shield-sweep`, `shield-narrow-sweep` and
`shield-arm-sweep` retain failed/diagnostic trials; do not count them as passes.

Next: preserve successful renders; finish only missing unique overlays and48
death body variants, package cropped alpha layers, review complete eight-way
motion/transitions and integrate in the isolated equipment showcase. Production
still supports only blade/empty offhand; shield/bow/staff/empty hands retain
legacy fallback. Then complete the actual sword/shield campaign vertical slice
and mandatory exact Checkpoint A CI/Pages/hosted gate before expansion B/C.

## Actual compatibility matrix

Only three main-hand bases and one offhand base exist. Names below are repository
base IDs; advanced/unique/set/socketed instances retain those bases. Level,
identification and configured attribute requirements still apply. There are no
class-specific equipment restrictions in `equipment.ts`.

| Configuration                 | Campaign renderer now      | New art needed                                      | Motion needed                                                                                          | Grip/attachment data                                          | Existing motion reuse                             | Temporary fallback                                          |
| ----------------------------- | -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `ash-blade`, empty offhand    | Yes                        | No; approved sword is baked in                      | No                                                                                                     | None for current baked renderer                               | All 72 clips                                      | Only debug override, failed loading or committed projectile |
| `ash-blade` + `bark-guard`    | Local candidate; A pending | Original shield candidate and two atlases now exist | 48 unique late-death body variants; local campaign scenarios pass                                      | Left-hand grip, full projected orientation and body occlusion | All 880 poses proven in developer assets          | Exact public release gate pending                           |
| `reed-bow`, empty offhand     | No                         | Original bow plus shared sword-free body solution   | Bow draw/release and two-hand coordination; sword strikes do not establish compatibility               | Both-hand grip; projectile timeline alignment                 | Locomotion/hit/death may be reusable after review | Yes                                                         |
| `cinder-staff`, empty offhand | No                         | Original staff plus shared sword-free body solution | Actual melee staff choreography needs visual review; current sword strike is not accepted staff motion | Two-hand grip and staff/body occlusion                        | Locomotion/hit/death may be reusable after review | Yes                                                         |
| Empty main, empty offhand     | No                         | Shared sword-free body solution                     | Unarmed attack not authored                                                                            | Empty-hand pose data                                          | Non-attack states may be reusable                 | Yes                                                         |
| Empty main + `bark-guard`     | No                         | Shield and shared sword-free body solution          | Unarmed/shield coordination not authored                                                               | Left grip and occlusion                                       | Must be reviewed                                  | Yes                                                         |
| Bow/staff + offhand           | Invalid equipment          | —                                                   | —                                                                                                      | —                                                             | —                                                 | Existing transactions displace conflicting equipment        |
| Unknown future base           | No                         | Audit when introduced                               | Audit when introduced                                                                                  | Audit when introduced                                         | No assumption                                     | Yes, fail closed                                            |

`equipment-content.ts`: blade is one-handed; bow/staff are two-handed; shield
occupies `off`. Dual wield, axes, maces and other offhands are not current content.
`equipItem` stows offhand when equipping a two-handed weapon, or stows the
two-handed main when equipping a shield. Full inventory rejects the entire swap.
`validateCharacter` also rejects a two-hand/offhand conflict. These rules are
enforced, not merely descriptive metadata.

`equipment-stats.ts`: bow selects projectile/range6; staff/blade select
melee/range1.05. An empty main retains the captured class base weapon/range.
Committed attacks keep the previous simulation weapon until idle. Retain the
production selector's `committed-projectile` guard through equipment changes.

Warrior Sundering Fan (`iron-fan`) is class-derived single-target melee;
Oath Echo is self support. Skill definitions/casting do not impose an equipped
base category. This is gameplay permission, not proof the sword animation fits a
bow/staff. Normal secondary input keeps its assigned skill; the developer arena
also exposes the separate secondary melee clip.

## Armor and existing art

Ten slots exist: main/off, helmet/chest/gloves/boots/belt, ring1/ring2/amulet.
All contribute existing item statistics. No armor slot changes the world body
appearance. Preserve the approved static armor, cloth and materials. No per-item
transmog, socket graphics or armor variants are promised.

`inventory-view.ts` supplies original inline SVG symbols for blade/bow/staff/
shield and armor. These are inventory icons, not perspective-correct world art.
The Blender source contains four separate sword meshes (grip, crossguard,
pommel, blade), rigidly bound to `handR`, plus both gauntlets. Production PNGs
flatten them together with the body. No separate lit bow/staff/shield world mesh
or ready-to-use attachment atlas was found in the inspected Warrior pipeline.

## Attachment feasibility and smallest next step

The approved rig has 15 bones including `handL`/`handR`, forearms, upper arms,
torso/head, root and legs/feet. It has no authored shield socket or item-specific
grip. Bone origins are wrists, not a verified shield handle. Sword geometry uses
an authored rest-space offset from the right hand. Both hands' existing matrices
can produce deterministic projected transforms without new motion authoring.

`scripts/export-warrior-attachments.py` reads the hash-pinned movement/attack
blends with Blender4.5.3 and writes metadata only to a requested output path.
It exports all eight directions, 512 poses, both wrist origins, projected XYZ
bases, camera depth and world matrices. It checks shipped roots, bone lengths,
forearm/wrist continuity and directional foot positions. The full basis preserves
foreshortening that a single sprite angle cannot represent. No PNG or blend is
written and no approved source/provenance file is edited.

This is a feasibility probe, not a runtime attachment format. It excludes the
procedurally authored ability/hit/death poses (368 poses), weapon-specific grip
offsets, packed idle/settled-pose aliases and body occlusion. A hand's camera depth
alone cannot establish correct shield/torso overlap. Do not enable support from
this probe or treat it as a visual acceptance pass.

Audit's next step (now covered by the offline proof above): create one original
`bark-guard` mesh on a left-hand grip in a separate
developer source; prove shield/body visibility in eight idle views and moving
primary/Oath/death poses at gameplay scale, light and dark. Compare a small
equipment-only render with body depth/holdout against a projected attachment.
Pick the representation from that evidence; do not assume one whole-sprite
front/back depth toggle handles torso/arm occlusion. Reuse the existing sword
body for this first configuration. Bow/staff/unarmed require removing baked sword
pixels through a shared body solution; covering them with another icon is invalid.
Do not duplicate the entire body atlas set per weapon.

## Ownership and acceptance still required

`WarriorProduction` currently acquires one shared per-game lease, bounds downloads
to two, pauses at loading, preloads all40 state/direction atlases, restores the
legacy sprite before releasing textures, waits for pending loads, and cleans up
partial failures without per-frame retry. Unsupported equipment triggers that
release. Preserve this owner and extend the lease only after real visuals exist.
Equipment selection is reevaluated live; no simulation events originate here.
Keep reasons in developer diagnostics, outside normal player UI.

Asset delta for this increment: **0 PNG bytes, 0 runtime decoded bytes, 0 atlases**.
Baseline remains23,458,595PNG bytes/349.25MiB base RGBA/40 conditional atlases;
this is not measured GPU residency. No new native frame/load/switch measurements.
Prior native M4/Metal p9518.0–18.6ms and checkpoint stalls remain historical
baseline evidence, not equipment-extension results.

Checkpoint A still requires the first actual visual configuration, isolated
developer verification and exact CI/Pages/hosted acceptance. B/C additionally
require complete animation/transition/save/selection/area/death coverage,
repeat-switch resource bounds, added payload/load/switch measurements, matched
native p50/p95/p99/>25ms samples and production acceptance. No checkpoint may
advance past a failed mandatory gate. Physical controllers, actual GPU residency
and a full human Act1 playthrough remain unverified.

## Verified audit increment

Two independent Blender exports pass all512 pose checks and are byte-identical:
SHA256 `4460379c883fa32237df8af5f15c3d80f44975bb5ec5fe2481a18bca5b89ab8c`.
Raw JSON: `/private/tmp/hollowbane-warrior-equipment/attachments-1.json` and
`attachments-2.json`; temporary evidence is not committed. Blender initially
crashed in sandbox Metal initialization before running Python; the same approved
binary succeeds with normal native access. This is not a render/performance test.

Four focused suites pass14 tests: production selection/provenance, equipment
transactions, equipment content and derived statistics. TypeScript/production
build, ESLint and document formatting pass. Runtime, source art and saves are
unchanged; no browser screenshot/E2E or new native timing evidence is claimed.
No new CI/Pages/hosted run: this is a local recoverable audit increment preceding
public Checkpoint A. Continue from the shield proof checkpoint above: finish
missing rasters and all-direction motion before renderer integration. The full Q3-B
assignment remains incomplete; this checkpoint is a session-budget split.
