import { expect, test } from "@playwright/test";
const route = "?developer=1&warriorPilot=1&warriorCombat=1";
const ready = async (page: import("@playwright/test").Page) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-combat-ready",
    "true",
  );
};
test("Southeast primary and secondary follow real strike events once and return to idle without saves", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.locator("#attack-pause").click();
  const impacts: string[] = [];
  for (const [attack, impact] of [
    ["primary", 5],
    ["secondary", 17],
  ] as const) {
    await page.locator("#attack-clip").selectOption(attack);
    await page.locator("#attack-reset").click();
    await page.locator("#attack-start").click();
    for (let tick = 1; tick <= 32; tick++) {
      await page.locator("#attack-step").click();
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
        )
        .toBe(tick);
      const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
      expect(o.direction).toBe(7);
      expect(o.cameraRelative).toEqual({ x: 480, y: 190 });
      if (tick < 12) {
        expect(o.sample.phase).toBe("windup");
        expect(o.sample.hp).toBe(160);
      }
      if (tick === 12) {
        expect(o.sample).toMatchObject({
          phase: "active",
          frame: impact,
          strike: true,
          sequence: 1,
        });
        expect(o.sample.hp).toBeLessThan(160);
        impacts.push(
          await page
            .locator("#cadence-inspector")
            .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
        );
        await page.screenshot({
          path: info.outputPath(`${attack}-impact.png`),
          fullPage: true,
        });
      }
      if (tick === 32) {
        expect(o.sample).toMatchObject({
          phase: "idle",
          frame: null,
          sequence: 1,
        });
        expect(o.history.filter((h) => h.strike)).toHaveLength(1);
        expect(
          new Set(
            o.history.filter((h) => h.phase === "recovery").map((h) => h.hp),
          ).size,
        ).toBe(1);
      }
    }
  }
  expect(impacts[0]).not.toBe(impacts[1]);
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      db: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], db: [] });
  expect(errors).toEqual([]);
});
test("actual normal and slow playback exposes both scales, backgrounds and shipped comparison", async ({
  page,
}, info) => {
  await ready(page);
  expect(
    await page
      .locator("#attack-gameplay")
      .evaluate((c) => getComputedStyle(c).width),
  ).toBe("128px");
  expect(
    await page
      .locator("#cadence-inspector")
      .evaluate((c) => getComputedStyle(c).width),
  ).toBe("384px");
  for (const rate of ["1", "0.25"]) {
    await page.locator("#attack-rate").selectOption(rate);
    for (const clip of ["primary", "secondary"]) {
      await page.locator("#attack-clip").selectOption(clip);
      await page.locator("#attack-start").click();
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneWarriorCombat!.sample.sequence),
        )
        .toBe(1);
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneWarriorCombat!.sample.phase),
        )
        .toBe("idle");
      const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
      expect(o.history.filter((h) => h.strike)).toHaveLength(1);
      expect(o.history.some((h) => h.phase === "windup")).toBe(true);
      expect(o.history.some((h) => h.phase === "recovery")).toBe(true);
    }
  }
  await page.locator("#attack-background").selectOption("light");
  await page.screenshot({ path: info.outputPath("light.png"), fullPage: true });
  await page.locator("#attack-background").selectOption("dark");
  await page.locator("#attack-source").selectOption("shipped");
  await page.locator("#attack-zoom").selectOption("2");
  await page.screenshot({
    path: info.outputPath("shipped-zoom2.png"),
    fullPage: true,
  });
});
test("normal entry excludes attack preview and textures", async ({ page }) => {
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/warrior-combat/.test(r.url())) fetched.push(r.url());
  });
  await page.goto("?warriorCombat=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(fetched).toEqual([]);
});
