# Q3-A player art checkpoint — DBL-023/024/025/026

2026-10-25. User authorized Q3-A through Q3-E and final quality review, starting
with players. P1/P2 are accepted prerequisites. Act 2 is excluded. Existing
mechanics, classes, progression, save fingerprints, Phaser4.2.1 and native Mac
pacing must remain intact. No old overnight orchestrator is used.

## Warrior production trial

Built-in imagegen produced two original southeast-facing action studies,
48 poses each: six chronological frames for idle, walk, run, melee, cast, block,
hit and death. The existing original Warrior menu illustration supplied costume
and material reference only; neither study is a repurposed portrait. Sources:
`assets/source/q3/warrior-actions-se-v1.png` and `warrior-actions-se-v2.png`.
Their rights follow original project prompts/generated art, with release rights
review pending; no third-party imagery or license claim. Both are **quarantined
production candidates**, registered as placeholders and absent from public assets.

Both generated1086×1448 rather than requested1536×2048. Visual inspection found
weapons crossing nominal cell boundaries, drifting roots/scale and suspect edge
fringes. The second call requested only layout/alignment correction, retaining
identity and actions. It did not fix the regular-grid contract. All48 cells in
each source fail the minimum8/128-cell alpha margin/occupancy check. This is a
measured source rejection, not completed gameplay art or a finished animation set.
The audit cannot determine anatomy, correct feet or temporal continuity by itself.

The third call reduced the request to six southeast walk poses in a2×3 grid,
with much larger requested padding. Source `assets/source/q3/warrior-walk-se-v3.png`
is1024×1536. Four of six cells still fail clear margins; visual review also finds
broad semitransparent halos and insufficiently distinct alternating support legs.
It is retained as a rejected trial, not a gameplay-ready walk clip. Generation is
available, but consistent aligned animation has **not** been achieved in these
three calls. Do not scale production from these sources.

Run `node scripts/audit-player-pilot.mjs assets/source/q3/warrior-actions-se-v1.png assets/source/q3/warrior-actions-se-v2.png assets/source/q3/warrior-walk-se-v3.png`
to reproduce dimensions, SHA256, bytes, decoded sizes and all cell bounds in
[warrior-audit.json](warrior-audit.json). Its successful execution reports rejected
sources; it is not a production acceptance command. Open
[warrior-showcase.html](warrior-showcase.html) locally for all eight v2 action
strips at illustrative8fps. Pause is available; death holds its last pose.
Crosshairs make inconsistent roots visible. Cropping intentionally exposes source
errors, rather than hiding them by individually fitting every frame.

## Resume before production

Resolve the representative-set blocker: use individually controlled poses or a
rigged source with reviewed foot roots and constant body scale, retaining the
original Warrior costume reference. The smaller-strip trial above was insufficient.
Do not mass-produce a dense grid. Validate alpha/weapon containment, silhouette,
foot alignment and temporal continuity in motion before extending to eight
directions or Sorcerer/Ranger. Separate walk/run and melee/ranged/cast/hit/death
must eventually use authored clips synchronized to existing simulation phases and
events. Existing shared wanderer and procedural action stand-ins remain open.

No renderer, simulation, audio, collision, layout, save, timing or shipped asset
changed in this checkpoint. Native before/after profiling is deferred until a
meaningful rendering change; no performance improvement is claimed. Matched
conditions and raw P2 baseline remain in `docs/quality/mac-frame-pacing.md` and
`/private/tmp/hollowbane-p2`. Baseline verified deployed SHA:
`2b29458d774cda4576ea64bab8ce7a8d8e005e19`, exact CI40218730021 confirmed successful.
Q3-B/C/D/E remain pending. No Q3 quality gate is approved by this checkpoint.

## Verification / release

Source audit, showcase browser inspection and focused static/asset validation are
recorded in STATUS.md. Checkpoint publication is separate from acceptance of
production artwork; mandatory CI/Pages/hosted checks must pass before advancing
to another deliverable. Unrelated local documentation is preserved.
