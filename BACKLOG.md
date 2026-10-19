# Hollowbane backlog

Imported all 231 original requirements verbatim from [the source](docs/source/diabloish_master_backlog.md). Source phase assignments and DBL identifiers are stable. Structured import records with original `phase`, mapped `targetPhase`, scope, acceptance criteria, tests, assets and DoD live in [backlog.json](docs/backlog.json). Later issue acceptance criteria require feature-specific refinement before implementation. Dependencies currently form a conservative acyclic execution sequence; they express planning order, not a claim that every adjacent feature is technically coupled. Refine when an issue enters an approved phase.

| ID      | Source phase | Priority | Requirement                                                                                                                                         |
| ------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| DBL-001 | 00           | p0       | Skapa game pillars: rörelse, frame-/aktionsrytm, loot, progression, mörk atmosfär, risk/belöning.                                                   |
| DBL-002 | 00           | p0       | Dokumentera Diablo II-inspirerade mekaniker: attack/cast recovery, block, resistans, life/mana, potion belt, stamina, death, town portal, waypoint. |
| DBL-003 | 00           | p0       | Skriv 2 referensscenarier: melee versus mob pack; caster versus elite pack.                                                                         |
| DBL-004 | 00           | p0       | Definiera spelkamera, kontrollschema, WASD-alternativ och tillgänglighetsprinciper.                                                                 |
| DBL-005 | 00           | p0       | Definiera 10-minuters fun test och observerbara mått: respons, animation, loot excitement, progression.                                             |
| DBL-006 | 00           | p0       | Skapa GAME_DESIGN.md, ART_BIBLE.md och ACCEPTANCE_MATRIX.md.                                                                                        |
| DBL-007 | 01           | p0       | Repo, Vite, TS strict, lint, format, test harness.                                                                                                  |
| DBL-008 | 01           | p0       | Phaser 3 vs 4 spike på isometrisk karta med ljus och 50 sprites; dokumentera versionsval.                                                           |
| DBL-009 | 01           | p0       | Arkitektur: rendering adapter, input intents, simulation core, content registry, persistence.                                                       |
| DBL-010 | 01           | p0       | Github Actions: typecheck/lint/unit/E2E/build och Pages preview/deploy.                                                                             |
| DBL-011 | 01           | p0       | Git conventions, AGENTS.md, STATUS.md, ADR och issue templates.                                                                                     |
| DBL-012 | 01           | p0       | Deterministic RNG, timestep och replay-trace skeleton.                                                                                              |
| DBL-013 | 01           | p0       | Performance measurement harness (FPS, frametime p95, memory, draw calls, loading).                                                                  |
| DBL-014 | 02           | p0       | Isometrisk grid/world-to-screen/screen-to-world samt mus-hittest.                                                                                   |
| DBL-015 | 02           | p0       | Lager och sorteringsregler för sprites, byggnader, broar och överskymning.                                                                          |
| DBL-016 | 02           | p0       | Kamera följning, zoom, clamp, resolution scaling, ultrawide.                                                                                        |
| DBL-017 | 02           | p0       | Collision/navmesh representation separat från synlig tile.                                                                                          |
| DBL-018 | 02           | p0       | Ljus/normal maps, skuggor, dimma, glow, particles spike.                                                                                            |
| DBL-019 | 02           | p0       | GPU texture atlas/batch-pipeline, inkrementell inladdning, renderer diagnostics.                                                                    |
| DBL-020 | 02           | p0       | Screenshot regression av projektion, occlusion och skuggor.                                                                                         |
| DBL-021 | 03           | p0       | Original art bible: material, palett, dimensioner, silhouette readability.                                                                          |
| DBL-022 | 03           | p0       | Assetmanifest med provenance, licens och kvalitetsnivå.                                                                                             |
| DBL-023 | 03           | p0       | Sprite exporters för 8 riktningar, pivots, skalor, normal maps, shadows.                                                                            |
| DBL-024 | 03           | p0       | Asset validators: frame counts, transparent bounds, naming, collision anchors.                                                                      |
| DBL-025 | 03           | p0       | Sprite preview gallery med riktningar/animationer och UI review.                                                                                    |
| DBL-026 | 03           | p0       | Miljö-kit A: jord, sten, stigar, träd, gravar, murar, facklor.                                                                                      |
| DBL-027 | 03           | p0       | Audio pipeline för UI, attacks, footsteps, ambience med rättigheter.                                                                                |
| DBL-028 | 04           | p0       | Click to move med semantik för attack/interact/loot och högre handlingsprioritet.                                                                   |
| DBL-029 | 04           | p0       | Precise pathfinding, diagonal distance, dynamic obstacle replan.                                                                                    |
| DBL-030 | 04           | p0       | Walk/run mode och valfritt stamina-system; kalibrera mot målkänsla.                                                                                 |
| DBL-031 | 04           | p0       | Retarget, interrupt, queue och input buffering enligt definierade regler.                                                                           |
| DBL-032 | 04           | p0       | 8-riktningsanimation med fotfäste/pivot och transitions.                                                                                            |
| DBL-033 | 04           | p0       | Entity movement separation/steering vid täta grupper.                                                                                               |
| DBL-034 | 04           | p0       | Hover, selection, cursor feedback, interactable highlighting.                                                                                       |
| DBL-035 | 04           | p0       | Input latency och rörelsekänsla testscenarier.                                                                                                      |
| DBL-036 | 05           | p0       | Action states: idle, move, windup, strike, recovery, hitstun, block, dead.                                                                          |
| DBL-037 | 05           | p0       | Tick-accurate timeline med start, active frames, recovery och möjlighet till avbrott.                                                               |
| DBL-038 | 05           | p0       | Melee target acquisition, range, facing, auto-approach.                                                                                             |
| DBL-039 | 05           | p0       | Attack speed modifiers och diskreta breakpoints (egna balansvärden).                                                                                |
| DBL-040 | 05           | p0       | Hit/miss/block, critical, armor/defense, damage types.                                                                                              |
| DBL-041 | 05           | p0       | Hit recovery, knockback och stagger samt anti-stunlock regler.                                                                                      |
| DBL-042 | 05           | p0       | Hit feedback, sound, VFX, screen shake och animation sync.                                                                                          |
| DBL-043 | 05           | p0       | Combat event log/test scenarios/replay.                                                                                                             |
| DBL-044 | 06           | p0       | HP, mana, regen, resource costs och thresholds.                                                                                                     |
| DBL-045 | 06           | p0       | Potion belt, quickslots, potion animation, cooldown policy.                                                                                         |
| DBL-046 | 06           | p0       | DoT/HoT och damage over time med korrekt stacking.                                                                                                  |
| DBL-047 | 06           | p0       | Resistances/absorbs, immunities, vulnerabilities och max/min caps.                                                                                  |
| DBL-048 | 06           | p0       | Player death/resurrection, death penalty och återhämtning.                                                                                          |
| DBL-049 | 06           | p0       | Healing/shrines/wells och interaktioner.                                                                                                            |
| DBL-050 | 06           | p0       | Status HUD med life/mana orbs och tydliga varningar.                                                                                                |
| DBL-051 | 07           | p0       | Projectile engine: aim, travel, collision, pierce, bounce, AoE.                                                                                     |
| DBL-052 | 07           | p0       | Cast speed breakpoints, casting animation, interruption.                                                                                            |
| DBL-053 | 07           | p0       | Elements: physical, fire, cold, lightning, poison, magic/arcane.                                                                                    |
| DBL-054 | 07           | p0       | Freeze/slow/burn/shock/poison med duration och cleanse.                                                                                             |
| DBL-055 | 07           | p0       | Targeted, self, aura, cone, beam, nova, summoned effects.                                                                                           |
| DBL-056 | 07           | p0       | Resource & cooldown balancing integration.                                                                                                          |
| DBL-057 | 07           | p0       | Visual spell FX, readability och shader/fallback.                                                                                                   |
| DBL-058 | 08           | p0       | Monster data models, faction, family, role, abilities, stats.                                                                                       |
| DBL-059 | 08           | p0       | Awareness/aggro, pursuit/leash, perception och pathfinding.                                                                                         |
| DBL-060 | 08           | p0       | Idle/patrol/approach/attack/retreat/flee states.                                                                                                    |
| DBL-061 | 08           | p0       | Group steering och crowd management i trånga korridorer.                                                                                            |
| DBL-062 | 08           | p0       | Archetypes: melee, ranged, caster, summoner, fast flanker, tank.                                                                                    |
| DBL-063 | 08           | p0       | Monster animation, death, corpse persistence och corpses as gameplay.                                                                               |
| DBL-064 | 08           | p0       | AI determinism stress tester med 30–50 aktiva monster.                                                                                              |
| DBL-065 | 09           | p1       | Normal/champion/unique elites inklusive skyltfärg och namngivning.                                                                                  |
| DBL-066 | 09           | p1       | Modifier library: extra strong, fast, enchanted, cursed, aura, multishot, etc. med egna namn.                                                       |
| DBL-067 | 09           | p1       | Modifiers compatibility and danger budget.                                                                                                          |
| DBL-068 | 09           | p1       | Elite pack generation, minions och loot bonuses.                                                                                                    |
| DBL-069 | 09           | p1       | Miniboss phase/telegraph/arena reset.                                                                                                               |
| DBL-070 | 09           | p1       | 50 simulation fixtures för kombinationer och softlock-skydd.                                                                                        |
| DBL-071 | 10           | p0       | Bygg 15–30 min krypta med 5 monsterroller och miniboss.                                                                                             |
| DBL-072 | 10           | p0       | Polera melee och caster med gameplaykamera, ljud och attackfeedback.                                                                                |
| DBL-073 | 10           | p0       | Kalibrera monster- och hero attack timings genom blindtest.                                                                                         |
| DBL-074 | 10           | p0       | Visual/performance pass på två referensmaskiner.                                                                                                    |
| DBL-075 | 10           | p0       | End-to-end komplett combat session och replay bug report.                                                                                           |
| DBL-076 | 10           | p0       | Granska tio definierade Diablo-II-känslotester med checklista.                                                                                      |
| DBL-077 | 11           | p0       | Item bases, item-level, quality, rarity, level requirement.                                                                                         |
| DBL-078 | 11           | p0       | Equipment slots: helm, chest, gloves, boots, belt, rings, amulet, main/off hand.                                                                    |
| DBL-079 | 11           | p0       | Stats aggregation och buff calculation order; snapshot & dynamic re-evaluation.                                                                     |
| DBL-080 | 11           | p0       | Two-handed, dual-wield och off-hand rules.                                                                                                          |
| DBL-081 | 11           | p0       | Item identification, binding/free trade flags, durability policy.                                                                                   |
| DBL-082 | 11           | p0       | Tooltip compare, stat breakdown och requirements UX.                                                                                                |
| DBL-083 | 12           | p0       | Grid-based spatial inventory (Inventory Tetris) med rotation-policy.                                                                                |
| DBL-084 | 12           | p0       | Drag/drop, split, stack, swap, overflow och drop-to-ground.                                                                                         |
| DBL-085 | 12           | p0       | Personal stash och optional shared stash mellan lokala karaktärer.                                                                                  |
| DBL-086 | 12           | p0       | Ground items, loot labels, highlighting, item pickup radius.                                                                                        |
| DBL-087 | 12           | p0       | Basic loot filter med färg/prio och tillgängligt UI.                                                                                                |
| DBL-088 | 12           | p0       | Auto-pickup enbart för specificerade resurser (valbart).                                                                                            |
| DBL-089 | 12           | p0       | Keyboard controls, controller readiness och item comparisons.                                                                                       |
| DBL-090 | 13           | p0       | Quality rolls + weighted drop tables per monster/area/difficulty.                                                                                   |
| DBL-091 | 13           | p0       | Prefix/suffix pools, tiers, item level gates, exclusions.                                                                                           |
| DBL-092 | 13           | p0       | Magic/Rare item rolling och guaranteed stat constraints.                                                                                            |
| DBL-093 | 13           | p0       | Unique and set item templates med versionshantering.                                                                                                |
| DBL-094 | 13           | p0       | Gold, consumables, material drops och rarity presentation.                                                                                          |
| DBL-095 | 13           | p0       | Loot simulator (100k rolls) med distribution tests och report.                                                                                      |
| DBL-096 | 13           | p0       | Magic find-liknande parameter med diminishing returns, design ADR.                                                                                  |
| DBL-097 | 14           | p1       | Sockets och item socket caps.                                                                                                                       |
| DBL-098 | 14           | p1       | Runes/gems/jewels och statregler per slot.                                                                                                          |
| DBL-099 | 14           | p1       | Kombinationer i rätt ordning, levels och equipment constraints.                                                                                     |
| DBL-100 | 14           | p1       | Crafting cube/receptmotor med explicita ingredienser och outputs.                                                                                   |
| DBL-101 | 14           | p1       | Inventory UI, preview och misclick guard för irreversibla recipes.                                                                                  |
| DBL-102 | 14           | p1       | Recipe validation och seeded test battery.                                                                                                          |
| DBL-103 | 15           | p0       | XP tables, level-up, penalties and high-level tapering.                                                                                             |
| DBL-104 | 15           | p0       | Strength, Dexterity, Vitality, Energy (egna namn vid behov), point allocation.                                                                      |
| DBL-105 | 15           | p0       | Derived stats: life/mana, hit rating, defense, damage, movement.                                                                                    |
| DBL-106 | 15           | p0       | Level restrictions och skill/stat requirements.                                                                                                     |
| DBL-107 | 15           | p0       | Respec system med definierat pris/tillgänglighet.                                                                                                   |
| DBL-108 | 15           | p0       | Full character sheet, combat breakdown och tooltips.                                                                                                |
| DBL-109 | 15           | p0       | Character progression simulations lv 1–99.                                                                                                          |
| DBL-110 | 16           | p0       | Skill definition schema och skill engine effects/targeting.                                                                                         |
| DBL-111 | 16           | p0       | Tre träd per klass med prerequisites och ranks.                                                                                                     |
| DBL-112 | 16           | p0       | Skill synergies, passive bonuses, auras och duration.                                                                                               |
| DBL-113 | 16           | p0       | 2 klasser för vertical slice: melee warrior, elemental mage.                                                                                        |
| DBL-114 | 16           | p0       | Primary/secondary skill slots, hotkeys, skillbar, tooltip.                                                                                          |
| DBL-115 | 16           | p0       | Build calculator/tests för edge cases, max ranks, breakpoints.                                                                                      |
| DBL-116 | 16           | p0       | Three viable builds per class, benchmark fixtures.                                                                                                  |
| DBL-117 | 17           | p1       | Gold, cost/value, transaction and inflation controls.                                                                                               |
| DBL-118 | 17           | p1       | Vendors: buy, sell, repair, restock och inventory rotation.                                                                                         |
| DBL-119 | 17           | p1       | Gambling system med level-dependent item pools.                                                                                                     |
| DBL-120 | 17           | p1       | Potions, scrolls, portal supplies, resupply loop.                                                                                                   |
| DBL-121 | 17           | p1       | Crafting economy and sinks balancing.                                                                                                               |
| DBL-122 | 17           | p1       | Shop UX with undo only for safe actions, no item-loss bugs.                                                                                         |
| DBL-123 | 18           | p0       | Seeded generation strategy och region/room graph.                                                                                                   |
| DBL-124 | 18           | p0       | Fixed quest anchors + procedural branches.                                                                                                          |
| DBL-125 | 18           | p0       | Outdoor terrain rules, path widths, spawn density.                                                                                                  |
| DBL-126 | 18           | p0       | Dungeon rooms, entrances/exits, stairs, locked doors.                                                                                               |
| DBL-127 | 18           | p0       | Connectivity/fairness 1k seeds automated tests.                                                                                                     |
| DBL-128 | 18           | p0       | Environment storytelling constraints and decoration.                                                                                                |
| DBL-129 | 18           | p0       | Minimap generation and exploration state.                                                                                                           |
| DBL-130 | 19           | p1       | Doors, chests, barrels, destructibles, traps, shrines.                                                                                              |
| DBL-131 | 19           | p1       | NPC interaction, proximity prompts, dialogue state.                                                                                                 |
| DBL-132 | 19           | p1       | Town portals + return locations + waypoint fast travel.                                                                                             |
| DBL-133 | 19           | p1       | Fog of war, discovery/map visibility and map overlays.                                                                                              |
| DBL-134 | 19           | p1       | Area transitions and loading zones.                                                                                                                 |
| DBL-135 | 19           | p1       | World-state persistence across session boundaries.                                                                                                  |
| DBL-136 | 20           | p1       | Data-driven quest graph, objectives and triggers.                                                                                                   |
| DBL-137 | 20           | p1       | Quest log, map hints, dialogue and reputation flags.                                                                                                |
| DBL-138 | 20           | p1       | Kill/collect/explore/boss/escort/interaction quest types.                                                                                           |
| DBL-139 | 20           | p1       | Rewards (item, XP, gold, skill/stat points, unlock).                                                                                                |
| DBL-140 | 20           | p1       | Quest save/load/migration and replay policies.                                                                                                      |
| DBL-141 | 20           | p1       | Quest simulation tests for softlock and sequence breaks.                                                                                            |
| DBL-142 | 21           | p0       | Original hub town with vendors/stash/healer/trainers.                                                                                               |
| DBL-143 | 21           | p0       | Biome kit: woodland, marsh, graveyard, catacomb, cathedral ruins.                                                                                   |
| DBL-144 | 21           | p0       | 6–8 connected regions with dungeon branches.                                                                                                        |
| DBL-145 | 21           | p0       | 5–8 quest beats and optional secrets.                                                                                                               |
| DBL-146 | 21           | p0       | Three miniboss encounters and finale boss.                                                                                                          |
| DBL-147 | 21           | p0       | Act I scripted opening/ending, original lore/VO/text.                                                                                               |
| DBL-148 | 21           | p0       | Full Act I balance + E2E playthrough and progression curve.                                                                                         |
| DBL-149 | 22           | p1       | Reusable act config with themes, spawn tables, quests, towns.                                                                                       |
| DBL-150 | 22           | p1       | Region transition/world map interfaces.                                                                                                             |
| DBL-151 | 22           | p1       | Biome variation tooling for tiles, props, lights, weather.                                                                                          |
| DBL-152 | 22           | p1       | Shared cinematic and boss event system.                                                                                                             |
| DBL-153 | 22           | p1       | Campaign regression tool to detect missing resources.                                                                                               |
| DBL-154 | 22           | p1       | Act transition savepoint and unlock policies.                                                                                                       |
| DBL-155 | 23           | p1       | Normal/Nightmare/Hell equivalents with own names.                                                                                                   |
| DBL-156 | 23           | p1       | Resistance penalties, elite modifiers, level/growth scaling.                                                                                        |
| DBL-157 | 23           | p1       | Experience, economy and loot table differences.                                                                                                     |
| DBL-158 | 23           | p1       | Immunities and anti-softlock design for solo builds.                                                                                                |
| DBL-159 | 23           | p1       | Difficulty unlock, persistent quest status, replay.                                                                                                 |
| DBL-160 | 23           | p1       | Difficulty balance simulations across archetypal builds.                                                                                            |
| DBL-161 | 24           | p2       | Companion contract, equipment, XP and AI.                                                                                                           |
| DBL-162 | 24           | p2       | Tank, ranged support, healing/support archetypes.                                                                                                   |
| DBL-163 | 24           | p2       | Summoning caps, targeting, corpse interaction and lifetime.                                                                                         |
| DBL-164 | 24           | p2       | Companions death/revive/cost systems.                                                                                                               |
| DBL-165 | 24           | p2       | Aura and buff interactions incl. deterministic tests.                                                                                               |
| DBL-166 | 25           | p1       | Build benchmark harness and representative gear sets.                                                                                               |
| DBL-167 | 25           | p1       | Caps, diminishing returns and breakpoints audit.                                                                                                    |
| DBL-168 | 25           | p1       | Physical/elemental/magic immunities + counterplay.                                                                                                  |
| DBL-169 | 25           | p1       | 5 archetypal builds (melee, ranged, caster, tank, summoner) validated.                                                                              |
| DBL-170 | 25           | p1       | Boss-specific skill interactions and underpowered build detection.                                                                                  |
| DBL-171 | 25           | p1       | Respec economy and build accessibility review.                                                                                                      |
| DBL-172 | 26           | p1       | Boss farming and reset rules, repeatable content.                                                                                                   |
| DBL-173 | 26           | p1       | Weighted high-tier rewards and rare drop targets.                                                                                                   |
| DBL-174 | 26           | p1       | Dynamic high-level zones inspired by rotating challenge areas.                                                                                      |
| DBL-175 | 26           | p1       | Endgame monster affix escalation and incentives.                                                                                                    |
| DBL-176 | 26           | p1       | Collection journal + unique/set tracking.                                                                                                           |
| DBL-177 | 26           | p1       | Endgame milestones, achievements and stats.                                                                                                         |
| DBL-178 | 27           | p2       | Hardcore character flag and irreversible death handling.                                                                                            |
| DBL-179 | 27           | p2       | Safe backups and anti-corruption protections, transparency of rules.                                                                                |
| DBL-180 | 27           | p2       | Challenge modifiers and ironman options.                                                                                                            |
| DBL-181 | 27           | p2       | Separate leaderboards local-only until backend exists.                                                                                              |
| DBL-182 | 27           | p2       | Death presentation, memorial/log and accessibility.                                                                                                 |
| DBL-183 | 28           | p2       | Expand to 5 original classes with differentiated resources and roles.                                                                               |
| DBL-184 | 28           | p2       | 3 skill trees each; target 15–25 meaningful skills per class before further expansion.                                                              |
| DBL-185 | 28           | p2       | 8-dir animations and equipment visuals for each class.                                                                                              |
| DBL-186 | 28           | p2       | Class-specific starting gear, early tutorial and progression.                                                                                       |
| DBL-187 | 28           | p2       | Class benchmark suites across difficulty modes.                                                                                                     |
| DBL-188 | 29           | p2       | 40–60 original enemies in distinct families, staged by biome.                                                                                       |
| DBL-189 | 29           | p2       | Elite/affix compatibility metadata per enemy.                                                                                                       |
| DBL-190 | 29           | p2       | Unique silhouettes/animations/VFX/audio per monster family.                                                                                         |
| DBL-191 | 29           | p2       | 8–12 bosses with handcrafted patterns and readable telegraphs.                                                                                      |
| DBL-192 | 29           | p2       | Audio/visual enemy signaling readability and accessibility.                                                                                         |
| DBL-193 | 30           | p2       | Act II: arid ruins / desert crypts, 6–8 quests, 1 finale boss.                                                                                      |
| DBL-194 | 30           | p2       | Act III: flooded jungle / lost temples, quests, boss.                                                                                               |
| DBL-195 | 30           | p2       | Act IV: fallen citadel / hellscape, quests, final boss.                                                                                             |
| DBL-196 | 30           | p2       | Optional dungeons, rare locations, secret encounters.                                                                                               |
| DBL-197 | 30           | p2       | Quest/campaign regression across classes and difficulties.                                                                                          |
| DBL-198 | 31           | p2       | 100s item base/unique/set definitions from validated content data.                                                                                  |
| DBL-199 | 31           | p2       | Diverse rune combinations, jewels, crafting recipes and socketing.                                                                                  |
| DBL-200 | 31           | p2       | Itemization audit: meaningful decisions and rarity distribution.                                                                                    |
| DBL-201 | 31           | p2       | Long-term gold sinks, vendor farming, magic find viability.                                                                                         |
| DBL-202 | 31           | p2       | Collection progression and seasonless offline goals.                                                                                                |
| DBL-203 | 32           | p1       | Final art pass: material coherence, light, shadow, dust and fog.                                                                                    |
| DBL-204 | 32           | p1       | Responsive UI inventory, skill tree, quest journal, menus.                                                                                          |
| DBL-205 | 32           | p1       | Responsive accessibility: remapping, text sizes, contrast, reduced motion.                                                                          |
| DBL-206 | 32           | p1       | Dynamic music/ambience and positional SFX.                                                                                                          |
| DBL-207 | 32           | p1       | Hits, deaths, footsteps, spell sounds and loot tiers audio signatures.                                                                              |
| DBL-208 | 32           | p1       | Settings: master/music/SFX, graphics quality, camera options.                                                                                       |
| DBL-209 | 32           | p1       | Credits/licenses and original world presentation.                                                                                                   |
| DBL-210 | 33           | p0       | IndexedDB save slots and character roster.                                                                                                          |
| DBL-211 | 33           | p0       | Versioned schema migrations, atomic writes and backup rotation.                                                                                     |
| DBL-212 | 33           | p0       | Export/import saves with checksums and size/version guards.                                                                                         |
| DBL-213 | 33           | p0       | PWA offline caching, asset chunking, recovery after update.                                                                                         |
| DBL-214 | 33           | p0       | Browser tab suspend/resume, focus-loss/input rules.                                                                                                 |
| DBL-215 | 33           | p0       | Crash recovery, cache invalidation, stale game version warning.                                                                                     |
| DBL-216 | 33           | p0       | Save/load fuzz test and E2E for reloading during transitions.                                                                                       |
| DBL-217 | 34           | p0       | Perf budgets by hardware tier: FPS median/p95 frametime, RAM, load.                                                                                 |
| DBL-218 | 34           | p0       | Optimize texture atlas, batching, occlusion, object pools, projectiles.                                                                             |
| DBL-219 | 34           | p0       | Support desktop Chromium, Firefox, Safari current versions.                                                                                         |
| DBL-220 | 34           | p0       | Regression: all major classes, difficulties, quest paths, save slots.                                                                               |
| DBL-221 | 34           | p0       | 10k combats / 100k loot rolls / 1k map seeds automated.                                                                                             |
| DBL-222 | 34           | p0       | Exploratory playtests and bug taxonomy: critical/major/minor.                                                                                       |
| DBL-223 | 34           | p0       | Accessibility, readability and motion/flash review.                                                                                                 |
| DBL-224 | 34           | p0       | Security: unsafe save import, HTML injection, untrusted data.                                                                                       |
| DBL-225 | 35           | p1       | Release checklist, license/credits, attribution and asset audit.                                                                                    |
| DBL-226 | 35           | p1       | Versioned release artifacts, tag/changelog and GitHub Pages deploy.                                                                                 |
| DBL-227 | 35           | p1       | Browser smoke test and deployed URL health check.                                                                                                   |
| DBL-228 | 35           | p1       | Player documentation, controls, troubleshooting, import/export save guide.                                                                          |
| DBL-229 | 35           | p1       | Anonymous optional feedback workflow without third-party tracking by default.                                                                       |
| DBL-230 | 35           | p1       | Post-release bugfix triage and balance telemetry via opt-in local export.                                                                           |
| DBL-231 | 35           | p1       | Multiplayer feasibility ADR: server authoritative combat, persistence, anti-cheat, hosting budget; no implementation yet.                           |

