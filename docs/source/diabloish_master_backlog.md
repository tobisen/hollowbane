# DIABLOISH — MASTER BACKLOG v2.0

Datum: 2026-10-16  
Status: Planering; ingen implementation förutsätts.  
Mål: Originalt mörkt fantasy-ARPG för webben, modern 2.5D, med spelkänsla och systemdjup inspirerat av Diablo II. Ej användning av Blizzards upphovsrättsskyddade namn, grafik, ljud eller värld.

## A. Projektregler

**System-of-record:** GitHub Issues + versionshanterade `docs/`-filer. Denna plan är initial backloggkälla. Ett Issue = ett verifierbart resultat, vanligen 1–4 timmars ingenjörsarbete inklusive tester; större arbeten bryts ned. Faser är beroendestyrda, inte tidsstyrda. Framsteg mot kvalitetsgrindar styr prioritet, inte antal avklarade Issues.

**Issueformat:** `DBL-###` (internt stabilt ID), titel, epic/fas, syfte, scope, explicita icke-mål, beroenden, acceptanskriterier, unit/integration/E2E/visual/perf-test, assetbehov och licens, DoD. Githubs faktiska issue-nummer kan skilja sig; märk med `DBL-###` i titeln.

**Definition of Done:** implementation klar; relevanta automatiska tester gröna; lint, typecheck och production build gröna; visuella ändringar granskade via screenshots; perf-regression ej oavsiktlig; dokumentation och metadata uppdaterade; git diff kontrollerad; commit med Issue-ID. Inget Issue markeras klart på grundval av enbart en rapport från Codex.

**Codex exekveringsbudget:** Ett normalt issue per körning (max 3 små relaterade). Mjuk tidsbudget 10 minuter per issue och max 2 reparationsförsök per fel innan blocker-rapport; stanna vid säkert checkpoint om stöds. Extern orchestrator får införa 30–60 sekunders paus mellan körningar (om den stöder schemalagd väntan). Ingen artificiell väntan inne i spelet, testerna eller interaktiva chatten. Pauser garanterar inte lägre tokenförbrukning eller undantag från kvoter; huvudsaklig tokenbesparing är små tasks, selektiv läsning, små loggutdrag och korta rapporter. Fulla logs lagras som artifacts. Rapportera endast Issue, commit, tester, risker, nästa steg (≤200 ord). Efter 5 issues: kompakt fasstatus. Vid fasgrind: stanna för kvalitetsbeslut. Återuppta alltid från STATUS.md; läs inte hela historiken.

**Prioriteter:** P0 kärnkänsla/grund; P1 nödvändig full Diablo-II-liknande loop; P2 kompletta systemsamband och innehåll; P3 avancerade/valfria funktioner. **Epics nedan är vägledning för GitHub-skapande, inte ett uppdrag att implementera allt samtidigt.**

**Föreslagen stack:** TypeScript strict, Vite, Phaser 4 som huvudkandidat (jämför med 3 i Phase 01), ren deterministisk simuleringskärna, Tiled och generator, IndexedDB, Vitest, Playwright, GitHub Actions, GitHub Pages. Inga konton eller serverberoenden för grundspelet.

**Kvalitetsgrindar:** G0 teknisk grund; G1 visuell referens; G2 strid känns bra; G3 loot-/progressionsloop; G4 första genomspelbara akt; G5 balanserad tregradig kampanj; G6 release candidate. Ingen automatisk fortsättning förbi grind utan godkännande.

## B. Etapp A — FOUNDATION / PHASES 00–04

### Phase 00 — Produktanalys och mekanikspecifikation [P0]
**Mål:** Specificera *känslan* i mätbara delar innan kod.
- DBL-001: Skapa game pillars: rörelse, frame-/aktionsrytm, loot, progression, mörk atmosfär, risk/belöning.
- DBL-002: Dokumentera Diablo II-inspirerade mekaniker: attack/cast recovery, block, resistans, life/mana, potion belt, stamina, death, town portal, waypoint.
- DBL-003: Skriv 2 referensscenarier: melee versus mob pack; caster versus elite pack.
- DBL-004: Definiera spelkamera, kontrollschema, WASD-alternativ och tillgänglighetsprinciper.
- DBL-005: Definiera 10-minuters fun test och observerbara mått: respons, animation, loot excitement, progression.
- DBL-006: Skapa GAME_DESIGN.md, ART_BIBLE.md och ACCEPTANCE_MATRIX.md.
**Grind:** Kritiska mekaniker har dokumenterade förväntade beteenden och testscenarier.

