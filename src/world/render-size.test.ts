import { expect, it } from "vitest";
import { renderSize } from "./render-size";
it("preserves aspect and caps software fill while retaining full native GPU detail", () => {
  expect(renderSize({ x: 1920, y: 1080 }, true)).toEqual({
    x: 960,
    y: 540,
    ratio: 0.5,
  });
  expect(renderSize({ x: 1280, y: 800 }, true)).toEqual({
    x: 960,
    y: 600,
    ratio: 0.75,
  });
  expect(renderSize({ x: 1920, y: 1080 }, false)).toEqual({
    x: 1920,
    y: 1080,
    ratio: 1,
  });
});

it("adapts only sustained slow presentation after warmup and respects manual detail", async () => {
  const { shouldBalanceDetail } = await import("./render-size");
  expect(shouldBalanceDetail(Array(120).fill(16.7), 6000, false)).toBe(false);
  expect(shouldBalanceDetail(Array(120).fill(33.3), 6000, false)).toBe(true);
  expect(shouldBalanceDetail(Array(120).fill(33.3), 1000, false)).toBe(false);
  expect(shouldBalanceDetail(Array(120).fill(33.3), 6000, true)).toBe(false);
});
