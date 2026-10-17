import { expect, it } from "vitest";
import { arenaView } from "./arena-view";
it.each([
  [1280, 800, 566],
  [1920, 1080, 846],
  [1024, 768, 528],
])("walkable ground stays above HUD at %i x %i", (width, height, hud) => {
  const v = arenaView({ x: width, y: height }, hud);
  for (const p of [
    { x: 230, y: 260 },
    { x: 1300, y: 260 },
    { x: 230, y: 830 },
    { x: 1300, y: 830 },
  ]) {
    const x = width / 2 + (p.x - v.center.x) * v.scale,
      y = height / 2 + (p.y - v.center.y) * v.scale;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(width);
    expect(y).toBeGreaterThan(60);
    expect(y + 16).toBeLessThan(hud);
  }
});
it("legacy framing remains identical and invalid inputs are rejected", () => {
  expect(arenaView({ x: 1280, y: 800 }, null)).toEqual({
    scale: 1,
    center: { x: 768, y: 512 },
    playBottom: 800,
  });
  expect(() => arenaView({ x: 0, y: 800 }, 500)).toThrow();
});
