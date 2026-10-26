import type { AttackTimeline } from "../simulation/combat-timing";

export type WarriorAttack = "primary" | "secondary";

/** Presentation only: the active-entry tick is already the real strike tick.
 * Hold the impact pose throughout active; never create a second strike clock.
 * Null yields to movement, reactions or death. No simulation state is changed.
 */
export function warriorAttackFrame(
  timeline: Readonly<AttackTimeline>,
  attack: WarriorAttack,
): number | null {
  const start = attack === "primary" ? 0 : 12;
  switch (timeline.phase) {
    case "windup":
      return (
        start +
        Math.min(
          4,
          Math.floor(
            ((timeline.timing.windup - timeline.remaining) /
              timeline.timing.windup) *
              5,
          ),
        )
      );
    case "active":
      return start + 5;
    case "recovery":
      return (
        start +
        6 +
        Math.min(
          5,
          Math.floor(
            ((timeline.timing.recovery - timeline.remaining) /
              timeline.timing.recovery) *
              6,
          ),
        )
      );
    default:
      return null;
  }
}
