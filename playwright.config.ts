import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4173/hollowbane/",
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173/hollowbane/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
