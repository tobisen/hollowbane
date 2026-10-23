# Act 1 gameplay quality — Q1 checkpoint

Current continuation authorization: finish Q1-B–E from actual earned saves and
stop at the Q1 quality gate. Q2/Q3 and Act 2 are excluded. The earlier broader
quality mission remains historical context. This is a scoped DBL-005 / DBL-220
investigation; broader original requirements remain partial.

## Current result

**Q1 is in progress. Q2 and Q3 have not started.** Q1-B learned-primary combat is
now verified for all three classes. All three have also defeated Cairnwarden,
claimed the graveyard quest and passed camp/graveyard controller waypoint
roundtrips and reloads. Graveyard loot is collected/equipped; all three have
entered the crypt. Sorcerer has claimed the crypt quest and attempted Sevra
twice without victory; Warrior/Ranger have their kills/treasure but need the
beacon. No Act1 completion. Resume the newest earned saves below.

Evaluated public runtime:
`8c25b2f405a918d2960a7f38f42c6c0e22e0990d`. Exact CI39913610805 succeeded;
the public manifest and all 26 application files were independently checked
against its sealed artifact. All 26 application hashes equal the Full-accepted
D14 runtime `80871d0d869c77ff9b1062b928233e9e4a153ae6`.

## Q1 Sorcerer finale attempts and remaining crypt checkpoint — 2026-10-23

Reviewed local evidence `bfe7e6c`; independently verified all three recorded
crypt input SHA256 values before restoration. Sorcerer was evaluated first.
No original checkpoint was overwritten; new saves use exclusive creation.
No production/difficulty/HP/AI/content/CI change or deployment. Public release
remains previously verified904dfa3. All changes here are scoped DBL-220 evidence.

### Sorcerer: crypt claimed, finale attempted twice, not completed

From the ready actual save, walked to the anchor and observed “Waypoint within
reach. Choose an attuned destination.” Attuned Ancient Crypt, travelled to camp,
reported to Edda and claimed The Light Below (+220XP/+60gold), accepted
A Lantern Unbound, then travelled back to the crypt. Actual camp acceptance
and pre-Sevra checkpoints remain preserved. This focused case passed10.8s.
Level3/1115XP/310gold; original boots, Iron Cap, Bark Guard and Ember Lance rank1
remain. The earlier blocked attunement did not reproduce as a defect.

First genuine attempt crossed the active crypt, reached the boss with36HP,
cast Ember Lance from idle, and died after97 total recorded boss damage.
Second genuine attempt restored the earned living approach checkpoint under
the documented restart policy, moved normally until the surviving encounter
reactivated, reapproached with154HP, cast Ember Lance again and died after161
recorded boss damage. Both have actual actor0 start/effect/projectile-hit events
and positive basic damage against4090; monster casts are excluded. Phase0
seal-rake/cold-edict telegraphs and interrupts were observed. Death resets
living Sevra to840HP, so terminal840 is not evidence of zero inflicted damage.
Neither attempt reached phase2 or boss death; no kill XP, finale reward or
Act1 completion is claimed. Both failed combat reports remain failures.

A separate retry stopped before combat because its driver assumed the living
boss existed immediately after a nearby reload. Source confirms the existing
nine-unit spawn safety radius defers surviving packs, including Sevra. Normal
movement away reactivated the same unmodified840HP encounter. This failure is
not an extra combat attempt or proof of a defeated boss. Initial temporary
syntax discovery failure was also corrected before browser execution.

### Warrior and Ranger: kills and treasure saved, beacon pending

Warrior legitimately killed4051 (+60XP;4042 already saved), opened actual50305
(+44gold), and subsequently picked up/equipped its earned Ash Blade `l8-2a-5`.
Two normal-input walks toward the beacon ended in actual player deaths under
active crypt-pack pressure; no further objective was forced. Latest living
save: level3/620XP/130gold, both required kills and treasure complete.

