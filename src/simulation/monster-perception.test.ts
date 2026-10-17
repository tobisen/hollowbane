import { expect, it } from "vitest";
import { ARENA_NAV, createCombat } from "./combat";
import { createMonster } from "./monsters";
import { perceive, planMonsterPath } from "./monster-perception";
import { fromGround } from "../world/navigation";
function fixture() {
  const w = createCombat();
  const m = createMonster(1, "melee", fromGround({ x: 700, y: 560 }));
  w.actors = [w.actors[0]!, m.actor];
  return { w, ...m };
}
it("acquires line-of-sight threats, remembers last seen, forgets after timeout/death", () => {
  const { w, actor, brain } = fixture();
  expect(perceive(w, actor, brain, ARENA_NAV).visible).toBe(true);
  const blocked = {
    ...ARENA_NAV,
    obstacles: [{ x: 675, y: 560, rx: 5, ry: 30 }],
  };
  w.tick = 1;
  expect(perceive(w, actor, brain, blocked).remembered).toBe(true);
  const seen = { ...brain.lastSeen! };
  w.actors[0]!.controller.walker.position.x += 0.5;
  perceive(w, actor, brain, blocked);
  expect(brain.lastSeen).toEqual(seen);
  w.tick = 181;
  expect(perceive(w, actor, brain, blocked).target).toBeNull();
  w.actors[0]!.hp = 0;
  expect(perceive(w, actor, brain, ARENA_NAV).target).toBeNull();
});
it("does not detect through walls and respects home leash", () => {
  const { w, actor, brain } = fixture();
  const nav = { ...ARENA_NAV, obstacles: [{ x: 675, y: 560, rx: 5, ry: 30 }] };
  expect(perceive(w, actor, brain, nav).target).toBeNull();
  actor.controller.walker.position.x += 11;
  expect(perceive(w, actor, brain, ARENA_NAV).leashed).toBe(true);
});
it("shares a bounded path budget, caches goals and backs off failed requests", () => {
  const { actor, brain } = fixture();
  const budget = { remaining: 1, requests: 0 };
  const goal = fromGround({ x: 850, y: 600 });
  expect(planMonsterPath(actor, brain, ARENA_NAV, goal, 0, budget)).toBe(true);
  expect(budget.remaining).toBe(0);
  expect(brain.pathRequests).toBe(1);
  expect(
    planMonsterPath(actor, brain, ARENA_NAV, goal, 60, {
      remaining: 2,
      requests: 0,
    }),
  ).toBe(false);
  expect(
    planMonsterPath(actor, brain, ARENA_NAV, { x: 100, y: 100 }, 60, {
      remaining: 2,
      requests: 0,
    }),
  ).toBe(true);
  expect(actor.controller.walker.route).toEqual([]);
  expect(
    planMonsterPath(actor, brain, ARENA_NAV, goal, 61, {
      remaining: 2,
      requests: 0,
    }),
  ).toBe(false);
});
