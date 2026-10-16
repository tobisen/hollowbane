import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?metrics=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  await expect(page.locator("#world-metrics")).toContainText("PHASER 4.2.1");
}
test("detailed cloister renders without errors and preserves its visual reference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const failed: string[] = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  await ready(page);
  await expect(page.locator("#world canvas")).toBeVisible();
  await expect(page.locator("main")).toHaveScreenshot("veiled-cloister.png", {
    mask: [page.locator("#world-metrics")],
    maxDiffPixelRatio: 0.01,
  });
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(
    await page.evaluate(() => window.hollowbaneDiagnostics?.renderer),
  ).toBe("WebGL");
});
