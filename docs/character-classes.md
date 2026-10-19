# Character classes C1–C3

User approved Character Attributes & Experience through P11 (1ce9e92) on 2026-10-18 and authorized this bounded data foundation only.

## Existing issue reconciliation

- C1: DBL-113 scoped class-definition foundation, including authorized Ranger data. The original two-class playable vertical slice remains partial; no IDs, titles or dependencies replaced.
- C2: DBL-111 scoped typed three-branch data per class with requirements/ranks. Runtime tree integration remains outside this slice.
- C3: DBL-115 scoped content/build validation. Full build calculator, effects and breakpoints remain pending. Original dependencies on DBL-110/112/114 remain unchanged; their broader scope is not claimed complete.

## Data and shared calculations

`character-classes.ts` supplies Warrior, Sorcerer and Ranger identity, configurable starting attributes and base HP/mana. Provisional starts respectively: STR/DEX/VIT/ENE 8/3/7/2, 2/3/4/11, 4/9/5/2; base HP/mana 120/60, 80/120, 100/80. These are unaudited balance defaults, not applied to existing characters. `createClassFoundation` uses existing `experienceAt` and `createAttributes`; `classEquipmentBase` feeds the existing equipment stat calculation, which adds attribute resource bonuses once. No per-class progression formulas.

`src/content/skill-trees.json` version1 defines Arms/Resolve/Bulwark, Ember/Rime/Tempest, Wilds/Precision/Trailcraft. Stable branch/node IDs have level requirements (1/12), maximum ranks (5/3) and ranked prerequisites. All six existing active skills are referenced unchanged. Planned abilities are explicit original data placeholders: no effects/assets or runtime registrations. Every mastery node and Warrior Bulwark/Ranger Precision/Trailcraft foundations are unavailable extension points. No new playable skill is claimed.

Unknown tree input is validated atomically and copied/deeply frozen. Rejects invalid version/classes/branches/nodes, duplicate IDs, missing or cross-class references, prerequisite cycles, invalid ranks/levels, unknown existing abilities and existing abilities dependent on planned ones. Pure build validation rejects unavailable abilities, unmet requirements and invalid ranks; output sorts stable IDs independently of caller key order. Ranks are read-only hypothetical inputs, with no point spending or effect calculations. Bounds: three branches per class, 1–128 nodes per branch, level1–99, rank1–20.

## Persistence and continuation

Class content and tree content each start at version1. Future save work must explicitly persist class ID, content versions and stable node/rank pairs, define missing/renamed-node migration and validate before atomic restore. No current save schema, migration, runtime skill availability or existing character is changed here. No balance or physical hardware claim.

Verification: eight focused tests across class foundations, tree validation and existing skill registry; TypeScript, focused ESLint and formatting pass. No browser behavior changed; no E2E, full regression or loot simulations run.

STOP after C3. Next requires user scope/authorization (for example skill point rules); class selection, allocation UI, tree rendering, effects, artwork, vendors and campaign remain unimplemented.

## C4–C6 (2026-10-18)

C4 rewards one skill point per gained level (98 total at99), with an immutable high-water ledger separate from attributes. C5 validates atomic rank increments, class/level/prerequisites/caps and total spending; no refunds/respec. `InventoryRuntime.allocateSkills` checks the expected authoritative state, persists through the existing session API and rejects stale requests. Scoped original IDs: DBL-103 rewards, DBL-111 allocation, DBL-110 combat and DBL-210 persistence; broader parents/dependencies remain partial.

C6 gates existing semantic cast intents against class ranks without selecting or allocating skills. Rank1 preserves authored effects; configurable defaults add10% base damage and poison/power magnitude per extra rank, leaving slow, timing, cooldowns, mana, geometry and durations unchanged. Casts/projectiles snapshot their ranked definition; existing item modifiers, hit rules and baseline mana passive remain intact. Class-bound characters start with locked skills; class assignment remains an explicit domain-state initialization (`createSkillProgression(classId, level)`), without a selector/UI. Existing unclassed characters retain six-skill compatibility; allocating to them requires future explicit class assignment. Planned nodes remain unavailable.