## Scoped G1 increments

The 231 original requirements/IDs remain intact. Broad parents stay partial; these independently verified slices record only the approved visual prototype scope. No later combat/loot requirements are closed by G1 work.

| ID      | Parent  | Delivered scope                                          |
| ------- | ------- | -------------------------------------------------------- |
| DBL-232 | DBL-015 | G1 foot-anchor sorting and readable tall-prop occlusion  |
| DBL-233 | DBL-018 | G1 baked atmosphere and selective runtime lighting       |
| DBL-234 | DBL-019 | G1 scene asset packaging and bounded render cost         |
| DBL-235 | DBL-023 | G1 eight-direction idle/walk atlas export                |
| DBL-236 | DBL-028 | G1 click and keyboard exploration without combat intents |
| DBL-237 | DBL-029 | G1 static-obstacle A-star with precise grid joins        |
| DBL-238 | DBL-031 | G1 retarget and focus-loss locomotion policy             |
| DBL-239 | DBL-034 | G1 reachable-ground cursor and destination feedback      |

## Phase 2.5 — Gamepad support (G2.5)

Original numeric IDs and all 36 roadmap phases remain unchanged. Requested GP IDs are aliases, not duplicate issues. Phase 3 is frozen with its completed increments preserved. Resuming Phase 3 requires DBL-274 and explicit G2.5 approval.

