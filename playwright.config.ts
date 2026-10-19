import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/hollowbane/",
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run build && npm run preview -- --host 127.0.0.1",
          url: "http://127.0.0.1:4173/hollowbane/",
          reuseExistingServer: !process.env.CI,
        },
      }),
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
});
