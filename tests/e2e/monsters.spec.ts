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

for (const id of ["Xbox Wireless Controller", "Wireless Controller"]) {
  test(`${id} navigates encounters with independent analog aim and timed attacks`, async ({
    page,
  }) => {
    await page.addInitScript((id) => {
      const pad = {
        index: 0,
        id,
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        timestamp: 0,
      };
      Object.assign(window, { monsterTestPad: pad });
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [pad],
        configurable: true,
      });
    }, id);
    await ready(page, "./?monsters=1&count=10");
    await page.locator("#ai-practice").check();
    await page.locator("#combat-world").focus();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(true);
    await page.evaluate(() => {
      (
        window as unknown as { monsterTestPad: { axes: number[] } }
      ).monsterTestPad.axes = [0.6, 0, 0, -1];
    });
    const x = await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x))
      .toBeGreaterThan(x + 5);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneCombat!.actors[0]!.direction),
      )
      .toBe(4);
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          monsterTestPad: {
            axes: number[];
            buttons: { pressed: boolean; value: number }[];
          };
        }
      ).monsterTestPad;
      p.axes = [0, 0, 0, -1];
      p.buttons[2] = { pressed: true, value: 1 };
    });
    await expect
      .poll(
        () => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.sequence),
        { timeout: 12000 },
      )
      .toBeGreaterThan(0);
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          monsterTestPad: { buttons: { pressed: boolean; value: number }[] };
        }
      ).monsterTestPad;
      p.buttons[2] = { pressed: false, value: 0 };
    });
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          monsterTestPad: { buttons: { pressed: boolean; value: number }[] };
        }
      ).monsterTestPad;
      p.buttons[9] = { pressed: true, value: 1 };
    });
    await expect(page.locator("#controller-menu")).toBeVisible();
    expect(await page.locator("#controller-prompts").textContent()).toContain(
      id.startsWith("Xbox") ? "A" : "Cross",
    );
  });
}
test("keyboard and mouse retain targeting and queued movement commitment in encounters", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#ai-practice").check();
  await page.locator("#combat-weapon").selectOption("projectile");
  await page.locator("#combat-world").focus();
  await page.keyboard.press("x");
  await expect
    .poll(
      () => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.sequence),
      { timeout: 12000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.actor === 0 && e.kind === "launch",
          ),
        ),
      { timeout: 10000 },
    )
    .toBe(true);
  await page.keyboard.down("a");
  await expect
    .poll(
      () => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.walking),
      { timeout: 5000 },
    )
    .toBe(true);
  await page.keyboard.up("a");
  const data = await page.evaluate(() => {
    const s = window.hollowbaneCombat!,
      a = s.actors.find((a) => a.id !== 0 && a.hp > 0)!;
    return { a, view: s.view };
  });
  const rect = await page.locator("#combat-world canvas").boundingBox();
  await page.mouse.click(
    rect!.x + ((data.a.x - data.view.x) / data.view.width) * rect!.width,
    rect!.y + ((data.a.y - 28 - data.view.y) / data.view.height) * rect!.height,
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(data.a.id);
});
