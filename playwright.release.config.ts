import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Reuse the current deliverable's real fight and controller assertions verbatim.
export default defineConfig({
  ...base,
  testDir: "tests",
  testMatch: ["**/release/artifact.spec.ts", "**/e2e/overnight-d08.spec.ts"],
});
