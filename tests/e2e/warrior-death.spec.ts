import { expect, test } from "@playwright/test";

for (const direction of ["n", "ne", "e", "se", "s", "sw", "w", "nw"])
  test(`${direction.toUpperCase()} actual death interrupts a cast and holds the terminal pose until explicit reset`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      "?developer=1&warriorPilot=1&warriorCombat=1&warriorAbilities=1&warriorDeath=1",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-warrior-combat-ready",
      "true",
    );
    await page.locator("#attack-pause").click();
    await page.locator("#attack-direction").selectOption(direction);
    await page.locator("#attack-start").click();
    await page.locator("#attack-step").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorCombat!.sample.phase),
      )
      .toBe("windup");
    await page.locator("#death-receive").click();
    for (let tick = 2; tick <= 33; tick++) {
      await page.locator("#attack-step").click();
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
        )
        .toBe(tick);
      const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
      expect(o.sample).toMatchObject({
        phase: "dead",
        playerHp: 0,
        hitFrame: null,
        frame: null,
        effects: 0,
      });
      expect(o.cameraRelative).toEqual({ x: 480, y: 190 });
      if (tick >= 31) expect(o.sample.deathFrame).toBe(15);
      expect(o.history.filter((h) => h.strike)).toHaveLength(0);
      if (tick === 16 || tick === 33)
        await page.screenshot({
          path: info.outputPath(`death-${tick}.png`),
          fullPage: true,
        });
    }
    const terminal = await page
      .locator("#cadence-inspector")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.locator("#hit-small").click();
    await page.locator("#attack-step").click();
    await expect
      .poll(() =>
        page
          .locator("#cadence-inspector")
          .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
      )
      .toBe(terminal);
    await expect(page.locator("#attack-start")).toBeDisabled();
    await page.locator("#attack-background").selectOption("light");
    await page.screenshot({
      path: info.outputPath("light-corpse.png"),
      fullPage: true,
    });
    await page.locator("#attack-reset").click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWarriorCombat!.sample))
      .toMatchObject({ phase: "idle", deathFrame: null });
    expect(
      await page.evaluate(async () => ({
        keys: Object.keys(localStorage),
        db: await indexedDB.databases(),
      })),
    ).toEqual({ keys: [], db: [] });
    expect(errors).toEqual([]);
  });

test("normal entry excludes death preview textures", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/warrior-death/.test(r.url())) requests.push(r.url());
  });
  await page.goto("?warriorDeath=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(requests).toEqual([]);
});
