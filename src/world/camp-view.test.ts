import { expect, it } from "vitest";
import { campProps } from "./camp-view";
import { worldLayout, layoutFingerprint } from "../simulation/world-layout";
import { validGeneratedPlacement } from "../simulation/generation-validation";
it("keeps camp scenery outside unchanged historical and current navigation and anchor geometry", () => {
  for (const version of [1, 2])
    for (const seed of [0, 42, 0xffffffff]) {
      const layout = worldLayout("ashen-refuge", seed, version),
        before = layoutFingerprint(layout);
      const props = campProps(layout),
        t = layout.map.terrain;
      expect(props).toHaveLength(9);
      for (const prop of props) {
        expect(
          prop.x < t.origin.x ||
            prop.x > t.origin.x + t.width * t.cellSize ||
            prop.y < t.origin.y ||
            prop.y > t.origin.y + t.height * t.cellSize,
        ).toBe(true);
        expect(prop.width).toBeGreaterThan(0);
      }
      expect(campProps(layout)).toEqual(props);
      expect(layoutFingerprint(layout)).toBe(before);
      expect(validGeneratedPlacement(layout)).toBe(true);
    }
  expect(campProps(worldLayout("haunted-forest", 42, 2))).toEqual([]);
});
