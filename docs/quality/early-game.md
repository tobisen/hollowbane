## B4 short opening quality review (2026-10-25)

B2 and B3 are released. Verified runtime:
`986399c502fcf8d26c53d0027613c71a0ea735e1`,
[Full CI40177980925](https://github.com/tobisen/hollowbane/actions/runs/40177980925).
All232 Chromium and15 compatibility cases have zero skipped/flaky/unexpected;
verify, Pages, hosted smoke and Release acceptance pass. All41 public files match
the sealed/local-tested artifact. Two independent hosted B3 hint/persistence/
virtual-controller/panel scenarios pass27.7s;1280/760 captures reviewed.
B2 was independently accepted atc1c621c/40175755816 before B3 implementation.

### Actual new-character observations

Each owner was created through New Game, without imported fixtures or grants.
Checks covered the correct equipped weapon/first assigned skill, at least five
opening casts available, an accepted/tracked Embers on the Road quest with Edda's
return instructions, actual forest weapon and ability effects, eligible kills,
XP and natural reward rolls. Save & Exit, Continue and another reload preserve
that same owner, equipment/inventory, point/skill ledger, XP, loot stream and
quest progress; killed identities stay dead. The five observed action topics
(movement, quests, inventory, attack, skill) persist as completed hints.

| Class    | Starting HP / maximum | Opening mana / maximum | HP after combat | Mana after combat | XP  | Rolls / NoDrop | Passing case |
| -------- | --------------------- | ---------------------- | --------------- | ----------------- | --- | -------------- | ------------ |
| Warrior  | 300 /335              | 100.9 /106             | 281             | 100.7             | 25  | 1 /1           | 27.5s        |
| Sorcerer | 300 /320              | 100.8 /141             | 264             | 111.9             | 50  | 2 /2           | 29.8s        |
| Ranger   | 300 /325              | 102.2 /106             | 280             | 100.7             | 25  | 1 /1           | 28.8s        |

Mana snapshots include normal elapsed regeneration; exact7/8/9 costs have B2
domain coverage. The authored isolated three-member pack checks also pass:
Warrior155→151HP/278 ticks, Sorcerer100→85/579, Ranger125→120/225; each75XP
and three reward rolls. This three-case targeted run excludes seven unrelated
cases by name, not seven additional passes. It relocates the authored pack to
the mechanics floor and does not claim full forest path/monster-skill parity.
Browser HP bases are larger; authored Sorcerer maximum mana is161 versus browser
141, so the earlier blanket "conservative mana pool" description is inaccurate.
The test comment is corrected; resource formulas and existing saves are unchanged.

### Balance observations and driver limits

No confirmed balance defect warrants a gameplay change in these short checks.
All classes retain resources and progress; the first one/two seeded reward rolls
are NoDrop. That is a real opening reward observation, not forced test loot.
Natural first-item pickup, full opening-quest turn-in and10–15minute human
playability remain outside this limited evidence. Existing release inventory/
loot coverage remains separate. Controller combat remains skill-focused while
mouse supplies basic weapon attacks; physical controllers are unverified.

The one-off review needed several driver corrections: moving actors under ground
clicks selected attacks, overlapping sprites defeated a predetermined hover ID,
the first basic attack could already kill its target, global target cycling
selected a distant enemy, and a ready snapshot could precede cast consumption.
One temporary helper also omitted a browser-evaluation argument; that error is
ours and was corrected. Failed runs/traces remain at
`/private/tmp/hollowbane-b4-browser-{initial,second,third,fourth,fifth,sixth}`;
passing Warrior/Ranger evidence is in the fourth run and Sorcerer in the final
single-case run. Passes were collected across focused runs, not claimed as one
all-green batch or automatic retries. Final inputs use the existing floor route,
ordinary aimed casts and native virtual movement where ground clicks overlapped
enemies. No simulation mutation, invulnerability, tactical AI or new persistent
test framework was introduced. Passive waits under attack produced deaths in
failed driver runs; those are not controlled difficulty comparisons.

The three combat/resource cards and quest/skill captures are reviewed. Remaining
narrow HUD clutter, dedicated art/animation, physical controllers and native GPU
performance retain their earlier follow-ups. Stop at B4 human quality review;
no Q3 work. Runtime remains986399c; this final evidence/comment-only increment is
committed locally without an unnecessary deployment. Source and diagnostics:
`/private/tmp/hollowbane-b4-evidence`; checkpoint:
`/private/tmp/hollowbane-b4-review-checkpoint.json`.

## B3 contextual beginner guidance — DBL-186/004

Eight concise English topics cover movement, basic attacks, first assigned skill
and mana cost, health/mana recovery, loot, inventory, quests/minimap and return to
camp. A small gothic card never opens a dialog or takes focus. Its background
passes pointer input through; only its dismiss button receives clicks and clears
that click before returning focus to gameplay. Cards hide behind existing modals
and while the character is dead. Unchanged guide content avoids DOM rewrites.

Pure bounded progress validation and observed action completion are separate from
simulation. Dismissed/completed topics, enabled state and whether the character
ventured out persist under `hollowbane.guidance.v1:<character UUID>`. These are
per-character browser preferences, not gameplay rewards or exported snapshots.
Existing saves, class ledgers, equipment, combat costs/timing and schema remain
unchanged. Storage denial retains page-local progress and reports that limit.
Disable, dismiss current and replay controls are in existing pause settings.
Existing Inventory/Quest Journal panels are reachable from the pause menu with
normal keyboard/controller navigation. Opening waits for the pause close event
before dispatching the existing panel intent, avoiding stale disabled UI state.

Prompts use current device, movement remaps and actual controller glyph/bindings.
Existing normal controller combat casts skills; mouse supplies basic weapon
attacks. No new pad attack binding is claimed or introduced by onboarding. Pad
Inventory/Journal shortcuts and map/loot prompts describe the actual world route.
This input limitation is distinct from unmeasured balance concerns for B4.

Three focused domain cases check immutable/idempotent action completion, context
eligibility, dismissal, disable/replay and corrupt preference fallback. Targeted
browser evidence covers real named owners, movement without pausing, separate
owner progress, reload/disable, virtual controller dismiss/replay and existing
journal/inventory routes, plus unchanged pause/settings flows. An initial new
assertion expected the wrong existing Back focus; corrected to Settings. A real
new journal shortcut race was reproduced, fixed at pause close and verified.
No assertions/deadlines were weakened. Diagnostics: `/private/tmp/hollowbane-b3-*`.
Four distinct targeted browser cases pass across final checks; the two final
onboarding cases pass33.5s, including zero guide DOM mutations across30 still
frames and no cast from dismiss clicks. Keyboard/controller captures reviewed
at1280/760 widths; the narrow card aligns
left to preserve minimap space. Strict types, affected lint/format and build pass.
Exact policy-selected B3 CI/Pages/hosted acceptance is pending before B4.

## B2 release accepted (2026-10-25)

Verified deployed `c1c621c89798c07e65e518ad2af84b1029727791`:
[exact Full CI40175755816](https://github.com/tobisen/hollowbane/actions/runs/40175755816),
all230 Chromium/15 compatibility cases with zero skipped/flaky/unexpected,
verify, Pages, hosted smoke and Release acceptance pass. All42 public files
match the sealed artifact and previously tested hashes. Three independent hosted
fresh Warrior/Sorcerer/Ranger creation, skill access, virtual controller and
Save & Exit/Continue/reload cases pass47.4s; their HUD captures are reviewed.
Warrior's camp check correctly requires an enemy target, while actual three-class
skill damage has domain/developer-combat evidence. Fresh Warrior forest use is
part of B4, not a claim from this camp-only hosted scenario. No physical evidence.

Latest scope: B3 contextual hints, then short B4 opening review. Stop at B4 review;
no Q3 implementation in this continuation. Detailed checkpoint:
`/private/tmp/hollowbane-b2-release-checkpoint.json`.

## B2 starter skills — DBL-113/115/210 (2026-10-25)

New character creation now grants one existing class foundation rank and assigns
its ability to slot one: Warrior Sundering Fan (7 MP), Sorcerer Ember Lance
(8 MP), Ranger Briar Needle (9 MP). Weapons, costs, geometry, combat timing and
level rewards are unchanged. Warrior retains melee target/range requirements;
Ranger retains the existing precise projectile and poison behavior.

The optional strict `starter: true` skill-ledger field records exactly one free
rank in the class's designated foundation. `spent` counts earned ranks only;
`available + spent` remains level minus one. The designated rank must exist,
false/numeric grants and extra unfunded ranks are rejected, upgrades still cost
a point, and level high-water rewards remain idempotent. Only `newCharacter`
calls the grant constructor. Restore does not grant/reassign anything. Existing
classed/unclassed supported snapshots without the field round trip unchanged,
and deliberately emptied new-character bars stay empty across repeated reloads.

Deterministic checks cover three actual casts/damage per class, exact mana costs,
at least five casts in the conservative authored mana pool, serialized creation,
pre-grant saves, clear/reload, point upgrades, forged ledgers and existing runtime
transactions. Authored resource bases differ from current browser bases; no
resource rebalance or old-save reinterpretation is included in B2.

Build splitting exposed two `character-storage-*` chunks. Browser discovery now
checks public exports instead of relying on hash/filesystem order; storage tests
reuse that same published-entry discovery. No injected alternate storage engine.
The first browser attempt failed on the shared implementation chunk; a later
new Warrior assertion incorrectly expected a melee effect with no camp target.
Corrected new assertions require the existing invalid-target rule in safe camp;
actual three-class damage is separately checked in domain/developer combat tests.
Diagnostics remain in `/private/tmp/hollowbane-b2-browser*`.

Local verification: 53 focused unit cases across seven relevant files, strict
TypeScript, affected ESLint/Prettier and production build pass. Six final fresh
owner/developer combat browser cases pass (1.1 minutes); four additional storage/
owner/virtual-navigation cases passed in the prior diagnostic run. That run
retains the incorrect new Warrior no-target assertion as a failure, not a pass.
Final three-class captures pass (53.6 seconds); all six starter equipment and
ability HUD captures reviewed. Physical-controller evidence remains pending.

Release acceptance is pending. Last verified deployment remains
`55af54f56c615de169969581d43d32c6016d6fa1`. Finish exact classifier-selected
CI/Pages/artifact identity and hosted class controls/save checks before B3.
Virtual controllers are browser evidence only. B3 onboarding, B4 opening quality
and Q3 visuals/audio remain unimplemented in this increment.

# Early game balance and Q3 continuation

Authorized 2026-10-25: B1 forest balance, B2 contextual guidance and B3 focused
verification, then Q3-A player art, Q3-B monster/boss art, Q3-C environments and
Q3-D audio, ending at Q3 quality review. Each major deliverable requires its
exact committed release, CI, Pages and hosted gate before the next. Preserve
unrelated local changes, existing saves, Phaser 4.2.1 and original assets.

## B1 first increment — forest pressure and recovery

Original parents: DBL-058/062/109. The deterministic forest plan still has five
packs of three with flanker/melee/ranged roles. Leaders can be champion/elite;
pack centers can be six units apart, within overlapping detection radii. No
global player damage reduction is applied.

- Forest actors receive a 0.65 encounter damage scale, covering weapon and
  monster skill hits. This field survives temporary skill power updates. Ordinary
  raw damage is now flanker 5.2, melee 6.5 and ranged 5.85 versus 8/10/9.
- Forest leaders retain names, identities, tier rewards and elite armor, but use
  ordinary role health/base damage. Champion health previously multiplied by
  1.8; elite health by 2.7 and weapon damage by 1.5. No encounter RNG or spawn
  positions, deaths, XP rewards or loot tables are changed.
- Forest AI allows two simultaneous committed attacks, including queued attacks
  and normal projectiles. Ranged actors share the budget; death releases a slot.
  Existing threat, movement, cooldown and leash rules remain.
- Camp/forest recovery starts after 300 safe simulation ticks: 3 HP/second and
  6 additional mana/second. Living enemies within nine units, attacks, projectiles,
  skill bolts, player statuses or damage reset the wait. Resources clamp to maxima;
  death cannot recover. Pause/input blocking advances no recovery ticks. Area
  installation resets the timer. No save schema or reward grant is introduced.
- Graveyard, crypt and boss definitions/scaling remain unchanged. Existing forest
  saves retain all monster death identities and owned items.

## Deterministic measurements

Seed 42's first authored three-member forest pack, relocated to the existing open
mechanics floor. Same class foundation/starter, combat seed and simple repeated
basic-attack intent before/after. Ordinary pack AI, without monster special-skill
queuing; no tactical player,
invulnerability, extra rewards or healing. This isolates combat and is **not** a
continuous forest expedition or a 10–15 minute human playability measurement.

| Class    | Starting HP | Previous final HP / ticks | New final HP / ticks | XP / loot rolls |
| -------- | ----------: | ------------------------: | -------------------: | --------------: |
| Warrior  |         155 |                 148 / 278 |            150 / 278 |          75 / 3 |
| Sorcerer |         100 |                  71 / 591 |             85 / 579 |          75 / 3 |
| Ranger   |         125 |                 118 / 225 |            120 / 225 |          75 / 3 |

The low hit counts make HP-loss percentages coarse (Warrior/Ranger 7→5;
Sorcerer 29→15 with a changed interrupt sequence). The direct hit contract checks
30–40% less resolved damage for both physical and elemental attacks; this is not
a claim of identical encounter-level percentage reduction.

Local verification: 28 initial targeted world/AI/new-character/balance cases,
39 combat/skills/balance cases, then the additional attack-budget case pass;
TypeScript, affected lint/format and production build pass. The existing genuine
fresh Ranger creation/forest attack browser case passes against the corrected
build (17.7 seconds); screenshot reviewed. First test-harness attempts used the
wrong legacy loot registry and ranged retreat/alert positions; corrected to the
existing registered content and an in-range chase fixture without weakening
production rules or deadlines. The preview needed normal sandbox escalation to
bind its port. No test artifacts are committed.

## Continuation and limitations

This is a B1 increment, **not completed B1–B3 or Q3**. Next: verify this exact
increment's policy-selected CI/Pages/hosted identity, then finish the opening
ability/recovery and all-class genuine browser evidence, B2 dismissible contextual
keyboard/controller guidance and final B3 release gate. No Q3 work before that
balance gate passes. Keep batches small and checkpoint at the soft session limit.

Discovery to resolve in the remaining B1/B3 work: fresh class characters currently
have no learned skills or assigned bar; first earned skill point arrives at level 2. The browser inventory runtime also retains the legacy resource base (observed
Ranger 325 HP), whereas the class-foundation unit fixture uses 125 HP. The table
therefore demonstrates the conservative authored class foundation and must not
be presented as exact browser resource parity. Do not silently replace old save
resources or skill-point ledgers. Introductory spell access/mana, ranged distance
and complete all-class navigation remain explicit follow-ups.

Last accepted deployment before this increment:
`b37ee0076aebe86e8f855eb6815d6f577175456f` / CI40139863014. Candidate publication,
new hosted verification and user quality acceptance are not yet claimed.
Dedicated art/animation, original recorded audio/ambience, physical controllers
and native/reference GPU performance remain open.

## Exact publication checkpoint

Candidate `0939c1dd490b51cbd41d2be8fe22491b0cb80a6e` committed and pushed.
[CI40142853050](https://github.com/tobisen/hollowbane/actions/runs/40142853050)
was in progress at the soft-session checkpoint. The unchanged policy dry-run
requires Full because shared combat/AI public contracts affect 71 unit files;
Integration cannot safely replace that requirement. CI completion, Pages, exact
sealed artifact/public bytes and relevant hosted smoke are pending. Resume those
checks before another increment. Final new-character spell/mana/range guidance
and B2/B3 verification are still required before Q3. No visual/audio assets were
created in this increment. Post-push evidence remains local to preserve the
candidate deployment identity; all implementation/tests are committed.

## Release blocker: rejected-import feedback (DBL-210)

CI40142853050's Chromium shard 3 reports 45 passed and one failure in the existing
funded-allocation/import/reload scenario. Fast, complete units/tooling, 15 required
compatibility cases and Chromium shard 2 passed; shards 1/4 were still pending at
inspection. No release was accepted. The sealed full SHA and all 42 production
files matched the locally tested build before the correction. Reports, trace and
screenshot remain at `/private/tmp/hollowbane-b1-failure`.

The trace/source identify a pending valid autosave overwriting a newer rejected
import notice. The actual character keeps the valid allocated state. The existing
case now controls browser time to run the 250ms autosave after the invalid import,
then verifies the real IndexedDB checkpoint retains three available points and
the validation notice stays visible. The old production build fails this stronger
check (8.9s), retaining diagnostics at `/private/tmp/hollowbane-b1-import-before`.

The focused correction preserves that notice through background save progress
and success until the next edit or explicit Save now. Transactions, serialization,
validation, failure reporting and forest mechanics are unchanged. All eight
character/storage/exit browser cases pass in 1.0m, including atomic recovery,
legacy upgrade, independent owners and failed-exit retry. Existing assertion
values and deadlines are retained. TypeScript, affected ESLint/format and build
pass; the preserved error notice capture was reviewed. No artifacts are committed.

Publish this correction through the existing classifier, then require the new exact
CI/Pages/artifact/hosted gate before starter skill implementation. The latest user
request names remaining work B2 starter skills/resources, B3 contextual onboarding,
B4 opening quality, followed by Q3 only after those releases pass. All remain
incomplete. Fresh level-one empty skills/bar is confirmed; no speculative resource
or progression changes were made while the release gate remained open.

## Ranger positioning CI recovery (DBL-113/109, 2026-10-25)

Run40143956903 /0bc40a1 failed only fresh Ranger positioning; all other
required unit/browser/compatibility jobs passed. Pages/hosted acceptance were
skipped and this remains an unaccepted release. The rejected-import/autosave
correction is preserved.

Reviewed failed screenshot and trace at `/private/tmp/hollowbane-ranger-ci`.
The player actually reaches the third waypoint: the final evaluation returned
error0.000000437, but after the host poll deadline; the reported1.80156 is the
previous sample. This is a browser-driver observation failure, not evidence of
blocked terrain, failed pathfinding or an incorrect ranged attack position.
Normal isolated reproduction passes13.5s. A temporary6× Chromium CPU-throttled
case reproduces the old stale-sample failure (reported0.69410 despite final
actual0.000000176), with trace/source retained under `/private/tmp`.

Arrival now observes each animation frame in the browser, capturing the distance
when it meets the unchanged0.36 bound within the unchanged5000ms deadline.
The explicit positioning assertion remains. Throttling additionally exposed stale
one-shot mouse aim; the same existing hover poll now refreshes projected aim for
the moving enemy/follow camera. Every attack remains normal mouse input. No
simulation, navigation, damage, difficulty, autosave or timeout change.

Corrected normal12.1s and6× throttled32.5s Ranger browser cases pass; final combat
capture reviewed. This is synthetic CPU contention, not physical hardware or
reference performance evidence. TypeScript and whole ESLint pass; all four staged files pass formatting. Whole-
worktree format reports pre-existing STATUS/menu-experience edits outside this
commit; preserved unchanged. No unrelated local campaign suite rerun. Exact successor
CI/Pages/sealed artifact/public bytes and hosted opening verification remain
required before B2. B2 starting abilities/resources, B3 onboarding, B4 opening
quality, then Q3 remain incomplete and authorized in that order.
