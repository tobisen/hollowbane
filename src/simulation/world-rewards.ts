import { areaDefinition, type AreaId } from "./world";
import type { LootWorld } from "./world-loot";
/** Change future roll context only; retain the existing table, stream and owned drops. */
export function configureWorldRewards(loot: LootWorld, area: AreaId): void {
  const level = areaDefinition(area).level;
  loot.areaLevel = level;
  loot.monsterLevel = level;
}
