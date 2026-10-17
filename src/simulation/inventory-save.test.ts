import { expect, it } from "vitest";
import { createInventorySession } from "./inventory-world";
import { inventoryItem } from "./inventory-test-helper";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { fromGround } from "../world/navigation";
import { ARENA_NAV } from "./combat";
function fixture() {
  const s = createInventorySession(900);
  s.character.grid.items.push({
    item: inventoryItem("woven-coat"),
    x: 0,
    y: 0,
  });
  s.character.equipment.main = inventoryItem("ash-blade", 0, 2);
  s.loot.drops.push({
    item: inventoryItem("copper-band"),
    position: fromGround({ x: 750, y: 560 }),
    tick: 20,
    source: -1,
  });
  s.loot.sequence = 123;
  s.loot.deaths.add(3);
  return s;
}
function alter(text: string, change: (value: Record<string, unknown>) => void) {
  const root = JSON.parse(text) as {
    schema: number;
    body: Record<string, unknown>;
    checksum: string;
  };
  change(root.body);
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  return JSON.stringify(root);
}
it("round-trips mixed content versions, gear, grid, world IDs and RNG without rerolling", () => {
  const s = fixture(),
    text = serializeCharacter(s, ARENA_NAV),
    restored = deserializeCharacter(text, ARENA_NAV);
  expect(serializeCharacter(restored, ARENA_NAV)).toBe(text);
  expect(restored.character).toEqual(s.character);
  expect(restored.loot.drops).toEqual(s.loot.drops);
  expect(restored.loot.sequence).toBe(123);
  expect(restored.loot.deaths.size).toBe(0);
  expect(restored.loot.reserved).toContain(s.character.equipment.main!.id);
  expect(s.loot.deaths.has(3)).toBe(true);
});
it("rejects corrupt, forged, duplicated, conflicting and unsupported snapshots atomically", () => {
  const s = fixture(),
    before = structuredClone(s),
    text = serializeCharacter(s, ARENA_NAV);
  for (const invalid of [
    text.replace('"checksum":"', '"checksum":"bad'),
    alter(text, (b) => {
      b.contentVersions = [99];
    }),
    alter(text, (b) => {
      b.extra = true;
    }),
    alter(text, (b) => {
      const c = b.character as typeof s.character;
      c.grid.items[0]!.item.stats.damage = 999;
    }),
    alter(text, (b) => {
      const c = b.character as typeof s.character;
      c.grid.items.push(c.grid.items[0]!);
    }),
    alter(text, (b) => {
      const c = b.character as typeof s.character;
      c.grid.items[0]!.x = 19;
    }),
    alter(text, (b) => {
      const c = b.character as typeof s.character;
      c.equipment.main = inventoryItem("reed-bow");
      c.equipment.off = inventoryItem("bark-guard");
    }),
    alter(text, (b) => {
      (b.loot as typeof s.loot).seed = -1;
    }),
    alter(text, (b) => {
      (b.loot as typeof s.loot).sequence = 0x100000001;
    }),
    alter(text, (b) => {
      (b.loot as typeof s.loot).table = "missing";
    }),
    alter(text, (b) => {
      (b.loot as typeof s.loot).drops[0]!.position = { x: -999999, y: -999999 };
    }),
    text.replace('"schema":1', '"schema":2'),
    JSON.stringify({ schema: 1, contentVersion: 2, items: [] }),
  ])
    expect(() => deserializeCharacter(invalid, ARENA_NAV)).toThrow();
  expect(s).toEqual(before);
});
it("requires explicit migration and offers backups without applying them", () => {
  const text = serializeCharacter(fixture(), ARENA_NAV),
    old = text.replace('"schema":1', '"schema":0');
  expect(() => deserializeCharacter(old)).toThrow(/older/);
  expect(
    serializeCharacter(
      deserializeCharacter(old, ARENA_NAV, new Map([[0, (b) => b]])),
    ),
  ).toBe(text);
  expect(inspectSnapshots(null, null)).toEqual({ kind: "empty" });
  expect(inspectSnapshots(text, null).kind).toBe("valid");
  expect(inspectSnapshots("corrupt", text).kind).toBe("recoverable");
  expect(inspectSnapshots("corrupt", "bad").kind).toBe("invalid");
});
