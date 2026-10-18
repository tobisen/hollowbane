/** DBL-103 / P1: cumulative integer XP; independent of runtime and save schema. */
export const MAX_CHARACTER_LEVEL = 99;
export type XpCurve = readonly number[];
export interface CharacterExperience {
  readonly level: number;
  readonly totalXp: number;
  /** Absolute accumulated XP required for the next level; null at level 99. */
  readonly nextLevelXp: number | null;
}

function xpInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError("XP must be a nonnegative safe integer");
}

function validateCurve(curve: XpCurve): void {
  if (curve.length !== MAX_CHARACTER_LEVEL || curve[0] !== 0)
    throw new RangeError(
      "XP curve must contain 99 cumulative thresholds starting at zero",
    );
  for (let i = 0; i < curve.length; i++) {
    xpInteger(curve[i]!);
    if (i > 0 && curve[i]! <= curve[i - 1]!)
      throw new RangeError("XP thresholds must strictly increase");
  }
}

/** Configure 98 positive per-level costs. Reject overflow rather than round XP. */
export function createXpCurve(costs: readonly number[]): XpCurve {
  if (costs.length !== MAX_CHARACTER_LEVEL - 1)
    throw new RangeError("Expected 98 level costs");
  const thresholds = [0];
  for (const cost of costs) {
    xpInteger(cost);
    const previous = thresholds[thresholds.length - 1]!;
    if (cost === 0 || cost > Number.MAX_SAFE_INTEGER - previous)
      throw new RangeError("Invalid or overflowing level cost");
    thresholds.push(previous + cost);
  }
  return Object.freeze(thresholds);
}

/** Provisional foundation curve: advancing from level L costs 100 × L² XP. */
export const DEFAULT_XP_CURVE = createXpCurve(
  Array.from({ length: MAX_CHARACTER_LEVEL - 1 }, (_, i) => 100 * (i + 1) ** 2),
);

/** Persist totalXp with a versioned curve later; derive level/threshold on load.
 * XP saturates at the level-99 threshold. No existing character/save is changed.
 */
export function experienceAt(
  totalXp: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): CharacterExperience {
  xpInteger(totalXp);
  validateCurve(curve);
  const capped = Math.min(totalXp, curve[MAX_CHARACTER_LEVEL - 1]!);
  let level = 1;
  while (level < MAX_CHARACTER_LEVEL && capped >= curve[level]!) level++;
  return {
    level,
    totalXp: capped,
    nextLevelXp: level === MAX_CHARACTER_LEVEL ? null : curve[level]!,
  };
}

/** Pure arithmetic only: no reward source, event, or runtime wiring. */
export function addExperience(
  totalXp: number,
  amount: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): CharacterExperience {
  xpInteger(amount);
  const current = experienceAt(totalXp, curve);
  const remaining = curve[MAX_CHARACTER_LEVEL - 1]! - current.totalXp;
  return experienceAt(current.totalXp + Math.min(amount, remaining), curve);
}
