import { expect, it } from "vitest";
import { environmentProps } from "./environment-view";
import { worldLayout, layoutFingerprint } from "../simulation/world-layout";
import { areaWalkable } from "../simulation/area-map";
it("decorates valid forests deterministically without placing solid scenery on walkable paths or changing fingerprints", () => {
  for (const area of [
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ] as const)
    for (const seed of [0, 1, 42, 0xffffffff])
      for (const version of [1, 2]) {
        const layout = worldLayout(area, seed, version),
          before = layoutFingerprint(layout),
          props = environmentProps(layout);
        expect(environmentProps(layout)).toEqual(props);
        if (area === "ancient-crypt" && version === 2) {
          expect(props.some((p) => p.kind === "wall")).toBe(true);
          expect(props.filter((p) => p.kind === "pillar")).toHaveLength(
            layout.map.objects.length,
          );
        }
        expect(props.length).toBeLessThanOrEqual(
          (area === "ancient-crypt"
            ? layout.map.terrain.cells.length * 2
            : 141) + layout.map.objects.length,
        );
        for (const prop of props)
          expect(areaWalkable(layout.map, prop, 0)).toBe(false);
        expect(layoutFingerprint(layout)).toBe(before);
      }
});