Ranger collected/equipped its saved Ash Blade `l8-2a-5`, opened50304 (+46gold),
and collected the real cache Copper Band `l8-38eb5d7c-0`, now in the backpack.
Both required kills remain4042/4043. First beacon navigation stalled alive at
248HP with a repeated simulation tick; it is an unresolved driver/runtime
observation, not a proven game defect. The continuation then picked up the
band but incorrectly tried to select an already equipped blade in the backpack.
That selector failed; the actual living state including the new band was saved.
Latest living save: level3/635XP/132gold. Beacon, Edda return/claim, finale
acceptance and boss attempt are still pending for both Warrior/Ranger. Do not
call them failed Sevra fights or replay their saved kills/chests.

### Quality assessment and verification

- Confirmed gameplay defects: none newly established. The earlier skill-feedback
  naming mismatch remains a Q2 candidate and is not repaired here.
- Difficulty/balance observations: normal crypt pack pressure repeatedly killed
  a walking/held-attack driver, including Sorcerer en route/near Sevra. This is
  not a matched human class-balance study or proof that the boss is unbeatable.
- Driver limits: route-only navigation ignores remaining threats; a single cast
  then stationary basic attacks does not supply authored counterplay. Nearby
  reload activation, an equipped-item selector and one stalled live navigation
  need correct handling. Stop escalating tactical automation; use bounded normal
  skill-first pack clearing or manual play from these earned checkpoints.

Original equipment/stash/quest claims and earned progression remain; Warrior
and Ranger legitimately add their blades, Ranger its band. Three narrow final
checkpoint reload cases passed3/3 in8.8s. Independent saved-domain comparisons
confirm equipment/progression, quest/gold/stash/waypoint state and all area
seeds/layout fingerprints/deaths/drop identities. Restored300/350HP/100mana
follows the previously reviewed policy, not continuous survival. All three
continuation screenshots were reviewed. No full regression or release needed.
Raw scripts, failures, traces and prior/new earned saves are outside Git at
`/private/tmp/hollowbane-q1-sevra/`, including `attempt2/` (pre-combat driver
failure), `attempt3/` (second combat attempt), `crypt-resume/` and reload results.
The initial one-class prep result and later two-class prep failures use the same
report filename; final `prep-results.json` is the failed two-class report, not
proof that all prep cases passed. Sorcerer's passing checkpoint/log is retained.

### Exact continuation: stop at session boundary

All latest files are under `/private/tmp/hollowbane-q1-sevra/`:

- Sorcerer `sorcerer-continuation.save` SHA256 `8412c5e68e2d52874e00d2632e6d859d1b3430816635feb69c0e5fb9a4680ace`; level3/1115 XP, 310 gold; restored300/350HP,100mana.
- Warrior `warrior-continuation.save` SHA256 `307f1affe22dba1f062a07c132405c02ba743f29effdf6bab48c06cd463c78c4`; level3/620 XP, 130 gold; restored300/350HP,100mana.
- Ranger `ranger-continuation.save` SHA256 `fd900eedf30c97c317c94758f40f62210a77bf224034a63fbde40148b3b71f10`; level3/635 XP, 132 gold; restored300/350HP,100mana.

Restore these newest real saves, not dead captures or earlier killed-hostile
checkpoints. Sorcerer is at the saved living boss approach with finale active;
its unpicked earlier Ash Blade remains in the crypt. Surviving nearby actors
may be deferred until normal movement leaves the safety radius. Warrior/Ranger
need beacon/quiet return/quest claim/finale acceptance before legitimate Sevra
attempts. No character has completed Act1; no final reward identity exists yet.
Q1 remains INCOMPLETE, not an approved gate. No Q2/Q3/Act2. Preserve all earlier
lineage and do not repeat completed claims, kills, treasure or travel checks.

## Historical Q1 crypt attempt and safe session checkpoint — 2026-10-23

Reviewed local `2ad174a`; all three graveyard input saves matched their recorded
SHA256 before restoration. No production code, difficulty, item generation,
assertion in ordinary regression suites or deployed runtime changed. Public
release remains previously verified904dfa3. No new deployment.

### Ground loot completed for all three

