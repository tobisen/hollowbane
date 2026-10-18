import { activeSetBonuses } from "./advanced-item-content";
import type { CharacterInventory } from "./equipment";
import { validateModifiers, type ItemModifier } from "./item-modifiers";
/** Equipped, identified items only. Distinct set-piece identities determine thresholds. */
export function equipmentModifiers(character: CharacterInventory): {
  modifiers: ItemModifier[];
  active: ReturnType<typeof activeSetBonuses>["active"];
} {
  const equipped = Object.values(character.equipment).filter(
    (i) => i.identified,
  );
  const sets = activeSetBonuses(
    equipped.flatMap((i) =>
      i.advanced?.set
        ? [{ set: i.advanced.set.id, piece: i.advanced.set.piece }]
        : [],
    ),
  );
  const modifiers = equipped
    .flatMap((i) => i.advanced?.modifiers ?? [])
    .concat(sets.modifiers);
  validateModifiers(modifiers);
  return { active: sets.active, modifiers: structuredClone(modifiers) };
}
