import type { AttackTimeline } from "../simulation/combat-timing";

export interface WarriorHitCue {
  readonly duration: number;
  readonly remaining: number;
}

/** Observe every simulation step. Repeated guarded damage cannot restart hitstun.
 * Capture the actual remaining duration at entry, including actor-order effects.
 */
export function observeWarriorHit(
  previous: WarriorHitCue | null,
  timeline: Readonly<AttackTimeline>,
): WarriorHitCue | null {
  if (timeline.phase !== "hitstun") return null;
  return {
    duration:
      !previous || timeline.remaining > previous.remaining
        ? timeline.remaining
        : previous.duration,
    remaining: timeline.remaining,
  };
}

/** Six presentation poses fit the real hitstun; no independent stun clock. */
export function warriorHitFrame(
  timeline: Readonly<AttackTimeline>,
  cue: WarriorHitCue | null,
): number | null {
  if (timeline.phase !== "hitstun" || !cue) return null;
  return Math.min(
    5,
    Math.max(
      0,
      Math.floor(
        ((cue.duration - timeline.remaining) / Math.max(1, cue.duration - 1)) *
          5,
      ),
    ),
  );
}
