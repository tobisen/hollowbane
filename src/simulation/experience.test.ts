import { expect, it } from "vitest";
import {
  addExperience,
  createXpCurve,
  DEFAULT_XP_CURVE,
  experienceAt,
} from "./experience";

it("starts at level one and accumulates XP without mutating inputs", () => {
  const start = experienceAt(0);
  expect(start).toEqual({ level: 1, totalXp: 0, nextLevelXp: 100 });
  expect(addExperience(start.totalXp, 99)).toEqual({
    level: 1,
    totalXp: 99,
    nextLevelXp: 100,
  });
  expect(start.totalXp).toBe(0);
  expect(addExperience(99, 1)).toEqual(experienceAt(100));
});

it("resolves every exact threshold and the XP immediately before it", () => {
  for (let i = 1; i < 99; i++) {
    expect(experienceAt(DEFAULT_XP_CURVE[i]!).level).toBe(i + 1);
    expect(experienceAt(DEFAULT_XP_CURVE[i]! - 1).level).toBe(i);
  }
});

it("crosses multiple levels deterministically using configured costs", () => {
  const curve = createXpCurve(Array.from({ length: 98 }, () => 10));
  expect(addExperience(5, 37, curve)).toEqual({
    level: 5,
    totalXp: 42,
    nextLevelXp: 50,
  });
  expect(addExperience(5, 37, curve)).toEqual(experienceAt(42, curve));
});

it("caps at 99 and safely saturates additions that would overflow", () => {
  const curve = createXpCurve([
    Number.MAX_SAFE_INTEGER - 97,
    ...Array<number>(97).fill(1),
  ]);
  expect(
    addExperience(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER, curve),
  ).toEqual({ level: 99, totalXp: Number.MAX_SAFE_INTEGER, nextLevelXp: null });
  const max = DEFAULT_XP_CURVE[98]!;
  expect(experienceAt(Number.MAX_SAFE_INTEGER)).toEqual(experienceAt(max));
  expect(addExperience(max, 10)).toEqual(experienceAt(max));
});

it("rejects invalid XP and malformed or overflowing curves", () => {
  for (const xp of [
    -1,
    0.5,
    NaN,
    Infinity,
    -Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    expect(() => experienceAt(xp)).toThrow(RangeError);
    expect(() => addExperience(0, xp)).toThrow(RangeError);
    expect(() => addExperience(xp, 0)).toThrow(RangeError);
  }
  expect(() => createXpCurve([])).toThrow(RangeError);
  for (const cost of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    expect(() => createXpCurve(Array<number>(98).fill(cost))).toThrow(
      RangeError,
    );
  expect(() => experienceAt(0, Array<number>(99).fill(0))).toThrow(RangeError);
  expect(() => experienceAt(0, [1, ...DEFAULT_XP_CURVE.slice(1)])).toThrow(
    RangeError,
  );
  expect(() => experienceAt(0, [0, NaN, ...DEFAULT_XP_CURVE.slice(2)])).toThrow(
    RangeError,
  );
});
