import { expect, it } from "vitest";
import { directionFor, moveTick, retarget, type Walker } from "./locomotion";
import { fromGround, canWalk, type Navigation } from "../world/navigation";
const nav: Navigation = {
  boundary: [
    { x: 400, y: 300 },
    { x: 1100, y: 300 },
    { x: 1100, y: 700 },
    { x: 400, y: 700 },
  ],
  obstacles: [],
};
const initial: Walker = {
  position: fromGround({ x: 768, y: 512 }),
  route: [],
  direction: 0,
  walking: false,
  tick: 0,
};
it("maps eight screen directions onto eight animation rows", () => {
  const vectors = [
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ];
  expect(vectors.map(directionFor)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});
it("replays a click route and stops at a reachable goal", () => {
  const target = fromGround({ x: 950, y: 580 });
  const replay = () => {
    let walker = retarget(initial, nav, target);
    for (let i = 0; i < 240; i++) walker = moveTick(walker, nav);
    return walker;
  };
  const result = replay();
  expect(result).toEqual(replay());
  expect(result.position.x).toBeCloseTo(target.x);
  expect(result.position.y).toBeCloseTo(target.y);
  expect(result.walking).toBe(false);
  expect(initial.position).toEqual(fromGround({ x: 768, y: 512 }));
});
it("keyboard overrides a route and cannot escape the walkable boundary", () => {
  let state = retarget(initial, nav, fromGround({ x: 900, y: 560 }));
  state = moveTick(state, nav, { x: -1, y: 0 });
  expect(state.route).toEqual([]);
  expect(state.direction).toBe(2);
  for (let i = 0; i < 1000; i++) state = moveTick(state, nav, { x: -1, y: 0 });
  expect(canWalk(nav, state.position)).toBe(true);
});
it("retargets immediately instead of buffering stale destinations", () => {
  const old = retarget(initial, nav, fromGround({ x: 900, y: 550 }));
  const changed = retarget(old, nav, fromGround({ x: 600, y: 450 }));
  expect(changed.route.at(-1)).toEqual(fromGround({ x: 600, y: 450 }));
  expect(changed.tick).toBe(initial.tick);
});
