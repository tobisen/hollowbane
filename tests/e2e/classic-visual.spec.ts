import { expect, test } from "@playwright/test";
import { act1Project } from "../../src/world/act1-view";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";

test("classic environment supports eight directions, camera, actual combat and reset", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("?classicVisual=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneClassic?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.screenshot({ path: info.outputPath("classic-start.png") });
  for (const keys of [
    ["ArrowUp"],
    ["ArrowUp", "ArrowRight"],
    ["ArrowRight"],
    ["ArrowDown", "ArrowRight"],
    ["ArrowDown"],
    ["ArrowDown", "ArrowLeft"],
    ["ArrowLeft"],
    ["ArrowUp", "ArrowLeft"],
  ]) {
    await page.locator("#act1-reset").click();
    for (const key of keys) await page.keyboard.down(key);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const p = window.hollowbaneClassic!.position;
          return Math.hypot(p.x - 12, p.y - 30);
        }),
      )
      .toBeGreaterThan(0.5);
    for (const key of keys) await page.keyboard.up(key);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneClassic!.moving))
      .toBe(false);
    const s = await page.evaluate(() => window.hollowbaneClassic!);
    const p = act1Project(s.position, "b");
    expect(s.camera).toEqual({ x: Math.round(p.x), y: Math.round(p.y) });
  }
  await page.locator("#act1-meadow").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneClassic!.position.x), {
      timeout: 15000,
    })
    .toBeGreaterThan(24);
  for (const id of [1, 2]) {
    await page.keyboard.press("KeyX");
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) =>
              window.hollowbaneClassic!.actors.find((a) => a.id === id)?.hp ??
              0,
            id,
          ),
        { timeout: 15000 },
      )
      .toBeLessThanOrEqual(0);
  }
  await page.screenshot({ path: info.outputPath("classic-combat.png") });
  expect(
    await page.evaluate(() => window.hollowbaneClassic!.hp),
  ).toBeGreaterThan(0);
  await page.locator("#act1-shrine").click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const p = window.hollowbaneClassic!.position;
          return Math.hypot(p.x - 42, p.y - 14);
        }),
      { timeout: 15000 },
    )
    .toBeLessThan(0.05);
  await page.screenshot({ path: info.outputPath("classic-bell.png") });
  await page.locator("#act1-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneClassic!.position))
    .toEqual({ x: 12, y: 30 });
  await page.locator("#classic-edge").click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const p = window.hollowbaneClassic!.position;
          return Math.hypot(p.x - 4, p.y - 29);
        }),
      { timeout: 10000 },
    )
    .toBeLessThan(0.05);
  await page.screenshot({ path: info.outputPath("classic-edge.png") });
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(errors).toEqual([]);
});

test("classic route preserves an existing checkpoint and rejects character binding", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const id = await page.evaluate(async (text) => {
    const api = window.characterStorageModule,
      storage = new api.CharacterStorage();
    try {
      return (
        await storage.create(
          "Classic isolation",
          api.deserializeCharacter(text),
        )
      ).id;
    } finally {
      storage.close();
    }
  }, serializeCharacter(characterSlotFixture()));
  const snapshot = async () => {
    await characterApi(page);
    return page.evaluate(async (id) => {
      const api = window.characterStorageModule,
        storage = new api.CharacterStorage();
      try {
        const loaded = await storage.load(id);
        if (loaded.kind !== "valid") throw Error("Checkpoint lost");
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
  await page.goto("?classicVisual=1");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneClassic?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator("#act1-reset").click();
  expect(await snapshot()).toEqual(before);
  await page.goto(`?classicVisual=1&character=${id}`);
  await expect(page.locator("#menu-status")).toContainText(
    "unsupported options",
  );
  expect(await snapshot()).toEqual(before);
});
