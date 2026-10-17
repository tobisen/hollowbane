import { describe, it, expect } from "vitest";
import { createWalker, moveTick } from "./locomotion";
import { ARENA_NAV } from "./combat";
describe("analog established movement", () => {
  it("scales speed and replaces all queued destinations on direct input", () => {
    let w = createWalker({ x: 0, y: 0 });
    w.route = [{ x: 1, y: 0 }];
    w.queuedTargets = [{ x: 2, y: 0 }];
    w = moveTick(w, ARENA_NAV, { x: 1, y: 0 }, undefined, 0.25);
    expect(w.speed).toBe(0.75);
    expect(w.route).toEqual([]);
    expect(w.queuedTargets).toEqual([]);
  });
  it("neutral analog scale does not change keyboard/click defaults or permit collision tunneling", () => {
    const w = createWalker({ x: 0, y: 0 });
    expect(() =>
      moveTick(w, ARENA_NAV, { x: 1, y: 0 }, undefined, 2),
    ).toThrow();
    expect(moveTick(w, ARENA_NAV, { x: 1, y: 0 })).toEqual(
      moveTick(w, ARENA_NAV, { x: 1, y: 0 }, undefined, 1),
    );
    let a = w;
    for (let i = 0; i < 2000; i++)
      a = moveTick(a, ARENA_NAV, { x: 1, y: 0 }, undefined, 0.7);
    expect(a.position.x).toBeLessThan(10);
  });
});
