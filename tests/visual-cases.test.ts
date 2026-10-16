import { expect, it } from "vitest";
import { worldToScreen, screenToWorld } from "../src/world/isometric";
import { footDepth, isOccluding } from "../src/world/depth";
const cases = Array.from({ length: 20 }, (_, i) => ({
  x: ((i % 5) - 2) * 1.25,
  y: (Math.floor(i / 5) - 2) * 1.5,
}));
it.each(cases)(
  "preserves projection and front/back order at $x,$y",
  (point) => {
    const foot = worldToScreen(point);
    expect(screenToWorld(foot)).toEqual(point);
    const prop = { x: foot.x, y: foot.y, width: 80, height: 160 };
    expect(isOccluding({ x: foot.x, y: foot.y - 30 }, prop)).toBe(true);
    expect(isOccluding({ x: foot.x, y: foot.y + 30 }, prop)).toBe(false);
    expect(footDepth(foot.y - 30, 1)).toBeLessThan(footDepth(prop.y, 2));
    expect(footDepth(foot.y + 30, 1)).toBeGreaterThan(footDepth(prop.y, 2));
  },
);
