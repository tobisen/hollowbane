import { expect, it } from "vitest";
import { createRng } from "./core";
import {
  aggregateModifier,
  resolveModifierProcs,
  validateModifier,
  validateModifiers,
  type StatModifier,
  type ProcModifier,
  type ModifierContext,
  type ModifierRootEvent,
} from "./item-modifiers";
const context: ModifierContext = {
  healthFraction: 0.4,
  targetStatuses: ["slow"],
  element: "physical",
  weapon: "melee",
};
const stat = (
  id: string,
  value: number,
  operation: StatModifier["operation"] = "add",
): StatModifier => ({
  id,
  source: "item-a",
  kind: "stat",
  stat: "damage",
  value,
  operation,
  group: "damage",
  stacking: "sum",
  priority: 0,
  condition: { kind: "always" },
});
const proc = (id: string): ProcModifier => ({
  id,
  source: "item-a",
  kind: "proc",
  event: "hit",
  eligibility: "weapon",
  chanceBasisPoints: 10000,
  cooldownTicks: 10,
  condition: { kind: "always" },
  effect: { kind: "damage", element: "fire", amount: 7 },
});
const root: ModifierRootEvent = {
  kind: "hit",
  tick: 1,
  actor: 0,
  target: 3,
  damage: 12,
  direct: true,
  weapon: true,
  triggered: false,
  context,
};
it("evaluates stable additive/increase/multiply layers and hard bounds without input mutation", () => {
  const mods = [
      stat("a", 10),
      stat("b", 0.5, "increase"),
      stat("c", 2, "multiply"),
    ],
    before = structuredClone(mods);
  validateModifiers(mods);
  expect(
    aggregateModifier("damage", 20, mods, context, { min: 0, max: 1000 }),
  ).toBe(90);
  expect(
    aggregateModifier("damage", 20, [...mods].reverse(), context, {
      min: 0,
      max: 60,
    }),
  ).toBe(60);
  expect(mods).toEqual(before);
  expect(
    aggregateModifier(
      "damage",
      0,
      [
        stat("a", 4, "multiply"),
        stat("b", 4, "multiply"),
        stat("c", 4, "multiply"),
      ],
      context,
      { min: 0, max: 100 },
    ),
  ).toBe(0);
});
it("uses explicit strongest priority/magnitude and conditional activation", () => {
  const mods = [
    { ...stat("a", 20), stacking: "strongest" as const, priority: 1 },
    { ...stat("b", 30), stacking: "strongest" as const, priority: 0 },
    {
      ...stat("c", 5),
      group: "conditional",
      condition: { kind: "health-below" as const, fraction: 0.5 },
    },
  ];
  expect(
    aggregateModifier("damage", 10, mods, context, { min: 0, max: 100 }),
  ).toBe(35);
  expect(
    aggregateModifier(
      "damage",
      10,
      mods,
      { ...context, healthFraction: 0.5 },
      { min: 0, max: 100 },
    ),
  ).toBe(30);
  expect(() =>
    aggregateModifier(
      "damage",
      0,
      [stat("a", 1), { ...stat("b", 2), stacking: "strongest" }],
      context,
      { min: 0, max: 100 },
    ),
  ).toThrow(/stacking/);
});
it("rejects malformed ranges, unknown effects, duplicate identities and unbounded content", () => {
  for (const value of [
    { ...stat("a", Infinity) },
    { ...stat("a", 1), extra: true },
    { ...stat("a", 1), stat: "unknown" },
    { ...proc("a"), chanceBasisPoints: 10001 },
    { ...proc("a"), cooldownTicks: 0.5 },
    { ...proc("a"), effect: { kind: "trigger-other-proc" } },
    {
      ...proc("a"),
      effect: { kind: "status", status: "slow", magnitude: 1, duration: 10 },
    },
  ])
    expect(() => validateModifier(value)).toThrow();
  expect(() => validateModifiers([stat("a", 1), stat("a", 2)])).toThrow(
    /Duplicate/,
  );
  expect(() =>
    validateModifiers(
      Array.from({ length: 257 }, (_, i) => stat(String(i), 1)),
    ),
  ).toThrow(/capacity/);
});
it("resolves sorted seeded procs with cooldowns and excludes recursive/DoT/missed hits", () => {
  const mods = [
      proc("b"),
      {
        ...proc("a"),
        effect: {
          kind: "restore" as const,
          resource: "mana" as const,
          amount: 3,
        },
      },
    ],
    initial = { ready: {} };
  const a = resolveModifierProcs(mods, root, initial, createRng(42));
  expect(a).toEqual(
    resolveModifierProcs([...mods].reverse(), root, initial, createRng(42)),
  );
  expect(a.events.map((e) => e.modifier)).toEqual(["item-a/a", "item-a/b"]);
  expect(a.events[0]?.target).toBe(0);
  expect(a.events[1]?.target).toBe(3);
  expect(initial).toEqual({ ready: {} });
  expect(
    resolveModifierProcs(mods, { ...root, tick: 2 }, a.state, () => {
      throw Error("Must not draw");
    }).events,
  ).toEqual([]);
  for (const event of [
    { ...root, triggered: true },
    { ...root, direct: false },
    { ...root, damage: 0 },
    { ...root, weapon: false },
  ])
    expect(
      resolveModifierProcs(mods, event, initial, () => {
        throw Error("Must not draw");
      }).events,
    ).toEqual([]);
  expect(
    resolveModifierProcs(mods, { ...root, tick: 11 }, a.state, createRng(42))
      .events,
  ).toHaveLength(2);
});
it("consumes one draw per eligible proc including failed chances and filters conditions", () => {
  let draws = 0;
  const mods = [
    { ...proc("a"), chanceBasisPoints: 0 },
    {
      ...proc("b"),
      condition: { kind: "element" as const, element: "cold" as const },
    },
  ];
  expect(
    resolveModifierProcs(mods, root, { ready: {} }, () => {
      draws++;
      return 0.5;
    }).events,
  ).toEqual([]);
  expect(draws).toBe(1);
  expect(() =>
    resolveModifierProcs([proc("a")], root, { ready: {} }, () => 1),
  ).toThrow(/RNG/);
});
