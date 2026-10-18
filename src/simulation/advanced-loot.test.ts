import { inventoryItem } from "./inventory-test-helper";
import { createCombat, stepCombat, ARENA_NAV } from "./combat";
import { commandCombat } from "./combat-targeting";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
  compareEquipment,
} from "./equipment-stats";
import { expect, it } from "vitest";
import { ADVANCED_ITEMS } from "./advanced-item-content";
import { ADVANCED_CONTENT } from "./item-registry";
import { generateLoot, type GeneratedItem } from "./loot";
import {
  serializeItems,
  validateGeneratedItem,
  identifyItem,
} from "./item-save";
import { simulateLoot } from "./loot-diagnostics";
import { createCharacterInventory, validateCharacter } from "./equipment";
import { equipmentModifiers } from "./equipment-modifiers";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
} from "./inventory-save";
import { createLootWorld } from "./world-loot";
import { equipmentDefinition } from "./equipment-content";
const context = { seed: 42, monsterLevel: 12, areaLevel: 12, table: "sanctum" };
const found = new Map<string, GeneratedItem>();
for (let sequence = 0; sequence < 1000000 && found.size < 24; sequence++) {
  const item = generateLoot({ ...context, sequence }, ADVANCED_CONTENT);
  if (item?.advanced) found.set(item.unique ?? item.advanced.set!.piece, item);
}
it("generates every original unique and set piece with replayable controlled modifiers", () => {
  const ids = [
    ...ADVANCED_ITEMS.uniques.map((u) => u.id),
    ...ADVANCED_ITEMS.sets.flatMap((s) => s.pieces.map((p) => p.id)),
  ];
  expect(ids).toHaveLength(24);
  for (const id of ids) {
    const item = found.get(id)!;
    expect(item, id).toBeDefined();
    expect(validateGeneratedItem(item)).toEqual(item);
    expect(item.id).toMatch(/^l4-/);
    expect(item.identified).toBe(false);
    expect(item.advanced?.modifiers.every((m) => m.source === item.id)).toBe(
      true,
    );
    const known = identifyItem(item);
    expect(known).toEqual({ ...item, identified: true });
    const changed = structuredClone(known);
    changed.advanced!.modifiers.pop();
    expect(() => validateGeneratedItem(changed)).toThrow();
  }
});
it("activates cumulative equipped thresholds and removes them without compounding or RNG", () => {
  const c = createCharacterInventory();
  const set = ADVANCED_ITEMS.sets[0]!;
  for (const piece of set.pieces) {
    const item = identifyItem(found.get(piece.id)!);
    const slot = equipmentDefinition(item).slots[0]!;
    c.equipment[slot] = item;
  }
  validateCharacter(c);
  const first = equipmentModifiers(c);
  expect(first.active.map((a) => a.required)).toEqual([2, 3, 4]);
  expect(equipmentModifiers(c)).toEqual(first);
  delete c.equipment.boots;
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2, 3]);
  c.grid.items.push({
    item: identifyItem(found.get(set.pieces[3]!.id)!),
    x: 0,
    y: 0,
  });
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2, 3]);
  c.equipment.helmet!.identified = false;
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2]);
});
it("reports modern set rarity separately and respects expected conditional distributions", () => {
  const report = simulateLoot(context, 25000, ADVANCED_CONTENT);
  expect(report.distributionValid).toBe(true);
  expect(report.quality.set).toBeGreaterThan(0);
  expect(report.expectedConditionalQuality.set).toBeGreaterThan(0);
  expect(report.invalidItems).toBe(0);
});

it("keeps advanced items out of archives and uses explicit character schema3", () => {
  const item = [...found.values()][0]!;
  expect(() => serializeItems([item])).toThrow(/versioned character/);
  const character = createCharacterInventory();
  character.grid.items.push({ item, x: 0, y: 0 });
  const session = { character, loot: createLootWorld(42) };
  const text = serializeCharacter(session);
  const root = JSON.parse(text) as {
    schema: number;
    checksum: string;
    body: { contentVersions: number[]; progression?: unknown };
  };
  expect(root.schema).toBe(3);
  expect(root.body.contentVersions).toEqual([2, 3, 4, 5, 6, 7, 8]);
  expect(deserializeCharacter(text).character).toEqual(character);
  expect(serializeCharacter(deserializeCharacter(text))).toBe(text);
  root.body.contentVersions = [2, 3, 4];
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  expect(deserializeCharacter(JSON.stringify(root)).character).toEqual(
    character,
  );
  root.schema = 1;
  delete root.body.progression;
  root.body.contentVersions = [2, 3];
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  expect(() => deserializeCharacter(JSON.stringify(root))).toThrow(
    /Unsupported content registry/,
  );
});

