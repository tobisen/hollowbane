import { itemContentForVersion } from "./item-content";
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
  weapon: CombatActor["weapon"];
  range: number;
}
export interface DerivedEquipment {
  offense: Offense;
  defense: Defense;
  maxHp: number;
  maxMana: number;
  attackSpeed: number;
  weapon: CombatActor["weapon"];
  range: number;
  bonuses: ItemStats;
}
export function captureEquipmentBase(
  actor: CombatActor,
  maxMana = 100,
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
    weapon: actor.weapon,
    range: actor.range,
  };
}
/** One source of truth for gameplay and comparisons: base → additive gear → engine caps. */
export function deriveEquipment(
  c: CharacterInventory,
  base: EquipmentBase,
  manualSpeed = 0,
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
  return {
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
    weapon: main ? (bow ? "projectile" : "melee") : base.weapon,
    range: main ? (bow ? 6 : 1.05) : base.range,
    bonuses,
  };
}
/** Never heal/refill/resurrect, reset timing, RNG, intents or unrelated encounter state. */
export function applyEquipment(
  derived: DerivedEquipment,
  actor: CombatActor,
  mana?: { mana: number; maxMana: number },
): void {
  actor.offense = { ...derived.offense };
  actor.defense = {
    ...derived.defense,
    resistances: { ...derived.defense.resistances },
  };
  actor.maxHp = derived.maxHp;
  actor.hp = Math.min(actor.hp, actor.maxHp);
  actor.attackSpeed = derived.attackSpeed;
  if (actor.controller.timeline.phase === "idle") {
    actor.weapon = derived.weapon;
    actor.range = derived.range;
  }
  if (mana) {
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
  return {
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
}
