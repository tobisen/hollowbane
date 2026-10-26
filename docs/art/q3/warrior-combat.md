# Q3-A Warrior combat — DBL-023/024/025/026

2026-10-26. Current authorization is **Checkpoint A only**: finish and publish
the Southeast primary/secondary pilot, then stop. No other combat directions,
casting, hit/stagger/death, normal graphics activation or other characters.
Preserve simulation, saves, balance and Phaser4.2.1. Source checkpoint8c47c90
is retained in history; movement8394dd5 passed exactCI40283317465, Pages,
hosted and Release acceptance before combat production.

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
comparing different scenes directly. Exact release acceptance remains pending;
Checkpoint A is incomplete until required CI, Pages and hosted checks pass.

Raw final motion strips/native report:
`/private/tmp/hollowbane-warrior-checkpoint-a/final`; renders and discarded
pre-repair evidence: `/private/tmp/hollowbane-warrior-checkpoint-a`. Concise
machine evidence: `combat-review.json`. No physical-controller or other-hardware
verification. Do not start any next animation batch after this checkpoint.

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
