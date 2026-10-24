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
world state or changing the retained source save. Two existing atomic storage/recovery cases, the legacy exit case and both
existing pause contracts also pass: seven unique focused browsers in total. No physical-controller claim.

Required classifier tier is Full because the shared inventory/scene contract
changes. Commit/push, exact CI/Pages, independent sealed hosted byte verification
and hosted Save & Exit/legacy/pause cases must pass before M2-C. Preserve unrelated
local documentation, original IDs/dependencies and broader open parents. Continue
only M2-C then M3 final review; no Act2 or new gameplay.
