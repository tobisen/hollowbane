import { expect, it } from "vitest";
import { CLOISTER_NAV } from "../content/cloister";
import { canWalk, fromGround, segmentWalkable } from "../world/navigation";
import { commandMovement, type MovementCommand } from "./commands";
import {
  createWalker,
  movementConfig,
  movementFrame,
  moveTick,
} from "./locomotion";
import type { Point } from "../world/isometric";

it("replays a seeded stress trace with rapid retargets, gait changes, stops and keyboard overrides", () => {
  let seed = 0x47ab;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const targets = Array.from({ length: 50 }, () =>
    fromGround({ x: 470 + random() * 650, y: 350 + random() * 290 }),
  );
  const trace: { command: MovementCommand | null; keyboard: Point }[] =
    Array.from({ length: 1000 }, (_, tick) => ({
      command:
        tick % 19 === 0
          ? { type: "stop" }
          : tick % 29 === 0
            ? { type: "gait", gait: tick % 2 ? "walk" : "run" }
            : tick % 13 === 0
              ? {
                  type: "move",
                  target: targets[Math.floor(random() * targets.length)]!,
                }
              : null,
      keyboard:
        tick % 11 < 3
          ? { x: tick % 2 ? 1 : -1, y: tick % 3 ? 1 : -1 }
          : { x: 0, y: 0 },
    }));
  const config = movementConfig({ walkSpeed: 6, runSpeed: 12 });
  const replay = () => {
    let state = createWalker(fromGround({ x: 780, y: 500 }));
    for (const event of trace) {
      const before = JSON.stringify(state);
      const commanded = event.command
        ? commandMovement(state, CLOISTER_NAV, event.command).walker
        : state;
      expect(JSON.stringify(state)).toBe(before);
      const next = moveTick(commanded, CLOISTER_NAV, event.keyboard, config);
      expect(canWalk(CLOISTER_NAV, next.position)).toBe(true);
      expect(segmentWalkable(CLOISTER_NAV, state.position, next.position)).toBe(
        true,
      );
      expect(next.speed).toBeLessThanOrEqual(12);
      expect(movementFrame(next, false, config)).toBeGreaterThanOrEqual(0);
      expect(movementFrame(next, false, config)).toBeLessThan(64);
      state = JSON.parse(JSON.stringify(next)) as typeof state;
    }
    return state;
  };
  expect(replay()).toEqual(replay());
});
it("completes routes around both sides of authored obstacles with no persistent oscillation", () => {
  const points = [
    { x: 1020, y: 440 },
    { x: 1020, y: 525 },
    { x: 610, y: 625 },
    { x: 610, y: 545 },
    { x: 780, y: 500 },
  ];
  let state = {
    ...createWalker(fromGround({ x: 780, y: 500 })),
    gait: "run" as "run" | "walk",
  };
  for (const point of points) {
    const target = fromGround(point);
    expect(canWalk(CLOISTER_NAV, target)).toBe(true);
    state = commandMovement(state, CLOISTER_NAV, {
      type: "move",
      target,
    }).walker;
    let ticks = 0;
    while (state.route.length && ticks++ < 600)
      state = moveTick(state, CLOISTER_NAV);
    expect(ticks).toBeLessThan(600);
    expect(state.position.x).toBeCloseTo(target.x, 8);
    expect(state.position.y).toBeCloseTo(target.y, 8);
    const arrived = state.position;
    for (let i = 0; i < 60; i++) state = moveTick(state, CLOISTER_NAV);
    expect(state.position).toEqual(arrived);
    expect(state.motion).toBe("idle");
  }
});
