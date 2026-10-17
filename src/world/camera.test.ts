import { expect, it } from "vitest";
import { clampZoom, followAlpha, followPosition } from "./camera";
it("clamps zoom and follows independently of frame frequency", () => {
  expect(clampZoom(0.1)).toBe(0.8);
  expect(clampZoom(3)).toBe(1.6);
  expect(1 - (1 - followAlpha(8)) ** 2).toBeCloseTo(followAlpha(16));
  expect(followAlpha(10000)).toBeLessThan(1);
});

it("keeps wide and tall viewports covered by the authored world", () => {
  expect(clampZoom(0.8, { x: 1920, y: 800 })).toBe(1.25);
  expect(clampZoom(0.8, { x: 1000, y: 1200 })).toBeCloseTo(1200 / 1024);
  expect(clampZoom(1.1, { x: 3840, y: 1080 })).toBe(2.5);
});

it("converges without overshoot or subpixel tail jitter across frame rates", () => {
  for (const dt of [8, 16, 33]) {
    let p = { x: 0, y: 0 };
    const target = { x: 780, y: 500 };
    for (let i = 0; i < 400; i++) {
      p = followPosition(p, target, dt);
      expect(p.x).toBeLessThanOrEqual(target.x);
      expect(p.y).toBeLessThanOrEqual(target.y);
    }
    expect(p).toEqual(target);
  }
});
