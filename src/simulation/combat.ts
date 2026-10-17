import {
  launchProjectile,
  projectileContact,
  type Projectile,
} from "./projectiles";
import type { Point } from "../world/isometric";
import {
  fromGround,
  segmentWalkable,
  type Navigation,
} from "../world/navigation";
import { createWalker } from "./locomotion";
import { breakpointFrames, type TimelineEvent } from "./combat-timing";
import {
  commandCombat,
  createController,
  inAttackRange,
  stepController,
  type CombatController,
} from "./combat-targeting";
import {
  resolveDamage,
  type Defense,
  type Offense,
  type DamageResult,
} from "./damage";
export const ARENA_NAV: Navigation = {
  boundary: [
    { x: 230, y: 260 },
    { x: 1300, y: 260 },
    { x: 1300, y: 830 },
    { x: 230, y: 830 },
  ],
  obstacles: [],
  clearance: 12,
};
export type Weapon = "melee" | "projectile";
export interface CombatActor {
  id: number;
  name: string;
  kind: "player" | "dummy" | "moving" | "hostile";
  controller: CombatController;
  hp: number;
  maxHp: number;
  offense: Offense;
  defense: Defense;
  weapon: Weapon;
  range: number;
  attackSpeed: number;
  recoveryBonus: number;
  stagger: number;
  knockback: number;
  invulnerableUntil: number;
  reactionGuardUntil: number;
}
export type CombatEvent =
  | {
      tick: number;
      actor: number;
      kind: "phase";
      phase: CombatController["timeline"]["phase"];
    }
  | {
      tick: number;
      actor: number;
      target: number;
      kind: "damage";
      result: DamageResult;
    }
  | {
      tick: number;
      actor: number;
      target: number;
      kind: "whiff" | "death" | "stagger" | "immune" | "launch" | "impact";
    };
