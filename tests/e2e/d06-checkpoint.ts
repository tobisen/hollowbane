import { expect, type Page } from "@playwright/test";
import { deserializeCharacter } from "../../src/simulation/inventory-save";

/** Explicit constructed fixture, installed before the game loads; never a live gameplay hook. */
export async function loadD06Checkpoint(page: Page, text: string) {
  const expected = deserializeCharacter(text);
  // Establish the real origin/IndexedDB without booting an unused Phaser game.
  // Only this empty setup document is intercepted; the game and saves are real.
  const setup = "**/__ci_checkpoint__";
  await page.route(setup, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Checkpoint setup</title>",
    }),
  );
  try {
    await page.goto("./__ci_checkpoint__");
  } finally {
    await page.unroute(setup);
  }
  await page.evaluate(async (text) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(
        "hollowbane-world-test-42-0-ashen-refuge",
        1,
      );
      request.onupgradeneeded = () =>
        request.result.createObjectStore("snapshots");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("snapshots", "readwrite");
        tx.objectStore("snapshots").clear();
        tx.objectStore("snapshots").put({ revision: 1, text }, "current");
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }, text);
  await page.goto("?world=1&developer=1&worldSeed=42");
  // First discovery autosaves after a constructed area checkpoint loads, so
  // transient status prose is not a readiness contract. Verify restored state.
  await expect(page.locator(".skill-identity")).toContainText(
    `Committed: ${expected.progression!.skills.classId}`,
  );
  await expect(page.locator("#character-level")).toHaveText(
    String(expected.progression!.character.level),
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe(expected.exploration!.area);
  await expect(page.locator("#combat-hostile")).toBeChecked();
  await expect(page.locator("#ai-practice")).toHaveCount(0);
}
