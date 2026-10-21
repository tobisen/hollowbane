import { describe, expect, it } from "vitest";
// @ts-expect-error Executable JS policy has no TypeScript build step.
import { classify, importGraph } from "../scripts/ci-policy.mjs";

describe("risk-based release policy", () => {
  const all = [
    "src/simulation/boss.ts",
    "src/simulation/boss.test.ts",
    "src/simulation/world-save.test.ts",
  ];
  const plan = (path: string, patch = "+const value = 1;", graph = new Map()) =>
    classify([{ path, patch }], graph, all);
  it("keeps prose on stable Fast while policy and unknown inputs require Full", () => {
    expect(plan("docs/ci/measurements.md").tier).toBe("fast");
    expect(plan("scripts/ci-policy.mjs").tier).toBe("full");
    expect(plan("src/simulation/core.ts").tier).toBe("full");
    expect(classify([], new Map(), all).tier).toBe("full");
  });
  it("requires save/migration and browser recovery for ownership changes", () => {
    const result = plan("src/simulation/inventory-grid.ts");
    expect(result.groups).toContain("persistence");
    expect(result.unit).toContain("src/simulation/world-save.test.ts");
    expect(result.browser).toContain("inventory-storage.spec.ts");
    expect(
      plan("src/simulation/inventory-grid.ts", "+export interface SaveV2 {}")
        .tier,
    ).toBe("full");
  });
  it("uses parsed transitive imports in addition to filenames", () => {
    const sources: Record<string, string> = {
      "src/boss.ts": "export const value = 1;",
      "src/bridge.ts": 'export { value } from "./boss";',
      "src/contract.test.ts": 'import { value } from "./bridge";',
    };
    const graph = importGraph(
      Object.keys(sources),
      (path: string) => sources[path],
    );
    expect(plan("src/boss.ts", "+const internal = 2;", graph).unit).toContain(
      "src/contract.test.ts",
    );
  });
  it("maps boss, quest and navigation to domain/browser contracts", () => {
    expect(plan("src/rendering/boss-view.ts").browser).toContain(
      "overnight-d08.spec.ts",
    );
    expect(plan("src/simulation/quests.ts").browser).toContain(
      "overnight-d06.spec.ts",
    );
    expect(plan("src/world/navigation.ts").browser).toContain("world.spec.ts");
  });
  it("fails closed for deletions, broad impact and manual Full", () => {
    expect(
      classify(
        [{ path: "removed.txt", patch: "", deleted: true }],
        new Map(),
        all,
      ).tier,
    ).toBe("full");
    const graph = new Map(
      Array.from({ length: 36 }, (_, i) => [
        `src/${i}.test.ts`,
        ["src/boss.ts"],
      ]),
    );
    expect(plan("src/boss.ts", "+const internal = 2;", graph).tier).toBe(
      "full",
    );
    expect(
      classify([{ path: "README.md", patch: "" }], new Map(), all, "full").tier,
    ).toBe("full");
  });
});
