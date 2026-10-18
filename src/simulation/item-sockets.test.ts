import { expect, it } from "vitest";
import { generateLoot, type GeneratedItem } from "./loot";
import { SOCKET_ITEM_CONTENT, ADVANCED_CONTENT } from "./item-registry";
import { validateGeneratedItem, identifyItem } from "./item-save";
import { createCharacterInventory, validateCharacter } from "./equipment";
import { insertSocket, extractSockets } from "./item-sockets";
import { itemTree } from "./item-ownership";
import { createLootWorld, placeLoot } from "./world-loot";
import { validateSession, reserveOwned } from "./inventory-world";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
} from "./inventory-save";
import { deriveEquipment, captureEquipmentBase } from "./equipment-stats";
import { createCombat, ARENA_NAV } from "./combat";
import { simulateLoot } from "./loot-diagnostics";
function find(base: string, start = 0): GeneratedItem {
  for (let sequence = start; sequence < 100000; sequence++) {
    const item = generateLoot(
      {
        seed: 42,
        sequence,
        areaLevel: 24,
        monsterLevel: 24,
        table: base.includes("gem") ? "gem-cache" : "sanctum",
      },
      SOCKET_ITEM_CONTENT,
    );
    if (
      item?.base === base &&
      (base.includes("gem") || (item.socketCapacity ?? 0) >= 2)
    )
      return identifyItem(item);
  }
  throw Error("Fixture missing");
}
const host = find("ash-blade"),
  gem = find("fire-gem-1"),
  gem2 = find("cold-gem-1", gem.origin.sequence + 1);
