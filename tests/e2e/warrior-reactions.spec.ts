import { expect, test } from "@playwright/test";

for (const direction of ["n", "ne", "e", "se", "s", "sw", "w", "nw"])
  test(`${direction.toUpperCase()} real hit interrupts attacks/abilities and guarded hits do not restart recovery`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const ability of [false, true]) {
      await page.goto(
        `?developer=1&warriorPilot=1&warriorCombat=1&warriorReactions=1${ability ? "&warriorAbilities=1" : ""}`,
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
      const hp = await page.evaluate(
        () => window.hollowbaneWarriorCombat!.sample.playerHp,
      );
      await page.locator("#hit-receive").click();
      for (let tick = 2; tick <= 13; tick++) {
        if (tick === 3) await page.locator("#hit-small").click();
        await page.locator("#attack-step").click();
        await expect
          .poll(() =>
            page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
          )
          .toBe(tick);
        const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
        expect(o.cameraRelative).toEqual({ x: 480, y: 190 });
        expect(o.sample.playerHp).toBeLessThan(hp);
        expect(o.sample.hp).toBe(160);
        expect(o.sample.effects).toBe(0);
        expect(o.history.filter((h) => h.strike)).toHaveLength(0);
        if (tick < 13) {
          expect(o.sample.phase).toBe("hitstun");
          expect(o.sample.remaining).toBe(13 - tick);
          expect(o.sample.frame).toBeNull();
          if (tick === 2) expect(o.sample.hitFrame).toBe(0);
          if (tick === 2) expect(o.sample.shippedRecoil).toBeGreaterThan(0);
          if (tick === 12) expect(o.sample.hitFrame).toBe(5);
        } else
          expect(o.sample).toMatchObject({ phase: "idle", hitFrame: null });
        if (tick === 3)
          await page.screenshot({
            path: info.outputPath(
              `${ability ? "ability" : "attack"}-interrupted.png`,
            ),
            fullPage: true,
          });
      }
      expect(
        await page.evaluate(async () => ({
          keys: Object.keys(localStorage),
          db: await indexedDB.databases(),
        })),
      ).toEqual({ keys: [], db: [] });
    }
    expect(errors).toEqual([]);
  });

test("normal entry excludes reaction preview textures", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/warrior-reactions/.test(r.url())) requests.push(r.url());
  });
  await page.goto("?warriorReactions=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(requests).toEqual([]);
});
