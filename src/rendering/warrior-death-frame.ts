import type { AttackTimeline } from "../simulation/combat-timing";

/** Existing 30-tick presentation fall, anchored to the real death event.
 * Hold the last pose forever; no callbacks, despawn, resurrection or new rules.
 * A corpse without an observed entry uses its settled pose, never replays.
 */
export function warriorDeathFrame(
  timeline: Readonly<AttackTimeline>,
  tick: number,
  deathAt: number | null,
): number | null {
  if (timeline.phase !== "dead") return null;
  if (deathAt === null) return 15;
  return Math.min(15, Math.floor((Math.max(0, tick - deathAt) / 30) * 16));
}