### Phase 01 — Repo, engine spike och CI [P0]
- DBL-007: Repo, Vite, TS strict, lint, format, test harness.
- DBL-008: Phaser 3 vs 4 spike på isometrisk karta med ljus och 50 sprites; dokumentera versionsval.
- DBL-009: Arkitektur: rendering adapter, input intents, simulation core, content registry, persistence.
- DBL-010: Github Actions: typecheck/lint/unit/E2E/build och Pages preview/deploy.
- DBL-011: Git conventions, AGENTS.md, STATUS.md, ADR och issue templates.
- DBL-012: Deterministic RNG, timestep och replay-trace skeleton.
- DBL-013: Performance measurement harness (FPS, frametime p95, memory, draw calls, loading).
**Grind G0:** Lokal och publicerad prototyp startar; automatiska kvalitetskontroller gröna; engine ADR godkänd.

### Phase 02 — Rendering och projektion [P0]
- DBL-014: Isometrisk grid/world-to-screen/screen-to-world samt mus-hittest.
- DBL-015: Lager och sorteringsregler för sprites, byggnader, broar och överskymning.
- DBL-016: Kamera följning, zoom, clamp, resolution scaling, ultrawide.
- DBL-017: Collision/navmesh representation separat från synlig tile.
- DBL-018: Ljus/normal maps, skuggor, dimma, glow, particles spike.
- DBL-019: GPU texture atlas/batch-pipeline, inkrementell inladdning, renderer diagnostics.
- DBL-020: Screenshot regression av projektion, occlusion och skuggor.
**Grind:** Ingen synlig glidning, felplacering eller felaktig occlusion i 20 referensfall.

### Phase 03 — Grafikpipeline och art bible [P0]
- DBL-021: Original art bible: material, palett, dimensioner, silhouette readability.
- DBL-022: Assetmanifest med provenance, licens och kvalitetsnivå.
- DBL-023: Sprite exporters för 8 riktningar, pivots, skalor, normal maps, shadows.
- DBL-024: Asset validators: frame counts, transparent bounds, naming, collision anchors.
- DBL-025: Sprite preview gallery med riktningar/animationer och UI review.
- DBL-026: Miljö-kit A: jord, sten, stigar, träd, gravar, murar, facklor.
- DBL-027: Audio pipeline för UI, attacks, footsteps, ambience med rättigheter.
**Grind:** En sammanhängande kyrkogård med hjälte i rätt skala och godkänd kvalitet.

### Phase 04 — Input, pathfinding och rörelse [P0]
- DBL-028: Click to move med semantik för attack/interact/loot och högre handlingsprioritet.
- DBL-029: Precise pathfinding, diagonal distance, dynamic obstacle replan.
- DBL-030: Walk/run mode och valfritt stamina-system; kalibrera mot målkänsla.
- DBL-031: Retarget, interrupt, queue och input buffering enligt definierade regler.
- DBL-032: 8-riktningsanimation med fotfäste/pivot och transitions.
- DBL-033: Entity movement separation/steering vid täta grupper.
- DBL-034: Hover, selection, cursor feedback, interactable highlighting.
- DBL-035: Input latency och rörelsekänsla testscenarier.
**Grind G1:** Rörelse i en vacker karta känns förutsägbar och omedelbar, utan klickfel eller grafiska glapp.

## C. Etapp B — COMBAT / PHASES 05–10

### Phase 05 — Stridskärna och attackrytm [P0]
- DBL-036: Action states: idle, move, windup, strike, recovery, hitstun, block, dead.
- DBL-037: Tick-accurate timeline med start, active frames, recovery och möjlighet till avbrott.
- DBL-038: Melee target acquisition, range, facing, auto-approach.
- DBL-039: Attack speed modifiers och diskreta breakpoints (egna balansvärden).
- DBL-040: Hit/miss/block, critical, armor/defense, damage types.
- DBL-041: Hit recovery, knockback och stagger samt anti-stunlock regler.
- DBL-042: Hit feedback, sound, VFX, screen shake och animation sync.
- DBL-043: Combat event log/test scenarios/replay.
**Grind:** 10-monster encounter är njutbar, varierande och debuggbar; alla reaktionsanimationer stämmer med simulation.

