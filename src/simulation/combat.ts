import { classArmor, classAccuracy, classSynergy } from "./class-abilities";
import {
  createMonsterExperience,
  consumeMonsterDeathXp,
  type MonsterExperience,
} from "./monster-experience";
import type { MonsterRole } from "./monsters";
import type { ItemEffectState } from "./item-effects";
import {
  itemHitOffense,
  itemHitDefense,
  type ItemHitRules,
} from "./item-hit-rules";
import type { Element } from "./skill-content";
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
import { createWalker, type MovementConfig } from "./locomotion";
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
  monsterRole?: MonsterRole;
  /** Generated-area reward context; legacy encounters retain their role reward. */
  xpReward?: number;
  id: number;
  powerMultiplier?: number;
  /** Biome-authored scaling, independent of temporary skill power statuses. */
  encounterDamageScale?: number;
  effectStatuses?: string[];
  itemRules?: ItemHitRules;
  leechable?: boolean;
  movement?: MovementConfig;
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
export type CombatHitOrigin = "weapon" | "skill" | "dot" | "proc";
export interface CombatHit {
  stagger?: boolean;
  damage: number;
  element: Element;
  guaranteed?: boolean;
  scalePower?: boolean;
  origin?: CombatHitOrigin;
  skill?: string;
  weapon?: Weapon;
}
export interface ResolvedCombatHit {
  sequence: number;
  tick: number;
  actor: number;
  target: number;
  origin: CombatHitOrigin;
  element: Element;
  weapon: Weapon;
  damage: number;
  killed: boolean;
  sourceHealthFraction: number;
  targetStatuses: string[];
  skill?: string;
}
export interface CombatHitTrace {
  next: number;
  pending: ResolvedCombatHit[];
}
export function enableCombatHitTrace(world: CombatWorld): void {
  world.hitTrace ??= { next: 0, pending: [] };
}
export interface CombatHooks {
  beforeTick?: () => void;
  strike?: (actor: CombatActor) => boolean;
  afterTick?: () => void;
  controlsActor?: (actor: CombatActor) => boolean;
}
export interface CombatWorld {
  experience: MonsterExperience;
  hitTrace?: CombatHitTrace;
  itemEffects?: ItemEffectState;
  hostilesActive: boolean;
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
    defense: {
      defense: id === 4 ? 35 : 8,
      armor: id === 4 ? 120 : 15,
      physicalResistance: id === 4 ? 0.35 : 0,
    },
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
    experience: createMonsterExperience(),
    tick: 0,
    hostilesActive: true,
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
  consumeMonsterDeathXp(world, event);
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
  hit?: CombatHit,
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
  if (
    world.hitTrace &&
    (!Number.isSafeInteger(world.hitTrace.next) ||
      world.hitTrace.next < 0 ||
      world.hitTrace.next >= Number.MAX_SAFE_INTEGER ||
      world.hitTrace.pending.length >= 4096)
  )
    throw Error("Combat hit trace must be drained before further hits");
  const priorHp = target.hp;
  const random = () => {
    world.seed = (Math.imul(world.seed, 1664525) + 1013904223) >>> 0;
    return world.seed / 4294967296;
  };
  const element = hit?.element ?? "physical",
    origin = hit?.origin ?? (hit ? "skill" : "weapon");
  const offense = source.itemRules
    ? itemHitOffense(
        source.itemRules,
        source.offense,
        hit?.damage ?? source.offense.damage,
        origin,
        {
          healthFraction: Math.max(0, Math.min(1, source.hp / source.maxHp)),
          targetStatuses: target.effectStatuses ?? [],
          element,
          weapon: hit?.weapon ?? source.weapon,
        },
        hit?.skill,
      )
    : source.offense;
  const defense = target.itemRules
    ? itemHitDefense(target.itemRules, {
        healthFraction: Math.max(0, Math.min(1, target.hp / target.maxHp)),
        targetStatuses: source.effectStatuses ?? [],
        element,
        weapon: target.weapon,
      })
    : target.defense;
  const classSource = source.id === world.experience.player;
  const classTarget = target.id === world.experience.player;
  const rawDamage =
    (source.itemRules ? offense.damage : (hit?.damage ?? offense.damage)) *
    (source.encounterDamageScale ?? 1) *
    (hit?.scalePower === false ? 1 : (source.powerMultiplier ?? 1));
  const result = resolveDamage(
    {
      ...offense,
      accuracy: classSource
        ? classAccuracy(world.experience.skills, offense.accuracy)
        : offense.accuracy,
      damage:
        classSource && origin === "skill"
          ? classSynergy(
              world.experience.skills,
              hit?.skill,
              rawDamage,
              source.effectStatuses ?? [],
              {
                healthFraction: source.hp / source.maxHp,
                targetStatuses: target.effectStatuses ?? [],
                element,
                weapon: hit?.weapon ?? source.weapon,
              },
            )
          : rawDamage,
      ...(hit?.guaranteed ? { criticalChance: 0 } : {}),
    },
    classTarget
      ? {
          ...defense,
          armor: classArmor(
            world.experience.skills,
            defense.armor,
            target.effectStatuses ?? [],
          ),
        }
      : defense,
    random,
    undefined,
    hit?.element ?? "physical",
    hit?.guaranteed ?? false,
  );
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
    recordResolvedHit(world, source, target, result, priorHp, hit);
    return;
  }
  target.stagger += result.amount;
  const staggered = hit?.stagger || target.stagger >= target.maxHp * 0.08;
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
  recordResolvedHit(world, source, target, result, priorHp, hit);
}
function recordResolvedHit(
  world: CombatWorld,
  source: CombatActor,
  target: CombatActor,
  result: DamageResult,
  priorHp: number,
  hit?: CombatHit,
): void {
  if (!world.hitTrace) return;
  world.hitTrace.pending.push({
    sequence: world.hitTrace.next++,
    tick: world.tick,
    actor: source.id,
    target: target.id,
    origin: hit?.origin ?? (hit ? "skill" : "weapon"),
    element: result.type,
    weapon: hit?.weapon ?? source.weapon,
    damage: Math.min(priorHp, result.amount),
    killed: target.hp === 0,
    sourceHealthFraction: Math.max(0, Math.min(1, source.hp / source.maxHp)),
    targetStatuses: [...(target.effectStatuses ?? [])],
    ...(hit?.skill ? { skill: hit.skill } : {}),
  });
}
/** Mutates an owned world by exactly one fixed tick; snapshots are plain serializable data. */
export function stepCombat(
  world: CombatWorld,
  nav: Navigation = ARENA_NAV,
  keyboard: Point = { x: 0, y: 0 },
  inputScale = 1,
  hooks: CombatHooks = {},
): void {
  world.tick++;
  hooks.beforeTick?.();
  for (const actor of world.actors) {
    if (actor.hp <= 0) continue;
    if (
      !hooks.controlsActor?.(actor) &&
      actor.kind === "hostile" &&
      world.hostilesActive &&
      !actor.controller.attacking
    )
      actor.controller = commandCombat(actor.controller, {
        kind: "attack",
        target: 0,
        repeat: true,
      });
    if (
      !hooks.controlsActor?.(actor) &&
      actor.kind === "moving" &&
      actor.controller.timeline.phase === "idle"
    ) {
      const goal = fromGround({
        x: 880 + Math.sin(world.tick / 120) * 80,
        y: 420,
      });
      actor.controller = commandCombat(actor.controller, {
        kind: "move",
        target: goal,
      });
    }
    if (
      !hooks.controlsActor?.(actor) &&
      actor.controller.timeline.phase === "idle"
    ) {
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
      actor.movement,
      actor.kind === "player" ? inputScale : 1,
    );
    actor.controller = next.controller;
    logPhases(world, actor, next.events);
    if (
      next.events.some((e) => e.kind === "strike") &&
      !hooks.strike?.(actor)
    ) {
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
      applyCombatHit(world, source, hit, nav, {
        damage: source.offense.damage,
        element: "physical",
        origin: "weapon",
        weapon: "projectile",
      });
      return false;
    }
    projectile.position = end;
    return true;
  });
  hooks.afterTick?.();
}
