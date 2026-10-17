import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("./?polish=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
  await page.locator("#combat-world").focus();
}
async function point(page: Page, x: number, y: number) {
  return page.evaluate(
    ({ x, y }) => {
      const r = document.querySelector("canvas")!.getBoundingClientRect(),
        v = window.hollowbaneCombat!.view;
      return {
        x: r.x + ((x - v.x) / v.width) * r.width,
        y: r.y + ((y - v.y) / v.height) * r.height,
      };
    },
    { x, y },
  );
}
test("polish motion follows deterministic strike and death without moving colliders", async ({
  page,
}) => {
  await ready(page);
  const a = await page.evaluate(() => window.hollowbaneCombat!.actors[1]!);
  const p = await point(page, a.x, a.y - 28);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            window.hollowbanePolish!.poses.find((p) => p.id === 0)?.strikeAt,
        ),
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 18000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbanePolish!.poses.find((p) => p.id === 1)?.pose.fall,
      ),
    )
    .toBe(1);
  const after = await page.evaluate(() => window.hollowbaneCombat!.actors[1]!);
  expect(after.x).toBe(a.x);
  expect(after.y).toBe(a.y);
  expect(
    await page.evaluate(
      () => window.hollowbanePolish!.poses.find((p) => p.id === 1)!.pose.alpha,
    ),
  ).toBeCloseTo(0.45);
  await page.screenshot({ path: ".local/polish-motion.png" });
});
