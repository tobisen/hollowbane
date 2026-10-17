import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?metrics=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  await expect(page.locator("#world-metrics")).toContainText("PHASER 4.2.1");
}
async function clickGround(page: Page, x: number, y: number) {
  const screen = await page.evaluate(
    ({ x, y }) => {
      const v = window.hollowbanePrototype!.view;
      return {
        x: ((x - v.x) * innerWidth) / v.width,
        y: ((y - v.y) * innerHeight) / v.height,
      };
    },
    { x, y },
  );
  await page.locator("#world").click({ position: screen });
}
test("detailed cloister renders without errors and preserves its visual reference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const failed: string[] = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  await ready(page);
  await expect(page.locator("#world canvas")).toBeVisible();
  await expect(page.locator("main")).toHaveScreenshot("veiled-cloister.png", {
    mask: [page.locator("#world-metrics")],
    maxDiffPixelRatio: 0.01,
  });
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(
    await page.evaluate(() => window.hollowbaneDiagnostics?.renderer),
  ).toBe("WebGL");
});
test("click routes, retargeting, keyboard directions, collision and zoom work", async ({
  page,
}) => {
  await ready(page);
  await clickGround(page, 900, 510);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype?.walking))
    .toBe(true);
  await clickGround(page, 700, 450);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const goal = window.hollowbanePrototype!.destination;
        return goal ? Math.hypot(goal.x - 700, goal.y - 450) : Infinity;
      }),
    )
    .toBeLessThan(12);
  const selected = await page.evaluate(
    () => window.hollowbanePrototype!.destination!,
  );
  // Camera tracking continues between coordinate sampling and the physical click.
  expect(Math.hypot(selected.x - 700, selected.y - 450)).toBeLessThan(12);
  await expect
    .poll(
      () =>
        page.evaluate(
          (target) =>
            Math.hypot(
              window.hollowbanePrototype!.x - target.x,
              window.hollowbanePrototype!.y - target.y,
            ),
          selected,
        ),
      { timeout: 10000 },
    )
    .toBeLessThan(0.5);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype?.walking))
    .toBe(false);
  const directions = [
    ["s", 0],
    ["a+s", 1],
    ["a", 2],
    ["a+w", 3],
    ["w", 4],
    ["w+d", 5],
    ["d", 6],
    ["d+s", 7],
  ] as const;
  for (const [keys, direction] of directions) {
    await page.locator("#world").focus();
    for (const key of keys.split("+")) await page.keyboard.down(key);
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype?.direction))
      .toBe(direction);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          direction: Math.floor(window.hollowbanePrototype!.frame / 8),
          walking: window.hollowbanePrototype!.walking,
        })),
      )
      .toEqual({ direction, walking: true });
    for (const key of keys.split("+")) await page.keyboard.up(key);
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
      .toBe(false);
  }
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.zoom))
    .toBeGreaterThan(1.2);
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.zoom))
    .toBeLessThan(1.18);
  await page.getByRole("button", { name: "Return to gate" }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.x))
    .toBe(780);
  // Projection uses the current camera. Reset eases zoom, so wait for a stable view
  // before testing a precise blocked point rather than clicking through a moving camera.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let previous = window.hollowbanePrototype!.view,
          stable = 0;
        const check = () => {
          const view = window.hollowbanePrototype!.view;
          stable =
            Math.max(
              Math.abs(view.x - previous.x),
              Math.abs(view.y - previous.y),
              Math.abs(view.width - previous.width),
              Math.abs(view.height - previous.height),
            ) < 0.01
              ? stable + 1
              : 0;
          previous = view;
          if (stable >= 4) resolve();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }),
  );
  await clickGround(page, 500, 300);
  await expect(page.locator("#world-status")).toHaveText(
    "The ruins block that path",
  );
  await expect(page.locator("#world")).toHaveCSS("cursor", "default");
  expect(
    await page.evaluate(() => window.hollowbanePrototype!.routeLength),
  ).toBe(0);
  await page.getByRole("button", { name: "Wake the mist" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbanePrototype!.decorationPaused),
    )
    .toBe(false);
  await page.getByRole("button", { name: "Still the mist" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbanePrototype!.decorationPaused),
    )
    .toBe(true);
});
test("player sorts behind and in front of a tall prop with readable occlusion", async ({
  page,
}) => {
  await ready(page);
  await clickGround(page, 1020, 440);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.hypot(
            window.hollowbanePrototype!.x - 1020,
            window.hollowbanePrototype!.y - 440,
          ),
        ),
      { timeout: 15000 },
    )
    .toBeLessThan(3);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.occluded))
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(false);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const state = window.hollowbanePrototype!,
            v = state.view;
          const left = Math.max(
            0,
            Math.min(1536 - v.width, state.x - v.width / 2),
          );
          const top = Math.max(
            0,
            Math.min(1024 - v.height, state.y - v.height / 2),
          );
          return Math.max(Math.abs(v.x - left), Math.abs(v.y - top));
        }),
      { timeout: 10000 },
    )
    .toBeLessThan(0.05);
  await expect(page.locator("main")).toHaveScreenshot("behind-cenotaph.png", {
    timeout: 15000,
    mask: [page.locator("#world-metrics")],
    maxDiffPixelRatio: 0.01,
  });
  await clickGround(page, 1020, 525);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.hypot(
            window.hollowbanePrototype!.x - 1020,
            window.hollowbanePrototype!.y - 525,
          ),
        ),
      { timeout: 15000 },
    )
    .toBeLessThan(3);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.occluded))
    .toBe(0);
});

test("wide viewport zoom remains inside the world and focus loss clears traversal", async ({
  page,
}) => {
  await ready(page);
  await page.setViewportSize({ width: 1920, height: 800 });
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.view.width))
    .toBeLessThan(1537);
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.zoom))
    .toBeGreaterThanOrEqual(1.25);
  await clickGround(page, 900, 510);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.routeLength))
    .toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(false);
});

test("detail mode preserves world composition and input alignment", async ({
  page,
}) => {
  await ready(page);
  const before = await page.evaluate(
    () => window.hollowbanePrototype!.view.width,
  );
  await page.getByRole("button", { name: "Full detail", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.balancedDetail))
    .toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.renderWidth))
    .toBe(1280);
  await expect
    .poll(() =>
      page.evaluate(
        (width) => Math.abs(window.hollowbanePrototype!.view.width - width),
        before,
      ),
    )
    .toBeLessThan(2);
  await page
    .getByRole("button", { name: "Balanced detail", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.renderWidth))
    .toBe(960);
  await clickGround(page, 850, 510);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
});
