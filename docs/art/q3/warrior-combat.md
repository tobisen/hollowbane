# Q3-A Warrior combat — DBL-023/024/025/026

2026-10-26. The current request authorizes C1–C7 through final Warrior combat
review. Start with Southeast primary/secondary attacks. Verify public checkpoint
A before directional production; B before the playable arena/final candidate C.
Keep approved movement, normal graphics, simulation timings, damage, skills,
resources, saves and Phaser4.2.1 unchanged. No other characters or Act2.

## C1 source checkpoint — incomplete

Movement prerequisite **8394dd5dc709c455771eb62d277c080919eae58c** independently
rechecked against exact
[CI40283317465](https://github.com/tobisen/hollowbane/actions/runs/40283317465):
Full units/four Chromium shards/compatibility, Pages, hosted exact-SHA selected
flow and Release acceptance all succeeded. The user also confirms hosted
acceptance. This remains the latest verified deployed runtime.

`assets/source/q3/warrior-combat-se/motion.py` opens the approved v2 Blender4.5.3
rig directly. Its135 meshes/15 bones, sword attachment, materials, camera,
lights, texel density and256px window remain intact. Two **draft nonlooping
clips,12 poses each**: primary descending cut and secondary returning sweep.
Pose0–4 anticipation,5 impact,6–11 recovery. The retained `.blend` and `rig.json`
are authoring sources, not public runtime atlases or an approved attack pilot.
No external art or placeholders were added; metadata fingerprints the original
rig and producer. Approved movement files were not rewritten or rendered.

Native rig assertions pass for all24 poses: constant root128,210, invariant bone
lengths, connected elbows/wrists/knees, fixed ankle contacts and weapon geometry
inside the existing eight-pixel window. All24 final renders, reduced with the
existing2:1 Sharp filter/alpha>4 policy, have **minimum15px visible clearance**.
Light/dark contact sheets were visually inspected: no observed cell clipping
or distracting matte halos. The initial trial clipped primary05/06 and several
secondary poses; it was rejected. Authored arm reach was revised without changing
the camera, equipment scale or margin policy. Failed trial pixels remain local.

The motion remains restrained and needs timed gameplay-scale review; secondary
readability, sword/body overlap, anticipation/follow-through and movement seams
are not accepted. Still sheets are not motion approval. No final atlas payload,
texture-memory or native Mac frame-pacing result is claimed.

`src/rendering/warrior-attack-frame.ts` is an **unconnected presentation selector**.
It consumes the existing `AttackTimeline`; windup chooses0–4, active holds5,
recovery chooses6–11. Idle/hitstun/dead yield to other animation states. It creates
no clock/events, cannot alter combat, and selects the impact pose on the actual
`stepTimeline` strike boundary, including one-tick windup. Secondary here is an
art selection only; no new secondary gameplay action was introduced.

Ten focused selector/existing-timeline tests pass, covering both clips, current
speed durations plus short windups, exact strike boundaries, interruption,
death and immutability. TypeScript, affected ESLint and production build pass.
No browser change was made, so no browser check or unrelated campaign/loot/full
suite was run locally. Existing risk-based CI remains mandatory at publication.

## Resume C1

1. Reuse the retained sources and successful renders. Review actual timed motion,
   strengthen readable attack arcs/secondary distinction as needed, and check
   shoulder/body/weapon intersections and idle return. Do not expand directions.
2. Package a separate developer-only atlas with provenance, strict alpha/bounds,
   phase metadata and negative tests. Add an isolated browser pilot using real
   combat state/events and old/new comparison, without save access or live skins.
3. Verify focused browser/event synchronization and inspect gameplay-scale timed
   playback/light/dark captures. Profile the established native M4/Metal P2 route
   with matched p50/p95/p99/long-frame conditions; record payload/decoded sizes.
4. Only then commit/push public checkpoint A, require exact CI/Pages/hosted
   acceptance, and record its verified SHA before C2. User art approval remains
   false. Entire C1–C7 objective is incomplete.

Raw final renders, alpha audit and contact sheets:
`/private/tmp/hollowbane-warrior-combat-se-final`. Rejected first trial:
`/private/tmp/hollowbane-warrior-combat-se`. Native executable:
`/private/tmp/hollowbane-q3-recovery/blender-mount/Blender.app/Contents/MacOS/Blender`.

```sh
"$BLENDER_BIN" --background --python-exit-code 1 \
  --python assets/source/q3/warrior-combat-se/motion.py -- /private/tmp/warrior-combat --audit
```

Omit `--audit` only when new renders are necessary. The script writes the source
blend and manifest to the chosen output directory; retain them together after
verified authoring changes. Never run the old overnight orchestrator.
