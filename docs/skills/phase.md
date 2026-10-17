# Skills & Spell Systems

User G4 approval authorizes this delivery, mapped to original topic 10. DBL-291–296 split source requirements without completing broader parents.

## DBL-291

Six active original names: Ember Lance (fire projectile), Rime Ring (cold nova), Storm Thread (lightning chain), Iron Fan (melee cone), Oath Echo (area power buff), Briar Edge (poison melee). Still Well is a passive mana regeneration definition. Data rejects duplicates, unsafe timing/ranges/numbers/elements/status policy. No external assets added. Full check passes 137 unit tests. Renderer unchanged, browser checks deferred to playable integration.

Physical controller metadata/DBL-282–286, provisional monster art, native/full-detail/Firefox performance and GitHub synchronization remain open. No skill trees or item systems.

## DBL-292

Optional combat hooks reuse the original controller timeline; legacy callers have no skill runtime. Costs/cooldowns start at accepted tick, interruption does not refund; effects occur once at active boundary. Movement cannot cancel commitment. Passive mana regeneration uses simulation ticks. Discrete cast thresholds use authored scaling; no reference-game formula. Four execution tests cover timing, duplicate commands, cost/cooldown/target rejection, movement commitment, hitstun and replay. Full check: 141 tests.

## DBL-293

Elements reuse combat mitigation/reactions/death, armor applies only to physical damage. Elemental spells and poison use guaranteed hit with no critical; physical abilities retain accuracy/critical. Resistance cap remains configurable (-100% to 75% default); elemental tests cover vulnerability/caps. Bolts use swept collision and walls; area/chain selection uses stable distance then ID and LOS. Slow/power never permanently mutate base stats; poison refresh keeps next interval, six pulses including duration boundary. Strongest rejects weaker refresh; refresh replaces magnitude/duration. Buff applies to nearby same-faction actors including self. Source death cancels bolts and further poison pulses, consistent with existing projectile policy. No cleanse/immunity/absorb library is claimed; original parents remain partial. Nine new tests; full check 150 tests. Initial projectile fixture aimed tangentially; corrected its target placement to the intended centerline.
