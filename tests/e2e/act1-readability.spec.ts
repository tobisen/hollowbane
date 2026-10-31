import { expect, test, type Page } from "@playwright/test";
import { ACT1_START } from "../../src/simulation/act1-readability";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { act1Project } from "../../src/world/act1-view";
import type { Point } from "../../src/world/isometric";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function ready(page: Page, variant: "a" | "b" = "a") {
  await page.goto(`?act1readability=1&view=${variant}`);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1?.tick ?? 0))
    .toBeGreaterThan(2);
  await expect(page.locator("#world")).toBeFocused();
}

async function run(page: Page) {
  // Let the existing input poll consume the key before switching to mouse input.
  await page.keyboard.down("KeyR");
  try {
    await expect(page.locator("#act1-status")).toContainText("Running");
  } finally {
    await page.keyboard.up("KeyR");
  }
}

async function clickGround(page: Page, target: Point) {
  const state = await page.evaluate(() => window.hollowbaneAct1!);
  const projected = act1Project(target, state.variant);
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) throw Error("Missing outdoor canvas");
  await page.mouse.click(
    canvas.x + canvas.width / 2 + projected.x - state.camera.x,
    canvas.y + canvas.height / 2 + projected.y - state.camera.y,
  );
}

/** Short real clicks stay within the viewport; no simulation/position injection. */
async function walkTo(page: Page, goal: Point) {
  for (let leg = 0; leg < 12; leg++) {
    const position = await page.evaluate(() => window.hollowbaneAct1!.position);
    const distance = Math.hypot(goal.x - position.x, goal.y - position.y);
    if (distance < 0.05) return;
    const scale = Math.min(1, 3 / distance);
    const target = {
      x: position.x + (goal.x - position.x) * scale,
      y: position.y + (goal.y - position.y) * scale,
    };
    await clickGround(page, target);
    await expect
      .poll(() =>
        page.evaluate((target) => {
          const p = window.hollowbaneAct1!.position;
          return Math.hypot(p.x - target.x, p.y - target.y);
        }, target),
      )
      .toBeLessThan(0.05);
  }
  throw Error(`Outdoor route did not arrive at ${goal.x},${goal.y}`);
}

test("outdoor A/B retains eight-direction input, exact reset, stable camera and resize", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  for (const variant of ["a", "b"] as const) {
    await page.locator(`#act1-${variant}`).click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneAct1?.variant))
      .toBe(variant);
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
      await page.getByRole("button", { name: "Return to march" }).click();
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneAct1!.position))
        .toEqual(ACT1_START);
      for (const key of keys) await page.keyboard.down(key);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const p = window.hollowbaneAct1!.position;
            return Math.hypot(p.x - 12, p.y - 30);
          }),
        )
        .toBeGreaterThan(0.5);
      for (const key of keys) await page.keyboard.up(key);
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneAct1!.moving))
        .toBe(false);
      const p = act1Project(
        await page.evaluate(() => window.hollowbaneAct1!.position),
        variant,
      );
      const start = act1Project(ACT1_START, variant);
      if (keys.includes("ArrowRight"))
        expect(p.x).toBeGreaterThan(start.x + 10);
      if (keys.includes("ArrowLeft")) expect(p.x).toBeLessThan(start.x - 10);
      if (keys.includes("ArrowDown")) expect(p.y).toBeGreaterThan(start.y + 10);
      if (keys.includes("ArrowUp")) expect(p.y).toBeLessThan(start.y - 10);
    }
    await page.getByRole("button", { name: "Return to march" }).click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneAct1!.position))
      .toEqual(ACT1_START);
    await page.screenshot({
      path: testInfo.outputPath(`outdoor-${variant}-start.png`),
    });
  }
  // Hold the existing blur pause across the scene restart. Otherwise patrols
  // advance between snapshots and the comparison measures different ticks.
  await page.locator("#world").evaluate((element) => {
    const field = element as HTMLElement;
    field.addEventListener("focus", () => field.blur(), { once: true });
    field.blur();
  });
  const before = await page.evaluate(() => ({
    tick: window.hollowbaneAct1!.tick,
    position: window.hollowbaneAct1!.position,
    actors: window.hollowbaneAct1!.actors,
  }));
  await page.locator("#act1-a").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1?.variant))
    .toBe("a");
  expect(
    await page.evaluate(() => ({
      tick: window.hollowbaneAct1!.tick,
      position: window.hollowbaneAct1!.position,
      actors: window.hollowbaneAct1!.actors,
    })),
  ).toEqual(before);
  await page
    .locator("#world")
    .evaluate((element) => (element as HTMLElement).blur());
  const paused = await page.evaluate(() => window.hollowbaneAct1!.tick);
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => window.hollowbaneAct1!.tick)).toBe(paused);
  await page.getByRole("button", { name: "Return to march" }).click();
  await page.setViewportSize({ width: 1100, height: 720 });
  await expect
    .poll(() => page.locator("canvas").getAttribute("width"))
    .toBe("1100");
  expect(
    await page.evaluate(() => {
      const c = window.hollowbaneAct1!.camera;
      return Number.isInteger(c.x) && Number.isInteger(c.y);
    }),
  ).toBe(true);
  await walkTo(page, { x: 14, y: 30 });
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(errors).toEqual([]);
});

