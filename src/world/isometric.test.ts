import { expect, it } from "vitest";
import { screenToWorld, tileAt, worldToScreen } from "./isometric";
it("round trips fractional/negative world coordinates across the playable extent", () => {
  for (let x = -20.25; x < 20; x += 0.5)
    for (let y = -20.75; y < 20; y += 0.5) {
      const world = { x, y };
      expect(screenToWorld(worldToScreen(world))).toEqual(world);
    }
});
it("picks diamond tiles on both sides of a boundary", () => {
  expect(tileAt(worldToScreen({ x: 2.99, y: 3.01 }))).toEqual({ x: 2, y: 3 });
  expect(tileAt(worldToScreen({ x: 3.01, y: 2.99 }))).toEqual({ x: 3, y: 2 });
});
