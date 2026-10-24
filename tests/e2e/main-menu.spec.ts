import { expect, test, type Page } from "@playwright/test";
import { characterApi } from "../fixtures/character-api";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { WorldSession } from "../../src/simulation/world-session";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function ready(page: Page) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
}
async function seed(page: Page, current: string, previous?: string) {
  await ready(page);
  await page.evaluate(
    async ({ current, previous }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("hollowbane-character-v1", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("snapshots", "readwrite");
          tx.objectStore("snapshots").put(
            { revision: 2, text: current },
            "current",
          );
          if (previous)
            tx.objectStore("snapshots").put(
              { revision: 1, text: previous },
              "previous",
            );
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    { current, previous },
  );
  await ready(page);
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("hollowbane-character-v1", 1);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      return await new Promise<unknown>((resolve) => {
        const request = db
          .transaction("snapshots")
          .objectStore("snapshots")
          .getAll();
        request.onsuccess = () => resolve(request.result);
      });
    } finally {
      db.close();
    }
  });
}

test("fresh title screen supports keyboard, settings return and character setup without writing a save", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "HOLLOWBANE", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue Game" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "New Game" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#controller-settings-form")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeFocused();
  expect(await saved(page)).toEqual([]);
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m1-a-desktop.png",
  });
  await page.getByRole("button", { name: "New Game" }).click();
  await expect(page.locator("#menu-create-dialog")).toBeVisible();
  expect(await saved(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-create-dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("validated legacy selection and continue preserve exact item identity and route to the saved world", async ({
  page,
}) => {
  const session = createInventorySession();
  session.character.grid.items.push({
    item: inventoryItem("ash-blade"),
    x: 0,
    y: 0,
  });
  session.exploration = new WorldSession().capture(
    { x: 0, y: 0 },
    session.loot,
  );
  const text = serializeCharacter(session);
  await seed(page, text);
  const before = await saved(page);
  await expect(
    page.getByRole("button", { name: "Continue Game" }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "New Game" })).toBeVisible();
  await page.getByRole("button", { name: "Continue Game" }).click();
  await expect(page.locator("#menu-legacy-detail")).toHaveText(
    "Adventurer · Level 12",
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue Game" }),
  ).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "Continue Game" }).click();
  await page
    .getByRole("button", { name: "Import and Play Legacy Adventurer" })
    .click();
  await expect(page).toHaveURL(
    /\?world=1&character=00000000-0000-4000-8000-000000000001$/,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  expect(await saved(page)).toEqual(before);
  await expect(
    page.locator('#inventory-grid button[data-focus="cell-0-0"]'),
  ).toHaveAttribute("data-item", session.character.grid.items[0]!.item.id);
});

test("corrupt current never auto substitutes a valid backup or offers New Game", async ({
  page,
}) => {
  await seed(
    page,
    "corrupt current sentinel",
    serializeCharacter(createInventorySession()),
  );
  const before = await saved(page);
  await expect(
    page.getByRole("button", { name: "Continue Game" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "New Game" })).toBeHidden();
  await expect(page.locator("#menu-status")).toContainText(
    "no backup has been substituted",
  );
  await page.getByRole("button", { name: "Review save recovery" }).click();
  await expect(page.locator("#inventory-recover")).toBeVisible();
  expect(await saved(page)).toEqual(before);
});

test("unavailable storage retains a retryable error and settings", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", {
      get: () => {
        throw new Error("Storage denied");
      },
    }),
  );
  await ready(page);
  await expect(page.locator("#menu-status")).toContainText(
    "No save was changed",
  );
  await expect(
    page.getByRole("button", { name: "Continue Game" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "New Game" })).toBeHidden();
  await page.getByRole("button", { name: "Retry storage" }).click();
  await expect(
    page.getByRole("button", { name: "Retry storage" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator("#controller-settings-form")).toBeVisible();
});

for (const id of [
  "Xbox standard controller",
  "DualSense Wireless Controller",
]) {
  test(`${id} navigates and returns from title settings`, async ({ page }) => {
    await installVirtualController(page, id);
    await ready(page);
    await pressVirtualButton(page, 13);
    await expect(
      page.getByRole("button", { name: "Settings", exact: true }),
    ).toBeFocused();
    await pressVirtualButton(page, 0);
    await expect(page.locator("#menu-settings-dialog")).toBeVisible();
    await pressVirtualButton(page, 1);
    await expect(page.locator("#menu-settings-dialog")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Settings", exact: true }),
    ).toBeFocused();
    await expect(page.locator("#controller-menu")).toHaveCount(0);
  });
}
test("title and settings fit small and ultrawide windows", async ({ page }) => {
  for (const size of [
    { width: 360, height: 640 },
    { width: 2560, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await ready(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(size.width);
    await expect(
      page.getByRole("button", { name: "New Game" }),
    ).toBeInViewport();
    await page.screenshot({
      animations: "disabled",
      path: `test-results/m1-a-title-${size.width}.png`,
    });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    expect(
      await page
        .locator("#menu-settings-dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      animations: "disabled",
      path: `test-results/m1-a-${size.width}.png`,
    });
  }
});

test("inventory-only legacy character retains its original route and never acquires an invented campaign", async ({
  page,
}) => {
  const session = createInventorySession(17);
  session.character.grid.items.push({
    item: inventoryItem("ash-blade"),
    x: 0,
    y: 0,
  });
  await seed(page, serializeCharacter(session));
  const original = await saved(page);
  await page.locator("#menu-continue").click();
  await page
    .getByRole("button", { name: "Import and Play Legacy Adventurer" })
    .click();
  await expect(page).toHaveURL(
    /\?inventory=1&advanced=1&character=00000000-0000-4000-8000-000000000001$/,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  expect(await page.evaluate(() => Boolean(window.hollowbaneWorld))).toBe(
    false,
  );
  await page.locator("#inventory-open").click();
  await expect(
    page.locator('#inventory-grid button[data-focus="cell-0-0"]'),
  ).toHaveAttribute("data-item", session.character.grid.items[0]!.item.id);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  expect(await saved(page)).toEqual(original);
  await characterApi(page);
  expect(
    await page.evaluate(async () => {
      const store = new window.characterStorageModule.CharacterStorage();
      try {
        const loaded = await store.load("00000000-0000-4000-8000-000000000001");
        if (loaded.kind !== "valid") throw Error("Legacy slot invalid");
        return loaded.session.exploration;
      } finally {
        store.close();
      }
    }),
  ).toBeUndefined();
  await page.locator("#inventory-close").click();
  await page.locator("#player-pause-open").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  expect(await saved(page)).toEqual(original);
  await page.locator("#menu-continue").click();
  await expect(page).toHaveURL(
    /\?inventory=1&advanced=1&character=00000000-0000-4000-8000-000000000001$/,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  expect(await page.evaluate(() => Boolean(window.hollowbaneWorld))).toBe(
    false,
  );
  await page.goto("?world=1&character=00000000-0000-4000-8000-000000000001");
  await expect(page.locator("#inventory-status")).toContainText(
    "inventory route",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#inventory-dialog")).toBeVisible();

  await ready(page);
  await page.locator("#menu-continue").click();
  await expect(page).toHaveURL(
    /\?inventory=1&advanced=1&character=00000000-0000-4000-8000-000000000001$/,
  );
});
