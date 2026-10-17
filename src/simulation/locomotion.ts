import { screenToWorld, worldToScreen, type Point } from "../world/isometric";
import {
  findPath,
  segmentWalkable,
  type Navigation,
} from "../world/navigation";
export type Gait = "walk" | "run";
export interface MovementConfig {
  walkSpeed: number;
  runSpeed: number;
  acceleration: number;
  deceleration: number;
  walkStride: number;
  runStride: number;
}
export const MOVEMENT: Readonly<MovementConfig> = Object.freeze({
  walkSpeed: 3,
  runSpeed: 5.4,
  acceleration: 180,
  deceleration: 240,
  walkStride: 2.1,
  runStride: 2.5,
});
/** Speeds are world units/second, acceleration world units/second², stride units/cycle. */
export function movementConfig(
  value: Partial<MovementConfig> = {},
): MovementConfig {
  const result = { ...MOVEMENT, ...value };
  for (const [key, v] of Object.entries(result)) {
    const limit = key.endsWith("Speed")
      ? 12
      : key.endsWith("Stride")
        ? 10
        : 1200;
    if (!Number.isFinite(v) || v <= 0 || v > limit)
      throw new RangeError(`Invalid movement setting: ${key}`);
  }
  if (result.runSpeed < result.walkSpeed)
    throw new RangeError("Run speed must be at least walk speed");
  return result;
}
export interface Walker {
  position: Point;
  route: Point[];
  queuedTargets: Point[];
  direction: number;
  walking: boolean;
  tick: number;
  gait: Gait;
  speed: number;
  velocity: Point;
  distance: number;
  motion: "idle" | "move";
}
export function createWalker(position: Point): Walker {
  return {
    position: { ...position },
    route: [],
    queuedTargets: [],
    direction: 0,
    walking: false,
    tick: 0,
    gait: "walk",
    speed: 0,
    velocity: { x: 0, y: 0 },
    distance: 0,
    motion: "idle",
  };
}
export function directionFor(vector: Point): number {
  return (
    (Math.round(
      (Math.atan2(vector.y, vector.x) - Math.PI / 2) / (Math.PI / 4),
    ) +
      8) %
    8
  );
}
export function retarget(
  walker: Walker,
  nav: Navigation,
  target: Point,
): Walker {
  if (
    Math.hypot(target.x - walker.position.x, target.y - walker.position.y) <
    1e-9
  )
    return stopWalker(walker);
  const route = findPath(nav, walker.position, target);
  // Rejected commands cannot silently cancel an already accepted route.
  return route.length ? { ...walker, route, queuedTargets: [] } : walker;
}
export function stopWalker(walker: Walker): Walker {
  return {
    ...walker,
    route: [],
    queuedTargets: [],
    walking: false,
    motion: "idle",
    speed: 0,
    velocity: { x: 0, y: 0 },
  };
}
export function movementFrame(
  walker: Walker,
  paused: boolean,
  config: MovementConfig = MOVEMENT,
): number {
  const col = walker.walking
    ? 2 +
      Math.floor(
        ((walker.distance /
          (walker.gait === "run" ? config.runStride : config.walkStride)) *
          6) %
          6,
      )
    : paused
      ? 0
      : Math.floor(walker.tick / 60) % 2;
  return walker.direction * 8 + col;
}
/** One deterministic 60 Hz tick. No wall clock or render state enters this function. */
export function moveTick(
  walker: Walker,
  nav: Navigation,
  keyboard: Point = { x: 0, y: 0 },
  config: MovementConfig = MOVEMENT,
  inputScale = 1,
): Walker {
  if (!Number.isFinite(inputScale) || inputScale < 0 || inputScale > 1)
    throw new RangeError("Invalid analog input scale");
  let result: Walker = {
    ...walker,
    tick: walker.tick + 1,
    route: [...walker.route],
  };
  const key = Boolean(keyboard.x || keyboard.y);
  const desired =
    key || result.route.length
      ? walker.gait === "run"
        ? config.runSpeed * (key ? inputScale : 1)
        : config.walkSpeed * (key ? inputScale : 1)
      : 0;
  const change =
    (desired > walker.speed ? config.acceleration : config.deceleration) / 60;
  result.speed =
    walker.speed +
    Math.sign(desired - walker.speed) *
      Math.min(Math.abs(desired - walker.speed), change);
  if (key) {
    result.route = [];
    result.queuedTargets = [];
  }
  let budget = result.speed / 60,
    moved = 0;
  let replanned = false;
  // Consume zero-length and short waypoints in this tick rather than pausing at grid nodes.
  for (let i = 0; i < 128 && budget > 1e-9; i++) {
    const goal = result.route[0];
    const vector = key
      ? screenToWorld({ x: keyboard.x * 64, y: keyboard.y * 64 })
      : goal
        ? { x: goal.x - result.position.x, y: goal.y - result.position.y }
        : walker.velocity;
    const length = Math.hypot(vector.x, vector.y);
    if (length < 1e-9) {
      if (goal) {
        result.route.shift();
        continue;
      }
      break;
    }
    const unit = { x: vector.x / length, y: vector.y / length };
    const amount = goal && !key ? Math.min(length, budget) : budget;
    const next = {
      x: result.position.x + unit.x * amount,
      y: result.position.y + unit.y * amount,
    };
    if (!segmentWalkable(nav, result.position, next)) {
      if (!key && goal && !replanned) {
        const end = result.route.at(-1)!;
        result.route = findPath(nav, result.position, end);
        replanned = true;
        if (result.route.length) continue;
      }
      result = stopWalker(result);
      break;
    }
    result.position = next;
    result.direction = directionFor(worldToScreen(vector));
    result.velocity = { x: unit.x * result.speed, y: unit.y * result.speed };
    moved += amount;
    budget -= amount;
    if (goal && !key && length <= amount + 1e-9) {
      result.route.shift();
      if (!result.route.length && result.queuedTargets.length) {
        const [target, ...remaining] = result.queuedTargets;
        result.queuedTargets = remaining;
        result.route = findPath(nav, result.position, target!);
      }
      if (!result.route.length) {
        result = { ...stopWalker(result), position: result.position };
        break;
      }
    } else break;
  }
  result.walking = moved > 1e-9;
  result.motion = result.walking ? "move" : "idle";
  result.distance += moved;
  if (!result.walking) {
    result.speed = 0;
    result.velocity = { x: 0, y: 0 };
  }
  return result;
}
