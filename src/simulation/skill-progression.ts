import treeData from "../content/skill-trees.json";
import skillData from "../content/skills.json";
import { validateSkills, type ActiveSkill } from "./skill-content";
import { CLASS_IDS, type ClassId } from "./character-classes";
import {
  validateSkillTrees,
  validateTreeRanks,
  type SkillTreeContent,
} from "./skill-trees";
export const CLASS_TREES = validateSkillTrees(
  treeData,
  validateSkills(skillData),
);
export interface SkillProgression {
  readonly version: 1;
  readonly treeVersion: 1;
  /** Null preserves the existing unclassed six-skill character; never assigns a class on migration. */
  readonly classId: ClassId | null;
  readonly available: number;
  readonly spent: number;
  readonly rewardedLevel: number;
  readonly ranks: Readonly<Record<string, number>>;
}
function level(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > 99)
    throw Error("Invalid skill reward level");
}
export function validateSkillProgression(
  value: unknown,
  characterLevel: number,
  trees: SkillTreeContent = CLASS_TREES,
): SkillProgression {
  level(characterLevel);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid skill progression");
  const s = value as SkillProgression;
  if (
    Object.keys(s).sort().join() !==
      [
        "version",
        "treeVersion",
        "classId",
        "available",
        "spent",
        "rewardedLevel",
        "ranks",
      ]
        .sort()
        .join() ||
    s.version !== 1 ||
    s.treeVersion !== trees.version ||
    s.rewardedLevel !== characterLevel ||
    (s.classId !== null && !CLASS_IDS.includes(s.classId)) ||
    !s.ranks ||
    typeof s.ranks !== "object" ||
    Array.isArray(s.ranks)
  )
    throw Error("Invalid skill progression fields");
  let spent = 0;
  for (const rank of Object.values(s.ranks)) {
    if (!Number.isSafeInteger(rank) || rank < 1 || rank > 20)
      throw Error("Invalid saved skill rank");
    spent += rank;
  }
  if (s.classId === null) {
    if (spent !== 0) throw Error("Unclassed skill ranks");
  } else validateTreeRanks(trees, s.classId, characterLevel, s.ranks);
  if (
    s.spent !== spent ||
    !Number.isSafeInteger(s.available) ||
    s.available < 0 ||
    s.available !== characterLevel - 1 - spent
  )
    throw Error("Inconsistent skill point budget");
  return Object.freeze({ ...s, ranks: Object.freeze({ ...s.ranks }) });
}
export function createSkillProgression(
  classId: ClassId | null = null,
  initialLevel = 1,
): SkillProgression {
  return validateSkillProgression(
    {
      version: 1,
      treeVersion: 1,
      classId,
      available: initialLevel - 1,
      spent: 0,
      rewardedLevel: initialLevel,
      ranks: {},
    },
    initialLevel,
  );
}
export function rewardSkillLevels(
  state: SkillProgression,
  gainedLevel: number,
): SkillProgression {
  validateSkillProgression(state, state.rewardedLevel);
  level(gainedLevel);
  if (gainedLevel <= state.rewardedLevel) return state;
  return validateSkillProgression(
    {
      ...state,
      available: state.available + gainedLevel - state.rewardedLevel,
      rewardedLevel: gainedLevel,
    },
    gainedLevel,
  );
}
/** Increment requests are atomic, including prerequisites satisfied in the same batch. No respec. */
export function allocateSkillRanks(
  state: SkillProgression,
  characterLevel: number,
  request: Readonly<Record<string, number>>,
  trees: SkillTreeContent = CLASS_TREES,
): SkillProgression {
  validateSkillProgression(state, characterLevel, trees);
  if (state.classId === null)
    throw Error("Class required for skill allocation");
  let cost = 0;
  const ranks = { ...state.ranks };
  for (const [node, amount] of Object.entries(request)) {
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 20)
      throw Error("Invalid skill allocation");
    cost += amount;
    ranks[node] = (Object.hasOwn(ranks, node) ? ranks[node]! : 0) + amount;
  }
  if (cost > state.available) throw Error("Insufficient skill points");
  return validateSkillProgression(
    {
      ...state,
      ranks,
      available: state.available - cost,
      spent: state.spent + cost,
    },
    characterLevel,
    trees,
  );
}
export function unlockedSkillRank(
  state: SkillProgression,
  skillId: string,
): number {
  if (state.classId === null) return 1; // Legacy availability only; runtime still checks registered abilities.
  const nodes = CLASS_TREES.trees
    .find((tree) => tree.classId === state.classId)!
    .branches.flatMap((branch) => branch.nodes);
  return Math.max(
    0,
    ...nodes
      .filter(
        (node) =>
          node.ability.kind === "existing" && node.ability.id === skillId,
      )
      .map((node) => state.ranks[node.id] ?? 0),
  );
}
export interface SkillRankScaling {
  readonly damagePerRank: number;
  readonly statusPerRank: number;
}
export const DEFAULT_SKILL_RANK_SCALING: SkillRankScaling = Object.freeze({
  damagePerRank: 0.1,
  statusPerRank: 0.1,
});
/** Timing, cost, geometry and status durations remain unchanged. Slow is not amplified. */
export function scaleRankedSkill(
  skill: ActiveSkill,
  rank: number,
  scaling: SkillRankScaling = DEFAULT_SKILL_RANK_SCALING,
): ActiveSkill {
  if (
    !Number.isSafeInteger(rank) ||
    rank < 1 ||
    rank > 20 ||
    Object.values(scaling).some(
      (value) => !Number.isFinite(value) || value < 0 || value > 1,
    )
  )
    throw Error("Invalid skill rank scaling");
  return {
    ...skill,
    damage: skill.damage * (1 + (rank - 1) * scaling.damagePerRank),
    status: skill.status
      ? {
          ...skill.status,
          magnitude:
            skill.status.magnitude *
            (1 +
              (rank - 1) *
                (skill.status.kind === "slow" ? 0 : scaling.statusPerRank)),
        }
      : null,
  };
}
