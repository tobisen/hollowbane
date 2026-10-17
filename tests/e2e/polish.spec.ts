import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("./?polish=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator(".arena-panel summary").click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
  await page.locator("#combat-world").focus();
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
test("polish motion follows deterministic strike and death without moving colliders", async ({
  page,
}) => {
  await ready(page);
  const a = await page.evaluate(() => window.hollowbaneCombat!.actors[1]!);
  const p = await point(page, a.x, a.y - 28);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            window.hollowbanePolish!.poses.find((p) => p.id === 0)?.strikeAt,
        ),
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 18000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbanePolish!.poses.find((p) => p.id === 1)?.pose.fall,
      ),
    )
    .toBe(1);
  const after = await page.evaluate(() => window.hollowbaneCombat!.actors[1]!);
  expect(after.x).toBe(a.x);
  expect(after.y).toBe(a.y);
  expect(
    await page.evaluate(
      () => window.hollowbanePolish!.poses.find((p) => p.id === 1)!.pose.alpha,
    ),
  ).toBeCloseTo(0.45);
  await page.screenshot({ path: ".local/polish-motion.png" });
});

test("showcase executes all six real skills with bounded distinct visuals", async ({
  page,
}) => {
  await page.goto("./?polish=1&showcase=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            new Set(
              window
                .hollowbaneSkills!.events.filter(
                  (e) => e.actor === 0 && e.kind === "effect",
                )
                .map((e) => e.skill),
            ).size,
        ),
      { timeout: 23000 },
    )
    .toBe(6);
  const visuals = await page.evaluate(() => window.hollowbanePolish!.visuals!);
  expect(visuals.events).toBeLessThanOrEqual(48);
  expect(visuals.bolts).toBeLessThanOrEqual(96);
  expect(visuals.statuses).toBeLessThanOrEqual(64);
  await page.screenshot({ path: ".local/polish-skills.png" });
});

test("resource HUD exposes values, costs and cooldowns without losing keyboard focus", async ({
  page,
}) => {
  await ready(page);
  await expect(
    page.getByRole("meter", { name: "Health", exact: true }),
  ).toHaveAttribute("aria-valuenow", "300");
  await expect(
    page.getByRole("meter", { name: "Mana", exact: true }),
  ).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("q");
  await expect
    .poll(() =>
      page
        .getByRole("meter", { name: "Mana", exact: true })
        .getAttribute("aria-valuenow"),
    )
    .not.toBe("100");
  await expect(page.locator('[data-skill="1"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator('[data-skill="1"] .slot-meta')).toContainText(
    "18 MP",
  );
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.screenshot({ path: ".local/polish-hud.png" });
});
for (const id of ["Xbox standard virtual", "Wireless Controller"])
  test(`${id} preserves independent movement and skill prompts in polish HUD`, async ({
    page,
  }) => {
    await page.addInitScript((id) => {
      const pad = {
        id,
        index: 0,
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
      Object.defineProperty(window, "polishPad", { value: pad });
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => [pad],
      });
    }, id);
    await ready(page);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(true);
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          polishPad: {
            axes: number[];
            buttons: { pressed: boolean; touched: boolean; value: number }[];
          };
        }
      ).polishPad;
      p.axes = [0, 0, 0, -0.8];
      p.buttons[3] = { pressed: true, touched: true, value: 1 };
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.hollowbaneSkills!.events.filter(
              (e) => e.actor === 0 && e.kind === "start",
            ).length,
        ),
      )
      .toBe(1);
    await expect(page.locator('[data-skill="2"] .slot-key')).toHaveText(
      id.startsWith("Xbox") ? "RB" : "R1",
    );
    const x = await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x);
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          polishPad: {
            axes: number[];
            buttons: { pressed: boolean; touched: boolean; value: number }[];
          };
        }
      ).polishPad;
      p.buttons[3] = { pressed: false, touched: false, value: 0 };
      p.axes = [0.7, 0, 0, -0.8];
    });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x))
      .toBeGreaterThan(x + 3);
    expect(
      await page.evaluate(() => window.hollowbaneInput!.aim.y),
    ).toBeLessThan(0);
  });

test("original audio unlocks on gesture, plays spells and mutes immediately", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#polish-audio").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish!.audio.state))
    .toBe("running");
  await page.locator("#combat-world").focus();
  await page.keyboard.press("q");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish!.audio.played))
    .toBeGreaterThan(0);
  await page.locator("#polish-audio").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish!.audio.state))
    .toBe("muted");
  expect(await page.evaluate(() => window.hollowbanePolish!.audio.active)).toBe(
    0,
  );
  const played = await page.evaluate(
    () => window.hollowbanePolish!.audio.played,
  );
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  await page.keyboard.press("x");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.skill === "ember-lance" && e.kind === "effect",
        ),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => window.hollowbanePolish!.audio.played)).toBe(
    played,
  );
});
test("missing Web Audio keeps spells and muted gameplay usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.locator("#polish-audio").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish!.audio.state))
    .toBe("unavailable");
  await page.locator("#combat-world").focus();
  await page.keyboard.press("q");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some((e) => e.kind === "effect"),
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test("polish world and HUD retain their visual reference", async ({ page }) => {
  await ready(page);
  await page.locator("#combat-pause").click();
  await page.locator("#combat-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
    .toBe(0);
  await page.locator(".arena-panel summary").click();
  await expect(page.locator("#polish-health")).toHaveAttribute(
    "aria-valuenow",
    "300",
  );
  await expect(page).toHaveScreenshot("sable-court.png", {
    maxDiffPixelRatio: 0.01,
    mask: [
      page.locator(".arena-header"),
      page.locator(".arena-panel"),
      page.locator(
        ".slot-name,.slot-meta,.slot-key,.vital-label,#polish-target,#skill-resource,#skill-prompts,#skill-status,#combat-log",
      ),
    ],
  });
  await page.screenshot({ path: ".local/polish-review.png" });
});

test("lower walkable ground remains visible and clickable above HUD after resize", async ({
  page,
}) => {
  await ready(page);
  const hud = await page.locator(".skill-bar").boundingBox();
  const p = await point(page, 1250, 790);
  expect(p.y).toBeLessThan(hud!.y - 16);
  await page.mouse.click(p.x, p.y);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.abs(window.hollowbaneCombat!.actors[0]!.x - 1250),
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(3);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(window.hollowbaneCombat!.actors[0]!.y - 790),
      ),
    )
    .toBeLessThan(3);
  const width = await page.evaluate(() => window.hollowbaneCombat!.view.width);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.view.width))
    .not.toBe(width);
  const q = await point(page, 1250, 790),
    newHud = await page.locator(".skill-bar").boundingBox();
  expect(q.y).toBeLessThan(newHud!.y - 16);
  expect(q.x).toBeLessThan(1024);
});