| Requested ID | Stable issue | Scope                                        |
| ------------ | ------------ | -------------------------------------------- |
| DBL-GP01     | DBL-263      | Unified semantic actions                     |
| DBL-GP02     | DBL-264      | Lifecycle and active-controller selection    |
| DBL-GP03     | DBL-265      | Standard/vendor mapping profiles             |
| DBL-GP04     | DBL-266      | Analog axes, deadzones and speed curves      |
| DBL-GP05     | DBL-267      | Movement integration and priority            |
| DBL-GP06     | DBL-268      | Independent aim and existing action adapters |
| DBL-GP07     | DBL-269      | Every existing screen/menu navigation        |
| DBL-GP08     | DBL-270      | Context prompts and device glyphs            |
| DBL-GP09     | DBL-271      | Persistent remapping and conflicts           |
| DBL-GP10     | DBL-272      | Diagnostics/calibration                      |
| DBL-GP11     | DBL-273      | Vibration and safe input lifecycle           |
| DBL-GP12     | DBL-274      | Cross-browser/performance evidence and G2.5  |

DBL-263–274 are technically complete for G2.5 review; user gate approval is pending. CI, hosted/browser evidence and physical-verification limitations are recorded in [docs/gamepad/phase2.5.md](docs/gamepad/phase2.5.md). Broad parent requirements remain partial.

