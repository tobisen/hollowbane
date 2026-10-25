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
  const paths = files.filter((file) =>
    /^assets\/character-storage-[\w-]+\.js$/.test(file),
  );
  await page.evaluate(async (paths) => {
    // Rollup may also emit a shared implementation chunk with this prefix.
    // Select the explicit public entry by exports, never filesystem/hash order.
    for (const path of paths) {
      const api = await import(new URL(path, location.href).href);
      if (
        typeof api.CharacterStorage === "function" &&
        typeof api.serializeCharacter === "function"
      ) {
        window.characterStorageModule = api;
        return;
      }
    }
    throw Error("Missing published character storage API");
  }, paths);
}
