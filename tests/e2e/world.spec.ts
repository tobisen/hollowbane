import { expect, test } from "@playwright/test";
test("walks from camp to forest and back using existing ground movement", async ({
  page,
}) => {
  await page.goto("?world=1");
  await expect(page.locator(".arena-header h1")).toHaveText("Ashen Refuge");
  const field = page.locator("#combat-world");
  // Existing camera and pointer projection: use published ground coordinates.
  async function exit() {
    const point = await page.evaluate(() => {
      const game = window.hollowbaneWorld!;
      return game.exits[0]!;
    });
    // Camera framing is shared with the arena; use the same test projection.
    const target = await page.evaluate(({ x, y }) => {
      const canvas = document.querySelector("canvas")!;
      const rect = canvas.getBoundingClientRect();
      const hudTop = document
        .querySelector(".skill-bar")!
        .getBoundingClientRect().top;
      const playBottom = Math.max(120, Math.min(innerHeight, hudTop - 16));
      const scale = Math.min(innerWidth / 1280, playBottom / 800);
      return {
        x: rect.width / 2 + (x - 768) * scale,
        y: playBottom / 2 + (y - 512) * scale,
      };
    }, point);
    await field.click({ position: target });
  }
  await exit();
  await expect(page.locator(".arena-header h1")).toHaveText("Haunted Forest", {
    timeout: 15000,
  });
  await exit();
  await expect(page.locator(".arena-header h1")).toHaveText("Ashen Refuge", {
    timeout: 15000,
  });
  await page.screenshot({ path: "test-results/world-prototype.png" });
});

test("virtual controller walks through both area exits", async ({ page }) => {
  const { installVirtualController } = await import("./virtual-controller");
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#combat-world").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  for (const destination of ["haunted-forest", "ashen-refuge"]) {
    await expect
      .poll(
        () =>
          page.evaluate((destination) => {
            const world = window.hollowbaneWorld!;
            if (world.area === destination) {
              window.virtualPads[0]!.axes = [0, 0, 0, 0];
              return true;
            }
            const dx = -2.5 - world.position.x,
              dy = -world.position.y;
            const sx = dx - dy,
              sy = (dx + dy) / 2,
              length = Math.hypot(sx, sy);
            window.virtualPads[0]!.axes = [sx / length, sy / length, 0, 0];
            return false;
          }, destination),
        { timeout: 15000, intervals: [50] },
      )
      .toBe(true);
  }
});

test("saves forest and character in one checkpoint, reloads safely and returns to camp", async ({
  page,
}) => {
  await page.goto("?world=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  async function travelTo(destination: string) {
    const target = await page.evaluate(() => {
      const p = window.hollowbaneWorld!.exits[0]!;
      const hudTop = document
        .querySelector(".skill-bar")!
        .getBoundingClientRect().top;
      const bottom = Math.max(120, Math.min(innerHeight, hudTop - 16));
      const scale = Math.min(innerWidth / 1280, bottom / 800);
      return {
        x: innerWidth / 2 + (p.x - 768) * scale,
        y: bottom / 2 + (p.y - 512) * scale,
      };
    });
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
      .toBe(destination);
  }
  await travelTo("haunted-forest");
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const before = await page.evaluate(async () => {
    return await new Promise<string>((resolve, reject) => {
      const open = indexedDB.open("hollowbane-character-v1", 1);
      open.onsuccess = () => {
        const db = open.result;
        const get = db
          .transaction("snapshots")
          .objectStore("snapshots")
          .get("current");
        get.onsuccess = () => {
          db.close();
          resolve(get.result.text);
        };
        get.onerror = () => reject(get.error);
      };
    });
  });
  const saved = JSON.parse(before);
  expect(saved.body.exploration.area).toBe("haunted-forest");
  expect(saved.body.character).toBeTruthy();
  expect(saved.body.progression).toBeTruthy();
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect(page.locator(".arena-header h1")).toHaveText("Haunted Forest");
  await travelTo("ashen-refuge");
  await expect(page.locator(".arena-header h1")).toHaveText("Ashen Refuge");
});
