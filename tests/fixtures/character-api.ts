import { readdirSync } from "node:fs";
import type { Page } from "@playwright/test";

declare global {
  interface Window {
    characterStorageModule: typeof import("../../src/rendering/character-storage");
  }
}
/** Import the actual emitted/published API; no injected source or alternate save engine. */
export async function characterApi(page: Page): Promise<void> {
  const files: string[] = process.env.PLAYWRIGHT_BASE_URL
    ? Object.keys(
        (await (await page.request.get("./release.json")).json()).files,
      )
    : readdirSync("dist/assets").map((f) => `assets/${f}`);
  const path = files.find((file) =>
    /^assets\/character-storage-[\w-]+\.js$/.test(file),
  );
  if (!path) throw Error("Missing published character storage API");
  await page.evaluate(async (path) => {
    window.characterStorageModule = await import(
      new URL(path, location.href).href
    );
  }, path);
}
