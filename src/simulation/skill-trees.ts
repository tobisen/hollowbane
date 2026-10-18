import { CLASS_IDS, type ClassId } from "./character-classes";
import type { SkillDefinition } from "./skill-content";

export interface SkillTreeNode {
  readonly id: string;
  readonly ability: {
    readonly kind: "existing" | "planned";
    readonly id: string;
  };
  readonly level: number;
  readonly maxRank: number;
  readonly prerequisites: readonly {
    readonly node: string;
    readonly rank: number;
  }[];
}
export interface SkillBranch {
  readonly id: string;
  readonly name: string;
  readonly nodes: readonly SkillTreeNode[];
}
export interface ClassSkillTree {
  readonly classId: ClassId;
  readonly branches: readonly SkillBranch[];
}
export interface SkillTreeContent {
  readonly version: 1;
  readonly trees: readonly ClassSkillTree[];
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(v);
const integer = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 1 && v <= max;
/** Owns and deeply freezes JSON data, with stable IDs/version for future migrations.
 * Planned abilities are explicit unavailable extension points, never playable skills.
 */
export function validateSkillTrees(
  data: unknown,
  skills: readonly SkillDefinition[],
): SkillTreeContent {
  if (
    !object(data) ||
    data.version !== 1 ||
    !Array.isArray(data.trees) ||
    data.trees.length !== 3
  )
    throw new Error("Invalid tree content version/classes");
  const classes = new Set<string>();
  const globalIds = new Set<string>();
  const skillIds = new Set(skills.map((skill) => skill.id));
  for (const tree of data.trees as unknown[]) {
    if (
      !object(tree) ||
      !CLASS_IDS.includes(tree.classId as ClassId) ||
      classes.has(String(tree.classId)) ||
      !Array.isArray(tree.branches) ||
      tree.branches.length !== 3
    )
      throw new Error("Invalid class branches");
    classes.add(String(tree.classId));
    const nodes = new Map<string, SkillTreeNode>();
    for (const branch of tree.branches as unknown[]) {
      if (
        !object(branch) ||
        !id(branch.id) ||
        globalIds.has(branch.id) ||
        typeof branch.name !== "string" ||
        !branch.name.trim() ||
        !Array.isArray(branch.nodes) ||
        branch.nodes.length < 1 ||
        branch.nodes.length > 128
      )
        throw new Error("Invalid branch");
      globalIds.add(branch.id);
      for (const node of branch.nodes as unknown[]) {
        if (
          !object(node) ||
          !id(node.id) ||
          globalIds.has(node.id) ||
          !integer(node.level, 99) ||
          !integer(node.maxRank, 20) ||
          !Array.isArray(node.prerequisites) ||
          !object(node.ability) ||
          !id(node.ability.id) ||
          !["existing", "planned"].includes(String(node.ability.kind))
        )
          throw new Error("Invalid tree node");
        if (
          (node.ability.kind === "existing") !==
          skillIds.has(node.ability.id)
        )
          throw new Error("Invalid ability reference");
        globalIds.add(node.id);
        const refs = new Set<string>();
        for (const requirement of node.prerequisites as unknown[]) {
          if (
            !object(requirement) ||
            !id(requirement.node) ||
            refs.has(requirement.node) ||
            !integer(requirement.rank, 20)
          )
            throw new Error("Invalid prerequisite");
          refs.add(requirement.node);
        }
        nodes.set(node.id, node as unknown as SkillTreeNode);
      }
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (node: SkillTreeNode): void => {
      if (visiting.has(node.id)) throw new Error("Cyclic prerequisite");
      if (visited.has(node.id)) return;
      visiting.add(node.id);
      for (const prerequisite of node.prerequisites) {
        const target = nodes.get(prerequisite.node);
        if (
          !target ||
          prerequisite.rank > target.maxRank ||
          target.level > node.level ||
          (node.ability.kind === "existing" &&
            target.ability.kind === "planned")
        )
          throw new Error("Unavailable prerequisite");
        visit(target);
      }
      visiting.delete(node.id);
      visited.add(node.id);
    };
    for (const node of nodes.values()) visit(node);
  }
  const freeze = (value: unknown): void => {
    if (typeof value !== "object" || value === null) return;
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  };
  const copy = JSON.parse(JSON.stringify(data)) as SkillTreeContent;
  freeze(copy);
  return copy;
}
/** Read-only build validation, without points, effects, runtime gating or allocation. */
export function validateTreeRanks(
  content: SkillTreeContent,
  classId: ClassId,
  level: number,
  ranks: Readonly<Record<string, number>>,
): readonly string[] {
  if (!integer(level, 99)) throw new Error("Invalid character level");
  const tree = content.trees.find((entry) => entry.classId === classId);
  if (!tree) throw new Error("Unknown class");
  const nodes = tree.branches.flatMap((branch) => branch.nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rankAt = (key: string): number =>
    Object.hasOwn(ranks, key) ? ranks[key]! : 0;
  for (const [key, rank] of Object.entries(ranks)) {
    const node = byId.get(key);
    if (!node || !Number.isSafeInteger(rank) || rank < 0 || rank > node.maxRank)
      throw new Error("Invalid node rank");
    if (rank === 0) continue;
    if (
      node.ability.kind !== "existing" ||
      level < node.level ||
      node.prerequisites.some((req) => rankAt(req.node) < req.rank)
    )
      throw new Error("Unavailable skill");
  }
  return nodes
    .filter((node) => rankAt(node.id) > 0)
    .map((node) => node.id)
    .sort();
}
