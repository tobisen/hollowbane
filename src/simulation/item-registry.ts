import {
  EQUIPMENT_CONTENT,
  validateItemContent,
  itemContentForVersion as legacyContent,
  type ItemContent,
  type Quality,
} from "./item-content";
import {
  ADVANCED_ITEMS,
  validateAdvancedCatalog,
} from "./advanced-item-content";
export type ItemQuality = Quality | "set";
export const ADVANCED_GENERATION = Object.freeze({
  contentVersion: 4,
  setFromRareBasisPoints: 2500,
});
/** Separate construction avoids changing the immutable legacy registries or their seeded streams. */
function advancedContent(): ItemContent {
  validateAdvancedCatalog(ADVANCED_ITEMS);
  const c = structuredClone(EQUIPMENT_CONTENT);
  c.version = 4;
  // Base stats remain in ItemStats; generic advanced modifiers are rolled independently.
  c.uniques.push(
    ...ADVANCED_ITEMS.uniques.map((u) => ({
      id: u.id,
      name: u.name,
      base: u.base,
      level: u.level,
      stats: { damage: 0 },
    })),
  );
  c.tables.push({
    ...structuredClone(c.tables.find((t) => t.id === "reliquary")!),
    id: "sanctum",
  });
  return validateItemContent(c, 4);
}
export const ADVANCED_CONTENT = advancedContent();
/** Product callers migrate to this registry when version4 item execution is wired. */
export function registeredItemContent(version: number): ItemContent {
  return version === 4 ? ADVANCED_CONTENT : legacyContent(version);
}
