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
  expect(route.length).toBeGreaterThan(3);
  for (let i = 1; i < route.length; i++)
    expect(segmentWalkable(nav, route[i - 1]!, route[i]!)).toBe(true);
  expect(findPath(nav, start, fromGround({ x: 0, y: 0 }))).toEqual([]);
});
it("returns identical paths for identical inputs", () => {
  const a = fromGround({ x: 600, y: 450 }),
    b = fromGround({ x: 950, y: 600 });
  expect(findPath(nav, a, b)).toEqual(findPath(nav, a, b));
});
