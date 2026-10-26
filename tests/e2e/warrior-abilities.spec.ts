import { expect, test } from "@playwright/test";
const route = "?developer=1&warriorPilot=1&warriorCombat=1&warriorAbilities=1";

for (const [direction, facing] of [
  ["s", 0],
  ["sw", 1],
  ["w", 2],
  ["nw", 3],
  ["n", 4],
  ["ne", 5],
  ["e", 6],
  ["se", 7],
] as const)
  test(`${direction.toUpperCase()} abilities release once on actual activation with stable roots and resources`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute(
      "data-warrior-combat-ready",
      "true",
    );
    await page.locator("#attack-pause").click();
    await page.locator("#attack-direction").selectOption(direction);
    for (const [skill, windup, end, impact, mana] of [
      ["iron-fan", 12, 31, 5, 93],
      ["oath-echo", 10, 27, 17, 86],
    ] as const) {
      await page.locator("#attack-clip").selectOption(skill);
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
        )
        .toBe(0);
      await page.locator("#attack-start").click();
      for (let tick = 1; tick <= end; tick++) {
        await page.locator("#attack-step").click();
        await expect
          .poll(() =>
            page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
          )
          .toBe(tick);
        const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
        expect(o.direction).toBe(facing);
        expect(o.cameraRelative).toEqual({ x: 480, y: 190 });
        if (tick === 1) expect(o.sample.mana).toBeCloseTo(mana, 0);
        if (tick < windup) {
          expect(o.sample.phase).toBe("windup");
          expect(o.sample.effects).toBe(0);
          expect(o.sample.hp).toBe(160);
        }
        if (tick === windup) {
          expect(o.sample).toMatchObject({
            phase: "active",
            frame: impact,
            strike: true,
            sequence: 1,
            ability: skill,
            effects: 1,
          });
          if (skill === "iron-fan") expect(o.sample.hp).toBeLessThan(160);
          else expect(o.sample.hp).toBe(160);
          await page.screenshot({
            path: info.outputPath(`${skill}-activation.png`),
            fullPage: true,
          });
        }
        if (tick === end) {
          expect(o.sample).toMatchObject({
            phase: "idle",
            frame: null,
            sequence: 1,
            effects: 1,
          });
          expect(o.history.filter((h) => h.strike)).toHaveLength(1);
          // Oath still cools down; Sundering's cooldown has elapsed during recovery.
          await page.locator("#attack-start").click();
          await page.locator("#attack-step").click();
          await expect
            .poll(() =>
              page.evaluate(() => window.hollowbaneWarriorCombat!.sample),
            )
            .toMatchObject({
              sequence: skill === "iron-fan" ? 2 : 1,
              effects: 1,
            });
        }
      }
    }
    await page.locator("#attack-background").selectOption("light");
    await page.screenshot({
      path: info.outputPath("light-idle.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(async () => ({
        keys: Object.keys(localStorage),
        db: await indexedDB.databases(),
      })),
    ).toEqual({ keys: [], db: [] });
    expect(errors).toEqual([]);
  });

test("normal entry excludes ability preview and textures", async ({ page }) => {
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/warrior-abilities/.test(r.url())) fetched.push(r.url());
  });
  await page.goto("?warriorAbilities=1&warriorCombat=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(fetched).toEqual([]);
});
