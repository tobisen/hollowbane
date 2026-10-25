import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { installVirtualController } from "./virtual-controller";
const route = "?developer=1&warriorPilot=1&warriorCadence=1";
const metadata = JSON.parse(
  readFileSync(
    new URL("../../public/dev/warrior-movement/warrior.json", import.meta.url),
    "utf8",
  ),
) as { clips: { walk: { worldStride: number } } };
test("SE cadence exposes all clips, true run poses, stepping and gameplay-scale comparisons", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-cadence-ready",
    "true",
  );
  await expect(page.locator(".cadence-clips canvas")).toHaveCount(4);
  expect(
    await page
      .locator("#cadence-walk")
      .evaluate((canvas) => getComputedStyle(canvas).width),
  ).toBe("128px");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorCadence!.frames.run),
    )
    .not.toBe(0);
  await page.locator("#cadence-play").click();
  await page.locator("#cadence-clip").selectOption("run");
  const frames = new Set<string>();
  for (let i = 0; i < 16; i++) {
    await expect(page.locator("#cadence-frame")).toContainText(
      `RUN ${i + 1}/16`,
    );
    frames.add(
      await page
        .locator("#cadence-inspector")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    );
    await page.locator("#cadence-next").click();
  }
  expect(frames.size).toBe(16);
  await expect(page.locator("#cadence-frame")).toContainText("RUN 1/16");
  await page.locator("#cadence-background").selectOption("light");
  await page.screenshot({
    path: info.outputPath("run-light.png"),
    fullPage: true,
  });
  await page.locator("#cadence-background").selectOption("dark");
  await page.screenshot({
    path: info.outputPath("run-dark.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("SE cadence follows actual walking/running displacement and continuous gait transitions without saves", async ({
  page,
}, info) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-cadence-ready",
    "true",
  );
  await page.locator("#cadence-play").click();
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("KeyD");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.distance))
    .toBeGreaterThan(0.5);
  const walk = await page.evaluate(() => window.hollowbaneWarriorCadence!);
  expect(walk.stageClip).toBe("walk");
  expect(walk.speed).toBe(3);
  expect(walk.phase).toBeCloseTo(
    (walk.distance / metadata.clips.walk.worldStride) % 1,
    6,
  );
  await page.keyboard.press("KeyR");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("run");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.speed))
    .toBe(5.4);
  const run = await page.evaluate(() => window.hollowbaneWarriorCadence!);
  expect(run.stageFrame).toBeGreaterThanOrEqual(24);
  await page.locator("#cadence-zoom").selectOption("2");
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("KeyD");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("run");
  await page.screenshot({
    path: info.outputPath("run-gameplay-zoom2.png"),
    fullPage: true,
  });
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("KeyD");
  await page.keyboard.press("KeyR");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("walk");
  await page.keyboard.up("KeyD");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("idle");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorCadence!.transition),
    )
    .toBe(0);
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      db: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], db: [] });
});
test("virtual controller direction changes preserve displacement phase and SE-only artwork", async ({
  page,
}) => {
  await installVirtualController(page, "Standard preview controller");
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-cadence-ready",
    "true",
  );
  await page.locator("#pilot-stage").focus();
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [1, 0.5, 0, 0];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.distance))
    .toBeGreaterThan(0.5);
  const first = await page.evaluate(() => window.hollowbaneWarriorCadence!);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [-1, -0.5, 0, 0];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.direction))
    .not.toBe(first.direction);
  const changed = await page.evaluate(() => window.hollowbaneWarriorCadence!);
  expect(changed.phase).toBeCloseTo(
    (changed.distance / metadata.clips.walk.worldStride) % 1,
    6,
  );
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorCadence!.stageClip))
    .toBe("idle");
});
test("normal entry never loads the cadence atlas or preview", async ({
  page,
}) => {
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/warrior-(movement|cadence)/.test(r.url())) fetched.push(r.url());
  });
  await page.goto("?warriorCadence=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(fetched).toEqual([]);
});
