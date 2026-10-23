import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
import { balancedShards } from "./scripts/ci-shards";

const affected: string[] = JSON.parse(process.env.CI_AFFECTED_BROWSER ?? "[]");
const integration = process.env.CI_INTEGRATION_ONLY === "1";
const shard = process.env.CI_INTEGRATION_SHARD;
const selected = shard
  ? balancedShards(affected, undefined, Math.min(2, affected.length))[
      Number(shard) - 1
    ]
  : affected;
if (
  integration &&
  (!selected?.length || (shard && !["1", "2"].includes(shard)))
)
  throw Error("Missing or invalid required integration shard");
const flow = {
  file: "overnight-d08.spec.ts",
  title: "virtual controller locks Sevra",
};

export default defineConfig({
  ...base,
  testDir: "tests",
  testMatch: integration
    ? selected!.map((file) => `**/e2e/${file}`)
    : ["**/release/artifact.spec.ts", `**/e2e/${flow.file}`],
  ...(integration
    ? {}
    : {
        grep: new RegExp(
          ["application loads the exact release SHA", flow.title].join("|"),
        ),
      }),
});