Character schema4 adds strict version1 skill progression/tree metadata, class identity, ranks and budget. Explicit1/2/3 migrations preserve items, loot stream, XP and attributes; old saves gain level−1 unspent skill points and remain unclassed. Invalid budgets, ranks, requirements, class or versions reject the load without replacing the original/backup. Encounter reset, save/restore and attribute allocation retain the skill ledger. Prior C1–C3 descriptions of unimplemented spending/persistence are historical.

Verification:56 focused tests across rewards/allocation, real cast effects, timing, snapshots, saves/migrations, runtime and existing monster/input/item-save contracts; TypeScript, focused lint and formatting pass. No browser UI/input behavior changed, E2E/full regression/loot simulations not run. STOP after C6; await authorization before further class work or skill-tree UI.

## C7–C9 interface (2026-10-18)

Scoped DBL-111/114/204 UI, DBL-004 semantic controller interactions and DBL-210 persistence; broader parents remain partial. Inventory now contains a gothic Skills panel with three discipline browsers, three specialization tabs each, prerequisite connectors, state/rank indicators and a persistent effect inspector showing current/next rank. Icons reuse the original six code-native HUD glyphs; planned nodes use an original geometric placeholder. No external assets or new abilities.

Learning uses the shared allocator verdict, an explicit confirmation and expected-state protection. Keyboard repeat/double clicks cannot spend again; controller cancel, disconnect, blur and handoffs to/from gamepad discard pending confirmation. Mouse and keyboard share the same explicit confirmation workflow. Legacy access stays unchanged until a separately confirmed permanent skill discipline is chosen. This changes skill access only, retaining existing attributes/items; no respec or automatic class-stat conversion.

Learned active abilities can be assigned to six existing semantic skillbar actions. Schema4 accepts an optional validated six-slot `bar` inside skill progression; older schema4 records need no rewrite, legacy defaults retain the original six bindings and class-bound empty slots remain unusable. Assignment, load and activation validate unlocks through domain functions. Existing save/recovery mechanisms persist ranks and assignments.

Verification:33 focused unit tests;8 targeted Chromium cases across skill UI and affected character save/migration flows; TypeScript, relevant lint/format and production build pass. Reviewed desktop/narrow screenshots. Xbox/PlayStation tests use virtual browser controllers, not physical hardware. Planned branch nodes remain unavailable; physical hardware and broader parents remain open. STOP after C9; no new effects, respec, campaign or vendors.

## C10–C11 combat foundation (2026-10-18)

Scoped DBL-110/112/113: class variants preserve the six original unclassed abilities. Warrior Iron Fan becomes a heavy single-target melee strike using existing guarded stagger; Oath Echo adds armor while empowered. Sorcerer retains Ember Lance/Rime Ring. Ranger Briar Edge becomes a precise poison projectile; Storm Thread becomes a physical projectile piercing up to3 distinct targets, referenced by the existing Precision foundation node. Existing node IDs, schema4 and saved ranks remain valid; no permanent switching/migration.

Configurable damage scaling:2.5% per Strength/Energy/Dexterity point for the respective class, using the existing modifier aggregator and shared attribute authority. Rank3 starter pairs cost6 of11 points at level12. Warrior passive:4 armor/Arms rank; buff:40+10 armor/Resolve rank. Sorcerer passive:0.5 mana/second/Ember rank, in addition to baseline regeneration; existing Energy→mana remains. Ranger passive:8 accuracy/Wilds rank; precise attacks cannot miss or crit. Synergies add5% per supporting rank: empowered Warrior Iron Fan; Sorcerer Ember Lance against slow; Ranger Storm Thread against poison. Direct skills only, never DoT/procs. Stable modifier identities, fresh baselines and per-projectile victim ledgers prevent compounding/recursive/duplicate hits. Synergy precision is normalized to six decimals before existing integer damage flooring. Gear, resistances, hitstun guard and cooldown rules remain in place.

