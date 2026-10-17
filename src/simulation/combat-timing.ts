/** Pure combat timeline. One step is one existing 60 Hz simulation tick. */
export type CombatPhase =
  "idle" | "windup" | "active" | "recovery" | "hitstun" | "dead";
export interface Timing {
  windup: number;
  active: number;
  recovery: number;
}
export interface Breakpoint {
  minimum: number;
  frames: number;
}
export interface AttackTimeline {
  phase: CombatPhase;
  remaining: number;
  timing: Timing;
  /** Once per accepted attack, including interrupted attacks. */
  sequence: number;
}
export type CombatCommand = "wait" | "attack" | "move" | "hit" | "kill";
export type TimelineEvent =
  | { kind: "phase"; phase: CombatPhase; sequence: number }
  | { kind: "strike"; sequence: number };

function frames(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error("Timing must contain positive integer frames");
}

/** Explicit thresholds, independently authored; no reference-game formula. */
export function breakpointFrames(
  modifier: number,
  table: readonly Breakpoint[],
): number {
  if (!Number.isFinite(modifier) || table.length === 0)
    throw new Error("Invalid breakpoint input");
  let previous = -Infinity;
  let selected: number | undefined;
  for (const entry of table) {
    frames(entry.frames);
    if (!Number.isFinite(entry.minimum) || entry.minimum <= previous)
      throw new Error(
        "Breakpoint thresholds must be finite and strictly increasing",
      );
    previous = entry.minimum;
    if (modifier >= entry.minimum) selected = entry.frames;
  }
  if (selected === undefined)
    throw new Error("Modifier below first breakpoint");
  return selected;
}

export function createTimeline(timing: Timing): AttackTimeline {
  frames(timing.windup);
  frames(timing.active);
  frames(timing.recovery);
  return { phase: "idle", remaining: 0, timing: { ...timing }, sequence: 0 };
}

/** Commands apply at tick start; transitions at tick end. Attack entry consumes
 * its first windup tick. Hit recovery begins on the hit tick. Move cannot cancel
 * commitment. A strike event is a hit-resolution opportunity, never damage. */
export function stepTimeline(
  state: AttackTimeline,
  command: CombatCommand,
  hitRecovery = 6,
): {
  state: AttackTimeline;
  events: TimelineEvent[];
  movementAllowed: boolean;
} {
  frames(hitRecovery);
  const next = { ...state, timing: { ...state.timing } };
  const events: TimelineEvent[] = [];
  const enter = (phase: CombatPhase, remaining: number): void => {
    next.phase = phase;
    next.remaining = remaining;
    events.push({ kind: "phase", phase, sequence: next.sequence });
    if (phase === "active")
      events.push({ kind: "strike", sequence: next.sequence });
  };
  if (next.phase !== "dead") {
    if (command === "kill") enter("dead", 0);
    else if (command === "hit" && next.phase !== "hitstun")
      enter("hitstun", hitRecovery);
    else if (command === "attack" && next.phase === "idle") {
      next.sequence++;
      enter("windup", next.timing.windup);
    }
    if (next.remaining > 0 && --next.remaining === 0) {
      switch (next.phase) {
        case "windup":
          enter("active", next.timing.active);
          break;
        case "active":
          enter("recovery", next.timing.recovery);
          break;
        case "recovery":
        case "hitstun":
          enter("idle", 0);
          break;
      }
    }
  }
  return { state: next, events, movementAllowed: next.phase === "idle" };
}
