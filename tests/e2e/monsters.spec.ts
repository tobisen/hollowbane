import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page, url = "./?monsters=1") {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAI?.enemies.length ?? 0))
    .toBeGreaterThan(0);
}
test("monster encounter composes safely, attacks through combat and resets enemy counts", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator("h1")).toHaveText("The Cinder Watch");
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat?.events.some(
            (e) => e.kind === "damage" && e.actor !== 0,
          ),
        ),
      { timeout: 12000 },
    )
    .toBe(true);
  await page.locator("#ai-count").selectOption("30");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAI?.enemies.length))
    .toBe(30);
  expect(
    await page.evaluate(() => window.hollowbaneAI!.metrics.pathRequests),
  ).toBeLessThanOrEqual(2);
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#ai-debug").check();
  await page.locator("#combat-pause").click();
  await expect(page.locator("#combat-pause")).toHaveText("Resume");
});
test("monster arena visual reference shows original role proxies and obstacle geometry", async ({
  page,
}) => {
  await ready(page, "./?monsters=1&paused=1");
  await page.locator("#ai-debug").check();
  await expect(page.locator("#combat-world canvas")).toHaveScreenshot(
    "monster-arena.png",
    {
      mask: [
        page.locator(".arena-panel"),
        page.locator(".arena-header"),
        page.locator(".arena-footer"),
      ],
      maxDiffPixelRatio: 0.01,
    },
  );
  await page.screenshot({ path: ".local/monster-arena.png" });
});