export interface CombatWorld {
  projectiles: Projectile[];
  nextProjectile: number;
  tick: number;
  seed: number;
  actors: CombatActor[];
  events: CombatEvent[];
}
export const ATTACK_BREAKPOINTS = [
  { minimum: 0, frames: 12 },
  { minimum: 20, frames: 10 },
  { minimum: 50, frames: 8 },
  { minimum: 90, frames: 6 },
];
export const RECOVERY_BREAKPOINTS = [
  { minimum: 0, frames: 12 },
  { minimum: 25, frames: 9 },
  { minimum: 60, frames: 6 },
];
export function createCombat(seed = 42): CombatWorld {
  const make = (
    id: number,
    name: string,
    kind: CombatActor["kind"],
    x: number,
    y: number,
  ): CombatActor => ({
    id,
    name,
    kind,
    controller: createController(createWalker(fromGround({ x, y }))),
    hp: kind === "player" ? 300 : 160,
    maxHp: kind === "player" ? 300 : 160,
    offense: {
      damage: kind === "player" ? 28 : 12,
      accuracy: 120,
      criticalChance: 0.15,
      criticalMultiplier: 1.75,
    },
    defense: { defense: 8, armor: 15, physicalResistance: 0 },
    weapon: "melee",
    range: 1.05,
    attackSpeed: 0,
    recoveryBonus: 0,
    stagger: 0,
    knockback: 0,
    invulnerableUntil: 0,
    reactionGuardUntil: 0,
  });
  return {
    tick: 0,
    projectiles: [],
    nextProjectile: 0,
    seed: seed >>> 0,
    actors: [
      make(0, "Wanderer", "player", 650, 560),
      make(1, "Ashwood dummy", "dummy", 790, 560),
      make(2, "Patrol dummy", "moving", 880, 420),
      make(3, "Training sentinel", "hostile", 1100, 670),
      make(4, "Armored dummy", "dummy", 1040, 510),
    ],
    events: [],
  };
}
export function actorTargets(
  world: CombatWorld,
  actor: CombatActor,
): { id: number; position: Point; alive: boolean }[] {
  return world.actors
    .filter(
      (a) =>
        a.id !== actor.id && (actor.kind === "player" || a.kind === "player"),
    )
    .map((a) => ({
      id: a.id,
      position: a.controller.walker.position,
      alive: a.hp > 0,
    }));
}
function log(world: CombatWorld, event: CombatEvent): void {
  world.events.push(event);
  if (world.events.length > 256) world.events.shift();
}
function logPhases(
  world: CombatWorld,
  actor: CombatActor,
  events: TimelineEvent[],
): void {
  for (const e of events)
    if (e.kind === "phase")
      log(world, {
        tick: world.tick,
        actor: actor.id,
        kind: "phase",
        phase: e.phase,
      });
}
/** Called only on a strike boundary (or, subsequently, projectile impact). */
export function applyCombatHit(
  world: CombatWorld,
  source: CombatActor,
  target: CombatActor,
  nav: Navigation,
): void {
  if (target.hp <= 0 || source.hp <= 0) return;
  if (world.tick < target.invulnerableUntil) {
    log(world, {
      tick: world.tick,
      actor: source.id,
      target: target.id,
      kind: "immune",
    });
    return;
  }
  const random = () => {
    world.seed = (Math.imul(world.seed, 1664525) + 1013904223) >>> 0;
    return world.seed / 4294967296;
  };
  const result = resolveDamage(source.offense, target.defense, random);
  log(world, {
    tick: world.tick,
    actor: source.id,
    target: target.id,
    kind: "damage",
    result,
  });
  target.hp = Math.max(0, target.hp - result.amount);
  if (target.hp === 0) {
    target.controller = {
      ...commandCombat(target.controller, { kind: "stop" }),
      timeline: { ...target.controller.timeline, phase: "dead", remaining: 0 },
    };
    log(world, {
      tick: world.tick,
      actor: source.id,
      target: target.id,
      kind: "death",
    });
    return;
  }
  target.stagger += result.amount;
  const staggered = target.stagger >= target.maxHp * 0.08;
  if (
    result.amount > 0 &&
    staggered &&
    world.tick >= target.reactionGuardUntil
  ) {
    const duration = breakpointFrames(
      target.recoveryBonus,
      RECOVERY_BREAKPOINTS,
    );
    target.controller = {
      ...target.controller,
      walker: {
        ...target.controller.walker,
        route: [],
        walking: false,
        speed: 0,
        motion: "idle",
        velocity: { x: 0, y: 0 },
      },
      timeline: {
        ...target.controller.timeline,
        phase: "hitstun",
        remaining: duration,
      },
    };
    target.reactionGuardUntil = world.tick + duration + 12;
    target.stagger = 0;
    log(world, {
      tick: world.tick,
      actor: source.id,
      target: target.id,
      kind: "stagger",
    });
    const a = source.controller.walker.position,
      b = target.controller.walker.position,
      d = Math.hypot(b.x - a.x, b.y - a.y);
    if (source.knockback > 0 && d > 0) {
      const next = {
        x: b.x + ((b.x - a.x) / d) * source.knockback,
        y: b.y + ((b.y - a.y) / d) * source.knockback,
      };
      if (segmentWalkable(nav, b, next))
        target.controller = {
          ...target.controller,
          walker: { ...target.controller.walker, position: next },
        };
    }
  }
}
/** Mutates an owned world by exactly one fixed tick; snapshots are plain serializable data. */
export function stepCombat(
  world: CombatWorld,
  nav: Navigation = ARENA_NAV,
  keyboard: Point = { x: 0, y: 0 },
): void {
  world.tick++;
  for (const actor of world.actors) {
    if (actor.hp <= 0) continue;
    if (actor.kind === "hostile" && !actor.controller.attacking)
      actor.controller = commandCombat(actor.controller, {
        kind: "attack",
        target: 0,
        repeat: true,
      });
    if (actor.kind === "moving" && actor.controller.timeline.phase === "idle") {
      const goal = fromGround({
        x: 880 + Math.sin(world.tick / 120) * 80,
        y: 420,
      });
      actor.controller = commandCombat(actor.controller, {
        kind: "move",
        target: goal,
      });
    }
    if (actor.controller.timeline.phase === "idle") {
      const windup = breakpointFrames(actor.attackSpeed, ATTACK_BREAKPOINTS);
      actor.controller = {
        ...actor.controller,
        timeline: {
          ...actor.controller.timeline,
          timing: { windup, active: 2, recovery: windup + 6 },
        },
      };
    }
    const next = stepController(
      actor.controller,
      actorTargets(world, actor),
      nav,
      actor.range,
      "wait",
      breakpointFrames(actor.recoveryBonus, RECOVERY_BREAKPOINTS),
      actor.kind === "player" ? keyboard : { x: 0, y: 0 },
    );
    actor.controller = next.controller;
    logPhases(world, actor, next.events);
    if (next.events.some((e) => e.kind === "strike")) {
      const target = world.actors.find(
        (t) => t.id === actor.controller.locked && t.hp > 0,
      );
      if (
        target &&
        inAttackRange(
          actor.controller.walker.position,
          target.controller.walker.position,
          actor.range,
          nav,
        )
      ) {
        if (actor.weapon === "projectile") {
          world.projectiles.push(
            launchProjectile(
              world.nextProjectile++,
              actor.id,
              actor.controller.walker.position,
              target.controller.walker.position,
            ),
          );
          log(world, {
            tick: world.tick,
            actor: actor.id,
            target: target.id,
            kind: "launch",
          });
        } else applyCombatHit(world, actor, target, nav);
      } else if (target)
        log(world, {
          tick: world.tick,
          actor: actor.id,
          target: target.id,
          kind: "whiff",
        });
    }
  }
  world.projectiles = world.projectiles.filter((projectile) => {
    const source = world.actors.find((a) => a.id === projectile.source);
    if (!source || source.hp <= 0 || --projectile.remaining <= 0) return false;
    const start = projectile.position,
      end = {
        x: start.x + projectile.velocity.x,
        y: start.y + projectile.velocity.y,
      };
    if (!segmentWalkable(nav, start, end)) return false;
    let nearest = Infinity,
      hit: CombatActor | undefined;
    for (const target of world.actors) {
      if (
        target.hp <= 0 ||
        target.id === source.id ||
        (source.kind !== "player" && target.kind !== "player")
      )
        continue;
      const t = projectileContact(
        start,
        end,
        target.controller.walker.position,
      );
      if (t !== null && t < nearest) {
        nearest = t;
        hit = target;
      }
    }
    if (hit) {
      log(world, {
        tick: world.tick,
        actor: source.id,
        target: hit.id,
        kind: "impact",
      });
      applyCombatHit(world, source, hit, nav);
      return false;
    }
    projectile.position = end;
    return true;
  });
}
