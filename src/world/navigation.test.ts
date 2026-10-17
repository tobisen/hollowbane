import { expect, it } from "vitest";
import {
  canWalk,
  contains,
  findPath,
  fromGround,
  onGround,
  segmentWalkable,
  type Navigation,
} from "./navigation";
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
