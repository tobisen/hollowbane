import { SOCKET_CONTENT, validateSocketCatalog } from "./socket-content";
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
function socketContent(): ItemContent {
  const c = structuredClone(ADVANCED_CONTENT);
  c.version = 5;
  validateSocketCatalog(SOCKET_CONTENT);
  for (const base of Object.keys(SOCKET_CONTENT.hosts))
    if (!c.bases.some((b) => b.id === base))
      throw Error("Unknown socket host base");
  c.bases.push(
    ...SOCKET_CONTENT.gems.map((g) => ({
      id: g.id,
      name: g.name,
      category: "gem" as const,
      level: g.level,
      requirement: g.level,
      weight: g.weight,
      stats: { mana: 0 },
    })),
  );
  const gems = SOCKET_CONTENT.gems.map((g) => ({ id: g.id, weight: 1 }));
  c.tables.find((t) => t.id === "sanctum")!.bases.push(...gems);
  c.tables.push({
    id: "gem-cache",
    chance: 10000,
    levelModifier: 0,
    quality: { normal: 1, magic: 0, rare: 0, unique: 0 },
    bases: gems,
  });
  return validateItemContent(c, 5);
}
export const SOCKET_ITEM_CONTENT = socketContent();
/** Product callers migrate to this registry when version4 item execution is wired. */
export function registeredItemContent(version: number): ItemContent {
  return version === 5
    ? SOCKET_ITEM_CONTENT
    : version === 4
      ? ADVANCED_CONTENT
      : legacyContent(version);
}
