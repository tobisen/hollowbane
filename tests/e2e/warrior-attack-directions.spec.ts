import { expect, test } from "@playwright/test";
const route =
  "?developer=1&warriorPilot=1&warriorCombat=1&warriorAttackDirections=1";

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
  test(`${direction.toUpperCase()} real attacks retain impact, one strike, facing and stable recovery`, async ({
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
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorCombat!.direction),
      )
      .toBe(facing);
    for (const [clip, impact] of [
      ["primary", 5],
      ["secondary", 17],
    ] as const) {
      await page.locator("#attack-clip").selectOption(clip);
      await expect
        .poll(() =>
          page.evaluate(() => ({
            attack: window.hollowbaneWarriorCombat!.attack,
            tick: window.hollowbaneWarriorCombat!.sample.tick,
          })),
        )
        .toEqual({ attack: clip, tick: 0 });
      const idle = await page
        .locator("#cadence-inspector")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL());
      await page.locator("#attack-start").click();
      for (let tick = 1; tick <= 32; tick++) {
        await page.locator("#attack-step").click();
        await expect
          .poll(() =>
            page.evaluate(() => window.hollowbaneWarriorCombat!.sample.tick),
          )
          .toBe(tick);
        const o = await page.evaluate(() => window.hollowbaneWarriorCombat!);
        expect(o.direction).toBe(facing);
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
          await page.screenshot({
            path: info.outputPath(`${clip}-impact.png`),
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
          // Both return endpoints use the exact same approved idle image/root.
          await page.locator("#attack-reset").click();
          await expect
            .poll(() =>
              page
                .locator("#cadence-inspector")
                .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
            )
            .toBe(idle);
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

test("normal entry excludes eight-direction attack code and textures", async ({
  page,
}) => {
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/warrior-attack-directions/.test(r.url())) fetched.push(r.url());
  });
  await page.goto("?warriorCombat=1&warriorAttackDirections=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(fetched).toEqual([]);
});
