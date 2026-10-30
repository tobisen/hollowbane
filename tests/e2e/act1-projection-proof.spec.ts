import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function ready(page: Page) {
  await page.goto("?developer=1&act1Projection=1");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneProjectionProof?.tick ?? 0),
    )
    .toBeGreaterThan(2);
  await expect(page.locator("#world")).toBeFocused();
}

async function reset(page: Page) {
  const previous = await page.evaluate(
    () => window.hollowbaneProjectionProof!.generation,
  );
  await page.locator("#projection-reset").click();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneProjectionProof!.generation),
    )
    .toBe(previous + 1);
}

test("B bounded proof keeps live movement, actual combat timing and terminal death", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  const initial = await page.evaluate(
    () => window.hollowbaneProjectionProof!.position,
  );
  const directions = new Set<number>();
  for (const keys of [
    ["ArrowUp"],
    ["ArrowUp", "ArrowRight"],
    ["ArrowRight"],
    ["ArrowRight", "ArrowDown"],
    ["ArrowDown"],
    ["ArrowDown", "ArrowLeft"],
    ["ArrowLeft"],
    ["ArrowLeft", "ArrowUp"],
  ]) {
    await reset(page);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneProjectionProof!.position),
      )
      .toEqual(initial);
    for (const key of keys) await page.keyboard.down(key);
    await expect
      .poll(() =>
        page.evaluate((start) => {
          const p = window.hollowbaneProjectionProof!.position;
          return Math.hypot(p.x - start.x, p.y - start.y);
        }, initial),
      )
      .toBeGreaterThan(0.2);
    directions.add(
      await page.evaluate(() => window.hollowbaneProjectionProof!.direction),
    );
    for (const key of keys) await page.keyboard.up(key);
  }
  expect(directions.size).toBe(8); // Logical directions; artwork intentionally remains SE.
  await reset(page);
  await page.keyboard.press("KeyR");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneProjectionProof!.history.some((s) => s.clip === "run"),
      ),
    )
    .toBe(true);
  await page.keyboard.up("ArrowRight");
  await reset(page);
  await page.locator("#projection-attack").click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneProjectionProof!.history.some(
          (s) => s.clip === "primary" && s.frame === 5,
        ),
      ),
    )
    .toBe(true);
  await reset(page);
  await page.locator("#projection-fan").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneProjectionProof!.effects))
    .toBe(1);
  await page.screenshot({ path: info.outputPath("ability.png") });
  await reset(page);
  await page.locator("#projection-fan").click();
  await page.locator("#projection-hit").click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneProjectionProof!.history.some((s) => s.clip === "hit"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneProjectionProof!.phase))
    .toBe("idle");
  expect(
    await page.evaluate(() => window.hollowbaneProjectionProof!.effects),
  ).toBe(0);
  await page.locator("#projection-death").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneProjectionProof!.frame))
    .toBe(15);
  const fallen = await page.evaluate(() => window.hollowbaneProjectionProof!);
  expect(fallen.hp).toBe(0);
  expect(fallen.deaths).toBe(1);
  expect(
    new Set(
      fallen.history.filter((s) => s.clip === "death").map((s) => s.frame),
    ).size,
  ).toBe(16);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneProjectionProof!.tick))
    .toBeGreaterThan(fallen.tick + 30);
  expect(
    await page.evaluate(() => ({
      frame: window.hollowbaneProjectionProof!.frame,
      deaths: window.hollowbaneProjectionProof!.deaths,
    })),
  ).toEqual({ frame: 15, deaths: 1 });
  await page.screenshot({ path: info.outputPath("death.png") });
  expect(errors).toEqual([]);
});

test("B proof accepts virtual controller, pause, resize and rejects character binding", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual projection proof");
  await ready(page);
  const initial = await page.evaluate(
    () => window.hollowbaneProjectionProof!.position,
  );
  await page.evaluate(() => {
    window.virtualPads[0]!.axes[0] = 0.8;
  });
  await expect
    .poll(() =>
      page.evaluate((p) => {
        const q = window.hollowbaneProjectionProof!.position;
        return Math.hypot(p.x - q.x, p.y - q.y);
      }, initial),
    )
    .toBeGreaterThan(0.2);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes[0] = 0;
  });
  await pressVirtualButton(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  const stopped = await page.evaluate(
    () => window.hollowbaneProjectionProof!.tick,
  );
  await page.setViewportSize({ width: 1100, height: 740 });
  await expect(page.locator("canvas")).toHaveAttribute("width", "1100");
  expect(
    await page.evaluate(() => window.hollowbaneProjectionProof!.tick),
  ).toBe(stopped);
  await page.screenshot({ path: info.outputPath("controller.png") });
  await pressVirtualButton(page, 9);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneProjectionProof!.tick))
    .toBeGreaterThan(stopped);
  await page.goto(
    "?developer=1&act1Projection=1&character=00000000-0000-4000-8000-000000000001",
  );
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(
    await page.evaluate(() => window.hollowbaneProjectionProof),
  ).toBeUndefined();
});
