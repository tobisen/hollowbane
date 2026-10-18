import { expect, it } from "vitest";
import {
  equipmentRequirement,
  meetsEquipmentRequirements,
} from "./equipment-requirements";
import {
  createCharacterInventory,
  equipItem,
  reconcileEquipmentRequirements,
  ownedItems,
} from "./equipment";
import { addGrid } from "./inventory-grid";
import { inventoryItem } from "./inventory-test-helper";
const blade = inventoryItem("ash-blade");
const rule = {
  attributes: { strength: 5, dexterity: 3 },
  rules: { "ash-blade": { level: 12, strength: 5, dexterity: 3 } },
};
function bag() {
  const c = createCharacterInventory(12);
  const placed = addGrid(c.grid, blade);
  if (!placed.ok) throw Error("Fixture placement");
  c.grid = placed.value;
  return c;
}
it("requires level, Strength and Dexterity at the exact minima", () => {
  expect(equipmentRequirement(blade, rule)).toEqual({
    level: 12,
    strength: 5,
    dexterity: 3,
  });
  expect(meetsEquipmentRequirements(blade, 12, rule)).toBe(true);
  expect(meetsEquipmentRequirements(blade, 11, rule)).toBe(false);
  for (const attributes of [
    { strength: 4, dexterity: 3 },
    { strength: 5, dexterity: 2 },
  ])
    expect(meetsEquipmentRequirements(blade, 12, { ...rule, attributes })).toBe(
      false,
    );
  expect(equipmentRequirement(blade).strength).toBe(0);
});
it("rejects unmet equips without changing ownership and preserves successful item identity", () => {
  const c = bag();
  expect(
    equipItem(c, blade.id, "main", {
      ...rule,
      attributes: { strength: 0, dexterity: 0 },
    }).ok,
  ).toBe(false);
  expect(c.grid.items[0]!.item).toBe(blade);
  const result = equipItem(c, blade.id, "main", rule);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.equipment.main).toBe(blade);
  expect(equipItem(c, blade.id, "off", rule).ok).toBe(false);
});
it("atomically stows gear invalidated by level or attribute reductions", () => {
  const equipped = equipItem(bag(), blade.id, "main", rule);
  if (!equipped.ok) throw Error(equipped.reason);
  for (const [level, attributes] of [
    [11, rule.attributes],
    [12, { strength: 0, dexterity: 0 }],
  ] as const) {
    const result = reconcileEquipmentRequirements(equipped.value, level, {
      ...rule,
      attributes,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.equipment.main).toBeUndefined();
      expect(result.value.grid.items[0]!.item).toBe(blade);
      expect(ownedItems(result.value).map((i) => i.id)).toEqual([blade.id]);
    }
    expect(equipped.value.equipment.main).toBe(blade);
  }
});
it("rejects an invalidating stat transaction when the bag cannot hold the gear", () => {
  const c = createCharacterInventory(12, 1, 1);
  c.equipment.main = blade;
  const result = reconcileEquipmentRequirements(c, 12, {
    ...rule,
    attributes: { strength: 0, dexterity: 0 },
  });
  expect(result.ok).toBe(false);
  expect(c.equipment.main).toBe(blade);
  expect(c.grid.items).toEqual([]);
});
it("rejects invalid rules and stat values without accepting malformed minima", () => {
  for (const value of [-1, NaN, Infinity, 0.5]) {
    expect(() =>
      equipmentRequirement(blade, {
        ...rule,
        rules: { "ash-blade": { strength: value } },
      }),
    ).toThrow();
    expect(() =>
      equipmentRequirement(blade, {
        ...rule,
        rules: { "ash-blade": { level: value } },
      }),
    ).toThrow();
    expect(() =>
      meetsEquipmentRequirements(blade, 12, {
        ...rule,
        attributes: { strength: value, dexterity: 3 },
      }),
    ).toThrow();
  }
});

it("keeps requirement checks through world inventory transactions", async () => {
  const { moveOwned, validateSession } = await import("./inventory-world");
  const { createLootWorld } = await import("./world-loot");
  const session = {
    character: bag(),
    loot: createLootWorld(42),
    requirements: rule,
  };
  const valid = moveOwned(session, blade.id, {
    kind: "equipment",
    slot: "main",
  });
  expect(valid.ok).toBe(true);
  if (valid.ok) {
    expect(valid.value.requirements).toBe(rule);
    validateSession(valid.value);
  }
  expect(
    moveOwned(
      {
        ...session,
        requirements: { ...rule, attributes: { strength: 0, dexterity: 0 } },
      },
      blade.id,
      { kind: "equipment", slot: "main" },
    ).ok,
  ).toBe(false);
  expect(session.character.grid.items[0]!.item).toBe(blade);
});
