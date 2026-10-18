import { RUNE_CONTENT } from "./rune-content";
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
function runeContent(): ItemContent {
  const c = structuredClone(SOCKET_ITEM_CONTENT);
  c.version = 6;
  c.bases.push(
    ...RUNE_CONTENT.components.map((r) => ({
      id: r.id,
      name: r.name,
      category: "rune" as const,
      level: r.level,
      requirement: r.level,
      weight: r.weight,
      stats: { mana: 0 },
    })),
  );
  const bases = RUNE_CONTENT.components.map((r) => ({ id: r.id, weight: 1 }));
  c.tables.find((t) => t.id === "sanctum")!.bases.push(...bases);
  c.tables.push({
    id: "sigil-cache",
    chance: 10000,
    levelModifier: 0,
    quality: { normal: 1, magic: 0, rare: 0, unique: 0 },
    bases,
  });
  return validateItemContent(c, 6);
}
export const RUNE_ITEM_CONTENT = runeContent();
export const AFFIX_ITEM_CONTENT = validateItemContent(
  { ...structuredClone(RUNE_ITEM_CONTENT), version: 7 },
  7,
);
/** Product callers migrate to this registry when version4 item execution is wired. */
export function registeredItemContent(version: number): ItemContent {
  return version === 7
    ? AFFIX_ITEM_CONTENT
    : version === 6
      ? RUNE_ITEM_CONTENT
      : version === 5
        ? SOCKET_ITEM_CONTENT
        : version === 4
          ? ADVANCED_CONTENT
          : legacyContent(version);
}
