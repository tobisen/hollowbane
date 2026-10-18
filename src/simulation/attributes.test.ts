import { generateLoot } from "./loot";
import { identifyItem } from "./item-save";
import { ADVANCED_CONTENT } from "./item-registry";
import { expect, it } from "vitest";
import {
  allocateAttributes,
  attributeValues,
  createAttributes,
  rewardAttributeLevels,
  ATTRIBUTE_COEFFICIENTS,
} from "./attributes";
import { createEncounter } from "./encounter";
import {
  createMonsterExperience,
  consumeMonsterDeathXp,
  MONSTER_XP,
} from "./monster-experience";
import { applyCombatHit, ARENA_NAV, createCombat } from "./combat";
import { createXpCurve } from "./experience";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { inventoryItem } from "./inventory-test-helper";
import { itemHitOffense } from "./item-hit-rules";

it("awards five points per gained level, handles multi-level kills and never repeats rewards", () => {
  const world = createEncounter(2).combat;
  world.experience = createMonsterExperience(
    0,
    { ...MONSTER_XP, melee: 10, ranged: 30 },
    createXpCurve(Array<number>(98).fill(10)),
  );
  for (const target of world.actors.slice(1)) {
    applyCombatHit(world, world.actors[0]!, target, ARENA_NAV, {
      damage: 100000,
      element: "physical",
      guaranteed: true,
    });
    expect(world.experience.attributes.available).toBe(
      target.monsterRole === "melee" ? 5 : 20,
    );
  }
  const state = world.experience.attributes;
  for (const event of [...world.events]) consumeMonsterDeathXp(world, event);
  expect(world.experience.attributes).toBe(state);
  expect(rewardAttributeLevels(state, 3)).toBe(state);
});

it("caps the lifetime budget at 490 and rejects impossible levels", () => {
  const world = createEncounter(1).combat;
  world.experience = createMonsterExperience(0, {
    ...MONSTER_XP,
    melee: Number.MAX_SAFE_INTEGER,
  });
  applyCombatHit(world, world.actors[0]!, world.actors[1]!, ARENA_NAV, {
    damage: 100000,
    element: "physical",
    guaranteed: true,
  });
  expect(world.experience.attributes.available).toBe(490);
  expect(rewardAttributeLevels(world.experience.attributes, 99)).toBe(
    world.experience.attributes,
  );
  expect(() => rewardAttributeLevels(world.experience.attributes, 100)).toThrow(
    RangeError,
  );
});

it("allocates configured attributes immutably and rejects overspending or invalid budgets", () => {
  const original = createAttributes(
    { strength: 10, dexterity: 12, vitality: 8, energy: 6 },
    3,
  );
  const state = allocateAttributes(original, {
    strength: 3,
    dexterity: 2,
    vitality: 4,
    energy: 1,
  });
  expect(attributeValues(state)).toEqual({
    strength: 13,
    dexterity: 14,
    vitality: 12,
    energy: 7,
  });
  expect(state).toMatchObject({ available: 0, spent: 10 });
  expect(original).toMatchObject({ available: 10, spent: 0 });
  for (const amount of [-1, 0.5, NaN, Infinity, 11])
    expect(() => allocateAttributes(original, { strength: amount })).toThrow(
      RangeError,
    );
  expect(() => allocateAttributes(state, { energy: 1 })).toThrow(RangeError);
  expect(() =>
    allocateAttributes(original, { strength: 6, energy: 6 }),
  ).toThrow(RangeError);
  expect(() => attributeValues({ ...state, spent: 0 })).toThrow(RangeError);
  expect(() =>
    createAttributes({ strength: -1, dexterity: 0, vitality: 0, energy: 0 }),
  ).toThrow(RangeError);
});