All preserved eligible graveyard ground loot was picked up through normal
navigation and item-label interaction. Original Iron Cap `l8-2a-3` and cache50204
Warded Bark Guard `l8-7aa676b-0` now belong exactly once to each character,
equipped as helmet/offhand after normal identification. Original quest boots
`l3-51550002-1` remain equipped. Graveyard ground ledgers are empty. Gold86,
stash, pre-existing quest claims, XP and primary ranks were preserved. Five
actually available level3 attribute points were allocated to Vitality, now10
allocated/max350HP; one earned skill point remains unspent. The Light Below
was accepted normally at camp. Separate ground/equipment saves remain intact:

- Warrior `warrior-ground-equipped.save` SHA256 `edef60a4691eb8f27f8568c5f524965b8d3751e3a90cf1d76e8b22a7d5ddd934`.
- Sorcerer `sorcerer-ground-equipped.save` SHA256 `3a61ad7c122f67a8cb38b62ea3ff3a9c20bf6f4ce0989ff3c09292139459dd2b`.
- Ranger `ranger-ground-equipped.save` SHA256 `f59f147c5c823bf2fdd49e6a8261110cd6cedf7caf8e0abb6d54a6957e3a3cc3`.

### Genuine crypt progress, not a completed run

All3 entered seed42/content2 Ancient Crypt with fingerprint460eb973 and normal
active monsters/damage. Warrior defeated4042 (+60 XP), saved alive at163HP, then
died fighting4043 (8HP remaining) under continued multi-enemy pressure. Ranger
defeated4042/4043 (+60/+50 XP), saved alive at35HP, then died walking toward a
cache while other monsters remained active. These deaths are genuine failed
tactics, not evidence of a combat defect. Resume the last living saves below;
do not resume the later stopped/dead captures or repeat saved kills.

Sorcerer's first interrupted attempt already saved4042; its continuation skipped
that kill, defeated4051, opened cache50305 (+44 gold), and genuinely attuned the
beacon (+250 XP/+120 gold). The Light Below is **ready**, not claimed. Saved
beacon completion at20HP; attempted crypt waypoint attunement was disabled at
the anchor while other monsters remained alive. UI source explicitly requires
a quiet departure. The exact UI condition text was not captured, so distinguish
this unverified safety-condition failure from an established waypoint defect.
No endpoint unlock, Edda return/claim or finale acceptance is claimed.

Right-click was attempted while holding basic attack, but the retained skill
histories contain **no player actor0 primary start/effect**. Monster Ember Lance
events must not count as player skill evidence. Correct that driver ordering
through normal inputs in the next bounded encounter; crypt skill usage remains
open. Actual crypt item rolls remain on the ground (one each for
Sorcerer/Ranger); no crypt pickup or artificially granted gear is claimed.
Sevra4090 has not been fought by any of these actual characters.

### Save resource policy reviewed

This is the documented current runtime rule, not an established restoration bug:
[Act 1 guide](../overnight/act1-guide.md) explicitly excludes health/mana and
temporary effects from the saved continuous-combat timeline. The strict
`inventory-save.ts` body persists character/items/progression/exploration, not
current resources. `combat.ts` creates a new actor at300 current/base maximumHP;
`InventoryRuntime.restore` restores the persistent domains, and
`equipment-stats.ts` `applyEquipment` retains absolute HP/mana and clamps to
restored maxima, explicitly never healing when maxima increase. Thus the prior
five Vitality produced300/325 after reload; ten Vitality now produces300/350.
These reload legs are not uninterrupted survival or continuous-health proof.
Three existing focused equipment/runtime tests passed (six unrelated cases
intentionally unselected). No gameplay rule was changed.

### Driver findings and verification

Ground audit initially expected “Picked up” instead of actual “Success”; two
failed cases/one interrupted case remain separate. Corrected ground cases pass3/3
in1.3m. Warrior crypt entry initially stalled after a coarse0.1 turn cut a path
corner; existing0.01 turn precision reached the crypt from the preserved stopped
position. The first crypt run was interrupted after Sorcerer's saved first kill;
its continuation consumed that real checkpoint. First/continuation crypt reports
are failed/incomplete, never green full-campaign evidence. No tactical AI or
production navigation repair was introduced.

