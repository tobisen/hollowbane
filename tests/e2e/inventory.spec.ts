import { test, expect } from "@playwright/test";
test("world pickup, multi-cell bag, identify, equipment and local checkpoint survive reload", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("3");
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-cell")).toHaveCount(40);
  await page.locator("#inventory-grid button[data-item]").first().click();
  const identify = page.locator("#inventory-identify");
  if (await identify.isEnabled()) await identify.click();
  await expect(page.locator("#inventory-details")).not.toContainText(
    "concealed",
  );
  await page.locator("#inventory-equip").click();
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await expect(page.locator("#loot-save")).toBeHidden();
  await page.screenshot({
    path: `test-results/inventory-${test.info().project.name}.png`,
  });
});
