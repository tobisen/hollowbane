import { expect, test } from "@playwright/test";

const pilot = "?developer=1&warriorPilot=1";
test("Warrior pilot exposes complete clips, exact stepping and review overlays", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pilot);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-pilot-ready",
    "true",
  );
  await page.locator("#pilot-play").click();
  await page.locator("#pilot-clip").selectOption("walk");
  await expect(page.locator("#pilot-frame")).toContainText("1 / 16");
  const distinct = new Set<string>();
  for (let i = 0; i < 16; i++) {
    await expect(page.locator("#pilot-frame")).toContainText(`${i + 1} / 16`);
    distinct.add(
      await page
        .locator("#pilot-candidate")
        .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    );
    await page.locator("#pilot-next").click();
  }
  expect(distinct.size).toBe(16);
  await expect(page.locator("#pilot-frame")).toContainText("1 / 16");
  await page.locator("#pilot-back").click();
  await expect(page.locator("#pilot-frame")).toContainText("16 / 16");
  await page.locator("#pilot-background").selectOption("light");
  await page.locator("#pilot-overlays").uncheck();
  await page.screenshot({
    path: testInfo.outputPath("warrior-light.png"),
    fullPage: true,
  });
  await page.locator("#pilot-background").selectOption("dark");
  await page.locator("#pilot-overlays").check();
  await page.screenshot({
    path: testInfo.outputPath("warrior-dark-guides.png"),
    fullPage: true,
  });
  await page.locator("#pilot-speed").fill("0.25");
  await page.locator("#pilot-play").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorPilot?.frame))
    .not.toBe(15);
  expect(await page.evaluate(() => window.hollowbaneWarriorPilot?.speed)).toBe(
    0.25,
  );
  expect(errors).toEqual([]);
});

test("Warrior preview uses real southeast movement, fixed roots and camera zoom without saves", async ({
  page,
}, testInfo) => {
  await page.goto(pilot);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-pilot-ready",
    "true",
  );
  await page.locator("#pilot-play").click();
  await page.locator("#pilot-zoom").selectOption("2");
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("KeyD");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorPilot?.distance ?? 0),
    )
    .toBeGreaterThan(0.3);
  const moving = await page.evaluate(() => window.hollowbaneWarriorPilot!);
  expect(moving.moving).toBe(true);
  expect(moving.position.x).toBeGreaterThan(0.3);
  expect(Math.abs(moving.position.y)).toBeLessThan(0.00001);
  expect(moving.stageFrame).toBeGreaterThanOrEqual(8);
  expect(moving.root).toEqual([128, 210]);
  expect(moving.zoom).toBe(2);
  await page.screenshot({
    path: testInfo.outputPath("warrior-travel.png"),
    fullPage: true,
  });
  await page.keyboard.up("KeyD");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorPilot?.moving))
    .toBe(false);
  const stopped = await page.evaluate(
    () => window.hollowbaneWarriorPilot!.distance,
  );
  await page.locator("#pilot-next").click();
  expect(
    await page.evaluate(() => window.hollowbaneWarriorPilot!.distance),
  ).toBe(stopped);
  await page.locator("#pilot-source").selectOption("shipped");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorPilot?.stageFrame ?? 0),
    )
    .toBeGreaterThanOrEqual(56);
  await page.locator("#pilot-source").selectOption("pilot");
  await page.locator("#pilot-travel-speed").fill("3");
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("Space");
  await expect
    .poll(() =>
      page.evaluate(
        (start) => window.hollowbaneWarriorPilot!.distance - start,
        stopped,
      ),
    )
    .toBeGreaterThan(1);
  await page.keyboard.up("Space");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorPilot?.moving))
    .toBe(false);
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      databases: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], databases: [] });
});

test("Warrior preview needs the explicit developer route and is not loaded by normal entry", async ({
  page,
}) => {
  const fetched: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("warrior-pilot")) fetched.push(request.url());
  });
  await page.goto("?warriorPilot=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  await expect(page.locator("#pilot-stage")).toHaveCount(0);
  expect(fetched).toEqual([]);
});
