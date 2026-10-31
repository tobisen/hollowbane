import { act1ReadabilityMap, ACT1_START } from "./act1-readability";
import type { AreaLayout } from "./area-anchors";
import { areaSeed } from "./world";

/** Bounded candidate geography, derived from the approved four-clearing pilot.
 * Deliberately not dispatched by worldLayout: normal map versions/saves stay pinned.
 * Seed changes only the existing encounter/container streams and scenery placement.
 */
export function classicAct1Layout(worldSeed: number): AreaLayout {
  const seed = areaSeed(worldSeed, "haunted-forest");
  return {
    map: { ...act1ReadabilityMap(), seed },
    spawn: { ...ACT1_START },
    exits: [
      {
        id: "camp",
        trigger: { x: 4, y: 28 },
        arrival: { x: 7, y: 29 },
      },
      {
        id: "graveyard",
        trigger: { x: 47, y: 12 },
        arrival: { x: 45, y: 12 },
      },
    ],
  };
}
