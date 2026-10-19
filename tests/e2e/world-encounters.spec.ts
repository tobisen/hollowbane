import { expect, test } from "@playwright/test";
test("generated expedition installs stable safe monster identities across save/reload", async ({
  page,
}) => {
  await page.goto("?world=1&developer=1&worldArea=haunted-forest");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAI?.enemies.length ?? 0))
    .toBeGreaterThan(0);
  const ids = await page.evaluate(() =>
    window.hollowbaneAI!.enemies.map((e) => e.id),
  );
  expect(new Set(ids).size).toBe(ids.length);
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneAI?.enemies.map((e) => e.id)),
    )
    .toEqual(ids);
  await page.screenshot({ path: "test-results/w4-forest-encounters.png" });
});
