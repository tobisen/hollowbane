import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { selectedShard } from "./scripts/ci-shards";
export default defineConfig({
  testDir: "tests/e2e",
  ...(process.env.PLAYWRIGHT_CI_SHARD
    ? {
        testMatch: selectedShard(
          fileURLToPath(new URL("./tests/e2e", import.meta.url)),
          process.env.PLAYWRIGHT_CI_SHARD,
        ).map((file) => `**/${file}`),
      }
    : {}),
  timeout: 60_000,
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/hollowbane/",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command:
            process.env.PLAYWRIGHT_REUSE_BUILD === "1"
              ? "npm run preview -- --host 127.0.0.1"
              : "npm run build && npm run preview -- --host 127.0.0.1",
          url: "http://127.0.0.1:4173/hollowbane/",
          reuseExistingServer: !process.env.CI,
        },
      }),
  reporter: process.env.CI
    ? [
        ["list"],
        ["github"],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : "list",
});
