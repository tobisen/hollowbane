# Q3-A Warrior combat — DBL-023/024/025/026

2026-10-26. The **extended Warrior production request** now authorizes C1–C9
sequentially through final Warrior review. This supersedes the earlier Southeast
stop. Public Release A (eight-way attacks), B (ability/reaction/death), then C
(playable arena and final review) each require exact CI, Pages and hosted
acceptance before advancing. Preserve simulation, saves, balance, Phaser4.2.1,
the approved source rig, live graphics and unrelated edits. No other class art
or normal-game sprite activation is authorized.

## Release B — VERIFIED; Phase5 arena next

Verified deployed **cf2f01f5644d6963adea5b6f9e1b687ecc2b0c16** /
[CI40409917180](https://github.com/tobisen/hollowbane/actions/runs/40409917180):
required Full unit/validators/tooling, all four Chromium shards, required
compatibility, Pages, hosted exact-SHA flow and Release acceptance PASS.
Independent sealed/local/public verification matches **all110 reviewed/tested
files byte for byte**. All26 pre-existing developer asset files also match Release
A exactly. Four independent hosted cases pass: actual two-skill activation/resource/
cooldown semantics, interrupted weapon/ability hit recovery with shipped recoil,
cast-to-death/held corpse/reset, and normal-entry isolation. Hosted activation,
interruption and light corpse captures were inspected.

[Release B ability/reaction/death showcase](https://tobisen.github.io/hollowbane/?developer=1&warriorPilot=1&warriorCombat=1&warriorAbilities=1&warriorDeath=1).
Primary/secondary remain on the attack route; movement on its existing showcase.
This is **not yet the complete playable arena**, final Warrior art approval or
production adoption. Phases1–4 are delivered; Phases5–8 remain incomplete and
authorized. Session-capacity checkpoint: the verified B release is safe to resume
without repeating rendering, profiling or deployment. No execution continues
after this session ends.

Next concrete implementation: integrate an isolated developer arena using owned
`createCombat`/`createSkills` state, existing `commandCombat`/skill intents,
`controllerInput`, collision navigation and `warrior-cadence.ts` displacement-phase
mapping. Compose all five atlas sets with the existing pure attack/ability/hit/
death selectors; observe every real simulation tick. Keep per-frame diagnostics,
old/new toggle, roots/actual feet, reset and representative existing hostile actors.
No normal saves/progression/quests/inventory owner. Verify movement/controller,
interruption, fast facing changes and terminal states, then matched native arena
performance before exact Release C. Handle presentation transitions without
adding gameplay clocks or animation callbacks. Existing349.25MiB texture payload
must be measured in the complete arena before any targeted optimization.

Raw/seal/hosted evidence: `/private/tmp/hollowbane-warrior-death`,
`/private/tmp/hollowbane-warrior-release-b-sealed`,
`/private/tmp/hollowbane-warrior-release-b-hosted.sh`. Machine release fields in
`ability-review.json`, `reaction-review.json` and `death-review.json` name the
verified B runtime. The local-production/failure chronology below is retained;
its pending gate notes are superseded by this completed acceptance.

## Release B production and review history

Phase3 adds **eight death clips /128 poses**; total candidate inventory is now
**72 clips /880 poses** across movement, two attacks, two existing abilities,
shared guarded-hit recovery and death. Death atlases total **3,401,111bytes /
98MiB** base RGBA; metadata200,065bytes. All five current sets total
**23,458,595PNG bytes /349.25MiB** base decoded payload, excluding historical
pilots, browser copies, driver overhead and any mipmaps. Death preview uploads
movement+attacks+reactions+death274.25MiB; the ability/death route substitutes the
ability atlases for attacks at the same decoded size. The later arena will need
all349.25MiB unless measurement justifies a targeted change.

`assets/source/q3/warrior-death/render.py` retains the original Blender4.5.3 rig,
camera/light/material identity and pixels per meter. The first416px window failed
the strict eight-pixel envelope (east pose10 x=1.77px); it was rejected before
packaging. A fixed448px window translates original pixels(+96,+64), root224,274;
four projection probes prove unchanged scale. Final complete vertex envelope is
x9.79888..438.201 /y81.7047..360.28146, within the unchanged eight-pixel margin.
No per-pose fitting, resizing or mirroring.

Motion: planted knee collapse, accelerating backward fall, arm release, heel
contact and restrained settle. Inspection demonstrated hovering heels and arms
retaining their brace; actual shoe-bound contact and connected two-bone IK now
resolve these late poses. An initial fixed-ankle trial correctly failed toe/ground
penetration by3.9mm and was rejected. All128 poses retain bone lengths/connected
limbs/root. Mesh-ground minima stay0.002m±0.00000005; final heels touch that same
plane. Only affected late SE poses were rerendered; unchanged early frames were
retained, and unaccepted directional work was stopped before correction. Source
logs/rejected trials remain in `/private/tmp/hollowbane-warrior-death` and adjacent
logs. No existing movement/attack/ability/reaction atlas was regenerated.

Frame0 copies approved directional idle0 exactly; frames13–15 copy the same
settled pixels, eliminating terminal flicker. `warriorDeathFrame` consumes the real
death-event tick and existing30-tick presentation duration, yields for every live
phase and holds pose15 indefinitely. A corpse without observed entry uses its
settled pose. No resurrection/despawn/corpse rule or animation-triggered damage.
Append `&warriorDeath=1` to the combat/ability preview; actual lethal diagnostics
can interrupt a cast or hitstun, and only explicit reset recreates the fixture.
All canvas/stage roots preserve model scale despite wider cells; foot overlays
follow recorded actual death-pose positions.

Diagnostic hits previously occurred just before tick advancement, so the shipped
comparison missed their recoil/death cues. They are now recorded at their real
event tick before advancement. An added browser assertion proves shipped recoil;
the prior reaction comparison is retained with this limitation. Corrected native
repeat (three cohorts/source, reset before warmup): shipped/candidate p5016.7,
p9518.6/p99≤18.7ms, longest candidate18.8ms, zero>25ms/drift. No improvement claim.

All128 packaged poses/light-dark and browser captures reviewed: knee collapse,
held weapon, terminal contacts and silhouette remain coherent, with no clipping
or matte halos observed. Sculptural finish, fast existing fall, stiff cloak and
front/rear foreshortening remain limitations, not final user art approval.
**39 focused unit/asset cases /22 Chromium** pass, including every death/reaction
direction, actual cast interruption without release, terminal hold under extra
damage, explicit reset, resource/cooldown behavior, corrected shipped recoil and
normal-entry/storage isolation. TypeScript/build, affected lint/format and complete
asset validation pass. Native visible Chromium156/M4 Metal1280×800/DPR1 captures
all eight deaths at1×/.25×:16 sequences, each terminal15/dead/HP0 with zero skill
effects. Every1× timed strip was reviewed. Three matched pairs, reset before60-frame
warmup,240 measured intervals/cohort, identical274.25MiB texture payload resident:
shipped p5016.7/p9518.7/p9918.7ms; candidate p5016.6–16.7/p9518.6–18.7/p9918.7ms.
Longest18.8ms, zero>25ms/zero root-camera drift. Warmed preview-ready883ms is one
observation, not a cold-load estimate. No improvement/full-forest/physical/GPU-memory
claim. Evidence `death-review.json` and retained110-file tested local inventory.
Release B candidate **a0725264da6c4d340abc0f4126784c0fc7989419** is committed/pushed.
[Exact CI40409500741](https://github.com/tobisen/hollowbane/actions/runs/40409500741)
failed only STATUS.md formatting after TypeScript/lint passed; Full/Pages/hosted
were skipped. Three newly added Markdown bullets are repaired in the successor.
Runtime/art and all110 reviewed/tested bytes remain unchanged. Require the successor
exact Full/Pages/hosted acceptance before arena integration. Successor
**cf2f01f5644d6963adea5b6f9e1b687ecc2b0c16** is pushed;
[CI40409917180](https://github.com/tobisen/hollowbane/actions/runs/40409917180)
is in progress. Its local seal matches all110 reviewed/tested files.

Phase2 is also locally verified: **eight guarded-hit clips /48 poses**, original
rig/camera/materials, fixed320px/root160,274 and exact approved idle recovery
endpoint. Source `warrior-reactions/render.py`; manifest/atlases
`public/dev/warrior-reactions`. **1,381,134bytes /18.75MiB** decoded; total candidate
payload251.25MiB. Reaction preview uploads attack+movement+reaction176.25MiB; total
GPU/browser memory remains unmeasured. All48 packaged poses/light/dark and16 native
1×/.25× timed strips reviewed. Restrained recoil/short existing recovery remain
quality limits. No normal sprite or gameplay change.

`observeWarriorHit` records actual remaining hitstun at entry after each simulation
step, including actor-order differences; `warriorHitFrame` fits six poses to those
remaining ticks. Guarded follow-up damage cannot restart it; idle/death immediately
yield. The preview's diagnostic hit controls call the real damage/guard resolver;
they add no stun mechanic. Route: append `&warriorReactions=1` to the combat or
ability preview.13 focused units and11 Chromium cases pass: all eight directions,
real weapon/ability interruption before release, zero fabricated strikes/effects,
guarded small hit without duration restart, exact idle release, stable root/camera,
normal-entry/storage isolation, plus representative prior ability/attack cases.
TypeScript/build, affected lint/format and asset validation pass. One earlier
browser run against the superseded build was interrupted and is excluded.

Native Chromium156/M4 Metal1280×800/DPR1, three matched isolated repeated-real-hit
pairs with identical resident textures: candidate p5016.7/p9518.1–18.6/p99≤18.7ms,
longest18.8ms; shipped p9518.3–18.7ms. Zero>25ms/zero camera drift. No improvement,
full-forest, cold-load or physical-device claim. Warmed ready951ms is one sample.
Evidence: `reaction-review.json`, `/private/tmp/hollowbane-warrior-reactions`.
Phase1 local commitdb03685 remains intact; Phase3 death is next. Release B is not
published and the playable arena has not begun.

The2026-10-26 overnight request authorizes sequential abilities, reactions/death,
Release B, then the disposable playable arena and Release C. No new mechanics,
other class art, normal-game sprites or save changes. Release A's exact public
gate is now independently closed (below); Release B remains pending.

Class-tree and runtime review identifies exactly two implemented Warrior active
abilities: **iron-fan / Sundering Fan** (physical melee variant with the existing
guarded stagger) and **oath-echo / Oath Echo** (self power effect with the existing
Warrior armor synergy). Planned Bulwark/mastery nodes have no implemented ability;
there is no separate battle-cry or block mechanic to invent. Player reactions use
one existing guarded hitstun state, not distinct light/heavy stun rules.

Source `assets/source/q3/warrior-abilities/render.py` reuses the unchanged approved
v2 blend,135 meshes/15 bones, materials/lights and camera. Fixed320px overscan
retains Release A's model scale/root160,274. Two original twelve-pose motions per
view: loaded sword stroke and braced offhand guard. All eight complete-geometry
views are rendered without mirroring. Four idle endpoints per view reuse exact
approved idle pixels. No movement or attack atlas has been regenerated.

**16 clips /192 poses**, eight atlases **5,368,546bytes /75MiB** base RGBA payload;
minimum visible alpha clearance15px. Movement82.5MiB + attacks75MiB + abilities75MiB
is **232.5MiB** total candidate texture payload, excluding historical pilot textures,
copies and GPU overhead. Ability preview loads movement+ability textures157.5MiB;
it does not upload the attack atlases. Total GPU/browser memory remains unmeasured.
Every pose is audited for root, bone length, connected limb joints, fixed rotated
feet and weapon containment. Fingerprinted source/packager/rig/movement provenance
and developer-placeholder status are recorded in the manifest and asset registry.

Route: `?developer=1&warriorPilot=1&warriorCombat=1&warriorAbilities=1`.
The isolated seeded rank1 Warrior fixture uses real `requestSkill`/`stepSkillCombat`.
`warriorAbilityFrame` reads the accepted cast sequence and current combat timeline;
pose5 is the existing active-entry release, with no damage/skill callbacks. It
yields immediately for interruptions, death, idle, stale sequences and unrelated
skills. Base timing remains12/1/18 and10/1/16; speed breakpoints, mana and cooldowns
are unchanged. Sundering's30-tick cooldown expires during recovery; Oath's240-tick
cooldown still rejects immediate reuse. The preview never opens normal storage.

All packaged poses were reviewed at gameplay scale with dark/light coverage.
Feet/root and armor/weapon remain coherent; no frame-edge clipping or matte halos
observed. Restrained hip/torso weight transfer, rapid existing activation, twelve
sample poses, sculptural finish and front/rear weapon occlusion remain limitations.
All22 focused units (new abilities plus unchanged attack selectors/assets) and12
Chromium cases pass: eight directions/two skills, exact real activation, one
effect, resource/cooldown semantics, facing/root stability, storage isolation and
existing attack preview behavior. TypeScript/build, affected lint/format and asset
validation pass. Native visible Chromium156/M4 Metal1280×800/DPR1 captures all16
clips at1×/.25× (32 sequences); each ends idle with exactly one real effect.
Representative timed strips were inspected. Three matched isolated-preview pairs
with identical resident textures give candidate p5016.7/p9517.0–17.2/p9917.6ms,
longest17.7ms, zero>25ms/zero camera drift; shipped p9516.8–17.4ms. This is not an
improvement/full-forest/physical-controller claim. Warmed ready894ms is not a cold
load measurement. Machine evidence: `ability-review.json`; local tested inventory90
files. Phase1 is locally verified; continue Phase2/3. No final user art approval,
Release B publication or arena completion is claimed. Retained renders/evidence:
`/private/tmp/hollowbane-warrior-abilities`; do not repeat successful renders.

```sh
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-abilities/render.py -- /private/tmp/warrior-abilities se n e s w ne sw nw --audit
node scripts/package-warrior-abilities.mjs /private/tmp/warrior-abilities
node scripts/validate-warrior-abilities.mjs
node scripts/profile-warrior-combat.mjs http://127.0.0.1:4174/hollowbane/ /private/tmp/warrior-abilities-native abilities
```

## Release A — eight-direction attack candidate

The approved release **e498ce6fc16412a578f46e67735d2d61bbac3e51** was independently
rechecked before production: CI40366831084 and every required Full/Pages/hosted/
Release acceptance job succeed; public release.json reports that exact SHA.

C1 review retains the approved SE motion and its twelve-pose sampling. At the
gameplay footprint the anticipation, descending cut/returning sweep and recovery
are readable. Restrained torso/hip transfer and rapid active-entry changes remain
visible in enlarged inspection. No visual improvement is claimed; adding samples
would not by itself improve weight transfer or alter the fixed strike boundary.
Do not treat this retention decision as final user art approval.

C2 adds seven complete-geometry views of the same two motions, **16 clips /
192 poses** including the copied SE reference. No mirrored asymmetric equipment,
new model, material, lighting, motion or gameplay timing. Source:
`assets/source/q3/warrior-attack-directions/render.py`. Approved combat/movement
sources and their original atlases remain byte-identical. All four endpoints per
view reuse approved directional idle0 pixels exactly, retaining the leg-snap fix.

The first audit correctly rejected the old window: weapon coordinates ranged
x=-15.426..271.426 /y=-41.764..234.737 in the original256px projection. The fixed
**320×320** overscan translates original coordinates by **(+32,+64)** to root
**160,274**. Native640px render,2:1 reduction, unchanged pixels per model meter and
display scale0.5. A camera ortho/shift adjustment enlarges only the window; four
projection probes assert the constant translation. No per-pose fitting, shrinking
or repositioning. Existing SE256px validators remain unchanged. New validators
retain the eight-pixel alpha/weapon margin and permit only0.001px projection
roundoff. The first new validator's exact-float root comparison rejected
159.99993,274.00002; it was aligned with the source audit's existing tolerance.

Eight1920×1280 PNGs total **5,369,611bytes /75MiB** base-level decoded RGBA,
metadata229,776bytes. The eight movement textures also resident in the preview
add82.5MiB;157.5MiB combined is texture payload, not total GPU/browser memory.
Provenance fingerprints renderer, packager, approved attack rig/atlas and movement
manifest. The asset inventory retains developer-placeholder status.

Route: `?developer=1&warriorPilot=1&warriorCombat=1&warriorAttackDirections=1`.
Direction selection places the real disposable target along that heading; actual
targeting locks facing. The unchanged selector consumes real12/2/18 combat ticks
and active-entry poses5/17. Phaser stage, gameplay/enlarged canvases, old/new switch,
root/feet, stepping,0.25×/1× and reset remain isolated from saves. The normal entry
never fetches the directional preview or atlas. Full movement/enemy/ability arena
integration remains C6/C7, after the A/B public gates.

All192 packaged stills were reviewed at gameplay scale with dark/light coverage;
cardinal source sheets were reviewed before diagonal production. No frame-edge
clipping or distracting matte halos observed. Foreshortening/occlusion, especially
front/rear sword views, sculptural posture and restrained weight transfer remain
quality limitations. Timed playback/native/release results are recorded in
`attack-directions-review.json`; no final Warrior or production approval yet.

Local19 focused asset/negative/selector tests and12 Chromium cases pass, including
all16 real attacks, one strike/sequence, pre-strike HP, all eight facing locks,
root/camera stability, idle recovery and storage isolation. TypeScript, affected
ESLint/Prettier, complete asset validation and build pass. No unrelated local
loot/campaign regression, physical-controller or new full-forest performance
claim. Mandatory CI remains governed by the existing risk classifier.

Native visible Chromium156.0.8078.4 /Apple M4 Metal,1280×800/DPR1: all16 clips
captured at1× and0.25× (32 sequences), with one observed real strike and idle
return each. Slow captures observe all32 ticks; some1× captures observe30–31
distinct ticks because inspection can coalesce ticks between rendered frames.
This is not a zero/double simulation-tick measurement. Timed strips and gameplay
captures were reviewed; the same posture/foreshortening limitations remain.

Three alternating matched isolated-preview pairs,240 measured intervals each,
secondary replay at real combat timing, camera2, identical atlas residency:

| Pair | Shipped p50/p95/p99 ms | Candidate p50/p95/p99 ms | >25ms |
| ---- | ---------------------- | ------------------------ | ----- |
| 1    | 16.7/17.8/18.5         | 16.7/18.1/18.5           | 0/0   |
| 2    | 16.7/18.2/18.4         | 16.7/18.2/18.6           | 0/0   |
| 3    | 16.7/18.0/18.6         | 16.7/18.2/18.5           | 0/0   |

Zero camera drift, longest candidate18.7ms. One555ms warmed preview-ready
observation is not cold-load evidence. No improvement, full-forest regression,
GPU-memory, physical-controller or other-hardware claim follows from this sample.

Raw source renders, diagnostic rejection, review sheets, timed/native evidence
and80-file tested-build inventory:
`/private/tmp/hollowbane-warrior-attacks-eight` (logs adjacent). Do not rerender
accepted pixels unnecessarily. Use the reproduction commands below with the new
renderer/packager and `directions` profile argument. Candidate **066527e9e14c76f22d68588797780774e59f69f6** is committed/pushed.
[CI40386255337](https://github.com/tobisen/hollowbane/actions/runs/40386255337)
passes required Full, every Chromium shard, required compatibility, Pages, hosted
exact-SHA flow and Release acceptance. Independently rechecked on2026-10-26: public
release.json names this exact SHA; its complete80-file inventory and every fetched
public file match the reviewed local inventory byte for byte. Two independent
hosted cases pass (SE primary/secondary timing and normal-entry isolation);
impact/light-idle screenshots reviewed. Verified deployed SHA is **066527e**.
This closes Release A; the overnight continuation authorizes Release B next.
Original successful movement/attack pixels remain preserved.

```sh
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-attack-directions/render.py -- /private/tmp/warrior-attacks n e s w --audit
# Render controlled cardinal, then diagonal batches only when needed; SE/endpoints are copied.
node scripts/package-warrior-attack-directions.mjs /private/tmp/warrior-attacks
node scripts/validate-warrior-attack-directions.mjs
node scripts/profile-warrior-combat.mjs http://127.0.0.1:4173/hollowbane/ /private/tmp/attack-review directions
```

The original Checkpoint A evidence below is historical; its stop has been
superseded by the extended request, while its approved pixels remain preserved.

## Southeast pilot

Two nonlooping clips, **12 poses each /24 frames**. Primary is a descending
diagonal cut; secondary is a returning sweep. Both use the same existing melee
action; they do not introduce a second gameplay mechanic. Anticipation0–4,
impact5, recovery6–11. Original Blender4.5.3 v2 rig:135 meshes/15 bones, rigid
hand-bound sword, fixed materials/lights/camera/scale/root. No mirroring, external
art, new placeholders or regenerated movement assets.

Source: `assets/source/q3/warrior-combat-se/{motion.py,warrior.blend,rig.json}`.
Runtime: `public/dev/warrior-combat/{warrior.png,warrior.json}`. Atlas1536×1024,
transparent256px cells, root128,210, display scale0.5; **726924bytes /6MiB RGBA
base-level decoded**. Metadata fingerprints producer, source blend, base rig,
reference, atlas and every cell. Normal entry never fetches this preview/atlas.
Decoded payload is not total browser/GPU memory, which remains unmeasured.

Route: `?developer=1&warriorPilot=1&warriorCombat=1`. Phaser stage, gameplay128px
and enlarged384px comparisons, old/new stage switch, camera1/2, dark/light,
root/foot guides, one attack, reset, pause, tick stepping and1×/0.25× playback.
Replay resets the explicitly disposable encounter after recovery and idle.
No inventory, saves or normal scene is opened. Slow playback changes only the
inspection clock; real combat still consumes unchanged60Hz ticks.

## Visual and synchronization review

All24 poses and actual native timed playback of both clips at1× and0.25×,
gameplay/enlarged views, dark/light edges, impact and return were inspected.
Agent visual review passes for this isolated Southeast pilot. Anticipation,
descending versus returning arcs and recovery are distinguishable; sword stays
attached, feet/root remain stable, and no cell clipping/distracting matte halos
were observed. Minimum visible alpha clearance **14px**, above the unchanged8px
policy. Torso weight transfer remains restrained; twelve-pose sampling, a rapid
one-tick impact change and secondary weapon foreshortening are limitations.
This is not user art approval or authorization for production adoption.

Timed review demonstrated a leg snap: drafts used the straight-leg rest pose
instead of approved bent-knee idle. The attack source now applies motions to that
approved neutral pose. All four attack endpoints match approved idle0 RGBA pixels
**exactly**, with a regression test. Movement pixels remain untouched. The
misplaced preview shadow was also anchored to the real projected root. Only
affected attack frames were rerendered; initial failed trials remain local.

Preview commands use `commandCombat` and `stepCombat` on a seeded disposable
world. `warriorAttackFrame` consumes its actual timeline; frame5/17 starts at
active entry, the real strike boundary, and is held through the existing two
active ticks. Recovery then yields to idle. It creates no strike clock or damage
events. Tests observe real windup, no early damage, one active event/sequence,
target damage and idle return. Both variants preserve12/2/18 timing. Repeated
button input is rejected while queued or committed; facing remainsSE/index7.
Shipped comparison consumes the same timeline and original `combatPose` cues.

## Checks and native evidence

Local18 focused asset/negative/endpoint/selector/timeline tests pass. All11
Chromium attack/cadence/directional preview cases pass; screenshots inspected.
TypeScript, affected ESLint, complete asset validation and build pass. Existing
risk-based CI classifies shared-entry/tooling changes; no tier override or
weakened assertions. No unrelated campaign/loot/full suite was run locally.

Native visible Chromium156.0.8078.4, Apple M4/Metal,1280×800/DPR1. Three alternating
isolated-preview pairs,240 measured intervals each, secondary replay at real
timing, camera2, all preview textures resident in both sources:

| Pair | Shipped p50/p95/p99 ms | Candidate p50/p95/p99 ms | >25ms |
| ---- | ---------------------- | ------------------------ | ----- |
| 1    | 16.7/18.3/18.5         | 16.7/18.2/18.4           | 0/0   |
| 2    | 16.7/18.1/18.6         | 16.7/18.5/18.6           | 0/0   |
| 3    | 16.7/18.3/18.6         | 16.7/18.2/18.6           | 0/0   |

Zero camera drift; longest candidate18.6ms. One local preview-ready observation
224ms with warmed OS cache is not a general cold-load claim. No performance
improvement is inferred.

The matching P2 peaceful forest seed42/layout2 route uses full detail,1138
objects/one actor/no particles and starts(-14,-10.5), with359 frames per input.
Both cohorts draw all eight approved movement textures through the existing
test driver only. The candidate additionally uploads/retains the attack texture;
it does not play attacks in the forest. Actual attack drawing is measured above.

| Input              | Movement baseline p50/p95/p99 ms | With attack atlas resident ms | >25ms |
| ------------------ | -------------------------------- | ----------------------------- | ----- |
| Keyboard           | 16.7/17.7/18.5                   | 16.7/17.2/18.5                | 0/0   |
| Virtual controller | 16.7/17.8/18.5                   | 16.7/16.8/18.2                | 0/0   |

Zero zero/double ticks, uniform3.10455px camera steps and zero relative drift in
all four cohorts. The extra atlas is6MiB base-level RGBA; browser/GPU overhead
and copies remain unmeasured. One forest pair is not an improvement estimate.
No observed P2 pacing regression in these limited warm measurements. Original
Q3 measurements remain in warrior-movement.md; fresh matched measurements avoid
comparing different scenes directly. Checkpoint A has now passed exact release acceptance as recorded below.

Raw final motion strips/native report:
`/private/tmp/hollowbane-warrior-checkpoint-a/final`; renders and discarded
pre-repair evidence: `/private/tmp/hollowbane-warrior-checkpoint-a`. Concise
machine evidence: `combat-review.json`. No physical-controller or other-hardware
verification. Do not start any next animation batch after this checkpoint.

## Checkpoint A — RELEASE VERIFIED

Verified deployed runtime **e498ce6fc16412a578f46e67735d2d61bbac3e51**,
[CI40366831084](https://github.com/tobisen/hollowbane/actions/runs/40366831084):
required Full units/validators/tooling, all four Chromium shards, required
cross-browser cases, Pages, hosted exact-SHA flow and Release acceptance succeed.
The sealed CI artifact matches all70 locally reviewed/tested file hashes.
Independent public verification matches the exact SHA and all70 hosted bytes.
All **three hosted attack-preview smoke cases pass**; primary/secondary impact,
light background and shipped comparison captures were inspected. No additional
runtime changes or rebuild were needed after local/native review.

[Public Southeast attack preview](https://tobisen.github.io/hollowbane/?developer=1&warriorPilot=1&warriorCombat=1).
This closes Checkpoint A only. **STOP**; do not produce other directions,
casting, reactions or death, and do not activate these graphics in normal play.
User art/production-adoption approval remains false. This final evidence closure
is documentation only; the accepted runtime SHA above remains authoritative.

## Reproduce

```sh
# Reuse retained successful renders; rerender only demonstrated changes.
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-combat-se/motion.py -- /private/tmp/warrior-combat --audit
node scripts/package-warrior-pilot.mjs /private/tmp/warrior-combat combat
node scripts/validate-warrior-attacks.mjs
node scripts/profile-warrior-combat.mjs http://127.0.0.1:4173/hollowbane/ /private/tmp/attack-review
```

Omit `--audit` only when rendering is necessary. Native executable remains at
`/private/tmp/hollowbane-q3-recovery/blender-mount/Blender.app/Contents/MacOS/Blender`.
The old overnight orchestrator is not used.