### Phase 06 — Hälsa, resurser och död [P0]
- DBL-044: HP, mana, regen, resource costs och thresholds.
- DBL-045: Potion belt, quickslots, potion animation, cooldown policy.
- DBL-046: DoT/HoT och damage over time med korrekt stacking.
- DBL-047: Resistances/absorbs, immunities, vulnerabilities och max/min caps.
- DBL-048: Player death/resurrection, death penalty och återhämtning.
- DBL-049: Healing/shrines/wells och interaktioner.
- DBL-050: Status HUD med life/mana orbs och tydliga varningar.
**Grind:** Död och återhämtning fungerar fullständigt utan save corruption.

### Phase 07 — Projektiler och spell-combat [P0]
- DBL-051: Projectile engine: aim, travel, collision, pierce, bounce, AoE.
- DBL-052: Cast speed breakpoints, casting animation, interruption.
- DBL-053: Elements: physical, fire, cold, lightning, poison, magic/arcane.
- DBL-054: Freeze/slow/burn/shock/poison med duration och cleanse.
- DBL-055: Targeted, self, aura, cone, beam, nova, summoned effects.
- DBL-056: Resource & cooldown balancing integration.
- DBL-057: Visual spell FX, readability och shader/fallback.
**Grind:** Caster spelar distinkt annorlunda jämfört med melee.

### Phase 08 — Monster-AI och flockbeteende [P0]
- DBL-058: Monster data models, faction, family, role, abilities, stats.
- DBL-059: Awareness/aggro, pursuit/leash, perception och pathfinding.
- DBL-060: Idle/patrol/approach/attack/retreat/flee states.
- DBL-061: Group steering och crowd management i trånga korridorer.
- DBL-062: Archetypes: melee, ranged, caster, summoner, fast flanker, tank.
- DBL-063: Monster animation, death, corpse persistence och corpses as gameplay.
- DBL-064: AI determinism stress tester med 30–50 aktiva monster.
**Grind:** Monstergrupper går att läsa, locka, dela och taktiskt besegra.

### Phase 09 — Champions, elites och minibossar [P1]
- DBL-065: Normal/champion/unique elites inklusive skyltfärg och namngivning.
- DBL-066: Modifier library: extra strong, fast, enchanted, cursed, aura, multishot, etc. med egna namn.
- DBL-067: Modifiers compatibility and danger budget.
- DBL-068: Elite pack generation, minions och loot bonuses.
- DBL-069: Miniboss phase/telegraph/arena reset.
- DBL-070: 50 simulation fixtures för kombinationer och softlock-skydd.
**Grind:** Elitgrupper kräver igenkänning och taktik; inga omöjliga kombinationer i standardläge.

### Phase 10 — Combat vertical slice [P0]
- DBL-071: Bygg 15–30 min krypta med 5 monsterroller och miniboss.
- DBL-072: Polera melee och caster med gameplaykamera, ljud och attackfeedback.
- DBL-073: Kalibrera monster- och hero attack timings genom blindtest.
- DBL-074: Visual/performance pass på två referensmaskiner.
- DBL-075: End-to-end komplett combat session och replay bug report.
- DBL-076: Granska tio definierade Diablo-II-känslotester med checklista.
**Grind G2:** Spelare vill fortsätta slåss även utan loot; strid och navigation godkända manuellt.

## D. Etapp C — RPG SYSTEMS / PHASES 11–17

### Phase 11 — Items och equipment schema [P0]
- DBL-077: Item bases, item-level, quality, rarity, level requirement.
- DBL-078: Equipment slots: helm, chest, gloves, boots, belt, rings, amulet, main/off hand.
- DBL-079: Stats aggregation och buff calculation order; snapshot & dynamic re-evaluation.
- DBL-080: Two-handed, dual-wield och off-hand rules.
- DBL-081: Item identification, binding/free trade flags, durability policy.
- DBL-082: Tooltip compare, stat breakdown och requirements UX.
**Grind:** Equip/unequip påverkar korrekt 100% av beroende attribut, inklusive attackbreakpoints.

