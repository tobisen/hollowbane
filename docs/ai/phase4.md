# Phase 4 Monster AI

User approved G2.5 and authorized Monster AI through quality review. Preserve Phaser 4.2.1, combat timing/damage, controller and mouse/keyboard. Delivery Phase 4 maps to original topic 08/09 without renumbering the master roadmap. Original DBL-058 depends on the full spell-chain DBL-057: scoped slices instead depend on already completed combat/controller increments. No spell completion or broad parent completion is implied.

Sequential scope: DBL-275 model, 276 perception/navigation, 277 behaviors/archetypes, 278 pack/separation, 279 lifecycle/champion, 280 playable diagnostics, 281 browser/performance quality gate. No loot, inventory, skill trees or campaign. Physical Xbox/PlayStation/vibration/disconnect/latency checks remain planned DBL-282–286.

## DBL-275

Deterministic serializable monster/brain models and six role profiles, seeded staggered think schedules, champion stat foundation and existing movement configuration extension. No default combat behavior changed. Full check/format passes: 117 tests. G2.5 approval recorded; twelve scoped and hardware-follow-up records preserve all original IDs/dependencies.

## DBL-276

Perception uses resolved positions/damage with conservative obstacle line of sight, last-seen threat memory, dead-target clearing and home leash. Shared per-tick path budget, cached goals and 30+ tick retry cooldown bound navigation requests. Three targeted tests and full check pass: 120 tests.

## DBL-277

Explicit validated idle/patrol/alert/chase/attack/retreat/return/dead transitions, staggered decisions, six distinct profiles, flanking approach and ranged retreat. Existing combat commands retain attack/recovery/hitstun commitment and projectile strike boundaries; caster/support currently use physical projectiles (no new spell system). Four behavior tests cover deterministic replay, actual projectile launches, return/death and interruption ownership. Full check/format: 124 tests.

## DBL-278

Pack alerts require an actually visible live threat and a same-pack neighbor with unobstructed communication; support heralds rally a wider radius. At most three committed melee attackers per target, with remaining actors approaching via existing navigation. Deterministic two-pass separation preserves player position and attack/hitstun commitment, checks swept obstacle clearance, and excludes corpses. Two pack/crowd tests plus behavior suite pass; full check: 126 tests.

## DBL-279

Seeded encounter composition supports 1–50 monsters with bounded safe-spawn searches, monotonically increasing IDs, champion stat/label foundation and obstacle geometry. Death/corpse expiry uses simulation ticks; despawn clears stale selection/projectiles without cancelling committed attack timing. Deterministic 5/10/20/30/50-enemy replay/obstacle tests, corpse/identity and invalid spawn tests pass. Full check/format: 129 tests. Corpses have no loot, resurrection or inventory behavior.
