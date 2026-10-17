# Skills & Spell Systems

User G4 approval authorizes this delivery, mapped to original topic 10. DBL-291–296 split source requirements without completing broader parents.

## DBL-291

Six active original names: Ember Lance (fire projectile), Rime Ring (cold nova), Storm Thread (lightning chain), Iron Fan (melee cone), Oath Echo (area power buff), Briar Edge (poison melee). Still Well is a passive mana regeneration definition. Data rejects duplicates, unsafe timing/ranges/numbers/elements/status policy. No external assets added. Full check passes 137 unit tests. Renderer unchanged, browser checks deferred to playable integration.

Physical controller metadata/DBL-282–286, provisional monster art, native/full-detail/Firefox performance and GitHub synchronization remain open. No skill trees or item systems.

## DBL-292

Optional combat hooks reuse the original controller timeline; legacy callers have no skill runtime. Costs/cooldowns start at accepted tick, interruption does not refund; effects occur once at active boundary. Movement cannot cancel commitment. Passive mana regeneration uses simulation ticks. Discrete cast thresholds use authored scaling; no reference-game formula. Four execution tests cover timing, duplicate commands, cost/cooldown/target rejection, movement commitment, hitstun and replay. Full check: 141 tests.

## DBL-293

Elements reuse combat mitigation/reactions/death, armor applies only to physical damage. Elemental spells and poison use guaranteed hit with no critical; physical abilities retain accuracy/critical. Resistance cap remains configurable (-100% to 75% default); elemental tests cover vulnerability/caps. Bolts use swept collision and walls; area/chain selection uses stable distance then ID and LOS. Slow/power never permanently mutate base stats; poison refresh keeps next interval, six pulses including duration boundary. Strongest rejects weaker refresh; refresh replaces magnitude/duration. Buff applies to nearby same-faction actors including self. Source death cancels bolts and further poison pulses, consistent with existing projectile policy. No cleanse/immunity/absorb library is claimed; original parents remain partial. Nine new tests; full check 150 tests. Initial projectile fixture aimed tangentially; corrected its target placement to the intended centerline.

## DBL-294

The Kindled Circle (`?skills=1`; add `&monsters=1` for encounters) preserves the legacy combat arena. Six semantic slots: primary/secondary/skill1–4; keyboard X/Q/1–4; controller prompts use actual remapped bindings. D-pad left/right selects, interact casts selected, right stick aims independently and target lock selects. Press only, no hold-repeat; existing recovery rejects early follow-up. Mouse right-click casts selected; left click retains movement/basic attack. Area effects are original procedural Graphics geometry, no borrowed assets/shaders or extra textures. Renderer consumes deterministic events. Existing wanderer casts use provisional windup/strike/recovery transforms. Costs/cooldowns/status messages and input latency are observable. Skill CPU metric explicitly includes combat tick cost. 151 unit/full check, five Chromium and eight Firefox/WebKit scenarios pass; visual baseline and unmasked capture reviewed. The mouse trajectory test caught body-hover aiming above ground center; corrected selected-target aim. Physical hardware remains unverified.

## DBL-295

AI integration only replaces an already-authorized queued attack while idle: caster Ember Lance, support Oath Echo, flanker Briar Edge. Threat/LOS/range/resources/cooldowns are checked, original AI decision cadence/path budget preserved, and unavailable skills fall back to normal combat. The adapter reads no player input. Encounter actor removal prunes ability owners/base stats; new owners synchronize on the next tick. Three unit tests cover deterministic 600-tick replay, fallback and lifecycle; full check 154 tests. Browser live encounter verifies caster and support effects through shared engine. Legacy monster scene remains the approved baseline; shared skills enabled only with skills query.

## DBL-296

Final full check: 161 tests, strict typecheck/lint/assets/backlog/build and format pass. Full Chromium regression 58/58, final skill Firefox/WebKit 12/12; all six playable effects exercised across keyboard/mouse, plus virtual Xbox/PlayStation primary/selection/independent aim. Original snapshots retain their tolerances; new skill baseline and unmasked screenshot reviewed. Cast edges 24/25, 59/60, 99/100 verified; physical abilities use existing attack-speed breakpoints, elemental abilities use separate cast-speed thresholds. The first local full run passed 57/58 but a dist rebuild during navigation caused one blank reload; repeated full suite against an immutable build passed 58/58 with no fixture or tolerance changes. Performance/final publication split to DBL-297–298 to keep evidence tasks focused.

## DBL-297 measurement checkpoint

Benchmark scripts separate pure simulation, request-to-start HUD timing and injected button-to-observed-start timing. Initial 30-enemy sample lost one target to real player fire and is preliminary, not constant-count evidence. Explicit `?durable=1` sets enemy HP/maxHP to 100000 for measurements and labels the header DURABLE TARGET BENCHMARK; it does not grant immunity or change damage/resistances. Both baseline and skills use the same fixture. Player uses existing immortal option; high target HP reduces proportional stagger/retreat, an explicit workload limit. Full check 161 tests; dedicated fixture and unchanged normal visual baseline pass. No normal-play stats changed.

### DBL-296 CI platform correction

CI runs 39034032926 and 39034430507 passed all 56/57 behavioral scenarios respectively but failed the new full-page skill screenshot by ~25000 pixels. Public actual/expected/diff were downloaded read-only via nightly.link and visually inspected: differences are system-font metrics in title, labels, buttons and panel text; world geometry matches. The existing combat snapshot already separates Darwin/Linux. Apply the same pattern only to the new skill reference, using the inspected CI actual as Linux baseline and retained local reference as Darwin. Keep the 2% tolerance, masks and all pre-existing baselines unchanged. No functional or visual product change. Windows screenshot remains unverified.