### Phase 12 — Inventory, stash och loot presentation [P0]
- DBL-083: Grid-based spatial inventory (Inventory Tetris) med rotation-policy.
- DBL-084: Drag/drop, split, stack, swap, overflow och drop-to-ground.
- DBL-085: Personal stash och optional shared stash mellan lokala karaktärer.
- DBL-086: Ground items, loot labels, highlighting, item pickup radius.
- DBL-087: Basic loot filter med färg/prio och tillgängligt UI.
- DBL-088: Auto-pickup enbart för specificerade resurser (valbart).
- DBL-089: Keyboard controls, controller readiness och item comparisons.
**Grind:** Loot är läsbart, navigerbart, roligt att plocka upp och stabilt att spara.

### Phase 13 — Affix- och drop-system [P0]
- DBL-090: Quality rolls + weighted drop tables per monster/area/difficulty.
- DBL-091: Prefix/suffix pools, tiers, item level gates, exclusions.
- DBL-092: Magic/Rare item rolling och guaranteed stat constraints.
- DBL-093: Unique and set item templates med versionshantering.
- DBL-094: Gold, consumables, material drops och rarity presentation.
- DBL-095: Loot simulator (100k rolls) med distribution tests och report.
- DBL-096: Magic find-liknande parameter med diminishing returns, design ADR.
**Grind:** Drops har verifierbar distribution, rimliga uppgraderingsmöjligheter och sällsynthetskänsla.

### Phase 14 — Socket, runor, juveler och recept [P1]
- DBL-097: Sockets och item socket caps.
- DBL-098: Runes/gems/jewels och statregler per slot.
- DBL-099: Kombinationer i rätt ordning, levels och equipment constraints.
- DBL-100: Crafting cube/receptmotor med explicita ingredienser och outputs.
- DBL-101: Inventory UI, preview och misclick guard för irreversibla recipes.
- DBL-102: Recipe validation och seeded test battery.
**Grind:** Flera föremålskombinationer skapar genuint nya byggmöjligheter.

### Phase 15 — Attributes, XP och progression [P0]
- DBL-103: XP tables, level-up, penalties and high-level tapering.
- DBL-104: Strength, Dexterity, Vitality, Energy (egna namn vid behov), point allocation.
- DBL-105: Derived stats: life/mana, hit rating, defense, damage, movement.
- DBL-106: Level restrictions och skill/stat requirements.
- DBL-107: Respec system med definierat pris/tillgänglighet.
- DBL-108: Full character sheet, combat breakdown och tooltips.
- DBL-109: Character progression simulations lv 1–99.
**Grind:** Två val av attribut producerar olika men livskraftiga spelstilar.

### Phase 16 — Skill trees och builds [P0]
- DBL-110: Skill definition schema och skill engine effects/targeting.
- DBL-111: Tre träd per klass med prerequisites och ranks.
- DBL-112: Skill synergies, passive bonuses, auras och duration.
- DBL-113: 2 klasser för vertical slice: melee warrior, elemental mage.
- DBL-114: Primary/secondary skill slots, hotkeys, skillbar, tooltip.
- DBL-115: Build calculator/tests för edge cases, max ranks, breakpoints.
- DBL-116: Three viable builds per class, benchmark fixtures.
**Grind:** Varje klass har åtminstone två distinkta builds; 10+ min spel visar olika taktik.

### Phase 17 — Town economy, vendors, gambling [P1]
- DBL-117: Gold, cost/value, transaction and inflation controls.
- DBL-118: Vendors: buy, sell, repair, restock och inventory rotation.
- DBL-119: Gambling system med level-dependent item pools.
- DBL-120: Potions, scrolls, portal supplies, resupply loop.
- DBL-121: Crafting economy and sinks balancing.
- DBL-122: Shop UX with undo only for safe actions, no item-loss bugs.
**Grind G3:** Full game loop fungerar: kill → loot → equip/sell → level → specialize → farm.

