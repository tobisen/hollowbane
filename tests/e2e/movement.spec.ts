import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?metrics=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
}
async function point(page: Page, x: number, y: number) {
  return page.evaluate(
    ({ x, y }) => {
      const r = document.querySelector("canvas")!.getBoundingClientRect(),
        v = window.hollowbanePrototype!.view;
      return {
        x: r.x + ((x - v.x) / v.width) * r.width,
        y: r.y + ((y - v.y) / v.height) * r.height,
      };
    },
    { x, y },
  );
}
test("run responds immediately, stop interrupts held movement and right click only faces", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#world").focus();
  await page.keyboard.press("r");
  await page.keyboard.down("d");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.speed))
    .toBe(5.4);
  await page.keyboard.press("Space");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.motion))
    .toBe("idle");
  const stopped = await page.evaluate(() => window.hollowbanePrototype!);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.tick))
    .toBeGreaterThan(stopped.tick + 4);
  expect(await page.evaluate(() => window.hollowbanePrototype!.x)).toBe(
    stopped.x,
  );
  await page.keyboard.up("d");
  const target = await point(page, 600, 500);
  await page.mouse.click(target.x, target.y, { button: "right" });
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.direction))
    .toBe(2);
  expect(
    await page.evaluate(() => window.hollowbanePrototype!.routeLength),
  ).toBe(0);
});
test("movement keys and speed settings persist and invalid duplicate bindings are rejected", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await page.getByLabel("Move right key", { exact: true }).press("w");
  await page.getByRole("button", { name: "Save controls" }).click();
  await expect(page.locator("#movement-error")).toContainText("Duplicate");
  await page.getByLabel("Move right key", { exact: true }).press("j");
  await page.getByLabel("Walk speed", { exact: true }).fill("2");
  await page.getByLabel("Run speed", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Save controls" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  await page.locator("#world").focus();
  await page.keyboard.down("j");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.speed))
    .toBe(2);
  await page.keyboard.up("j");
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await expect(page.getByLabel("Move right key", { exact: true })).toHaveValue(
    "KeyJ",
  );
  await expect(page.getByLabel("Run speed", { exact: true })).toHaveValue("6");
});
test("explicit queueing, stop, held steering and blur do not replay stale movement", async ({
  page,
}) => {
  await ready(page);
  let p = await point(page, 1000, 520);
  await page.mouse.click(p.x, p.y);
  await page.keyboard.down("Shift");
  p = await point(page, 740, 470);
  await page.mouse.click(p.x, p.y);
  await page.keyboard.up("Shift");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.queuedMoves))
    .toBe(1);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.queuedMoves))
    .toBe(0);
  p = await point(page, 900, 510);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.walking))
    .toBe(true);
  p = await point(page, 650, 450);
  await page.mouse.move(p.x, p.y);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbanePrototype!.destination?.x ?? Infinity,
      ),
    )
    .toBeLessThan(700);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.motion))
    .toBe("idle");
  expect(
    await page.evaluate(() => window.hollowbanePrototype!.routeLength),
  ).toBe(0);
});
