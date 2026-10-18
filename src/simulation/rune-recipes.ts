import {
  RUNE_CONTENT,
  type RuneCatalog,
  type RuneRecipe,
} from "./rune-content";
import type { GeneratedItem } from "./loot";
import type { SocketKind } from "./socket-content";
import { validateModifier, type ItemModifier } from "./item-modifiers";
/** Exact full ordered contents; no prefix matches, gaps or rarity bypass. Recomputed without RNG. */
export function activeRuneRecipe(
  item: GeneratedItem,
  catalog: RuneCatalog = RUNE_CONTENT,
): RuneRecipe | null {
  if (
    !item.identified ||
    !item.socketCapacity ||
    item.embedded?.length !== item.socketCapacity
  )
    return null;
  const match = catalog.recipes.find(
    (r) =>
      r.bases.includes(item.base) &&
      r.qualities.some((q) => q === item.quality) &&
      item.level >= r.level &&
      r.sequence.length === item.socketCapacity &&
      r.sequence.every((id, i) => item.embedded![i]!.base === id),
  );
  return match ? structuredClone(match) : null;
}
export function runeModifiers(
  id: string,
  kind: SocketKind,
  source: string,
  catalog = RUNE_CONTENT,
): ItemModifier[] {
  const rune = catalog.components.find((r) => r.id === id);
  if (!rune) throw Error("Unknown sigil");
  return rune.effects[kind].map((m) =>
    validateModifier({ ...structuredClone(m), source }),
  );
}
export function recipeModifiers(item: GeneratedItem): ItemModifier[] {
  return (
    activeRuneRecipe(item)?.modifiers.map((m) =>
      validateModifier({ ...m, source: `pattern:${item.id}` }),
    ) ?? []
  );
}
