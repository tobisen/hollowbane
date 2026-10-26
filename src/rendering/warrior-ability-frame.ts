import type { AttackTimeline } from "../simulation/combat-timing";
import type { Cast } from "../simulation/skills";
import { warriorAttackFrame } from "./warrior-attack-frame";

export type WarriorAbility = "iron-fan" | "oath-echo";

/** The real cast owns timing and execution. This selector only reads its pose.
 * A stale cast must never disguise a weapon attack, interruption or death.
 */
export function warriorAbilityFrame(
  timeline: Readonly<AttackTimeline>,
  cast: Readonly<Cast> | null,
): { ability: WarriorAbility; frame: number } | null {
  if (
    !cast ||
    cast.sequence !== timeline.sequence ||
    (cast.skill !== "iron-fan" && cast.skill !== "oath-echo")
  )
    return null;
  const frame = warriorAttackFrame(timeline, "primary");
  if (frame === null) return null;
  return { ability: cast.skill, frame };
}
