import { describe, expect, it } from "vitest";
import {
  classify,
  importGraph,
  acceptedBaseline,
  publicContract,
  addIntegrationReplay,
} from "../scripts/ci-policy.mjs";

describe("risk-based release policy", () => {
  const all = [
    "src/simulation/boss.ts",
    "src/simulation/boss.test.ts",
    "src/simulation/world-save.test.ts",
  ];
  const plan = (path: string, patch = "+const value = 1;", graph = new Map()) =>
    classify(
      [
        {
          path,
          patch,
          before: "export function value(): number { return 1; }",
          after: patch.includes("export interface")
            ? patch.slice(1)
            : "export function value(): number { return 2; }",
        },
      ],
      graph,
      all,
    );
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
    const release = plan("src/simulation/overnight-d14.test.ts");
    expect(release.tier).toBe("full");
    expect(release.browser).toEqual(
      [
        "world.spec.ts",
        "world-minimap.spec.ts",
        "world-containers.spec.ts",
        "class-gameplay.spec.ts",
        "inventory-storage.spec.ts",
        "gamepad.spec.ts",
        "overnight-d14.spec.ts",
      ].sort(),
    );
    expect(plan("src/rendering/inventory-view.ts").browser).toContain(
      "overnight-d13.spec.ts",
    );
    expect(plan("src/simulation/crypt-boss.ts").browser).toContain(
      "overnight-d12.spec.ts",
    );
    expect(plan("src/rendering/world-minimap.ts").browser).toContain(
      "world-minimap.spec.ts",
    );
    expect(plan("src/simulation/world-waypoints.ts").browser).toContain(
      "overnight-d11.spec.ts",
    );
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
    expect(
      classify(
        ["camp-merchant", "camp-stash", "quests", "world-waypoints"].map(
          (name) => ({
            path: `src/simulation/${name}.ts`,
            patch: "+return 2;",
            before: "export function f(): number { return 1; }",
            after: "export function f(): number { return 2; }",
          }),
        ),
        new Map(),
        all,
      ).tier,
    ).toBe("full");
  });
  it("compares public shapes while routing implementation changes through required Integration", () => {
    const before = "export function trade(id: string): number { return 1; }";
    const classifySource = (
      after: string,
      path = "src/simulation/camp-merchant.ts",
    ) =>
      classify([{ path, before, after, patch: "+return 2;" }], new Map(), all);
    expect(classifySource(before.replace("return 1", "return 2")).tier).toBe(
      "integration",
    );
    expect(
      classifySource(before.replace("id: string", "id: number")).tier,
    ).toBe("full");
    expect(
      classifySource(before + " export interface NewSave { version: 7 }").tier,
    ).toBe("full");
    expect(classifySource(before, "src/simulation/world-save.ts").tier).toBe(
      "full",
    );
    expect(
      classify(
        [{ path: "src/simulation/camp-merchant.ts", patch: "+return 2" }],
        new Map(),
        all,
      ).tier,
    ).toBe("full");
    expect(publicContract("export const boss: Boss = { health: 10 };")).toBe(
      publicContract("export const boss: Boss = { health: 20 };"),
    );
    expect(
      publicContract("type ID = string; export function f(id: ID): void {}"),
    ).not.toBe(
      publicContract("type ID = number; export function f(id: ID): void {}"),
    );
    expect(publicContract("export function f() { return 'old'; }")).not.toBe(
      publicContract("export function f() { return 'new'; }"),
    );
    expect(
      publicContract(
        "export class View { constructor() { const x = 1; } close(): void { return; } }",
      ),
    ).toBe(
      publicContract(
        "export class View { constructor() { const x = 2; } close(): void { return; } }",
      ),
    );
    expect(
      classify([{ path: "README.md", patch: "" }], new Map(), all, "fast").tier,
    ).toBe("full");
  });
  it("selects every consumer of changed test fixtures and preserves milestone/shared gates", () => {
    const graph = new Map([
      ["tests/fixtures/checkpoint.ts", []],
      ["tests/e2e/overnight-d13.spec.ts", ["tests/fixtures/checkpoint.ts"]],
      ["src/simulation/fixture.test.ts", ["tests/fixtures/checkpoint.ts"]],
    ]);
    const result = classify(
      [{ path: "tests/fixtures/checkpoint.ts", patch: "+setup" }],
      graph,
      all,
    );
    expect(result.tier).toBe("integration");
    expect(result.browser).toEqual(["overnight-d13.spec.ts"]);
    expect(result.unit).toContain("src/simulation/fixture.test.ts");
    expect(
      classify([{ path: "tests/fixtures/unmapped.ts", patch: "" }], graph, all)
        .tier,
    ).toBe("full");
    expect(classify([], graph, all).tier).toBe("full");
    expect(classify([], graph, all, "auto", true).tier).toBe("fast");
    expect(plan("src/rendering/controller-input.ts").tier).toBe("full");
    expect(plan("src/simulation/combat.ts").tier).toBe("full");
  });
  it("cannot lower actual risk or discard required suites through the additive gameplay replay", () => {
    const replay = plan("src/rendering/inventory-view.ts");
    expect(replay.tier).toBe("integration");
    const actual = plan("scripts/ci-policy.mjs");
    actual.browser.push("world.spec.ts");
    expect(addIntegrationReplay(actual, replay, "recorded diff").tier).toBe(
      "full",
    );
    expect(actual.browser).toContain("world.spec.ts");
    expect(actual.browser).toContain("inventory.spec.ts");
    expect(
      addIntegrationReplay(plan("README.md"), replay, "recorded diff").tier,
    ).toBe("integration");
    expect(() =>
      addIntegrationReplay(plan("README.md"), actual, "unsafe"),
    ).toThrow("no longer selects Integration");
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
