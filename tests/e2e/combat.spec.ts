import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("./?combat=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
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
async function target(page: Page, id: number) {
  const a = await page.evaluate(
    (id) => window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
    id,
  );
  return point(page, a.x, a.y - 28);
}
test("arena is inspectable and preserves its visual reference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.locator("#combat-pause").click();
  await page.locator("#combat-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
    .toBe(0);
  await expect(page.locator("main")).toHaveScreenshot("ashwood-arena.png", {
    mask: [page.locator("#combat-diagnostics")],
    maxDiffPixelRatio: 0.01,
  });
  expect(errors).toEqual([]);
});
test("melee approaches and respects windup, recovery, held attacks and death", async ({
  page,
}) => {
  await ready(page);
  const p = await target(page, 1);
  await page.mouse.move(p.x, p.y);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.hovered))
    .toBe(1);
  await page.mouse.down();
  await page.waitForFunction(
    () => window.hollowbaneCombat!.actors[0]!.phase === "windup",
  );
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp),
  ).toBe(160);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 12000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBeNull();
  const state = await page.evaluate(() => window.hollowbaneCombat!);
  expect(state.actors[1]!.phase).toBe("dead");
  expect(state.events.some((e) => e.kind === "death")).toBe(true);
  expect(state.metrics.attackSamples).toBeGreaterThan(0);
});
test("projectiles launch before impact and moving targets remain selectable", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#combat-weapon").selectOption("projectile");
  const p = await target(page, 1);
  await page.mouse.click(p.x, p.y);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some((e) => e.kind === "launch"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some((e) => e.kind === "impact"),
      ),
    )
    .toBe(true);
  const events = await page.evaluate(() => window.hollowbaneCombat!.events);
  expect(events.find((e) => e.kind === "impact")!.tick).toBeGreaterThan(
    events.find((e) => e.kind === "launch")!.tick,
  );
  const moving = await target(page, 2);
  await page.mouse.click(moving.x, moving.y);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(2);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.sequence),
    )
    .toBeGreaterThan(1);
});
test("ground movement waits for recovery and breakpoints are observable", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#combat-weapon").selectOption("projectile");
  await page.locator("#combat-speed").selectOption("90");
  const p = await target(page, 1);
  await page.mouse.click(p.x, p.y);
  await page.waitForFunction(
    () => window.hollowbaneCombat!.actors[0]!.phase === "windup",
  );
  const before = await page.evaluate(() => window.hollowbaneCombat!.actors[0]!);
  expect(before.windup).toBe(6);
  const ground = await point(page, 550, 630);
  await page.mouse.click(ground.x, ground.y);
  const after = await page.evaluate(() => window.hollowbaneCombat!.actors[0]!);
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.walking),
    )
    .toBe(true);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("Space");
  const stopped = await page.evaluate(
    () => window.hollowbaneCombat!.actors[0]!.x,
  );
  await page.keyboard.down("d");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x))
    .toBeGreaterThan(stopped + 5);
  await page.keyboard.up("d");
});
test("hostile attacks cause hit recovery and player death remains terminal", async ({
  page,
}) => {
  test.setTimeout(60000);
  await ready(page);
  await page.locator("#combat-hostile").check();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.kind === "damage" && e.target === 0,
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp), {
      timeout: 45000,
    })
    .toBe(0);
  const p = await target(page, 1);
  await page.mouse.click(p.x, p.y);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase),
  ).toBe("dead");
  await page.locator("#combat-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp))
    .toBe(300);
});
