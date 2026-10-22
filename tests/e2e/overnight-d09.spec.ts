import { expect, test, type Page } from "@playwright/test";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { WorldSession } from "../../src/simulation/world-session";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { chooseSkillClass } from "../../src/simulation/skill-progression";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  merchantItem,
  merchantSalePrice,
} from "../../src/simulation/camp-merchant-state";
import { loadD06Checkpoint } from "./d06-checkpoint";
import { readWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

/** Explicit pre-game checkpoints. All subsequent trades use real UI and IndexedDB. */
function checkpoint(gold = 500, full = false) {
  const s = createInventorySession(900),
    p = progressionAtLevel(3);
  s.character.level = 3;
  s.progression = { ...p, skills: chooseSkillClass(p.skills, "warrior") };
  const w = new WorldSession();
  s.exploration = w.capture({ x: 1, y: 3 }, s.loot);
  s.exploration.containers!.gold = gold;
  if (full) s.character.grid = { columns: 1, rows: 1, items: [] };
  return serializeCharacter(s);
}
async function openMerchant(page: Page) {
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  await page.locator("#camp-merchant-open").click();
  await expect(page.locator("#camp-merchant")).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.locator("#merchant-save-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  return readWorldCheckpoint(page, "ashen-refuge");
}
/** End a D-pad tap on actual focus consumption, including slow software-rendered CI. */
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
async function controllerMerchant(page: Page) {
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  for (let n = 0; n < 4; n++) await down(page);
  await expect(page.locator("#camp-merchant-open")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-merchant")).toBeVisible();
}

test("merchant mouse keyboard inspection cancel buy sell and reload preserve atomic gold and finite stock", async ({
  page,
}, info) => {
  await loadD06Checkpoint(page, checkpoint());
  await openMerchant(page);
  const offer = page.locator('[data-trade-kind="buy"][data-item="ash-blade"]');
  await offer.click();
  await expect(page.locator("#merchant-details")).toContainText("damage: 6");
  await expect(page.locator("#merchant-confirm")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#merchant-feedback")).toContainText("cancelled");
  await expect(page.locator("#merchant-gold")).toHaveText("Gold: 500");
  await offer.click();
  await page.keyboard.press("Enter");
  await expect(page.locator("#merchant-gold")).toHaveText("Gold: 440");
  await expect(offer).toBeDisabled();
  const bought = await saved(page),
    item = merchantItem("ash-blade");
  expect(bought.character.grid.items.map((e) => e.item)).toEqual([item]);
  expect(bought.exploration!.merchant!.purchased).toEqual(["ash-blade"]);
  expect(bought.loot.sequence).toBe(0);
  await page.screenshot({ path: info.outputPath("merchant-bought.png") });
  await page.locator("#merchant-close").click();
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await openMerchant(page);
  await expect(offer).toBeDisabled();
  await page.locator('[data-trade-kind="sell"]').click();
  await page.locator("#merchant-confirm").click();
  await expect(page.locator("#merchant-gold")).toHaveText(
    `Gold: ${440 + merchantSalePrice(item)}`,
  );
  const sold = await saved(page);
  expect(sold.character.grid.items).toEqual([]);
  expect(sold.exploration!.merchant!.retired).toEqual([item.id]);
  await page.locator("#merchant-close").click();
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await openMerchant(page);
  await expect(offer).toBeDisabled();
  await expect(page.locator('[data-trade-kind="sell"]')).toHaveCount(0);
  expect(
    (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.merchant,
  ).toEqual(sold.exploration!.merchant);
});

test("merchant virtual controller inspects confirms once cancels restores gameplay focus and persists trading", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoint());
  await page.locator("#combat-world").focus();
  await controllerMerchant(page);
  await expect(page.locator('[data-item="ash-blade"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#merchant-confirm")).toBeFocused();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#camp-merchant")).not.toBeVisible();
  await expect(page.locator("#combat-world")).toBeFocused();
  await controllerMerchant(page);
  await expect(page.locator("#merchant-gold")).toHaveText("Gold: 500");
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 0, 12);
  await expect(page.locator("#merchant-gold")).toHaveText("Gold: 440");
  const bought = await saved(page);
  expect(bought.exploration!.merchant!.revision).toBe(1);
  expect(bought.character.grid.items).toHaveLength(1);
  for (let n = 0; n < 4; n++) await down(page);
  await expect(page.locator('[data-trade-kind="sell"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#merchant-quote")).toContainText(
    "Sell permanently",
  );
  await page.screenshot({
    path: info.outputPath("merchant-controller-sale.png"),
  });
  await pressVirtualButton(page, 0);
  const sold = await saved(page);
  expect(sold.exploration!.merchant!.revision).toBe(2);
  expect(sold.character.grid.items).toEqual([]);
  await expect(page.locator("#merchant-help")).toContainText("B: Back");
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.locator("#combat-world").focus();
  await controllerMerchant(page);
  await expect(page.locator('[data-item="ash-blade"]')).toBeDisabled();
  expect(
    (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.containers!
      .gold,
  ).toBe(sold.exploration!.containers!.gold);
});

for (const [name, gold, full, message] of [
  ["insufficient funds", 0, false, "Not enough gold"],
  ["full backpack", 500, true, "Backpack full"],
] as const)
  test(`merchant ${name} rejects without changing gold ownership or stock`, async ({
    page,
  }) => {
    await loadD06Checkpoint(page, checkpoint(gold, full));
    await openMerchant(page);
    await page.locator('[data-item="ash-blade"]').click();
    await page.locator("#merchant-confirm").click();
    await expect(page.locator("#merchant-feedback")).toContainText(message);
    await expect(page.locator("#merchant-gold")).toHaveText(`Gold: ${gold}`);
    await expect(page.locator('[data-item="ash-blade"]')).toBeEnabled();
    const state = await readWorldCheckpoint(page, "ashen-refuge");
    expect(state.character.grid.items).toEqual([]);
    expect(state.exploration!.merchant).toBeUndefined();
    expect(state.exploration!.containers!.gold).toBe(gold);
  });
