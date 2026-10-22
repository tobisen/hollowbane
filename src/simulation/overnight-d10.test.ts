import { expect, it } from "vitest";
import {
  createInventorySession,
  validateSession,
  type InventorySession,
} from "./inventory-world";
import { WorldSession } from "./world-session";
import { inventoryItem } from "./inventory-test-helper";
import { transferCampStash, type StashIntent } from "./camp-stash";
import { newCampStash, validateCampStash } from "./camp-stash-state";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { socketedCampItem } from "../../tests/fixtures/camp-items";
import { placeLoot } from "./world-loot";
import { ARENA_NAV } from "./combat";
import { merchantItem } from "./camp-merchant-state";
import { tradeWithMerchant } from "./camp-merchant";

function fixture(generated = false): InventorySession {
  const s = createInventorySession(900),
    w = new WorldSession(undefined, 42, generated ? 2 : 1);
  s.exploration = w.capture({ x: 1, y: 3 }, s.loot);
  s.exploration.containers!.gold = 500;
  s.character.grid.items.push({
    item: inventoryItem("ash-blade", 0, 2),
    x: 0,
    y: 0,
  });
  return s;
}
function intent(
  s: InventorySession,
  kind: "store" | "retrieve",
  id = s.character.grid.items[0]?.item.id ?? "missing",
): StashIntent {
  return {
    kind,
    id,
    expectedRevision: s.character.revision,
    expectedStashRevision: s.exploration?.stash?.revision ?? 0,
  };
}
function transfer(s: InventorySession, action: StashIntent): InventorySession {
  const result = transferCampStash(s, action);
  if (!result.ok) throw Error(result.reason);
  return result.value;
}
function rejected(
  s: InventorySession,
  action: StashIntent,
  match: RegExp,
  alive = true,
  idle = true,
) {
  const before = structuredClone(s),
    result = transferCampStash(s, action, alive, idle);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toMatch(match);
  expect(s).toEqual(before);
}
it("stores and retrieves immutable exact items through save/reload, preserving gold and RNG and rejecting repeated quotes", () => {
  const s = fixture(),
    item = s.character.grid.items[0]!.item,
    quoted = intent(s, "store");
  let stored = transfer(s, quoted);
  expect(s.exploration!.stash).toBeUndefined();
  expect(s.character.grid.items[0]!.item).toEqual(item);
  expect(stored.character.grid.items).toEqual([]);
  expect(stored.exploration!.stash!.grid.items).toEqual([{ item, x: 0, y: 0 }]);
  expect(stored.exploration!.containers).toEqual(s.exploration!.containers);
  expect(stored.loot.sequence).toBe(s.loot.sequence);
  expect(stored.loot.reserved).toContain(item.id);
  rejected(stored, quoted, /changed/);
  stored = deserializeCharacter(serializeCharacter(stored));
  const retrieval = intent(stored, "retrieve", item.id);
  const restored = transfer(stored, retrieval);
  expect(restored.exploration!.stash!.grid.items).toEqual([]);
  expect(restored.character.grid.items[0]!.item).toEqual(item);
  rejected(restored, retrieval, /changed/);
  const loaded = deserializeCharacter(serializeCharacter(restored));
  rejected(loaded, intent(loaded, "retrieve", item.id), /not in/);
  expect(loaded.exploration!.stash!.revision).toBe(2);
});
it("full destination and invalid footprint placement retain both grids", () => {
  const s = fixture();
  s.exploration!.stash = {
    ...newCampStash(),
    grid: {
      columns: 1,
      rows: 1,
      items: [{ item: inventoryItem("copper-band"), x: 0, y: 0 }],
    },
  };
  rejected(s, intent(s, "store"), /full or invalid/);
  delete s.exploration!.stash;
  rejected(
    s,
    { ...intent(s, "store"), position: { x: 10, y: 0 } },
    /full or invalid/,
  );
  const stored = transfer(s, intent(s, "store")),
    id = stored.exploration!.stash!.grid.items[0]!.item.id;
  stored.character.grid = {
    columns: 1,
    rows: 1,
    items: [{ item: inventoryItem("copper-band"), x: 0, y: 0 }],
  };
  rejected(stored, intent(stored, "retrieve", id), /full or invalid/);
});
it("equipped/unowned items, stale storage, distance, death, active attacks and revision overflow reject unchanged", () => {
  const s = fixture();
  s.character.equipment.boots = inventoryItem("trail-boots");
  rejected(s, intent(s, "store", s.character.equipment.boots.id), /unequip/);
  rejected(s, intent(s, "store", "missing"), /backpack/);
  rejected(s, { ...intent(s, "store"), expectedStashRevision: -1 }, /changed/);
  rejected(s, intent(s, "store"), /safely/, false);
  rejected(s, intent(s, "store"), /safely/, true, false);
  const far = fixture();
  far.exploration!.position = { x: 0, y: 0 };
  rejected(far, intent(far, "store"), /safely/);
  s.character.revision = Number.MAX_SAFE_INTEGER;
  rejected(s, intent(s, "store"), /revision limit/);
});
it("embedded components remain owned, replay-valid and reserved when the stash is the only modern item owner", () => {
  const s = fixture(),
    item = socketedCampItem();
  s.character.grid.items = [{ item, x: 0, y: 0 }];
  const stored = transfer(s, intent(s, "store"));
  const text = serializeCharacter(stored),
    loaded = deserializeCharacter(text);
  expect(JSON.parse(text).body.contentVersions).toEqual([2, 3, 4, 5, 6, 7, 8]);
  expect(loaded.exploration!.stash!.grid.items[0]!.item).toEqual(item);
  expect(loaded.loot.reserved).toEqual(
    expect.arrayContaining([item.id, item.embedded![0]!.id]),
  );
  rejected(loaded, intent(loaded, "retrieve", item.embedded![0]!.id), /not in/);
  const missingRegistry = JSON.parse(text);
  missingRegistry.body.contentVersions = [2, 3];
  missingRegistry.checksum = snapshotChecksum(
    JSON.stringify(missingRegistry.body),
  );
  expect(() => deserializeCharacter(JSON.stringify(missingRegistry))).toThrow(
    /content registry/,
  );
  expect(
    placeLoot(
      loaded.loot,
      item.embedded![0]!,
      { x: 0, y: 0 },
      0,
      -1,
      ARENA_NAV,
    ),
  ).toBeNull();
  const restored = transfer(loaded, intent(loaded, "retrieve", item.id));
  expect(restored.character.grid.items[0]!.item).toEqual(item);
});
it("duplicate roots, embedded identities and merchant-retired identities cannot coexist across stash and other ownership", () => {
  const s = fixture(),
    item = s.character.grid.items[0]!.item;
  s.exploration!.stash = {
    ...newCampStash(),
    grid: { columns: 10, rows: 8, items: [{ item, x: 0, y: 0 }] },
  };
  expect(() => validateSession(s)).toThrow(/Duplicate/);
  const socketed = socketedCampItem();
  s.exploration!.stash.grid.items[0]!.item = socketed;
  s.character.grid.items = [{ item: socketed.embedded![0]!, x: 0, y: 0 }];
  expect(() => validateSession(s)).toThrow(/Duplicate/);
  s.character.grid.items = [];
  const sold = merchantItem("ash-blade");
  s.exploration!.stash.grid.items = [{ item: sold, x: 0, y: 0 }];
  s.exploration!.merchant = {
    version: 1,
    revision: 2,
    purchased: ["ash-blade"],
    retired: [sold.id],
  };
  expect(() => validateSession(s)).toThrow(/Sold item identity/);
});
it("legacy stash absence is byte-stable and malformed/overlapping stash saves retain a recoverable previous checkpoint", () => {
  const s = fixture(),
    old = serializeCharacter(s);
  expect(serializeCharacter(deserializeCharacter(old))).toBe(old);
  expect(deserializeCharacter(old).exploration!.stash).toBeUndefined();
  const stored = serializeCharacter(transfer(s, intent(s, "store")));
  for (const change of [
    (b: Record<string, unknown>) => {
      b.extra = true;
    },
    (b: Record<string, unknown>) => {
      b.revision = -1;
    },
  ]) {
    const root = JSON.parse(stored);
    change(root.body.exploration.stash);
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    const broken = JSON.stringify(root);
    expect(() => deserializeCharacter(broken)).toThrow(/stash/);
    expect(inspectSnapshots(broken, old).kind).toBe("recoverable");
  }
  expect(() =>
    validateCampStash({
      ...newCampStash(),
      grid: { columns: 0, rows: 8, items: [] },
    }),
  ).toThrow();
});
it("generated layouts discovery quests and existing merchant ledger survive a stash transaction checkpoint", () => {
  let s = fixture(true);
  const purchase = tradeWithMerchant(s, {
    kind: "buy",
    id: "trail-boots",
    expectedRevision: s.character.revision,
    expectedMerchantRevision: 0,
  });
  if (!purchase.ok) throw Error(purchase.reason);
  s = purchase.value;
  const stored = transfer(s, intent(s, "store"));
  const loaded = deserializeCharacter(serializeCharacter(stored));
  expect(loaded.exploration!.areas).toEqual(s.exploration!.areas);
  expect(loaded.exploration!.quests).toEqual(s.exploration!.quests);
  expect(loaded.exploration!.containers).toEqual(s.exploration!.containers);
  expect(loaded.exploration!.merchant).toEqual(s.exploration!.merchant);
  expect(loaded.character.grid.items[0]!.item).toEqual(
    merchantItem("trail-boots"),
  );
  expect(loaded.exploration!.stash!.grid.items[0]!.item).toEqual(
    s.character.grid.items[0]!.item,
  );
});