## E. Etapp D — WORLD / PHASES 18–22

### Phase 18 — Procgen framework [P0]
- DBL-123: Seeded generation strategy och region/room graph.
- DBL-124: Fixed quest anchors + procedural branches.
- DBL-125: Outdoor terrain rules, path widths, spawn density.
- DBL-126: Dungeon rooms, entrances/exits, stairs, locked doors.
- DBL-127: Connectivity/fairness 1k seeds automated tests.
- DBL-128: Environment storytelling constraints and decoration.
- DBL-129: Minimap generation and exploration state.
**Grind:** 1000 kartor utan osynliga väggar, blockerade objectives eller omöjliga spawn points.

### Phase 19 — World interaction and exploration [P1]
- DBL-130: Doors, chests, barrels, destructibles, traps, shrines.
- DBL-131: NPC interaction, proximity prompts, dialogue state.
- DBL-132: Town portals + return locations + waypoint fast travel.
- DBL-133: Fog of war, discovery/map visibility and map overlays.
- DBL-134: Area transitions and loading zones.
- DBL-135: World-state persistence across session boundaries.
**Grind:** En 30-minuters utforskning kan avbrytas och fortsätta utan progressionsförlust.

### Phase 20 — Quest architecture [P1]
- DBL-136: Data-driven quest graph, objectives and triggers.
- DBL-137: Quest log, map hints, dialogue and reputation flags.
- DBL-138: Kill/collect/explore/boss/escort/interaction quest types.
- DBL-139: Rewards (item, XP, gold, skill/stat points, unlock).
- DBL-140: Quest save/load/migration and replay policies.
- DBL-141: Quest simulation tests for softlock and sequence breaks.
**Grind:** Alla huvudquestkedjor kan slutföras oavsett rimlig ordning på sidohändelser.

### Phase 21 — Campaign act I [P0]
- DBL-142: Original hub town with vendors/stash/healer/trainers.
- DBL-143: Biome kit: woodland, marsh, graveyard, catacomb, cathedral ruins.
- DBL-144: 6–8 connected regions with dungeon branches.
- DBL-145: 5–8 quest beats and optional secrets.
- DBL-146: Three miniboss encounters and finale boss.
- DBL-147: Act I scripted opening/ending, original lore/VO/text.
- DBL-148: Full Act I balance + E2E playthrough and progression curve.
**Grind G4:** Ny spelare kan klara första akten från start till slut; loopen håller för flera timmars spel.

### Phase 22 — Campaign pipeline for additional acts [P1]
- DBL-149: Reusable act config with themes, spawn tables, quests, towns.
- DBL-150: Region transition/world map interfaces.
- DBL-151: Biome variation tooling for tiles, props, lights, weather.
- DBL-152: Shared cinematic and boss event system.
- DBL-153: Campaign regression tool to detect missing resources.
- DBL-154: Act transition savepoint and unlock policies.
**Grind:** Ny akt kan skapas som content utan stora motorändringar.

## F. Etapp E — ADVANCED GAMEPLAY / PHASES 23–27

### Phase 23 — Difficulty progression [P1]
- DBL-155: Normal/Nightmare/Hell equivalents with own names.
- DBL-156: Resistance penalties, elite modifiers, level/growth scaling.
- DBL-157: Experience, economy and loot table differences.
- DBL-158: Immunities and anti-softlock design for solo builds.
- DBL-159: Difficulty unlock, persistent quest status, replay.
- DBL-160: Difficulty balance simulations across archetypal builds.
**Grind:** Varje svårighetsgrad ändrar hur spelaren måste spela, inte bara fiendernas HP.

### Phase 24 — Mercenaries, summons och companions [P2]
- DBL-161: Companion contract, equipment, XP and AI.
- DBL-162: Tank, ranged support, healing/support archetypes.
- DBL-163: Summoning caps, targeting, corpse interaction and lifetime.
- DBL-164: Companions death/revive/cost systems.
- DBL-165: Aura and buff interactions incl. deterministic tests.
**Grind:** Companions tillför taktiska beslut utan att ersätta hjälten.