59 focused unit tests and TypeScript/relevant lint pass. C12 developer browser integration/evidence follows separately; provisional balance, no full regression or loot simulations.

## C12 integration and stop (2026-10-18)

C12 / scoped DBL-110/113/114: casts, HUD names and skill inspector use the shared ranked class definitions; descriptions distinguish base effects from conditional passives/synergies and gear/mitigation. Existing semantic slots and keyboard/controller mappings remain unchanged. Right-click cast intent now carries its current pointer source, fixing first-cast aim after keyboard handoff. Ranger Precision is available; remaining planned nodes remain unavailable.

Developer-only diagnostic routes: `?developer=1&classLab=warrior`, `?developer=1&classLab=sorcerer`, `?developer=1&classLab=ranger`. Hidden from normal navigation; explicitly labeled MEMORY ONLY / NO PLAYER SAVES. Each creates its own deterministic level12 rank3 starter pair, class starting attributes/resources and aligned passive targets. Slot1 is melee/projectile; slot2 is defense/slow/pierce. Inventory/save UI is not constructed even if `inventory=1` is supplied. No IndexedDB read/write, no migration, no class switch or modification of saved characters. Reload/reset recreates the laboratory fixture. No new art/assets; existing glyphs and spell visuals are reused.

Final evidence:59 focused unit cases;7 targeted Chromium cases (three complete class starter flows plus four allocation/confirmation/virtual-controller/save-reload cases); TypeScript, relevant ESLint/format and production build pass. Browser class flows deny IndexedDB access and check player-authored effects/damage. Reviewed class-laboratory and skill-panel screenshots. Physical controllers, full balance, remaining planned nodes and broader parents remain open. No full browser regression/loot simulations, publication or hosted claims. STOP after C12.

## C13 quality candidate (2026-10-18)

Scoped DBL-113/115/116; broader parents remain partial. Reused existing scaling/passive/synergy/equipment/save evidence and ran31 focused class/progression/persistence/runtime tests, TypeScript and relevant lint. Extended the existing three browser scenarios with Xbox/PlayStation virtual primary casts, held-input deduplication, player-only damage and zero NPC cast assertions. All three pass; no physical-controller claim.

Found and repaired two lab-only integration defects: bare documented URLs now route to combat; explicit class labs override encounter/loot/inventory flags, preventing encounter AI from interrupting casts. Default diagnostic hostiles are disabled. The tests exercise both bare routes and conflicting flags, and deny IndexedDB access. Existing saved class/rank/bar/item data and mechanics are unchanged.

Reviewed both Darwin inventory actual/diff images: intended new Skills summary shifts inventory content70px, changing1920 dialog height860→930; no unexplained geometry/control change. Replaced only the exact two reviewed Darwin references, retaining assertions/tolerances. Linux references require Linux evidence; no platform substitution. Final publication/CI/hosted verification remains pending. Candidate demos: https://tobisen.github.io/hollowbane/?developer=1&classLab=warrior (also sorcerer/ranger). Do not call these hosted-verified until the runtime SHA is deployed and checked. Balance remains provisional; planned nodes, hardware/art/performance follow-ups remain open. No world generation/campaign or new phase authorized.

