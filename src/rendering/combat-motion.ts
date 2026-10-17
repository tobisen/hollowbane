/** Pure presentation model. Combat ticks/events are the only animation clock. */
import type { CombatActor, CombatEvent } from "../simulation/combat";
import { worldToScreen, type Point } from "../world/isometric";
export interface MotionCue {
  strikeAt: number;
  hitAt: number;
  deathAt: number | null;
  away: Point;
}
export type MotionCues = Record<number, MotionCue>;
export interface CombatPose {
  x: number;
  y: number;
  angle: number;
  scaleY: number;
  alpha: number;
  impact: number;
  recoil: number;
  fall: number;
}
export function recordMotion(
  cues: MotionCues,
  actors: readonly CombatActor[],
  events: readonly CombatEvent[],
  tick: number,
): void {
  const ids = new Set(actors.map((a) => a.id));
  for (const id of Object.keys(cues))
    if (!ids.has(Number(id))) delete cues[Number(id)];
  const cue = (id: number): MotionCue =>
    (cues[id] ??= {
      strikeAt: -1000,
      hitAt: -1000,
      deathAt: null,
      away: { x: 0, y: 1 },
    });
  for (const event of events) {
    if (event.tick !== tick) continue;
    if (event.kind === "phase" && event.phase === "active")
      cue(event.actor).strikeAt = tick;
    if (event.kind === "damage" && event.result.amount > 0) {
      const a = actors.find((a) => a.id === event.actor),
        b = actors.find((a) => a.id === event.target);
      if (!a || !b) continue;
      const v = worldToScreen({
          x: b.controller.walker.position.x - a.controller.walker.position.x,
          y: b.controller.walker.position.y - a.controller.walker.position.y,
        }),
        d = Math.hypot(v.x, v.y);
      Object.assign(cue(b.id), {
        hitAt: tick,
        away: { x: v.x / Math.max(d, 1), y: v.y / Math.max(d, 1) },
      });
    }
    if (event.kind === "death") cue(event.target).deathAt = tick;
  }
}
export function combatPose(
  actor: CombatActor,
  cue: MotionCue | undefined,
  tick: number,
): CombatPose {
  const t = actor.controller.timeline,
    theta = ((actor.controller.walker.direction + 2) * Math.PI) / 4,
    fx = Math.cos(theta),
    fy = Math.sin(theta),
    impact = cue ? Math.max(0, 1 - (tick - cue.strikeAt) / 6) : 0;
  const anticipation =
    t.phase === "windup" ? 1 - t.remaining / t.timing.windup : 0;
  const recovery = t.phase === "recovery" ? t.remaining / t.timing.recovery : 0;
  const recoil = cue ? Math.max(0, 1 - (tick - cue.hitAt) / 10) : 0;
  const fall =
    actor.hp <= 0
      ? Math.min(1, Math.max(0, (tick - (cue?.deathAt ?? tick)) / 30))
      : 0;
  const ease = 1 - (1 - fall) ** 3,
    away = cue?.away ?? { x: 0, y: 1 };
  return {
    x:
      fx * (impact * 5 - anticipation * 3 + recovery) +
      away.x * (recoil * 5 + ease * 9),
    y: fy * (impact * 3 - anticipation * 2) + away.y * recoil * 3 + ease * 3,
    angle:
      actor.hp <= 0
        ? (away.x < 0 ? -1 : 1) * 78 * ease
        : recoil * away.x * 11 + fx * (impact * 9 - anticipation * 7),
    scaleY: 1 - ease * 0.63,
    alpha: 1 - ease * 0.55,
    impact,
    recoil,
    fall,
  };
}
