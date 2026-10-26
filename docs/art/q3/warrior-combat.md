# Q3-A Warrior combat — DBL-023/024/025/026

2026-10-26. The **extended Warrior production request** now authorizes C1–C9
sequentially through final Warrior review. This supersedes the earlier Southeast
stop. Public Release A (eight-way attacks), B (ability/reaction/death), then C
(playable arena and final review) each require exact CI, Pages and hosted
acceptance before advancing. Preserve simulation, saves, balance, Phaser4.2.1,
the approved source rig, live graphics and unrelated edits. No other class art
or normal-game sprite activation is authorized.

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
passed Fast; required Full is in progress. Pages, hosted bytes/preview and release
acceptance remain pending. Last verified deployed SHA is still e498ce6. The soft
session budget has been exceeded; this is a safe Release A checkpoint, not final
Warrior completion. Resume this exact release gate before C3/B. Preserve successful
renders; no B source work or normal-game activation has begun.

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