## Phase 4 delivery — Monster AI

G2.5 approved. Sequential scoped chain DBL-275 model → 276 perception/navigation → 277 behavior/archetypes → 278 packs/separation → 279 lifecycle/champion → 280 playable diagnostics → 281 browser/performance gate. These map to original DBL-058–065, whose complete source scope and dependencies remain preserved. Physical follow-ups DBL-282–286 remain planned and do not claim emulation as hardware verification.

Phase 4 technical candidate delivered: DBL-275–281 plus dependency fixes DBL-287–288. Stop at Monster AI review; quality approval pending. Hardware DBL-282–286 remain planned. Browser, hosted and enemy-count performance evidence: [docs/ai/phase4.md](docs/ai/phase4.md). Original monster/animation/performance/elite parents remain partial.

## Skills & Spell Systems — authorized after G4

DBL-291 validated content; DBL-292 shared timing/resources; DBL-293 elements/status/geometry; DBL-294 playable inputs/feedback; DBL-295 monster skills; DBL-296 browser/performance quality gate. Original parents remain partial. Physical DBL-282–286, provisional art, full-detail/Firefox performance and GitHub synchronization remain open.

Quality work split: DBL-296 browser regression → DBL-297 performance/investigation → DBL-298 publication/gate evidence. This keeps measurement and final review independently verifiable.

