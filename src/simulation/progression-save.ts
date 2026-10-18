import {
  createSkillProgression,
  validateSkillProgression,
  type SkillProgression,
} from "./skill-progression";
import {
  ATTRIBUTE_NAMES,
  attributeValues,
  createAttributes,
  type CharacterAttributes,
} from "./attributes";
import {
  DEFAULT_XP_CURVE,
  experienceAt,
  type CharacterExperience,
} from "./experience";
export interface ProgressionSnapshot {
  readonly curve: "xp-v1";
  readonly character: CharacterExperience;
  readonly attributes: CharacterAttributes;
  readonly skills: SkillProgression;
}
function object(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid progression object");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).sort().join() !== [...fields].sort().join())
    throw Error("Unexpected progression fields");
  return result;
}
export function progressionAtLevel(level: number): ProgressionSnapshot {
  if (!Number.isInteger(level) || level < 1 || level > 99)
    throw Error("Invalid progression level");
  return {
    curve: "xp-v1",
    character: experienceAt(DEFAULT_XP_CURVE[level - 1]!),
    attributes: createAttributes(undefined, level),
    skills: createSkillProgression(null, level),
  };
}
/** Strictly validate redundant totals and reward high-water mark before accepting data. */
export function validateProgression(
  value: unknown,
  legacy = false,
): ProgressionSnapshot {
  const p = object(
    value,
    legacy
      ? ["curve", "character", "attributes"]
      : ["curve", "character", "attributes", "skills"],
  );
  if (p.curve !== "xp-v1")
    throw Error("Unsupported XP curve; original retained");
  const c = object(p.character, ["level", "totalXp", "nextLevelXp"]);
  if (typeof c.totalXp !== "number") throw Error("Invalid progression XP");
  const character = experienceAt(c.totalXp);
  if (
    c.level !== character.level ||
    c.totalXp !== character.totalXp ||
    c.nextLevelXp !== character.nextLevelXp
  )
    throw Error("XP and level mismatch");
  const a = object(p.attributes, [
    "starting",
    "allocated",
    "available",
    "spent",
    "rewardedLevel",
  ]);
  const starting = object(a.starting, ATTRIBUTE_NAMES),
    allocated = object(a.allocated, ATTRIBUTE_NAMES);
  for (const key of ATTRIBUTE_NAMES)
    if (typeof starting[key] !== "number" || typeof allocated[key] !== "number")
      throw Error("Invalid saved attributes");
  for (const key of ["available", "spent", "rewardedLevel"])
    if (typeof a[key] !== "number") throw Error("Invalid saved point budget");
  const attributes = {
    ...a,
    starting: { ...starting },
    allocated: { ...allocated },
  } as unknown as CharacterAttributes;
  attributeValues(attributes);
  if (attributes.rewardedLevel !== character.level)
    throw Error("Attribute rewards and XP mismatch");
  return Object.freeze({
    curve: "xp-v1",
    skills: legacy
      ? createSkillProgression(null, character.level)
      : validateSkillProgression(p.skills, character.level),
    character: Object.freeze(character),
    attributes: Object.freeze({
      ...attributes,
      starting: Object.freeze(attributes.starting),
      allocated: Object.freeze(attributes.allocated),
    }),
  });
}
