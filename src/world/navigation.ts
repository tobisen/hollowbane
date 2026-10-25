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

/** Swept manual steering. Project the unspent displacement onto the contact cone.
 * All projections use logical world units, including legacy image-space geometry.
 * Path following deliberately retains its exact waypoints and replan policy.
 */
export function slideMovement(
  nav: Navigation,
  start: Point,
  delta: Point,
): Point {
  if (!finite(delta) || !canWalk(nav, start)) return { ...start };
  let position = { ...start },
    remaining = { ...delta },
    intended = { ...delta };
  const normals: Point[] = [];
  for (let contact = 0; contact < 8; contact++) {
    const length = Math.hypot(remaining.x, remaining.y);
    if (length < 1e-9) break;
    const at = (t: number): Point => ({
      x: position.x + remaining.x * t,
      y: position.y + remaining.y * t,
    });
    if (segmentWalkable(nav, position, at(1))) return at(1);
    // Prefix sweeps are monotonic even when the far endpoint is beyond a wall.
    let low = 0,
      high = 1;
    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2;
      if (segmentWalkable(nav, position, at(mid))) low = mid;
      else high = mid;
    }
    position = at(Math.max(0, low - 1e-7 / length));
    intended = { x: intended.x * (1 - low), y: intended.y * (1 - low) };
    normals.push(...contactNormals(nav, position));
    if (!normals.length) break; // Fail closed if geometry cannot supply a normal.
    const valid = (v: Point) =>
      normals.every((n) => v.x * n.x + v.y * n.y >= -1e-10);
    if (valid(intended)) break;
    let best: Point = { x: 0, y: 0 };
    let error = intended.x ** 2 + intended.y ** 2;
    // In 2D the closest feasible vector is the input, a contact tangent, or zero.
    // Testing every tangent avoids order-dependent corner oscillation.
    for (const n of normals) {
      const dot = intended.x * n.x + intended.y * n.y;
      const candidate = {
        x: intended.x - dot * n.x,
        y: intended.y - dot * n.y,
      };
      const distance =
        (candidate.x - intended.x) ** 2 + (candidate.y - intended.y) ** 2;
      if (distance < error && valid(candidate)) {
        best = candidate;
        error = distance;
      }
    }
    remaining = best;
  }
  return position;
}

function contactNormals(nav: Navigation, world: Point): Point[] {
  const result: Point[] = [];
  const add = (x: number, y: number) => {
    const length = Math.hypot(x, y);
    if (length > 1e-12) result.push({ x: x / length, y: y / length });
  };
  const edge = (
    p: Point,
    a: Point,
    b: Point,
    radius: number,
    legacy = false,
  ) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
    );
    const x = p.x - a.x - dx * t,
      y = p.y - a.y - dy * t;
    if (Math.hypot(x, y) > radius + (legacy ? 1e-3 : 1e-5)) return;
    // At zero clearance use the last safe side of the polygon edge.
    const side = -dy * (p.x - a.x) + dx * (p.y - a.y) >= 0 ? 1 : -1;
    const nx = t > 0 && t < 1 ? -dy * side : x;
    const ny = t > 0 && t < 1 ? dx * side : y;
    if (legacy) add(64 * nx + 32 * ny, -64 * nx + 32 * ny);
    else add(nx, ny);
  };
  if (nav.logicalMap) {
    const map = nav.logicalMap,
      t = map.terrain,
      r = WORLD_ACTOR_RADIUS;
    const left = t.origin.x,
      top = t.origin.y;
    const right = left + t.width * t.cellSize,
      bottom = top + t.height * t.cellSize;
    if (world.x - left < r + 1e-5) add(1, 0);
    if (right - world.x < r + 1e-5) add(-1, 0);
    if (world.y - top < r + 1e-5) add(0, 1);
    if (bottom - world.y < r + 1e-5) add(0, -1);
    for (
      let row = Math.max(
        0,
        Math.floor((world.y - top - r - 1e-5) / t.cellSize),
      );
      row <=
      Math.min(
        t.height - 1,
        Math.floor((world.y - top + r + 1e-5) / t.cellSize),
      );
      row++
    )
      for (
        let col = Math.max(
          0,
          Math.floor((world.x - left - r - 1e-5) / t.cellSize),
        );
        col <=
        Math.min(
          t.width - 1,
          Math.floor((world.x - left + r + 1e-5) / t.cellSize),
        );
        col++
      ) {
        if (t.cells[row * t.width + col] === "ground") continue;
        const x = left + col * t.cellSize,
          y = top + row * t.cellSize;
        const nx = world.x - Math.max(x, Math.min(world.x, x + t.cellSize));
        const ny = world.y - Math.max(y, Math.min(world.y, y + t.cellSize));
        if (Math.hypot(nx, ny) <= r + 1e-5) add(nx, ny);
      }
    for (const o of map.objects) {
      const x = world.x - o.position.x,
        y = world.y - o.position.y;
      if (o.blocking && Math.hypot(x, y) <= r + o.radius + 1e-5) add(x, y);
    }
  } else {
    const p = onGround(world);
    for (let i = 0; i < nav.boundary.length; i++)
      edge(
        p,
        nav.boundary[i]!,
        nav.boundary[(i + 1) % nav.boundary.length]!,
        nav.clearance ?? 0,
        true,
      );
    for (const o of nav.obstacles) {
      const axes = obstacleAxes(o, nav.clearance ?? 0);
      const x = (p.x - o.x) / axes.x,
        y = (p.y - o.y) / axes.y;
      if (x * x + y * y <= 1 + 1e-5) {
        const nx = x / axes.x,
          ny = y / axes.y;
        add(64 * nx + 32 * ny, -64 * nx + 32 * ny);
      }
    }
  }
  return result;
}
