import { expect, it } from "vitest";
import { InventoryRuntime } from "./inventory-runtime";
import { createCombat, applyCombatHit, ARENA_NAV } from "../simulation/combat";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../simulation/skills";
import { createCharacterInventory } from "../simulation/equipment";
import { createLootWorld } from "../simulation/world-loot";
import { generateLoot, type GeneratedItem } from "../simulation/loot";
import {
  ADVANCED_CONTENT,
  AFFIX_ITEM_CONTENT,
} from "../simulation/item-registry";
import { identifyItem } from "../simulation/item-save";
function unique(sequence: number) {
  return identifyItem(
    generateLoot(
      { seed: 42, sequence, areaLevel: 12, monsterLevel: 12, table: "sanctum" },
      ADVANCED_CONTENT,
    )!,
  );
}
function castRing(start: number): GeneratedItem {
  for (let sequence = start; sequence < 100000; sequence++) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 40, monsterLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (
      i?.base === "copper-band" &&
      i.advanced?.modifiers.some(
        (m) => m.kind === "stat" && m.stat === "castSpeed" && m.value >= 10,
      )
    )
      return identifyItem(i);
  }
  throw Error("Missing ring");
}
function recoveryHelm(): GeneratedItem {
  for (let sequence = 0; sequence < 100000; sequence++) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 40, monsterLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (
      i?.base === "iron-cap" &&
      i.advanced?.modifiers.some(
        (m) => m.kind === "stat" && m.stat === "hitRecovery" && m.value >= 12,
      )
    )
      return identifyItem(i);
  }
  throw Error("Missing helmet");
}
it("bridges real equipment casting/recovery breakpoints without resetting commitment or refilling resources", () => {
  const world = createCombat(),
    skills = createSkills(world),
    a = world.actors[0]!,
    user = skills.users[0]!;
  world.hostilesActive = false;
  let loot = createLootWorld(42);
  const runtime = new InventoryRuntime(
    () => a,
    () => user,
    () => loot,
    (next) => {
      loot = next;
    },
  );
  const c = createCharacterInventory(40),
    ring = castRing(0);
  c.equipment = {
    main: unique(9101),
    chest: unique(60291),
    boots: unique(2756),
    helmet: recoveryHelm(),
    ring1: ring,
    ring2: castRing(ring.origin.sequence + 1),
  };
  a.hp = 150;
  user.mana = 35;
  runtime.restore({ character: c, loot });
  expect(user.castSpeed).toBeGreaterThanOrEqual(25);
  expect(a.recoveryBonus).toBeGreaterThanOrEqual(25);
  expect(a.hp).toBe(150);
  expect(user.mana).toBe(35);
  requestSkill(skills, {
    actor: 0,
    skill: "ember-lance",
    target: 1,
    direction: { x: 1, y: 0 },
  });
  stepSkillCombat(skills);
  expect(a.controller.timeline.timing.windup).toBe(9);
  const sequence = a.controller.timeline.sequence,
    timing = structuredClone(a.controller.timeline.timing);
  runtime.sync(20, "projectile");
  expect(a.controller.timeline.sequence).toBe(sequence);
  expect(a.controller.timeline.timing).toEqual(timing);
  applyCombatHit(world, world.actors[1]!, a, ARENA_NAV, {
    damage: 100,
    element: "physical",
    guaranteed: true,
  });
  expect(a.controller.timeline.phase).toBe("hitstun");
  expect(a.recoveryBonus).toBeGreaterThanOrEqual(60);
  expect(a.controller.timeline.remaining).toBe(6);
  const hp = a.hp,
    mp = user.mana,
    controller = a.controller;
  runtime.restore({ character: createCharacterInventory(40), loot });
  expect(user.castSpeed).toBe(0);
  expect(a.recoveryBonus).toBe(0);
  expect(a.hp).toBe(hp);
  expect(user.mana).toBe(mp);
  expect(a.controller).toBe(controller);
});
it("retains equipped weapon and speed across repeated idle synchronization and manual-selector changes", () => {
  const a = createCombat().actors[0]!;
  let loot = createLootWorld(42);
  const runtime = new InventoryRuntime(
    () => a,
    () => undefined,
    () => loot,
    (next) => {
      loot = next;
    },
  );
  const c = createCharacterInventory();
  c.equipment.main = unique(14173);
  runtime.restore({ character: c, loot });
  for (let i = 0; i < 5; i++) runtime.sync(20, "melee", 25);
  expect(a.weapon).toBe("projectile");
  expect(a.range).toBe(6);
  expect(a.attackSpeed).toBeGreaterThan(20);
  expect(a.recoveryBonus).toBe(25);
  runtime.sync(50, "melee", 60);
  expect(a.attackSpeed).toBeGreaterThan(50);
  expect(a.recoveryBonus).toBe(60);
});
