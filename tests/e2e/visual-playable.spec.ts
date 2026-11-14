import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { contains, canWalk } from "../../src/world/navigation";
import {
  visualOccluders,
  visualReviewStops,
  visualNavigation,
} from "../../src/world/visual-foundation";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";

async function ready(page: Page) {
  await page.goto("?visualPlayable=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-visual-playable",
    "ready",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.tick))
    .toBeGreaterThan(2);
}
async function full(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.locator("#visual-full").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.viewport))
    .toEqual({ x: 1280, y: 800 });
}
async function walkTo(page: Page, id: keyof typeof visualReviewStops) {
  await page.locator(`[data-visual-stop="${id}"]`).click();
  const p = visualReviewStops[id];
  await expect
    .poll(
      () =>
        page.evaluate((p) => {
          const v = window.hollowbaneVisualPlayable!;
          return Math.hypot(v.root.x - p.x, v.root.y - p.y);
        }, p),
      { timeout: 20000 },
    )
    .toBeLessThan(0.1);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.walking))
    .toBe(false);
}
const rgb = (bytes: Buffer) => sharp(bytes).removeAlpha().raw().toBuffer();

test("approved plate survives layer composition pixel for pixel with the Warrior hidden", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await full(page);
  await page.locator("#visual-pause").click();
  await page.locator("#visual-hide").click();
  const actual = await page
    .locator("canvas")
    .screenshot({ path: info.outputPath("B-hidden.png") });
  const expected = readFileSync(
    "experiments/visual-foundation/review/actual-1280x800.png",
  );
  expect(await rgb(actual)).toEqual(await rgb(expected));
  await page.locator("#visual-hide").click();
  await page
    .locator("canvas")
    .screenshot({ path: info.outputPath("C-warrior.png") });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.hollowbaneWorld)).toBeUndefined();
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("eight directions use real movement, fixed roots and bounded integer camera samples", async ({
  page,
}, info) => {
  await ready(page);
  const directions = new Set<string>();
  for (const keys of [
    ["ArrowDown"],
    ["ArrowDown", "ArrowLeft"],
    ["ArrowLeft"],
    ["ArrowLeft", "ArrowUp"],
    ["ArrowUp"],
    ["ArrowUp", "ArrowRight"],
    ["ArrowRight"],
    ["ArrowRight", "ArrowDown"],
  ]) {
    await page.locator("#visual-reset").click();
    await page.locator("#visual-stage").focus();
    const tick = await page.evaluate(
      () => window.hollowbaneVisualPlayable!.tick,
    );
    for (const key of keys) await page.keyboard.down(key);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.tick))
      .toBeGreaterThan(tick + 12);
    const v = await page.evaluate(() => window.hollowbaneVisualPlayable!);
    directions.add(v.direction);
    expect(v.walking).toBe(true);
    expect(v.frame).toBeGreaterThanOrEqual(8);
    expect(v.frame).toBeLessThan(24);
    expect(v.scale).toBe(0.5);
    expect(v.depth).toBeCloseTo(v.root.y + 0.001, 6);
    expect(v.root.x).toBeCloseTo((v.position.x - v.position.y) * 64 + 768, 8);
    expect(v.root.y).toBeCloseTo((v.position.x + v.position.y) * 32 + 512, 8);
    expect(Number.isInteger(v.camera.x) && Number.isInteger(v.camera.y)).toBe(
      true,
    );
    expect(v.camera.x).toBeGreaterThanOrEqual(0);
    expect(v.camera.x + v.viewport.x).toBeLessThanOrEqual(1280);
    expect(v.camera.y + v.viewport.y).toBeLessThanOrEqual(800);
    for (const key of keys) await page.keyboard.up(key);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.walking))
      .toBe(false);
  }
  expect([...directions].sort()).toEqual([
    "e",
    "n",
    "ne",
    "nw",
    "s",
    "se",
    "sw",
    "w",
  ]);
  await page.locator("#visual-pause").click();
  await page.locator("#visual-hide").click();
  const view = await page.evaluate(() => window.hollowbaneVisualPlayable!);
  const crop = await sharp(
    "experiments/visual-foundation/review/actual-1280x800.png",
  )
    .extract({
      left: view.camera.x,
      top: view.camera.y,
      width: view.viewport.x,
      height: view.viewport.y,
    })
    .removeAlpha()
    .raw()
    .toBuffer();
  const cameraCapture = await page
    .locator("canvas")
    .screenshot({ path: info.outputPath("camera-native-scale.png") });
  expect(await rgb(cameraCapture)).toEqual(crop);
});