it("combines attributes with equipment and derives from the original base without compounding", () => {
  const actor = createCombat().actors[0]!;
  const c = createCharacterInventory();
  c.equipment.main = inventoryItem("ash-blade");
  c.equipment.amulet = inventoryItem("slate-pendant");
  const base = captureEquipmentBase(actor);
  const before = deriveEquipment(c, base);
  const attributed = {
    ...base,
    attributes: { strength: 4, dexterity: 3, vitality: 2, energy: 1 },
  };
  const after = deriveEquipment(c, attributed);
  expect(after.offense.damage).toBe(before.offense.damage + 2);
  expect(after.offense.accuracy).toBe(before.offense.accuracy + 6);
  expect(after.defense.defense).toBe(before.defense.defense + 3);
  expect(after.defense.armor).toBe(before.defense.armor);
  expect(after.maxHp).toBe(before.maxHp + 10);
  expect(after.maxMana).toBe(before.maxMana + 3);
  applyEquipment(after, actor);
  expect(deriveEquipment(c, attributed)).toEqual(after);
  const changed = deriveEquipment(c, {
    ...attributed,
    attributeCoefficients: {
      ...ATTRIBUTE_COEFFICIENTS,
      physicalDamage: 2,
      health: 10,
    },
  });
  expect(changed.offense.damage).toBe(before.offense.damage + 8);
  expect(changed.maxHp).toBe(before.maxHp + 20);
  expect(() =>
    deriveEquipment(c, {
      ...attributed,
      attributeCoefficients: { ...ATTRIBUTE_COEFFICIENTS, health: Infinity },
    }),
  ).toThrow(RangeError);
});

it("applies Strength only once to physical weapon/skill damage, excluding elemental damage and procs", () => {
  const actor = createCombat().actors[0]!;
  const c = createCharacterInventory();
  const derived = deriveEquipment(c, {
    ...captureEquipmentBase(actor),
    attributes: { strength: 10, dexterity: 0, vitality: 0, energy: 0 },
  });
  applyEquipment(derived, actor);
  const rules = actor.itemRules!;
  for (const element of ["physical", "fire"] as const) {
    const context = {
      healthFraction: 1,
      targetStatuses: [],
      element,
      weapon: "melee" as const,
    };
    expect(
      itemHitOffense(
        rules,
        actor.offense,
        actor.offense.damage,
        "weapon",
        context,
      ).damage,
    ).toBe(28 + (element === "physical" ? 5 : 0));
    expect(
      itemHitOffense(rules, actor.offense, 20, "skill", context).damage,
    ).toBe(20 + (element === "physical" ? 5 : 0));
    expect(
      itemHitOffense(rules, actor.offense, 20, "proc", context).damage,
    ).toBe(20);
  }
});

it("preserves absolute resources when maxima increase, clamps on decrease and never resurrects", () => {
  const actor = createCombat().actors[0]!;
  const base = captureEquipmentBase(actor);
  const c = createCharacterInventory();
  const boosted = deriveEquipment(c, {
    ...base,
    attributes: { strength: 0, dexterity: 0, vitality: 10, energy: 10 },
  });
  const mana = { mana: 50, maxMana: 100 };
  actor.hp = 150;
  applyEquipment(boosted, actor, mana);
  expect([actor.hp, actor.maxHp, mana.mana, mana.maxMana]).toEqual([
    150, 350, 50, 130,
  ]);
  actor.hp = 340;
  mana.mana = 125;
  applyEquipment(deriveEquipment(c, base), actor, mana);
  expect([actor.hp, mana.mana]).toEqual([300, 100]);
  actor.hp = 0;
  mana.mana = 0;
  applyEquipment(boosted, actor, mana);
  expect([actor.hp, mana.mana]).toEqual([0, 0]);
  actor.hp = -5;
  mana.mana = -5;
  applyEquipment(boosted, actor, mana);
  expect([actor.hp, mana.mana]).toEqual([0, 0]);
});

it("combines Strength with the real four-piece set increase exactly once at hit time", () => {
  const actor = createCombat().actors[0]!;
  const c = createCharacterInventory();
  const item = (sequence: number) =>
    identifyItem(
      generateLoot(
        {
          seed: 42,
          sequence,
          areaLevel: 12,
          monsterLevel: 12,
          table: "sanctum",
        },
        ADVANCED_CONTENT,
      )!,
    );
  c.equipment.main = item(69);
  c.equipment.off = item(2640);
  c.equipment.belt = item(13598);
  c.equipment.amulet = item(3799);
  const base = captureEquipmentBase(actor);
  const before = deriveEquipment(c, base);
  const derived = deriveEquipment(c, {
    ...base,
    attributes: { strength: 4, dexterity: 0, vitality: 0, energy: 0 },
  });
  expect(derived.offense.damage - before.offense.damage).toBeCloseTo(2 * 1.15);
  applyEquipment(derived, actor);
  const context = {
    healthFraction: 1,
    targetStatuses: [],
    element: "physical" as const,
    weapon: "melee" as const,
  };
  expect(
    itemHitOffense(
      actor.itemRules!,
      actor.offense,
      actor.offense.damage,
      "weapon",
      context,
    ).damage,
  ).toBeCloseTo(derived.offense.damage);
});
