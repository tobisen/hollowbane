import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createWalker, moveTick, retarget } from "../simulation/locomotion";
import { canWalk, findPath, segmentWalkable } from "./navigation";
import {
  visualNavigation,
  visualReviewStops,
  visualFromGround,
  visualOnGround,
  visualCamera,
  visualActorFrame,
  visualOccluders,
  VISUAL_SPAWN,
} from "./visual-foundation";

it("pins the user-approved raster rather than silently accepting replacement art", () => {
  const bytes = readFileSync(
    new URL(
      "../../experiments/visual-foundation/review/actual-1280x800.png",
      import.meta.url,
    ),
  );
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    "c4c39c505631ad26e5ec400d060bce158d32b56ade80a8e650c64cac0b880589",
  );
});

it("keeps every review route on visible navigable ground with real pathfinding", () => {
  const start = visualFromGround(VISUAL_SPAWN);
  expect(canWalk(visualNavigation, start)).toBe(true);
  for (const stop of Object.values(visualReviewStops)) {
    const end = visualFromGround(stop);
    expect(canWalk(visualNavigation, end), JSON.stringify(stop)).toBe(true);
    if (stop === VISUAL_SPAWN) continue;
    const path = findPath(visualNavigation, start, end);
    expect(path.length, JSON.stringify(stop)).toBeGreaterThan(0);
    let previous = start;
    for (const point of path) {
      expect(segmentWalkable(visualNavigation, previous, point)).toBe(true);
      previous = point;
    }
    let walker = retarget(createWalker(start), visualNavigation, end);
    for (let tick = 0; tick < 1200 && walker.route.length; tick++)
      walker = moveTick(walker, visualNavigation);
    expect(
      Math.hypot(walker.position.x - end.x, walker.position.y - end.y),
    ).toBeLessThan(0.001);
  }
});

it("blocks visible wall/trunk/rock footings rather than entire tree crowns", () => {
  for (const obstacle of visualNavigation.obstacles)
    expect(canWalk(visualNavigation, visualFromGround(obstacle))).toBe(false);
  for (const point of [
    { x: 1070, y: 491 },
    { x: 1032, y: 690 },
    { x: 345, y: 320 },
  ])
    expect(canWalk(visualNavigation, visualFromGround(point))).toBe(true);
  expect(canWalk(visualNavigation, visualFromGround({ x: 50, y: 790 }))).toBe(
    false,
  );
});

it("uses existing eight-direction movement and a distance-driven authored walk clip", () => {
  const directions = new Set<number>();
  for (const input of [
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]) {
    let walker = createWalker(visualFromGround(VISUAL_SPAWN));
    for (let i = 0; i < 8; i++)
      walker = moveTick(walker, visualNavigation, input);
    expect(walker.walking).toBe(true);
    directions.add(walker.direction);
    expect(visualActorFrame(walker, 0)).toBeGreaterThanOrEqual(8);
    expect(visualActorFrame(walker, 0)).toBeLessThan(24);
    const root = visualOnGround(walker.position);
    expect(root.x).toBeGreaterThan(0);
    expect(root.y).toBeLessThan(800);
    for (let i = 0; i < 8; i++) walker = moveTick(walker, visualNavigation);
    expect(walker.walking).toBe(false);
  }
  expect(directions.size).toBe(8);
});

it("clamps integer camera samples to authored coverage and keeps stable layer anchors", () => {
  for (const target of [
    { x: -500, y: -500 },
    { x: 620, y: 495 },
    { x: 5000, y: 5000 },
  ]) {
    const c = visualCamera(target, { x: 960, y: 600 });
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x).toBeLessThanOrEqual(320);
    expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.y).toBeLessThanOrEqual(200);
    expect(Number.isInteger(c.x) && Number.isInteger(c.y)).toBe(true);
    expect(visualCamera(target, { x: 1280, y: 800 })).toEqual({ x: 0, y: 0 });
  }
  expect(new Set(visualOccluders.map((l) => l.id)).size).toBe(
    visualOccluders.length,
  );
  const branch = visualOccluders.find((l) => l.id === "foreground-foliage")!;
  expect(visualReviewStops.behind.y).toBeLessThan(branch.anchor.y);
  expect(visualReviewStops.front.y).toBeGreaterThan(branch.anchor.y);
});
