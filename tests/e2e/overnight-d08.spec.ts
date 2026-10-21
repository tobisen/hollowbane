import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

const trial = "./?world=1&developer=1&cryptBossTrial=1";
async function ready(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#boss-hud")).toBeVisible();
  await expect(page.locator("#boss-name")).toHaveText("Sevra, the Vaultbound");
  await expect(page.locator(".arena-header p")).toContainText("MEMORY ONLY");
  await expect(page.locator("#inventory-open")).toHaveCount(0);
  await page.locator("#combat-world").focus();
}
async function aim(page: Page) {
  return page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors.find(
        (a) => a.id === window.hollowbaneBoss!.state.actor,
      )!,
      c = window.hollowbaneWorld!.camera;
    return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
  });
}
async function permanentRecord(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("hollowbane-character-v1", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const r = db
          .transaction("snapshots")
          .objectStore("snapshots")
          .get("current");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  });
}

test("Sevra genuine keyboard and mouse fight reaches both phases and death without touching permanent saves", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  const sentinel = {
    revision: 7,
    text: "untouched permanent character sentinel",
  };
  await page.evaluate(async (sentinel) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("hollowbane-character-v1", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("snapshots");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("snapshots", "readwrite");
        tx.objectStore("snapshots").put(sentinel, "current");
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }, sentinel);
  // Explicit inventory/area/seed parameters cannot turn this fixture into a save session.
  await page.goto(trial + "&inventory=1&worldArea=ashen-refuge&worldSeed=17");
  await ready(page);
  expect(
    await page.evaluate(() => ({
      area: window.hollowbaneWorld!.area,
      seed: window.hollowbaneWorld!.seed,
    })),
  ).toEqual({ area: "ancient-crypt", seed: 42 });
  await expect
    .poll(() => page.evaluate(() => !!window.hollowbaneBoss?.state.telegraph), {
      timeout: 15000,
    })
    .toBe(true);
  await expect(page.locator("#boss-warning")).not.toBeEmpty();
  await page.screenshot({ path: testInfo.outputPath("sevra-warning.png") });
  const origin = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.keyboard.down("s");
  try {
    await expect
      .poll(() =>
        page.evaluate(
          (p) =>
            Math.hypot(
              window.hollowbaneWorld!.position.x - p.x,
              window.hollowbaneWorld!.position.y - p.y,
            ),
          origin,
        ),
      )
      .toBeGreaterThan(0.35);
  } finally {
    await page.keyboard.up("s");
  }
  await page.keyboard.press("Space");
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) =>
              e.kind === "damage" &&
              e.actor === window.hollowbaneBoss!.state.actor &&
              e.target === 0 &&
              e.result.amount > 0,
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  let point = await aim(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.phase), {
        timeout: 25000,
      })
      .toBe(1);
    await page.mouse.up();
    await expect(page.locator("#boss-phase")).toContainText("The open vault");
    await page.screenshot({ path: testInfo.outputPath("sevra-phase-two.png") });
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            window.hollowbaneBoss!.state.events.some(
              (e) => e.kind === "strike" && e.phase === 1,
            ),
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    point = await aim(page);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.complete), {
        timeout: 25000,
      })
      .toBe(true);
  } finally {
    await page.mouse.up();
  }
  await expect(page.locator("#boss-phase")).toHaveText("Encounter complete");
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
  expect(await permanentRecord(page)).toEqual(sentinel);
  expect(
    await page.evaluate(async () =>
      (await indexedDB.databases()).map((d) => d.name),
    ),
  ).toEqual(["hollowbane-character-v1"]);
  await testInfo.attach("sevra-terminal.json", {
    body: JSON.stringify(await page.evaluate(() => window.hollowbaneBoss)),
    contentType: "application/json",
  });
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => window.hollowbaneBoss!.health)).toBe(480);
  expect(await permanentRecord(page)).toEqual(sentinel);
  expect(errors).toEqual([]);
});

test("virtual controller locks Sevra and deals actual assigned-skill damage in the isolated crypt", async ({
  page,
}, testInfo) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto(trial);
  await ready(page);
  const id = await page.evaluate(() => window.hollowbaneBoss!.state.actor);
  await pressVirtualButton(page, 11);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(id);
  await expect
    .poll(() => page.evaluate(() => !!window.hollowbaneBoss!.state.telegraph), {
      timeout: 15000,
    })
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath("sevra-controller.png") });
  await pressVirtualButton(page, 0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneBoss!.health), {
      timeout: 15000,
    })
    .toBeLessThan(480);
  expect(
    await page.evaluate(() =>
      window.hollowbaneSkills!.events.some(
        (e) => e.skill === "ember-lance" && e.kind === "start",
      ),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
