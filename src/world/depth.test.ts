import { expect, it } from "vitest";
import { footDepth, isOccluding } from "./depth";
it("sorts by feet rather than sprite tops with stable ties", () => {
  expect(footDepth(400, 1)).toBeLessThan(footDepth(401, 0));
  expect(footDepth(400, 1)).toBeLessThan(footDepth(400, 2));
  expect(() => footDepth(NaN, 0)).toThrow();
});
it("identifies a player behind a tall prop but not in front or outside it", () => {
  const prop = { x: 100, y: 200, width: 80, height: 100 };
  expect(isOccluding({ x: 100, y: 150 }, prop)).toBe(true);
  expect(isOccluding({ x: 100, y: 210 }, prop)).toBe(false);
  expect(isOccluding({ x: 200, y: 150 }, prop)).toBe(false);
});
