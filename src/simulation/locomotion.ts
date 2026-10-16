import { screenToWorld, worldToScreen, type Point } from "../world/isometric";
import { canWalk, findPath, type Navigation } from "../world/navigation";
export interface Walker {
  position: Point;
  route: Point[];
  direction: number;
  walking: boolean;
  tick: number;
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
  return { ...walker, route: findPath(nav, walker.position, target) };
}
export function moveTick(
  walker: Walker,
  nav: Navigation,
  keyboard: Point = { x: 0, y: 0 },
): Walker {
  const result = { ...walker, tick: walker.tick + 1, walking: false };
  let vector: Point | null = null;
  if (keyboard.x || keyboard.y) {
    vector = screenToWorld({ x: keyboard.x * 64, y: keyboard.y * 64 });
    result.route = [];
  } else if (walker.route.length) {
    const goal = walker.route[0]!;
    vector = { x: goal.x - walker.position.x, y: goal.y - walker.position.y };
  }
  if (!vector) return result;
  const distance = Math.hypot(vector.x, vector.y),
    step = 3 / 60;
  if (distance < 0.00001) {
    result.route = walker.route.slice(1);
    return result;
  }
  const amount = Math.min(distance, step);
  const next = {
    x: walker.position.x + (vector.x / distance) * amount,
    y: walker.position.y + (vector.y / distance) * amount,
  };
  if (canWalk(nav, next)) {
    result.position = next;
    result.walking = true;
    result.direction = directionFor(worldToScreen(vector));
    if (!keyboard.x && !keyboard.y && distance <= step)
      result.route = walker.route.slice(1);
  } else result.route = [];
  return result;
}