DBL-299 remains open for the measured skill-HUD software rendering threshold; it does not claim a native GPU performance result or replace existing full-detail/Firefox/hardware follow-ups.

## Intermediate Gameplay & Visual Polish

Skills technically approved. DBL-299 HUD performance, then scoped DBL-300 motion, 301 skill effects, 302 HUD readability, 303 audio, 304 contact/lighting consistency, 305 regression/showcase, 306 repeated performance, 307 hosted verification, 308 HUD-safe camera and 309 final gate evidence. These refine existing DBL-260/042/050/057/063/074 slices, not duplicate full requirements. Preserve the original 36 phases and IDs; no gameplay expansion. Stop for polish review.

Polish quality work split: DBL-305 regression/showcase, DBL-306 repeated performance, DBL-307 publication/review. No duplicate broad requirements are completed by these slices.

Readability follow-up DBL-308 fits playable ground above the larger HUD, preserving pointer projection/legacy views. DBL-309 is final review evidence after publication (307) and this correction; no original IDs renumbered.

Polish technical candidate delivered: scoped DBL-299–309 complete; user quality approval pending. Original 36 phases, IDs and broader partial parents preserved. Stop before new gameplay. Evidence: docs/polish/milestone.md.

## L1 – Item Architecture & Loot

Polish technically approved. DBL-310 content, 311 generation, 312 inspection/save, 313 death drops, 314 playable interaction, 315 diagnostics/statistics, 316 regression/performance/publication, 317 quality evidence. Original topics11–13 and parent dependencies preserved; these scoped slices do not complete inventory/equipment or broader itemization. Stop at L1 review; no L2 without approval.

