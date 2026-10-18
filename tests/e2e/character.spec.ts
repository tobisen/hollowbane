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
