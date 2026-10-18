export const ATTRIBUTE_NAMES = [
  "strength",
  "dexterity",
  "vitality",
  "energy",
] as const;
export type Attribute = (typeof ATTRIBUTE_NAMES)[number];
export type AttributeValues = Readonly<Record<Attribute, number>>;
export const STARTING_ATTRIBUTES: AttributeValues = Object.freeze({
  strength: 0,
  dexterity: 0,
  vitality: 0,
  energy: 0,
});
export const POINTS_PER_LEVEL = 5;
export interface CharacterAttributes {
  readonly starting: AttributeValues;
  readonly allocated: AttributeValues;
  readonly available: number;
  readonly spent: number;
  /** High-water mark makes repeated XP/level notifications idempotent. */
  readonly rewardedLevel: number;
}
function integer(value: number, max = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > max)
    throw new RangeError("Invalid attribute value");
}
function level(value: number): void {
  integer(value, 99);
  if (value < 1) throw new RangeError("Invalid reward level");
}
export function attributeValues(state: CharacterAttributes): AttributeValues {
  level(state.rewardedLevel);
  integer(state.available);
  integer(state.spent);
  let spent = 0;
  const values = { ...STARTING_ATTRIBUTES };
  for (const key of ATTRIBUTE_NAMES) {
    integer(state.starting[key], 1000000);
    integer(state.allocated[key], 490);
    spent += state.allocated[key];
    values[key] = state.starting[key] + state.allocated[key];
  }
  if (
    spent !== state.spent ||
    state.available !== (state.rewardedLevel - 1) * POINTS_PER_LEVEL - spent
  )
    throw new RangeError("Inconsistent attribute budget");
  return Object.freeze(values);
}
export function createAttributes(
  starting: AttributeValues = STARTING_ATTRIBUTES,
  initialLevel = 1,
): CharacterAttributes {
  level(initialLevel);
  const state = {
    starting: Object.freeze({ ...starting }),
    allocated: STARTING_ATTRIBUTES,
    available: (initialLevel - 1) * POINTS_PER_LEVEL,
    spent: 0,
    rewardedLevel: initialLevel,
  };
  attributeValues(state);
  return Object.freeze(state);
}
export function rewardAttributeLevels(
  state: CharacterAttributes,
  gainedLevel: number,
): CharacterAttributes {
  attributeValues(state);
  level(gainedLevel);
  if (gainedLevel <= state.rewardedLevel) return state;
  return Object.freeze({
    ...state,
    available:
      state.available + (gainedLevel - state.rewardedLevel) * POINTS_PER_LEVEL,
    rewardedLevel: gainedLevel,
  });
}
/** All-or-nothing allocation: invalid/overspent requests leave the input intact. */
export function allocateAttributes(
  state: CharacterAttributes,
  request: Partial<Record<Attribute, number>>,
): CharacterAttributes {
  attributeValues(state);
  const allocated = { ...state.allocated };
  let cost = 0;
  for (const [key, amount] of Object.entries(request)) {
    if (!ATTRIBUTE_NAMES.includes(key as Attribute))
      throw new RangeError("Unknown attribute");
    integer(amount, 490);
    cost += amount;
    allocated[key as Attribute] += amount;
  }
  if (cost > state.available)
    throw new RangeError("Insufficient attribute points");
  return Object.freeze({
    ...state,
    allocated: Object.freeze(allocated),
    available: state.available - cost,
    spent: state.spent + cost,
  });
}

/** Flat additions per point, before equipment modifiers; zero starting values
 * preserve the existing baseline. Skill-point rewards intentionally live elsewhere.
 */
export const ATTRIBUTE_COEFFICIENTS = Object.freeze({
  physicalDamage: 0.5,
  accuracy: 2,
  defense: 1,
  health: 5,
  mana: 3,
});
export type AttributeCoefficients = Readonly<
  Record<keyof typeof ATTRIBUTE_COEFFICIENTS, number>
>;
export function attributeBonuses(
  values: AttributeValues,
  coefficients: AttributeCoefficients = ATTRIBUTE_COEFFICIENTS,
) {
  for (const key of ATTRIBUTE_NAMES) integer(values[key], 1000490);
  for (const key of Object.keys(
    ATTRIBUTE_COEFFICIENTS,
  ) as (keyof AttributeCoefficients)[])
    if (
      !Number.isFinite(coefficients[key]) ||
      coefficients[key] < 0 ||
      coefficients[key] > 1000000
    )
      throw new RangeError("Invalid attribute coefficient");
  return {
    damage: Math.min(10000, values.strength * coefficients.physicalDamage),
    accuracy: Math.min(10000, values.dexterity * coefficients.accuracy),
    defense: Math.min(10000, values.dexterity * coefficients.defense),
    health: Math.min(10000, values.vitality * coefficients.health),
    mana: Math.min(10000, values.energy * coefficients.mana),
  };
}
