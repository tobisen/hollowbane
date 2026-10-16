import { expect, it } from "vitest";
import { clampZoom, followAlpha } from "./camera";
it("clamps zoom and follows independently of frame frequency", () => {
  expect(clampZoom(0.1)).toBe(0.8);
  expect(clampZoom(3)).toBe(1.6);
  expect(1 - (1 - followAlpha(8)) ** 2).toBeCloseTo(followAlpha(16));
  expect(followAlpha(10000)).toBeLessThan(1);
});
