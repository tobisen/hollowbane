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
