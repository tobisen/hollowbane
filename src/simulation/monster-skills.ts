import type { MonsterBrain } from "./monsters";
import { activeSkill, requestSkill, type SkillRuntime } from "./skills";
import { inAttackRange } from "./combat-targeting";
import type { Navigation } from "../world/navigation";
/** Replaces an AI's already-authorized attack request; never reads player input. */
export function queueMonsterSkills(
  r: SkillRuntime,
  brains: readonly MonsterBrain[],
  nav: Navigation,
): void {
  for (const brain of brains) {
    const id =
      brain.role === "caster"
        ? "ember-lance"
        : brain.role === "support"
          ? "oath-echo"
          : brain.role === "flanker"
            ? "briar-edge"
            : null;
    if (!id || brain.state !== "attack") continue;
    const a = r.combat.actors.find((a) => a.id === brain.id),
      u = r.users.find((u) => u.actor === brain.id),
      s = activeSkill(r, id),
      target = r.combat.actors.find((a) => a.id === brain.threat && a.hp > 0);
    if (
      !a ||
      !u ||
      !s ||
      !target ||
      a.hp <= 0 ||
      a.controller.timeline.phase !== "idle" ||
      !a.controller.queuedAttack ||
      u.cast ||
      u.mana < s.mana ||
      (u.cooldowns[id] ?? 0) > r.combat.tick + 1 ||
      !inAttackRange(
        a.controller.walker.position,
        target.controller.walker.position,
        s.range,
        nav,
      )
    )
      continue;
    u.castSpeed = a.attackSpeed;
    requestSkill(r, {
      actor: a.id,
      skill: id,
      target: target.id,
      direction: {
        x: target.controller.walker.position.x - a.controller.walker.position.x,
        y: target.controller.walker.position.y - a.controller.walker.position.y,
      },
    });
  }
}
