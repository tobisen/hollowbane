import {
  defaultControllerSettings,
  CONTROLLER_STORAGE,
} from "../../src/simulation/controller-settings";
import { test, expect } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { serializeCharacter } from "../../src/simulation/inventory-save";
for (const id of [
  "Xbox 360 Controller",
  "Wireless Controller (STANDARD GAMEPAD)",
  "Generic Standard Gamepad",
]) {
  test(`character allocation/cancel/disconnect: ${id}`, async ({ page }) => {
    await installVirtualController(page, id);
    const choose = id.startsWith("Generic") ? 3 : 0;
    if (choose === 3) {
      const settings = defaultControllerSettings();
      settings.bindings.interact = [3];
      settings.bindings.secondary = [0];
      await page.addInitScript(
        ({ key, settings }) =>
          localStorage.setItem(key, JSON.stringify(settings)),
        { key: CONTROLLER_STORAGE, settings },
      );
    }
    await page.goto("./?inventory=1&training=1");
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    const session = createInventorySession();
    session.character.level = 2;
    session.progression = progressionAtLevel(2);
    await page.locator("#inventory-open").click();
    await page.locator("#inventory-import").setInputFiles({
      name: "character.json",
      mimeType: "application/json",
      buffer: Buffer.from(serializeCharacter(session)),
    });
    await expect(page.locator("#character-points")).toHaveText("5");
    await page.locator("#inventory-close").click();
    await page.locator("#combat-world").focus();
    await pressVirtualButton(page, 8);
    await expect(page.locator("#inventory-dialog")).toBeVisible();
    await expect(page.locator("#inventory-close")).toBeFocused();
    await pressVirtualButton(page, 13);
    await expect(page.locator("#character-toggle")).toBeFocused();
    await pressVirtualButton(page, choose);
    await pressVirtualButton(page, 13);
    await expect(page.locator("#allocate-strength")).toBeFocused();
    await expect(page.locator("#inventory-prompts")).toContainText(
      "allocate 1",
    );
    await expect(page.locator("#allocate-strength")).toHaveCSS(
      "outline-style",
      "solid",
    );
    if (choose === 3)
      await expect(page.locator("#inventory-prompts")).toContainText(
        "Button 4: choose",
      );
    await pressVirtualButton(page, choose, 15);
    await expect(page.locator("#character-strength")).toHaveText("1");
    await expect(page.locator("#character-points")).toHaveText("4");
    if (id.startsWith("Xbox"))
      await page.screenshot({ path: "test-results/character-controller.png" });
    await pressVirtualButton(page, 13);
    await expect(page.locator("#allocate-dexterity")).toBeFocused();
    await pressVirtualButton(page, 2);
    await expect(page.locator("#character-dexterity")).toHaveText("1");
    await pressVirtualButton(page, 15);
    await expect(page.locator("#character-stats")).toBeFocused();
    await pressVirtualButton(page, 14);
    await expect(page.locator("#allocate-strength")).toBeFocused();
    await page.evaluate(() => {
      window.virtualPads[0]!.connected = false;
    });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(false);
    await expect(page.locator("#character-points")).toHaveText("3");
    await page.locator("#allocate-energy").click();
    await expect(page.locator("#character-energy")).toHaveText("1");
    await page.evaluate(() => {
      window.virtualPads[0]!.connected = true;
    });
    await pressVirtualButton(page, 1);
    await expect(page.locator("#character-panel")).not.toHaveAttribute(
      "open",
      "",
    );
    await expect(page.locator("#character-toggle")).toBeFocused();
    await pressVirtualButton(page, 1);
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  });
}
