import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import { createCharacterInventory } from "./equipment";
import { equipmentDefinition } from "./equipment-content";
import {
  deriveEquipment,
  captureEquipmentBase,
  applyEquipment,
} from "./equipment-stats";
import { it, expect } from "vitest";
import {
  ADVANCED_AFFIXES,
  validateAdvancedAffixes,
  rollAdvancedAffixes,
  validateAdvancedAffixSelection,
} from "./advanced-affixes";
import { createRng } from "./core";
import { AFFIX_ITEM_CONTENT } from "./item-registry";
import { generateLoot } from "./loot";
import { validateGeneratedItem, identifyItem } from "./item-save";
import { simulateLoot } from "./loot-diagnostics";
it("rolls deterministic constrained pools within the original magic/rare affix budget", () => {
  validateAdvancedAffixes(ADVANCED_AFFIXES);
  expect(ADVANCED_AFFIXES.length).toBeGreaterThan(25);
  const roll = (seed: number, quality: "magic" | "rare") =>
    rollAdvancedAffixes(
      { name: "Ash Blade", category: "blade", requirement: 1 },
      40,
      quality,
      "fixture",
      createRng(seed),
    );
  const seen = new Set<string>();
  for (let seed = 0; seed < 2000; seed++)
    for (const quality of ["magic", "rare"] as const) {
      const a = roll(seed, quality);
      expect(roll(seed, quality)).toEqual(a);
      validateAdvancedAffixSelection(a.affixes, "blade", 40, quality);
      expect(a.affixes.length).toBeLessThanOrEqual(quality === "magic" ? 2 : 4);
      a.affixes.forEach((id) => seen.add(id));
    }
  expect(seen.has("red-return")).toBe(true);
  expect(seen.has("mire-hunter")).toBe(true);
  expect(seen.has("coalburst")).toBe(true);
});
it("rejects invalid ranges, source/proc forgery, conflicts, duplicate affixes and invalid RNG", () => {
  const bad = structuredClone(ADVANCED_AFFIXES);
  Object.assign(bad[0]!.modifiers[0]!, { source: "forged" });
  expect(() => validateAdvancedAffixes(bad)).toThrow();
  expect(() =>
    validateAdvancedAffixSelection(
      ["red-return", "red-return"],
      "blade",
      40,
      "rare",
    ),
  ).toThrow();
  expect(() =>
    validateAdvancedAffixSelection(["red-return"], "chest", 40, "rare"),
  ).toThrow();
  expect(() =>
    validateAdvancedAffixSelection(["red-return"], "blade", 1, "magic"),
  ).toThrow();
  const excluded = ADVANCED_AFFIXES.find((a) => a.excludes.length)!;
  const other = ADVANCED_AFFIXES.find((a) =>
    excluded.excludes.includes(a.group),
  )!;
  expect(() =>
    validateAdvancedAffixSelection(
      [excluded.id, other.id],
      excluded.categories[0]!,
      40,
      "rare",
    ),
  ).toThrow();
  expect(() =>
    rollAdvancedAffixes(
      { name: "Blade", category: "blade", requirement: 1 },
      40,
      "magic",
      "fixture",
      () => 1,
    ),
  ).toThrow(/RNG/);
});
it("replays version7 affix attributes and detects tampering without altering older item streams", () => {
  let found = false;
  for (let sequence = 0; sequence < 2000 && !found; sequence++) {
    const item = generateLoot(
      { seed: 42, sequence, monsterLevel: 40, areaLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (!item?.advanced?.affixes?.length) continue;
    found = true;
    expect(validateGeneratedItem(item)).toEqual(item);
    const identified = identifyItem(item);
    expect(identified.advanced).toEqual(item.advanced);
    identified.advanced!.affixes!.pop();
    expect(() => validateGeneratedItem(identified)).toThrow();
  }
  expect(found).toBe(true);
  const report = simulateLoot(
    { seed: 77, monsterLevel: 40, areaLevel: 40, table: "sanctum" },
    25000,
    AFFIX_ITEM_CONTENT,
  );
  expect(report.distributionValid).toBe(true);
  expect(report.invalidItems).toBe(0);
});

it("applies physical resistance affixes to actual mitigated incoming damage", () => {
  let found: ReturnType<typeof generateLoot> = null;
  for (let sequence = 0; sequence < 100000 && !found; sequence++) {
    const item = generateLoot(
      { seed: 42, sequence, monsterLevel: 40, areaLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (item?.advanced?.affixes?.includes("stone-shelter"))
      found = identifyItem(item);
  }
  if (!found) throw Error("Missing physical-resistance fixture");
  const item = found;
  const run = (resistance: boolean) => {
    const world = createCombat(),
      actor = world.actors[0]!,
      c = createCharacterInventory(40),
      gear = structuredClone(item);
    if (!resistance)
      gear.advanced!.modifiers = gear.advanced!.modifiers.filter(
        (m) => m.kind !== "stat" || m.stat !== "physicalResistance",
      );
    c.equipment[equipmentDefinition(gear).slots[0]!] = gear;
    const base = captureEquipmentBase(actor);
    base.defense.physicalResistance = 0.1;
    applyEquipment(deriveEquipment(c, base), actor);
    applyCombatHit(world, world.actors[1]!, actor, ARENA_NAV, {
      damage: 1000,
      element: "physical",
      guaranteed: true,
    });
    const hit = world.events.find((e) => e.kind === "damage");
    if (hit?.kind !== "damage") throw Error("No hit");
    return {
      amount: hit.result.amount,
      resistance: actor.defense.physicalResistance,
    };
  };
  const plain = run(false),
    protectedHit = run(true);
  expect(plain.resistance).toBeCloseTo(0.1);
  expect(protectedHit.resistance).toBeGreaterThan(plain.resistance);
  expect(protectedHit.amount).toBeLessThan(plain.amount);
});
