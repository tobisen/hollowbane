import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?metrics=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  // Assets are ready before the first camera pre-render; wait for a displayed view.
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneDiagnostics?.samples ?? 0))
    .toBeGreaterThanOrEqual(2);
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
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.routeLength))
    .toBeGreaterThan(0);
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

test("rapid retargeting arrives exactly and the camera settles without oscillation", async ({
  page,
}) => {
  await ready(page);
  let p = await point(page, 1000, 520);
  await page.mouse.click(p.x, p.y);
  p = await point(page, 660, 460);
  await page.mouse.click(p.x, p.y);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbanePrototype!.destination?.x ?? Infinity,
      ),
    )
    .toBeLessThan(700);
  const accepted = await page.evaluate(
    () => window.hollowbanePrototype!.destination!,
  );
  expect(accepted.x).toBeLessThan(700);
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ x, y }) =>
            Math.hypot(
              window.hollowbanePrototype!.x - x,
              window.hollowbanePrototype!.y - y,
            ),
          accepted,
        ),
      { timeout: 10000 },
    )
    .toBeLessThan(0.001);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.motion))
    .toBe("idle");
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s = window.hollowbanePrototype!,
            v = s.view;
          return Math.max(
            Math.abs(
              v.x - Math.max(0, Math.min(1536 - v.width, s.x - v.width / 2)),
            ),
            Math.abs(
              v.y - Math.max(0, Math.min(1024 - v.height, s.y - v.height / 2)),
            ),
          );
        }),
      { timeout: 10000 },
    )
    .toBeLessThan(0.05);
  const final = await page.evaluate(() => window.hollowbanePrototype!);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.tick))
    .toBeGreaterThan(final.tick + 15);
  const later = await page.evaluate(() => window.hollowbanePrototype!);
  expect(later.x).toBe(final.x);
  expect(later.y).toBe(final.y);
  expect(Math.abs(later.view.x - final.view.x)).toBeLessThan(0.05);
  expect(Math.abs(later.view.y - final.view.y)).toBeLessThan(0.05);
});

test("configured maximum running speed keeps wall and object collision intact", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await page.getByLabel("Run speed", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Save controls" }).click();
  await page.keyboard.press("r");
  await page.keyboard.down("d");
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.speed))
    .toBe(12);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.x), {
      timeout: 10000,
    })
    .toBeGreaterThan(1000);
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePrototype!.motion), {
      timeout: 10000,
    })
    .toBe("idle");
  await page.keyboard.up("d");
  const stopped = await page.evaluate(() => window.hollowbanePrototype!);
  expect(stopped.x).toBeLessThan(1170);
  expect(stopped.x).toBeGreaterThan(1000);
  expect(Number.isFinite(stopped.x)).toBe(true);
  const blocked = await point(page, 1020, 480);
  await page.mouse.click(blocked.x, blocked.y);
  await expect(page.locator("#world-status")).toContainText("block");
  expect(
    await page.evaluate(() => window.hollowbanePrototype!.routeLength),
  ).toBe(0);
});