### Phase 25 — Build depth och balancing [P1]
- DBL-166: Build benchmark harness and representative gear sets.
- DBL-167: Caps, diminishing returns and breakpoints audit.
- DBL-168: Physical/elemental/magic immunities + counterplay.
- DBL-169: 5 archetypal builds (melee, ranged, caster, tank, summoner) validated.
- DBL-170: Boss-specific skill interactions and underpowered build detection.
- DBL-171: Respec economy and build accessibility review.
**Grind:** Byggvariation är betydelsefull utan obligatorisk enda överlägsen build.

### Phase 26 — Endgame farming och replayability [P1]
- DBL-172: Boss farming and reset rules, repeatable content.
- DBL-173: Weighted high-tier rewards and rare drop targets.
- DBL-174: Dynamic high-level zones inspired by rotating challenge areas.
- DBL-175: Endgame monster affix escalation and incentives.
- DBL-176: Collection journal + unique/set tracking.
- DBL-177: Endgame milestones, achievements and stats.
**Grind:** 10 spelpass efter kampanjen ger meningsfulla val mellan farmingmål.

### Phase 27 — Hardcore, death and optional challenge modes [P2]
- DBL-178: Hardcore character flag and irreversible death handling.
- DBL-179: Safe backups and anti-corruption protections, transparency of rules.
- DBL-180: Challenge modifiers and ironman options.
- DBL-181: Separate leaderboards local-only until backend exists.
- DBL-182: Death presentation, memorial/log and accessibility.
**Grind G5:** Tre svårighetsgrader och endgame-loop är balanserade och testbara.

## G. Etapp F — CONTENT / PHASES 28–31

### Phase 28 — Full class roster [P2]
- DBL-183: Expand to 5 original classes with differentiated resources and roles.
- DBL-184: 3 skill trees each; target 15–25 meaningful skills per class before further expansion.
- DBL-185: 8-dir animations and equipment visuals for each class.
- DBL-186: Class-specific starting gear, early tutorial and progression.
- DBL-187: Class benchmark suites across difficulty modes.
**Grind:** Alla klasser genomför kampanjen och uppvisar separata spelstilar.

### Phase 29 — Monster bestiary expansion [P2]
- DBL-188: 40–60 original enemies in distinct families, staged by biome.
- DBL-189: Elite/affix compatibility metadata per enemy.
- DBL-190: Unique silhouettes/animations/VFX/audio per monster family.
- DBL-191: 8–12 bosses with handcrafted patterns and readable telegraphs.
- DBL-192: Audio/visual enemy signaling readability and accessibility.
**Grind:** Spelaren känner igen hot genom rörelse och silhouette, inte bara HP-färg.

### Phase 30 — Full campaign content [P2]
- DBL-193: Act II: arid ruins / desert crypts, 6–8 quests, 1 finale boss.
- DBL-194: Act III: flooded jungle / lost temples, quests, boss.
- DBL-195: Act IV: fallen citadel / hellscape, quests, final boss.
- DBL-196: Optional dungeons, rare locations, secret encounters.
- DBL-197: Quest/campaign regression across classes and difficulties.
**Grind:** 4-aktkampanj komplett med egen lore och tydlig progression.

### Phase 31 — Endgame items, crafting and collection [P2]
- DBL-198: 100s item base/unique/set definitions from validated content data.
- DBL-199: Diverse rune combinations, jewels, crafting recipes and socketing.
- DBL-200: Itemization audit: meaningful decisions and rarity distribution.
- DBL-201: Long-term gold sinks, vendor farming, magic find viability.
- DBL-202: Collection progression and seasonless offline goals.
**Grind:** Sällsynta föremål känns eftertraktade och ger fler möjligheter än bara större skada.

## H. Etapp G — QUALITY / PHASES 32–34

### Phase 32 — Audiovisual polish and UI [P1]
- DBL-203: Final art pass: material coherence, light, shadow, dust and fog.
- DBL-204: Responsive UI inventory, skill tree, quest journal, menus.
- DBL-205: Responsive accessibility: remapping, text sizes, contrast, reduced motion.
- DBL-206: Dynamic music/ambience and positional SFX.
- DBL-207: Hits, deaths, footsteps, spell sounds and loot tiers audio signatures.
- DBL-208: Settings: master/music/SFX, graphics quality, camera options.
- DBL-209: Credits/licenses and original world presentation.
**Grind:** Koherent ljud och grafik i hela akt I–IV, inga placeholder-artifacts i release-scope.

