import { expect, type Page } from "@playwright/test";
import { deserializeCharacter } from "../../src/simulation/inventory-save";

/** Read the actual atomic browser checkpoint without modifying its contents. */
export async function readWorldCheckpoint(page: Page, area: string) {
  const text = await page.evaluate(async (area) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(`hollowbane-world-test-42-0-${area}`, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<string>((resolve, reject) => {
        const request = db
          .transaction("snapshots")
          .objectStore("snapshots")
          .get("current");
        request.onsuccess = () => resolve(request.result.text);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }, area);
  return deserializeCharacter(text);
}

export async function saveWorldCheckpoint(page: Page) {
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
}
