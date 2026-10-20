import { expect, test } from "@playwright/test";
import { installVirtualController } from "./virtual-controller";

test("generated forest supports mouse travel, atomic reload and isolated developer restart", async ({
  page,
}) => {
  // Full-area walking plus two reloads needs headroom on software-rendered CI.
  test.setTimeout(180000);
  await page.goto(
    "?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("haunted-forest");
  const fingerprint = await page.evaluate(
    () => window.hollowbaneWorld!.fingerprint,
  );
  await page.screenshot({ path: "test-results/generated-forest.png" });
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.fingerprint))
    .toBe(fingerprint);
  const start = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.locator("#combat-world").click();
  await page.keyboard.down("d");
  await expect
    .poll(() =>
      page.evaluate(
        (p) =>
          Math.hypot(
            window.hollowbaneWorld!.position.x - p.x,
            window.hollowbaneWorld!.position.y - p.y,
          ),
        start,
      ),
    )
    .toBeGreaterThan(0.2);
  await page.keyboard.up("d");
  await page.keyboard.press("Space");
  // Trace shows full-area walking dominates this navigation/reload contract.
  // Use the player's normal run toggle while retaining every route waypoint.
  await page.keyboard.press("r");

  // Keep every pathfinder turn, subdividing only to keep clicks within the viewport.
  // Nearby three-unit hops avoid redundant stops on the same straight segment.
  const route = await page.evaluate(() => {
    const w = window.hollowbaneWorld!;
    const points = w.routeToExit!("camp");
    const result: { x: number; y: number }[] = [];
    let from = w.position;
    for (const to of points) {
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3);
      for (let i = 1; i <= steps; i++)
        result.push({
          x: from.x + ((to.x - from.x) * i) / steps,
          y: from.y + ((to.y - from.y) * i) / steps,
        });
      from = to;
    }
    return result;
  });
  expect(route.length).toBeGreaterThan(2);
  for (const point of route) {
    if (
      (await page.evaluate(() => window.hollowbaneWorld!.area)) !==
      "haunted-forest"
    )
      break;
    // Stop the previous command before projecting the next target through a following camera.
    await page.keyboard.press("Space");
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.walking))
      .toBe(false);
    const target = await page.evaluate((p) => {
      const c = window.hollowbaneWorld!.camera;
      return {
        x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
        y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
      };
    }, point);
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(
        () =>
          page.evaluate((p) => {
            const w = window.hollowbaneWorld!;
            return (
              w.area !== "haunted-forest" ||
              (!w.walking &&
                Math.hypot(w.position.x - p.x, w.position.y - p.y) < 0.22)
            );
          }, point),
        { timeout: 10000, intervals: [50] },
      )
      .toBe(true);
  }
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("ashen-refuge");
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  await page.locator(".world-developer button").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("haunted-forest");
  expect(await page.evaluate(() => window.hollowbaneWorld!.fingerprint)).toBe(
    fingerprint,
  );
  const databases = await page.evaluate(() => indexedDB.databases());
  expect(databases.some((db) => db.name === "hollowbane-character-v1")).toBe(
    false,
  );
});

test("virtual controller traverses generated crypt rooms and corridors to the graveyard", async ({
  page,
}) => {
  test.setTimeout(120000);
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto(
    "?world=1&developer=1&worldPeaceful=1&worldArea=ancient-crypt&worldSeed=42",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#combat-world").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  await page.screenshot({ path: "test-results/generated-crypt.png" });
  const route = await page.evaluate(() => {
    const world = window.hollowbaneWorld!;
    let from = world.position;
    const result: { x: number; y: number }[] = [];
    for (const to of world.routeToExit!("graveyard")) {
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.5);
      for (let i = 1; i <= steps; i++)
        result.push({
          x: from.x + ((to.x - from.x) * i) / steps,
          y: from.y + ((to.y - from.y) * i) / steps,
        });
      from = to;
    }
    return result;
  });
  expect(route.length).toBeGreaterThan(2);
  for (const point of route) {
    await expect
      .poll(
        () =>
          page.evaluate((p) => {
            const w = window.hollowbaneWorld!;
            const dx = p.x - w.position.x,
              dy = p.y - w.position.y;
            if (w.area !== "ancient-crypt" || Math.hypot(dx, dy) < 0.08) {
              window.virtualPads[0]!.axes = [0, 0, 0, 0];
              return true;
            }
            const sx = dx - dy,
              sy = (dx + dy) / 2,
              length = Math.hypot(sx, sy);
            const scale = Math.min(1, Math.hypot(dx, dy) * 4);
            window.virtualPads[0]!.axes = [
              (sx / length) * scale,
              (sy / length) * scale,
              0,
              0,
            ];
            return false;
          }, point),
        { timeout: 30000, intervals: [30] },
      )
      .toBe(true);
    if (
      (await page.evaluate(() => window.hollowbaneWorld!.area)) !==
      "ancient-crypt"
    )
      break;
  }
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("forgotten-graveyard");
});