test("real traversal draws Warrior behind foliage and in front of the foreground trunk", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await ready(page);
  await full(page);
  const baseline = await rgb(
    readFileSync("experiments/visual-foundation/review/actual-1280x800.png"),
  );
  for (const [stop, id] of [
    ["behind", "foreground-foliage"],
    ["front", "foreground-trunk"],
  ] as const) {
    await walkTo(page, stop);
    await page.locator("#visual-pause").click();
    const state = await page.evaluate(() => window.hollowbaneVisualPlayable!);
    const layer = visualOccluders.find((l) => l.id === id)!;
    expect(state.depth < layer.anchor.y).toBe(stop === "behind");
    const actual = await rgb(
      await page
        .locator("canvas")
        .screenshot({ path: info.outputPath(`${stop}.png`) }),
    );
    let total = 0,
      inside = 0;
    for (let y = 0; y < 800; y++)
      for (let x = 0; x < 1280; x++) {
        const i = (y * 1280 + x) * 3;
        if (
          actual[i] === baseline[i] &&
          actual[i + 1] === baseline[i + 1] &&
          actual[i + 2] === baseline[i + 2]
        )
          continue;
        total++;
        if (contains({ x: x + 0.5, y: y + 0.5 }, layer.polygon)) inside++;
      }
    expect(total).toBeGreaterThan(300);
    if (stop === "behind") expect(inside).toBe(0);
    else expect(inside).toBeGreaterThan(30);
    await page.locator("#visual-pause").click();
  }
  await walkTo(page, "ruin");
  await page.locator("#visual-stage").focus();
  const tick = await page.evaluate(() => window.hollowbaneVisualPlayable!.tick);
  await page.keyboard.down("ArrowUp");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneVisualPlayable!.tick))
    .toBeGreaterThan(tick + 90);
  await page.keyboard.up("ArrowUp");
  const collision = await page.evaluate(() => window.hollowbaneVisualPlayable!);
  expect(canWalk(visualNavigation, collision.position)).toBe(true);
  // Existing steering slides along the sloped footing instead of stopping y.
  expect(collision.root.x).toBeGreaterThan(930);
  expect(collision.root.y).toBeGreaterThan(
    189 + (1037 - collision.root.x) * 0.48 + 12,
  );
});

test("route rejects modifiers and missing assets explicitly without campaign fallback", async ({
  page,
}) => {
  for (const query of [
    "?visualPlayable=0",
    "?visualPlayable=1&world=1",
    "?visualPlayable=1&visualPlayable=1",
    "?visualPlayable=1&character=bad",
  ]) {
    await page.goto(query);
    await expect(page.locator("#visual-playable-error")).toBeVisible();
    expect(await page.evaluate(() => window.hollowbaneWorld)).toBeUndefined();
  }
  await page.route("**/actual-1280x800*.png*", (r) => r.abort());
  await page.route("**/review/actual-1280x800.png*", (r) => r.abort());
  await page.goto("?visualPlayable=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-visual-playable",
    "error",
  );
  await expect(page.locator("#visual-status")).toContainText(
    "asset visual-approved",
  );
  expect(await page.evaluate(() => window.hollowbaneWorld)).toBeUndefined();
});

test("isolated movement preserves an actual normal character checkpoint and normal startup", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const id = await page.evaluate(async (text) => {
    const api = window.characterStorageModule,
      s = new api.CharacterStorage();
    try {
      return (
        await s.create("Visual save isolation", api.deserializeCharacter(text))
      ).id;
    } finally {
      s.close();
    }
  }, serializeCharacter(characterSlotFixture()));
  const snapshot = async () => {
    await characterApi(page);
    return page.evaluate(async (id) => {
      const api = window.characterStorageModule,
        s = new api.CharacterStorage();
      try {
        const loaded = await s.load(id);
        if (loaded.kind !== "valid") throw Error("Normal save lost");
        return {
          text: api.serializeCharacter(loaded.session),
          registry: await s.list(),
          databases: await indexedDB.databases(),
          records: await new Promise<unknown[]>((resolve, reject) => {
            const request = indexedDB.open("hollowbane-characters-v1");
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction(
                ["registry", "characters", "previous", "archives"],
                "readonly",
              );
              const reads = Array.from(tx.objectStoreNames).map((name) =>
                tx.objectStore(name).getAll(),
              );
              tx.oncomplete = () => {
                db.close();
                resolve(reads.map((read) => read.result));
              };
              tx.onabort = () => {
                db.close();
                reject(tx.error);
              };
            };
          }),
        };
      } finally {
        s.close();
      }
    }, id);
  };
  const before = await snapshot();
  await ready(page);
  await walkTo(page, "woodland");
  expect(await snapshot()).toEqual(before);
  await page.goto(`?world=1&character=${id}`);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  expect(
    await page.evaluate(() => window.hollowbaneVisualPlayable),
  ).toBeUndefined();
});
