import { STARTING_ATTRIBUTES, type AttributeValues } from "./attributes";
import type { ActiveSkill } from "./skill-content";
import type { SkillProgression } from "./skill-progression";
import {
  aggregateModifier,
  type StatModifier,
  type ModifierContext,
} from "./item-modifiers";
export const CLASS_COMBAT_RULES = Object.freeze({
  warrior: Object.freeze({
    attribute: "strength",
    damagePerPoint: 0.025,
    strikeMultiplier: 4 / 3,
  }),
  sorcerer: Object.freeze({
    attribute: "energy",
    damagePerPoint: 0.025,
    strikeMultiplier: 1,
  }),
  ranger: Object.freeze({
    attribute: "dexterity",
    damagePerPoint: 0.025,
    strikeMultiplier: 1,
  }),
} as const);
export const CLASS_CONTEXT: ModifierContext = {
  healthFraction: 1,
  targetStatuses: [],
  element: "physical",
  weapon: "melee",
};
export function classModifier(
  id: string,
  stat: StatModifier["stat"],
  value: number,
  operation: StatModifier["operation"] = "increase",
): StatModifier {
  return {
    id: `class:${id}`,
    source: "class",
    kind: "stat",
    stat,
    value,
    operation,
    condition: { kind: "always" },
    group: `class:${id}`,
    stacking: "strongest",
    priority: 0,
  };
}
/** Applied to a fresh ranked definition, never to a previously derived actor total. */
export function classAbility(
  skill: ActiveSkill,
  state: SkillProgression,
  attributes: AttributeValues = STARTING_ATTRIBUTES,
): ActiveSkill {
  if (!state.classId) return skill;
  const rules = CLASS_COMBAT_RULES[state.classId];
  let result: ActiveSkill = { ...skill };
  if (state.classId === "warrior" && skill.id === "iron-fan")
    result = {
      ...result,
      name: "Sundering Fan",
      shape: "melee",
      maxTargets: 1,
      damage: skill.damage * rules.strikeMultiplier,
      stagger: true,
    };
  if (state.classId === "ranger" && skill.id === "briar-edge")
    result = {
      ...result,
      name: "Briar Needle",
      shape: "projectile",
      range: 8,
      radius: 0.2,
      precise: true,
    };
  if (state.classId === "ranger" && skill.id === "storm-thread")
    result = {
      ...result,
      name: "Thorn Flight",
      shape: "projectile",
      element: "physical",
      range: 8,
      radius: 0.2,
      maxTargets: 3,
      piercing: 3,
    };
  result.damage = aggregateModifier(
    "damage",
    result.damage,
    [
      classModifier(
        "attribute",
        "damage",
        attributes[rules.attribute] * rules.damagePerPoint,
      ),
    ],
    CLASS_CONTEXT,
    { min: 0, max: 10000 },
  );
  return result;
}

