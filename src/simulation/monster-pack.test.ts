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

it("reserves at most three simultaneous melee commits, including commands queued this tick", async () => {
  const { stepMonsterAI } = await import("./monster-ai");
  const { stepCombat } = await import("./combat");
  const w = createCombat();
  w.actors = w.actors.slice(0, 1);
  w.hostilesActive = false;
  w.actors[0]!.invulnerableUntil = 10000;
  const p = w.actors[0]!.controller.walker.position;
  const brains = [];
  for (let i = 1; i <= 8; i++) {
    const m = createMonster(i, "melee", {
      x: p.x + Math.cos(i) * 0.75,
      y: p.y + Math.sin(i) * 0.75,
    });
    m.brain.state = "chase";
    m.brain.threat = 0;
    m.brain.seenAt = 0;
    m.brain.lastSeen = { ...p };
    m.brain.nextThink = 0;
    w.actors.push(m.actor);
    brains.push(m.brain);
  }
  for (let i = 0; i < 150; i++) {
    stepMonsterAI(w, brains, ARENA_NAV);
    stepCombat(w);
    expect(
      w.actors.filter(
        (a) =>
          a.id !== 0 &&
          ["windup", "active", "recovery"].includes(
            a.controller.timeline.phase,
          ),
      ).length,
    ).toBeLessThanOrEqual(3);
  }
});
