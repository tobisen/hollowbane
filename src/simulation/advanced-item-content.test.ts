import { expect, it } from "vitest";
import { createRng } from "./core";
import {
  ADVANCED_ITEMS,
  validateAdvancedCatalog,
  rollModifiers,
  activeSetBonuses,
} from "./advanced-item-content";
import {
  validateModifiers,
  aggregateModifier,
  type ModifierContext,
} from "./item-modifiers";
const context: ModifierContext = {
  healthFraction: 1,
  targetStatuses: [],
  element: "physical",
  weapon: "melee",
};
it("validates12 original uniques and3 complete four-piece sets with2/3/4 thresholds", () => {
  expect(validateAdvancedCatalog(ADVANCED_ITEMS)).toBe(ADVANCED_ITEMS);
  expect(ADVANCED_ITEMS.uniques).toHaveLength(12);
  expect(ADVANCED_ITEMS.sets).toHaveLength(3);
  for (const s of ADVANCED_ITEMS.sets) {
    expect(s.pieces).toHaveLength(4);
    expect(s.bonuses.map((b) => b.count)).toEqual([2, 3, 4]);
  }
});
it("rolls controlled ranges reproducibly, including both endpoints and independent instances", () => {
  for (const u of ADVANCED_ITEMS.uniques) {
    const a = rollModifiers(u.modifiers, "instance-a", createRng(42)),
      b = rollModifiers(u.modifiers, "instance-a", createRng(42));
    expect(a).toEqual(b);
    validateModifiers(a);
    const min = rollModifiers(u.modifiers, "instance-a", () => 0),
      max = rollModifiers(u.modifiers, "instance-a", () => 0.999999999);
    for (let i = 0; i < u.modifiers.length; i++) {
      const t = u.modifiers[i]!,
        lo = min[i]!,
        hi = max[i]!;
      if (t.kind === "stat" && lo.kind === "stat" && hi.kind === "stat") {
        expect(lo.value).toBe(t.min);
        expect(hi.value).toBe(t.max);
      }
    }
  }
});
it("activates cumulative set thresholds and immediately deactivates without persistent state", () => {
  for (const s of ADVANCED_ITEMS.sets) {
    const members = s.pieces.map((p) => ({ set: s.id, piece: p.id }));
    expect(activeSetBonuses(members.slice(0, 1)).active).toEqual([]);
    expect(
      activeSetBonuses(members.slice(0, 2)).active.map((a) => a.required),
    ).toEqual([2]);
    expect(
      activeSetBonuses(members.slice(0, 3)).active.map((a) => a.required),
    ).toEqual([2, 3]);
    const full = activeSetBonuses(members);
    expect(full.active.map((a) => a.required)).toEqual([2, 3, 4]);
    validateModifiers(full.modifiers);
    expect(activeSetBonuses([...members].reverse())).toEqual(full);
    expect(activeSetBonuses([members[0]!, members[0]!]).active).toEqual([]);
    expect(activeSetBonuses([]).active).toEqual([]);
  }
});
it("applies generic full-set trade-offs through shared aggregation", () => {
  const s = ADVANCED_ITEMS.sets.find((s) => s.id === "wayfarer-vow")!,
    mods = activeSetBonuses(
      s.pieces.map((p) => ({ set: s.id, piece: p.id })),
    ).modifiers;
  expect(
    aggregateModifier("damage", 100, mods, context, { min: 0, max: 1000 }),
  ).toBeCloseTo(115);
  expect(
    aggregateModifier("castSpeed", 0, mods, context, { min: -50, max: 300 }),
  ).toBe(-8);
});
it("rejects duplicate identities, invalid bases/ranges, missing full bonuses and forged effects", () => {
  const changes = [
    (c: typeof ADVANCED_ITEMS) => {
      c.uniques[1]!.id = c.uniques[0]!.id;
    },
    (c: typeof ADVANCED_ITEMS) => {
      c.uniques[0]!.base = "missing";
    },
    (c: typeof ADVANCED_ITEMS) => {
      c.sets[0]!.bonuses.pop();
    },
    (c: typeof ADVANCED_ITEMS) => {
      const t = c.uniques[0]!.modifiers[0]!;
      if (t.kind === "stat") t.step = 0.3;
    },
    (c: typeof ADVANCED_ITEMS) => {
      c.uniques[0]!.level = 100;
    },
  ];
  changes.push((c) => {
    for (const p of c.sets[0]!.pieces) p.base = "iron-cap";
  });
  changes.push((c) => {
    const t = c.sets[0]!.bonuses[0]!.modifiers[0]!;
    if (t.kind === "stat") t.max = t.min + 1;
  });
  for (const change of changes) {
    const c = structuredClone(ADVANCED_ITEMS);
    change(c);
    expect(() => validateAdvancedCatalog(c)).toThrow();
  }
  expect(() =>
    validateAdvancedCatalog({ ...ADVANCED_ITEMS, extra: true }),
  ).toThrow();
});
