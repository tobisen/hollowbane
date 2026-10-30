import { expect, it } from "vitest";
import { areaWalkable, type AreaMap } from "../simulation/area-map";
import { WORLD_ACTOR_RADIUS } from "../simulation/area-anchors";
import type { Point } from "./isometric";
import {
  areaNavigation,
  canWalk,
  contains,
  findPath,
  fromGround,
  onGround,
  segmentWalkable,
  type Navigation,
} from "./navigation";

/** Retained exhaustive sweep is the differential oracle for the bounded cell scan. */
function exhaustiveSegment(map: AreaMap, a: Point, b: Point): boolean {
  const radius = WORLD_ACTOR_RADIUS;
  if (!areaWalkable(map, a, radius) || !areaWalkable(map, b, radius))
    return false;
  const pointDistance = (p: Point, first: Point, last: Point): number => {
    const x = last.x - first.x,
      y = last.y - first.y,
      length = x * x + y * y,
      t = length
        ? Math.max(
            0,
            Math.min(1, ((p.x - first.x) * x + (p.y - first.y) * y) / length),
          )
        : 0;
    return (p.x - first.x - t * x) ** 2 + (p.y - first.y - t * y) ** 2;
  };
  const edgeDistance = (c: Point, d: Point): number => {
    const x = b.x - a.x,
      y = b.y - a.y,
      u = d.x - c.x,
      v = d.y - c.y,
      cross = x * v - y * u;
    if (Math.abs(cross) > 1e-12) {
      const t = ((c.x - a.x) * v - (c.y - a.y) * u) / cross,
        q = ((c.x - a.x) * y - (c.y - a.y) * x) / cross;
      if (t >= 0 && t <= 1 && q >= 0 && q <= 1) return 0;
    }
    return Math.min(
      pointDistance(a, c, d),
      pointDistance(b, c, d),
      pointDistance(c, a, b),
      pointDistance(d, a, b),
    );
  };
  const t = map.terrain;
  for (let row = 0; row < t.height; row++)
    for (let col = 0; col < t.width; col++) {
      if (t.cells[row * t.width + col] === "ground") continue;
      const x = t.origin.x + col * t.cellSize,
        y = t.origin.y + row * t.cellSize,
        corners = [
          { x, y },
          { x: x + t.cellSize, y },
          { x: x + t.cellSize, y: y + t.cellSize },
          { x, y: y + t.cellSize },
        ];
      if (
        corners.some(
          (p, i) => edgeDistance(p, corners[(i + 1) % 4]!) <= radius ** 2,
        )
      )
        return false;
    }
  return !map.objects.some(
    (o) =>
      o.blocking && pointDistance(o.position, a, b) <= (radius + o.radius) ** 2,
  );
}
const nav: Navigation = {
  boundary: [
    { x: 400, y: 300 },
    { x: 1100, y: 300 },
    { x: 1100, y: 700 },
    { x: 400, y: 700 },
  ],
  obstacles: [{ x: 768, y: 512, rx: 60, ry: 35 }],
};
it("keeps collision independent from the painted image and rejects outside points", () => {
  expect(contains({ x: 700, y: 400 }, nav.boundary)).toBe(true);
  expect(canWalk(nav, fromGround({ x: 768, y: 512 }))).toBe(false);
  expect(canWalk(nav, fromGround({ x: 0, y: 0 }))).toBe(false);
  expect(onGround(fromGround({ x: 601, y: 430 }))).toEqual({ x: 601, y: 430 });
});
it("routes around an obstacle without cutting diagonal corners", () => {
  const start = fromGround({ x: 600, y: 512 }),
    end = fromGround({ x: 900, y: 512 });
  const route = findPath(nav, start, end);
  expect(route.length).toBeGreaterThan(1);
  for (let i = 1; i < route.length; i++)
    expect(segmentWalkable(nav, route[i - 1]!, route[i]!)).toBe(true);
  expect(findPath(nav, start, fromGround({ x: 0, y: 0 }))).toEqual([]);
});
it("returns identical paths for identical inputs", () => {
  const a = fromGround({ x: 600, y: 450 }),
    b = fromGround({ x: 950, y: 600 });
  expect(findPath(nav, a, b)).toEqual(findPath(nav, a, b));
});

