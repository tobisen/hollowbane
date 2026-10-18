import { it, expect } from "vitest";
import {
  aggregateModifier,
  validateModifiers,
  type ItemModifier,
  type StatModifier,
} from "./item-modifiers";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import { createItemHitRules } from "./item-hit-rules";
import { prepareItemEffects, resolveItemEffects } from "./item-effects";
const context = {
  healthFraction: 0.2,
  targetStatuses: [],
  element: "physical",
  weapon: "melee",
} as const;
it("keeps 256 conflicting extreme modifiers finite, bounded and independent of enumeration order", () => {
  const mods: StatModifier[] = Array.from({ length: 256 }, (_, n) => ({
    kind: "stat",
    id: `m${n}`,
    source: "stress",
    condition: { kind: "always" },
    stat: "damage",
    operation: n % 3 === 0 ? "add" : n % 3 === 1 ? "increase" : "multiply",
    value: n % 3 === 0 ? (n % 2 ? -10000 : 10000) : n % 3 === 1 ? 10 : 4,
    group: `g${n % 17}`,
    stacking: n % 2 ? "strongest" : "sum",
    priority: n % 5,
  }));
  expect(() => validateModifiers(mods)).toThrow(/Conflicting/);
  for (const modifier of mods) modifier.group += `-${modifier.stacking}`;
  validateModifiers(mods);
  const a = aggregateModifier(
    "damage",
    100,
    mods,
    { ...context, targetStatuses: [] },
    { min: 0, max: 10000 },
  );
  expect(Number.isFinite(a)).toBe(true);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(a).toBeLessThanOrEqual(10000);
  expect(
    aggregateModifier(
      "damage",
      100,
      [...mods].reverse(),
      { ...context, targetStatuses: [] },
      { min: 0, max: 10000 },
    ),
  ).toBe(a);
  expect(() => validateModifiers([...mods, mods[0]!])).toThrow(/capacity/);
});
it("bounds maximum proc fan-out to one generation without recursive hits or duplicate root processing", () => {
  const run = () => {
    const w = createCombat(),
      a = w.actors[0]!,
      t = w.actors[1]!;
    w.hostilesActive = false;
    a.offense.criticalChance = 0;
    t.hp = t.maxHp = 10000000;
    t.defense = { defense: 0, armor: 0, physicalResistance: 0 };
    const mods: ItemModifier[] = Array.from({ length: 256 }, (_, n) => ({
      kind: "proc",
      id: `p${n}`,
      source: "stress",
      condition: { kind: "always" },
      event: "hit",
      eligibility: "weapon",
      chanceBasisPoints: 10000,
      cooldownTicks: 0,
      effect: { kind: "damage", element: "fire", amount: 10000 },
    }));
    a.itemRules = createItemHitRules(a.offense, a.defense, mods);
    prepareItemEffects(w);
    applyCombatHit(w, a, t, ARENA_NAV, {
      damage: 1,
      element: "physical",
      origin: "weapon",
      guaranteed: true,
    });
    resolveItemEffects(w, ARENA_NAV);
    expect(w.itemEffects!.roots).toBe(1);
    expect(w.itemEffects!.procs).toBe(256);
    expect(w.itemEffects!.applied).toBe(256);
    expect(w.itemEffects!.events).toHaveLength(256);
    expect(w.hitTrace!.pending).toHaveLength(0);
    expect(t.hp).toBe(10000000 - 1 - 256 * 10000);
    const before = structuredClone(w.itemEffects);
    resolveItemEffects(w, ARENA_NAV);
    expect(w.itemEffects).toEqual(before);
    return { seed: w.seed, hp: t.hp, effects: w.itemEffects };
  };
  expect(run()).toEqual(run());
});
