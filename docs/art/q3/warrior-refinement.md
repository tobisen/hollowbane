# Q3-A Warrior art refinement — DBL-023/024/025/026

2026-10-25. The user authorized the complete Warrior set, beginning with a
reviewed art refinement. This checkpoint covers deliverable 1 only. The accepted
pilot at ba04838027c66aa81254e43f8b4c311eda29d283 remains available, unchanged.

Original v2 source: `assets/source/q3/warrior-rig-v2/warrior.py` and `warrior.blend`.
No external textures, meshes, motion capture or new AI sheets. Object-space
pigment variation, rougher charcoal steel, faceted shoulder caps, bronze cuirass
chasing, greave straps, folded crimson tabard/mantle and swept hair detail refine
the same original model. Rig proportions, motion, bone lengths, weapon geometry,
root, camera, lights and export dimensions retain the accepted pilot contract.
Materials and small surface overlays change; no simulation code changes.

Preview: `?developer=1&warriorPilot=1&warriorRefined=1`. The comparison link opens
the accepted pilot; both compare with shipped graphics. The candidate is an
explicit developer route and remains a placeholder awaiting art approval.
Normal gameplay keeps its shipped atlas. Eight idle and sixteen walk frames,
southeast only; no run/combat/other directions yet. Cadence remains the pilot's
known limitation and belongs to deliverable 2; no movement-speed adjustment.

Reproduce with the pinned native Blender4.5.3 executable from pipeline-recovery:

```sh
"$BLENDER_BIN" --background --factory-startup --python-exit-code 1 \
  --python assets/source/q3/warrior-rig-v2/warrior.py -- /private/tmp/warrior-refined
node scripts/package-warrior-pilot.mjs /private/tmp/warrior-refined refined
node scripts/validate-warrior-pilot.mjs public/dev/warrior-refined
```

Validation/release evidence is recorded below before checkpointing. Do not infer
full-set completion, performance approval or production activation from this batch.

## Local checkpoint evidence

Seven focused asset units, four Chromium preview cases, TypeScript, affected lint,
formatting, asset validation and build pass. The new unit audit checks exact
accepted roots, bone lengths, foot contacts and weapon bounds for all24 poses.
All24 poses and light/dark browser captures were inspected; armor accents and
fabric separation improve readability. The finish remains partly sculptural.
No visible cell clipping or distracting halos. User art approval remains false.

PNG746968bytes,6MiB decoded; no approved pilot or production atlas bytes changed.
Three native Apple M4/Metal alternating pairs at the same existing empty-stage
conditions: shipped p9517.0/17.6/17.4ms; refined17.3/17.6/17.4ms; longest17.7ms,
zero>25/33/50ms in either. No meaningful preview regression observed. These are
not the P2 forest keyboard/controller scenarios or complete-set performance.
Concise evidence: [refinement-review.json](refinement-review.json).
Raw captures/measurements: `/private/tmp/hollowbane-warrior-refinement` and the
focused Playwright output directory. No local campaign/loot/progression suites.

Required release classification remains Full under existing tooling/asset policy;
no local unrelated Full run or policy downgrade. Exact CI, Pages and independent
hosted preview verification are pending. Resume this release gate before cadence
or directional production. The overall complete Warrior assignment is incomplete.
