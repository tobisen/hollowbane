# Q3-B Warrior equipment compatibility — DBL-023/024/025

2026-10-28. User authorizes modular Warrior equipment work through public
Checkpoints A/B/C. This supersedes the earlier production-publication stop for
this scope. Other classes, monsters, balance, saves and Phaser4.2.1 remain intact.
This includes the shield proof, opt-in showcase and now the local campaign
vertical slice below. **Checkpoint A is verified** at
`8fece2b98325991e2116d6de25e12aba5908d089`; see the acceptance section below and
[warrior-production.md](warrior-production.md). Historical sections retain their
then-current counts and restrictions.

## Showcase startup release — verified 2026-10-29

The remaining failure is `equipment study switches and falls back without changing
the frozen encounter or opening saves`. It fails before selection: the45-file
Phaser preload is capped at **two** requests. Published native starts reproduce
**6.258s cold**, with two further fresh-context starts2.378/2.768s; cached reloads
0.533–0.548s. CDN/connection/OS/GPU caches were not reset. The five-second check
exposes actual loading, not a hidden control or incorrect quest state.

The developer-only queue is now bounded at **four**. No atlas is skipped, deferred,
duplicated or registered twice. Campaign loading is unchanged. Explicit events
`hollowbane-warrior-arena-startup` and Performance marks record page loaded,
assets loading/loaded, renderer ready, input ready, interactive and first trusted
control interaction. Public read-only diagnostics are
`window.hollowbaneWarriorArenaStartup`. Controls/stage remain inert until every
required texture (including Original) exists, handlers are bound, the real first
render completes and its state snapshot exists. Failed required resources leave
readiness false and input inert. `readyMs` now includes that first render.

Three balanced matched pairs on native M4/ANGLE Metal,1280×800/DPR1, controlled
150ms latency/20MiB/s download/10MiB/s upload:

| Queue | Cold interactive | Successful Pause observed | Reload interactive |
| ----- | ---------------- | ------------------------- | ------------------ |
| 2     | 6.111–6.168s     | 6.190–6.247s              | 5.316–5.594s       |
| 4     | 3.849–3.901s     | 3.927–3.980s              | 3.456–3.508s       |

These local-preview reloads revalidate under injected latency; they are **not**
the cached hosted reload measurements above. A generated local diagnostic bundle
switches only the cap2/4 in balanced orders, then restores it; no source/art is
modified by the comparison. Twelve cohorts each have45 completed files,44 unique
developer requests,42 textures and373.25MiB calculated base RGBA, zero runtime/
request errors and zero>25ms over720 post-ready frame intervals. Four-way loading
has a68.5ms maximum during reload versus35.3ms at two; cold maxima35.2/33.5ms.
This loading-stage tail increase remains explicit; no combat-stall improvement or
GPU-residency claim. Matched data precede only removal of the startup error
observer after completion; exact final published measurements appear below.

Two new browser cases hold a real required request and inject404, proving that
ready/input cannot appear early and that the first real click works. Existing
five-second startup/UI assertions and60s case bounds are unchanged. A wider
native run exposed an independent facing-driver reset race: trace reads stale
previous-gait distance2.4 after Reset while the new fixture is at0, holding Run
until excessive travel reaches an obstacle. The driver now waits for the normal
published0-distance reset snapshot; every displacement/gait/eight-facing/camera
assertion and deadline remains. The original failure is retained; the repaired
case passes three times.

**14 units/two files**, strict TypeScript, full lint, formatting and build pass.
**16 distinct native Chromium cases** pass across bounded runs (initial15,
repaired facing3×), plus **eight Firefox/WebKit** readiness/selection/resource
cases. Captures reviewed. Final164-file build retains161 accepted hashes; only
the arena/entry JavaScript and HTML entry reference change. Every approved image,
atlas JSON and campaign chunk is unchanged: art/PNG/atlas/RGBA delta0.

