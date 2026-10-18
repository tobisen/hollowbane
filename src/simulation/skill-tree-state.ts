import { classAbility } from "./class-abilities";
import { STARTING_ATTRIBUTES, type AttributeValues } from "./attributes";
import {
  allocateSkillRanks,
  scaleRankedSkill,
  type SkillProgression,
} from "./skill-progression";
import type { ClassId } from "./character-classes";
import type { SkillTreeNode } from "./skill-trees";
import { SKILLS } from "./skills";
/** UI consumes the allocator's verdict and effect formulas, never a second rule engine. */
export function skillNodeState(
  state: SkillProgression,
  classId: ClassId,
  level: number,
  node: SkillTreeNode,
  attributes: AttributeValues = STARTING_ATTRIBUTES,
) {
  const rank = state.classId === classId ? (state.ranks[node.id] ?? 0) : 0;
  let reason = "";
  try {
    if (state.classId !== classId)
      throw Error(
        state.classId === null
          ? "Choose this discipline before learning."
          : "Belongs to another discipline.",
      );
    allocateSkillRanks(state, level, { [node.id]: 1 });
  } catch (error) {
    reason = error instanceof Error ? error.message : "Unavailable";
  }
  const skill = SKILLS.find((s) => s.id === node.ability.id);
  const effects = (r: number) =>
    skill?.kind === "active"
      ? classAbility(
          scaleRankedSkill(skill, Math.max(1, r)),
          { ...state, classId },
          attributes,
        )
      : null;
  return {
    rank,
    name:
      effects(Math.max(1, rank))?.name ??
      skill?.name ??
      node.id.split("-").slice(1).join(" "),
    status:
      rank === node.maxRank
        ? "maxed"
        : rank > 0
          ? "learned"
          : reason
            ? "locked"
            : "available",
    canAllocate: !reason,
    reason,
    current: rank > 0 ? effects(rank) : null,
    next: rank < node.maxRank ? effects(rank + 1) : null,
    planned: node.ability.kind === "planned",
  };
}
