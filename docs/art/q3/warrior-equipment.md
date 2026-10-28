# Q3-B Warrior equipment compatibility — DBL-023/024/025

2026-10-28. User authorizes modular Warrior equipment work through public
Checkpoints A/B/C. This supersedes the earlier production-publication stop for
this scope. Other classes, monsters, balance, saves and Phaser4.2.1 remain intact.
This is the initial audit and metadata feasibility increment, **not Checkpoint A**.
Prior accepted production evidence revision: `ee03e81964bb597636aa2d96f64716268e5c1d81`;
accepted runtime/evidence is described in [warrior-production.md](warrior-production.md).
No new publication or equipment visual support is claimed here.

## Actual compatibility matrix

Only three main-hand bases and one offhand base exist. Names below are repository
base IDs; advanced/unique/set/socketed instances retain those bases. Level,
identification and configured attribute requirements still apply. There are no
class-specific equipment restrictions in `equipment.ts`.

| Configuration                 | New renderer now  | New art needed                                                | Motion needed                                                                                          | Grip/attachment data                                          | Existing motion reuse                             | Temporary fallback                                          |
| ----------------------------- | ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `ash-blade`, empty offhand    | Yes               | No; approved sword is baked in                                | No                                                                                                     | None for current baked renderer                               | All 72 clips                                      | Only debug override, failed loading or committed projectile |
| `ash-blade` + `bark-guard`    | No                | Original shield; inventory SVG is only a silhouette reference | Shield fit must be checked in every state; targeted adjustments if demonstrated necessary              | Left-hand grip, full projected orientation and body occlusion | First candidate for reuse; not visually verified  | Yes, until verified                                         |
| `reed-bow`, empty offhand     | No                | Original bow plus shared sword-free body solution             | Bow draw/release and two-hand coordination; sword strikes do not establish compatibility               | Both-hand grip; projectile timeline alignment                 | Locomotion/hit/death may be reusable after review | Yes                                                         |
| `cinder-staff`, empty offhand | No                | Original staff plus shared sword-free body solution           | Actual melee staff choreography needs visual review; current sword strike is not accepted staff motion | Two-hand grip and staff/body occlusion                        | Locomotion/hit/death may be reusable after review | Yes                                                         |
| Empty main, empty offhand     | No                | Shared sword-free body solution                               | Unarmed attack not authored                                                                            | Empty-hand pose data                                          | Non-attack states may be reusable                 | Yes                                                         |
| Empty main + `bark-guard`     | No                | Shield and shared sword-free body solution                    | Unarmed/shield coordination not authored                                                               | Left grip and occlusion                                       | Must be reviewed                                  | Yes                                                         |
| Bow/staff + offhand           | Invalid equipment | —                                                             | —                                                                                                      | —                                                             | —                                                 | Existing transactions displace conflicting equipment        |
| Unknown future base           | No                | Audit when introduced                                         | Audit when introduced                                                                                  | Audit when introduced                                         | No assumption                                     | Yes, fail closed                                            |

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

Next: create one original `bark-guard` mesh on a left-hand grip in a separate
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
public Checkpoint A. Resume with the isolated shield/grip/occlusion visual proof
above, then extend pose coverage before renderer integration. The full Q3-B
assignment remains incomplete; this checkpoint is a session-budget split.
