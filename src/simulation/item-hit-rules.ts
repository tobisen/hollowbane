import {
  aggregateModifier,
  validateModifiers,
  type ItemModifier,
  type ModifierContext,
  type ModifierStat,
} from "./item-modifiers";
import type { Offense, Defense } from "./damage";
import type { CombatHitOrigin } from "./combat";
export const ITEM_SKILL_RULES = Object.freeze({
  damagePerRank: 0.1,
  maximumRank: 20,
  maximumDamage: 10000,
});
export interface ItemHitRules {
  offense: Offense;
  defense: Defense;
  modifiers: ItemModifier[];
  skillDamageModifiers: ItemModifier[];
}
export function createItemHitRules(
  offense: Offense,
  defense: Defense,
  modifiers: readonly ItemModifier[],
): ItemHitRules {
  validateModifiers(modifiers);
  return {
    offense: { ...offense },
    defense: { ...defense, resistances: { ...defense.resistances } },
    modifiers: structuredClone([...modifiers]),
    skillDamageModifiers: structuredClone(
      modifiers.filter(
        (m) =>
          m.kind === "stat" &&
          m.stat === "damage" &&
          ["element", "target-status"].includes(m.condition.kind),
      ),
    ),
  };
}
function stat(
  r: ItemHitRules,
  key: ModifierStat,
  base: number,
  c: ModifierContext,
  min = 0,
  max = 10000,
): number {
  return aggregateModifier(key, base, r.modifiers, c, { min, max });
}
/** Weapon totals are recomputed from pre-modifier baselines, never compounded with displayed totals. */
export function itemHitOffense(
  r: ItemHitRules,
  current: Offense,
  damage: number,
  origin: CombatHitOrigin,
  context: ModifierContext,
  skill?: string,
): Offense {
  if (origin === "proc") return { ...current, damage };
  let value = damage;
  if (origin === "weapon")
    value += stat(r, "damage", r.offense.damage, context) - current.damage;
  else {
    const rank = skill
      ? stat(r, `skill.${skill}`, 0, context, 0, ITEM_SKILL_RULES.maximumRank)
      : 0;
    value *= 1 + rank * ITEM_SKILL_RULES.damagePerRank;
    if (origin === "dot")
      value *= Math.max(0, 1 + stat(r, "dotBonus", 0, context, -90, 300) / 100);
    value = aggregateModifier(
      "damage",
      value,
      r.skillDamageModifiers,
      context,
      { min: 0, max: ITEM_SKILL_RULES.maximumDamage },
    );
  }
  return {
    ...current,
    damage: Math.max(0, Math.min(ITEM_SKILL_RULES.maximumDamage, value)),
    accuracy: stat(r, "accuracy", r.offense.accuracy, context),
  };
}
/** Defender conditions use current defender health and opponent status at the exact hit boundary. */
export function itemHitDefense(
  r: ItemHitRules,
  context: ModifierContext,
): Defense {
  const base = r.defense,
    element = context.element;
  const resistance =
    stat(
      r,
      `${element}Resistance`,
      (element === "physical"
        ? base.physicalResistance
        : (base.resistances?.[element] ?? 0)) * 100,
      context,
      -100,
      75,
    ) / 100;
  return {
    ...base,
    armor: stat(r, "armor", base.armor, context),
    defense: stat(r, "armor", base.defense, context),
    physicalResistance:
      element === "physical" ? resistance : base.physicalResistance,
    resistances: { ...base.resistances, [element]: resistance },
  };
}
