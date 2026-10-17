import { expect, it } from "vitest";
import { ARENA_NAV, createCombat, stepCombat } from "./combat";
import { fromGround } from "../world/navigation";
import { createMonster, type MonsterRole } from "./monsters";
import { stepMonsterAI, transitionMonster } from "./monster-ai";
function fixture(role: MonsterRole = "melee", x = 720) {
  const world = createCombat();
  const m = createMonster(1, role, fromGround({ x, y: 560 }));
  world.actors = [world.actors[0]!, m.actor];
  world.hostilesActive = false;
  return { world, ...m };
}
function tick(f: ReturnType<typeof fixture>, count = 1) {
  for (let i = 0; i < count; i++) {
    stepMonsterAI(f.world, [f.brain], ARENA_NAV);
    stepCombat(f.world);
  }
}
it("alerts then uses committed existing attack timing with deterministic replay", () => {
  const a = fixture(),
    b = structuredClone(a);
  tick(a, 25);
  expect(a.world.events.filter((e) => e.kind === "damage")).toHaveLength(0);
  tick(a, 200);
  tick(b, 225);
  expect(a).toEqual(b);
  expect(a.world.events.some((e) => e.kind === "damage")).toBe(true);
});
it("ranged archetypes retreat when crowded and launch actual timed projectiles", () => {
  const f = fixture("ranged", 710);
  tick(f, 40);
  expect(f.brain.state).toBe("retreat");
  tick(f, 250);
  expect(f.world.events.some((e) => e.kind === "launch")).toBe(true);
});
it("return leash clears threat, target death stops attacks and dead is terminal", () => {
  const f = fixture();
  tick(f, 100);
  f.world.actors[0]!.hp = 0;
  tick(f, 10);
  expect(f.brain.threat).toBeNull();
  expect(["return", "idle"]).toContain(f.brain.state);
  f.actor.hp = 0;
  tick(f);
  expect(f.brain.state).toBe("dead");
  expect(() => transitionMonster(f.brain, "idle", 500)).toThrow();
});
it("hitstun and recovery cannot be cancelled by AI decisions", () => {
  const f = fixture();
  f.actor.controller.timeline.phase = "hitstun";
  f.actor.controller.timeline.remaining = 20;
  stepMonsterAI(f.world, [f.brain], ARENA_NAV);
  expect(f.actor.controller.timeline.remaining).toBe(20);
  expect(f.actor.controller.attacking).toBe(false);
});

it("patrol completes multiple legs instead of retaining an already-reached cached goal", () => {
  const f = fixture();
  f.world.actors[0]!.hp = 0;
  tick(f, 700);
  expect(f.brain.patrolIndex).toBeGreaterThan(2);
});
