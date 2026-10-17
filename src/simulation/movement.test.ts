import { expect, it } from "vitest";
import {
  createWalker,
  MOVEMENT,
  movementConfig,
  movementFrame,
  moveTick,
  stopWalker,
} from "./locomotion";
import { fromGround, type Navigation } from "../world/navigation";
const nav: Navigation = {
  boundary: [
    { x: -10000, y: -10000 },
    { x: 10000, y: -10000 },
    { x: 10000, y: 10000 },
    { x: -10000, y: 10000 },
  ],
  obstacles: [],
};
it("moves on the first tick, reaches configured speed and reverses without turn lag", () => {
  const initial = createWalker(fromGround({ x: 768, y: 512 }));
  const first = moveTick(initial, nav, { x: 1, y: 0 });
  expect(first.motion).toBe("move");
  expect(first.speed).toBe(MOVEMENT.walkSpeed);
  const reversed = moveTick(first, nav, { x: -1, y: 0 });
  expect(reversed.position.x).toBeCloseTo(initial.position.x);
  expect(reversed.direction).toBe(2);
  expect(initial.tick).toBe(0);
});
it("normalizes diagonals, accelerates running within two ticks and decelerates safely", () => {
  const initial = { ...createWalker({ x: 0, y: 0 }), gait: "run" as const };
  const a = moveTick(moveTick(initial, nav, { x: 1, y: 0 }), nav, {
    x: 1,
    y: 0,
  });
  const b = moveTick(moveTick(initial, nav, { x: 1, y: 1 }), nav, {
    x: 1,
    y: 1,
  });
  expect(a.speed).toBe(5.4);
  expect(a.distance).toBeCloseTo(b.distance);
  const slowing = moveTick(a, nav);
  expect(slowing.speed).toBeLessThan(a.speed);
  expect(moveTick(slowing, nav).motion).toBe("idle");
  expect(stopWalker(a).speed).toBe(0);
});
it("animation follows actual distance and facing rather than global frame cadence", () => {
  const a = createWalker({ x: 0, y: 0 });
  expect(
    movementFrame({ ...a, walking: true, distance: 0.7, direction: 3 }, false),
  ).toBe(28);
  expect(
    movementFrame(
      { ...a, tick: 600, walking: true, distance: 0.7, direction: 3 },
      false,
    ),
  ).toBe(28);
  expect(movementFrame({ ...a, direction: 7 }, true)).toBe(56);
});
it("validates external speed, acceleration and stride tuning", () => {
  expect(movementConfig({ walkSpeed: 2 }).walkSpeed).toBe(2);
  for (const v of [0, -1, Infinity, NaN, 99])
    expect(() => movementConfig({ runSpeed: v })).toThrow(RangeError);
});