### Phase 33 — Save, reliability and offline [P0]
- DBL-210: IndexedDB save slots and character roster.
- DBL-211: Versioned schema migrations, atomic writes and backup rotation.
- DBL-212: Export/import saves with checksums and size/version guards.
- DBL-213: PWA offline caching, asset chunking, recovery after update.
- DBL-214: Browser tab suspend/resume, focus-loss/input rules.
- DBL-215: Crash recovery, cache invalidation, stale game version warning.
- DBL-216: Save/load fuzz test and E2E for reloading during transitions.
**Grind:** Player progress survives interruptions, upgrades and normal storage failure paths as far as platform permits.

### Phase 34 — Performance, QA and release candidate [P0]
- DBL-217: Perf budgets by hardware tier: FPS median/p95 frametime, RAM, load.
- DBL-218: Optimize texture atlas, batching, occlusion, object pools, projectiles.
- DBL-219: Support desktop Chromium, Firefox, Safari current versions.
- DBL-220: Regression: all major classes, difficulties, quest paths, save slots.
- DBL-221: 10k combats / 100k loot rolls / 1k map seeds automated.
- DBL-222: Exploratory playtests and bug taxonomy: critical/major/minor.
- DBL-223: Accessibility, readability and motion/flash review.
- DBL-224: Security: unsafe save import, HTML injection, untrusted data.
**Grind G6:** Release candidate meets functionality, performance, stability, legal and content checklist.

## I. Etapp H — RELEASE / PHASE 35

### Phase 35 — Release and roadmap 2.0 [P1]
- DBL-225: Release checklist, license/credits, attribution and asset audit.
- DBL-226: Versioned release artifacts, tag/changelog and GitHub Pages deploy.
- DBL-227: Browser smoke test and deployed URL health check.
- DBL-228: Player documentation, controls, troubleshooting, import/export save guide.
- DBL-229: Anonymous optional feedback workflow without third-party tracking by default.
- DBL-230: Post-release bugfix triage and balance telemetry via opt-in local export.
- DBL-231: Multiplayer feasibility ADR: server authoritative combat, persistence, anti-cheat, hosting budget; no implementation yet.
**Grind:** Public launch verified with recovery/rollback plan.

## J. Cross-cutting Epics and unnumbered follow-ups

1. **Balance laboratory:** simulations, frame/breakpoint curves, effective DPS, survivability, potion economics, drop distributions.
2. **Gameplay recording:** deterministic input trace, seed export, event log, visual issue attachments.
3. **Asset rights:** originality, provenance, compatible license, attribution and review of AI-generated materials.
4. **Security and privacy:** local save safety, no unauthenticated cloud write endpoints; accessible privacy notice when telemetry is introduced.
5. **Accessibility:** remappable keys, readable fonts, colorblind-safe rarity cues, less camera shake, subtitle support.
6. **Technical debt:** dedicated refactor and performance issues per phase, rather than hidden work.
7. **Issue dependencies:** no later content expansion if foundational battle feel, item calculation, world traversal or save safety remains broken.

## K. Golden Gameplay Tests — manual checkpoints

1. Klicka på en fiende bakom hinder: hjälten tar rimlig väg, går till attackavstånd och angriper korrekt.
2. Växla mål mitt i attack: animation och handlingsavbrott är konsekvent och förutsägbara.
3. Snabbt och långsamt vapen: distinkt attackrytm, inte bara olika DPS i tooltip.
4. Ta flera träffar: hit recovery/stagger tydligt men utan orättvis permanent låsning.
5. Drick potion under strid: konsekventa input- och actionregler, tydlig feedback.
6. Möta 20 fiender: flocken rör sig naturligt, attackindikatorer läsbara, stabil FPS.
7. Möta elemental immune/resistant monster: buildtaktik och motmedel krävs men ingen softlock.
8. Dö och återvänd: kostnad är begriplig, ingen förlorad save.
9. Drop av ovanligt föremål: ljud, etikett, jämförelse och meningsfull effekt på build.
10. 30-minuters session: spelaren upplever åtminstone en meningsfull förbättring av build eller gear.
11. 3 kartgenereringar: känns skilda men har trovärdiga vägar och uppdrag.
12. Återuppta sparning efter uppdatering: migration säker och förutsägbar.

