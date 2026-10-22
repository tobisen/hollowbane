import { expect, test, type Page } from "@playwright/test";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { WorldSession } from "../../src/simulation/world-session";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { chooseSkillClass } from "../../src/simulation/skill-progression";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../../src/simulation/inventory-save";
import { newCampStash } from "../../src/simulation/camp-stash-state";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { socketedCampItem } from "../fixtures/camp-items";
import { loadD06Checkpoint } from "./d06-checkpoint";
import { readWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

function checkpoint(mode: "normal" | "full-stash" | "full-bag" = "normal") {
  const s = createInventorySession(900),
    p = progressionAtLevel(3),
    w = new WorldSession();
  s.character.level = 3;
  s.progression = { ...p, skills: chooseSkillClass(p.skills, "warrior") };
  s.exploration = w.capture({ x: 1, y: 3 }, s.loot);
  const entry = { item: socketedCampItem(), x: 0, y: 0 };
  s.character.grid.items = [entry];
  if (mode === "full-stash")
    s.exploration.stash = {
      ...newCampStash(),
      grid: {
        columns: 1,
        rows: 1,
        items: [{ item: inventoryItem("copper-band"), x: 0, y: 0 }],
      },
    };
  if (mode === "full-bag") {
    s.character.grid = {
      columns: 1,
      rows: 1,
      items: [{ item: inventoryItem("copper-band"), x: 0, y: 0 }],
    };
    s.character.revision = 1;
    s.exploration.stash = {
      ...newCampStash(),
      revision: 1,
      grid: { columns: 10, rows: 8, items: [entry] },
    };
  }
  return serializeCharacter(s);
}
async function openStash(page: Page) {
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  await page.locator("#camp-stash-open").click();
  await expect(page.locator("#camp-stash")).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.locator("#stash-save-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  return readWorldCheckpoint(page, "ashen-refuge");
}
async function down(page: Page) {
  await page.evaluate(() => {
    document.querySelector("dialog[open]")!.addEventListener(
      "focusin",
      () => {
        window.virtualPads[0]!.buttons[13] = {
          pressed: false,
          touched: false,
          value: 0,
        };
      },
      { once: true },
    );
  });
  await pressVirtualButton(page, 13);
}
async function controllerStash(page: Page) {
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  for (let n = 0; n < 5; n++) await down(page);
  await expect(page.locator("#camp-stash-open")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-stash")).toBeVisible();
}

test("camp stash mouse keyboard cancel store reload and retrieve preserve embedded identity in the character save", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await loadD06Checkpoint(page, checkpoint());
  await openStash(page);
  await expect(page.locator("#camp-stash")).toContainText(
    "this character only",
  );
  await page.locator('[data-stash-action="store"]').click();
  await expect(page.locator("#stash-details")).toContainText(
    "1 embedded component",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#stash-feedback")).toContainText("cancelled");
  await expect(page.locator('[data-stash-action="store"]')).toHaveCount(1);
  await page.locator('[data-stash-action="store"]').click();
  await page.keyboard.press("Enter");
  const stored = await saved(page),
    item = socketedCampItem();
  expect(stored.character.grid.items).toEqual([]);
  expect(stored.exploration!.stash!.grid.items[0]!.item).toEqual(item);
  expect(stored.loot.reserved).toContain(item.embedded![0]!.id);
  await page.locator('[data-stash-action="retrieve"]').click();
  await page.screenshot({ path: info.outputPath("stash-stored-embedded.png") });
  await page.locator("#stash-cancel").click();
  await page.locator("#stash-close").click();
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await openStash(page);
  await expect(page.locator('[data-stash-action="store"]')).toHaveCount(0);
  await page.locator('[data-stash-action="retrieve"]').click();
  await page.locator("#stash-confirm").click();
  const retrieved = await saved(page);
  expect(retrieved.character.grid.items[0]!.item).toEqual(item);
  expect(retrieved.exploration!.stash!.grid.items).toEqual([]);
  expect(retrieved.exploration!.stash!.revision).toBe(2);
  expect(retrieved.loot.sequence).toBe(stored.loot.sequence);
  expect(retrieved.exploration!.containers).toEqual(
    stored.exploration!.containers,
  );
});

test("camp stash virtual controller cancels confirms once retrieves and restores focus with persistent ownership", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoint());
  await page.locator("#combat-world").focus();
  await controllerStash(page);
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 1);
  await expect(page.locator("#camp-stash")).not.toBeVisible();
  await expect(page.locator("#combat-world")).toBeFocused();
  await controllerStash(page);
  await expect(page.locator('[data-stash-action="store"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 0, 12);
  const stored = await saved(page);
  expect(stored.character.grid.items).toEqual([]);
  expect(stored.exploration!.stash!.revision).toBe(1);
  await expect(page.locator('[data-stash-action="retrieve"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 0);
  const retrieved = await saved(page);
  expect(retrieved.character.grid.items[0]!.item).toEqual(socketedCampItem());
  expect(retrieved.exploration!.stash!.revision).toBe(2);
  await expect(page.locator("#stash-help")).toContainText("B: Back");
  await page.screenshot({
    path: info.outputPath("stash-controller-retrieved.png"),
  });
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.locator("#combat-world").focus();
  await controllerStash(page);
  await expect(page.locator('[data-stash-action="store"]')).toHaveCount(1);
  await expect(page.locator('[data-stash-action="retrieve"]')).toHaveCount(0);
});
for (const [mode, action] of [
  ["full-stash", "store"],
  ["full-bag", "retrieve"],
] as const)
  test(`camp stash ${mode} rejects the transfer without losing or duplicating either grid`, async ({
    page,
  }) => {
    const text = checkpoint(mode),
      prior = deserializeCharacter(text);
    await loadD06Checkpoint(page, text);
    await openStash(page);
    await page.locator(`[data-stash-action="${action}"]`).click();
    await page.locator("#stash-confirm").click();
    await expect(page.locator("#stash-feedback")).toContainText(
      "both grids unchanged",
    );
    const current = await readWorldCheckpoint(page, "ashen-refuge");
    expect(current.character).toEqual(prior.character);
    expect(current.exploration!.stash).toEqual(prior.exploration!.stash);
    await expect(page.locator(`[data-stash-action="${action}"]`)).toHaveCount(
      1,
    );
  });