L1 quality work split before completion: DBL-316 regression/visual, DBL-317 repeated performance/hosted verification, DBL-318 final review evidence. Scope is now310–318; stable original IDs/topics preserved, no duplicate acceptance.

DBL-319 is a required L1 dependency discovered by burst profiling: early-seed RNG correlation fix/content version2. DBL-317 depends on319 before final performance/publication;318 remains final gate. Graph validation now supports later-added dependencies without renumbering IDs and detects actual cycles.

L1 technical candidate delivered: DBL-310–319 complete; stop for user L1 review. Original36 phases preserved; no L2 without approval. Detailed docs/loot/l1.md.

L1 approved; L2 Inventory & Equipment authorized through DBL-320–331 and L2 gate, superseding the earlier inventory prohibition for this scope. Sequential footprints/grid/equipment/world transactions/stats/persistence/UI/controller/regression/performance/publication/gate. Original36 topics and IDs preserved; no L3/progression/crafting/vendors/sockets/runewords.

Persistence split: DBL-325 pure snapshot validation/migration infrastructure, then required DBL-332 atomic IndexedDB/recovery before326 UI. Existing IDs preserved; L2 scope320–332.

DBL-333 is a planned post-review inventory-modal compositing/native-GPU follow-up under partial DBL-074, based on DBL-329 measurements. It does not extend the L2 completion scope or authorize L3.