## L. Art production capacity / source strategy

- För alla nya karaktärer: en 8-direction turntable och godkänd silhuett innan fulla animationer.
- Minimal actions: idle, walk, run, basic attack, heavy attack, cast, hit, block, death (klassberoende).
- Större innehållsavvikelser kräver asset-issue och tekniskt estimat.
- Visual acceptance kräver screenshot/video av scen, inte bara genererade enskilda illustrationsbilder.
- Ljusnivåer: baked diffuse/shadow maps som grund; selektiva dynamiska punktljus och normal maps.
- Budgetera atlasminne, LOD och nedladdningsstorlek innan massproduktion.

## M. Initieringsordning för Codex

1. Skapa dokumenten och backloggen från denna plan utan att implementera alla epics.
2. Skapa GitHub Milestones för 36 faser och labels `phase:00`...`phase:35`, `priority:p0`...`p3`, `type:feature/bug/asset/test/docs`, `gate:g0`...`g6`.
3. Skapa de 231 issues med deras stabila DBL-ID och tydliga beroenden, eller skapa 00–10 som detaljerade issues först och resten som planerade backlogposter om GitHub API/kvoter begränsar; inga dubbletter.
4. Implementera Phase 00 och Phase 01; passera G0 innan rendering/assetmassproduktion.
5. Håll STATUS.md kort: nuvarande fas, senast godkända gate, nästa issue, blocker, senaste testkörning, head commit.
6. Läs enbart AGENTS.md, STATUS.md och berörda moduler vid varje Codex-körning; undvik att klistra in hela backloggen.

## N. Kodex prompt för varje arbetspass

```text
Read AGENTS.md and STATUS.md, then take the highest-priority unblocked GitHub Issue in the current approved phase. Implement only that Issue (or at most three explicitly grouped tiny Issues), including tests and necessary docs. Respect a soft working budget of 10 minutes per normal Issue, split large work, and stop safely when budget is reached. Run focused tests plus required project checks, commit verified work, update Issue and STATUS.md. Do not print full logs or reread the entire backlog. Report in <=200 words: Issue, changes, test outcomes, commit, blockers, next Issue. Do not cross an approval gate automatically. If an external runner supports waiting, use 30–60 seconds between separate Codex runs; do not sleep within game code or tests. Never treat this pause as a token-saving guarantee.
```

## O. Konkreta lanseringsdefinitioner

**Prototype:** rörelse, 1 hjälte, 2 fiender, 1 miljö, slag/spell, visuellt trovärdig 2.5D.

**Combat alpha:** fas 00–10 komplett: 15–30 min krypta, 5 fiendearketyper, 1 boss, spelkänsla godkänd.

**RPG alpha:** fas 00–17 inklusive 2 klasser, inventory, loot, skill trees, vendors; replaybar progression.

**Act I beta:** genomspelbar akt med quests, värld, sparning och itemization i fungerande skick.

**Full beta:** flera akter, endgame, svårigheter, innehåll, balans, fullt save-system.

**Release:** G6 godkänd, QA-svit passerar, originalgrafik och legal audit klar, release på Pages.

## P. Referensnoteringar

- Blizzard, Diablo II Resurrected official: https://diablo2.blizzard.com/
- Blizzard Terror Zones / immunity design: https://news.blizzard.com/en-us/article/23816418/diablo-ii-resurrected-ptr-2-5terror-zones-now-live
- Phaser v4.2 release: https://editor.phaser.io/news/2026/06/phaser-v4-2-0-released
- Phaser lighting: https://phaser.io/news/2026/05/phaser-4-dynamic-lighting
- Phaser tilemap: https://docs.phaser.io/api-documentation/4.0.0/class/tilemaps-tilemap

Planen är ett ambitionsmål, inte en garanti för genomförandetid eller exakt mekanisk ekvivalens med Diablo II. Fokus är funktionell inspiration och en helt egen produktidentitet.
