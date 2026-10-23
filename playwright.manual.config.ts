import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/manual",
  testMatch: "q1-playtest.spec.ts",
  workers: 1,
  outputDir: ".local/q1-manual/runner-results",
  reporter: "list",
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/hollowbane/",
    reuseExistingServer: true,
  },
});
