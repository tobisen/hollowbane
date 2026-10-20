import {
  createSkillProgression,
  rewardSkillLevels,
  type SkillProgression,
} from "./skill-progression";
import {
  createAttributes,
  rewardAttributeLevels,
  type CharacterAttributes,
} from "./attributes";
import type { CombatEvent, CombatWorld } from "./combat";
import type { MonsterRole } from "./monsters";
import {
  addExperience,
  experienceAt,
  DEFAULT_XP_CURVE,
  type CharacterExperience,
  type XpCurve,
} from "./experience";

/** Provisional base rewards by authored monster role; champions use the same base. */
export const MONSTER_XP: Readonly<Record<MonsterRole, number>> = Object.freeze({
  melee: 25,
  ranged: 25,
  caster: 35,
  support: 30,
  flanker: 25,
  tank: 40,
});
export interface MonsterExperience {
  character: CharacterExperience;
  attributes: CharacterAttributes;
  skills: SkillProgression;
  readonly player: number;
  readonly rewards: Readonly<Record<MonsterRole, number>>;
  readonly curve: XpCurve;
  /** Encounter-lifetime identities; never inferred from the bounded combat log. */
  readonly deaths: Set<number>;
}
export function createMonsterExperience(
  totalXp = 0,
  rewards = MONSTER_XP,
  curve = DEFAULT_XP_CURVE,
  player = 0,
): MonsterExperience {
  for (const role of Object.keys(MONSTER_XP) as MonsterRole[])
    if (!Number.isSafeInteger(rewards[role]) || rewards[role] < 0)
      throw new RangeError("Monster XP must be a nonnegative safe integer");
  return {
    character: experienceAt(totalXp, curve),
    attributes: createAttributes(undefined, experienceAt(totalXp, curve).level),
    skills: createSkillProgression(null, experienceAt(totalXp, curve).level),
    player,
    rewards: Object.freeze({ ...rewards }),
    curve: Object.freeze([...curve]),
    deaths: new Set(),
  };
}

/** Only a registered monster killed by this player earns XP. Environmental,
 * unknown-source, monster-on-monster and training deaths are ineligible.
 * Consume ineligible deaths too, so later replays cannot change kill credit.
 */
export function consumeMonsterDeathXp(
  world: CombatWorld,
  event: CombatEvent,
): void {
  if (event.kind !== "death") return;
  const xp = world.experience;
  const target = world.actors.find((actor) => actor.id === event.target);
  if (!target || target.hp !== 0 || xp.deaths.has(target.id)) return;
  xp.deaths.add(target.id);
  const source = world.actors.find((actor) => actor.id === event.actor);
  if (
    !source ||
    source.id !== xp.player ||
    source.kind !== "player" ||
    target.kind !== "hostile" ||
    !target.monsterRole
  )
    return;
  grantCharacterXp(xp, target.xpReward ?? xp.rewards[target.monsterRole]);
}

/** Shared immutable preparation before committing XP and both point budgets. */
export function grantCharacterXp(xp: MonsterExperience, amount: number): void {
  const character = addExperience(xp.character.totalXp, amount, xp.curve);
  const attributes = rewardAttributeLevels(xp.attributes, character.level);
  const skills = rewardSkillLevels(xp.skills, character.level);
  xp.skills = skills;
  xp.character = character;
  xp.attributes = attributes;
}
