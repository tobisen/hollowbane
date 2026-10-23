# Act 1 gameplay quality — Q1 checkpoint

Current continuation authorization: finish Q1-B–E from actual earned saves and
stop at the Q1 quality gate. Q2/Q3 and Act 2 are excluded. The earlier broader
quality mission remains historical context. This is a scoped DBL-005 / DBL-220
investigation; broader original requirements remain partial.

## Current result

**Q1 is in progress. Q2 and Q3 have not started.** Q1-B learned-primary combat is
now verified for all three classes. Each actual character has traversed the
active forest, entered the graveyard and defeated Stonebound. The remaining
graveyard quest/miniboss, crypt/finale and waypoint travel are still open. The
newest earned checkpoints and exact next action are below; do not replay the
completed opening.

Evaluated public runtime:
`8c25b2f405a918d2960a7f38f42c6c0e22e0990d`. Exact CI39913610805 succeeded;
the public manifest and all 26 application files were independently checked
against its sealed artifact. All 26 application hashes equal the Full-accepted
D14 runtime `80871d0d869c77ff9b1062b928233e9e4a153ae6`.

## Q1-B–E continuation checkpoint — 2026-10-23

Reconfirmed public `904dfa399ce3d55a855112835111cef8bbd34c4d` against its sealed
manifest and all26 hosted application files. Its successful CI39948803361 /
Pages7277464047 remain the release evidence. No production file, difficulty,
assertion in the retained regression suites, asset or CI policy changed during
this continuation. There is no new deployment for this evidence-only work.

All three original camp-upgraded saves were available and matched their
recorded SHA256 values. No character restarted at level1 and no constructed
campaign fixture was used. Original save artifacts remain intact.

### Earned RPG transactions and persistence

Each character stored its purchased spare boots, reloaded a genuinely nonempty
stash, retrieved that same identity and sold it through Orren's normal UI. The
sale yields7 gold, taking11 to18. Equipped quest boots,130 XP, allocated points
and learned ranks remained unchanged; the spare identity entered the merchant
retirement ledger and left both bag and stash. A subsequent reload preserved
gold. This continues the earlier actual purchase, without regenerating items.

### Learned primary combat

All three class primaries executed through keyboard, mouse and standard virtual
Xbox primary input in real active-AI encounters. Sorcerer/Ranger completed the
three modes in the forest. Warrior's keyboard cast was verified there; mouse
and controller were completed against the real graveyard Stonebound after
bounded attempts against retreating forest targets. No further tactical driver
was added to make those forest melee attempts pass.

Observed accepted costs/cooldowns: Sundering Fan7 mana/30 ticks, Ember Lance8/18,
Briar Needle9/45. Holds do not create another keyboard press-edge cast. Accepted
start tick, cooldown deadline and mana balance were checked against simulation
ticks, accounting for the existing4 mana/second Still Well baseline and the
Sorcerer's additional0.5/second. Fire damage, Ranger physical/poison damage and
poison application, and Warrior physical hits/forced stagger were observed.
Ember Lance has no authored status. No unearned skill rank was granted.

### Active forest, graveyard and Stonebound

The normal virtual stick traversed the live forest and reached the graveyard
for each character. Arrival saves retained ranks/equipment/gold and recorded
the actual **Names Beneath the Ash** travel objective. A post-reload observer
accessed the world before readiness and failed; only the three already-earned
arrival saves were then rechecked with a readiness-aware observer. Forest travel
was not replayed to fix that observation race. Restoration retained quests,
progression, equipment and18 gold.

All three subsequently defeated the unmodified248-HP Stonebound3010 with normal
AI and genuine damage. Warrior also executed the remaining two primary input
modes during this fight. All survived; the actual snapshot contains3010 in the
graveyard death ledger and exactly60 additional earned XP. Stonebound is the
ordinary guard, **not Cairnwarden Rhusk**, which remains alive/unverified here.

