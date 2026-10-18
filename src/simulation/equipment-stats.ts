import { createItemHitRules, type ItemHitRules } from "./item-hit-rules";
import { registeredItemContent as itemContentForVersion } from "./item-registry";
import { equipmentModifiers } from "./equipment-modifiers";
import {
  aggregateModifier,
  type ModifierContext,
  type ModifierStat,
  type ItemModifier,
} from "./item-modifiers";
import { DAMAGE_FORMULA } from "./damage";
import { type CharacterInventory } from "./equipment";
import type { CombatActor } from "./combat";
import type { Offense, Defense } from "./damage";
import type { ItemStats } from "./item-content";
export interface EquipmentBase {
  offense: Offense;
  defense: Defense;
  health: number;
  mana: number;
  attackSpeed: number;
  castSpeed: number;
  recoveryBonus: number;
  weapon: CombatActor["weapon"];
  range: number;
}
export interface DerivedEquipment {
  offense: Offense;
  defense: Defense;
  maxHp: number;
  maxMana: number;
  attackSpeed: number;
  castSpeed: number;
  recoveryBonus: number;
  weapon: CombatActor["weapon"];
  range: number;
  bonuses: ItemStats;
  advanced?: {
    modifiers: ItemModifier[];
    hitRules: ItemHitRules;
    active: ReturnType<typeof equipmentModifiers>["active"];
    patterns: ReturnType<typeof equipmentModifiers>["patterns"];
    castSpeed: number;
    hitRecovery: number;
    lifeLeech: number;
    manaLeech: number;
    dotBonus: number;
    skills: Record<string, number>;
  };
}
export function captureEquipmentBase(
  actor: CombatActor,
  maxMana = 100,
  castSpeed = 0,
): EquipmentBase {
  return {
    offense: { ...actor.offense },
    defense: {
      ...actor.defense,
      resistances: { ...actor.defense.resistances },
    },
    health: actor.maxHp,
    mana: maxMana,
    attackSpeed: actor.attackSpeed,
    castSpeed,
    recoveryBonus: actor.recoveryBonus,
    weapon: actor.weapon,
    range: actor.range,
  };
}
/** One source of truth for gameplay and comparisons: base → additive gear → engine caps. */
export function deriveEquipment(
  c: CharacterInventory,
  base: EquipmentBase,
  manualSpeed = 0,
  context?: ModifierContext,
): DerivedEquipment {
  const bonuses: ItemStats = {};
  for (const item of Object.values(c.equipment))
    for (const [key, value] of Object.entries(item.stats)) {
      const k = key as keyof ItemStats;
      bonuses[k] = (bonuses[k] ?? 0) + value;
    }
  const main = c.equipment.main,
    bow = main
      ? itemContentForVersion(main.contentVersion).bases.find(
          (b) => b.id === main.base,
        )?.category === "bow"
      : false;
  const cap = (v: number) =>
    Math.max(
      DAMAGE_FORMULA.minimumResistance,
      Math.min(DAMAGE_FORMULA.maximumResistance, v),
    );
  const derived: DerivedEquipment = {
    offense: {
      ...base.offense,
      damage: base.offense.damage + (bonuses.damage ?? 0),
      accuracy: base.offense.accuracy + (bonuses.accuracy ?? 0),
    },
    defense: {
      ...base.defense,
      defense: base.defense.defense + (bonuses.armor ?? 0),
      armor: base.defense.armor + (bonuses.armor ?? 0),
      resistances: {
        ...base.defense.resistances,
        fire: cap(
          (base.defense.resistances?.fire ?? 0) +
            (bonuses.fireResistance ?? 0) / 100,
        ),
        cold: cap(
          (base.defense.resistances?.cold ?? 0) +
            (bonuses.coldResistance ?? 0) / 100,
        ),
      },
    },
    maxHp: base.health + (bonuses.life ?? 0),
    maxMana: base.mana + (bonuses.mana ?? 0),
    attackSpeed: base.attackSpeed + manualSpeed + (bonuses.speed ?? 0),
    castSpeed: base.castSpeed,
    recoveryBonus: base.recoveryBonus,
    weapon: main ? (bow ? "projectile" : "melee") : base.weapon,
    range: main ? (bow ? 6 : 1.05) : base.range,
    bonuses,
  };
  if (
    Object.values(c.equipment).some((i) => i.advanced || i.embedded?.length)
  ) {
    const collected = equipmentModifiers(c);
    const hitRules = createItemHitRules(
      derived.offense,
      derived.defense,
      collected.modifiers,
    );
    const ctx: ModifierContext = context ?? {
      healthFraction: 1,
      targetStatuses: [],
      element: "physical",
      weapon: derived.weapon,
    };
    const stat = (key: ModifierStat, value: number, min = 0, max = 10000) =>
      aggregateModifier(key, value, collected.modifiers, ctx, { min, max });
    derived.offense.damage = stat("damage", derived.offense.damage);
    derived.offense.accuracy = stat("accuracy", derived.offense.accuracy);
    derived.defense.armor = stat("armor", derived.defense.armor);
    derived.defense.defense = stat("armor", derived.defense.defense);
    derived.maxHp = stat("life", derived.maxHp, 1);
    derived.maxMana = stat("mana", derived.maxMana);
    derived.attackSpeed = stat("attackSpeed", derived.attackSpeed, -90, 300);
    for (const element of [
      "physical",
      "fire",
      "cold",
      "lightning",
      "poison",
      "arcane",
    ] as const)
      derived.defense.resistances![element] = cap(
        stat(
          `${element}Resistance`,
          (element === "physical"
            ? base.defense.physicalResistance
            : (derived.defense.resistances?.[element] ?? 0)) * 100,
          -100,
          75,
        ) / 100,
      );
    derived.defense.physicalResistance = derived.defense.resistances!.physical!;
    const skills: Record<string, number> = {};
    for (const m of collected.modifiers)
      if (m.kind === "stat" && m.stat.startsWith("skill."))
        skills[m.stat.slice(6)] = stat(m.stat, 0, 0, 20);
    derived.advanced = {
      ...collected,
      hitRules,
      castSpeed: stat("castSpeed", 0, -90, 300),
      hitRecovery: stat("hitRecovery", 0, -90, 300),
      lifeLeech: stat("lifeLeech", 0, 0, 30),
      manaLeech: stat("manaLeech", 0, 0, 30),
      dotBonus: stat("dotBonus", 0, -90, 300),
      skills,
    };
  }
  derived.castSpeed = Math.max(
    -90,
    Math.min(300, base.castSpeed + (derived.advanced?.castSpeed ?? 0)),
  );
  derived.recoveryBonus = Math.max(
    -90,
    Math.min(300, base.recoveryBonus + (derived.advanced?.hitRecovery ?? 0)),
  );
  return derived;
}
/** Never heal/refill/resurrect, reset timing, RNG, intents or unrelated encounter state. */
export function applyEquipment(
  derived: DerivedEquipment,
  actor: CombatActor,
  mana?: { mana: number; maxMana: number; castSpeed?: number },
): void {
  if (derived.advanced?.modifiers.length)
    actor.itemRules = derived.advanced.hitRules;
  else delete actor.itemRules;
  actor.offense = { ...derived.offense };
  actor.defense = {
    ...derived.defense,
    resistances: { ...derived.defense.resistances },
  };
  actor.maxHp = derived.maxHp;
  actor.hp = Math.min(actor.hp, actor.maxHp);
  actor.attackSpeed = derived.attackSpeed;
  actor.recoveryBonus = derived.recoveryBonus;
  if (actor.controller.timeline.phase === "idle") {
    actor.weapon = derived.weapon;
    actor.range = derived.range;
  }
  if (mana) {
    if (mana.castSpeed !== undefined) mana.castSpeed = derived.castSpeed;
    mana.maxMana = derived.maxMana;
    mana.mana = Math.min(mana.mana, mana.maxMana);
  }
}
export function compareEquipment(
  c: CharacterInventory,
  base: EquipmentBase,
  alternative: CharacterInventory,
): Record<string, number> {
  const before = deriveEquipment(c, base),
    after = deriveEquipment(alternative, base);
  const result: Record<string, number> = {
    damage: after.offense.damage - before.offense.damage,
    defense: after.defense.defense - before.defense.defense,
    armor: after.defense.armor - before.defense.armor,
    accuracy: after.offense.accuracy - before.offense.accuracy,
    health: after.maxHp - before.maxHp,
    mana: after.maxMana - before.maxMana,
    speed: after.attackSpeed - before.attackSpeed,
    fireResistance:
      (after.defense.resistances?.fire ?? 0) -
      (before.defense.resistances?.fire ?? 0),
    coldResistance:
      (after.defense.resistances?.cold ?? 0) -
      (before.defense.resistances?.cold ?? 0),
  };
  if (before.advanced || after.advanced) {
    for (const key of [
      "castSpeed",
      "hitRecovery",
      "lifeLeech",
      "manaLeech",
      "dotBonus",
    ] as const)
      result[key] =
        (after.advanced?.[key] ?? 0) - (before.advanced?.[key] ?? 0);
    for (const element of [
      "physical",
      "lightning",
      "poison",
      "arcane",
    ] as const)
      result[`${element}Resistance`] =
        element === "physical"
          ? after.defense.physicalResistance - before.defense.physicalResistance
          : (after.defense.resistances?.[element] ?? 0) -
            (before.defense.resistances?.[element] ?? 0);
    for (const skill of new Set([
      ...Object.keys(before.advanced?.skills ?? {}),
      ...Object.keys(after.advanced?.skills ?? {}),
    ]))
      result[`skill.${skill}`] =
        (after.advanced?.skills[skill] ?? 0) -
        (before.advanced?.skills[skill] ?? 0);
  }
  return result;
}
