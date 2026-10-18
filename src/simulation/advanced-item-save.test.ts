import { it, expect } from "vitest";
import { advancedItem } from "./advanced-item-test-helper";
import { createCharacterInventory, type CharacterInventory } from "./equipment";
import { insertSocket } from "./item-sockets";
import { itemTree } from "./item-ownership";
import { createLootWorld, type WorldDrop } from "./world-loot";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { validateGeneratedItem } from "./item-save";
import {
  registeredItemContent,
  registeredContentForTable,
  L3_ITEM_CONTENT,
} from "./item-registry";
import { fromGround } from "../world/navigation";
import { ARENA_NAV } from "./combat";
function fixture() {
  let character = createCharacterInventory(40);
  const loot = createLootWorld(123);
  character.equipment.main = advancedItem("ash-blade", {
    version: 5,
    accept: (i) => i.quality === "normal" && i.socketCapacity === 2,
  });
  character.equipment.chest = advancedItem("woven-coat", {
    version: 7,
    accept: (i) => !!i.socketCapacity,
  });
  character.equipment.helmet = advancedItem("iron-cap", { version: 4 });
  for (const [base, version, seed, host] of [
    ["sigil-aevin", 6, 44, character.equipment.main.id],
    ["sigil-brask", 6, 44, character.equipment.main.id],
    ["poison-gem-3", 5, 43, character.equipment.chest.id],
  ] as const) {
    const component = advancedItem(base, { version, seed });
    character.grid.items.push({ item: component, x: 0, y: 0 });
    const result = insertSocket(character, host, component.id);
    if (!result.ok) throw Error(result.reason);
    character = result.value;
  }
  character.grid.items = [
    { item: advancedItem("copper-band", { version: 2 }), x: 0, y: 0 },
    {
      item: advancedItem("sigil-lyrvek", { version: 6, seed: 44 }),
      x: 1,
      y: 0,
    },
    {
      item: advancedItem("sootwrap-gloves", {
        accept: (i) => !!i.advanced?.affixes?.length,
      }),
      x: 3,
      y: 0,
    },
  ];
  loot.table = "sigil-cache";
  loot.sequence = 98765;
  loot.drops = [
    {
      item: advancedItem("sigil-kessil", { version: 6, seed: 44 }),
      position: fromGround({ x: 750, y: 560 }),
      tick: 10,
      source: -1,
    },
  ];
  return { character, loot };
}
type Body = {
  contentVersions: number[];
  character: CharacterInventory;
  loot: { drops: WorldDrop[] };
};
function alter(text: string, change: (body: Body) => void): string {
  const root = JSON.parse(text) as { body: Body; checksum: string };
  change(root.body);
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  return JSON.stringify(root);
}
it("round-trips all ownership layers and immutable attributes across mixed L1/L2/L3 content", () => {
  const s = fixture(),
    before = structuredClone(s),
    text = serializeCharacter(s, ARENA_NAV),
    restored = deserializeCharacter(text, ARENA_NAV);
  expect(restored.character).toEqual(s.character);
  expect(restored.loot.drops).toEqual(s.loot.drops);
  expect(restored.loot.sequence).toBe(98765);
  const ids = itemTree([
    ...s.character.grid.items.map((e) => e.item),
    ...Object.values(s.character.equipment),
  ]).map((i) => i.id);
  expect(new Set(restored.loot.reserved)).toEqual(new Set(ids));
  expect(new Set(ids).size).toBe(ids.length);
  expect(serializeCharacter(restored, ARENA_NAV)).toBe(text);
  expect(s).toEqual(before);
});
it("rejects corrupt embedded attributes, capacities, nesting, cross-location duplicates and forged manifests atomically", () => {
  const s = fixture(),
    text = serializeCharacter(s, ARENA_NAV);
  const mutations: ((body: Body) => void)[] = [
    (b) => {
      b.character.equipment.main!.socketCapacity!++;
    },
    (b) => {
      b.character.equipment.main!.embedded!.push(
        b.character.equipment.main!.embedded![0]!,
      );
    },
    (b) => {
      b.character.equipment.main!.embedded![0]!.stats.mana = 999;
    },
    (b) => {
      b.character.equipment.main!.embedded![0]!.embedded = [];
    },
    (b) => {
      b.loot.drops.push({
        ...b.loot.drops[0]!,
        item: b.character.equipment.main!.embedded![0]!,
      });
    },
    (b) => {
      b.contentVersions = [2, 3, 4, 5];
    },
    (b) => {
      b.contentVersions = [2, 3, 4, 5, 6, 7, 99];
    },
  ];
  for (const change of mutations) {
    const bad = alter(text, change);
    expect(() => deserializeCharacter(bad, ARENA_NAV)).toThrow();
    expect(inspectSnapshots(bad, text, ARENA_NAV).kind).toBe("recoverable");
    expect(serializeCharacter(s, ARENA_NAV)).toBe(text);
  }
});
it("accepts every previously published registry prefix and preserves exact generated items", () => {
  for (const version of [2, 3, 4, 5, 6, 7, 8]) {
    const character = createCharacterInventory(40),
      loot = createLootWorld(42),
      item = advancedItem("ash-blade", { version });
    character.grid.items = [{ item, x: 0, y: 0 }];
    loot.table =
      version === 2 ? "court" : version === 3 ? "reliquary" : "sanctum";
    const text = serializeCharacter({ character, loot }),
      old =
        version >= 4
          ? alter(text, (b) => {
              b.contentVersions = Array.from(
                { length: version - 1 },
                (_, i) => i + 2,
              );
            })
          : text;
    const restored = deserializeCharacter(old);
    expect(restored.character.grid.items[0]!.item).toEqual(item);
    if (version <= 3) expect(serializeCharacter(restored)).toBe(text);
  }
});
it("bounds malformed comparison traversal to trusted shape instead of attacker-controlled nesting", () => {
  const item = advancedItem("ash-blade", { version: 5 }),
    extra: Record<string, unknown> = {};
  let current = extra;
  for (let i = 0; i < 10000; i++) {
    const next = {};
    current.next = next;
    current = next;
  }
  expect(() => validateGeneratedItem({ ...item, extra })).toThrow(/attributes/);
  expect(() =>
    validateGeneratedItem({ ...item, stats: { ...item.stats, extra } }),
  ).toThrow(/attributes/);
});
it("adds final L3 component drops to legacy table IDs while retaining all older registries", () => {
  for (const table of ["court", "reliquary"]) {
    expect(
      L3_ITEM_CONTENT.tables
        .find((t) => t.id === table)!
        .bases.some((b) => b.id === "sigil-aevin"),
    ).toBe(true);
    expect(
      registeredItemContent(7)
        .tables.find((t) => t.id === table)!
        .bases.some((b) => b.id === "sigil-aevin"),
    ).toBe(false);
  }
  expect(registeredContentForTable("reliquary", 3).version).toBe(3);
  expect(registeredContentForTable("sigil-cache", 3).version).toBe(8);
  expect(() => registeredContentForTable("unknown", 8)).toThrow();
});