function fixture() {
  const c = createCharacterInventory(24);
  c.equipment.main = structuredClone(host);
  c.grid.items = [
    { item: structuredClone(gem), x: 0, y: 0 },
    { item: structuredClone(gem2), x: 1, y: 0 },
  ];
  return c;
}
it("inserts and extracts atomically with exact identities, ordered contents and no RNG/stat reroll", () => {
  const c = fixture(),
    before = structuredClone(c),
    first = insertSocket(c, host.id, gem.id);
  expect(first.ok).toBe(true);
  if (!first.ok) return;
  expect(c).toEqual(before);
  expect(first.value.grid.items).toHaveLength(1);
  expect(first.value.equipment.main!.embedded).toEqual([gem]);
  const second = insertSocket(first.value, host.id, gem2.id);
  expect(second.ok).toBe(true);
  if (!second.ok) return;
  const embedded = second.value.equipment.main!;
  expect(validateGeneratedItem(embedded)).toEqual(embedded);
  expect(embedded.embedded!.map((i) => i.id)).toEqual([gem.id, gem2.id]);
  expect(
    itemTree(Object.values(second.value.equipment)).map((i) => i.id),
  ).toEqual([host.id, gem.id, gem2.id]);
  const extracted = extractSockets(second.value, host.id);
  expect(extracted.ok).toBe(true);
  if (!extracted.ok) return;
  expect(extracted.value.equipment.main).toEqual(host);
  expect(extracted.value.grid.items.map((e) => e.item)).toEqual([gem, gem2]);
  expect(insertSocket(first.value, host.id, gem.id).ok).toBe(false);
});
it("fails full-bag extraction, over-capacity, invalid components and forged/nested ownership unchanged", () => {
  const first = insertSocket(fixture(), host.id, gem.id);
  if (!first.ok) throw Error("Fixture");
  const c = {
      ...first.value,
      grid: { columns: 1, rows: 1, items: [{ item: gem2, x: 0, y: 0 }] },
    },
    before = structuredClone(c);
  expect(extractSockets(c, host.id).ok).toBe(false);
  expect(c).toEqual(before);
  const item = structuredClone(first.value.equipment.main!);
  item.embedded!.push(gem);
  expect(() => validateGeneratedItem(item)).toThrow();
  item.embedded = [{ ...gem, embedded: [] }];
  expect(() => validateGeneratedItem(item)).toThrow();
  item.embedded = [host];
  expect(() => validateGeneratedItem(item)).toThrow();
  item.embedded = [gem];
  item.socketCapacity = 6;
  expect(() => validateGeneratedItem(item)).toThrow();
  const duplicate = structuredClone(first.value);
  duplicate.grid.items.push({ item: gem, x: 2, y: 0 });
  expect(() => validateCharacter(duplicate)).toThrow(/Duplicate/);
  expect(insertSocket(fixture(), host.id, host.id).ok).toBe(false);
});
it("reserves embedded IDs against replay and validates mixed-version save ownership", () => {
  const inserted = insertSocket(fixture(), host.id, gem.id);
  if (!inserted.ok) throw Error("Fixture");
  const s = reserveOwned({
    character: inserted.value,
    loot: createLootWorld(42),
  });
  s.loot.table = "sanctum";
  expect(s.loot.reserved).toContain(gem.id);
  expect(
    placeLoot(
      s.loot,
      gem,
      createCombat().actors[0]!.controller.walker.position,
      0,
      -1,
      ARENA_NAV,
    ),
  ).toBeNull();
  const text = serializeCharacter(s),
    restored = deserializeCharacter(text);
  expect(restored.character).toEqual(s.character);
  expect(restored.loot.reserved).toContain(gem.id);
  s.loot.drops.push({
    item: gem,
    position: { x: 0, y: 0 },
    tick: 0,
    source: -1,
  });
  expect(() => validateSession(s)).toThrow(/Duplicate/);
  expect(() => serializeCharacter(s)).toThrow();
  const root = JSON.parse(text) as {
    checksum: string;
    body: { contentVersions: number[] };
  };
  root.body.contentVersions = [2, 3, 4];
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  expect(() => deserializeCharacter(JSON.stringify(root))).toThrow(/registry/);
});
it("routes embedded modifiers through the existing pipeline and validates gem rarity distribution", () => {
  const c = createCharacterInventory(24),
    armor = find("woven-coat");
  c.equipment.chest = armor;
  c.grid.items = [{ item: gem, x: 0, y: 0 }];
  const base = captureEquipmentBase(createCombat().actors[0]!),
    before = deriveEquipment(c, base),
    inserted = insertSocket(c, armor.id, gem.id);
  if (!inserted.ok) throw Error(inserted.reason);
  expect(
    deriveEquipment(inserted.value, base).defense.resistances!.fire,
  ).toBeCloseTo((before.defense.resistances!.fire ?? 0) + 0.04);
  const report = simulateLoot(
    { seed: 42, areaLevel: 24, monsterLevel: 24, table: "sanctum" },
    10000,
    SOCKET_ITEM_CONTENT,
  );
  expect(report.distributionValid).toBe(true);
  expect(report.invalidItems).toBe(0);
  const old = generateLoot(
    {
      seed: 42,
      sequence: 5634,
      areaLevel: 12,
      monsterLevel: 12,
      table: "sanctum",
    },
    ADVANCED_CONTENT,
  )!;
  expect(old.unique).toBe("coalward-edge");
  expect(old.socketCapacity).toBeUndefined();
});
it("rejects a genuinely full host without consuming the remaining component", () => {
  let c = createCharacterInventory(24);
  c.equipment.main = host;
  const components: GeneratedItem[] = [];
  let sequence = 0;
  for (let i = 0; i < host.socketCapacity! + 1; i++) {
    const component = find("fire-gem-1", sequence);
    sequence = component.origin.sequence + 1;
    components.push(component);
    c.grid.items.push({ item: component, x: i, y: 0 });
  }
  for (const component of components.slice(0, -1)) {
    const result = insertSocket(c, host.id, component.id);
    if (!result.ok) throw Error(result.reason);
    c = result.value;
  }
  const before = structuredClone(c);
  expect(insertSocket(c, host.id, components.at(-1)!.id).ok).toBe(false);
  expect(c).toEqual(before);
  expect(c.grid.items).toHaveLength(1);
});
