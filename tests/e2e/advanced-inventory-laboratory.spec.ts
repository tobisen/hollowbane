import { test, expect } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
for (const id of [
  "Xbox 360 Controller (XInput STANDARD GAMEPAD)",
  "Wireless Controller (STANDARD GAMEPAD)",
]) {
  test(`${id}: isolated item laboratory replay, recipe reading and retained saves`, async ({
    page,
  }) => {
    await installVirtualController(page, id);
    await page.goto("./?inventory=1&advanced=1&training=1");
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    await page.getByText("Developer diagnostics", { exact: true }).click();
    await page.locator("#combat-hostile").uncheck();
    await page.locator(".loot-panel > details > summary").click();
    await page.locator("#loot-example").selectOption("5634");
    await page.locator("#loot-test").click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
      .toBe(1);
    await page.locator("#combat-world").focus();
    await page.keyboard.press("f");
    await page.locator("#inventory-open").click();
    await expect(page.locator("#inventory-laboratory-notice")).toContainText(
      "Normal character save",
    );
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    const originalId = await page
      .locator("#inventory-grid .inventory-item")
      .getAttribute("data-item");
    await page.locator("#inventory-save").click();
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint saved locally.",
    );
    await page
      .getByRole("link", { name: "Open separate item laboratory" })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    await page.getByText("Developer diagnostics", { exact: true }).click();
    await page.locator("#combat-hostile").uncheck();
    await page.locator(".loot-panel > details > summary").click();
    await page.locator("#loot-example").selectOption("component:sigil-lyrvek");
    await expect(page.locator("#loot-level")).toHaveValue("40");
    await page.locator("#loot-test").click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
      .toBe(1);
    await page.locator("#combat-world").focus();
    await page.keyboard.press("f");
    await page.locator("#inventory-open").click();
    await expect(page.locator("#inventory-laboratory-notice")).toContainText(
      "fixed level 40",
    );
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    await page.locator("#inventory-recipes-toggle").focus();
    await pressVirtualButton(page, 0);
    await expect(page.locator("#inventory-recipe-text")).toBeVisible();
    await expect(page.locator("#inventory-recipe-text")).toContainText(
      "Lastlight Vow",
    );
    await page.locator("#inventory-recipe-text").focus();
    await pressVirtualButton(page, 15);
    await expect(page.locator("#inventory-save")).toBeFocused();
    await pressVirtualButton(page, 0);
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint saved locally.",
    );
    await page.reload();
    await page.locator("#inventory-open").click();
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    await page
      .getByRole("link", { name: "Return to normal character" })
      .click();
    await page.locator("#inventory-open").click();
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    await expect(
      page.locator("#inventory-grid .inventory-item"),
    ).toHaveAttribute("data-item", originalId!);
    await expect(page.locator("#inventory-laboratory-notice")).toContainText(
      "Normal character save",
    );
  });
}
