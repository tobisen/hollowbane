import { expect, test, type Page } from "@playwright/test";
import { directionFor } from "../../src/simulation/locomotion";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

const route = "?developer=1&warriorPilot=1&warriorArena=1&warriorEquipment=1";
async function open(page: Page) {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-arena-ready",
    "true",
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
    )
    .toBe(42);
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

test("shared virtual controller moves the shield candidate and commits one ability effect", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox standard virtual (browser only)");
  await open(page);
  await page.locator("#pilot-stage").focus();
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
  expect(
    await page.evaluate(
      () => window.hollowbaneWarriorArena!.equipment!.overlayVisible,
    ),
  ).toBe(true);
});

test("shield follows all eight live walk and run facings on the camera root", async ({
  page,
}, info) => {
  await open(page);
  for (const gait of ["walk", "run"]) {
    await page.locator("#arena-reset").click();
    if (gait === "run") await page.keyboard.press("r");
    const seen = new Set<number>();
    for (const [keys, x, y] of [
      [["d"], 1, 0],
      [["s", "d"], 1, 1],
      [["s"], 0, 1],
      [["s", "a"], -1, 1],
      [["a"], -1, 0],
      [["w", "a"], -1, -1],
      [["w"], 0, -1],
      [["w", "d"], 1, -1],
    ] as const) {
      await page.locator("#pilot-stage").focus();
      const before = await page.evaluate(
        () => window.hollowbaneWarriorArena!.sample.distance,
      );
      // Keyboard intent is screen-relative; locomotion performs the inverse projection.
      const direction = directionFor({ x, y });
      for (const key of keys) await page.keyboard.down(key);
      await expect
        .poll(() =>
          page.evaluate(
            ({ before, direction, gait }) => {
              const state = window.hollowbaneWarriorArena!;
              return (
                state.sample.direction === direction &&
                state.sample.distance > before + 0.04 &&
                state.sample.pose.clip === gait &&
                state.equipment!.overlayVisible
              );
            },
            { before, direction, gait },
          ),
        )
        .toBe(true);
      const state = await page.evaluate(() => window.hollowbaneWarriorArena!);
      seen.add(state.sample.direction);
      for (const key of keys) await page.keyboard.up(key);
      expect(state.cameraRelative.x).toBeCloseTo(480, 10);
      expect(state.cameraRelative.y).toBeCloseTo(270, 10);
      await page.screenshot({
        path: info.outputPath(`${gait}-${direction}-released.png`),
        fullPage: true,
      });
    }
    expect(seen.size).toBe(8);
  }
});

test("equipment study switches and falls back without changing the frozen encounter or opening saves", async ({
  page,
}, info) => {
  await open(page);
  await page.locator("#arena-pause").click();
  const before = await page.evaluate(
    () => window.hollowbaneWarriorArena!.sample,
  );
  for (const [configuration, visible, fallback] of [
    ["ash-blade", false, "supported-developer-candidate"],
    ["reed-bow", false, "unsupported-weapon:reed-bow"],
    ["cinder-staff", false, "unsupported-weapon:cinder-staff"],
    ["empty", false, "empty-main-hand"],
    ["empty+bark-guard", false, "empty-main-hand"],
    ["ash-blade+bark-guard", true, "supported-developer-candidate"],
  ] as const) {
    await page.selectOption("#arena-equipment", configuration);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.equipment))
      .toMatchObject({
        configuration,
        fallback,
        rendererReason: fallback,
        overlayVisible: visible,
      });
    await expect(page.locator("#arena-equipment-note")).toContainText(
      fallback === "supported-developer-candidate"
        ? "Supported:"
        : "Legacy fallback:",
    );
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.sample),
    ).toEqual(before);
  }
  await page.screenshot({
    path: info.outputPath("shield-study.png"),
    fullPage: true,
  });
  await page.selectOption("#arena-source", "shipped");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbaneWarriorArena!.equipment!.rendererReason,
      ),
    )
    .toBe("original-comparison");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.hollowbaneWarriorArena!.equipment!.overlayVisible,
      ),
    )
    .toBe(false);
  expect(
    await page.evaluate(async () => ({
      keys: Object.keys(localStorage),
      db: await indexedDB.databases(),
    })),
  ).toEqual({ keys: [], db: [] });
});

