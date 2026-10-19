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
  await page.locator("#combat-world").focus();
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
