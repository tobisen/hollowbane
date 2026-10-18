import { advancedItem } from "./advanced-item-test-helper";
import { createCharacterInventory } from "./equipment";
import { insertSocket, extractSockets } from "./item-sockets";
import { describeRuneRecipes, compareItemModifiers } from "./item-description";
import { expect, it } from "vitest";
import { ADVANCED_EXAMPLES } from "./advanced-item-examples";
import { ADVANCED_CONTENT } from "./item-registry";
import { generateLoot } from "./loot";
import { identifyItem } from "./item-save";
import { describeAdvancedItem } from "./item-description";
const example = (id: string) =>
  generateLoot(
    {
      seed: 42,
      sequence: ADVANCED_EXAMPLES[id]!,
      areaLevel: 12,
      monsterLevel: 12,
      table: "sanctum",
    },
    ADVANCED_CONTENT,
  )!;
it("replays all 24 developer examples without leaking unidentified modifiers", () => {
  expect(Object.keys(ADVANCED_EXAMPLES)).toHaveLength(24);
  for (const id of Object.keys(ADVANCED_EXAMPLES)) {
    const item = example(id),
      before = structuredClone(item);
    expect(item.unique ?? item.advanced?.set?.piece).toBe(id);
    expect(describeAdvancedItem(item)).toBe("");
    expect(describeAdvancedItem(identifyItem(item)).length).toBeGreaterThan(10);
    expect(item).toEqual(before);
  }
});
it("describes actual equipped distinct pieces, cumulative activation and removal", () => {
  const items = ["watch-hands", "watch-brow", "watch-coat", "watch-tread"].map(
    (id) => identifyItem(example(id)),
  );
  const full = describeAdvancedItem(items[0]!, items);
  expect(full).toContain("Ashen Watch · 4/4 equipped");
  expect(full).toContain("ACTIVE 4-piece bonus");
  expect(full).toContain("10% on hit (weapon): 12 fire damage");
  const partial = describeAdvancedItem(items[0]!, items.slice(0, 2));
  expect(partial).toContain("ACTIVE 2-piece bonus");
  expect(partial).toContain("Inactive 3-piece bonus");
  expect(describeAdvancedItem(items[0]!, [items[0]!, items[0]!])).toContain(
    "1/4 equipped",
  );
});
it("describes gem grades, host-dependent effects and all original patterns", () => {
  const gem = advancedItem("fire-gem-3", { version: 5, seed: 43 });
  const text = describeAdvancedItem(gem);
  expect(text).toContain("Gem grade 3 · fire");
  expect(text).toContain("7 fire damage");
  expect(text).toContain("Fire resistance: +11%");
  expect(text).toContain("Fire resistance: +15%");
  const rune = advancedItem("sigil-lyrvek", { version: 6 });
  expect(describeAdvancedItem(rune)).toContain("Cast speed: +5%");
  const recipes = describeRuneRecipes();
  expect(recipes).toContain("Cinder Covenant");
  expect(recipes).toContain("Aevin Sigil → Brask Sigil");
  expect(recipes).toContain("Lastlight Vow");
  expect(recipes).toContain("Fire resistance: -12%");
});
it("shows ordered embedded identities and distinguishes active from bag-only patterns", () => {
  let c = createCharacterInventory(40);
  const host = advancedItem("ash-blade", {
    version: 8,
    accept: (i) => i.quality === "normal" && i.socketCapacity === 2,
  });
  c.equipment.main = host;
  for (const base of ["sigil-aevin", "sigil-brask"]) {
    const component = advancedItem(base, { version: 6, seed: 44 });
    c.grid.items.push({ item: component, x: 0, y: 0 });
    const r = insertSocket(c, host.id, component.id);
    if (!r.ok) throw Error(r.reason);
    c = r.value;
  }
  const full = c.equipment.main!,
    before = structuredClone(full),
    active = describeAdvancedItem(full, [full]);
  expect(active).toContain("Sockets 2/2");
  expect(active).toContain("1. Aevin Sigil");
  expect(active).toContain("2. Brask Sigil");
  expect(active).toContain("Cinder Covenant · ACTIVE");
  expect(describeAdvancedItem(full)).toContain("inactive until equipped");
  expect(full).toEqual(before);
  const removed = extractSockets(c, host.id);
  if (!removed.ok) throw Error(removed.reason);
  expect(describeAdvancedItem(removed.value.equipment.main!)).not.toContain(
    "Pattern:",
  );
});
it("compares complete conditional/proc contracts in addition to numeric derived totals", () => {
  const before = createCharacterInventory(),
    after = createCharacterInventory();
  before.equipment.main = identifyItem(example("coalward-edge"));
  after.equipment.main = identifyItem(example("reedwake"));
  const diff = compareItemModifiers(before, after);
  expect(diff.removed.some((s) => s.includes("15% on hit (weapon)"))).toBe(
    true,
  );
  expect(diff.added.some((s) => s.startsWith("Attack speed:"))).toBe(true);
  expect(compareItemModifiers(before, before)).toEqual({
    added: [],
    removed: [],
  });
  const left = structuredClone(before),
    m = left.equipment.main!.advanced!.modifiers[0]!;
  if (m.kind !== "stat") throw Error("Fixture");
  m.condition = { kind: "target-status", status: "poison" };
  expect(
    compareItemModifiers(before, left).added.some((s) =>
      s.includes("poisoned targets"),
    ),
  ).toBe(true);
});