Three narrow actual-checkpoint reload cases pass3/3 in8.9s. Independent captured
save comparison confirms progression/equipment, quests, stash/gold, waypoint
state, all area seeds/fingerprints/deaths and ground item identities preserved;
only normal discovery/autosave bookkeeping may advance. All3 restored screenshots
were reviewed. Prior original saves and every important earned stage remain
outside Git at `/private/tmp/hollowbane-q1-crypt/`, including ground results,
crypt attempt/resume failure reports, stopped observations and reload results.
The Sundering Fan/Iron Fan feedback mismatch stays a Q2 candidate, unfixed.

### Exact next earned checkpoints

All files below are under `/private/tmp/hollowbane-q1-crypt/`:

- Warrior: `warrior-crypt-resume-verified.save` SHA256 `1ad018c1ba07cef3d353376552cb3e73c6f3c3d9dc4ae2b9850674a93771634f`; level3/560 XP, 86 gold, 300/350 HP, 100 mana after reload. Source `warrior-crypt-kill-1.save` SHA256 `1ad018c1ba07cef3d353376552cb3e73c6f3c3d9dc4ae2b9850674a93771634f`.
- Sorcerer: `sorcerer-crypt-resume-verified.save` SHA256 `3b0a5400f7c287644b8b14c2b91a1ffed9e66e8e2e0aa6bcae9151074349c69e`; level3/895 XP, 250 gold, 300/350 HP, 100 mana after reload. Source `sorcerer-crypt-ready.save` SHA256 `3b0a5400f7c287644b8b14c2b91a1ffed9e66e8e2e0aa6bcae9151074349c69e`.
- Ranger: `ranger-crypt-resume-verified.save` SHA256 `7cc1665f95b2001007474846a120363ca8c86ac57c4d12081991df9768912c45`; level3/635 XP, 86 gold, 300/350 HP, 100 mana after reload. Source `ranger-crypt-kill-2.save` SHA256 `7cc1665f95b2001007474846a120363ca8c86ac57c4d12081991df9768912c45`.

All are actual restored Ancient Crypt states. Warrior has1/2 required kills;
Ranger2/2, with treasure/beacon pending. Sorcerer has2/2 plus beacon/ready quest;
return to Edda/claim remains. Inspect recorded position/remaining threats, collect
the existing crypt drops and use correctly ordered genuine player skill input.
Then finish objectives/quiet waypoint discovery/return, claim The Light Below,
accept A Lantern Unbound at camp, fight Sevra through both phases, collect real
rewards and return/claim/save/reload. Forest/crypt waypoint and permanent-namespace
coverage remain open. Q1 INCOMPLETE; stop at session boundary, no Q2/Q3/Act2.

## Historical Q1 graveyard earned continuation — 2026-10-23

Reviewed local evidence commit `2086820`. All three Stonebound input saves
matched the historical Stonebound SHA256 values before restoration. Actual earned saves were
restored verbatim; no fixtures, artificial progression, difficulty, production
code, assets or regression tests changed. Public runtime remains the previously
verified `904dfa399ce3d55a855112835111cef8bbd34c4d`; no deployment was triggered.

All three defeated the actual 360-HP **Cairnwarden Rhusk3050** using ordinary
held mouse attacks, active normal AI and genuine incoming/outgoing damage.
Both phases were observed; completion/zero boss HP and the persisted death
ledger were verified. Each earned160 XP, providing the second recorded
Names Beneath the Ash kill. No extra graveyard kill was fabricated. All opened
actual cache50204, receiving28 gold and the genuine cache roll. Each walked to
the graveyard entrance waypoint, attuned it, travelled to Ashen Refuge, spoke
to Orren and claimed the legitimate150 XP/40 gold quest reward exactly once.
Quest transition active → ready → claimed and save/reload passed for all3.

| Class    | Level / XP | HP boss victory | HP quest claim | Gold |
| -------- | ---------- | --------------- | -------------- | ---- |
| Warrior  | 3 / 500    | 142 /325        | 88 /325        | 86   |
| Sorcerer | 3 / 525    | 220 /325        | 149 /325       | 86   |
| Ranger   | 3 / 525    | 226 /325        | 165 /325       | 86   |

