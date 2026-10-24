import type { CombatWorld } from "./combat";
import type { SkillRuntime } from "./skills";
import type { AreaId } from "./world";

/** Opening-biome tuning only; identities, reward tiers and RNG streams stay pinned. */
export const OPENING_BALANCE = Object.freeze({
  damage: 0.65,
  simultaneousAttacks: 2,
  recoveryDelay: 300,
  safeDistance: 9,
  healthPerSecond: 3,
  manaPerSecond: 6,
});

/** Owned fixed-tick state, reset on danger/area change; never persisted as rewards. */
export class OpeningRecovery {
  private safeTicks = 0;
  step(
    world: CombatWorld,
    skills: SkillRuntime | undefined,
    area: AreaId,
  ): void {
    const player = world.actors[0]!;
    const safe =
      (area === "ashen-refuge" || area === "haunted-forest") &&
      player.hp > 0 &&
      player.controller.timeline.phase === "idle" &&
      !player.controller.attacking &&
      !world.projectiles.length &&
      !skills?.effects.bolts.length &&
      !skills?.effects.statuses.some((s) => s.actor === player.id) &&
      !world.events.some(
        (e) =>
          e.tick === world.tick &&
          e.kind === "damage" &&
          e.target === player.id,
      ) &&
      world.actors.every(
        (a) =>
          a.id === player.id ||
          a.hp <= 0 ||
          Math.hypot(
            a.controller.walker.position.x -
              player.controller.walker.position.x,
            a.controller.walker.position.y -
              player.controller.walker.position.y,
          ) >= OPENING_BALANCE.safeDistance,
      );
    this.safeTicks = safe ? this.safeTicks + 1 : 0;
    if (this.safeTicks <= OPENING_BALANCE.recoveryDelay) return;
    player.hp = Math.min(
      player.maxHp,
      player.hp + OPENING_BALANCE.healthPerSecond / 60,
    );
    const user = skills?.users.find((u) => u.actor === player.id);
    if (user)
      user.mana = Math.min(
        user.maxMana,
        user.mana + OPENING_BALANCE.manaPerSecond / 60,
      );
  }
}