it("joins the grid without crossing an obstacle from a fractional start", () => {
  const start = fromGround({ x: 701, y: 510 });
  const route = findPath(nav, start, fromGround({ x: 950, y: 550 }));
  expect(route.length).toBeGreaterThan(0);
  expect(segmentWalkable(nav, start, route[0]!)).toBe(true);
  for (let i = 1; i < route.length; i++)
    expect(segmentWalkable(nav, route[i - 1]!, route[i]!)).toBe(true);
});

it("uses a direct precise route on clear ground and never moves an invalid endpoint", () => {
  const a = fromGround({ x: 500.25, y: 400.75 }),
    b = fromGround({ x: 950.1, y: 400.9 });
  expect(findPath(nav, a, b)).toEqual([b]);
  for (const p of [
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
  ])
    expect(findPath(nav, a, p)).toEqual([]);
});
it("sweeps across very thin obstacles that endpoint sampling would miss", () => {
  const thin = { ...nav, obstacles: [{ x: 700.5, y: 450, rx: 0.05, ry: 20 }] };
  expect(
    segmentWalkable(
      thin,
      fromGround({ x: 700, y: 450 }),
      fromGround({ x: 701, y: 450 }),
    ),
  ).toBe(false);
});
it("enforces actor clearance against walls and prop feet", () => {
  const padded = { ...nav, clearance: 8 };
  expect(canWalk(padded, fromGround({ x: 405, y: 450 }))).toBe(false);
  expect(canWalk(padded, fromGround({ x: 500, y: 450 }))).toBe(true);
  const a = fromGround({ x: 600, y: 512 }),
    b = fromGround({ x: 950, y: 512 });
  let last = a;
  for (const point of findPath(padded, a, b)) {
    expect(segmentWalkable(padded, last, point)).toBe(true);
    last = point;
  }
  expect(last).toEqual(b);
});
it("does not cross a concave boundary even if both endpoints are inside", () => {
  const concave: Navigation = {
    obstacles: [],
    boundary: [
      { x: 400, y: 300 },
      { x: 900, y: 300 },
      { x: 900, y: 700 },
      { x: 750, y: 700 },
      { x: 750, y: 450 },
      { x: 550, y: 450 },
      { x: 550, y: 700 },
      { x: 400, y: 700 },
    ],
  };
  expect(
    segmentWalkable(
      concave,
      fromGround({ x: 500, y: 600 }),
      fromGround({ x: 800, y: 600 }),
    ),
  ).toBe(false);
});

it("matches the exhaustive logical sweep on varied terrain, origins, cell sizes and reversed segments", () => {
  let comparisons = 0,
    clear = 0,
    blocked = 0;
  for (const cellSize of [0.5, 1, 1.75])
    for (const seed of [7, 19]) {
      let state = seed;
      const next = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
      };
      const width = 21,
        height = 17,
        origin = { x: seed === 7 ? 0 : -7.25, y: -3.125 },
        map: AreaMap = {
          area: "haunted-forest",
          seed,
          terrain: {
            width,
            height,
            origin,
            cellSize,
            cells: Array.from({ length: width * height }, (_, i) =>
              i % width > 1 &&
              i % width < width - 2 &&
              Math.floor(i / width) > 1 &&
              Math.floor(i / width) < height - 2 &&
              next() < 0.12
                ? "solid"
                : "ground",
            ),
          },
          objects: [
            {
              id: "blocking",
              position: {
                x: origin.x + 12 * cellSize,
                y: origin.y + 9 * cellSize,
              },
              radius: cellSize * 0.8,
              blocking: true,
              appearance: "rock",
            },
            {
              id: "decorative",
              position: {
                x: origin.x + 5 * cellSize,
                y: origin.y + 6 * cellSize,
              },
              radius: cellSize,
              blocking: false,
              appearance: "earth",
            },
          ],
        },
        logical = areaNavigation(map),
        points = Array.from({ length: 160 }, () => ({
          x:
            origin.x +
            WORLD_ACTOR_RADIUS +
            next() * (width * cellSize - WORLD_ACTOR_RADIUS * 2),
          y:
            origin.y +
            WORLD_ACTOR_RADIUS +
            next() * (height * cellSize - WORLD_ACTOR_RADIUS * 2),
        })).filter((p) => areaWalkable(map, p, WORLD_ACTOR_RADIUS));
      expect(points.length).toBeGreaterThan(60);
      for (const [i, a] of points.entries()) {
        const b = points[(i * 17 + 3) % points.length]!;
        const expected = exhaustiveSegment(map, a, b);
        expect(segmentWalkable(logical, a, b)).toBe(expected);
        expect(segmentWalkable(logical, b, a)).toBe(expected);
        const nearby = { x: a.x + 0.13, y: a.y - 0.08 },
          shortExpected = exhaustiveSegment(map, a, nearby);
        expect(segmentWalkable(logical, a, nearby)).toBe(shortExpected);
        expect(segmentWalkable(logical, nearby, a)).toBe(shortExpected);
        expect(segmentWalkable(logical, a, a)).toBe(true);
        comparisons += 5;
        if (expected) clear++;
        else blocked++;
      }
    }
  expect(comparisons).toBeGreaterThan(1000);
  expect(clear).toBeGreaterThan(50);
  expect(blocked).toBeGreaterThan(100);
});