export const CLASS_SUPPORT_RULES = Object.freeze({
  armorPerRank: 4,
  guardArmor: 40,
  guardArmorPerRank: 10,
  manaRegenPerRank: 0.5,
  accuracyPerRank: 8,
  synergyPerRank: 0.05,
});
const rank = (s: SkillProgression, id: string) => s.ranks[id] ?? 0;
export function classArmor(
  state: SkillProgression,
  base: number,
  statuses: readonly string[],
): number {
  if (state.classId !== "warrior") return base;
  const arms = rank(state, "warrior-arms-foundation"),
    guard = rank(state, "warrior-resolve-foundation");
  return aggregateModifier(
    "armor",
    base,
    [
      classModifier(
        "resilience",
        "armor",
        arms * CLASS_SUPPORT_RULES.armorPerRank,
        "add",
      ),
      ...(guard > 0 && statuses.includes("power")
        ? [
            classModifier(
              "guard",
              "armor",
              CLASS_SUPPORT_RULES.guardArmor +
                guard * CLASS_SUPPORT_RULES.guardArmorPerRank,
              "add",
            ),
          ]
        : []),
    ],
    CLASS_CONTEXT,
    { min: 0, max: 10000 },
  );
}
export function classAccuracy(state: SkillProgression, base: number): number {
  if (state.classId !== "ranger") return base;
  const amount =
    state.classId === "ranger"
      ? rank(state, "ranger-wilds-foundation") *
        CLASS_SUPPORT_RULES.accuracyPerRank
      : 0;
  return aggregateModifier(
    "accuracy",
    base,
    [classModifier("precision", "accuracy", amount, "add")],
    CLASS_CONTEXT,
    { min: 0, max: 10000 },
  );
}
export function classManaRegen(state: SkillProgression): number {
  const amount =
    state.classId === "sorcerer"
      ? rank(state, "sorcerer-ember-foundation") *
        CLASS_SUPPORT_RULES.manaRegenPerRank
      : 0;
  return aggregateModifier(
    "mana",
    0,
    [classModifier("conduit", "mana", amount, "add")],
    CLASS_CONTEXT,
    { min: 0, max: 100 },
  );
}
/** Direct skill hit only; DoT and item procs never re-enter this synergy path. */
export function classSynergy(
  state: SkillProgression,
  skill: string | undefined,
  base: number,
  sourceStatuses: readonly string[],
  context: ModifierContext,
): number {
  let modifier: StatModifier | undefined;
  if (
    state.classId === "warrior" &&
    skill === "iron-fan" &&
    sourceStatuses.includes("power")
  )
    modifier = classModifier(
      "resolve-synergy",
      "damage",
      rank(state, "warrior-resolve-foundation") *
        CLASS_SUPPORT_RULES.synergyPerRank,
    );
  if (state.classId === "sorcerer" && skill === "ember-lance")
    modifier = {
      ...classModifier(
        "rime-synergy",
        "damage",
        rank(state, "sorcerer-rime-foundation") *
          CLASS_SUPPORT_RULES.synergyPerRank,
      ),
      condition: { kind: "target-status", status: "slow" },
    };
  if (state.classId === "ranger" && skill === "storm-thread")
    modifier = {
      ...classModifier(
        "briar-synergy",
        "damage",
        rank(state, "ranger-wilds-foundation") *
          CLASS_SUPPORT_RULES.synergyPerRank,
      ),
      condition: { kind: "target-status", status: "poison" },
    };
  if (!modifier) return base;
  const value = aggregateModifier(
    "damage",
    base,
    modifier ? [modifier] : [],
    context,
    { min: 0, max: 10000 },
  );
  // Normalize modifier precision before the existing integer damage floor.
  return Math.round(value * 1000000) / 1000000;
}
export function classMechanicsDescription(state: SkillProgression): string {
  if (!state.classId)
    return "Legacy six-skill access. No class passive or synergy.";
  const r = CLASS_SUPPORT_RULES;
  if (state.classId === "warrior")
    return `Strength: +${CLASS_COMBAT_RULES.warrior.damagePerPoint * 100}% skill damage per point. Resilience: +${rank(state, "warrior-arms-foundation") * r.armorPerRank} armor. Oath Echo: +${r.guardArmor + rank(state, "warrior-resolve-foundation") * r.guardArmorPerRank} armor while its power buff lasts. Synergy: Sundering Fan gains ${rank(state, "warrior-resolve-foundation") * r.synergyPerRank * 100}% damage while empowered.`;
  if (state.classId === "sorcerer")
    return `Energy: +${CLASS_COMBAT_RULES.sorcerer.damagePerPoint * 100}% skill damage per point; existing Energy → mana remains. Conduit: +${classManaRegen(state)} mana/second. Synergy: Ember Lance gains ${rank(state, "sorcerer-rime-foundation") * r.synergyPerRank * 100}% damage against slowed targets.`;
  return `Dexterity: +${CLASS_COMBAT_RULES.ranger.damagePerPoint * 100}% skill damage per point. Precision: +${classAccuracy(state, 0)} accuracy. Synergy: Thorn Flight gains ${rank(state, "ranger-wilds-foundation") * r.synergyPerRank * 100}% damage against poisoned targets. Briar Needle cannot miss; critical hits are disabled for precise attacks.`;
}