C13 publication checkpoint: runtime83593130685becfcbaa40d65f67f98ee24c2427c pushed to main. CI https://github.com/tobisen/hollowbane/actions/runs/39164311209 FAILED in `npm run check`; deploy skipped and no browser artifacts. Public index still `index-BJpbzwJa.js`; candidate entry `index-DBDMEo57.js`, so hosted verification is blocked, not passed. Public job annotations identify `advanced-loot.test.ts:235`: the future-schema check still replaced schema3 after schema4 was introduced, leaving the text unchanged. Corrected both character-schema assertions to use `CHARACTER_SCHEMA`; three focused save tests, TypeScript/lint pass. Did not rerun that file's million-roll initializer or any local loot simulation. Unauthenticated job logs returned403; annotation evidence was sufficient. Two normal Darwin visual comparisons pass after the reviewed replacements. Reference SHA256:1024 f8e418703edd91da8923816210c972264d0cbd9251bcc422a9bd47f3d350fd49;1920 8bb6700cdb2e4aa3a35bffc2f53adcbbc504e96bad669ceee5406e413555d80e.

Resume the successor run triggered by this checkpoint commit: verify full CI, review any real Linux actual/diff images without substituting Darwin references, confirm Pages exact SHA/assets, then run the three hosted class scenarios with `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/`. C13 technical quality gate and user quality approval remain pending; no world generation/campaign. Physical controllers and provisional/unimplemented content stay open.

## C13 Linux reference follow-up (2026-10-18)

CI39164518366 /63bd4c8843369d34284db8c7f6051bc316ba19b6 passed check/format and110 Chromium cases; only the two Linux inventory references failed, so advanced browser verification/deploy were skipped. Retrieved artifact12150163212 (`test-evidence`) through the public nightly.link run URL. Verified artifact expected images exactly matched repository baselines, reviewed both actual/diff pairs, then copied the exact Linux actuals. The intended Skills summary shifts content72px on Linux (1920 dialog858→930); the1024 view retains its existing scroll/crop behavior. No unexplained item geometry, content or control change. Assertions/tolerances unchanged; no Darwin substitution or image manipulation.

Replacement SHA256:1920 fdbcff36efa9c2359fe274fd4fc67a84cd8c5c752edfd69d7bf2c462edf9392c;1024 5d5460ff4b828dfc2b43194c8db4ad485134733c055ed41d71f113b203c57fc5. This is a reference-only follow-up: reuse prior passing simulation/type/lint evidence, no new loot simulations or gameplay changes. Resume normal successor Linux comparisons and advanced browser checks, confirm exact CI/Pages SHA, then verify the three hosted class demos. C13 quality/user approval remain pending until that evidence exists; no new phase authorization.

## C13 technical verification complete (2026-10-19)

Successor CI39165184187 completed successfully for e14335fad98afbc7464ae2c2a0505ce465af619b: verify job117786523931 and Pages deploy117788371121 both successful. Public HTML references the expected index-DBDMEo57.js. The three existing hosted class-gameplay scenarios passed (8.9s), covering Warrior/Sorcerer/Ranger keyboard/mouse and virtual Xbox/PlayStation casts, effects/damage and denied IndexedDB access. Reviewed hosted Warrior screenshot. Prior simulation/check/format/Linux/advanced-browser evidence is reused from successful CI; no redundant local full regression or loot roll simulation. C13 technical gate is complete. User's World & Exploration request authorizes W1–W5; balance, planned nodes, hardware and broader partial parents remain open. No physical-controller claim.

## Skill confirmation CI follow-up (2026-10-19)

Scoped DBL-114/004 repair: the panel click handoff callback used to cancel pending confirmation on any input-device change, while the100ms prompt updater canceled only gamepad handoffs. A quick mouse→Tab→Enter sequence could therefore lose its pending discipline before the confirm handler read it. Both paths now preserve mouse/keyboard confirmation and cancel on gamepad boundaries. The existing keyboard case additionally asserts Cancel/Confirm focus before activating; repeated Enter still spends exactly one point. All four targeted Chromium skill-tree cases pass, covering mouse/save/reload, keyboard legacy discipline and virtual Xbox/PlayStation allocation/cancel/disconnect. TypeScript/relevant lint/format/build pass. No timeout increases, save/skill rules or planned nodes changed; no broad regression or physical-controller claim.
