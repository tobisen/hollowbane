import type { Point } from "../world/isometric";
import { worldToScreen } from "../world/isometric";
import { segmentWalkable, type Navigation } from "../world/navigation";
import {
  createTimeline,
  stepTimeline,
  type AttackTimeline,
  type TimelineEvent,
} from "./combat-timing";
import {
  directionFor,
  moveTick,
  retarget,
  stopWalker,
  type Walker,
  type MovementConfig,
  MOVEMENT,
} from "./locomotion";
export interface Target {
  id: number;
  position: Point;
  alive: boolean;
}
export interface CombatController {
  walker: Walker;
  timeline: AttackTimeline;
  selected: number | null;
  locked: number | null;
  attacking: boolean;
  repeat: boolean;
  queuedAttack: boolean;
  approaching: boolean;
  pendingMove: Point | null;
}
export function createController(walker: Walker): CombatController {
  return {
    walker,
    timeline: createTimeline({ windup: 12, active: 2, recovery: 18 }),
    selected: null,
    locked: null,
    attacking: false,
    repeat: false,
    queuedAttack: false,
    approaching: false,
    pendingMove: null,
  };
}
export type TargetCommand =
  | { kind: "attack"; target: number; repeat: boolean }
  | { kind: "move"; target: Point }
  | { kind: "release" }
  | { kind: "stop" };
export function commandCombat(
  state: CombatController,
  command: TargetCommand,
): CombatController {
  if (state.timeline.phase === "dead") return state;
  switch (command.kind) {
    case "attack":
      return {
        ...state,
        selected: command.target,
        attacking: true,
        queuedAttack: true,
        repeat: command.repeat,
        pendingMove: null,
      };
    case "release":
      return {
        ...state,
        repeat: false,
        attacking: state.queuedAttack && state.attacking,
      };
    case "stop":
      return {
        ...state,
        attacking: false,
        queuedAttack: false,
        repeat: false,
        pendingMove: null,
        walker: stopWalker(state.walker),
      };
    case "move":
      return {
        ...state,
        attacking: false,
        queuedAttack: false,
        repeat: false,
        pendingMove: { ...command.target },
      };
  }
}
export function inAttackRange(
  a: Point,
  b: Point,
  range: number,
  nav: Navigation,
): boolean {
  return (
    Math.hypot(a.x - b.x, a.y - b.y) <= range + 1e-9 &&
    segmentWalkable(nav, a, b)
  );
}
/** Stable screen-space hover selection; caller supplies ground-image hit regions. */
export function hoverTarget(
  point: Point,
  targets: readonly Target[],
  project: (p: Point) => Point,
): number | null {
  let selected: number | null = null,
    nearest = Infinity;
  for (const target of targets) {
    if (!target.alive) continue;
    const p = project(target.position);
    const d = ((point.x - p.x) / 22) ** 2 + ((point.y - (p.y - 28)) / 40) ** 2;
    if (d <= 1 && d < nearest) {
      selected = target.id;
      nearest = d;
    }
  }
  return selected;
}
export function stepController(
  state: CombatController,
  targets: readonly Target[],
  nav: Navigation,
  range: number,
  reaction: "wait" | "hit" | "kill" = "wait",
  hitRecovery = 6,
  keyboard: Point = { x: 0, y: 0 },
  config: MovementConfig = MOVEMENT,
  inputScale = 1,
): { controller: CombatController; events: TimelineEvent[] } {
  if (!Number.isFinite(range) || range <= 0)
    throw new Error("Invalid attack range");
  let next = { ...state };
  const target = targets.find((t) => t.id === state.selected && t.alive);
  if (!target)
    next = {
      ...next,
      selected: null,
      attacking: false,
      repeat: false,
      approaching: false,
      walker: state.approaching ? stopWalker(state.walker) : state.walker,
    };
  const idle = state.timeline.phase === "idle";
  let command: "wait" | "attack" | "hit" | "kill" = reaction;
  if (reaction === "wait" && idle) {
    if (next.pendingMove) {
      next.walker = retarget(next.walker, nav, next.pendingMove);
      next.pendingMove = null;
    }
    if (keyboard.x || keyboard.y) {
      next.attacking = false;
      next.queuedAttack = false;
      next.repeat = false;
      next.approaching = false;
    }
    if (next.attacking && target) {
      // Approach stops slightly inside range; once committed no chase or turning occurs.
      const ready = inAttackRange(
        next.walker.position,
        target.position,
        range - (next.approaching ? Math.min(0.1, range / 4) : 0),
        nav,
      );
      if (ready) {
        next.walker = stopWalker(next.walker);
        next.walker = {
          ...next.walker,
          direction: directionFor(
            worldToScreen({
              x: target.position.x - next.walker.position.x,
              y: target.position.y - next.walker.position.y,
            }),
          ),
        };
        next.locked = target.id;
        next.approaching = false;
        next.attacking = next.repeat;
        next.queuedAttack = false;
        command = "attack";
      } else {
        next.approaching = true;
        const dx = target.position.x - next.walker.position.x,
          dy = target.position.y - next.walker.position.y,
          d = Math.hypot(dx, dy);
        const inset = Math.max(0, range - 0.2);
        const goal = {
          x: target.position.x - (dx / d) * inset,
          y: target.position.y - (dy / d) * inset,
        };
        const end = next.walker.route.at(-1);
        if (!end || Math.hypot(end.x - goal.x, end.y - goal.y) > 0.15)
          next.walker = retarget(next.walker, nav, goal);
      }
    }
  }
  const timeline = stepTimeline(next.timeline, command, hitRecovery);
  next.timeline = timeline.state;
  // The entire recovery tick remains committed, even when it ends in idle.
  const canMove = idle && command === "wait";
  next.walker = canMove
    ? moveTick(next.walker, nav, keyboard, config, inputScale)
    : { ...stopWalker(next.walker), tick: next.walker.tick + 1 };
  return { controller: next, events: timeline.events };
}
