# Character progression — P1–P11

The character sheet opens inside Inventory (V / View). Expand Character to inspect
XP, innate/allocated attributes and the same derived totals used by combat. +1
buttons spend one earned point; repeated key events, double-click duplicates and
stale requests cannot replay an allocation. No respec or skill points.

Normal new characters start at level1, zero XP/attributes. The separate item
laboratory starts at40. Each advancement costs100 × current level² XP and grants5
attribute points, through99 (490 total points). Monster base XP remains provisional:
melee/ranged/flanker25, caster35, support30, tank40; champions share the base.
Flat coefficients: Strength0.5 physical damage, Dexterity2 accuracy/1 defense,
Vitality5 maximum HP, Energy3 maximum mana. Gear modifiers apply once after these
bonuses. Current HP/mana retain absolute amounts, clamped on maximum decreases.
Frozen item content2–8 keeps its original level minima and zero stat minima;
P6 supports configurable base Strength/Dexterity rules without rewriting items.

Character schema3 stores `xp-v1`, accumulated XP, derived level/next threshold,
starting/allocated attributes, available/spent points and rewarded-level high-water
mark. Validation checks exact fields, safe integers, curve/level consistency,
point conservation and inventory level. Future XP curve changes require a new
curve ID and explicit migration; custom runtime curves cannot be silently saved
as `xp-v1`.

Schema1/2 snapshots validate against their declared item registries first, then
migrate to their existing level's XP threshold with zero allocated attributes and
5 × (level−1) available points. No item, equipment, embedded socket, set/rune data
or loot RNG stream is regenerated. In-memory migration does not overwrite storage;
the next successful save retains the original as the previous checkpoint.
IndexedDB retains its atomic current/previous transaction and stale-tab revision
check. Unsupported/corrupt saves remain available for explicit recovery/export;
rejected loads/imports leave the live character unchanged. XP changes trigger the
existing checkpoint mechanism. Encounter resets retain progression. Combat restarts
on reload: fresh encounter monsters can earn XP again, while loading a snapshot
into the current encounter keeps its consumed-death ledger.

P7/P8: four view/runtime tests then12 focused tests and2 Chromium scenarios; reviewed
1280×800 panel screenshot. P9: shared unit run316 passes and2 outdated schema2
assertion failures; those assertions were updated for schema3 and24 targeted
save/runtime cases pass. Four Chromium scenarios cover panel/keyboard access,
funded allocation and duplicate protection, rejected corrupt import, reload, and
schema1 IndexedDB migration retaining the original backup. Unit coverage includes
schema2 migration with real mixed-content sockets/runes and levels1–99. Physical controllers remain unverified.

## Character Progression quality gate

Local technical candidate; release verification is incomplete and user quality
approval remains false.
P10 adds contextual mapped prompts, gamepad-visible focus, allocate/confirm/read,
bounded navigation and cancel-to-summary before leaving inventory. Existing hub
edge detection and remapping remain authoritative. Three Chromium API-emulated
Xbox/PlayStation/generic cases pass, including a remapped generic confirm,
held allocation, controller disconnection/reconnection and mouse recovery.

P11 adds an actual timed monster attack/kill → XP → level/points → allocation →
requirement-checked equipment → derived stats → persistence test, checking both
XP and loot death deduplication. All99 default level/point budgets are checked.
Final `npm run check`:320 tests/80 files, TypeScript, lint, asset/backlog validators
and production build pass. Formatting passes. Four critical Chromium character/
allocation/save/migration cases pass, in addition to the three controller cases.
CI's full browser regression remains required for publication; no repeated loot
simulations or unrelated benchmark runs were performed.

Balance remains provisional: reaching99 requires31854900 cumulative XP under the
current quadratic per-level cost. Monster rewards remain25–40 with no level
scaling or champion premium. This is a deterministic foundation, not a completed
leveling-pace rebalance. Zero starting attributes and frozen zero Strength/
Dexterity item minima preserve prior content; level requirements still apply.
No respec, skill points, classes, skill trees or vendors. Reference hardware and
physical controllers/vibration are unverified. CI/Pages and hosted verification
are pending until recorded below; stop at this quality gate.

Publication checkpoint: runtime466bf7c and P10fcd3af1 were pushed to main.
CI39156818075 was still installing browser dependencies at the last check; no
result or Pages deployment is claimed. Public index still references
index-DnCJfCbe.js (L3), while the local progression build references
index-CVMXKv8V.js / combat-arena-BRv-XqEg.js. Hosted progression/save testing has
not run. Prior L3 CI39117110123 is independently confirmed successful, but is not
progression release evidence.

The two Darwin inventory visual comparisons initially failed because the P7
panel adds68px at1920 and changes layout at1024. Both captures were individually
reviewed, retained as references and verified without update mode (2/2 pass).
Linux inventory and advanced-item references still require capture/review against
the character panel; do not relax assertions or copy Darwin images into Linux.
This follow-up reference/checkpoint commit is local pending review of the current
CI run, avoiding cancellation of evidence collection. Resume publication quality
verification only; do not start further gameplay work. The final progression gate
is pending these visual/CI/Pages/hosted checks and user review.

## Release verification follow-up (2026-10-18)