test("outdoor A supports real combat and the complete clearing loop by ground clicks", async ({
  page,
}, testInfo) => {
  await ready(page);
  await run(page);
  await page
    .getByRole("button", { name: "Walk to clearing", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1!.position.x))
    .toBeGreaterThan(24);
  // Stop the running camera through the real focus gate before aiming. Pick
  // the uppermost head so another actor's body cannot cover the click region.
  await page
    .locator("#world")
    .evaluate((element) => (element as HTMLElement).blur());
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1!.moving))
    .toBe(false);
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) throw Error("Missing outdoor combat canvas");
  // Pointerdown resumes the field after the paused coordinates are consumed.
  const initial = await page.evaluate(() => window.hollowbaneAct1!);
  const ids = initial.actors
    .filter((a) => a.id !== 0)
    .sort((a, b) => a.position.x + a.position.y - (b.position.x + b.position.y))
    .map((a) => a.id);
  for (const [index, id] of ids.entries()) {
    if (index === 0) {
      const state = initial;
      const actor = state.actors.find((actor) => actor.id === id)!;
      const point = act1Project(actor.position, state.variant);
      // Actual head-region click: the shared short-body picker missed this art.
      await page.mouse.click(
        canvas.x + canvas.width / 2 + point.x - state.camera.x,
        canvas.y + canvas.height / 2 + point.y - state.camera.y - 82,
      );
    } else {
      await page.keyboard.press("KeyX");
    }
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) =>
              window.hollowbaneAct1!.actors.find((a) => a.id === id)?.hp ?? 0,
            id,
          ),
        { timeout: 15000 },
      )
      .toBeLessThanOrEqual(0);
  }
  expect(await page.evaluate(() => window.hollowbaneAct1!.hp)).toBeGreaterThan(
    0,
  );
  await page.screenshot({ path: testInfo.outputPath("outdoor-a-combat.png") });
  for (const [index, target] of [
    { x: 29, y: 29 },
    { x: 42, y: 14 },
    { x: 23, y: 11 },
    ACT1_START,
  ].entries()) {
    await walkTo(page, target);
    await page.screenshot({
      path: testInfo.outputPath(`outdoor-a-loop-${index}.png`),
    });
  }
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("outdoor B uses its actual ground projection for the northern route to the shrine", async ({
  page,
}, testInfo) => {
  await ready(page, "b");
  await run(page);
  for (const [index, target] of [
    { x: 23, y: 11 },
    { x: 42, y: 14 },
  ].entries()) {
    await walkTo(page, target);
    await page.screenshot({
      path: testInfo.outputPath(`outdoor-b-route-${index}.png`),
    });
  }
  expect(await page.evaluate(() => window.hollowbaneAct1!.hp)).toBeGreaterThan(
    0,
  );
});

test("outdoor B returns from the shrine through the northern optional route", async ({
  page,
}, testInfo) => {
  await ready(page, "b");
  await run(page);
  await page
    .getByRole("button", { name: "Walk to shrine", exact: true })
    .click();
  // The full-map route is longer than one normal short ground-click leg.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const p = window.hollowbaneAct1!.position;
          return Math.hypot(p.x - 42, p.y - 14);
        }),
      { timeout: 15000 },
    )
    .toBeLessThan(0.05);
  for (const [index, target] of [{ x: 23, y: 11 }, ACT1_START].entries()) {
    await walkTo(page, target);
    await page.screenshot({
      path: testInfo.outputPath(`outdoor-b-return-${index}.png`),
    });
  }
  expect(await page.evaluate(() => window.hollowbaneAct1!.hp)).toBeGreaterThan(
    0,
  );
});

test("outdoor virtual controller moves, resumes focus and performs real primary combat", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox virtual standard");
  await ready(page, "b");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0.7, 0, 0, 0];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1!.position.x))
    .toBeGreaterThan(ACT1_START.x + 0.5);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1!.moving))
    .toBe(false);
  await pressVirtualButton(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("#world")).toBeFocused();
  const before = await page.evaluate(() =>
    window
      .hollowbaneAct1!.actors.filter((a) => a.id !== 0)
      .reduce((sum, a) => sum + a.hp, 0),
  );
  await page
    .getByRole("button", { name: "Walk to clearing", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAct1!.position.x))
    .toBeGreaterThan(24);
  await pressVirtualButton(page, 2);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window
          .hollowbaneAct1!.actors.filter((a) => a.id !== 0)
          .reduce((sum, a) => sum + a.hp, 0),
      ),
    )
    .toBeLessThan(before);
  expect(await page.evaluate(() => window.hollowbaneAct1!.hp)).toBeGreaterThan(
    0,
  );
});

test("outdoor variants and rejected owner links preserve complete campaign checkpoints", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const text = serializeCharacter(characterSlotFixture());
  const id = await page.evaluate(async (text) => {
    const api = window.characterStorageModule,
      storage = new api.CharacterStorage();
    try {
      return (
        await storage.create(
          "Outdoor isolation",
          api.deserializeCharacter(text),
        )
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
  for (const variant of ["a", "b"] as const) {
    await ready(page, variant);
    await walkTo(page, { x: 14, y: 30 });
    expect(await snapshot()).toEqual(before);
    await page.getByRole("button", { name: "Return to march" }).click();
    expect(await snapshot()).toEqual(before);
  }
  await page.goto(`?act1readability=1&character=${id}`);
  await expect(page.locator("#menu-status")).toContainText(
    "unsupported options",
  );
  expect(await snapshot()).toEqual(before);
});
