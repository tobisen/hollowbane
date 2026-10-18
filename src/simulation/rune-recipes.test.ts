import { expect, it } from "vitest";
import { RUNE_CONTENT } from "./rune-content";
import { activeRuneRecipe } from "./rune-recipes";
import { RUNE_ITEM_CONTENT, SOCKET_ITEM_CONTENT } from "./item-registry";
import { generateLoot, type GeneratedItem } from "./loot";
import { identifyItem, validateGeneratedItem } from "./item-save";
import { createCharacterInventory } from "./equipment";
import { equipmentDefinition } from "./equipment-content";
import { insertSocket, extractSockets } from "./item-sockets";
import { deriveEquipment, captureEquipmentBase } from "./equipment-stats";
import { createCombat } from "./combat";
import { createLootWorld } from "./world-loot";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { simulateLoot } from "./loot-diagnostics";
function find(base: string, capacity?: number, legacy = false): GeneratedItem {
  const content = legacy ? SOCKET_ITEM_CONTENT : RUNE_ITEM_CONTENT;
  for (let sequence = 0; sequence < 100000; sequence++) {
    const item = generateLoot(
      {
        seed: 42,
        sequence,
        areaLevel: 50,
        monsterLevel: 50,
        table: base.startsWith("sigil-") ? "sigil-cache" : "sanctum",
      },
      content,
    );
    if (
      item?.base === base &&
      item.quality === "normal" &&
      (capacity === undefined || item.socketCapacity === capacity)
    )
      return identifyItem(item);
  }
  throw Error("Missing fixture");
}
function pattern(id: string, legacy = false) {
  const recipe = RUNE_CONTENT.recipes.find((r) => r.id === id)!,
    host = find(recipe.bases[0]!, recipe.sequence.length, legacy);
  let c = createCharacterInventory(50);
  c.equipment[equipmentDefinition(host).slots[0]!] = host;
  for (const [x, id] of recipe.sequence.entries())
    c.grid.items.push({ item: find(id), x, y: 0 });
  for (const id of recipe.sequence) {
    const result = insertSocket(
      c,
      host.id,
      c.grid.items.find((e) => e.item.base === id)!.item.id,
    );
    if (!result.ok) throw Error(result.reason);
    c = result.value;
  }
  return { c, item: c.equipment[equipmentDefinition(host).slots[0]!]!, host };
}
it("activates all eight exact ordered combinations through real socket transactions", () => {
  for (const r of RUNE_CONTENT.recipes) {
    const { c, item } = pattern(r.id),
      before = structuredClone(c);
    expect(activeRuneRecipe(item)?.id).toBe(r.id);
    expect(validateGeneratedItem(item)).toEqual(item);
    const d = deriveEquipment(
      c,
      captureEquipmentBase(createCombat().actors[0]!),
    );
    expect(d.advanced!.patterns.map((p) => p.id)).toEqual([r.id]);
    expect(c).toEqual(before);
    const result = extractSockets(c, item.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const bare = result.value.equipment[equipmentDefinition(item).slots[0]!]!;
      expect(activeRuneRecipe(bare)).toBeNull();
      expect(bare.embedded).toEqual([]);
    }
  }
});
it("rejects reversed, incomplete, wrong-count, wrong-base, wrong-quality and under-level patterns", () => {
  const { item } = pattern("cinder-covenant");
  expect(
    activeRuneRecipe({ ...item, embedded: [...item.embedded!].reverse() }),
  ).toBeNull();
  expect(
    activeRuneRecipe({ ...item, embedded: item.embedded!.slice(0, 1) }),
  ).toBeNull();
  expect(activeRuneRecipe({ ...item, socketCapacity: 3 })).toBeNull();
  expect(activeRuneRecipe({ ...item, base: "bark-guard" })).toBeNull();
  expect(activeRuneRecipe({ ...item, quality: "rare" })).toBeNull();
  expect(activeRuneRecipe({ ...item, level: 1 })).toBeNull();
  expect(activeRuneRecipe({ ...item, identified: false })).toBeNull();
});
it("applies both benefits and penalties and supports intact version5 hosts with new components", () => {
  const { c, item, host } = pattern("cinder-covenant", true),
    base = captureEquipmentBase(createCombat().actors[0]!);
  const plain = createCharacterInventory(50);
  plain.equipment.main = host;
  const before = deriveEquipment(plain, base),
    after = deriveEquipment(c, base);
  expect(after.offense.damage - before.offense.damage).toBe(7);
  expect(after.defense.resistances!.fire).toBeCloseTo(
    (before.defense.resistances!.fire ?? 0) - 0.05,
  );
  expect(item.contentVersion).toBe(5);
  expect(item.embedded!.every((i) => i.contentVersion === 6)).toBe(true);
  const loot = createLootWorld(42);
  loot.table = "sanctum";
  const text = serializeCharacter({ character: c, loot }),
    restored = deserializeCharacter(text);
  expect(restored.character).toEqual(c);
  expect(restored.loot.reserved).toContain(item.embedded![0]!.id);
  const extracted = extractSockets(restored.character, item.id);
  if (!extracted.ok) throw Error(extracted.reason);
  expect(extracted.value.equipment.main).toEqual(host);
});
it("preserves deterministic component distributions without inflating item quality", () => {
  const report = simulateLoot(
    { seed: 998, areaLevel: 50, monsterLevel: 50, table: "sanctum" },
    20000,
    RUNE_ITEM_CONTENT,
  );
  expect(report.distributionValid).toBe(true);
  expect(report.invalidItems).toBe(0);
  for (const id of RUNE_CONTENT.components.map((r) => r.id)) {
    const item = find(id);
    expect(item.quality).toBe("normal");
    expect(item.identified).toBe(true);
  }
});
