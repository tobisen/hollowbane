import { describe, expect, it } from "vitest";
import { balancedShards, selectedShard } from "../scripts/ci-shards";

describe("release shard coverage", () => {
  it("balances long files, preserves every file once, and includes unprofiled additions", () => {
    const files = ["long", "medium", "short", "new"];
    const durations = { long: 120, medium: 80, short: 40 };
    const shards = balancedShards(files, durations);
    expect(shards).toEqual([
      ["long", "short"],
      ["medium", "new"],
    ]);
    expect(shards.flat().sort()).toEqual([...files].sort());
    expect(balancedShards([...files].reverse(), durations)).toEqual(shards);
  });
  it("rejects an invalid shard instead of silently skipping tests", () => {
    expect(() => selectedShard("tests/e2e", "3")).toThrow(
      "PLAYWRIGHT_CI_SHARD must be 1 or 2",
    );
  });
});
