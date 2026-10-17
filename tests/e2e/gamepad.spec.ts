import { expect, test, type Page } from "@playwright/test";
interface VirtualPad {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  axes: number[];
  buttons: { pressed: boolean; touched: boolean; value: number }[];
  timestamp: number;
}
declare global {
  interface Window {
    virtualPads: VirtualPad[];
  }
}
async function ready(page: Page, url = "./") {
  await page.addInitScript(() => {
    window.virtualPads = [
      {
        index: 0,
        id: "Xbox virtual standard",
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        timestamp: 0,
      },
    ];
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => window.virtualPads,
    });
  });
  await page.goto(url);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  if (url === "./")
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype?.tick ?? 0))
      .toBeGreaterThan(2);
}
async function axes(page: Page, values: number[]) {
  return page.evaluate((values) => {
    window.virtualPads[0]!.axes = values;
    window.virtualPads[0]!.timestamp = performance.now();
    return performance.now();
  }, values);
}
async function button(page: Page, index: number, held: boolean) {
  await page.evaluate(
    ({ index, held }) => {
      window.virtualPads[0]!.buttons[index] = {
        pressed: held,
        touched: held,
        value: Number(held),
      };
    },
    { index, held },
  );
}
test("analog movement scales speed, releases safely and preserves click destinations", async ({
  page,
}) => {
  await ready(page);
  const before = await page.evaluate(() => window.hollowbanePrototype!);
  await axes(page, [0.55, 0, 0, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  const low = await page.evaluate(() => window.hollowbanePrototype!.speed);
  expect(low).toBeGreaterThan(0);
  expect(low).toBeLessThan(3);
  await axes(page, [1, 0, 0, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.speed))
    .toBe(3);
  await axes(page, [0, 0, 0, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(false);
  expect(
    await page.evaluate(() => window.hollowbanePrototype!.x),
  ).toBeGreaterThan(before.x);
  const p = await page.evaluate(() => {
    const v = window.hollowbanePrototype!.view,
      r = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: r.x + ((820 - v.x) / v.width) * r.width,
      y: r.y + ((520 - v.y) / v.height) * r.height,
    };
  });
  await page.mouse.click(p.x, p.y);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  expect(await page.evaluate(() => window.hollowbaneInput!.device)).toBe(
    "mouse",
  );
});
test("disconnection stops active analog movement", async ({ page }) => {
  await ready(page);
  await axes(page, [1, 0, 0, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  await page.evaluate(() => {
    window.virtualPads = [];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(false);
  expect(
    await page.evaluate(() => window.hollowbaneInput!.selected),
  ).toBeNull();
});
// More screen/remapping/safety acceptance scenarios are added with their scoped adapters.
export { ready, axes, button };
test("right stick faces independently and L3 toggles persisted gait", async ({
  page,
}) => {
  await ready(page);
  const before = await page.evaluate(() => window.hollowbanePrototype!);
  await axes(page, [0, 0, 1, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.direction))
    .toBe(6);
  expect(await page.evaluate(() => window.hollowbanePrototype!.x)).toBe(
    before.x,
  );
  await button(page, 10, true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.gait))
    .toBe("run");
  await button(page, 10, false);
  await axes(page, [0, -0.7, 1, 0]);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  expect(await page.evaluate(() => window.hollowbanePrototype!.direction)).toBe(
    6,
  );
});
test("semantic primary drives existing timed combat without new mechanics", async ({
  page,
}) => {
  await ready(page, "./?combat=1");
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-world").focus();
  await axes(page, [0, 0, 0, 0]);
  await button(page, 2, true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("windup");
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp),
  ).toBe(160);
  await button(page, 2, false);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp))
    .toBeLessThan(160);
});
async function tap(page: Page, index: number) {
  let samples = await page.evaluate(() => window.hollowbaneInput!.samples);
  await button(page, index, true);
  await page.waitForFunction(
    (n) => window.hollowbaneInput!.samples > n + 2,
    samples,
  );
  samples = await page.evaluate(() => window.hollowbaneInput!.samples);
  await button(page, index, false);
  await page.waitForFunction(
    (n) => window.hollowbaneInput!.samples > n + 2,
    samples,
  );
}

test("controller pause/menu navigation opens settings and cancel returns safely", async ({
  page,
}) => {
  await ready(page);
  await tap(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  await tap(page, 13);
  await expect(page.locator('a[href="?controller=1"]').first()).toBeFocused();
  await page.screenshot({ path: ".local/controller-menu.png" });
  await button(page, 0, true);
  await expect(page.locator("h1")).toHaveText("Controller settings");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  await button(page, 0, false);
  await tap(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  await tap(page, 1);
  await expect(page.locator("#controller-menu")).not.toBeVisible();
});
test("controller activates existing atelier and both engine screens", async ({
  page,
}) => {
  await ready(page, "./?gallery=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-gallery-ready",
    "true",
  );
  await tap(page, 13);
  await tap(page, 13);
  await expect(page.locator("#gallery-motion")).toBeFocused();
  await tap(page, 0);
  await expect(page.locator("#gallery-motion")).toHaveText("Pause walk cycle");
  for (const engine of ["3", "4"]) {
    await ready(page, `./?engine=${engine}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-engine-ready",
      engine,
    );
    for (
      let i = 0;
      i < 6 &&
      !(await page
        .locator("#pause")
        .evaluate((e) => e === document.activeElement));
      i++
    )
      await tap(page, 13);
    await expect(page.locator("#pause")).toBeFocused();
    await tap(page, 0);
    await expect(page.locator("#pause")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
});
test("prompts switch between PlayStation, generic and keyboard/mouse", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    window.virtualPads[0]!.id = "DualSense 054c virtual";
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput!.family))
    .toBe("playstation");
  await tap(page, 9);
  await expect(page.locator("#controller-prompts")).toContainText(
    "Cross: Choose",
  );
  await tap(page, 1);
  await page.mouse.move(50, 50);
  await expect(page.locator("#controller-open")).toContainText("F2");
  await page.evaluate(() => {
    window.virtualPads[0]!.id = "USB generic virtual";
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput!.family))
    .toBe("generic");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput!.armed))
    .toBe(true);
  await tap(page, 9);
  await expect(page.locator("#controller-prompts")).toContainText(
    "Button 1: Choose",
  );
});