All retain original equipped Trail Boots `l3-51550002-1`, five allocated
Vitality and their original learned primary rank. Level3 awards remain unspent:
five attribute points and one skill point per class. Warrior picked up its
earned Stonebound Iron Cap `l8-2a-3`; Sorcerer/Ranger retain that item on the
graveyard ground. **Loot pickup is not complete:** all3 also retain cache50204's
unidentified Warded Bark Guard `l8-7aa676b-0` on the graveyard ground at(7,7.5).
These identities/positions remain in the actual saves; no item was lost or
regenerated. Do not claim full graveyard reward collection before picking up
the preserved drops. Cairnwarden's roll did not add another dropped item.

Three additional focused virtual-controller cases travelled camp → graveyard
→ camp using Start menu/D-pad/A selection and confirmation/B close. Both
endpoints remained unlocked through save/reload. Character/equipment, XP,
quest/container state, all area seeds/layout fingerprints/death ledgers and
item ownership were checked unchanged across travel. Discovery expands normally.
Only camp/graveyard are unlocked; forest/crypt attunement remains open.
This is browser API emulation, not physical-controller verification.

HP after each explicit reload follows the existing300-current-HP policy;
these are real persisted campaign legs, not uninterrupted-health or matched
class-balance evidence. All3 remain max325 HP. Screenshots of phases/victories
and the reloaded camp were reviewed. No gameplay defect was established here.
The prior Sundering Fan / Iron Fan feedback mismatch remains a **Q2 candidate**;
no nonblocking presentation repair was started.

Driver-only failure: sandboxed Chromium failed Mach-port initialization before
any game loaded. Retained `sandbox-launch-results.json` and traces are not green
evidence. The approved outside-sandbox run passed3/3 graveyard cases in2.3m;
controller waypoint cases passed3/3 in32.8s. No tactical-player AI was added.
Raw scripts/results/screenshots/saves and machine checkpoint are outside Git at
`/private/tmp/hollowbane-q1-completion/`. No ordinary CI inventory was expanded.

### Current continuation saves — do not replay completed encounters

All files below are under `/private/tmp/hollowbane-q1-completion/`:

- Warrior latest `warrior-graveyard-waypoint-verified.save` SHA256: `a09509d573ecdf23e34242e3f728d67442938716cc577af6cc6698610a8f9e93`.
  Boss checkpoint `warrior-cairnwarden-defeated.save` SHA256: `392fc304c5ca4a2ae7b97a2567c667af59ecb1e582cc3b5ac5da18ef212ace64`.
- Sorcerer latest `sorcerer-graveyard-waypoint-verified.save` SHA256: `9d52c864d74eb9eb895a6690edf0af0e4068371e58357e5e8cbbb7dba010e498`.
  Boss checkpoint `sorcerer-cairnwarden-defeated.save` SHA256: `ddc168af7a9c81e27d1d3334b025fd6f6416475c4cca1851aa27def02ec38659`.
- Ranger latest `ranger-graveyard-waypoint-verified.save` SHA256: `5459028c7abc6992915750de70448ad3d60fa7a1dc5f6366b9b0c5a61bf03184`.
  Boss checkpoint `ranger-cairnwarden-defeated.save` SHA256: `0cca07833d9ea48671066fc87cabff8397ba799a8990de37419002b8a92ecb82`.

Latest checkpoints are at Ashen Refuge after quest claim, a controller waypoint
roundtrip and successful reload. Resume **CLASS-graveyard-waypoint-verified.save**,
collect the preserved graveyard items, spend/equip only earned resources as
appropriate, accept **The Light Below**, and continue into Ancient Crypt.
The crypt objectives/mandatory encounters, beacon/return/claim, finale
acceptance/Sevra phases/final return/reward, forest/crypt waypoints and late/permanent
save coverage remain unverified in this actual lineage. Q1 remains incomplete;
stop at this safe session boundary. No Q2/Q3 or Act2.

## Historical Q1-B–E continuation checkpoint — 2026-10-23

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
