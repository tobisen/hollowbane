# Act 1 gameplay quality — Q1 checkpoint

User authorization: Q1 fresh-character evaluation, then Q2 critical repairs and
Q3 visual/audio review, stopping after Q3. No Act 2. This is a scoped DBL-005 /
DBL-220 investigation; broader original requirements remain partial.

## Current result

**Q1 is in progress. Q2 and Q3 have not started.** The fresh-character opening
through the first claimed Act 1 quest passes for Warrior, Sorcerer and Ranger.
This does not establish fresh-character completion of the later campaign.

Evaluated public runtime:
`8c25b2f405a918d2960a7f38f42c6c0e22e0990d`. Exact CI39913610805 succeeded;
the public manifest and all 26 application files were independently checked
against its sealed artifact. All 26 application hashes equal the Full-accepted
D14 runtime `80871d0d869c77ff9b1062b928233e9e4a153ae6`.

## Genuine fresh-save opening

Each class used its own new Chromium context, seed42/content2 and the existing
isolated developer-save namespace, with normal hostile AI and damage enabled.
The developer flag supplies read-only navigation routes and isolated storage;
peaceful mode, immortality, class laboratories, generated earned fixtures and
live objective/damage/position mutations were not used.

Normal Inventory controls commit the class. New characters have level1,
zero XP/gold, an empty backpack/equipment and zero earned skill points. Class
selection/reload preserves the committed discipline. The audit attunes the camp
waypoint, accepts **Embers on the Road**, browses the unaffordable merchant and
empty stash, walks into the forest using existing virtual-stick navigation,
and defeats2030/2031 using ordinary held mouse attacks. Each earns50 combat XP.
The nearest real cache50101 is opened through Interact, satisfying the final
quest objective. The actual ready checkpoint is saved/reloaded, followed by a
real walk home, Edda interaction and one reward claim through the journal.

| Class    | HP after second kill | HP at cache | Claimed result                                         |
| -------- | -------------------- | ----------- | ------------------------------------------------------ |
| Warrior  | 261 /300             | 254 /300    | Level2,130 XP,41 gold,5 attribute points,1 skill point |
| Sorcerer | 261 /300             | 254 /300    | Level2,130 XP,41 gold,5 attribute points,1 skill point |
| Ranger   | 239 /300             | 239 /300    | Level2,130 XP,41 gold,5 attribute points,1 skill point |

First reward item: identified Trail Boots `l3-51550002-1`, dropped near Edda.
It is not automatically equipped or placed in the backpack. Opening audit:
3/3 Chromium cases,90.665s, zero skipped/flaky/unexpected cases. These timings
are not class-balance measurements: input/render timing differs, and the
level1 characters have no learned class ability yet.

The ready-checkpoint reload uses the existing resource restart policy:300
current HP on load. It is an explicit meaningful save/reload leg, not evidence
of uninterrupted survival or of health persistence. No artificial healing or
completion shortcut was introduced.

## Earned camp continuation

All three actual first-claimed saves were restored verbatim in separate browser
contexts through the existing checkpoint loader. No generated campaign fixture
was used. Each character picked up its real reward boots, allocated five earned
Vitality points, learned one primary rank (Sundering Fan / Ember Lance / Briar
Needle) and assigned it to slot1. The reward item was stored and retrieved at
Orren's stash, retaining its identity. A separate merchant Trail Boots purchase
spent30 of the41 earned gold, leaving11. The original reward boots were equipped;
the purchased pair remained in the backpack. Save/reload retained equipment,
class, skill rank, attributes, merchant purchase and empty stash. The next
checkpoint has130 XP,5 allocated Vitality and no unspent skill point.

Camp continuation:3/3 Chromium cases,30.756s, zero skipped/flaky/unexpected cases.
All three final screenshots were reviewed: learned class skill names/prompts,
300/325 HP,11 gold and camp interactions are visible. This establishes allocation
and assignment/persistence, not combat-effect correctness of the learned skills.
The investigation changed no production code, assets or combat rules.

## Driver failures and observations

Earlier attempts are retained separately and are not passing evidence. One
attempt tried to attune the forest waypoint at the entrance rather than near
its actual anchor. Its subsequent long detour ignored nearby threats and left
the Warrior at48 HP. Another target selector assumed an actor `kind` field that
the read-only combat presentation does not expose. The corrected opening
fights nearby enemies before optional travel and selects existing hostile IDs.

Camp continuation initially had an ambiguous item selector, a loot-view
readiness race, then attempted to click the decorative inventory item overlay.
The accessible inventory cell buttons are the existing interaction surface;
the correction uses the same selector as the retained inventory tests. No
assertion, combat value, objective or production input behavior was changed.

No game-breaking or progression defect has been established in the covered
opening. The camp simultaneously advertises a separate **Begin expedition**
objective and the Act 1 journal; this is a potential onboarding confusion to
review after Q1, not yet a confirmed progression bug. Class choice is inside
Inventory/Skills rather than a dedicated character-creation screen. Dedicated
animation/environmental audio and physical-controller/native-GPU limitations
remain as documented in the [Act 1 guide](../overnight/act1-guide.md).

## Evidence and exact continuation

Raw evidence is outside Git at `/private/tmp/hollowbane-act1-q1/`: temporary
Playwright audit source/configuration, `results.json`, class JSON observations,
screenshots, retained failed attempts and checksum-validated actual browser
checkpoints. `fresh.spec.ts` recreates the opening using existing repository
helpers. `camp.spec.ts` continues the real `CLASS-first-claimed.save` bytes;
it does not construct completed quest or earned-progress fixtures. These
investigation tools are not added to the ordinary CI inventory.

The actual first-claimed checkpoints have these SHA256 values:

- Warrior: `a7e9a7fd7084df7d40b7991a3871ddd5c44973a8c2a593a96fdcf3bc74b714c4`.
- Sorcerer: `eaa6871d3036ac57b5cf2561e72dba3b35e7c5f2ebc5c2c85d479ee86442d5c7`.
- Ranger: `ad68e9e6187de9e1942b9f6830c4364bd7615614db3053840d8004127d522f70`.

Continue from the actual `CLASS-camp-upgraded.save` checkpoint, whose SHA256 is:

- Warrior: `d6273d696b08277fb73bdc9c7903ec5dcfef831783835f177db0ee2946d0664e`.
- Sorcerer: `e9b66e9fe195db48f36e414f1c365ae8797a929cfe5c4634a2ef00edec8c1c4b`.
- Ranger: `0ab014248b6e33fcbb57494feb7dd2bb11f6a004c6c7e217a26f97fe08917c57`.

Next verify each learned primary through actual combat, then accept **Names
Beneath the Ash**, traverse the active forest and continue through the graveyard
quest/miniboss, crypt quest/finale, waypoint destinations and final return/claim.
Vendor sale, nonempty stash reload, meaningful mid/late-game save/reload and the
normal permanent-save namespace also need fresh-run evidence. Existing retained
functional tests cover these independently; they do not complete this new Q1
playthrough requirement. Record failed tactics separately from reproduced game
defects. Never replace these actual saves with the D06/D14 constructed checkpoints.
If temporary files are unavailable, reproduce the opening steps above through
normal UI; keep this remaining coverage open until actually observed.

No Q1 completion/release-gate claim and no Q2/Q3 advancement until the remaining
fresh-character evaluation is recorded and its required release gate passes.