**Verified deployed: `c437335844e4f82e30b00da2967d4f64c9614a64`.** Exact
[CI40950346938](https://github.com/tobisen/hollowbane/actions/runs/40950346938)
passes Full/Pages/hosted/Release acceptance: **682 units/150 files,317 Chromium
(89+75+61+92),15 compatibility**, zero skips/retries in retained browser reports.
All164 tested/CI/public hashes match. Independent native hosted **24/24** pass:
all original22 plus two new readiness cases. This includes quest rewards once,
reload, real drag/subsequent clicks, equipment selection, three terrains, area
travel, cross-class isolation, both abilities, eight facings, death and resources.
Camp/showcase/combat/corpse captures reviewed. No new category or B/C acceptance.

Actual published three cold/cached pairs: **16.730/0.528s,3.744/0.574s,
3.540/0.692s**, successful Pause observed16.825/0.586s,3.827/0.625s,
3.637/0.743s. All six complete45 files,42 textures,373.25MiB calculated base
RGBA and zero runtime/request errors. Across360 post-ready intervals, one>25ms
(max33.3); no GPU-memory claim. The diagnostic observes up to30s to retain slow
starts; original browser5s readiness assertions and60s case bounds are unchanged.

**The cold target is not met in every published sample.** The first cold spends
13.82s loading assets after a2.88s preload start:27,725,858 transferred bytes over
13.797s (**1.92MiB/s**, maximum response wait1.292s). Subsequent same-byte cold
transfers reach7.77/8.16MiB/s; cached asset transfer is0. This is retained evidence
of a throughput/response-time limit, not a discarded flaky run. Four-way loading
fixes the controlled request-queue bottleneck but cannot establish a universal5s
connection target. Further payload/deferred-loading work is a measured follow-up;
no early readiness or timeout relaxation. Functional startup release gate passes.

Additional unmatched native M4/Metal forest battle:548 intervals,p5016.7,
p9518.7,p99281.4,max414.8ms,12>25;16 actors/42 textures,1280×800/DPR1/Full.
Existing checkpoint stalls remain; no improvement/regression attribution from
this unmatched sample. Resource cycles remain42→0→42; art/atlas/RGBA delta0.

Raw evidence: `/private/tmp/hollowbane-q3-startup/{baseline-hosted,matched-native,native-ui,facing-reset,compat-ui}`.
`measure.mjs` retains the exact protocol, real milestone/resource timings and
trusted Pause outcome; source changes are presentation-only. The preliminary
client comparison correctly allows the changed HTML entry reference alongside
two JavaScript chunks; all non-entry assets are byte-identical.

### Exact startup release / safe resume

Startup release is accepted at **c437335844e4f82e30b00da2967d4f64c9614a64**,
preserving `eecb977`, `8a48dc9` and all unrelated edits. CI40950346938 is complete
and successful; all164 files and24 independent native hosted cases are verified.
Evidence-only checkpoints remain local; do not republish solely to update this
record. Next bounded sword-free body proof through the approved deterministic
exporter before genuine staff/bow/unarmed choreography or any mass export. B/C
remain incomplete, unsupported categories retain legacy. Keep the measured slow
cold-transfer target limitation and combat stalls explicit. Raw evidence:
`/private/tmp/hollowbane-q3-startup/{accepted-ci.json,ci-complete,hosted-native,hosted-startup}`.

Read-only body audit while CI runs: all880 authored poses already expose projected
weapon bounds (mean2162–2995 pixels/pose; maximum5582). Summed unpadded rectangles
are9024324RGBA bytes, **not packed/runtime/GPU costs**; they omit shadow/reflection
changes and hidden-body reconstruction. The source has four separate sword meshes,
15 bones and rigid gauntlet/finger plates without finger bones. A pilot must test
reference rerender agreement, revealed hand/body pixels, antialiased edges and
sword-shadow changes before choosing clean shared atlases plus a sword layer or
localized runtime patches. The installed Phaser4.2.1 mask API exposes geometry
masks, not the old bitmap-mask/MultiPipeline recipe; do not introduce an assumed
Phaser3 renderer path. No new raster, weapon motion or compatibility is claimed.

## Southeast staff primary — timed pilot accepted for directional study

The new continuation inspects actual rules first: `cinder-staff` is two-handed,
**melee/range1.05**, without a staff projectile/cast mechanic. Primary keeps the
existing timing; campaign secondary retains its assigned skill. No damage,
cooldown, item or save changes. Production still falls back for staff.

`assets/source/q3/warrior-staff-se/motion.json` authors a distinct12-pose loaded
staff guard, forward contact, follow-through and exact guard return. The revised
original shaft is1.50m (1.55m including cap), retaining0.24m opposing hand grips;
actor scale/root are unchanged. Contact tip is approximately
(-0.001,-1.768,1.080)m: close to forward aim instead of the old raised diagonal
jab. The old1.75m static prototype remains historical, not accepted production art.

The deterministic rig probe's `--motion` mode audits **89 continuous samples**,
with exact palm contact, original bone lengths/connected joints/fixed feet/root
and zero shaft/non-hand body intersections. Rejected reach/armor-graze trials
are retained; no decorative armor check was removed. A fixed continuous elbow
pole removes the prior angle-dependent flip. Render only12 SE poses; no original
Warrior set rerender. Guard0/recovery11 pixels match exactly. Dark/light and native
1× gameplay/2× inspection captures show readable anticipation, coordinated hands,
forward contact at the existing range marker and a stable recovery.

`profile-warrior-staff-motion.mjs` bundles the **actual** pure timeline, attack
selector, equipment definition/stats and speed table into a disposable native
Phaser4.2.1 viewer. Four timings12/2/18,10/2/16,8/2/14,6/2/12 each have one strike
at ticks11/9/7/5; active always selects pose5. Hit/kill yield the primary selector.
Captures pause only after real simulation-selected frames render; no forced pose,
new damage callback or test timeout increase. The initial viewer fixture/syntax
errors are retained separately and corrected; they are not production regressions.

Final isolated native M4/ANGLE Metal: **18 completed attacks**,600 intervals,
p5016.7/p9516.8/p9918.3/max18.7ms,zero>25,zero runtime errors.
One trimmed2048×256 pilot atlas: **307784PNG bytes/2MiB calculated RGBA**.
This fixture draws two inspection scales, not the production encounter; GPU
residency and full staff packing remain unmeasured. Published increment stays0;
existing cold-transfer/combat-stall limits remain unchanged.

**13 focused tests/four files, TypeScript, scoped JS lint/syntax pass.** Native
captures/video and geometry/provenance are under
`/private/tmp/hollowbane-q3-staff-choreography`. Formatting-only input changes are
recorded by preserved consumed JSON and `input-equivalence.json`; parsed controls/
geometry are identical. No raster/hash claim is silently rewritten.

Accepted **SE primary pilot only**, sufficient to study remaining directions.
No staff production/ability/hit/death/category/B/C acceptance. Next audit/export
only the remaining seven primary facings and review occlusion/trim/root/impact;
then complete staff movement and assigned ability/reaction/death coverage before
any campaign integration. Keep bow/unarmed legacy. Last verified deployed SHA
remains **c437335844e4f82e30b00da2967d4f64c9614a64**. Keep this proof checkpoint local.

## Eight-direction staff primary — local proof 2026-10-30

The accepted SE motion now covers all eight facings. Reuse the12 existing SE
renders; export only84 missing primary poses. Direction rotations come from the
approved movement manifest. The same torso/grip authoring, rig, camera/scale and
deterministic exporter are retained; no mirroring or original Warrior rerender.
Combined **712 dense samples** (89 per direction) retain the same reach, palm,
shaft/non-hand body, ground, root and foot checks. All pass. Guard/recovery images
are exact per-direction aliases. Light/dark sheets and native actual-timed impact
captures have been reviewed across all facings, including rear cloak occlusion.

`scripts/review-warrior-staff-directions.mjs` checks reviewed source pixel hashes,
reuses the existing crop/packing code and verifies **96/96 CPU and native GPU
round trips**. All96 logical frames,88 unique rasters and8 guard aliases fit one
2048² diagnostic atlas: **2,706,094 PNG bytes /16MiB calculated base RGBA**.
This full-body primary-only artifact is not shipped or a complete category cost;
shared-body patches remain the intended resource investigation. No GPU-residency
or campaign-payload claim. Three native unload/reload cycles return **3→2→3**
textures (fixture-owned defaults/render target included), with no growth.

Native M4/ANGLE Metal, actual primary selector/timing at gameplay1× and inspection
2×, rotating all eight facings: **600 intervals, p5016.7/p9518.1/p9918.6/
max18.6ms,zero>25,zero runtime errors**. This is isolated motion playback, not
production encounter performance. Expanded tooling passes scoped lint/format and
Python syntax; the unchanged timing/packing modules already passed13 focused
cases and TypeScript in the SE pilot. No redundant full campaign regression for
an unpublished offline proof. A complete production change still requires the
specified focused and exact Full/Pages/hosted release gates.

**Staff remains legacy.** Primary-direction proof is accepted; locomotion,
assigned secondary abilities, hit, death, real equipment/save/area/resource
integration and B/C remain incomplete. Next executable action: cache approved
SE idle/walk/run bone/foot poses, keep the lower body unchanged and solve the
two-hand staff guard against existing torso motion. Render a bounded gait pilot
and inspect actual gait/primary handoff before any directional locomotion batch.
No new production categories. Sword alone/sword+shield remain supported;
bow/unarmed legacy. Last verified public SHA is still
**c437335844e4f82e30b00da2967d4f64c9614a64**; no CI pending. Raw evidence remains
`/private/tmp/hollowbane-q3-staff-choreography/{seven-dense,seven-render,eight-primary}`.
Keep this tooling/proof checkpoint local until a coherent category is complete.

## Southeast staff carry — local timed pilot 2026-10-30

`probe-warrior-staff.py --motion --carry` caches the hash-verified approved
movement blend's40 SE bone poses before opening the unchanged base rig. Reuse
all lower-body matrices and original planted/swing foot contacts; solve the
accepted opposing staff grip against the existing torso motion. Lower-body matrix
maximum error **2.39e-7**, palm error **1.21e-7m**; original scale/root, bone lengths
and connected joints pass. Only40 new SE carry renders, not existing Warrior sets.

The first guard clipped the raised right thigh at run4/5. Rejected metadata/logs
remain in `carry-rejected-low-guard`. Original `carry.json` now raises the running
guard10cm; all40 poses clear the unchanged non-hand body/staff, ground and cell-edge
checks. No leg motion, armor exclusion, camera or scale was changed to hide it.
All8 idle/16 walk/16 run source poses and native handoff captures reviewed: stable
root, coordinated two-hand carry, leg clearance and no old sword ghost. Guard is
consistent across the run stop, primary load/contact/recovery and idle return.

`profile-warrior-staff-carry.mjs` bundles actual `createCombat`, `stepCombat`,
`WarriorMotion`, `warriorPose` and real equipment derivation into a deterministic
600-tick plan. It covers every carry frame, actual walk/run speeds and the run-to-
primary transition. Staff is unchanged melee/range1.05; **one** real damage event
at tick444/active pose5. The native viewer consumes the plan; no independent
strike callbacks, forced frame captures or campaign/save access.

Native M4/ANGLE Metal, gameplay1×/inspection2×,600 intervals:
**p5016.7/p9516.8/p9918.3/max18.7ms,zero>25,zero runtime errors**.
The disposable combined40 carry+12 reused primary atlas2048×1024 is
**1,420,541 PNG bytes /8MiB calculated base RGBA**, not production payload or
GPU residency. No claimed campaign performance or carry resource-cycle acceptance.
**16 focused tests/four files**, TypeScript, scoped JavaScript lint/format and
Python syntax pass. App/art/save delta0. Raw evidence:
`/private/tmp/hollowbane-q3-staff-choreography/{carry-audit,carry-render,carry-native}`.

Accepted SE carry pilot only. Next expand carry to the seven remaining facings
with approved cached lower-body matrices; audit first, export only missing carry
poses and review native occlusion/root/grip. Then staff-compatible assigned
abilities, hit/death, category resource plan, real campaign equipment/save/travel/
combat integration and exact B/C release gates. **Staff/bow/unarmed stay legacy**;
only sword and sword/shield are production supported. Verified public remains
**c437335844e4f82e30b00da2967d4f64c9614a64**; local proof checkpoint, no pending CI.

## Eight-direction carry — local proof complete 2026-10-30

Reuse the accepted40 SE carry renders; export only the280 missing directional
carry poses. All **320 sampled frames** pass the original shaft/non-hand body,
ground, grip, connected-bone, root and unchanged lower-body checks. The remaining
seven directions additionally compare rotated feet to the shipped per-direction
world contact metadata: maximum error **1.93e-7m**. No mirror, changed gait or
original Warrior set replacement. All40 poses per direction have been inspected
on gameplay-scale source sheets; native gait/primary handoff captures show
consistent grip, stable root, cloak occlusion and uncut staff/feet.

`review-warrior-staff-directions.mjs ... --carry` validates reviewed input hashes,
reuses the existing deterministic crop/packer and checks **320/320 CPU and native
GPU trim/root round trips**. The original primary mode was rerun after extension:
**96/96 CPU/GPU**, the accepted PNG and metadata are byte-identical, and three
3→2→3 resource cycles pass. Its600-frame sample p9518.6/max18.7ms has zero>25 or
runtime errors. No approved primary rerender. Carry playback independently
unpacks/hashes all96 reused primary images against the original reviewed sources.

A single actual600-tick simulation plan is rendered in eight views, without
multiplying gameplay events: every8/16/16 carry frame is covered, run stops into
the accepted primary and returns to idle. All600 plan ticks are visited; the one
authoritative damage event remains active pose5. Native M4/ANGLE Metal,960×440/
DPR1, eight gameplay1× views: **600 intervals,p5016.7/p9518.5/p9918.6/max33.3ms,
one>25,zero runtime errors**. Retain the tail sample; this is isolated eight-view
playback, not a matched production benchmark or a combat-stall fix.

Three complete native atlas release/reload cycles stay **15→10→15** textures:
five inspected atlases, nine label textures and one review render target. No
inventory growth; the diagnostic labels/render target are not campaign resources.
Four explicit2048² carry atlases: **8,955,699 PNG bytes /64MiB calculated base
RGBA**. With the reused primary atlas, the fixture uses **11,661,793 PNG bytes /
80MiB calculated base RGBA**. Neither number is measured GPU residency or a
shipping staff allocation. Attempts to squeeze all poses into fewer existing
2048px shelves fail the packer's unchanged bounds; no dimension cap was raised.

This full-body proof layout is **not an accepted production resource budget**.
The source lower-body matrices are preserved; comparison with shipped images
still finds lower-body pixel differences. A smaller correction/patch must be
compared against full controls, including alpha/lighting/occlusion. Do not infer
pixel-exact legs or promise a saving from bone reuse. The SE idle0/primary0 handoff
is close (one alpha pixel differs, maximum premultiplied RGB2/255, zero pixels>4)
and the inspected transition is stable; no false exact-alias claim.

**16 focused tests/four files and TypeScript** passed for carry; the directional
extension passes scoped lint/format, Python syntax and both embedded browser
module parsers. Native control/resource checks above cover the added offline
browser behavior. Production source/art/save delta0: a production change will
still need focused campaign tests, TypeScript/lint/build and exact required Full,
Pages, hosted acceptance and public file integrity. No new CI is pending.

**Staff primary and carry proofs are accepted; full staff support is not.** At
this session checkpoint, next implement bounded SE staff-compatible Sundering Fan
and Oath authoring on the same rig. Read `class-abilities.ts`: Warrior Fan is
single-target melee, overriding the registry cone; Oath is the existing self
power/armor buff. Preserve assigned secondary, actual release at pose5, cooldowns,
input and damage; keep grip/body/foot/root checks and review real skill timing
before directional export. Then hit/death, resource layout and complete-category
campaign equipment/save/travel/combat/resource acceptance and exact B/C releases.
Bow/unarmed remain legacy; do not start their expansion before B passes. No staff
category promotion or new publication. Verified public stays
**c437335844e4f82e30b00da2967d4f64c9614a64**. Keep this validated proof local.

Raw: `/private/tmp/hollowbane-q3-staff-choreography/{carry-seven-audit,carry-seven-render,carry-eight-native,primary-mode-followup}`.
Reproduce the completed native review without rerendering:

```sh
node scripts/review-warrior-staff-directions.mjs /private/tmp/hollowbane-q3-staff-choreography/carry-render /private/tmp/hollowbane-q3-staff-choreography/carry-seven-render /private/tmp/hollowbane-q3-staff-choreography/carry-eight-native --carry
```

No owned renderer/server remains active at the checkpoint. Preserve all local
proof commits, `8a48dc9` recovery ancestry and unrelated documentation edits.

## Southeast staff assigned abilities — local timed proof 2026-10-30

New original12-pose `iron-fan.json` and `oath-echo.json` controls reuse the
approved rig, sword-free body,1.55m staff and opposing two-hand grip. Sundering
Fan uses a loaded descending forward strike; Oath raises a coordinated braced
guard. Actual Warrior definitions remain authoritative: Fan is single-target
melee (the class override), Oath is the existing self power/armor buff. This is
an offline SE pilot, not a campaign/showcase category promotion. Primary and
carry source pixels are not rerendered. Hit/death remain incomplete; the existing
player has one hitstun state, not a separate invented heavy-stagger duration.

Each SE ability passes89 continuous samples (**178 total**): original limb lengths,
connected joints, fixed feet/root, exact opposing palm contact, zero shaft/body
intersections and ground/cell clearance. Maximum palm error **1.49e-7m**. Both
ability endpoints are pixel-exact to the accepted primary guard. All24 source
poses and normal-timed native release/recovery captures were reviewed at gameplay
1× and inspection2×, with light and dark backgrounds. No sword choreography or
new spell/damage callback is used.

`profile-warrior-staff-carry.mjs ... --abilities` now packs reviewed SE inputs
and builds the **actual** class-aware `createSkills/requestSkill/stepSkillCombat`
and `warriorPose` plan. Both skills at speeds0/25/60/100 visit all12 ability
frames, release exactly once at pose5 and recover to guard. Every tick equals an
untouched parallel simulation copy, including mana, cooldowns, damage/statuses
and events; the viewer only consumes the plan. Eight casts/600 ticks are covered.
This isolated viewer holds the accepted guard during idle; complete idle/move,
hit/death, assigned-secondary and campaign transition acceptance remains open.

Native M4/ANGLE Metal,960×440/DPR1,600 intervals: **p5016.7/p9516.7/p9916.8/
max17.7ms,zero>25,zero runtime errors**. Three texture inventories stay **2→1→2**
through release/reload. This is isolated two-scale playback, not a matched
campaign benchmark, measured GPU residency or an improvement to known combat
stalls. One disposable2048×512 atlas: **600945PNG bytes /4MiB calculated base
RGBA**. It does not ship. Earlier primary/carry80MiB proof is unchanged; shared
body/attachment optimization and a complete production before/after budget remain
required. Exact guard reuse is established; this proof pack still stores logical
endpoints separately and does not claim a production alias saving.

The original carry mode also passes after extension: one authoritative primary
damage event, all600 plan ticks,600 native intervals p9516.8/max17.6ms,zero>25
or errors, three2→1→2 cycles. Its1,420,541-byte PNG, atlas JSON and8MiB calculated
RGBA are identical to the previously accepted SE carry fixture. **Eight focused
tests/three files**, TypeScript, scoped ESLint/Prettier, Python syntax and actual
embedded-browser execution pass. No production code/assets/save changes; full
release CI/build/hosted gates remain required before publication.

Raw evidence is under `/private/tmp/hollowbane-q3-staff-choreography/`:
`ability-{iron-fan,oath-echo}-{dense,render}`, `ability-native`,
`ability-audit-summary.json`, `ability-input-equivalence.json` and
`carry-ability-followup`. Formatting-only control changes preserve consumed JSON
and verified parsed equivalence; retained manifests retain their original hashes.
Sandboxed Blender crashed during Metal discovery before loading the rig; the
pinned native4.5.3LTS runs above pass. The early Oath review command ran before
its manifest existed; the completed export/review passed, without rerendering.

Reproduce the SE native acceptance after the geometry/export review:

```sh
node scripts/profile-warrior-staff-carry.mjs /private/tmp/hollowbane-q3-staff-choreography/ability-iron-fan-render /private/tmp/hollowbane-q3-staff-choreography/ability-oath-echo-render /private/tmp/hollowbane-q3-staff-choreography/ability-native-repeat --abilities
```

The seven remaining directions also pass **623 dense samples per ability**,
with unchanged palm/body/ground/root/feet and projected staff bounds. Across all
eight directions, **1424 dense samples** pass. Raw manifests are
`ability-{iron-fan,oath-echo}-seven-dense`; `ability-seven-summary.json` records
the results. These are geometry-only audits; the seven directions are not yet
rendered or visually accepted.

Next: export only the168 missing seven-direction ability poses, reusing the24
accepted SE images, then review directional native playback/occlusion. Follow with
bounded staff hit/death authoring using the real reaction/death selectors, full
resource plan and complete-category campaign/save/travel acceptance before exact
B/C releases. **Sword and sword/shield remain the only production support;
staff/bow/unarmed remain legacy.** Last verified public remains
**c437335844e4f82e30b00da2967d4f64c9614a64**; no new CI or publication.
Preserve unrelated edits and all local proof commits. No owned renderer/server
remains after the checkpoint.

## Eight-direction staff abilities — local proof complete 2026-10-30

Sundering Fan and Oath now cover **192 logical frames**,12 poses × eight directions
× two abilities. Reuse all24 accepted SE images and28 accepted directional primary
guards/recoveries; render only **140 new poses**. `--reuse-guards` validates the
reviewed primary proof, rig/IK/control/geometry hashes, exact palm/axis/wrist/elbow
and projected bounds, then copies the hash-verified original PNG. Both endpoints
match the accepted primary guard in every direction. The corrupt-cache fixture
is rejected at its PNG hash before copying or rendering. No original Warrior,
SE pilot, primary or carry image is rerendered.

All168 additional logical poses pass the unchanged grip, body intersection,
ground, connected-joint, foot/root and alpha/cell-edge checks. The prior1424 dense
samples remain valid: ability controls/geometry are unchanged. All seven-direction
source sheets for both abilities were inspected at gameplay scale on light/dark
backgrounds, followed by actual-timed eight-view native windup/contact/recovery
captures. Rear cloak occlusion, hands and stable feet are retained. These are
accepted ability-direction proofs, not full staff category/production acceptance.

`scripts/review-warrior-staff-directions.mjs --ability <id>` verifies reviewed
source hashes and **192/192 CPU plus192/192 native GPU trim/root round trips**
across both abilities. Each uses88 packed rasters and eight exact guard aliases;
the separate proof atlases still duplicate their common cross-ability guards.
Each viewer consumes the relevant300 rows from the accepted actual class-aware
600-tick plan, covers all12 poses at0/25/60/100 speed and four authoritative skill
releases at pose5. Eight simultaneous facings read one plan, adding no simulation
copies, damage or effects. Idle deliberately holds the accepted guard; full
movement/interruption/death integration is still outstanding.

Native M4/ANGLE Metal,960×440/DPR1, eight gameplay1× views; Blender exports finish
before native measurements. Each isolated run records600 frame intervals:

| Ability | PNG bytes | Calculated base RGBA | p50 / p95 / p99 / maximum | >25ms |
| ------- | --------: | -------------------: | ------------------------ | ----: |
| Sundering Fan | 2706287 | 16MiB | 16.7 /17.1 /17.7 /17.7ms | 0/600 |
| Oath | 2504087 | 16MiB | 16.7 /17.5 /17.7 /17.7ms | 0/600 |

Both have zero runtime errors and three **11→10→11** texture release/reload cycles.
Inventory includes nine diagnostic labels and the round-trip render target.
These two2048² atlases total **5210374PNG bytes /32MiB calculated RGBA**; they are
external full-body controls, not shipping assets or measured GPU residency.
Earlier80MiB primary/carry proof is unchanged;112MiB is only the arithmetic
combined diagnostic payload before hit/death, not an accepted production budget.
Shared-body/attachment/patch optimization, load/switch measurements and matched
campaign performance remain required. Production PNG/RGBA/code/save delta is0.

Original primary mode also passes96 CPU/GPU round trips and three3→2→3 cycles.
Its PNG and atlas JSON are byte-identical to the accepted eight-primary proof;
600 native intervals p9516.9/max17.7ms,zero>25/errors. **Eight focused tests/three
files**, TypeScript, scoped ESLint/Prettier, Python syntax and embedded native
browser execution pass. No full campaign regression/build/CI/publication is
claimed for this offline increment. All required release checks remain before B.

Raw evidence: `/private/tmp/hollowbane-q3-staff-choreography/`:
`ability-{iron-fan,oath-echo}-{seven-render,eight-native}`,
`ability-eight-summary.json`, `ability-rejected-corrupt-guard.log` and
`primary-ability-eight-followup`. Existing SE proof, consumed JSON equivalence
and1424 dense samples remain preserved. Reproduce each completed native review:

```sh
node scripts/review-warrior-staff-directions.mjs /private/tmp/hollowbane-q3-staff-choreography/ability-iron-fan-render /private/tmp/hollowbane-q3-staff-choreography/ability-iron-fan-seven-render /private/tmp/hollowbane-q3-staff-choreography/ability-iron-fan-eight-native-repeat --ability iron-fan
node scripts/review-warrior-staff-directions.mjs /private/tmp/hollowbane-q3-staff-choreography/ability-oath-echo-render /private/tmp/hollowbane-q3-staff-choreography/ability-oath-echo-seven-render /private/tmp/hollowbane-q3-staff-choreography/ability-oath-echo-eight-native-repeat --ability oath-echo
```

At the soft session boundary, next implement a **bounded SE six-pose staff hit
reaction**, preserving the existing real hitstun duration/selector, two-hand grip,
feet/root and exact guard recovery. Audit and review actual interruption timing
before directional export. Then staff death with stable terminal pose, complete
state mapping/resource reuse, campaign/save/equipment/travel and matched native
acceptance, exact B release and C review. Do not rerender the accepted abilities.
Only sword and sword/shield are production supported; **staff/bow/unarmed remain
legacy**. B/C remain incomplete. Last verified deployed SHA remains
**c437335844e4f82e30b00da2967d4f64c9614a64**, no CI pending. No owned renderer/server
remains; preserve unrelated edits and recovery ancestry.

## Staff hit/recovery — eight-direction local candidate 2026-10-30

Two required six-pose entries now cover all eight directions: guarded recoil and
forward-held recoil from melee contact. **96 logical poses;72 new renders and24
reused primary contact/guard images.** Both return exactly to the accepted guard.
All **656 dense samples** and96 packed poses retain the original opposing grip,
reach, connected joints, body/shaft/ground clearance and fixed feet/root. No
new stagger state, duration, combat effect or save change.

The first guard-only pilot passed mechanical tests but was **visually rejected**
for an active-primary interruption: tip displacement1.5667m to the raised guard.
The forward entry starts with the **exact accepted primary5 PNG**, so entry now
follows the normal primary4→5 stroke rather than adding that jump. Its subsequent
recoil uses approved recovery controls with a coordinated torso/palm/shaft offset.
An initial independent-palm attempt exceeded left-arm reach; retained evidence
records that rejection. Reach/collision limits were not relaxed. Zero-offset
endpoints bypass matrix reconstruction to preserve exact aliases.

`src/rendering/warrior-staff-hit.ts` is a pure, currently **unwired campaign**
presentation observer. It remembers the held pose, keeps the selected entry
through guarded follow-up hits and yields to living/death selectors without
owning a clock. Its candidate3–7 forward-pose classification is exercised here
for active primary, guard, walking and Oath windup. Fan and load/recovery boundary
entries still require the complete phase3 transition matrix before production;
these fixtures are not a claim that every interruption is accepted.

The actual600-tick skill/combat plan tests four entries × three recovery bonuses:
**12/9/6 ticks**, every six-pose sequence, one stagger despite follow-up damage,
exact release into real movement and no effect from interrupted Oath. Every tick
matches an untouched simulation copy. Four new observer cases plus existing hit
and packing tests give **11 focused passes/three files**; strict TypeScript,
scoped ESLint/Prettier and Python syntax pass. A TypeScript alias-narrowing error
was corrected with a non-null assertion erased from runtime output.

All six reaction poses in all eight directions were reviewed in actual-timed
native gameplay-scale sequences, with light/dark captures. The native fixtures
reuse and independently verify184/160 context frames against reviewed source
pixel hashes (primary/carry or Oath/carry), loading only used categories. Combined
**96 CPU and96 GPU round trips** pass; eight views read one authoritative plan.

| Native M4/Metal fixture | PNG bytes | Calculated RGBA | p50 / p95 / p99 / max | >25ms |
| ---------------------- | --------: | --------------: | -------------------- | ----: |
| Guard entry,9 cases/450 unique ticks | 1369056 | 8MiB | 16.7 /18.0 /18.5 /18.6ms | 0/600 |
| Forward entry,3 cases/150 unique ticks | 1530328 | 8MiB | 16.7 /18.1 /18.5 /66.7ms | 1/600 |

Three **16→10→16** texture cycles pass per fixture: one new reaction atlas plus
five reused context atlases, nine labels and a round-trip target. The66.7ms tail
is retained, not retried away or attributed without matched evidence. The SE
combined viewer independently records600 intervals p9518.6/max18.7ms,zero>25,
three2→1→2 cycles. These are isolated reviews, not matched campaign performance
or measured GPU residency. The two2048×1024 diagnostic atlases total
**2899384PNG bytes /16MiB calculated RGBA**; no shipping asset is added. Shared
body/attachment optimization and the complete staff budget remain open.

Raw `/private/tmp/hollowbane-q3-staff-choreography/` evidence: `hit-summary.json`,
`{hit,hit-extended}-{se,seven}-{dense,render}`, `hit-se-native`,
`{hit,hit-extended}-eight-native`. Preserve `hit-se-native-rejected-active-snap`,
`hit-extended-rejected-reach.{json,log}` and the initial older-primary-report
reader failure. The reader now supports its singular atlas metadata while keeping
byte-size and exact used-pixel checks. The accepted primary/carry/ability assets
and all old raw evidence are unchanged. No full release CI/build/hosted run.

Next bounded work: staff death on the approved grounded collapse/settle body
poses, beginning SE with no sword and correct staff/hand/floor interaction.
Then close the complete transition matrix (including Fan/load/recovery entry
boundaries), resource reuse, developer arena, campaign/save/travel and matched
native acceptance before exact B release and C review. Staff/bow/unarmed remain
legacy; sword and sword/shield remain supported. Verified deployed SHA is still
**c437335844e4f82e30b00da2967d4f64c9614a64**; no CI pending. No owned process remains
at this checkpoint. Preserve unrelated edits and recovery ancestry.

## Bounded shared sword-free body proof — 2026-10-29

Local offline tooling now establishes a reusable **candidate**, without replacing
approved Sword/Sword+Shield pixels or promoting any new category. Phase3's
bounded representative proof passes; the full shared body/export integration and
all eight-direction transitions remain incomplete. B/C remain unaccepted.

- `scripts/probe-warrior-body.py` reuses the approved metadata exporter and
  hash-verified procedural authoring. Audit all880 poses; render at most12 chosen
  reference/clean pairs. Only four sword meshes change render visibility, restored
  in `finally`;15 bones, cameras, root, materials, lighting and motion stay fixed.
  No blend/public writes. Cycles48 samples, seed24, no animated seed.
- Default11 poses cover idle/walk/run, primary/secondary, both abilities, hit and
  two settled deaths across SE/W/NW/N. Nine reference frames match approved RGBA
  exactly; two SE movement references differ slightly in RGB (raw maximum15).
  Do not call all11 exact. All22 packed reference/clean images reproduce exactly
  on a second export; Blender's Date/render-time PNG metadata differs.
- `scripts/review-warrior-body.mjs` independently checks atlas/frame hashes,
  applies the existing2:1 resize and alpha≤4 cleanup, and compares dark/light
  gameplay-scale captures. Replace weapon bounds+6px with clean RGBA; alpha-over
  alone cannot erase the baked blade. Every candidate has **zero alpha difference**
  from its fully clean render. Outside-crop RGB lighting/denoising differences
  remain: raw max51, premultiplied max7.94/255;14 pixels>4/255 across11 poses.
  No visible ghost sword, hand/scale/root jump or seam in reviewed samples.
- A second bounded export covers **NW primary1–10 plus idle**. All11 references
  are pixel exact; clean-patch alpha matches exactly, maximum premultiplied RGB
  residual5.74/255 with3 pixels>4/255. Source primary0/11 are verified exact idle
  aliases padded+32,+64, matching the root offset. This proves a sample handoff,
  not genuine unarmed motion or complete transitions.

`scripts/probe-warrior-body-runtime.mjs` uses the actual installed **Phaser4.2.1**
public DynamicTexture clear/stamp API on native M4/ANGLE Metal. Each pose's GPU
composition matches its offline control **exactly**, including alpha, in both
11-pose studies. Three allocate/release cycles each return26→24 fixture textures;
24 includes temporary frame/control images, not campaign inventory. The second
scratch exists only for pixel comparison. First diagnostic's WebGL2 assumption
was corrected to the actual WebGL1/2 context; an export-overlapping timing trial
is excluded and retained. Final runs execute after Blender exits.

| Native disposable proof |   Patch PNG | Patch atlas / base RGBA | Frame p95 / p99 / max | >25ms |
| ----------------------- | ----------: | ----------------------- | --------------------- | ----: |
| Representative11        | 37610 bytes | 512×256 / 524288 bytes  | 18.5 / 18.7 / 18.7ms  | 0/600 |
| NW primary/idle11       | 18814 bytes | 512×256 / 524288 bytes  | 18.6 / 18.7 / 18.7ms  | 0/600 |

One reusable448×448 scratch is **802816 base RGBA bytes (0.766MiB)**; the first
pilot patch atlas is0.5MiB. These are calculated payloads, not GPU residency;
full880 packing, category pose corrections and production integration are not
measured. Submission CPU p95 1.2/1.1ms, not GPU execution time. The
isolated fixture's good frame times do not resolve existing campaign stalls.
Campaign remains42 textures/373.25MiB with **zero added assets or runtime code**.
No880-frame body rerender or full atlas per new weapon was introduced.

Reproduce from repository root with approved Blender4.5.3LTS:

```sh
Blender --background --python-exit-code 1 --python scripts/probe-warrior-body.py -- /private/tmp/hollowbane-q3-body-proof
node scripts/review-warrior-body.mjs /private/tmp/hollowbane-q3-body-proof
node scripts/probe-warrior-body-runtime.mjs /private/tmp/hollowbane-q3-body-proof
```

The Blender executable is the verified pinned binary, not an arbitrary installed
version. For the contiguous study use `--render idle-nw-00 primary-nw-01` through
`primary-nw-10` as11 explicit arguments and the second evidence directory. Run
native measurements sequentially after export. Raw evidence:
`/private/tmp/hollowbane-q3-body-proof` and
`/private/tmp/hollowbane-q3-body-transitions`, including provenance-linked
`body.json`, `review.json`, `runtime.json`, repeated pixel hashes and idle aliases.
JS scoped lint/syntax/format and Python syntax pass. Approved sources, campaign,
saves and all unrelated working files are unchanged. Keep this tooling/evidence
checkpoint local; the last deployed SHA remains
**c437335844e4f82e30b00da2967d4f64c9614a64** with its accepted release evidence above.

**Exact next action:** bounded original `cinder-staff` grip/choreography pilot
using approved rig and IK: SE/W/NW idle, anticipation, active and recovery. Check
both hand contacts/reach, shaft/body/floor occlusion and genuine jab/guard motion
before full export. Original rigid mittens/sword strikes establish neither staff,
bow nor unarmed compatibility. Then expand alias/transition/directional coverage
and integrate only coherent categories through fresh exact release gates. Keep
legacy fallbacks, the slow cold-transfer target limit and checkpoint stalls.

## Original staff grip pilot — geometry feasible, motion unaccepted

Local `scripts/probe-warrior-staff.py` now provides **12 bounded diagnostic
renders**, SE/W/NW guard, anticipation, active and recovery. It reuses the approved
15-bone rig/camera/body materials and the hash-verified analytical bone-placement
helper. Staff wood, bronze ferrules and amber cap are original procedural
primitives:1.70m shaft,1.75m including cap. No external asset, approved source
replacement, blend save, gameplay or save-schema change.

The first audit rejects a sword-axis grip: shaft enters torso/forearms and one
left target needs0.611m against0.550m available. Transverse palm placement,
reachable targets, a braced torso and consistent opposing overhand/underhand grips
now pass all12 sampled non-hand shaft/body intersection tests. No intersecting
forearm/torso mesh was excluded to obtain a pass. Only intentional gauntlet/finger
contact is excluded. Max palm error1.24e-7m, lowest shaft0.839m; connected joints,
original bone lengths, fixed feet/root remain asserted. This is geometry evidence,
not accepted human grip/choreography quality.

Raised NW tips clip the initial448 cell. The final512×512 cell/root256,338 adds
transparent padding without shrinking actor/weapon: three world anchors verify
exact source+128,+128 projection. Packed alpha clears every edge (top minimum50px).
`review-warrior-staff.mjs` checks hashes and produces light/dark gameplay-scale
sheets. Twelve temporary512 frames total455395PNG bytes and12MiB calculated RGBA;
these are **diagnostic controls**, not a category payload or GPU measurement.
A prospective512 scratch would be1MiB versus448's0.766MiB; actual localized body/
weapon packing and runtime costs remain unmeasured. Published increment stays0.

**Staff is not supported.** Actual review shows heavily foreshortened SE active
silhouette; the provisional jab's horizontal axis is35.54° from model forward
and30.17° above ground. This is not accepted aiming/impact choreography.
Only four control poses exist, without continuous phase timing or full directional,
ability, hit, death, equip/save/reload/resource/campaign acceptance. Keep staff,
bow and unarmed on legacy. Shared sword-free body remains a bounded proof,
not a complete new category asset set. B/C remain incomplete.

Reproduce with pinned Blender4.5.3LTS and an external diagnostic directory:

```sh
Blender --background --python-exit-code 1 --python scripts/probe-warrior-staff.py -- /private/tmp/hollowbane-q3-staff-proof --audit
Blender --background --python-exit-code 1 --python scripts/probe-warrior-staff.py -- /private/tmp/hollowbane-q3-staff-proof
node scripts/review-warrior-staff.mjs /private/tmp/hollowbane-q3-staff-proof
```

Python syntax, scoped JS lint/syntax/format and final12-pose geometry/edge checks
pass. No extra full gameplay/build run is needed for these offline-only tools;
accepted runtime remains **c437335844e4f82e30b00da2967d4f64c9614a64**. Raw
`/private/tmp/hollowbane-q3-staff-proof` contains provenance-linked `staff.json`,
`review.json` and captures; `-initial-*`, `-transverse-reach.log`,
`-horizontal-intersections.*`, `-diagonal-intersections.log`,
`-same-grip-cuff-collision.log` and `-clipped448` retain rejected evidence. Do not
count rejected samples as passes. Keep the validated tooling checkpoint local.

**Exact next action:** refine the bounded staff attack toward actual model
forward(0,-1), phase/impact timing and readable SE motion while retaining both-hand
contact/reach/body/floor checks. Prove continuous SE/W/NW motion before all-eight,
ability/hit/death exports or category body correction packing. Then integrate only
a complete visually accepted category through fresh Full/Pages/hosted/integrity
and B/C gates. Preserve both verified sword configurations and all legacy fallbacks.

## CI recovery — 2026-10-29

Candidate `72155e6d62a83add0779d3e2662c9a80389499d4` failed exact
[CI40918355913](https://github.com/tobisen/hollowbane/actions/runs/40918355913)
only in Full Chromium shard3's Warrior D12 finale reload. Other three shards,
complete units/tooling and required compatibility passed; publication was blocked.
Recovery ancestor `8a48dc9` remains intact. Recovery deployment is now verified at
`f28c16c8080959b3a7a95a50683b470f76994dc2`; the broader independent Q3-B
showcase acceptance still has the startup follow-up recorded below.

Downloaded trace/screenshots prove the journal never opened after reload. At
trace207342.669ms, inventory owns the loading modal, status is `Loading character
checkpoint…`, the class is still the default level1, and the journal opener is
disabled. The test sends `j` at207345.805ms after checking only area metadata;
`QuestJournal.open()` correctly rejects input before `worldReady`. Storage restores
and releases inventory later, but the lost shortcut is not replayed. The empty
journal title and hidden Next button then persist. No competing final overlay,
failed quest event or duplicate reward: the first claim and save completed with
claimed finale, XP4248 and gold531. No drag occurs; its dialog-scoped click handler
cannot intercept this keyboard event. The recent drag repair is not this cause.

The focused test repair waits for the journal opener to become enabled and the
loading inventory to close, focuses gameplay, sends the original shortcut, and
asserts the journal is visible before navigation. It also asserts the final title.
Every original reward/class/XP/gold/item/loot/progression/reload assertion and all
deadlines remain. Application, simulation, save schema and art bytes are unchanged.
Ordinary and6×CPU original local runs pass; this is evidence of a missed readiness
contract, not a claim that those runs reproduced the failure. Raw CI trace,
screenshots/log and local diagnostic evidence: `/private/tmp/hollowbane-q3-ci-recovery`.

The isolated delayed-transaction reproduction now passes: hold the real
read-only IndexedDB completion notification, observe loading inventory/disabled
journal, send `j` and verify both journal/Next remain hidden, then release the
notification and run the repaired setup through all original reward/reload
assertions. No timer delay or live simulation/save mutation is used. An initial
request-event interception did not delay storage (which awaits transaction
completion); its diagnostic failure is retained separately, not counted as a pass.

Local verification: **17 units/four files**, strict TypeScript, full ESLint,
formatting and production build pass; **nine focused native Chromium cases**
pass (three earned finales, merchant, keyboard-after-drag, controller/mouse
handoff, six-configuration selection, resource cycles and real shield drag/equip/
save/reload). Completion/camp captures reviewed. All **164 client file hashes**
match the previously sealed candidate exactly; runtime/art delta is0. Required
CI remains **Full**, measured from the last accepted deployment including the
unaccepted inventory interaction change. Do not expand weapons before its exact
Full/Pages/hosted/integrity release gate passes.

Recovery fix **f28c16c8080959b3a7a95a50683b470f76994dc2** is committed and pushed by normal fast-forward,
preserving `8a48dc9`. Exact [CI40937358584](https://github.com/tobisen/hollowbane/actions/runs/40937358584)
**passes Full, Pages, hosted exact-SHA/file smoke and Release acceptance**:
**682 units/150 files,315 Chromium (89+75+59+92),15 required compatibility**,
static/asset/backlog/tooling/coverage gates. All315 Chromium results have zero
failures, skips or retries; all four D12 cases pass on Linux. Downloaded CI seal
and independent public comparison match **all164 files** to the tested bundle.
The workflow ran19:08:33–19:37:28UTC on2026-10-29. Last verified deployed SHA is
now **f28c16c8080959b3a7a95a50683b470f76994dc2**; this does **not** mark B/C or the
broader independent showcase acceptance complete.

### Independent hosted result / execution boundary

The additional visible native M4/Metal run has **21/22 passes**: **all16 production
cases**, all three earned finale/reload cases, the earned-gold merchant case and
three developer resource cycles pass. Real drag/click/equipment/save/exit/re-entry,
both abilities without duplicate effects, eight-way locomotion, three terrains,
actual waypoint/portal travel, natural held death and404 recovery remain correct.
Camp, real combat and corpse captures reviewed. No source art/save/simulation or
Phaser changes. All pre-existing STATUS edits and16 other unrelated working files
were independently compared and preserved byte for byte.

The **developer configuration-selection case fails its original5s startup
assertion**, before any selection. Initial screenshot shows `Loading developer
atlases ·98%`; focused traced reproduction shows93% and no runtime/request errors
before teardown. Downloads are still active after5s from navigation: shield PNG/
JSON finish at5257/5261ms and final queued resources are not finished at capture.
`Arena.create()` correctly withholds readiness until resources exist. This is a
reproduced cold hosted asset-loading/readiness boundary, not an invalid weapon
selection or a green22-case run. The original5s assertion and60s test bound were
not changed; the diagnostic adds only read-only errors/resource timing observers.
Do not promote a weapon or call full Q3-B acceptance passed from these results.

Native additional unmatched battle: **602 frames/16 actors/42 textures**, verified
Apple M4/ANGLE Metal,1280×800/DPR1/Full; p5016.7/p9518.2/p99281.4ms,
**9>25ms/max416.7ms**. Existing variable checkpoint stalls remain; no improvement
claim or new matched comparison. Resource cycles pass42→0→42 with unchanged
inventory;373.25MiB is calculated base RGBA, **not measured GPU memory**. Art,
PNG/atlas and calculated memory delta remains0.

**Safe execution checkpoint; keep evidence-only commits local.** Next resolve the
hosted developer asset-load precondition explicitly, preserving all six selection,
frozen-encounter/save-isolation and existing UI assertions. Observe real resource
completion and renderer readiness; do not force actions or raise global timeouts.
Run the smallest cold hosted selection/resource cases with trace, then any required
new exact CI/Pages/hosted/integrity gate for a committed fix. Only after the complete
acceptance passes, begin a bounded shared sword-free body/patch feasibility slice,
then genuine staff grip/two-hand motion; bow draw/release and unarmed choreography
remain subsequent. No new weapon is supported. No full Warrior rerender.

Raw evidence in `/private/tmp/hollowbane-q3-ci-recovery`: `accepted-ci.json`,
`accepted-units.log`, `fix-ci-bundle`, all four shard reports, `hosted-results.json`,
`hosted-native`, `hosted-battle-summary.json`, `hosted-startup-diagnostic` trace and
`startup-failure-timing.json`. The unchanged22-case native config is
`playwright.hosted.config.mts`; use `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/`
and `WARRIOR_PRODUCTION_PROFILE=1`. Focused original-deadline startup reproduction
uses `playwright.startup.config.mts --grep 'equipment study switches' --trace on`.
These are temporary evidence/harness files, not committed test artifacts.

## Verified sword/shield baseline and completion continuation — 2026-10-29

Exact [CI40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405)
for **8fece2b98325991e2116d6de25e12aba5908d089** is successful: all four required
Full Chromium shards, complete units/validators/tooling, required compatibility,
Pages, exact-SHA hosted flow and Release acceptance pass. Independent comparison
matches **all163 public files** to the previously reviewed/tested CI bundle.
The local `7b1e4e2` recovery commit contains evidence only; it is preserved as an
ancestor, without resetting the branch or treating it as the deployed runtime.

All **16 independent hosted equipment cases** pass in visible Chromium on native
Apple M4/ANGLE Metal (3.2minutes). Reviewed camp, real forest combat and natural
crypt corpse captures at gameplay scale. The extra unmatched hosted battle sample
has631 frames,16 actors/42 textures,1280×800/DPR1: p5016.7/p9516.9/p9917.6ms,
three intervals>25ms, maximum416.6ms. This does not replace the matched comparisons
below or establish an improvement; existing checkpoint stalls remain. Raw CI
receipt, captures and battle sample: `/private/tmp/hollowbane-warrior-equipment/hosted-native-a`
and `hosted-a-ci-receipt.json`. Machine receipt: `equipment-production-review.json`.

The remaining real configurations are staff/empty offhand, bow/empty offhand,
empty hands and empty main/shield. No other main-hand/offhand category exists.
Staff is the first candidate to investigate because it retains melee semantics;
bow also needs a genuine projectile draw/release; empty-hand cases need unarmed
attacks. All require a **shared sword-free body solution** before any new category
can pass visual acceptance. The original source explicitly binds four sword
meshes to `handR`; all approved body PNGs flatten those meshes with the body.
The gauntlets use rigid mitten/finger plates, not independently articulated bow
fingers. Existing two-hand item metadata is a gameplay restriction, not an authored
two-hand grip. Simply attaching a staff/bow, hiding a sword under another picture,
or relabeling sword strikes fails this task's visual standard. No additional
weapon is promoted by this continuation; their legacy fallback stays explicit.

The completion increment adds the missing **empty main + bark-guard** appearance
choice, covering all six legal existing combinations. Labels use actual item
definitions; configuration diagnostics share the campaign selector. Each choice
explains its supported/fallback reason. Diagnostics also distinguish original
comparison and released/loading resources. The outdated campaign shield warning
is removed. Appearance controls remain disposable; primary/secondary, both
abilities, movement, hit/death, grip guides and comparison controls keep their
existing behavior. Campaign secondary remains its assigned skill, while the arena
also exposes the alternate melee clip. Actual shield drag/drop verification now
covers overflowing rejection and a valid grid move before equip/save/reload.

That trusted campaign test found a real interaction defect: replacing the grid
after a valid drag can remove its original click target, leaving `suppressClick`
to swallow the next deliberate item selection. The UI now clears that flag on a
new pointer gesture and allows keyboard activation (`detail:0`). The original
shield case fails before the fix and passes after it; immediate keyboard use and
virtual-pad→mouse handoff also pass. No timeout, ownership or simulation bypass.
Failure context remains in `completion-native`; passing results are in
`completion-drag-native`. A temporary runner initially used its own directory for
the preview server; explicit repository cwd fixes that configuration-only failure.

Seven focused suites/26 units, TypeScript, affected lint and build pass. Seven
distinct native Chromium scenarios pass across bounded runs, including real
secondary/Oath outcome parity and natural hit/death alongside the changed cases.
All eight focused Firefox/WebKit cases pass. Native and WebKit showcase captures
were reviewed. Publication is pending. The final164-file client retains158
accepted file hashes, including every approved Warrior PNG/atlas JSON. No new PNGs, atlases, decoded
payload, source-art edits, gameplay, save schema or Phaser changes are introduced.
This is an A acceptance/compatibility-showcase increment, **not completed B/C or
new bow/staff/unarmed artwork**. Next finish the focused browser checks, seal and
publish the coherent increment under the selected CI tier; require its exact
CI/Pages/hosted receipt. Then investigate a bounded shared sword-removal/body
patch proof and genuine staff grip/motion before considering production support.
Keep the accepted A release and all successful exports intact.

## Exact continuation release / safe resume checkpoint — 2026-10-29

Coherent candidate **72155e6d62a83add0779d3e2662c9a80389499d4** is committed and
pushed. The dry-run proved a normal fast-forward including `7b1e4e2`; no reset or
unrelated-document staging. Exact [CI40918355913](https://github.com/tobisen/hollowbane/actions/runs/40918355913)
is running; bounded inspection finds Fast static/contracts/smoke still in progress.
The repository classifier selects **Full**, including inventory UI integration;
no gate is lowered. Pages/hosted acceptance are pending. Last verified deployed
release remains **8fece2b98325991e2116d6de25e12aba5908d089**.

The final164-file tested bundle is sealed at
`/private/tmp/hollowbane-warrior-equipment/completion-tested-bundle` with this
candidate SHA. Keep this evidence-only recovery checkpoint local while the run
is active; another push cancels that run. Resume with:

```sh
gh run view 40918355913 --json headSha,status,conclusion,jobs
gh run download 40918355913 --name release-bundle --dir /private/tmp/hollowbane-warrior-equipment/completion-ci-bundle
python3 tools/ci/release_artifact.py verify --directory /private/tmp/hollowbane-warrior-equipment/completion-ci-bundle --sha 72155e6d62a83add0779d3e2662c9a80389499d4
```

Compare all164 CI file hashes to `completion-tested-bundle/release.json`; inspect
any mismatch. Require exact Full/Pages/hosted/Release acceptance. Then run the
existing hosted byte comparison against the downloaded bundle, all16 native
production cases (including the corrected real drag case), and the two updated
showcase selection/resource cases on the hosted developer route. Use the
preserved native/compatibility configs with `PLAYWRIGHT_BASE_URL` for hosted work;
review captures and record the accepted SHA. A failed required gate must be
repaired before proceeding. No B/C or new weapon art completion is claimed.
After exact acceptance, the next art slice is a bounded shared sword-free body
patch feasibility proof before genuine staff grip/motion. Do not relabel the
approved one-hand sword motion. Preserve all approved source/exported pixels,
explicit fallback categories and physical/GPU/human-playthrough limitations.

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
then record the published SHA before any B/C expansion. Candidate
`8fece2b98325991e2116d6de25e12aba5908d089` is pushed; exact Full CI
[40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405) is in progress. All163 locally tested client files match the exact CI artifact
byte for byte; its classification receipt confirms Full. No public A/B/C receipt
is claimed yet. Bows/staffs/unarmed still need a shared sword-free body and genuine
category-specific choreography; full armor production remains outside scope.

## Release continuation checkpoint — 2026-10-29

Pushed runtime: `8fece2b98325991e2116d6de25e12aba5908d089`.
Exact required Full run: [40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405).
Static/build/smoke, complete unit/validators/tooling and all15 required
compatibility contracts have passed. At this checkpoint all four Chromium
shards are still running; Pages/hosted acceptance is not yet verified. All163
locally tested client files equal the downloaded exact CI artifact; its receipt
confirms Full. No equipment release is accepted yet. Last verified public
revision remains `ee03e81964bb597636aa2d96f64716268e5c1d81`.

Keep this evidence update local while that release run is active; pushing it
would cancel the current run. Resume by inspecting the exact run and failures,
not by starting more equipment work. If Full succeeds, require Pages and hosted
Release acceptance; compare all163 public bytes to
`/private/tmp/hollowbane-warrior-equipment/production-ci-bundle`, then run the16
production cases against the published URL using the native config
`/private/tmp/hollowbane-warrior-equipment/playwright.native.config.mts` and
`PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/`.
`WARRIOR_PRODUCTION_PROFILE=1` additionally verifies actual M4/Metal in battle.
Review hosted captures, record the accepted SHA, then publish the Markdown-only
evidence increment under the repository-selected tier and verify its own release.
Do not push this checkpoint while the prior run is active. If a required gate
fails, inspect its exact artifact and repair the demonstrated cause; do not skip
or lower the gate.

A remains incomplete; B/C have not begun. Bow/staff/unarmed remain legacy because
the baked sword/body and actual two-hand choreography are not interchangeable.
Next expansion must establish a shared sword-free body and genuine grips/motion,
not relabel the blade. Preserve successful exports and the48-frame shield death
repair. Physical controllers, GPU residency and full human Act1 remain unverified.
Unrelated pre-existing documentation edits remain unstaged.

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

| Configuration                 | Campaign renderer now     | New art needed                                      | Motion needed                                                                                          | Grip/attachment data                                          | Existing motion reuse                             | Temporary fallback                                          |
| ----------------------------- | ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `ash-blade`, empty offhand    | Yes                       | No; approved sword is baked in                      | No                                                                                                     | None for current baked renderer                               | All 72 clips                                      | Only debug override, failed loading or committed projectile |
| `ash-blade` + `bark-guard`    | Yes; A verified at8fece2b | Original shield and two shared optional atlases     | 48 unique late-death body variants; local and hosted campaign scenarios pass                           | Left-hand grip, full projected orientation and body occlusion | All 880 poses proven in developer assets          | Debug override, failed loading or committed projectile      |
| `reed-bow`, empty offhand     | No                        | Original bow plus shared sword-free body solution   | Bow draw/release and two-hand coordination; sword strikes do not establish compatibility               | Both-hand grip; projectile timeline alignment                 | Locomotion/hit/death may be reusable after review | Yes                                                         |
| `cinder-staff`, empty offhand | No                        | Original staff plus shared sword-free body solution | Actual melee staff choreography needs visual review; current sword strike is not accepted staff motion | Two-hand grip and staff/body occlusion                        | Locomotion/hit/death may be reusable after review | Yes                                                         |
| Empty main, empty offhand     | No                        | Shared sword-free body solution                     | Unarmed attack not authored                                                                            | Empty-hand pose data                                          | Non-attack states may be reusable                 | Yes                                                         |
| Empty main + `bark-guard`     | No                        | Shield and shared sword-free body solution          | Unarmed/shield coordination not authored                                                               | Left grip and occlusion                                       | Must be reviewed                                  | Yes                                                         |
| Bow/staff + offhand           | Invalid equipment         | —                                                   | —                                                                                                      | —                                                             | —                                                 | Existing transactions displace conflicting equipment        |
| Unknown future base           | No                        | Audit when introduced                               | Audit when introduced                                                                                  | Audit when introduced                                         | No assumption                                     | Yes, fail closed                                            |

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
