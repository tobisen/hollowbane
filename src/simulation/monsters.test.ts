import { expect, it } from "vitest";
import { createMonster, MONSTER_PROFILES, type MonsterRole } from "./monsters";
it("creates independent deterministic serializable monsters with distinct rhythms", () => {
  for (const role of Object.keys(MONSTER_PROFILES) as MonsterRole[]) {
    const a = createMonster(8, role, { x: 1, y: 2 });
    expect(a).toEqual(createMonster(8, role, { x: 1, y: 2 }));
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    a.actor.controller.walker.position.x = 9;
    expect(a.brain.home.x).toBe(1);
    expect(a.actor.weapon).toBe(
      MONSTER_PROFILES[role].projectile ? "projectile" : "melee",
    );
  }
});
it("champions scale existing stats and invalid identities fail early", () => {
  const a = createMonster(1, "melee", { x: 0, y: 0 }, 0, 42, true);
  expect(a.actor.maxHp).toBe(162);
  expect(a.actor.offense.damage).toBe(12.5);
  expect(() => createMonster(0, "tank", { x: 0, y: 0 })).toThrow();
  expect(() => createMonster(1, "tank", { x: NaN, y: 0 })).toThrow();
});
