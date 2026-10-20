import { expect, it } from "vitest";
import { worldLayout } from "../../src/simulation/world-layout";
import { exitNear } from "../../src/simulation/area-anchors";
import {
  areaNavigation,
  canWalk,
  findPath,
  segmentWalkable,
} from "../../src/world/navigation";
import {
  createWalker,
  moveTick,
  type Walker,
} from "../../src/simulation/locomotion";
import { processStick } from "../../src/simulation/analog";

const layout = worldLayout("haunted-forest", 42, 2);
const nav = areaNavigation(layout.map);
const destination = { x: 0, y: 7.25 };
const recorded = { x: 0.0032820886267307873, y: 7.151645296907083 };

/** Same stick projection/gain and existing simulation as the browser driver.
 * Host observations may be delayed; the repaired controller steers every frame. */
function replay(
  hostCadence: number,
  frameControl: boolean,
  interrupt = false,
  frameCadence = 1,
) {
  let walker: Walker = { ...createWalker({ x: 0, y: 6 }), gait: "run" };
  let arrived = false;
  let raw = { x: 0, y: 0 };
  const trace = [];
  for (let tick = 0; tick < 600; tick++) {
    const paused = interrupt && tick >= 8 && tick < 38;
    if (tick % (frameControl ? frameCadence : hostCadence) === 0) {
      const dx = destination.x - walker.position.x;
      const dy = destination.y - walker.position.y;
      const distance = Math.hypot(dx, dy);
      arrived ||= distance < 0.1;
      const sx = dx - dy,
        sy = (dx + dy) / 2;
      const length = Math.hypot(sx, sy),
        scale = Math.min(1, distance * 4);
      raw =
        arrived || paused
          ? { x: 0, y: 0 }
          : { x: (sx / length) * scale, y: (sy / length) * scale };
    }
    const move = processStick(raw.x, raw.y);
    const previous = walker.position;
    walker = moveTick(walker, nav, move, undefined, Math.hypot(move.x, move.y));
    trace.push({
      tick,
      position: walker.position,
      destination,
      raw,
      blocked: !segmentWalkable(nav, previous, walker.position),
      arrived,
    });
    if (arrived && tick % hostCadence === 0) break;
  }
  return { walker, arrived, trace };
}

it("reproduces stale host steering oscillation at the exact clear forest waypoint", () => {
  expect(canWalk(nav, recorded)).toBe(true);
  expect(canWalk(nav, destination)).toBe(true);
  expect(segmentWalkable(nav, recorded, destination)).toBe(true);
  expect(exitNear(layout, recorded)).toBeNull();
  expect(findPath(nav, recorded, destination)).toEqual([destination]);
  const old = replay(12, false);
  expect(old.arrived).toBe(false);
  expect(old.trace.every((step) => !step.blocked)).toBe(true);
  expect(old.trace.at(-1)!.position.y).toBeGreaterThan(destination.y);
  expect(old.trace.at(-13)!.position.y).toBeLessThan(destination.y);
});

it("detects arrival and releases the stick between delayed host observations", () => {
  for (const cadence of [2, 6, 12, 18, 30]) {
    // Runtime caps one rendered update at six simulation ticks (100 ms).
    for (const frameCadence of [1, 2, 6]) {
      const result = replay(cadence, true, false, frameCadence);
      expect(result.arrived).toBe(true);
      expect(
        Math.hypot(
          result.walker.position.x,
          result.walker.position.y - destination.y,
        ),
      ).toBeLessThan(0.1);
      expect(result.trace.every((step) => !step.blocked)).toBe(true);
      expect(result.trace.at(-1)!.raw).toEqual({ x: 0, y: 0 });
    }
  }
});

it("resumes the clear segment after a neutral-input interruption without changing the waypoint", () => {
  const result = replay(12, true, true);
  expect(
    result.trace
      .slice(8, 38)
      .every((step) => step.raw.x === 0 && step.raw.y === 0),
  ).toBe(true);
  expect(result.arrived).toBe(true);
  expect(
    Math.hypot(
      result.walker.position.x,
      result.walker.position.y - destination.y,
    ),
  ).toBeLessThan(0.1);
});
