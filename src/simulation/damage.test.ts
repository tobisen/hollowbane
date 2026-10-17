import { describe, expect, it } from "vitest";
import { createRng } from "./core";
import { DAMAGE_FORMULA, resolveDamage } from "./damage";
const offense = {
  damage: 40,
  accuracy: 100,
  criticalChance: 0.2,
  criticalMultiplier: 2,
};
const defense = { defense: 100, armor: 100, physicalResistance: 0.5 };
describe("physical damage", () => {
  it("combines armor and resistance with floor rounding", () => {
    expect(resolveDamage(offense, defense, () => 0.3)).toMatchObject({
      amount: 10,
      chance: 0.5,
      critical: false,
      outcome: "hit",
      type: "physical",
    });
    expect(resolveDamage(offense, defense, () => 0.1).amount).toBe(20);
    expect(resolveDamage(offense, defense, () => 0.5)).toMatchObject({
      amount: 0,
      critical: false,
      outcome: "miss",
    });
  });
  it("caps accuracy, resistance and vulnerabilities using configurable values", () => {
    expect(
      resolveDamage({ ...offense, accuracy: 0 }, defense, () => 0.05).chance,
    ).toBe(0.1);
    expect(
      resolveDamage(offense, { ...defense, defense: 0 }, () => 0.99).chance,
    ).toBe(0.95);
    expect(
      resolveDamage(offense, { ...defense, physicalResistance: 99 }, () => 0.3)
        .amount,
    ).toBe(5);
    expect(
      resolveDamage(offense, { ...defense, physicalResistance: -99 }, () => 0.3)
        .amount,
    ).toBe(40);
    expect(
      resolveDamage(offense, defense, () => 0.3, {
        ...DAMAGE_FORMULA,
        armorScale: 200,
      }).amount,
    ).toBe(13);
  });
  it("replays seeded outcomes and consumes two draws on a miss", () => {
    const run = () => {
      const rng = createRng(42);
      return Array.from({ length: 200 }, () =>
        resolveDamage(offense, defense, rng),
      );
    };
    expect(run()).toEqual(run());
    expect(new Set(run().map((x) => x.outcome)).size).toBe(2);
    let calls = 0;
    resolveDamage(offense, defense, () => {
      calls++;
      return 0.99;
    });
    expect(calls).toBe(2);
  });
  it("rejects invalid balance and RNG values", () => {
    for (const damage of [-1, NaN, Infinity])
      expect(() =>
        resolveDamage({ ...offense, damage }, defense, () => 0),
      ).toThrow();
    expect(() =>
      resolveDamage(offense, { ...defense, armor: -1 }, () => 0),
    ).toThrow();
    expect(() => resolveDamage(offense, defense, () => 1)).toThrow();
    expect(() =>
      resolveDamage(offense, defense, () => 0, {
        ...DAMAGE_FORMULA,
        armorScale: 0,
      }),
    ).toThrow();
  });
});
