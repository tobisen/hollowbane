import { meleeSlots, rallyPacks } from "./monster-pack";
import { segmentWalkable, type Navigation } from "../world/navigation";
import { worldToScreen, type Point } from "../world/isometric";
import {
  ATTACK_BREAKPOINTS,
  type CombatActor,
  type CombatWorld,
} from "./combat";
import { commandCombat, inAttackRange } from "./combat-targeting";
import { breakpointFrames } from "./combat-timing";
import {
  distance,
  perceive,
  planMonsterPath,
  type PathBudget,
} from "./monster-perception";
import {
  MONSTER_PROFILES,
  type MonsterBrain,
  type MonsterState,
} from "./monsters";
const TRANSITIONS: Readonly<Record<MonsterState, readonly MonsterState[]>> = {
  idle: ["patrol", "alert", "return", "dead"],
  patrol: ["idle", "alert", "return", "dead"],
  alert: ["chase", "attack", "retreat", "return", "dead"],
  chase: ["alert", "attack", "retreat", "return", "dead"],
  attack: ["chase", "retreat", "return", "dead"],
  retreat: ["chase", "attack", "return", "dead"],
  return: ["idle", "dead"],
  dead: [],
};
export function transitionMonster(
  brain: MonsterBrain,
  state: MonsterState,
  tick: number,
): void {
  if (brain.state === state) return;
  if (!TRANSITIONS[brain.state].includes(state))
    throw new Error(`Invalid AI transition ${brain.state} -> ${state}`);
  brain.state = state;
  brain.since = tick;
  brain.transitions++;
}
function stop(actor: CombatActor): void {
  actor.controller = commandCombat(actor.controller, { kind: "stop" });
}
function away(actor: CombatActor, target: Point, length: number): Point {
  const p = actor.controller.walker.position,
    d = distance(p, target);
  return {
    x: p.x + (d ? (p.x - target.x) / d : actor.id % 2 ? 1 : -1) * length,
    y: p.y + (d ? (p.y - target.y) / d : 0) * length,
  };
}
export interface AIWork {
  pathRequests: number;
  decisions: number;
}
/** Fixed-tick adapter: issues existing combat commands, never applies damage itself. */
export function stepMonsterAI(
  world: CombatWorld,
  brains: MonsterBrain[],
  nav: Navigation,
  maxPaths = 2,
  attackLimit = Infinity,
): AIWork {
  const budget: PathBudget = { remaining: maxPaths, requests: 0 };
  let decisions = 0;
  if (world.tick % 6 === 0) rallyPacks(world, brains, nav);
  for (const brain of brains) {
    const actor = world.actors.find((a) => a.id === brain.id);
    if (!actor) continue;
    if (actor.hp <= 0) {
      transitionMonster(brain, "dead", world.tick);
      continue;
    }
    if (world.tick < brain.nextThink) continue;
    brain.nextThink = world.tick + 6 + (brain.id % 3);
    decisions++;
    const profile = MONSTER_PROFILES[brain.role];
    const sensed = perceive(world, actor, brain, nav);
    if (sensed.damaged && actor.hp / actor.maxHp <= profile.retreatAt)
      brain.retreatUntil = world.tick + 90;
    // Windup, active, recovery and hitstun remain owned by the combat timeline.
    if (actor.controller.timeline.phase !== "idle") continue;
    const p = actor.controller.walker.position;
    if (
      brain.state === "return" ||
      sensed.leashed ||
      (!sensed.target && brain.state !== "idle" && brain.state !== "patrol")
    ) {
      transitionMonster(brain, "return", world.tick);
      brain.threat = null;
      brain.lastSeen = null;
      if (distance(p, brain.home) < 0.3) {
        stop(actor);
        brain.goal = null;
        transitionMonster(brain, "idle", world.tick);
      } else planMonsterPath(actor, brain, nav, brain.home, world.tick, budget);
      continue;
    }
    if (!sensed.target) {
      if (
        brain.state === "idle" &&
        world.tick - brain.since > 60 + (brain.id % 40)
      )
        transitionMonster(brain, "patrol", world.tick);
      if (brain.state === "patrol") {
        if (brain.goal && distance(p, brain.goal) < 0.25) {
          brain.patrolIndex++;
          brain.goal = null;
          transitionMonster(brain, "idle", world.tick);
          stop(actor);
        } else {
          const side = (brain.patrolIndex + brain.id) % 2 ? 1 : -1;
          planMonsterPath(
            actor,
            brain,
            nav,
            { x: brain.home.x + side * 0.7, y: brain.home.y - side * 0.4 },
            world.tick,
            budget,
          );
        }
      }
      continue;
    }
    if (brain.state === "idle" || brain.state === "patrol") {
      transitionMonster(brain, "alert", world.tick);
      stop(actor);
    }
    if (brain.state === "alert" && world.tick - brain.since < profile.alert)
      continue;
    const target = sensed.target;
    const goal = brain.lastSeen!;
    const d = distance(p, goal);
    const retreat =
      sensed.visible &&
      ((profile.projectile && d < profile.preferred - 0.7) ||
        world.tick < brain.retreatUntil);
    if (
      retreat ||
      (brain.state === "retreat" && world.tick - brain.since < 45)
    ) {
      if (brain.state !== "retreat") stop(actor);
      transitionMonster(brain, "retreat", world.tick);
      const options = [
        away(actor, goal, 1.5),
        { x: p.x + 1, y: p.y - 1 },
        { x: p.x - 1, y: p.y + 1 },
      ];
      const escape = options.find((q) => segmentWalkable(nav, p, q));
      if (escape)
        planMonsterPath(actor, brain, nav, escape, world.tick, budget);
      continue;
    }
    if (
      sensed.visible &&
      (profile.projectile || meleeSlots(world, target.id, actor.id) < 3) &&
      inAttackRange(
        p,
        target.controller.walker.position,
        actor.range - 0.15,
        nav,
      )
    ) {
      transitionMonster(brain, "attack", world.tick);
      stop(actor);
      if (world.tick >= brain.nextAttack) {
        const committed = Number.isFinite(attackLimit)
          ? world.actors.filter(
              (a) =>
                a.id !== actor.id &&
                a.kind !== "player" &&
                a.hp > 0 &&
                (a.controller.queuedAttack ||
                  ["windup", "active", "recovery"].includes(
                    a.controller.timeline.phase,
                  ) ||
                  world.projectiles.some((p) => p.source === a.id)),
            ).length
          : 0;
        if (committed >= attackLimit) continue;
        actor.controller = commandCombat(actor.controller, {
          kind: "attack",
          target: target.id,
          repeat: false,
        });
        const windup = breakpointFrames(actor.attackSpeed, ATTACK_BREAKPOINTS);
        brain.nextAttack =
          world.tick + windup * 2 + 8 + profile.cooldown + (brain.id % 7);
      }
    } else {
      transitionMonster(brain, "chase", world.tick);
      if (actor.controller.attacking) stop(actor);
      const inset = sensed.visible
        ? Math.min(profile.preferred, actor.range - 0.2)
        : 0;
      const dx = goal.x - p.x,
        dy = goal.y - p.y;
      const flank =
        brain.role === "flanker" && d > 2 ? (brain.id % 2 ? 0.8 : -0.8) : 0;
      planMonsterPath(
        actor,
        brain,
        nav,
        {
          x: goal.x - (dx / (d || 1)) * inset - (dy / (d || 1)) * flank,
          y: goal.y - (dy / (d || 1)) * inset + (dx / (d || 1)) * flank,
        },
        world.tick,
        budget,
      );
    }
  }
  return { pathRequests: budget.requests, decisions };
}
/** Convert world separation to the established screen-space movement convention. */
export function screenVector(vector: Point): Point {
  return worldToScreen(vector);
}
