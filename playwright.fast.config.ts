import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const affected: string[] = JSON.parse(process.env.CI_AFFECTED_BROWSER ?? "[]");
const groups: string[] = JSON.parse(process.env.CI_SMOKE_GROUPS ?? "[]");
const hosted = process.env.CI_HOSTED === "1";
let flow = {
  file: "overnight-d08.spec.ts",
  title: "virtual controller locks Sevra",
};
if (hosted && groups.includes("merchant"))
  flow = { file: "overnight-d09.spec.ts", title: "merchant " };
else if (hosted && groups.includes("quest"))
  flow = { file: "overnight-d08b.spec.ts", title: "campaign finale" };
else if (hosted && groups.includes("persistence"))
  flow = { file: "inventory-storage.spec.ts", title: "corrupt-save.*recovery" };
else if (hosted && groups.includes("world"))
  flow = {
    file: "world.spec.ts",
    title: "generated forest supports mouse travel",
  };
else if (process.env.CI_SMOKE_BOSS === "1")
  flow = { file: "overnight-d08.spec.ts", title: "Sevra genuine keyboard" };

export default defineConfig({
  ...base,
  testDir: "tests",
  testMatch: [
    "**/release/artifact.spec.ts",
    `**/e2e/${flow.file}`,
    ...affected.map((file) => `**/e2e/${file}`),
  ],
  grep: new RegExp(
    [
      "application loads the exact release SHA",
      flow.title,
      ...(affected.length ? [".*"] : []),
    ].join("|"),
  ),
});
