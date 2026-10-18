import { it, expect } from "vitest";
import { createEncounter } from "./encounter";
import { stepCombat, ARENA_NAV } from "./combat";
import { commandCombat } from "./combat-targeting";
import {
  createMonsterExperience,
  consumeMonsterDeathXp,
} from "./monster-experience";
import { allocateAttributes, attributeValues } from "./attributes";
import { createCharacterInventory, equipItem } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { inventoryItem } from "./inventory-test-helper";
import { createLootWorld, consumeLootDeaths } from "./world-loot";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { DEFAULT_XP_CURVE, experienceAt } from "./experience";

it("earns level/points from an actual timed monster kill then equips, derives and persists without duplication", () => {
  const world = createEncounter(1).combat;
  world.experience = createMonsterExperience(75);
  const player = world.actors[0]!,
    monster = world.actors[1]!;
  player.controller.walker.position = {
    ...monster.controller.walker.position,
    x: monster.controller.walker.position.x - 0.8,
  };
  player.controller = commandCombat(player.controller, {
    kind: "attack",
    target: monster.id,
    repeat: true,
  });
  for (let i = 0; i < 600 && monster.hp > 0; i++) stepCombat(world, ARENA_NAV);
  expect(monster.hp).toBe(0);
  expect(
    world.events.some((e) => e.kind === "death" && e.actor === player.id),
  ).toBe(true);
  expect(world.experience.character).toEqual(experienceAt(100));
  expect(world.experience.attributes.available).toBe(5);
  const attributes = allocateAttributes(world.experience.attributes, {
    strength: 1,
    dexterity: 1,
    vitality: 2,
    energy: 1,
  });
  world.experience.attributes = attributes;
  const c = createCharacterInventory(2),
    blade = inventoryItem("ash-blade");
  c.grid.items = [{ item: blade, x: 0, y: 0 }];
  const requirements = {
    attributes: attributeValues(attributes),
    rules: { "ash-blade": { strength: 1, dexterity: 1 } },
  };
  const equipped = equipItem(c, blade.id, "main", requirements);
  expect(equipped.ok).toBe(true);
  if (!equipped.ok) throw Error(equipped.reason);
  const base = captureEquipmentBase(player);
  const derived = deriveEquipment(equipped.value, {
    ...base,
    attributes: attributeValues(attributes),
  });
  player.hp = 150;
  applyEquipment(derived, player);
  expect(player.hp).toBe(150);
  expect(player.maxHp).toBe(310);
  const loot = createLootWorld(42);
  consumeLootDeaths(loot, world, ARENA_NAV);
  const attempts = loot.attempts;
  for (const event of [...world.events]) consumeMonsterDeathXp(world, event);
  consumeLootDeaths(loot, world, ARENA_NAV);
  expect(loot.attempts).toBe(attempts);
  expect(world.experience.attributes).toBe(attributes);
  const session = {
    character: equipped.value,
    loot,
    requirements,
    progression: {
      curve: "xp-v1" as const,
      character: world.experience.character,
      attributes,
    },
  };
  const restored = deserializeCharacter(serializeCharacter(session));
  expect(restored.character.equipment.main).toEqual(blade);
  expect(restored.progression?.attributes).toEqual(attributes);
  expect(restored.progression?.character.totalXp).toBe(100);
});

it("validates all 99 default levels and exactly five points per transition", () => {
  for (let level = 1; level <= 99; level++) {
    const xp = createMonsterExperience(DEFAULT_XP_CURVE[level - 1]!);
    expect(xp.character.level).toBe(level);
    expect(xp.attributes.available).toBe((level - 1) * 5);
    expect(xp.attributes.spent).toBe(0);
  }
});