it("preserves exact near-tangencies, long sweeps and objects beyond the terrain broad phase", () => {
  for (const cellSize of [0.5, 1.75]) {
    const origin = { x: -3.25, y: -7.125 },
      map: AreaMap = {
        area: "haunted-forest",
        seed: 1,
        terrain: {
          width: 9,
          height: 9,
          origin,
          cellSize,
          cells: Array.from({ length: 81 }, (_, i) =>
            i === 40 ? "solid" : "ground",
          ),
        },
        objects: [
          {
            id: "large",
            position: {
              x: origin.x + 1.5 * cellSize,
              y: origin.y + 7 * cellSize,
            },
            radius: cellSize,
            blocking: true,
            appearance: "rock",
          },
        ],
      },
      logical = areaNavigation(map),
      top = origin.y + 4 * cellSize,
      left = origin.x + 4 * cellSize;
    for (const offset of [-1e-7, 0, 1e-7]) {
      const y = top - WORLD_ACTOR_RADIUS + offset,
        a = { x: origin.x + cellSize, y },
        b = { x: origin.x + 8 * cellSize, y };
      const expected = exhaustiveSegment(map, a, b);
      expect(segmentWalkable(logical, a, b)).toBe(expected);
      expect(segmentWalkable(logical, b, a)).toBe(expected);
      if (offset !== 0) expect(expected).toBe(offset < 0);
      const corner = {
        x: left - WORLD_ACTOR_RADIUS / Math.SQRT2 + offset,
        y: top - WORLD_ACTOR_RADIUS / Math.SQRT2 + offset,
      };
      const diagonalA = { x: corner.x - cellSize, y: corner.y + cellSize },
        diagonalB = { x: corner.x + cellSize, y: corner.y - cellSize };
      expect(segmentWalkable(logical, diagonalA, diagonalB)).toBe(
        exhaustiveSegment(map, diagonalA, diagonalB),
      );
    }
    // This object has a radius extending beyond the local terrain scan's row bounds.
    const a = { x: origin.x + 0.5 * cellSize, y: origin.y + 5.8 * cellSize },
      b = { x: origin.x + 3 * cellSize, y: origin.y + 5.8 * cellSize };
    const expected = exhaustiveSegment(map, a, b);
    expect(segmentWalkable(logical, a, b)).toBe(expected);
    expect(expected).toBe(cellSize === 1.75);
    const invalid = { x: origin.x - 1, y: origin.y - 1 };
    expect(segmentWalkable(logical, a, invalid)).toBe(false);
  }
});

it("includes all solid cells when actor clearance spans multiple small cells", () => {
  const map: AreaMap = {
    area: "haunted-forest",
    seed: 0,
    objects: [],
    terrain: {
      width: 21,
      height: 17,
      origin: { x: -2.25, y: -1.125 },
      cellSize: 0.125,
      cells: Array.from({ length: 357 }, (_, i) =>
        i === 178 ? "solid" : "ground",
      ),
    },
  };
  const nav = areaNavigation(map),
    top = map.terrain.origin.y + 8 * map.terrain.cellSize;
  for (const offset of [-1e-7, 0, 1e-7]) {
    const a = { x: -1.95, y: top - WORLD_ACTOR_RADIUS + offset },
      b = { x: 0.075, y: a.y },
      expected = exhaustiveSegment(map, a, b);
    expect(segmentWalkable(nav, a, b)).toBe(expected);
    expect(segmentWalkable(nav, b, a)).toBe(expected);
    if (offset !== 0) expect(expected).toBe(offset < 0);
  }
});
