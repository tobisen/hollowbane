import { test, expect } from "@playwright/test";
test("character panel shows shared progression and combat totals", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator("#character-toggle").click();
  await expect(page.locator("#character-level")).toHaveText("1");
  await expect(page.locator("#character-xp")).toHaveText("0 / 100 XP");
  await expect(page.locator("#character-stats")).toContainText("Health300");
  await expect(page.locator("#character-strength")).toHaveText("0");
  await page.screenshot({ path: "test-results/character-panel.png" });
});

test("unearned allocation is disabled and character panel remains keyboard accessible", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator("#character-toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#allocate-strength")).toBeDisabled();
  await expect(page.locator("#character-points")).toHaveText("0");
});

test("funded allocation, duplicate-click protection and IndexedDB progression survive reload", async ({
  page,
}) => {
  const { createInventorySession } =
    await import("../../src/simulation/inventory-world");
  const { progressionAtLevel } =
    await import("../../src/simulation/progression-save");
  const { inventoryItem } =
    await import("../../src/simulation/inventory-test-helper");
  const { serializeCharacter, snapshotChecksum } =
    await import("../../src/simulation/inventory-save");
  const session = createInventorySession(987);
  session.character.level = 2;
  session.progression = progressionAtLevel(2);
  const item = inventoryItem("ash-blade");
  session.character.equipment.main = item;
  const snapshot = serializeCharacter(session);
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "character.json",
    mimeType: "application/json",
    buffer: Buffer.from(snapshot),
  });
  await expect(page.locator("#character-points")).toHaveText("5");
  await page.locator("#character-toggle").click();
  await page.locator("#allocate-vitality").click();
  await page.locator("#allocate-strength").dblclick();
  await expect(page.locator("#character-points")).toHaveText("3");
  await expect(page.locator("#character-strength")).toHaveText("1");
  await expect(page.locator("#character-stats")).toContainText("Health305");
  const damaged = JSON.parse(snapshot);
  damaged.body.progression.attributes.available = 999;
  damaged.checksum = snapshotChecksum(JSON.stringify(damaged.body));
  await page.locator("#inventory-import").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(damaged)),
  });
  await expect(page.locator("#inventory-status")).toContainText(
    "Existing session retained",
  );
  await expect(page.locator("#character-points")).toHaveText("3");
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator("#character-toggle").click();
  await expect(page.locator("#character-level")).toHaveText("2");
  await expect(page.locator("#character-points")).toHaveText("3");
  await expect(page.locator("#character-vitality")).toHaveText("1");
  await expect(page.locator("#character-xp")).toHaveText("100 / 500 XP");
  await expect(page.locator("#character-stats")).toContainText("Health305");
  await expect(
    page.locator(`#inventory-gear [data-item="${item.id}"]`),
  ).toHaveCount(1);
});

test("legacy IndexedDB checkpoint upgrades without changing equipment identity", async ({
  page,
}) => {
  const { createInventorySession } =
    await import("../../src/simulation/inventory-world");
  const { inventoryItem } =
    await import("../../src/simulation/inventory-test-helper");
  const { serializeCharacter, snapshotChecksum } =
    await import("../../src/simulation/inventory-save");
  const s = createInventorySession();
  const item = inventoryItem("ash-blade");
  s.character.equipment.main = item;
  const root = JSON.parse(serializeCharacter(s));
  root.schema = 1;
  delete root.body.progression;
  root.body.contentVersions = [2, 3];
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.evaluate(async (text) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("hollowbane-character-v1", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("snapshots", "readwrite");
      tx.objectStore("snapshots").put({ revision: 1, text }, "current");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, JSON.stringify(root));
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator("#character-toggle").click();
  await expect(page.locator("#character-level")).toHaveText("12");
  await expect(page.locator("#character-points")).toHaveText("55");
  await expect(
    page.locator(`#inventory-gear [data-item="${item.id}"]`),
  ).toHaveCount(1);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const schemas = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("hollowbane-character-v1", 1);
      r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction("snapshots", "readonly");
    const store = tx.objectStore("snapshots");
    const read = (key: string) =>
      new Promise<number>((resolve) => {
        const r = store.get(key);
        r.onsuccess = () => resolve(JSON.parse(r.result.text).schema);
      });
    const result = await Promise.all([read("current"), read("previous")]);
    db.close();
    return result;
  });
  expect(schemas).toEqual([4, 1]);
});
