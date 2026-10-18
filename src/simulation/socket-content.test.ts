import { it, expect } from "vitest";
import {
  SOCKET_CONTENT,
  validateSocketCatalog,
  gemModifiers,
} from "./socket-content";
import { EQUIPMENT_CONTENT } from "./item-content";
import { aggregateModifier } from "./item-modifiers";
it("defines bounded weapon/armor/shield caps and twelve original graded elemental gems", () => {
  expect(validateSocketCatalog(SOCKET_CONTENT)).toEqual(SOCKET_CONTENT);
  expect(SOCKET_CONTENT.gems).toHaveLength(12);
  for (const base of Object.keys(SOCKET_CONTENT.hosts))
    expect(EQUIPMENT_CONTENT.bases.some((b) => b.id === base)).toBe(true);
  for (const element of ["fire", "cold", "lightning", "poison"])
    expect(
      SOCKET_CONTENT.gems
        .filter((g) => g.element === element)
        .map((g) => g.grade),
    ).toEqual([1, 2, 3]);
  expect(SOCKET_CONTENT.hosts["copper-band"]).toBeUndefined();
});
it("selects independent slot-specific effects with controlled quality growth", () => {
  const ctx = {
    healthFraction: 1,
    targetStatuses: [],
    element: "physical" as const,
    weapon: "melee" as const,
  };
  const before = structuredClone(SOCKET_CONTENT);
  const armor = gemModifiers("fire-gem-3", "armor", "item:a"),
    shield = gemModifiers("fire-gem-3", "shield", "item:b");
  expect(
    aggregateModifier("fireResistance", 0, armor, ctx, { min: -100, max: 75 }),
  ).toBe(11);
  expect(
    aggregateModifier("fireResistance", 0, shield, ctx, { min: -100, max: 75 }),
  ).toBe(15);
  const weapon = gemModifiers("fire-gem-3", "weapon", "item:c")[0]!;
  expect(weapon.kind).toBe("proc");
  if (weapon.kind === "proc")
    expect(weapon.effect).toEqual({
      kind: "damage",
      element: "fire",
      amount: 7,
    });
  armor[0]!.id = "changed";
  expect(SOCKET_CONTENT).toEqual(before);
  expect(() => gemModifiers("missing", "armor", "item:a")).toThrow();
});
it("rejects impossible caps, duplicate identities, missing slot effects and forged modifier sources", () => {
  for (const alter of [
    (c: typeof SOCKET_CONTENT) => {
      c.hosts["ash-blade"]!.limit = 7;
    },
    (c: typeof SOCKET_CONTENT) => {
      c.gems.push(c.gems[0]!);
    },
    (c: typeof SOCKET_CONTENT) => {
      c.gems[0]!.effects.armor = [];
    },
    (c: typeof SOCKET_CONTENT) => {
      Object.assign(c.gems[0]!.effects.weapon[0]!, { source: "forged" });
    },
    (c: typeof SOCKET_CONTENT) => {
      c.gems[0]!.weight = 0;
    },
  ]) {
    const copy = structuredClone(SOCKET_CONTENT);
    alter(copy);
    expect(() => validateSocketCatalog(copy)).toThrow();
  }
});
