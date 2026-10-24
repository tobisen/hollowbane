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
