import { expect, it } from "vitest";
import { environmentProps } from "./environment-view";
import { worldLayout, layoutFingerprint } from "../simulation/world-layout";
import { areaWalkable } from "../simulation/area-map";
it("decorates valid forests deterministically without placing solid scenery on walkable paths or changing fingerprints", () => {
  for (const seed of [0, 1, 42, 0xffffffff])
    for (const version of [1, 2]) {
      const layout = worldLayout("haunted-forest", seed, version),
        before = layoutFingerprint(layout),
        props = environmentProps(layout);
      expect(environmentProps(layout)).toEqual(props);
      expect(props.length).toBeLessThanOrEqual(140 + layout.map.objects.length);
      for (const prop of props)
        expect(areaWalkable(layout.map, prop, 0)).toBe(false);
      expect(layoutFingerprint(layout)).toBe(before);
    }
});
