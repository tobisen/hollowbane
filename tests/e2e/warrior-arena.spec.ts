import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

const route = "?developer=1&warriorPilot=1&warriorArena=1";
async function open(page: Page) {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-arena-ready",
    "true",
  );
}
async function step(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    const tick = await page.evaluate(
      () => window.hollowbaneWarriorArena!.sample.tick,
    );
    await page.locator("#arena-step").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.sample.tick),
      )
      .toBe(tick + 1);
  }
}

test("real melee approach/impact/recovery and graphics parity at gameplay scale", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.locator("#arena-pause").click();
  const outcomes = [];
  for (const source of ["candidate", "shipped"]) {
    await page.locator("#arena-reset").click();
    await page.locator("#arena-source").selectOption(source);
    await page.locator("#arena-secondary").click();
    await step(page, 65);
    const state = await page.evaluate(() => window.hollowbaneWarriorArena!);
    expect(
      state.history.some((s) => s.distance > 0 && s.pose.clip === "walk"),
    ).toBe(true);
    const active = state.history.filter((s) =>
      s.events.some(
        (e) => e.kind === "phase" && e.actor === 0 && e.phase === "active",
      ),
    );
    expect(active).toHaveLength(1);
    expect(active[0]!.pose).toMatchObject({ set: "attacks", frame: 17 });
    expect(state.sample.actors.find((a) => a.id === 1)!.hp).toBeLessThan(160);
    expect(state.sample.phase).toBe("idle");
    expect(state.cameraRelative.x).toBeCloseTo(480, 10);
    expect(state.cameraRelative.y).toBeCloseTo(270, 10);
    outcomes.push(state.sample);
    await page.screenshot({
      path: info.outputPath(`${source}-arena.png`),
      fullPage: true,
    });
  }
  expect(outcomes[0]).toEqual(outcomes[1]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      db: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], db: [] });
});

test("actual Warrior ability activation and repeated resets retain one resource inventory", async ({
  page,
}, info) => {
  await open(page);
  await page.locator("#arena-pause").click();
  for (const source of ["candidate", "shipped"]) {
    await page.locator("#arena-reset").click();
    await page.locator("#arena-source").selectOption(source);
    await page.locator("#arena-oath").click();
    await step(page, 12);
    const state = await page.evaluate(() => window.hollowbaneWarriorArena!);
    expect(state.sample.effects).toBe(1);
    expect(state.sample.pose.set).toBe("abilities");
    expect(state.sample.mana).toBeLessThan(100);
    expect(state.candidateTextures).toBe(40);
    await page.screenshot({
      path: info.outputPath(`${source}-ability.png`),
      fullPage: true,
    });
  }
  for (let i = 0; i < 3; i++) {
    await page.locator("#arena-reset").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.sample.tick),
      )
      .toBe(0);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.sample),
    ).toMatchObject({ phase: "idle", hp: 300, effects: 0, strikes: 0 });
  }
});

test("mouse ground travel, keyboard direction changes and run cadence stay on the camera root", async ({
  page,
}, info) => {
  await open(page);
  const canvas = page.locator("#pilot-stage canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.sample.distance),
    )
    .toBeGreaterThan(0.3);
  await page.locator("#pilot-stage").focus();
  await page.keyboard.press("r");
  for (const key of ["a", "w", "d", "s"]) {
    const before = await page.evaluate(
      () => window.hollowbaneWarriorArena!.sample.tick,
    );
    await page.keyboard.down(key);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.sample.tick),
      )
      .toBeGreaterThan(before + 6);
    expect(
      await page.evaluate(
        () => window.hollowbaneWarriorArena!.sample.pose.clip,
      ),
    ).toBe("run");
    const camera = await page.evaluate(
      () => window.hollowbaneWarriorArena!.cameraRelative,
    );
    expect(camera.x).toBeCloseTo(480, 10);
    expect(camera.y).toBeCloseTo(270, 10);
    await page.keyboard.up(key);
  }
  await page.screenshot({
    path: info.outputPath("movement.png"),
    fullPage: true,
  });
});

test("shared virtual controller performs movement, secondary and existing ability", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox standard virtual (browser only)");
  await open(page);
  await page.locator("#pilot-stage").focus();
  // Prepare the self buff before engagement; real interruptions remain covered separately.
  await pressVirtualButton(page, 7);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.sample.effects),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.sample.phase),
    )
    .toBe("idle");
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [-1, 0, 0, 0];
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.sample.distance),
    )
    .toBeGreaterThan(0.5);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  await pressVirtualButton(page, 3);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneWarriorArena!.history.some(
          (s) => s.pose.clip === "secondary",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.sample.phase),
    )
    .toBe("idle");
  expect(
    await page.evaluate(() => window.hollowbaneWarriorArena!.sample.effects),
  ).toBe(1);
});

test("natural hostile damage enters hit reaction, then death holds and reset is clean", async ({
  page,
}, info) => {
  await open(page);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneWarriorArena!.history.some(
            (s) => s.pose.set === "hit",
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.sample.hp), {
      timeout: 35000,
    })
    .toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.sample.pose))
    .toEqual({ set: "death", frame: 15, clip: "death" });
  const position = await page.evaluate(
    () => window.hollowbaneWarriorArena!.sample.position,
  );
  await page.locator("#pilot-stage").focus();
  await page.keyboard.down("d");
  await page.keyboard.press("x");
  await page.keyboard.press("2");
  const tick = await page.evaluate(
    () => window.hollowbaneWarriorArena!.sample.tick,
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.sample.tick))
    .toBeGreaterThan(tick + 30);
  await page.keyboard.up("d");
  expect(
    await page.evaluate(() => window.hollowbaneWarriorArena!.sample.position),
  ).toEqual(position);
  expect(
    await page.evaluate(() => window.hollowbaneWarriorArena!.sample.pose),
  ).toEqual({ set: "death", frame: 15, clip: "death" });
  await page.screenshot({
    path: info.outputPath("held-corpse.png"),
    fullPage: true,
  });
  await page.locator("#arena-pause").click();
  await page.locator("#arena-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.sample.hp))
    .toBe(300);
});

test("candidate unload/reload cycles release all forty textures without resetting gameplay", async ({
  page,
}) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (/\/dev\/.*\.png$/.test(r.url())) requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.locator("#arena-pause").click();
  const before = await page.evaluate(
    () => window.hollowbaneWarriorArena!.sample,
  );
  expect(requests).toHaveLength(40);
  expect(new Set(requests).size).toBe(40);
  for (let i = 0; i < 3; i++) {
    await page.locator("#arena-resources").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
      )
      .toBe(0);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.decodedBytes),
    ).toBe(0);
    await page.locator("#arena-resources").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
      )
      .toBe(40);
    await page.locator("#arena-source").selectOption("candidate");
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.decodedBytes),
    ).toBe(349.25 * 1024 * 1024);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.sample),
    ).toEqual(before);
  }
  expect(errors).toEqual([]);
});

test("ordinary entry neither exposes arena diagnostics nor downloads candidate atlases", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/\/dev\//.test(r.url())) requests.push(r.url());
  });
  await page.goto("?warriorPilot=1&warriorArena=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  expect(
    await page.evaluate(() => window.hollowbaneWarriorArena),
  ).toBeUndefined();
  expect(requests).toEqual([]);
});