L3 authorized after L2 approval: DBL-334–350 sequential dependency chain covers all five increments. Requires12 original uniques,3 complete sets,12 rune components/8 ordered recipes, typed generic modifiers, atomic socket ownership, legacy-compatible saves, actual combat effects and million-roll validation. Original IDs/requirements retained and broader parents partial.333 and282–286 remain separate; no vendors/crafting/progression/campaign.

DBL-351 splits version4 registry isolation out of336, after335 and before336. It prevents circular initialization and legacy content mutation; final L3 gate remains350 after the full dependency chain.

DBL-352 splits generic derived-stat integration from337, following336. Proc/leech execution remains343; advanced save compatibility must precede playable activation.

DBL-353 splits content4 character-save compatibility from344 before playable337: schema2 snapshots, validated1→2 migration and unchanged legacy-only serialized output. Embedded ownership/migrations for later component versions remain344.

DBL-354 splits typed hit provenance and bounded serializable resolution tracing from343, after342. Actual effect interpretation remains343 and L3 final gate350.

DBL-355 isolates the discovered scene equipment-sync/selector override and casting/recovery bridge after354, before343. Preserve active commitment timing and existing manual controls.

DBL-356 splits actual contextual hit/skill/DoT arithmetic from343 after355. Proc/leech/status event interpretation remains343. No parent completion implied.

DBL-357 inspection/comparison/glyphs and358 explicit socket/controller UI split the oversized345 after344;345 retains final lab/replay/controller integration before346. Existing IDs and partial parent scope preserved.

DBL-359 addresses the discovered zero-damage power-buff rank case after358, before345. Generic item-rank interpretation only; no skill tree or character progression.

DBL-360 is a small required348 dependency: CI virtual D-pad taps must not accidentally become400ms repeats on slow RAFs. Real input/held-repeat behavior remains unchanged; prior failing CI evidence retained.

DBL-103 / P1: P1 foundation complete: pure cumulative integer XP, configurable 98-cost curve, levels1–99, exact/multiple threshold calculation, saturating safe additions and invalid-value rejection. Five targeted unit tests, TypeScript and targeted lint pass. No runtime/save changes. Broader level-up/penalties/tapering remain open; original dependencies retained. P1 explicitly authorized independently of unfinished parent dependencies.

DBL-103 / P2: P2 complete: configurable base XP by monster role; immediate combat death-event consumption, persistent encounter death deduplication including ineligible deaths, player-only registered-hostile kill credit, P1 multi-level/cap arithmetic. Five new focused reward tests plus P1/combat-hit-trace/encounter tests16 pass; TypeScript and targeted lint pass. Session XP only; no save migration, UI, loot or combat rule changes. Broader DBL-103 remains partial; stop after P2.

DBL-103/104/105 / P3–P5: P3–P5 delivered as one bounded increment: 5 attribute points per gained level with level high-water idempotency and490 lifetime cap; immutable configurable Strength/Dexterity/Vitality/Energy plus validated available/spent budgets and atomic allocation. Shared derivation combines base attributes, gear and advanced modifiers exactly once; physical Strength applies to weapons/direct skills/DoT, excludes elemental hits and proc damage. Existing resource policy retains absolute HP/mana, clamps decreases, never refills/resurrects. Eight new focused tests;29 targeted tests, TypeScript and relevant lint pass. Session-only state; no save migration/UI/skill points; broader parents remain partial. Stop after P5.

DBL-106 / P6: P6 equipment requirements delivered: configurable level/Strength/Dexterity checks on equip/swap/world transactions; only innate/allocated stats count. Atomic reconciliation stows invalidated gear or rejects the whole stat change when bag space is insufficient. Frozen content2–8 retains original level requirements and zero stat minima; no item replay/content mutation. Six new tests;19 targeted equipment/world/save/runtime tests, TypeScript and relevant lint pass. Broader DBL-106 remains partial (skill requirements excluded).

DBL-108 / P7 (2026-10-18): P7 gothic expandable character panel inside existing inventory modal; shared XP/current-level progress/cap, innate+allocated attributes/unspent points and actual shared combat/resistance totals. One view-state and3 existing runtime tests, TypeScript/relevant lint and1 Chromium panel scenario pass;1280x800 screenshot reviewed. No allocation/persistence yet; broader character-sheet parent remains partial.

DBL-104 / P8 (2026-10-18): P8 allocation controls use immutable domain allocation plus atomic equipment reconciliation and prepared derived stats. Stale state requests, overspending, repeated keyboard events and native double-click duplicates are rejected; loading disables controls. Immediate derived refresh retains absolute resources.12 targeted tests and2 Chromium panel scenarios pass; TypeScript/relevant lint pass, updated screenshot reviewed. Persistence follows in P9; broader parent remains partial.

