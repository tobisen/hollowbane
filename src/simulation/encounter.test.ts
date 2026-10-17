import { expect, it } from "vitest";
import {
  createEncounter,
  despawnMonster,
  ENCOUNTER_NAV,
  spawnMonster,
  stepEncounter,
} from "./encounter";
import { canWalk } from "../world/navigation";
it("composes 5/10/20/30/50 safely and replays mixed encounters exactly", () => {
  for (const count of [5, 10, 20, 30, 50]) {
    const a = createEncounter(count, 123);
    a.combat.actors[0]!.invulnerableUntil = 100000;
    const b = structuredClone(a);
    expect(a.brains).toHaveLength(count);
    expect(a.brains.filter((b) => b.champion)).toHaveLength(1);
    for (let i = 0; i < 600; i++) {
      stepEncounter(a);
      stepEncounter(b);
      expect(a.work.pathRequests).toBeLessThanOrEqual(2);
    }
    expect(a).toEqual(b);
    expect(
      a.combat.actors.every((a) =>
        canWalk(ENCOUNTER_NAV, a.controller.walker.position),
      ),
    ).toBe(true);
  }
});
it("corpses expire on ticks, safely clear selection and never reuse identities", () => {
  const e = createEncounter();
  e.corpseTicks = 3;
  const a = e.combat.actors[1]!;
  a.hp = 0;
  e.combat.actors[0]!.controller.selected = a.id;
  stepEncounter(e);
  expect(e.brains[0]!.state).toBe("dead");
  expect(e.brains[0]!.deathAt).toBe(1);
  stepEncounter(e);
  stepEncounter(e);
  expect(e.combat.actors.some((x) => x.id === a.id)).toBe(true);
  stepEncounter(e);
  expect(e.combat.actors.some((x) => x.id === a.id)).toBe(false);
  expect(e.combat.actors[0]!.controller.selected).toBeNull();
  const id = spawnMonster(e, "melee", a.controller.walker.position, 0);
  expect(id).toBe(6);
  despawnMonster(e, 0);
  expect(e.combat.actors[0]!.id).toBe(0);
});
it("rejects invalid counts, blocked spawns and occupied slots", () => {
  const e = createEncounter();
  expect(() => createEncounter(51)).toThrow();
  expect(spawnMonster(e, "melee", { x: 100, y: 100 }, 0)).toBeNull();
  expect(
    spawnMonster(e, "tank", e.combat.actors[0]!.controller.walker.position, 0),
  ).toBeNull();
});