| Class    | Level / XP | HP at Stonebound victory | Primary inputs                      | Latest actual save                  |
| -------- | ---------- | ------------------------ | ----------------------------------- | ----------------------------------- |
| Warrior  | 2 /190     | 145 /325                 | Keyboard, mouse, virtual controller | `warrior-stonebound-defeated.save`  |
| Sorcerer | 2 /215     | 197 /325                 | Keyboard, mouse, virtual controller | `sorcerer-stonebound-defeated.save` |
| Ranger   | 2 /215     | 197 /325                 | Keyboard, mouse, virtual controller | `ranger-stonebound-defeated.save`   |

These HP values are not a matched class-balance comparison: Warrior performed
additional input checks during its fight. Checkpoint reloads follow the existing
300-current-HP restart policy, not continuous health persistence or deathless
campaign proof. Living nearby packs may defer reactivation until the player
moves away after a reload; do not infer saved kills from absent runtime actors.
All three new victory screenshots were reviewed.

### Findings and limits

No combat/progression/save defect was established in this covered segment. A
minor UX mismatch is visible: the learned Warrior slot says **Sundering Fan**,
while successful skill feedback says **Iron Fan: effect**. Preserve this as a
later quality finding; Q2/Q3 fixes are outside the current continuation.

Failed attempts remain separate evidence: T cycles actor order rather than
selecting the approached enemy; retreat can invalidate melee range between
approach and cast; an extra basic attack or poison can kill a target before its
next selected cast; mana regeneration continues during host/controller latency.
An archived driver source was briefly included in discovery and that run was
interrupted/excluded. No failed run was counted green. The final forest report
still has two passing class cases and one failed Warrior case; the subsequent
real Stonebound cases supply the missing Warrior evidence.

Raw evidence and temporary scripts/configuration are at
`/private/tmp/hollowbane-q1-continuation/`: `rpg-results.json` (3 pass),
`skills-results.json` (2 pass/1 fail), retained earlier attempt directories,
`travel-results.json` (3 fail at the post-arrival reload observer),
`reload-results.json` (3 pass), `stonebound-results.json` (3 pass), per-class
observations and actual serialized saves. These are investigation artifacts,
not added ordinary CI inventory or artificially completed fixtures.

### Exact next checkpoint

Resume each actual victory save under `/private/tmp/hollowbane-q1-continuation/`:

- Warrior SHA256: `fead063c44705008b90d9fbbfdad34f01ead1f8653ef0cf6f0bf57814893ade2`.
- Sorcerer SHA256: `becfa3a6b10128ae616a7497eaf4ba2564c4e262657661df0553d9c24c40f664`.
- Ranger SHA256: `e4f027bdb4b5b057f606c4642b77c96757cac4f88c02bf1dc849d4f82a4b37ab`.

Each is in the graveyard with18 gold, original equipped quest boots, one learned
primary rank and **Names Beneath the Ash** active with its travel objective and
one of two kills recorded. Next complete a second actual graveyard kill and
cache, Cairnwarden3050, the legitimate return/Orren claim and earned upgrades;
then the crypt quest, finale acceptance/fight/return/claim for each class.
Waypoint discovery/travel, later loot/equipment progression, late saves and the
normal permanent-save namespace remain open. Q1-C/D/E are not complete; stop at
Q1's quality gate and do not start Q2/Q3. Use these newest saves, not the older
camp/arrival artifacts or generated D06/D14 fixtures.

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

The camp-upgraded checkpoints above are historical starting artifacts. Continue
from the newer Stonebound victory saves listed in the continuation section.
Opening/camp actions, Q1-B primary inputs and the completed Stonebound fight
need not repeat. Keep the earlier constructed-fixture functional evidence
separate from this actual earned campaign lineage.

No Q1 completion/release-gate claim and no Q2/Q3 advancement until the remaining
fresh-character evaluation is recorded and its required release gate passes.
