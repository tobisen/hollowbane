# M2-B awaited Save & Exit — DBL-210/004

Prerequisite M2-A `bb045d9365eff19e72b8d3d7a1de0ee995fdb8a8` /
[Full CI40110335417](https://github.com/tobisen/hollowbane/actions/runs/40110335417)
passed exact Pages/release acceptance, all41 independent hosted byte comparisons
and four hosted pause/controller/fullscreen cases before this implementation.

Save & Exit keeps the existing simulation pause active, disables repeat actions
and displays a live saving status. InventoryView captures a complete current
runtime snapshot even for position-only changes, drains older autosaves and any
new dirty snapshot, then awaits the existing owner activation before navigation.
Atomic CharacterStorage writes/CAS, immutable owner identity and the existing
schema/migration/backup engine are reused unchanged. No progress-domain fields
are reconstructed in the menu. World position/layout/discovery/waypoints, quests,
progression/skills, items/equipment/gold and owner-local stash travel together
through the existing serializer. Transient combat/resource restart policy stays
unchanged. Successful navigation returns to the root; Continue restores that
same validated owner. Browser-cache restoration of an exited page returns to root.

On write/activation failure the dialog stays paused, restores enabled actions,
focuses Retry, explains that live progress remains and offers Resume/inventory
export. No success is shown before awaited persistence. A stale-tab conflict
remains an error; this interface never replaces another revision/character.
Developer sessions retain their existing controls and storage behavior.
Fullscreen/context-menu implementations and Phaser4.2.1 are untouched.

## Verification

Sixteen focused inventory/progression/registry units and TypeScript/affected
ESLint/format/build pass. Two new browser cases pass26.3s: a gated actual production
owner write proves no early root navigation/success, one write under double click,
Escape cannot resume while busy, full canonical snapshot restoration, recent
selection and two-owner switching without contamination. Injected IDB quota
failure proves both stored originals remain identical, live allocated progress
can still be exported after Resume, and retry saves the same complete snapshot.
Fixtures contain constructed level24 skills/XP, equipment, socketed backpack item,
stash, gold and accepted quest/world state; this is not a genuine campaign run.
The legacy browser case also exercises awaited exit/Continue without inventing
world state or changing the retained source save. Two existing atomic storage/
recovery cases, the legacy exit case and both existing pause contracts also pass:
seven unique focused browsers in total. No physical-controller claim.

Required classifier tier is Full because the shared inventory/scene contract
changes. Commit/push, exact CI/Pages, independent sealed hosted byte verification
and hosted Save & Exit/legacy/pause cases must pass before M2-C. Preserve unrelated
local documentation, original IDs/dependencies and broader open parents. Continue
only M2-C then M3 final review; no Act2 or new gameplay.

## Exact publication checkpoint

Candidate `eca7b7d7eb7fff527dedafefd96949de996def5e` committed/pushed. Exact
[CI40113225405](https://github.com/tobisen/hollowbane/actions/runs/40113225405)
is running; Full/Pages/hosted acceptance pending. Sealed artifact destination
`/private/tmp/hollowbane-m2-b-eca7b7d`; independently verify all41 public files,
then hosted player-exit/player-pause and inventory-only legacy cases (five).
Review actual saving/failure captures before acceptance. Last accepted deployment
remains `bb045d9`; M2-C cannot start yet. All seven local browser cases passed;
updated paused screenshot reviewed. Post-push records remain local.

## Retained CI failure / exact-commit retry

Attempt1 of CI40113225405 failed the unchanged D07b real-mouse boss approach,
before the fight or persistence: existing10s arrival predicate, armed stick,
alive300/350HP, walking tick447,0.169205 units from waypoint7/3.5.72 other shard1
cases and all three other shards/units/15 compatibility passed. Pages/hosted were
skipped. Original report/log/trace/screenshot retained under
`/private/tmp/hollowbane-menu-work/m2-b-ci-*`; failure screenshot reviewed.
The smallest unchanged local case passes25.2s. No production/assertion/deadline
change or success claim. Retry failed CI jobs on the same exact candidate SHA;
M2-C remains gated on full successful release acceptance.

## Accepted release — October24

Verified deployed SHA `eca7b7d7eb7fff527dedafefd96949de996def5e`. Exact
[Full CI40113225405](https://github.com/tobisen/hollowbane/actions/runs/40113225405)
attempt2 passes all required jobs/Pages/hosted/Release acceptance. The unchanged
retry shard reports73 passes/zero skips/flaky;15 compatibility cases pass. The
first attempt's navigation failure remains recorded above. Independently matched
all41 hosted files; five hosted exit/failure/legacy/pause scenarios pass42.5s,
zero skips/flaky. Saving/failure screenshots reviewed; live main matches.
Generic input hints remain visible during busy saving although actions correctly
stay blocked; refine during the remaining UI integration/review.

M2-B is technically released. Continue authorized M2-C settings, then M3 final
Full review; no Act2. Entire assignment remains incomplete. Machine evidence
`/private/tmp/hollowbane-m2-b-release.json`. No physical-controller claim.
