import { expect, it } from "vitest";
import { environmentProps } from "./environment-view";
import { worldLayout, layoutFingerprint } from "../simulation/world-layout";
import { areaWalkable } from "../simulation/area-map";
it("decorates valid forests deterministically without placing solid scenery on walkable paths or changing fingerprints", () => {
  for (const area of ["haunted-forest", "forgotten-graveyard"] as const)
    for (const seed of [0, 1, 42, 0xffffffff])
      for (const version of [1, 2]) {
        const layout = worldLayout(area, seed, version),
          before = layoutFingerprint(layout),
          props = environmentProps(layout);
        expect(environmentProps(layout)).toEqual(props);
        expect(props.length).toBeLessThanOrEqual(
          141 + layout.map.objects.length,
        );
        for (const prop of props)
          expect(areaWalkable(layout.map, prop, 0)).toBe(false);
        expect(layoutFingerprint(layout)).toBe(before);
      }
});
