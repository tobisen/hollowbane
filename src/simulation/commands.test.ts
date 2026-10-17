import { expect, it } from "vitest";
import { commandMovement, MAX_QUEUED_MOVES } from "./commands";
import { createWalker, moveTick } from "./locomotion";
import { fromGround, type Navigation } from "../world/navigation";
const nav: Navigation = {
  boundary: [
    { x: 400, y: 300 },
    { x: 1100, y: 300 },
    { x: 1100, y: 700 },
    { x: 400, y: 700 },
  ],
  obstacles: [],
};
const initial = createWalker(fromGround({ x: 768, y: 512 }));
it("uses latest-wins replacement; stop clears all state and face stops before turning", () => {
  const a = commandMovement(initial, nav, {
    type: "move",
    target: fromGround({ x: 900, y: 512 }),
  }).walker;
  const b = commandMovement(a, nav, {
    type: "move",
    target: fromGround({ x: 600, y: 512 }),
  }).walker;
  expect(b.route.at(-1)).toEqual(fromGround({ x: 600, y: 512 }));
  const faced = commandMovement(b, nav, {
    type: "face",
    target: fromGround({ x: 600, y: 512 }),
  }).walker;
  expect(faced.direction).toBe(2);
  expect(faced.route).toEqual([]);
  expect(faced.speed).toBe(0);
  expect(
    commandMovement(b, nav, { type: "stop" }).walker.queuedTargets,
  ).toEqual([]);
});
it("runs queued waypoints in event order without stale movement after override", () => {
  let state = commandMovement(initial, nav, {
    type: "move",
    target: fromGround({ x: 800, y: 512 }),
  }).walker;
  state = commandMovement(state, nav, {
    type: "move",
    target: fromGround({ x: 850, y: 512 }),
    queue: true,
  }).walker;
  const replay = () => {
    let s = state;
    for (let i = 0; i < 120; i++) s = moveTick(s, nav);
    return s;
  };
  expect(replay()).toEqual(replay());
  expect(replay().position).toEqual(fromGround({ x: 850, y: 512 }));
  const overridden = moveTick(state, nav, { x: -1, y: 0 });
  expect(overridden.queuedTargets).toEqual([]);
  expect(overridden.route).toEqual([]);
});
it("bounds explicit queues and preserves accepted movement when a command is rejected", () => {
  let state = commandMovement(initial, nav, {
    type: "move",
    target: fromGround({ x: 800, y: 512 }),
  }).walker;
  for (let i = 0; i < MAX_QUEUED_MOVES; i++)
    state = commandMovement(state, nav, {
      type: "move",
      target: fromGround({ x: 810 + i, y: 512 }),
      queue: true,
    }).walker;
  expect(
    commandMovement(state, nav, {
      type: "move",
      target: fromGround({ x: 900, y: 512 }),
      queue: true,
    }).feedback,
  ).toBe("queue-full");
  expect(
    commandMovement(state, nav, { type: "move", target: { x: NaN, y: 0 } })
      .walker,
  ).toBe(state);
  expect(
    commandMovement(state, nav, {
      type: "move",
      target: fromGround({ x: 0, y: 0 }),
    }).walker,
  ).toBe(state);
});
