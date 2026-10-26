import { expect, test } from "@playwright/test";
import { installVirtualController } from "./virtual-controller";

const route = "?developer=1&warriorPilot=1&warriorDirections=1";
const ready = async (page: import("@playwright/test").Page) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-cadence-ready",
    "true",
  );
};
test("eight-direction inspector steps every pose, plays every loop and exposes light/dark guides", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.locator("#cadence-play").click();
  const identities = new Set<string>();
  for (const direction of ["n", "ne", "e", "se", "s", "sw", "w", "nw"]) {
    await page.locator("#cadence-direction").selectOption(direction);
    for (const [clip, count] of [
      ["idle", 8],
      ["walk", 16],
      ["run", 16],
    ] as const) {
      await page.locator("#cadence-clip").selectOption(clip);
      for (let i = 0; i < count; i++) {
        await expect(page.locator("#cadence-frame")).toContainText(
          `${clip.toUpperCase()} ${i + 1}/${count}`,
        );
        identities.add(
          await page
            .locator("#cadence-inspector")
            .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
        );
        await page.locator("#cadence-next").click();
      }
      await expect(page.locator("#cadence-frame")).toContainText(
        `${clip.toUpperCase()} 1/${count}`,
      );
    }
    await page.screenshot({
      path: info.outputPath(`${direction}-dark.png`),
      fullPage: true,
    });
  }
  expect(identities.size).toBe(320);
  await page.locator("#cadence-background").selectOption("light");
  await page.screenshot({ path: info.outputPath("light.png"), fullPage: true });
  await page.locator("#cadence-rate").fill("0.5");
  await page.locator("#cadence-play").click();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorCadence!.frames.run),
    )
    .not.toBe(0);
  expect(errors).toEqual([]);
});
test("keyboard facing, run/idle, camera following and collision sliding preserve root and disposable state", async ({
  page,
}, info) => {
  await ready(page);
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageView))
    .toBe("e");
  await page.keyboard.press("KeyR");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.speed))
    .toBe(5.4);
  await page.keyboard.down("ArrowDown");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageView))
    .toBe("se");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = window.hollowbaneWarriorCadence!.position;
        return (p.x - p.y) * 64;
      }),
    )
    .toBeGreaterThan(240);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageView))
    .toBe("s");
  const before = await page.evaluate(
    () => window.hollowbaneWarriorCadence!.position,
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorCadence!.position.y),
    )
    .toBeGreaterThan(before.y + 0.2);
  const after = await page.evaluate(
    () => window.hollowbaneWarriorCadence!.position,
  );
  // The existing collider is a clearance-expanded ellipse, not the painted rectangle.
  const sx = (after.x - after.y) * 64,
    sy = (after.x + after.y) * 32;
  expect(Math.hypot((sx - 275) / 27, sy / 720)).toBeCloseTo(1, 3);
  expect(
    await page.evaluate(() => window.hollowbaneWarriorCadence!.cameraRelative),
  ).toEqual({ x: 480, y: 190 });
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowDown");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("idle");
  await page.screenshot({
    path: info.outputPath("wall-slide.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      databases: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], databases: [] });
});
test("standard virtual controller selects every facing and clears movement on blur", async ({
  page,
}) => {
  await installVirtualController(page, "Standard preview controller");
  await ready(page);
  await page.locator("#pilot-stage").focus();
  for (const [x, y, direction] of [
    [0, -1, "n"],
    [1, -1, "ne"],
    [1, 0, "e"],
    [1, 1, "se"],
    [0, 1, "s"],
    [-1, 1, "sw"],
    [-1, 0, "w"],
    [-1, -1, "nw"],
  ] as const) {
    await page.evaluate(
      ([x, y]) => {
        window.virtualPads[0]!.axes = [x!, y!, 0, 0];
      },
      [x, y],
    );
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorCadence!.stageView),
      )
      .toBe(direction);
  }
  await page.locator("#cadence-play").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("idle");
});
test("normal entry never loads directional Warrior assets", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("warrior-directions")) requests.push(r.url());
  });
  await page.goto("?warriorDirections=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(requests).toEqual([]);
});
