import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { expect, test } from "@playwright/test";
test("boss engine trial renders a locked warning, real strike, phase HUD and normal mouse targeting", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./?combat=1&developer=1&bossTrial=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#boss-hud")).toBeVisible();
  await expect(page.locator("#boss-phase")).toContainText("Phase 1");
  await page.waitForFunction(() => !!window.hollowbaneBoss?.state.telegraph);
  await expect(page.locator("#boss-warning")).not.toBeEmpty();
  await page.screenshot({
    path: testInfo.outputPath("boss-engine-warning.png"),
  });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneBoss?.state.events.some((e) => e.kind === "strike"),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeLessThan(300);
  const point = await page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors.find((a) => a.id === 100)!,
      v = window.hollowbaneCombat!.view;
    const r = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: r.x + ((a.x - v.x) / v.width) * r.width,
      y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
    };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.phase), {
        timeout: 15000,
      })
      .toBe(1);
    await expect(page.locator("#boss-phase")).toContainText("Phase 2");
  } finally {
    await page.mouse.up();
  }
  expect(errors).toEqual([]);
});

test("virtual controller selects and damages the boss through existing primary combat", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("./?combat=1&developer=1&bossTrial=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  await pressVirtualButton(page, 2);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(100);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneBoss!.health), {
      timeout: 10000,
    })
    .toBeLessThan(240);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
});