DBL-210 / P9 complete (2026-10-18): P9 character schema3 persists xp-v1/XP/level/next threshold and starting/allocated/available/spent/rewarded-level state with strict conservation validation. Explicit schema1/2 migrations preserve exact equipment/items/embedded sockets/sets/runes/loot stream; existing level maps to threshold XP and5*(level-1) unspent points. Runtime binds one progression authority, autosaves XP changes, retains progression through encounter resets and prepares restore before mutation. Atomic IndexedDB current/previous CAS/quarantine behavior retained.24 targeted save/runtime tests, TypeScript/relevant lint and4 Chromium character/persistence scenarios pass. Shared unit run316 passes/2 outdated schema assertions; both corrected and targeted rerun passes. No repeated loot simulations. P7–P9 complete; stop, P10/P11 excluded. Broader source parent remains partial.

DBL-004 / P10 (2026-10-18): P10 character panel uses existing semantic controller actions: contextual choose/confirm/read/back, bounded attribute navigation and stat reading, cancel collapses before leaving inventory, exhausted allocation moves focus safely. Remapped prompts and gamepad-visible focus; keyboard/mouse preserved.19 targeted controller/progression/runtime tests and3 Chromium virtual Xbox/PlayStation/generic scenarios pass including generic interact remap, held allocation, disconnect/reconnect and mouse recovery. TypeScript/relevant lint pass; screenshot reviewed. Physical controllers unverified; P11/publication next.

DBL-109 / P11 technical candidate (2026-10-18): P11 technical quality candidate: actual timed monster attack/kill through XP/level/points, allocation, requirement-checked equipment, shared derived stats and save roundtrip; XP/loot death deduplication and all99 default level budgets. Final npm run check320 tests/80 files, TypeScript/lint/assets/backlog/build and formatting pass.4 Chromium character/persistence scenarios plus3 virtual controller/remap/disconnect cases pass. Balance assumptions documented; no large loot reruns. User quality approval false; CI/Pages and hosted verification pending publication. Broader source parents remain partial.

DBL-109 / P11 publication/visual checkpoint (2026-10-18): P10fcd3af1 and P11 runtime466bf7c pushed; CI39156818075 in progress (browser dependency install last inspected). Full local check320 and7 critical controller/character cases pass. Relevant inventory visual probes exposed2 stale Darwin refs; both reviewed/replaced and2/2 regular comparisons pass. Linux inventory/advanced references remain release follow-up. Public asset still index-DnCJfCbe.js versus progression build index-CVMXKv8V.js/combat-arena-BRv-XqEg.js; no current Pages or hosted progression verification. Stop at soft session budget; quality approval false. Follow-up checkpoint/reference commit intentionally local while CI gathers evidence.

DBL-109 / P11 release complete (2026-10-18): P11 release verified2026-10-18: runtime51a943ac96f845a9f749262436c146ea9244511f; CI39159873168 success,105 Chromium and15 advanced cross-browser cases pass, unchanged Linux inventory comparisons. Pages deployment7159839021 success with matching SHA and index-BJpbzwJa.js. Seven hosted character/allocation/save/reload/migration/virtual-controller checks pass; hosted screenshot reviewed. Existing320 unit evidence reused locally; CI check passed. DBL-109 technically complete; user quality approval remains false. No classes/skill trees; hardware and broader partial parents remain open.

## Authorized World & Exploration scope (2026-10-19)

W1–W5 authorized after technical C13 verification. Thirty sequential scoped increments; original source IDs/dependencies unchanged; broader parents remain partial.

- DBL-362 / W1: World registry and stable area seed identities (completed).
- DBL-363 / W1: Logical terrain object and navigation layer contracts (completed).
- DBL-364 / W1: Spawn and entrance placement validation (planned).
- DBL-365 / W1: Atomic prepared area transition domain (planned).
- DBL-366 / W1: Runtime area lifecycle and minimal two-area prototype (planned).
- DBL-367 / W1: Versioned exploration snapshot and atomic save binding (planned).
- DBL-368 / W2: Reusable authored wilderness modules (completed).
- DBL-369 / W2: Seeded outdoor path and clearing composition (completed).
- DBL-370 / W2: Connected dungeon rooms and corridors (completed).
- DBL-371 / W2: Restricted placement and navigation validation (completed).
- DBL-372 / W2: Bounded generation retries and safe fallback (completed).
- DBL-373 / W2: Representative seed reproducibility integration (completed).
- DBL-374 / W3: Ashen Refuge safe camp environment (completed).
- DBL-375 / W3: Haunted Forest environment and depth integration (completed).
- DBL-376 / W3: Forgotten Graveyard environment (completed).
- DBL-377 / W3: Ancient Crypt environment and passages (completed).
- DBL-378 / W3: Environment asset provenance and detail budgets (completed).
- DBL-379 / W3: Connected environment visual and navigation review (completed).
- DBL-380 / W4: Area-scaled seeded encounter placement (completed).
- DBL-381 / W4: Encounter lifecycle and defeated identity persistence (completed).
- DBL-382 / W4: Area-scaled existing loot and world pickup integration (planned).
- DBL-383 / W4: Seeded containers and atomic one-time rewards (planned).
- DBL-384 / W4: Controller-compatible container and exit interaction (planned).
- DBL-385 / W4: Persistent exploration reveal and minimap markers (planned).
- DBL-386 / W5: Complete camp forest graveyard crypt return flow (planned).
- DBL-387 / W5: Character inventory and world save reload recovery (planned).
- DBL-388 / W5: Three-class keyboard mouse virtual-controller expedition checks (planned).
- DBL-389 / W5: Representative world performance and regression gate (planned).
- DBL-390 / W5: Public expedition publication and hosted verification (planned).
- DBL-391 / W5: World quality evidence and review checkpoint (planned).
