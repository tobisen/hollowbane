import { test, expect } from "@playwright/test";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";

test("isolated dungeon slice supports real input, reset, resize and stable camera", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("?d2slice=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice?.tick ?? 0))
    .toBeGreaterThan(2);
  const start = await page.evaluate(() => window.hollowbaneSlice!.position);
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice!.position.x))
    .toBeGreaterThan(start.x + 0.7);
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: "Return to gate" }).click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice!.position))
    .toEqual(start);
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("#world")!.blur(),
  );
  const tick = await page.evaluate(() => window.hollowbaneSlice!.tick);
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => window.hollowbaneSlice!.tick)).toBe(tick);
  await page.getByRole("button", { name: "Return to gate" }).click();
  await page.setViewportSize({ width: 1100, height: 720 });
  await expect
    .poll(() => page.locator("canvas").getAttribute("width"))
    .toBe("1100");
  expect(
    await page.evaluate(() => {
      const c = window.hollowbaneSlice!.camera;
      return Number.isInteger(c.x) && Number.isInteger(c.y);
    }),
  ).toBe(true);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("start.png"),
  });
});

test("walk the chamber loop and chapel through real ground clicks", async ({
  page,
}, testInfo) => {
  await page.goto("?d2slice=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice?.tick ?? 0))
    .toBeGreaterThan(2);
  const targets = [
    { x: 26, y: 8 },
    { x: 26, y: 26 },
    { x: 8, y: 27 },
    { x: 8, y: 8 },
    { x: 8, y: 17 },
    { x: 16, y: 17 },
  ];
  for (const [index, goal] of targets.entries()) {
    for (let leg = 0; leg < 12; leg++) {
      const p = await page.evaluate(() => window.hollowbaneSlice!.position);
      const distance = Math.hypot(goal.x - p.x, goal.y - p.y);
      if (distance < 0.05) break;
      const scale = Math.min(1, 4 / distance);
      const target = {
        x: p.x + (goal.x - p.x) * scale,
        y: p.y + (goal.y - p.y) * scale,
      };
      const camera = await page.evaluate(() => window.hollowbaneSlice!.camera);
      await page.mouse.click(
        640 + (target.x - target.y) * 64 + 768 - camera.x,
        400 + (target.x + target.y) * 32 + 512 - camera.y,
      );
      await expect
        .poll(() =>
          page.evaluate((target) => {
            const p = window.hollowbaneSlice!.position;
            return Math.hypot(p.x - target.x, p.y - target.y);
          }, target),
        )
        .toBeLessThan(0.05);
    }
    const p = await page.evaluate(() => window.hollowbaneSlice!.position);
    expect(Math.hypot(goal.x - p.x, goal.y - p.y)).toBeLessThan(0.05);
    await page.screenshot({ path: testInfo.outputPath(`room-${index}.png`) });
  }
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("standard virtual controller moves and menu resumes gameplay focus", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pad = {
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
    };
    Object.defineProperty(navigator, "getGamepads", { value: () => [pad] });
    Object.assign(window, { slicePad: pad });
  });
  await page.goto("?d2slice=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.evaluate(() => {
    (window as unknown as { slicePad: { axes: number[] } }).slicePad.axes = [
      0.7, 0, 0, 0,
    ];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice!.position.x))
    .toBeGreaterThan(8.5);
  await page.evaluate(() => {
    (window as unknown as { slicePad: { axes: number[] } }).slicePad.axes = [
      0, 0, 0, 0,
    ];
  });
  await page.keyboard.press("KeyP");
  await expect(page.locator("#controller-menu")).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("#world")).toBeFocused();
});

test("slice and rejected character links preserve complete campaign checkpoints", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const text = serializeCharacter(characterSlotFixture());
  const id = await page.evaluate(async (text) => {
    const api = window.characterStorageModule;
    const storage = new api.CharacterStorage();
    try {
      return (
        await storage.create("Slice isolation", api.deserializeCharacter(text))
      ).id;
    } finally {
      storage.close();
    }
  }, text);
  const snapshot = async () => {
    await characterApi(page);
    return page.evaluate(async (id) => {
      const api = window.characterStorageModule,
        storage = new api.CharacterStorage();
      try {
        const loaded = await storage.load(id);
        if (loaded.kind !== "valid") throw Error("Campaign checkpoint lost");
        return {
          registry: await storage.list(),
          text: api.serializeCharacter(loaded.session),
        };
      } finally {
        storage.close();
      }
    }, id);
  };
  const before = await snapshot();
  await page.goto("?d2slice=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneSlice!.position.x))
    .toBeGreaterThan(8.5);
  await page.keyboard.up("ArrowRight");
  expect(await snapshot()).toEqual(before);
  await page.goto(`?d2slice=1&character=${id}`);
  await expect(page.locator("#menu-status")).toContainText(
    "unsupported options",
  );
  expect(await snapshot()).toEqual(before);
});
