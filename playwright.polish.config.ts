import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /(polish|skills)\.spec\.ts/,
  grepInvert: /visual reference/,
  projects: [
    { name: "firefox", use: { browserName: "firefox", launchOptions: {} } },
    { name: "webkit", use: { browserName: "webkit", launchOptions: {} } },
  ],
});
