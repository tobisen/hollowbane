import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import { walkEnvironmentExit } from "./world-environment-travel";
async function talk(page: Page, id: string) {
  const target = await page.evaluate((id) => {
    const w = window.hollowbaneWorld!,
      npc = w.routeToNpc!(id).at(-1)!,
      dx = w.position.x - npc.x,
      dy = w.position.y - npc.y,
      d = Math.hypot(dx, dy);
    const p = { x: npc.x + (dx / d) * 0.85, y: npc.y + (dy / d) * 0.85 },
      c = w.camera;
    return {
      x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
      y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
    };
  }, id);
  await page.locator("#combat-world").click({ position: target });
  await expect(page.locator("#camp-talk")).toHaveAttribute("data-npc", id);
  await expect
    .poll(() => page.evaluate(() => !window.hollowbaneWorld!.walking))
    .toBe(true);
  await page.locator("#camp-talk").click();
  await expect(page.locator("#camp-dialogue")).toBeVisible();
  await page.keyboard.press("Escape");
}
async function down(page: Page, scope: string) {
  await page.evaluate((scope) => {
    document.querySelector(scope)!.addEventListener(
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
    window.virtualPads[0]!.buttons[13] = {
      pressed: true,
      touched: true,
      value: 1,
    };
  }, scope);
}
test("quest journal locks prerequisites, commits one reward and retains tracked objectives through controller travel and reload", async ({
  page,
}) => {
  test.setTimeout(90000);
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await page.keyboard.press("j");
  await page.locator("#quest-practice").click();
  await expect(page.locator("#quest-title")).toHaveText("Camp introductions");
  await page.locator("#quest-next").click();
  await expect(page.locator("#quest-status")).toHaveText("Status: locked");
  await expect(page.locator("#quest-actions button")).toHaveCount(0);
  await page.locator("#quest-previous").click();
  await page.getByRole("button", { name: "Accept quest", exact: true }).click();
  await page.keyboard.press("j");
  for (const id of ["edda-vey", "orren-thale"]) await talk(page, id);
  await page.keyboard.press("j");
  await expect(page.locator("#quest-status")).toHaveText("Status: ready");
  await expect(page.locator("#quest-objectives li")).toHaveText([
    "Speak to Edda Vey: 1 / 1",
    "Speak to Orren Thale: 1 / 1",
  ]);
  await page.screenshot({ path: "test-results/d05-ready-reward.png" });
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-feedback")).toContainText(
    "Reward claimed.",
  );
  await expect(page.locator("#quest-status")).toHaveText("Status: claimed");
  await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.keyboard.press("f");
  await saveWorldCheckpoint(page);
  const reward = await readWorldCheckpoint(page, "ashen-refuge");
  expect(reward.progression!.character.totalXp).toBe(25);
  expect(reward.exploration!.containers!.gold).toBe(5);
  expect(reward.character.grid.items).toHaveLength(1);
  expect(reward.loot.drops).toHaveLength(0);
  await page.keyboard.press("Escape");
  await page.locator("#combat-world").focus();
  await pressVirtualButton(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  await expect(page.locator("#controller-resume")).toBeFocused();
  await down(page, "#controller-menu");
  await expect(page.locator("#controller-journal")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-journal")).toBeVisible();
  await expect(page.locator("#quest-next")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-title")).toHaveText("Field practice");
  await expect(page.locator("#quest-status")).toHaveText("Status: available");
  await down(page, "#quest-journal");
  await expect(page.locator('[data-quest-action="accept"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-tracked")).toHaveText(
    "Tracked: Field practice",
  );
  await page.screenshot({ path: "test-results/d05-tracked-journal.png" });
  await pressVirtualButton(page, 1);
  await walkEnvironmentExit(page, "ashen-refuge", "forest");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("haunted-forest");
  await saveWorldCheckpoint(page);
  const active = await readWorldCheckpoint(page, "ashen-refuge");
  expect(active.exploration!.quests!.entries[1]!.seen[0]).toEqual([
    "haunted-forest",
  ]);
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.keyboard.press("j");
  await expect(page.locator("#quest-tracked")).toHaveText(
    "Tracked: Field practice",
  );
  await expect(page.locator("#quest-objectives li").first()).toHaveText(
    "Enter the Haunted Forest: 1 / 1",
  );
  await page.screenshot({ path: "test-results/d05-reloaded-journal.png" });
  const restored = await readWorldCheckpoint(page, "ashen-refuge");
  expect(restored.progression).toEqual(active.progression);
  expect(restored.exploration!.quests).toEqual(active.exploration!.quests);
  expect(restored.character).toEqual(active.character);
  expect(restored.exploration!.containers).toEqual(
    active.exploration!.containers,
  );
  await page.keyboard.press("Escape");
  const collectedId = reward.character.grid.items[0]!.item.id;
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.locator("#inventory-open").click();
    await page
      .locator(`#inventory-grid button[data-item="${collectedId}"]`)
      .first()
      .click();
    await page.locator("#inventory-drop").click();
    await page.locator("#inventory-close").click();
    await expect(page.locator("#combat-world")).toBeFocused();
    await expect(page.locator(".loot-label")).toHaveCount(1);
    await page.keyboard.down("f");
    try {
      await expect(page.locator(".loot-label")).toHaveCount(0);
    } finally {
      await page.keyboard.up("f");
    }
  }
  await page.keyboard.press("j");
  await expect(page.locator("#quest-objectives li").nth(2)).toHaveText(
    "Pick up a forest item: 1 / 1",
  );
  await page.keyboard.press("Escape");
  await saveWorldCheckpoint(page);
  const collected = await readWorldCheckpoint(page, "ashen-refuge");
  expect(collected.exploration!.quests!.entries[1]!.seen[2]).toEqual([
    collectedId,
  ]);
  expect(collected.character.grid.items).toHaveLength(1);
  expect(collected.loot.drops).toHaveLength(0);
});
