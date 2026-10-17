import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page, url = "./?skills=1") {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSkills?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-world").focus();
}
async function pad(page: Page, id: string) {
  await page.addInitScript((id) => {
    const state = {
      index: 0,
      id,
      mapping: "standard",
      connected: true,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({
        pressed: false,
        value: 0,
        touched: false,
      })),
      timestamp: 0,
    };
    Object.defineProperty(window, "skillPad", { value: state });
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [state],
      configurable: true,
    });
  }, id);
}
async function button(page: Page, index: number, held: boolean) {
  await page.evaluate(
    ({ index, held }) => {
      const p = (
        window as unknown as {
          skillPad: {
            buttons: { pressed: boolean; value: number; touched: boolean }[];
          };
        }
      ).skillPad;
      p.buttons[index] = { pressed: held, value: Number(held), touched: held };
    },
    { index, held },
  );
}
test("mouse-selected fire bolt travels, hits and spends mana once", async ({
  page,
}) => {
  await ready(page);
  const view = await page.evaluate(() => window.hollowbaneCombat!);
  const a = view.actors.find((a) => a.id === 1)!,
    v = view.view;
  const rect = await page.locator("canvas").boundingBox();
  if (!rect) throw Error("canvas absent");
  const x = rect.x + ((a.x - v.x) / v.width) * rect.width,
    y = rect.y + ((a.y - 28 - v.y) / v.height) * rect.height;
  await page.mouse.move(x, y);
  await page.mouse.click(x, y, { button: "right" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.hollowbaneSkills!.events.filter((e) => e.kind === "start")
            .length,
      ),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some(
          (e) => e.kind === "damage" && e.result.type === "fire",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSkills!.users[0]!.mana))
    .toBeLessThan(100);
});
test("keyboard activates nova, chain and buff with timing and status feedback", async ({
  page,
}) => {
  await ready(page);
  await page.keyboard.press("q");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.skill === "rime-ring" && e.kind === "effect",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.statuses.some((s) => s.kind === "slow"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  await page.keyboard.press("t");
  await page.keyboard.press("1");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.skill === "storm-thread" && e.kind === "effect",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  await page.keyboard.press("3");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.statuses.some(
          (s) => s.kind === "power" && s.actor === 0,
        ),
      ),
    )
    .toBe(true);
});
for (const id of [
  "Xbox standard virtual",
  "Wireless Controller PlayStation virtual",
])
  test(`${id}: primary press safety, independent aim and selection`, async ({
    page,
  }) => {
    await pad(page, id);
    await ready(page);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(true);
    await page.evaluate(() => {
      (window as unknown as { skillPad: { axes: number[] } }).skillPad.axes = [
        0, 0, 1, 0,
      ];
    });
    await button(page, 2, true);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.hollowbaneSkills!.events.filter((e) => e.kind === "start")
              .length,
        ),
      )
      .toBe(1);
    const tick = await page.evaluate(() => window.hollowbaneSkills!.tick);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneSkills!.tick))
      .toBeGreaterThan(tick + 40);
    expect(
      await page.evaluate(
        () =>
          window.hollowbaneSkills!.events.filter((e) => e.kind === "start")
            .length,
      ),
    ).toBe(1);
    await button(page, 2, false);
    await button(page, 15, true);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneSkills!.selected))
      .toBe(1);
    await button(page, 15, false);
    await button(page, 0, true);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.hollowbaneSkills!.events.some(
            (e) => e.skill === "rime-ring" && e.kind === "start",
          ),
        ),
      )
      .toBe(true);
    await button(page, 0, false);
    await expect(page.locator("#skill-prompts")).toContainText(
      id.startsWith("Xbox") ? "RB" : "R1",
    );
  });
test("monster caster and support use shared skills in a live encounter", async ({
  page,
}) => {
  await page.goto("./?skills=1&monsters=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await page.locator("#ai-practice").check();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneSkills?.events.some(
            (e) =>
              e.actor !== 0 && e.kind === "effect" && e.skill === "ember-lance",
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneSkills?.events.some(
            (e) =>
              e.actor !== 0 && e.kind === "effect" && e.skill === "oath-echo",
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.hollowbaneAI!.metrics.pathRequests),
  ).toBeLessThanOrEqual(2);
});
test("melee cone and poison strike use selected target after normal movement", async ({
  page,
}) => {
  await ready(page);
  const view = await page.evaluate(() => window.hollowbaneCombat!.view),
    rect = await page.locator("canvas").boundingBox();
  if (!rect) throw Error("canvas absent");
  await page.mouse.click(
    rect.x + ((750 - view.x) / view.width) * rect.width,
    rect.y + ((560 - view.y) / view.height) * rect.height,
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(window.hollowbaneCombat!.actors[0]!.x - 750),
      ),
    )
    .toBeLessThan(3);
  await page.keyboard.press("t");
  await page.keyboard.press("2");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.skill === "iron-fan" && e.kind === "effect",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  await page.keyboard.press("4");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.statuses.some((s) => s.kind === "poison"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some(
          (e) => e.kind === "damage" && e.result.type === "poison",
        ),
      ),
    )
    .toBe(true);
});
test("durable measurement fixture is explicit and holds target HP independently of normal play", async ({
  page,
}) => {
  await ready(page, "./?skills=1&durable=1");
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[1]!.maxHp),
  ).toBe(100000);
  await expect(page.locator(".arena-header p")).toContainText("DURABLE");
});
test("skills retain their visual reference", async ({ page }) => {
  await ready(page);
  await page.locator("#combat-pause").click();
  await expect(page.locator(".skill-bar")).toBeVisible();
  await expect(page).toHaveScreenshot("skills.png", {
    maxDiffPixelRatio: 0.02,
    mask: [
      page.locator("#combat-diagnostics"),
      page.locator("#skill-resource"),
    ],
  });
});
