import { fromGround } from "../world/navigation";
import { it, expect } from "vitest";
import {
  createCombat,
  stepCombat,
  applyCombatHit,
  enableCombatHitTrace,
  ARENA_NAV,
} from "./combat";
import { commandCombat } from "./combat-targeting";
import { createSkills, requestSkill, stepSkillCombat } from "./skills";
it("records typed melee/projectile roots without changing legacy damage, timing or RNG", () => {
  for (const weapon of ["melee", "projectile"] as const) {
    const plain = createCombat(),
      traced = createCombat();
    enableCombatHitTrace(traced);
    for (const world of [plain, traced]) {
      world.hostilesActive = false;
      world.actors[0]!.weapon = weapon;
      world.actors[0]!.range = weapon === "melee" ? 1.05 : 6;
      world.actors[0]!.controller = commandCombat(world.actors[0]!.controller, {
        kind: "attack",
        target: 1,
        repeat: true,
      });
    }
    for (let tick = 0; tick < 150; tick++) {
      stepCombat(plain, ARENA_NAV);
      stepCombat(traced, ARENA_NAV);
    }
    expect(traced.seed).toBe(plain.seed);
    expect(traced.events).toEqual(plain.events);
    expect(traced.actors).toEqual(plain.actors);
    expect(traced.hitTrace!.pending.length).toBeGreaterThan(0);
    expect(
      traced.hitTrace!.pending.every(
        (e) => e.origin === "weapon" && e.weapon === weapon,
      ),
    ).toBe(true);
    expect(traced.hitTrace!.pending.map((e) => e.sequence)).toEqual(
      traced.hitTrace!.pending.map((_, i) => i),
    );
  }
});
it("records bounded actual health damage/death once and ignores immune/dead targets", () => {
  const w = createCombat(),
    a = w.actors[0]!,
    t = w.actors[1]!;
  enableCombatHitTrace(w);
  t.invulnerableUntil = 10;
  applyCombatHit(w, a, t, ARENA_NAV);
  expect(w.hitTrace!.pending).toHaveLength(0);
  t.invulnerableUntil = 0;
  t.hp = 3;
  applyCombatHit(w, a, t, ARENA_NAV, {
    damage: 1000,
    element: "fire",
    guaranteed: true,
    origin: "proc",
  });
  expect(w.hitTrace!.pending[0]).toMatchObject({
    origin: "proc",
    damage: 3,
    killed: true,
  });
  applyCombatHit(w, a, t, ARENA_NAV);
  expect(w.hitTrace!.pending).toHaveLength(1);
  expect(w.events.filter((e) => e.kind === "death")).toHaveLength(1);
  const before = structuredClone(w);
  w.hitTrace!.next = Number.MAX_SAFE_INTEGER;
  w.actors[2]!.hp = 100;
  const seed = w.seed;
  expect(() => applyCombatHit(w, a, w.actors[2]!, ARENA_NAV)).toThrow(
    /drained/,
  );
  expect(w.seed).toBe(seed);
  expect(w.actors[2]!.hp).toBe(100);
  expect(before.hitTrace!.pending).toEqual(w.hitTrace!.pending);
});
it("distinguishes skill impacts and poison ticks with the original skill identity", () => {
  const w = createCombat();
  w.hostilesActive = false;
  enableCombatHitTrace(w);
  w.actors[1]!.controller.walker.position = fromGround({ x: 682, y: 560 });
  w.actors[1]!.hp = w.actors[1]!.maxHp = 1000;
  w.actors[1]!.defense = { defense: 0, armor: 0, physicalResistance: 0 };
  const r = createSkills(w);
  requestSkill(r, {
    actor: 0,
    skill: "briar-edge",
    target: 1,
    direction: { x: 1, y: 0 },
  });
  for (let tick = 0; tick < 240; tick++) stepSkillCombat(r);
  expect(
    w.hitTrace!.pending.some(
      (e) => e.origin === "skill" && e.skill === "briar-edge",
    ),
  ).toBe(true);
  expect(
    w.hitTrace!.pending.some(
      (e) => e.origin === "dot" && e.skill === "briar-edge",
    ),
  ).toBe(true);
  expect(
    w
      .hitTrace!.pending.filter((e) => e.origin === "dot")
      .every((e) => e.element === "poison"),
  ).toBe(true);
});
