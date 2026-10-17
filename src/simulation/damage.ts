import type { Element } from "./skill-content";
/** Deterministic physical damage: RNG is injected, never global. */
export interface Offense {
  damage: number;
  accuracy: number;
  criticalChance: number;
  criticalMultiplier: number;
}
export interface Defense {
  defense: number;
  armor: number;
  physicalResistance: number;
  resistances?: Partial<Record<Element, number>>;
}
export interface DamageFormula {
  minimumAccuracy: number;
  maximumAccuracy: number;
  armorScale: number;
  minimumResistance: number;
  maximumResistance: number;
}
export const DAMAGE_FORMULA: Readonly<DamageFormula> = Object.freeze({
  minimumAccuracy: 0.1,
  maximumAccuracy: 0.95,
  armorScale: 100,
  minimumResistance: -1,
  maximumResistance: 0.75,
});
export type DamageResult = {
  type: Element;
  outcome: "hit" | "miss";
  critical: boolean;
  amount: number;
  chance: number;
};
const clamp = (v: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, v));
export function resolveDamage(
  offense: Offense,
  defense: Defense,
  random: () => number,
  formula: DamageFormula = DAMAGE_FORMULA,
  element: Element = "physical",
  guaranteed = false,
): DamageResult {
  if (
    ![
      ...Object.values(offense),
      defense.defense,
      defense.armor,
      defense.physicalResistance,
      ...Object.values(defense.resistances ?? {}),
      ...Object.values(formula),
    ].every(Number.isFinite) ||
    offense.damage < 0 ||
    offense.accuracy < 0 ||
    defense.defense < 0 ||
    defense.armor < 0 ||
    offense.criticalChance < 0 ||
    offense.criticalChance > 1 ||
    offense.criticalMultiplier < 1 ||
    formula.armorScale <= 0 ||
    formula.minimumAccuracy < 0 ||
    formula.maximumAccuracy > 1 ||
    formula.minimumAccuracy > formula.maximumAccuracy ||
    formula.minimumResistance > formula.maximumResistance ||
    formula.maximumResistance > 1
  )
    throw new Error("Invalid damage configuration");
  // Exactly two draws per valid resolution, including misses, stabilize replay streams.
  const hitRoll = random(),
    criticalRoll = random();
  if (
    ![hitRoll, criticalRoll].every((v) => Number.isFinite(v) && v >= 0 && v < 1)
  )
    throw new Error("Invalid RNG draw");
  const chance = clamp(
    offense.accuracy / Math.max(1, offense.accuracy + defense.defense),
    formula.minimumAccuracy,
    formula.maximumAccuracy,
  );
  const critical = criticalRoll < offense.criticalChance;
  const hit = guaranteed || hitRoll < chance;
  const raw = offense.damage * (critical ? offense.criticalMultiplier : 1);
  const mitigated =
    ((raw * formula.armorScale) /
      (formula.armorScale + (element === "physical" ? defense.armor : 0))) *
    (1 -
      clamp(
        element === "physical"
          ? defense.physicalResistance
          : (defense.resistances?.[element] ?? 0),
        formula.minimumResistance,
        formula.maximumResistance,
      ));
  return {
    type: element,
    outcome: hit ? "hit" : "miss",
    critical: hit && critical,
    amount: hit ? Math.max(0, Math.floor(mitigated)) : 0,
    chance,
  };
}
