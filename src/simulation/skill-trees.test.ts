import { describe, expect, it } from "vitest";
import raw from "../content/skill-trees.json";
import skillData from "../content/skills.json";
import { validateSkills } from "./skill-content";
import { validateSkillTrees, validateTreeRanks } from "./skill-trees";
const skills = validateSkills(skillData);
const content = () => structuredClone(raw);
describe("class skill-tree data", () => {
  it("defines nine branches, retains all six active skills, owns frozen versioned data", () => {
    const parsed = validateSkillTrees(raw, skills);
    expect(parsed.trees.flatMap((tree) => tree.branches)).toHaveLength(9);
    const refs = parsed.trees
      .flatMap((t) => t.branches.flatMap((b) => b.nodes))
      .filter((n) => n.ability.kind === "existing")
      .map((n) => n.ability.id)
      .sort();
    expect(refs).toEqual(
      skills
        .filter((s) => s.kind === "active")
        .map((s) => s.id)
        .sort(),
    );
    expect(parsed).toEqual(validateSkillTrees(raw, skills));
    expect(parsed).not.toBe(raw);
    expect(
      Object.isFrozen(parsed.trees[0]!.branches[0]!.nodes[0]!.ability),
    ).toBe(true);
  });
  it("rejects invalid structure, versions, identities, ranks and ability references", () => {
    const mutations: ((data: ReturnType<typeof content>) => void)[] = [
      (d) => {
        d.version = 2;
      },
      (d) => {
        d.trees[1]!.classId = "warrior";
      },
      (d) => {
        d.trees[0]!.branches.pop();
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[0]!.maxRank = 0;
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[0]!.level = 100;
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[0]!.ability.id = "missing";
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[1]!.ability.kind = "invalid";
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[1]!.id =
          d.trees[0]!.branches[0]!.nodes[0]!.id;
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[1]!.prerequisites[0]!.node = "missing";
      },
      (d) => {
        d.trees[0]!.branches[0]!.nodes[1]!.prerequisites[0]!.rank = 6;
      },
    ];
    for (const mutate of mutations) {
      const data = content();
      mutate(data);
      expect(() => validateSkillTrees(data, skills)).toThrow();
    }
    for (const data of [
      null,
      {},
      [],
      { version: 1, trees: [null, null, null] },
    ])
      expect(() => validateSkillTrees(data, skills)).toThrow();
  });
  it("rejects cycles, cross-class references and unavailable planned dependencies", () => {
    const data = content();
    const nodes = data.trees[0]!.branches[2]!.nodes;
    nodes[0]!.level = 12;
    nodes[0]!.prerequisites.push({ node: nodes[1]!.id, rank: 1 });
    expect(() => validateSkillTrees(data, skills)).toThrow(/Cyclic/);
    nodes[0]!.prerequisites = [
      { node: data.trees[1]!.branches[0]!.nodes[0]!.id, rank: 1 },
    ];
    expect(() => validateSkillTrees(data, skills)).toThrow(/prerequisite/);
    const other = content();
    other.trees[0]!.branches[0]!.nodes[0]!.prerequisites.push({
      node: other.trees[0]!.branches[2]!.nodes[0]!.id,
      rank: 1,
    });
    expect(() => validateSkillTrees(other, skills)).toThrow(/prerequisite/);
  });
  it("checks build ranks, level and prerequisites deterministically without allocation", () => {
    const data = content();
    // A test-only existing second tier exercises real prerequisites; no new ability.
    const branch = data.trees[0]!.branches[0]!;
    branch.nodes[1]!.ability = { kind: "existing", id: "still-well" };
    const parsed = validateSkillTrees(data, skills);
    const first = branch.nodes[0]!.id,
      second = branch.nodes[1]!.id;
    expect(
      validateTreeRanks(parsed, "warrior", 12, { [second]: 3, [first]: 5 }),
    ).toEqual([first, second].sort());
    for (const [level, ranks] of [
      [11, { [first]: 3, [second]: 1 }],
      [12, { [first]: 2, [second]: 1 }],
      [12, { [first]: 6 }],
      [12, { [first]: 1.5 }],
      [12, { missing: 0 }],
    ] as const)
      expect(() =>
        validateTreeRanks(parsed, "warrior", level, ranks),
      ).toThrow();
    expect(() =>
      validateTreeRanks(validateSkillTrees(raw, skills), "warrior", 99, {
        [second]: 1,
        [first]: 5,
      }),
    ).toThrow(/Unavailable/);
    expect(validateTreeRanks(parsed, "warrior", 1, {})).toEqual([]);
  });
});
