import { screenToWorld, worldToScreen, type Point } from "./isometric";
export interface Obstacle {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
export interface Navigation {
  boundary: Point[];
  obstacles: Obstacle[];
}
export const ORIGIN = { x: 768, y: 512 };
export function onGround(world: Point): Point {
  const p = worldToScreen(world);
  return { x: p.x + ORIGIN.x, y: p.y + ORIGIN.y };
}
export function fromGround(screen: Point): Point {
  return screenToWorld({ x: screen.x - ORIGIN.x, y: screen.y - ORIGIN.y });
}
export function contains(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function canWalk(nav: Navigation, world: Point): boolean {
  const p = onGround(world);
  return (
    contains(p, nav.boundary) &&
    !nav.obstacles.some(
      (o) => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1,
    )
  );
}
/** Static visual-prototype navigation; world grid is independent of painted pixels. */
export function nearestNode(nav: Navigation, p: Point): Point | null {
  const rounded = { x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 };
  if (canWalk(nav, rounded) && segmentWalkable(nav, p, rounded)) return rounded;
  let best: Point | null = null,
    distance = Infinity;
  for (let x = -2; x <= 2; x++)
    for (let y = -2; y <= 2; y++) {
      const candidate = { x: rounded.x + x * 0.5, y: rounded.y + y * 0.5 };
      const d = Math.hypot(p.x - candidate.x, p.y - candidate.y);
      if (
        d < distance &&
        d <= 0.8 &&
        canWalk(nav, candidate) &&
        segmentWalkable(nav, p, candidate)
      ) {
        best = candidate;
        distance = d;
      }
    }
  return best;
}
export function findPath(nav: Navigation, start: Point, end: Point): Point[] {
  if (!canWalk(nav, end)) return [];
  const first = nearestNode(nav, start),
    last = nearestNode(nav, end);
  if (!first || !last) return [];
  const key = (p: Point) => `${p.x},${p.y}`;
  const frontier = [first],
    cost = new Map([[key(first), 0]]),
    parent = new Map<string, Point>();
  const estimate = (p: Point) => Math.hypot(p.x - last.x, p.y - last.y);
  const visited = new Set<string>();
  while (frontier.length && visited.size < 4000) {
    frontier.sort(
      (a, b) =>
        cost.get(key(a))! + estimate(a) - (cost.get(key(b))! + estimate(b)),
    );
    const current = frontier.shift()!,
      id = key(current);
    if (visited.has(id)) continue;
    if (id === key(last)) {
      const path: Point[] = [last];
      let cursor = current;
      while (parent.has(key(cursor))) {
        cursor = parent.get(key(cursor))!;
        path.unshift(cursor);
      }
      // Retain the start node: this prevents cutting an obstacle when joining the grid.
      if (segmentWalkable(nav, path[path.length - 1]!, end)) path.push(end);
      return path;
    }
    visited.add(id);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const next = { x: current.x + dx * 0.5, y: current.y + dy * 0.5 };
        if (!canWalk(nav, next) || !segmentWalkable(nav, current, next))
          continue;
        if (
          dx &&
          dy &&
          (!canWalk(nav, { x: current.x + dx * 0.5, y: current.y }) ||
            !canWalk(nav, { x: current.x, y: current.y + dy * 0.5 }))
        )
          continue;
        const nextCost = cost.get(id)! + Math.hypot(dx, dy) * 0.5;
        if (nextCost < (cost.get(key(next)) ?? Infinity)) {
          cost.set(key(next), nextCost);
          parent.set(key(next), current);
          frontier.push(next);
        }
      }
  }
  return [];
}
export function segmentWalkable(nav: Navigation, a: Point, b: Point): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.08));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!canWalk(nav, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }))
      return false;
  }
  return true;
}
