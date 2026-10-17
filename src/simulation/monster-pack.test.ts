import { expect, it } from "vitest";
import { ARENA_NAV, createCombat } from "./combat";
import { createMonster } from "./monsters";
import { rallyPacks, separateMonsters } from "./monster-pack";
import { fromGround, canWalk } from "../world/navigation";
it("rallies only same-pack visible neighbors and never relays unseen memory", () => {
  const w = createCombat(),
    a = createMonster(1, "support", fromGround({ x: 710, y: 560 }), 1),
    b = createMonster(2, "melee", fromGround({ x: 750, y: 560 }), 1),
    c = createMonster(3, "melee", fromGround({ x: 760, y: 560 }), 2);
  w.actors = [w.actors[0]!, a.actor, b.actor, c.actor];
  a.brain.threat = 0;
  expect(rallyPacks(w, [a.brain, b.brain, c.brain], ARENA_NAV)).toBe(1);
  expect(b.brain.threat).toBe(0);
  expect(c.brain.threat).toBeNull();
  b.brain.threat = null;
  const nav = { ...ARENA_NAV, obstacles: [{ x: 675, y: 560, rx: 5, ry: 30 }] };
  expect(rallyPacks(w, [a.brain, b.brain], nav)).toBe(0);
});
it("separates overlapping idle monsters deterministically without moving player or committed actors", () => {
  const w = createCombat();
  const p = w.actors[0]!.controller.walker.position;
  const a = createMonster(1, "melee", p),
    b = createMonster(2, "tank", p);
  w.actors = [w.actors[0]!, a.actor, b.actor];
  b.actor.controller.timeline.phase = "windup";
  const original = structuredClone(w),
    copy = structuredClone(w);
  for (let i = 0; i < 10; i++) {
    separateMonsters(w, ARENA_NAV);
    separateMonsters(copy, ARENA_NAV);
  }
  expect(w).toEqual(copy);
  expect(w.actors[0]).toEqual(original.actors[0]);
  expect(b.actor.controller.walker.position).toEqual(
    original.actors[2]!.controller.walker.position,
  );
  expect(a.actor.controller.walker.position).not.toEqual(p);
  expect(canWalk(ARENA_NAV, a.actor.controller.walker.position)).toBe(true);
});