Run39156818075 for466bf7c completed with failure. Public jobs API confirms
check and format success, browser regression failure, skipped advanced browser
step and skipped Pages deployment. Public check annotations report95 Chromium
passes and10 failures:6 equipment-route controller cases,2 laboratory wording
cases and2 Linux inventory screenshots. No unit suite was repeated; the320
passing units remain valid for this rendering-only correction.

Adding Character changed sequential right navigation from Close. Restore the
existing explicit Close → main equipment route; down still reaches Character.
The laboratory now correctly says “starts at level40”; its stale fixed-level
assertion is updated to the current copy.15 targeted Chromium cases pass:
8 formerly failing controller/laboratory cases plus4 character allocation/save/
migration cases and3 virtual controller progression cases. TypeScript, focused
ESLint/Prettier and build pass. Both existing Darwin references pass regular
comparisons (2/2);1920/1024 references and the character panel screenshot were
visually reviewed. No new reference generation, tolerance changes or simulations.

Linux1920 annotation reports expected1180×792 versus actual1180×858;1024
reports31211 differing pixels. These numbers are diagnostic, not approval of
the images. Artifact12147467280 (test-evidence, digest
sha256:be3d652c335fb711846109eae9cadbccaacba046854fdcec6e280d290c51c17f)
exists but its public archive endpoint returns401; job117761627696 logs return403.
GitHub CLI is unauthenticated. Public run/job/check annotations were accessible
through approved network access. Linux images have NOT been reviewed or replaced.
The advanced browser step did not execute; no claim of its passing.

Hosted index inspected directly still references index-DnCJfCbe.js, the old L3
runtime. No hosted progression/allocation/save verification can be claimed.
DBL-109 remains partial and the release gate incomplete. Next: authenticated
artifact review, justified Linux references and regular comparisons, successor
CI/Pages SHA verification, then only hosted critical progression flows.994eac1
was inspected and its Darwin references independently verified for publication.
User quality approval remains false; physical-controller evidence remains absent.

## Reviewed Linux references (2026-10-18)

Successor39158266321 /a7f1868 confirms103 Chromium passes, with only the two
inventory visual references failing. Public artifact download via nightly.link
resolved the direct GitHub API authentication limitation. Retrieved the current
run's test-evidence archive; individually reviewed1920/1024 actual and diff images.
The Character summary adds66px to the1920 dialog (1180×858);1024 retains its
scrollable viewport and shifts the equipment/grid by the new summary. Existing
item geometry, equipment, inspector, actions and status remain intact. Footer copy
now includes progression/attributes. These are intentional P7/P9 changes, matching
the already-reviewed Darwin layout, rather than unexplained visual regressions.

Copied only these two actual Linux captures from39158266321 to their matching
Linux reference paths. No Darwin substitution, screenshot regeneration, changed
assertion or tolerance increase. SHA256:

- 1920: `815cca9412d597caeabef205701c3b35cf921a73620a09d8da6179ddb533e18d`
- 1024: `c107e534c0e45f84683827d932cf54c0667e9c76767502aaa039572ad7181c12` Regular Linux CI comparison
  and the previously skipped advanced cross-browser step remain required.
  No new unit run, loot simulation or benchmark. DBL-109 stays partial until CI,
  Pages SHA and hosted character/allocation/save/reload checks pass.

## Final release verification — DBL-109 complete (2026-10-18)

Release runtime: `51a943ac96f845a9f749262436c146ea9244511f`, an intended
successor of466bf7c containing the reviewed994eac1 Darwin checkpoint, controller
repaira7f1868 and Linux reference follow-up51a943a.
[CI39159873168](https://github.com/tobisen/hollowbane/actions/runs/39159873168)
completed successfully: check/format passed,105 Chromium cases passed in7.7m
(including both regular Linux comparisons), then15 advanced Chromium/Firefox/
WebKit cases passed in2.0m. No skipped advanced step was counted as passing.
Existing320 units were reused locally; the required CI check passed as configured.
No new simulation, benchmark, test exclusion or tolerance adjustment.

Pages deployment7159839021 reports success at2026-10-18T19:52:32Z with the exact
release SHA above. Public index references `index-BJpbzwJa.js`, matching the local
production build. Hosted verification used:

```sh
PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/ npx playwright test tests/e2e/character.spec.ts tests/e2e/character-controller.spec.ts
```

All7 hosted cases passed in17.9s: default panel/totals, disabled unearned
allocation/keyboard access, funded Vitality/Strength allocation and duplicate
protection, rejected corrupt import, IndexedDB save/reload preserving gear and
progression, schema1 migration retaining previous checkpoint, plus3 virtual
Xbox/PlayStation/remapped-generic controller allocation/cancel/disconnect cases.
The allocation/save assertions verify level2,3 remaining points, Vitality1,
Strength1, Health305,100/500 XP and unchanged equipment identity after reload.
Migration verifies level12/55 points and current/previous schemas3/1.
Hosted character screenshot reviewed: readable shared totals and disabled
zero-budget controls; scrollable panel remains intact. Physical controllers
remain unverified.

DBL-109 is technically complete and P11 release criteria pass. User progression
quality approval remains false: STOP for that review. No classes, skill trees,
vendors or further gameplay authorized. Historical pending/failure checkpoints
above are superseded by this evidence; broad partial parents and hardware/art/
performance follow-ups remain separate.