it("applies unique modifiers to real committed weapon strikes through the shared stat pipeline", () => {
  const weapon = identifyItem(found.get("coalward-edge")!);
  const run = (advanced: boolean) => {
    const w = createCombat(),
      a = w.actors[0]!,
      c = createCharacterInventory();
    const item = structuredClone(weapon);
    if (!advanced) delete item.advanced; // Isolate the modifier contribution, same base/RNG/timing.
    c.equipment.main = item;
    const base = captureEquipmentBase(a),
      d = deriveEquipment(c, base);
    expect(deriveEquipment(c, base)).toEqual(d);
    applyEquipment(d, a);
    a.controller = commandCombat(a.controller, {
      kind: "attack",
      target: 1,
      repeat: true,
    });
    for (let tick = 0; tick < 180; tick++) {
      stepCombat(w, ARENA_NAV);
      const event = w.events.find(
        (e) => e.kind === "damage" && e.actor === 0 && e.result.amount > 0,
      );
      if (event?.kind === "damage")
        return { amount: event.result.amount, tick: w.tick };
    }
    throw Error("Missing strike");
  };
  const enhanced = run(true),
    plain = run(false);
  expect(enhanced.amount).toBeGreaterThan(plain.amount);
  expect(enhanced.tick).toBe(plain.tick);
});
it("uses cumulative set damage and trade-offs in comparisons and removes bonuses exactly", () => {
  const c = createCharacterInventory(),
    actor = createCombat().actors[0]!,
    base = captureEquipmentBase(actor);
  const set = ADVANCED_ITEMS.sets.find((s) => s.id === "wayfarer-vow")!;
  for (const piece of set.pieces) {
    const item = identifyItem(found.get(piece.id)!);
    c.equipment[equipmentDefinition(item).slots[0]!] = item;
  }
  const full = deriveEquipment(c, base);
  expect(full.advanced?.active.map((s) => s.required)).toEqual([2, 3, 4]);
  expect(full.advanced?.castSpeed).toBe(-8);
  const removed = structuredClone(c);
  delete removed.equipment.amulet;
  const partial = deriveEquipment(removed, base),
    comparison = compareEquipment(removed, base, c);
  expect(partial.advanced?.active.map((s) => s.required)).toEqual([2, 3]);
  expect(partial.advanced?.castSpeed).toBe(0);
  expect(full.offense.damage).toBeCloseTo(partial.offense.damage * 1.15);
  expect(comparison.damage).toBeCloseTo(
    full.offense.damage - partial.offense.damage,
  );
  expect(comparison.castSpeed).toBe(-8);
  expect(deriveEquipment(c, base)).toEqual(full);
});
it("evaluates contextual defenses and skill modifiers with explicit bounds", () => {
  const actor = createCombat().actors[0]!,
    base = captureEquipmentBase(actor),
    c = createCharacterInventory();
  c.equipment.helmet = identifyItem(found.get("bastion-brow")!);
  c.equipment.amulet = identifyItem(found.get("sable-meridian")!);
  const context = {
    healthFraction: 0.2,
    targetStatuses: [],
    element: "physical" as const,
    weapon: "melee" as const,
  };
  const low = deriveEquipment(c, base, 0, context),
    healthy = deriveEquipment(c, base);
  expect(low.defense.armor).toBeGreaterThan(healthy.defense.armor);
  expect(low.advanced?.skills["ember-lance"]).toBeGreaterThanOrEqual(1);
  expect(low.defense.resistances?.lightning).toBeGreaterThan(0);
  expect(
    compareEquipment(createCharacterInventory(), base, c)["skill.ember-lance"],
  ).toBe(low.advanced!.skills["ember-lance"]);
  const extreme = {
    ...base,
    attackSpeed: 10000,
    offense: { ...base.offense, damage: 1e8 },
  };
  const capped = deriveEquipment(c, extreme);
  expect(capped.offense.damage).toBe(10000);
  expect(capped.attackSpeed).toBe(300);
});

it("round-trips mixed legacy and advanced ownership and rejects newer schemas without mutation", () => {
  const character = createCharacterInventory(),
    loot = createLootWorld(4294967295);
  character.equipment.main = inventoryItem("ash-blade", 0, 2);
  character.grid.items.push({
    item: identifyItem(found.get("raincoil")!),
    x: 0,
    y: 0,
  });
  loot.table = "sanctum";
  loot.sequence = 9876;
  loot.drops.push({
    item: found.get("nightstitch")!,
    position: { x: 2, y: 3 },
    tick: 45,
    source: -1,
  });
  const session = { character, loot },
    before = structuredClone(session),
    text = serializeCharacter(session);
  const restored = deserializeCharacter(text);
  expect(restored.character).toEqual(character);
  expect(restored.loot.drops).toEqual(loot.drops);
  expect(restored.loot.seed).toBe(4294967295);
  expect(restored.loot.sequence).toBe(9876);
  expect(restored.loot.reserved).toContain(character.equipment.main!.id);
  expect(serializeCharacter(restored)).toBe(text);
  expect(() =>
    deserializeCharacter(text.replace('"schema":3', '"schema":99')),
  ).toThrow(/newer/);
  expect(session).toEqual(before);
});