test("shield release and reload cycles keep a bounded texture inventory and unchanged encounter", async ({
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
  const textures = await page.evaluate(
    () => window.hollowbaneWarriorArena!.textures,
  );
  expect(requests).toHaveLength(42);
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.locator("#arena-resources").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
      )
      .toBe(0);
    expect(
      await page.evaluate(
        () => window.hollowbaneWarriorArena!.equipment!.rendererReason,
      ),
    ).toBe("resources-released");
    expect(
      await page.evaluate(
        () => window.hollowbaneWarriorArena!.equipment!.overlayVisible,
      ),
    ).toBe(false);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.decodedBytes),
    ).toBe(0);
    await page.locator("#arena-resources").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
      )
      .toBe(42);
    await page.selectOption("#arena-source", "candidate");
    await expect
      .poll(() =>
        page.evaluate(
          () => window.hollowbaneWarriorArena!.equipment!.overlayVisible,
        ),
      )
      .toBe(true);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.decodedBytes),
    ).toBe(373.25 * 1024 ** 2);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.textures),
    ).toBe(textures);
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.sample),
    ).toEqual(before);
  }
  expect(requests).toHaveLength(168);
  expect(new Set(requests).size).toBe(42);
  expect(errors).toEqual([]);
});

test("real secondary and Oath events match the original renderer without duplicate effects", async ({
  page,
}, info) => {
  await open(page);
  await page.locator("#arena-pause").click();
  const outcomes = [];
  for (const source of ["candidate", "shipped"]) {
    await page.locator("#arena-reset").click();
    await page.selectOption("#arena-source", source);
    await page.locator("#arena-secondary").click();
    await step(page, 65);
    const melee = await page.evaluate(
      () => window.hollowbaneWarriorArena!.sample,
    );
    expect(melee.strikes).toBe(1);
    expect(melee.actors.find((a) => a.id === 1)!.hp).toBeLessThan(160);
    await page.locator("#arena-reset").click();
    await page.locator("#arena-oath").click();
    await step(page, 12);
    const cast = await page.evaluate(
      () => window.hollowbaneWarriorArena!.sample,
    );
    expect(cast.effects).toBe(1);
    expect(cast.pose.set).toBe("abilities");
    outcomes.push({ melee, cast });
    await page.screenshot({
      path: info.outputPath(`${source}-oath.png`),
      fullPage: true,
    });
  }
  expect(outcomes[0]).toEqual(outcomes[1]);
});

test("natural hit and lethal damage hold the shield landing across graphics changes", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  await page.locator("#arena-pause").click();
  const before = await page.evaluate(
    () => window.hollowbaneWarriorArena!.sample,
  );
  for (const [configuration, visible, bodyVariant] of [
    ["ash-blade", false, false],
    ["ash-blade+bark-guard", true, true],
  ] as const) {
    await page.selectOption("#arena-equipment", configuration);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWarriorArena!.equipment))
      .toMatchObject({ overlayVisible: visible, bodyVariant });
    expect(
      await page.evaluate(() => window.hollowbaneWarriorArena!.sample),
    ).toEqual(before);
  }
  await page.screenshot({
    path: info.outputPath("shield-corpse.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("ordinary entry and the original arena do not request equipment textures", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/\/warrior-equipment\//.test(r.url())) requests.push(r.url());
  });
  await page.goto("?warriorEquipment=1");
  await expect(page.locator("main.main-menu")).toBeVisible();
  await page.goto("?developer=1&warriorPilot=1&warriorArena=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-arena-ready",
    "true",
  );
  expect(
    await page.evaluate(() => window.hollowbaneWarriorArena!.candidateTextures),
  ).toBe(40);
  expect(requests).toEqual([]);
});
