# M3 player experience quality candidate — DBL-004/208/210

All preceding deliverables were accepted individually before the next began:

| Deliverable             | Verified deployed SHA                      | Exact Full CI                                                                          | Independent hosted evidence                              |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| M1-C creation/selection | `9e928a74ae34dcb0d628cc2b49990d32d8e4f699` | [40103889624](https://github.com/tobisen/hollowbane/actions/runs/40103889624)          | 34 files;21 menu/session cases88.1s                      |
| M1-D original artwork   | `92df8c5200b1dec0404870533097a070cc4a04c8` | [40106915374](https://github.com/tobisen/hollowbane/actions/runs/40106915374)          | 41 files;six visual/input cases15s                       |
| M2-A pause              | `bb045d9365eff19e72b8d3d7a1de0ee995fdb8a8` | [40110335417](https://github.com/tobisen/hollowbane/actions/runs/40110335417)          | 41 files;four pause/controller/fullscreen cases15.4s     |
| M2-B awaited exit       | `eca7b7d7eb7fff527dedafefd96949de996def5e` | [40113225405](https://github.com/tobisen/hollowbane/actions/runs/40113225405) attempt2 | 41 files;five exit/legacy/pause cases42.5s               |
| M2-C settings           | `dd45ecc14de327b3b455e7b11eadf1dbc6e793ad` | [40117235307](https://github.com/tobisen/hollowbane/actions/runs/40117235307)          | 42 files;seven settings/exit/pause/fullscreen cases50.2s |

Every row includes required CI/Pages/hosted/Release acceptance and screenshot
review. Failures/cancellations are retained in the deliverable records; none was
claimed as an accepted deployment. M2-B's unchanged navigation case passed on
same-commit retry; M2-C's transient GitHub jobs API502 did not fail CI.

## Final verification scope

Two new production-build scenarios pass locally61.5s combined. One creates all
three named classes through confirmation in the same browser, enters Ashen Refuge
at level1/zero XP, moves through real keyboard input, exports the live checkpoint,
pauses, awaits Save & Exit, then Continues the exact same full snapshot. Each new
owner leaves previously saved owners unchanged; root reload and eight-slot
selection retain all three. The final decoded selection screenshot is reviewed.
These are short camp journeys, not fresh full-campaign completions.

The other uses explicit constructed level24 fixtures with distinct XP totals,
item instances, gold and seeded worlds; one has an empty quest ledger while the
others have an accepted quest. Runtime exports preserve original progression,
items/equipment, local stashes, containers/gold, quests and seeds. Actual selection/
Save & Exit switches all three without changing any other canonical snapshot.
Named deletion cancel preserves all owners; confirmation archives only the chosen
Sorcerer, preserves the two others and leaves Continue on the recent Ranger.
These constructed checkpoints are not earned-play or campaign-balance evidence.

Existing mandatory suites provide eight-slot/concurrent-create protection,
failed-write/duplicate safety, stale-tab CAS, corrupt-recent same-owner recovery,
retained/idempotent schemas1–5 legacy migration, inventory-only compatibility,
developer isolation, keyboard/Xbox/PS semantic navigation, all portrait decoding,
360/760/2560 layouts, paused committed combat, live settings and existing native
fullscreen/context behavior. Final hosted verification will run the actual
production-storage, menu/character, player experience, pause/exit/settings and
surface suites, without unrelated extended loot/performance simulations.

TypeScript, affected ESLint/Prettier and production build pass. The initial
test-only M3 candidate had unchanged application bytes and explicitly dispatched
Full. Later cache-restoration qualification exposed a Settings adapter defect,
so that pending run was cancelled before deployment (details below). Final M3
also reconnects the adapter to the existing public fullscreen control after
persisted-page restoration and disconnects on lifecycle cleanup. The separate
fullscreen/context implementation is unchanged. Three focused settings/surface
contracts pass15.1s, including native fullscreen enter/exit after synthetic
persisted-page events. This does not claim native browser-cache or hardware use.
The corrected shared adapter automatically requires Full; use that new exact
Full/Pages/hosted run for final acceptance. No policy/assertion/deadline is weakened.

## Gate and remaining scope

Final exact Full CI, Pages, sealed/hosted byte verification and hosted E2E remain
pending. Record the final deployed SHA and results before declaring technical
completion. Then STOP at M3 quality review; human quality approval remains false.
No Act2 or unrelated gameplay/engine work is authorized by this milestone.

Music has no backend/tracks and is explicitly unavailable in Settings. Broader
master/music mixer/camera options in DBL-208, dedicated in-game character animation/
art, physical controller/vibration DBL-282–286/native-device metadata, reference
hardware/GPU performance and older synchronization/partial-parent follow-ups
remain open. Virtual browser tests never imply physical verification. The four
original generated menu sources/seven optimized WebPs/provenance remain in
[art.md](art.md), [menu art provenance](../art/menu.md) and the asset manifest.
Phaser4.2.1, save schemas/legacy histories, simulation mechanics, original IDs/
dependencies and separate fullscreen/right-click implementations are preserved.

Detailed contracts: [characters](characters.md), [pause](pause.md),
[exit](exit.md), [settings](settings.md). Public URL:
https://tobisen.github.io/hollowbane/.

## Exact final release checkpoint

Candidate `7f5ee5543ad50cbb9223690c7b08d2eab922ee04` committed/pushed. Explicit
[Full CI40119514055](https://github.com/tobisen/hollowbane/actions/runs/40119514055)
is running. Automatic push Integration40119514466 was superseded/cancelled by
normal main-branch concurrency; it was never accepted. Use the explicit Full run
for exact final CI/Pages/hosted acceptance. Last accepted deployment remains
`dd45ecc`. Sealed destination `/private/tmp/hollowbane-m3-7f5ee55`; independently
compare all42 files with current tested dist and public bytes. Then run the eight
relevant hosted suites listed in STATUS, review final captures, record actual
counts/SHA and STOP at M3 quality review. Entire assignment remains incomplete
until those checks pass. Post-push evidence stays local to preserve release identity.

## Retained cache-restoration defect / replacement candidate

A new focused persisted-page contract failed the original existing label assertion:
fullscreen entered, but Settings still said Enter fullscreen. Its observer watched
the removed public control. Original trace/screenshot retained in
`/private/tmp/hollowbane-menu-work/m3-settings-cache-failure`. Reconnect only the
Settings observer to the remounted control; retain lifecycle listeners for cached
pages and abort on final teardown. Public fullscreen/context behavior is untouched.
The exact same contract and existing surface lifecycle plus virtual navigation
now pass15.1s; static/build/format pass. Explicit Full40119514055 /7f5ee55 was
cancelled before deployment; its completed unit/compatibility jobs passed, but
interrupted browser jobs are not passes. No M3 release accepted yet. Commit/push
the focused correction and require a new exact automatic Full release gate.
