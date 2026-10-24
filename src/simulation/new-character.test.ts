import { expect, test } from "vitest";
import { newCharacter } from "./new-character";
import { CHARACTER_CLASSES, classEquipmentBase } from "./character-classes";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { validateSession, createInventorySession } from "./inventory-world";
import { compatible, ownedItems, unequipItem } from "./equipment";
import { validateGeneratedItem } from "./item-save";
import { captureEquipmentBase, deriveEquipment } from "./equipment-stats";
import { createCombat } from "./combat";
import { tradeWithMerchant } from "./camp-merchant";
import { CAMP_NPCS } from "./camp-dialogue";

for (const definition of CHARACTER_CLASSES) {
  test(`${definition.id} starts a detached deterministic level-one campaign without earned rewards`, () => {
    const first = newCharacter(definition.id);
    const second = newCharacter(definition.id);
    validateSession(first);
    expect(serializeCharacter(first)).toBe(serializeCharacter(second));
    expect(
      serializeCharacter(deserializeCharacter(serializeCharacter(first))),
    ).toBe(serializeCharacter(first));
    expect(first.progression?.character).toMatchObject({
      level: 1,
      totalXp: 0,
    });
    expect(first.progression?.attributes.starting).toEqual(
      definition.attributes,
    );
    expect(first.progression?.skills).toMatchObject({
      classId: definition.id,
      available: 0,
      spent: 0,
      ranks: {},
    });
    expect(first.character.grid.items).toEqual([]);
    const weapon = first.character.equipment.main!;
    expect(Object.keys(first.character.equipment)).toEqual(["main"]);
    expect(ownedItems(first.character)).toHaveLength(1);
    expect(weapon).toMatchObject({
      base: definition.starterWeapon,
      name: {
        warrior: "Worn Shortsword",
        sorcerer: "Apprentice Staff",
        ranger: "Hunter's Bow",
      }[definition.id],
      quality: "normal",
      identified: true,
      requirement: 1,
      level: 1,
      affixes: [],
      unique: null,
    });
    expect(weapon.socketCapacity).toBeUndefined();
    expect(validateGeneratedItem(weapon)).toEqual(weapon);
    expect(() =>
      validateGeneratedItem({ ...weapon, stats: { damage: 999 } }),
    ).toThrow();
    expect(compatible(weapon, "main", 1, first.requirements)).toBe(true);
    const base = classEquipmentBase(
      definition,
      captureEquipmentBase(createCombat().actors[0]!),
    );
    const unarmed = deriveEquipment(
      { ...first.character, equipment: {} },
      base,
    );
    const armed = deriveEquipment(first.character, base);
    expect(armed.offense.damage - unarmed.offense.damage).toBe(
      weapon.stats.damage,
    );
    expect(armed.maxMana - unarmed.maxMana).toBe(
      definition.id === "sorcerer" ? 8 : 0,
    );
    expect(armed.weapon).toBe(
      definition.id === "ranger" ? "projectile" : "melee",
    );
    expect(armed.range).toBe(definition.id === "ranger" ? 6 : 1.05);
    let restored = deserializeCharacter(serializeCharacter(first));
    for (let i = 0; i < 3; i++)
      restored = deserializeCharacter(serializeCharacter(restored));
    expect(ownedItems(restored.character)).toEqual([weapon]);
    const unequipped = unequipItem(restored.character, "main");
    expect(unequipped.ok).toBe(true);
    if (!unequipped.ok) throw Error(unequipped.reason);
    restored.character = unequipped.value;
    const loaded = deserializeCharacter(serializeCharacter(restored));
    expect(loaded.character.equipment).toEqual({});
    expect(ownedItems(loaded.character)).toEqual([weapon]);
    loaded.exploration!.position = {
      ...CAMP_NPCS.find((npc) => npc.id === "orren-thale")!.position,
    };
    const sold = tradeWithMerchant(loaded, {
      kind: "sell",
      id: weapon.id,
      expectedRevision: loaded.character.revision,
      expectedMerchantRevision: 0,
    });
    expect(sold.ok).toBe(true);
    if (!sold.ok) throw Error(sold.reason);
    const afterSale = deserializeCharacter(serializeCharacter(sold.value));
    expect(ownedItems(afterSale.character)).toEqual([]);
    expect(afterSale.exploration!.merchant!.retired).toEqual([weapon.id]);
    const oldUnarmed = newCharacter(definition.id);
    oldUnarmed.character.equipment = {};
    const oldText = serializeCharacter(oldUnarmed);
    expect(serializeCharacter(deserializeCharacter(oldText))).toBe(oldText);
    expect(deserializeCharacter(oldText).character.equipment).toEqual({});
    expect(first.exploration).toMatchObject({
      area: "ashen-refuge",
      seed: 42,
      containers: { gold: 0, opened: [] },
    });
    first.character.grid.columns = 1;
    expect(second.character.grid.columns).toBe(10);
  });
}

test("existing unarmed saves round trip unchanged without receiving equipment", () => {
  const legacy = createInventorySession(17);
  const text = serializeCharacter(legacy);
  const loaded = deserializeCharacter(text);
  expect(loaded.character.equipment).toEqual({});
  expect(ownedItems(loaded.character)).toEqual([]);
  expect(serializeCharacter(loaded)).toBe(text);
  newCharacter("warrior", 17);
  expect(serializeCharacter(legacy)).toBe(text);
});
