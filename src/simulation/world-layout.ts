import type { AreaId } from "./world";
import type { AreaLayout } from "./area-anchors";
import { prototypeArea } from "./world-prototype";
import { generateWilderness } from "./wilderness-layout";
import { generateDungeon } from "./dungeon-layout";
/** Version 1 remains pinned to W1; version 2 pins both generator version-one rules. */
export const GENERATED_WORLD_VERSION = 2;
export function worldLayout(
  area: AreaId,
  seed: number,
  version: number,
): AreaLayout {
  if (version === 1) return prototypeArea(area, seed);
  if (version !== GENERATED_WORLD_VERSION)
    throw Error("Unsupported world layout version");
  if (area === "ashen-refuge") return prototypeArea(area, seed);
  return area === "ancient-crypt"
    ? generateDungeon(seed).layout
    : generateWilderness(area, seed).layout;
}
/** Persisted drift guard, separate from item/save checksums. */
export function layoutFingerprint(layout: AreaLayout): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(layout))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(16).padStart(8, "0");
}
