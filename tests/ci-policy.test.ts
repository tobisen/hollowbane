import { describe, expect, it } from "vitest";
import {
  classify,
  importGraph,
  acceptedBaseline,
} from "../scripts/ci-policy.mjs";

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
      (path: string) => sources[path]!,
    );
    expect(plan("src/boss.ts", "+const internal = 2;", graph).unit).toContain(
      "src/contract.test.ts",
    );
  });
  it("maps boss, quest and navigation to domain/browser contracts", () => {
    expect(plan("src/simulation/camp-stash.ts").browser).toContain(
      "overnight-d10.spec.ts",
    );
    expect(plan("src/simulation/camp-merchant.ts").browser).toContain(
      "overnight-d09.spec.ts",
    );
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
  it("requires successful main CI, Pages and hosted jobs in its accepted history", async () => {
    const sha = "a".repeat(40);
    const names = [
      "verify",
      "deploy",
      "Hosted exact SHA and selected critical flow",
    ];
    const fetcher = async (url: string) => {
      if (url.includes("/jobs?"))
        return {
          ok: true,
          json: async () => ({
            jobs: names.map((name) => ({ name, conclusion: "success" })),
          }),
        };
      expect(url).toContain("status=success");
      return {
        ok: true,
        json: async () => ({
          workflow_runs: [
            {
              id: 9,
              head_sha: sha,
              conclusion: "success",
              head_branch: "main",
            },
          ],
        }),
      };
    };
    expect(await acceptedBaseline("owner/repo", "test-token", fetcher)).toBe(
      sha,
    );
    for (const conclusion of ["failure", "cancelled", "in_progress"]) {
      await expect(
        acceptedBaseline("owner/repo", "test-token", async () => ({
          ok: true,
          json: async () => ({
            workflow_runs: [
              { id: 9, head_sha: sha, conclusion, head_branch: "main" },
            ],
          }),
        })),
      ).rejects.toThrow("No fully accepted");
    }
    for (const failedJob of names) {
      await expect(
        acceptedBaseline("owner/repo", "test-token", async (url: string) =>
          url.includes("/jobs?")
            ? {
                ok: true,
                json: async () => ({
                  jobs: names.map((name) => ({
                    name,
                    conclusion: name === failedJob ? "skipped" : "success",
                  })),
                }),
              }
            : fetcher(url),
        ),
      ).rejects.toThrow("history incomplete");
    }
    await expect(
      acceptedBaseline("owner/repo", "test-token", async () => ({ ok: false })),
    ).rejects.toThrow("unavailable");
  });
});
