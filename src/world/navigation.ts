import { areaWalkable, type AreaMap } from "../simulation/area-map";
import { WORLD_ACTOR_RADIUS } from "../simulation/area-anchors";
import { screenToWorld, worldToScreen, type Point } from "./isometric";
export interface Obstacle {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
export interface Navigation {
  /** Logical maps bypass the legacy ground-image collision representation. */
  logicalMap?: AreaMap;
  boundary: Point[];
  obstacles: Obstacle[];
  /** Conservative actor clearance in ground-image pixels. */
  clearance?: number;
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
function finite(p: Point): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}
function distanceToSegmentSq(p: Point, a: Point, b: Point): number {
  const x = b.x - a.x,
    y = b.y - a.y;
  const length = x * x + y * y;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * x + (p.y - a.y) * y) / length))
    : 0;
  return (p.x - a.x - t * x) ** 2 + (p.y - a.y - t * y) ** 2;
}
function segmentDistanceSq(a: Point, b: Point, c: Point, d: Point): number {
  const x = b.x - a.x,
    y = b.y - a.y,
    u = d.x - c.x,
    v = d.y - c.y;
  const cross = x * v - y * u;
  if (Math.abs(cross) > 1e-12) {
    const t = ((c.x - a.x) * v - (c.y - a.y) * u) / cross;
    const q = ((c.x - a.x) * y - (c.y - a.y) * x) / cross;
    if (t >= 0 && t <= 1 && q >= 0 && q <= 1) return 0;
  }
  return Math.min(
    distanceToSegmentSq(a, c, d),
    distanceToSegmentSq(b, c, d),
    distanceToSegmentSq(c, a, b),
    distanceToSegmentSq(d, a, b),
  );
}
function obstacleAxes(o: Obstacle, clearance: number): Point {
  // Uniform ellipse scaling conservatively encloses its circular clearance offset.
  const scale = 1 + clearance / Math.min(o.rx, o.ry);
  return { x: o.rx * scale, y: o.ry * scale };
}
export function canWalk(nav: Navigation, world: Point): boolean {
  if (!finite(world)) return false;
  if (nav.logicalMap)
    return areaWalkable(nav.logicalMap, world, WORLD_ACTOR_RADIUS);
  const p = onGround(world),
    clearance = nav.clearance ?? 0;
  return (
    contains(p, nav.boundary) &&
    nav.boundary.every(
      (a, i) =>
        distanceToSegmentSq(
          p,
          a,
          nav.boundary[(i + 1) % nav.boundary.length]!,
        ) >
        clearance ** 2 + 1e-12,
    ) &&
    !nav.obstacles.some((o) => {
      const axes = obstacleAxes(o, clearance);
      return (
        ((p.x - o.x) / axes.x) ** 2 + ((p.y - o.y) / axes.y) ** 2 < 1 + 1e-12
      );
    })
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
  if (!canWalk(nav, start) || !canWalk(nav, end)) return [];
  if (Math.hypot(end.x - start.x, end.y - start.y) < 1e-9) return [];
  if (segmentWalkable(nav, start, end)) return [{ ...end }];
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
      return smoothPath(nav, start, path);
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
/** Analytic swept point/expanded-obstacle and boundary checks, independent of speed. */
export function segmentWalkable(nav: Navigation, a: Point, b: Point): boolean {
  if (!canWalk(nav, a) || !canWalk(nav, b)) return false;
  if (nav.logicalMap) return logicalSegment(nav.logicalMap, a, b);
  const p = onGround(a),
    q = onGround(b),
    clearance = nav.clearance ?? 0;
  for (let i = 0; i < nav.boundary.length; i++) {
    if (
      segmentDistanceSq(
        p,
        q,
        nav.boundary[i]!,
        nav.boundary[(i + 1) % nav.boundary.length]!,
      ) <=
      clearance ** 2 + 1e-12
    )
      return false;
  }
  for (const o of nav.obstacles) {
    const axes = obstacleAxes(o, clearance);
    const first = { x: (p.x - o.x) / axes.x, y: (p.y - o.y) / axes.y };
    const last = { x: (q.x - o.x) / axes.x, y: (q.y - o.y) / axes.y };
    if (distanceToSegmentSq({ x: 0, y: 0 }, first, last) < 1 + 1e-12)
      return false;
  }
  return true;
}
/** Greedy line-of-sight simplification keeps exact endpoints and safe fractional joins. */
export function smoothPath(
  nav: Navigation,
  start: Point,
  path: Point[],
): Point[] {
  const result: Point[] = [];
  let current = start,
    index = 0;
  while (index < path.length) {
    let last = path.length - 1;
    while (last > index && !segmentWalkable(nav, current, path[last]!)) last--;
    const next = path[last]!;
    if (!segmentWalkable(nav, current, next)) return [];
    if (Math.hypot(next.x - current.x, next.y - current.y) > 1e-9)
      result.push(next);
    current = next;
    index = last + 1;
  }
  return result;
}

/** Projection is only for drawing; collision retains logical units. */
export function areaNavigation(map: AreaMap): Navigation {
  const t = map.terrain,
    x = t.origin.x,
    y = t.origin.y;
  return {
    logicalMap: map,
    obstacles: [],
    boundary: [
      { x, y },
      { x: x + t.width * t.cellSize, y },
      { x: x + t.width * t.cellSize, y: y + t.height * t.cellSize },
      { x, y: y + t.height * t.cellSize },
    ].map(onGround),
  };
}
function logicalSegment(map: AreaMap, a: Point, b: Point): boolean {
  const t = map.terrain,
    radius = WORLD_ACTOR_RADIUS;
  // The rectangular outer boundary is convex; clear endpoints contain the sweep.
  for (let row = 0; row < t.height; row++)
    for (let col = 0; col < t.width; col++) {
      if (t.cells[row * t.width + col] === "ground") continue;
      const x = t.origin.x + col * t.cellSize,
        y = t.origin.y + row * t.cellSize;
      const corners = [
        { x, y },
        { x: x + t.cellSize, y },
        { x: x + t.cellSize, y: y + t.cellSize },
        { x, y: y + t.cellSize },
      ];
      if (
        corners.some(
          (p, i) =>
            segmentDistanceSq(a, b, p, corners[(i + 1) % 4]!) <= radius ** 2,
        )
      )
        return false;
    }
  return !map.objects.some(
    (o) =>
      o.blocking &&
      distanceToSegmentSq(o.position, a, b) <= (radius + o.radius) ** 2,
  );
}
