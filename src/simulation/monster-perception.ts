import type { Point } from "../world/isometric";
import {
  findPath,
  segmentWalkable,
  type Navigation,
} from "../world/navigation";
import type { CombatActor, CombatWorld } from "./combat";
import { stopWalker } from "./locomotion";
import { MONSTER_PROFILES, type MonsterBrain } from "./monsters";
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
export interface Perception {
  target: CombatActor | null;
  visible: boolean;
  remembered: boolean;
  leashed: boolean;
  damaged: boolean;
}
/** Perception reads positions and resolved damage only, never input intents. */
export function perceive(
  world: CombatWorld,
  actor: CombatActor,
  brain: MonsterBrain,
  nav: Navigation,
): Perception {
  const p = MONSTER_PROFILES[brain.role];
  const damaged = actor.hp < brain.previousHp;
  brain.previousHp = actor.hp;
  const candidates = world.actors.filter(
    (a) => a.kind === "player" && a.hp > 0,
  );
  const attacker = damaged
    ? [...world.events]
        .reverse()
        .find(
          (e) =>
            e.kind === "damage" &&
            e.target === actor.id &&
            e.tick >= world.tick - 6,
        )
    : undefined;
  let target =
    candidates.find((a) => a.id === (attacker?.actor ?? brain.threat)) ??
    candidates.find(
      (a) =>
        distance(
          a.controller.walker.position,
          actor.controller.walker.position,
        ) <= p.detection &&
        segmentWalkable(
          nav,
          actor.controller.walker.position,
          a.controller.walker.position,
        ),
    ) ??
    null;
  const leashed =
    distance(actor.controller.walker.position, brain.home) > p.leash ||
    (target !== null &&
      distance(target.controller.walker.position, brain.home) > p.leash + 2);
  if (leashed) target = null;
  const visible =
    target !== null &&
    distance(
      actor.controller.walker.position,
      target.controller.walker.position,
    ) <=
      p.detection + (brain.threat === target.id ? 1 : 0) &&
    segmentWalkable(
      nav,
      actor.controller.walker.position,
      target.controller.walker.position,
    );
  if (target && (visible || (damaged && attacker?.actor === target.id))) {
    brain.threat = target.id;
    brain.lastSeen = { ...target.controller.walker.position };
    brain.seenAt = world.tick;
  }
  if (!target || world.tick - brain.seenAt > p.memory) {
    brain.threat = null;
    brain.lastSeen = null;
    target = null;
  }
  return {
    target,
    visible,
    remembered: target !== null && !visible,
    leashed,
    damaged,
  };
}
export interface PathBudget {
  remaining: number;
  requests: number;
}
/** Shared per-tick budget; cached goals plus a retry interval avoid oscillation/storms. */
export function planMonsterPath(
  actor: CombatActor,
  brain: MonsterBrain,
  nav: Navigation,
  goal: Point,
  tick: number,
  budget: PathBudget,
): boolean {
  if (
    tick < brain.nextPath ||
    budget.remaining <= 0 ||
    distance(actor.controller.walker.position, goal) < 0.2
  )
    return false;
  if (
    brain.goal &&
    distance(brain.goal, goal) < 0.4 &&
    actor.controller.walker.route.length
  )
    return false;
  budget.remaining--;
  budget.requests++;
  brain.pathRequests++;
  brain.nextPath = tick + 30 + (brain.id % 6);
  brain.goal = { ...goal };
  actor.controller.walker = {
    ...stopWalker(actor.controller.walker),
    route: findPath(nav, actor.controller.walker.position, goal),
  };
  actor.controller.attacking = false;
  actor.controller.queuedAttack = false;
  actor.controller.repeat = false;
  actor.controller.pendingMove = null;
  return true;
}
