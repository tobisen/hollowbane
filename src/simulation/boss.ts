import type { Point } from "../world/isometric";
import { canWalk, segmentWalkable, type Navigation } from "../world/navigation";
import { createRng } from "./core";
import {
  applyCombatHit,
  type CombatActor,
  type CombatHooks,
  type CombatWorld,
} from "./combat";
import { commandCombat } from "./combat-targeting";
import { createTimeline, type Timing } from "./combat-timing";
import type { Defense } from "./damage";
import type { Element } from "./skill-content";

export type BossShape =
  | { kind: "circle"; radius: number }
  | { kind: "cone"; radius: number; halfAngle: number }
  | { kind: "line"; length: number; width: number };
export interface BossAttack {
  id: string;
  name: string;
  timing: Timing;
  shape: BossShape;
  damage: number;
  element: Element;
  weight: number;
}
export interface BossPhase {
  name: string;
  /** Enter when either health or completed attacks reaches its threshold. */
  healthAtMost: number;
  attacksAtLeast?: number;
  attacks: readonly string[];
  transitionFrames: number;
}
export interface BossDefinition {
  id: string;
  name: string;
  health: number;
  defense: Defense;
  attacks: readonly BossAttack[];
  phases: readonly BossPhase[];
}
export interface BossArena {
  center: Point;
  radius: number;
  home: Point;
}
export interface BossTelegraph {
  attack: string;
  origin: Point;
  direction: Point;
  shape: BossShape;
  started: number;
  strikeAt: number;
}
export interface BossEvent {
  tick: number;
  kind:
    | "engage"
    | "telegraph"
    | "strike"
    | "interrupt"
    | "phase"
    | "reset"
    | "death"
    | "complete";
  phase: number;
  attack?: string;
}
export interface BossState {
  actor: number;
  phase: number;
  engaged: boolean;
  complete: boolean;
  transitionUntil: number;
  attacks: number;
  previous: string | null;
  telegraph: BossTelegraph | null;
  events: BossEvent[];
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const reach = (shape: BossShape) =>
  shape.kind === "line" ? shape.length : shape.radius;

export function validateBoss(definition: BossDefinition): void {
  if (
    !definition.id ||
    !definition.name ||
    !Number.isFinite(definition.health) ||
    definition.health <= 0 ||
    !definition.attacks.length ||
    !definition.phases.length
  )
    throw Error("Invalid boss definition");
  const ids = new Set<string>();
  for (const a of definition.attacks) {
    createTimeline(a.timing);
    if (
      !a.id ||
      ids.has(a.id) ||
      !a.name ||
      !Number.isFinite(a.damage) ||
      a.damage < 0 ||
      !Number.isFinite(a.weight) ||
      a.weight <= 0 ||
      !Number.isFinite(reach(a.shape)) ||
      reach(a.shape) <= 0 ||
      a.timing.windup < 18 ||
      (a.shape.kind === "line" &&
        (!Number.isFinite(a.shape.width) || a.shape.width <= 0)) ||
      (a.shape.kind === "cone" &&
        (!Number.isFinite(a.shape.halfAngle) ||
          a.shape.halfAngle <= 0 ||
          a.shape.halfAngle >= Math.PI))
    )
      throw Error("Invalid boss attack");
    ids.add(a.id);
  }
  let threshold = Infinity;
  for (const p of definition.phases) {
    if (
      !p.name ||
      !Number.isFinite(p.healthAtMost) ||
      p.healthAtMost < 0 ||
      p.healthAtMost > 1 ||
      p.healthAtMost >= threshold ||
      !p.attacks.length ||
      new Set(p.attacks).size !== p.attacks.length ||
      p.attacks.some((id) => !ids.has(id)) ||
      !Number.isSafeInteger(p.transitionFrames) ||
      p.transitionFrames < 1 ||
      (p.attacksAtLeast !== undefined &&
        (!Number.isSafeInteger(p.attacksAtLeast) || p.attacksAtLeast < 1))
    )
      throw Error("Invalid boss phase");
    threshold = p.healthAtMost;
  }
  if (definition.phases[0]!.healthAtMost !== 1)
    throw Error("Boss must start in phase one");
  const values = [
    definition.defense.defense,
    definition.defense.armor,
    definition.defense.physicalResistance,
    ...Object.values(definition.defense.resistances ?? {}),
  ];
  if (
    !values.every(Number.isFinite) ||
    definition.defense.defense < 0 ||
    definition.defense.armor < 0
  )
    throw Error("Invalid boss defense");
}
export function createBoss(
  actor: CombatActor,
  definition: BossDefinition,
  arena: BossArena,
  nav: Navigation,
): BossState {
  validateBoss(definition);
  if (
    ![
      arena.center.x,
      arena.center.y,
      arena.home.x,
      arena.home.y,
      arena.radius,
    ].every(Number.isFinite) ||
    arena.radius <= 0 ||
    distance(arena.home, arena.center) >= arena.radius ||
    !canWalk(nav, arena.home)
  )
    throw Error("Invalid boss arena");
  actor.name = definition.name;
  actor.hp = actor.maxHp = definition.health;
  actor.defense = structuredClone(definition.defense);
  actor.controller = commandCombat(actor.controller, { kind: "stop" });
  actor.controller.walker.position = { ...arena.home };
  return {
    actor: actor.id,
    phase: 0,
    engaged: false,
    complete: false,
    transitionUntil: 0,
    attacks: 0,
    previous: null,
    telegraph: null,
    events: [],
  };
}
/** Shared by hit resolution and rendering. Shapes are locked at windup, never track the player. */
export function bossDangerContains(t: BossTelegraph, point: Point): boolean {
  const dx = point.x - t.origin.x,
    dy = point.y - t.origin.y;
  const along = dx * t.direction.x + dy * t.direction.y;
  if (t.shape.kind === "line")
    return (
      along >= 0 &&
      along <= t.shape.length &&
      Math.abs(dx * t.direction.y - dy * t.direction.x) <= t.shape.width / 2
    );
  const d = Math.hypot(dx, dy);
  return (
    d <= t.shape.radius &&
    (t.shape.kind === "circle" ||
      d === 0 ||
      along / d >= Math.cos(t.shape.halfAngle))
  );
}
export function selectBossAttack(
  definition: BossDefinition,
  state: BossState,
  random: () => number,
): BossAttack {
  let attacks = definition.attacks.filter((a) =>
    definition.phases[state.phase]!.attacks.includes(a.id),
  );
  if (attacks.length > 1)
    attacks = attacks.filter((a) => a.id !== state.previous);
  const draw = random();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
    throw Error("Invalid boss RNG");
  let weight = draw * attacks.reduce((sum, a) => sum + a.weight, 0);
  for (const attack of attacks) {
    weight -= attack.weight;
    if (weight < 0) return attack;
  }
  return attacks.at(-1)!;
}
function emit(
  world: CombatWorld,
  state: BossState,
  kind: BossEvent["kind"],
  attack?: string,
): void {
  state.events.push({
    tick: world.tick,
    kind,
    phase: state.phase,
    ...(attack ? { attack } : {}),
  });
  if (state.events.length > 128) state.events.shift();
}
/** Compose around skillHooks: one existing stepCombat call owns every actor/timeline/hit. */
export function bossHooks(
  world: CombatWorld,
  definition: BossDefinition,
  state: BossState,
  arena: BossArena,
  nav: Navigation,
  base: CombatHooks = {},
): CombatHooks {
  const boss = () => world.actors.find((a) => a.id === state.actor);
  const reset = (a: CombatActor): void => {
    a.controller = commandCombat(a.controller, { kind: "stop" });
    a.controller.timeline = createTimeline({
      windup: 30,
      active: 2,
      recovery: 30,
    });
    a.controller.walker.position = { ...arena.home };
    a.hp = a.maxHp;
    a.stagger = 0;
    state.engaged = false;
    state.phase = 0;
    state.attacks = 0;
    state.previous = null;
    state.telegraph = null;
    emit(world, state, "reset");
  };
  return {
    controlsActor: (a) => a.id === state.actor || !!base.controlsActor?.(a),
    beforeTick: () => {
      base.beforeTick?.();
      const a = boss(),
        target = world.actors.find((a) => a.kind === "player");
      if (!a || !target || state.complete || a.hp <= 0) return;
      if (
        target.hp <= 0 ||
        distance(target.controller.walker.position, arena.center) >
          arena.radius ||
        distance(a.controller.walker.position, arena.center) > arena.radius
      ) {
        if (state.engaged) reset(a);
        return;
      }
      if (!state.engaged) {
        state.engaged = true;
        state.transitionUntil =
          world.tick + definition.phases[0]!.transitionFrames;
        emit(world, state, "engage");
      }
      if (a.controller.timeline.phase !== "idle") return;
      state.telegraph = null;
      const next = definition.phases[state.phase + 1];
      if (
        next &&
        (a.hp / a.maxHp <= next.healthAtMost ||
          (next.attacksAtLeast !== undefined &&
            state.attacks >= next.attacksAtLeast))
      ) {
        state.phase++;
        state.transitionUntil = world.tick + next.transitionFrames;
        a.controller = commandCombat(a.controller, { kind: "stop" });
        emit(world, state, "phase");
        return;
      }
      if (world.tick < state.transitionUntil) return;
      const available = definition.attacks.filter((attack) =>
        definition.phases[state.phase]!.attacks.includes(attack.id),
      );
      const range =
        Math.min(...available.map((attack) => reach(attack.shape))) * 0.85;
      const origin = a.controller.walker.position,
        destination = target.controller.walker.position;
      if (
        distance(origin, destination) > range ||
        !segmentWalkable(nav, origin, destination)
      ) {
        if (world.tick % 12 === 0)
          a.controller = commandCombat(a.controller, {
            kind: "move",
            target: destination,
          });
        return;
      }
      // Use the existing seeded generator, committing its next state to the combat stream.
      const attack = selectBossAttack(definition, state, () => {
        const draw = createRng(world.seed)();
        world.seed = Math.floor(draw * 4294967296);
        return draw;
      });
      const d = distance(origin, destination);
      state.telegraph = {
        attack: attack.id,
        origin: { ...origin },
        direction: {
          x: d ? (destination.x - origin.x) / d : 1,
          y: d ? (destination.y - origin.y) / d : 0,
        },
        shape: { ...attack.shape },
        started: world.tick,
        strikeAt: world.tick + attack.timing.windup - 1,
      };
      a.controller = commandCombat(a.controller, { kind: "stop" });
      a.controller.timeline.timing = { ...attack.timing };
      a.range = range + 0.01;
      a.controller = commandCombat(a.controller, {
        kind: "attack",
        target: target.id,
        repeat: false,
      });
      state.previous = attack.id;
      emit(world, state, "telegraph", attack.id);
    },
    strike: (a) => {
      if (a.id !== state.actor) return base.strike?.(a) ?? false;
      const telegraph = state.telegraph;
      if (!telegraph || state.complete) return true;
      const attack = definition.attacks.find((a) => a.id === telegraph.attack)!;
      state.attacks++;
      emit(world, state, "strike", attack.id);
      for (const target of world.actors)
        if (
          target.kind === "player" &&
          target.hp > 0 &&
          bossDangerContains(telegraph, target.controller.walker.position) &&
          segmentWalkable(
            nav,
            telegraph.origin,
            target.controller.walker.position,
          )
        )
          applyCombatHit(world, a, target, nav, {
            damage: attack.damage,
            element: attack.element,
            guaranteed: true,
            origin: "skill",
          });
      return true;
    },
    afterTick: () => {
      base.afterTick?.();
      const a = boss();
      if (!a || state.complete) return;
      if (a.hp <= 0) {
        state.complete = true;
        state.telegraph = null;
        emit(world, state, "death");
        emit(world, state, "complete");
      } else if (a.controller.timeline.phase === "hitstun" && state.telegraph) {
        emit(world, state, "interrupt", state.telegraph.attack);
        state.telegraph = null;
      } else if (a.controller.timeline.phase === "idle") state.telegraph = null;
    },
  };
}
