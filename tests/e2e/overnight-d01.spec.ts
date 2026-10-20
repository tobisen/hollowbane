import { expect, test } from "@playwright/test";
import { installVirtualController } from "./virtual-controller";
import { walkEnvironmentExit } from "./world-environment-travel";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";

test("real input completes camp forest graveyard crypt camp once with atomic ownership", async ({
  page,
}) => {
  test.setTimeout(300000);
  const readyController = async () => {
    const samples = await page.evaluate(() => {
      window.virtualPads[0]!.axes = [0, 0, 0, 0];
      return window.hollowbaneInput?.samples ?? 0;
    });
    await expect
      .poll(() =>
        page.evaluate(
          (previous) =>
            !!window.hollowbaneInput?.armed &&
            window.hollowbaneInput.samples >= previous + 3,
          samples,
        ),
      )
      .toBe(true);
  };
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Begin expedition", exact: true })
    .click();
  await expect(page.locator("#expedition-status")).toContainText(
    "Attune the beacon",
  );
  await readyController();
  await saveWorldCheckpoint(page);
  const initial = await readWorldCheckpoint(page, "ashen-refuge");
  await page.keyboard.press("Escape");
  await page.locator("#combat-world").focus();
  await readyController();
  for (const [source, exit, destination] of [
    ["ashen-refuge", "forest", "haunted-forest"],
    ["haunted-forest", "graveyard", "forgotten-graveyard"],
    ["forgotten-graveyard", "crypt", "ancient-crypt"],
  ]) {
    try {
      await walkEnvironmentExit(page, source!, exit!);
    } catch (error) {
      console.log(
        "D01 travel diagnostic",
        await page.evaluate(() => ({
          world: window.hollowbaneWorld,
          input: window.hollowbaneInput,
        })),
      );
      throw error;
    }
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
      .toBe(destination);
  }
  // The helper only reads pathfinding; every step still goes through controller input.
  const route = await page.evaluate(() => {
    const w = window.hollowbaneWorld!;
    let from = w.position;
    const points: { x: number; y: number }[] = [];
    for (const to of w.routeToObjective!()) {
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.5);
      for (let i = 1; i <= steps; i++)
        points.push({
          x: from.x + ((to.x - from.x) * i) / steps,
          y: from.y + ((to.y - from.y) * i) / steps,
        });
      from = to;
    }
    return points;
  });
  expect(route.length).toBeGreaterThan(0);
  for (const p of route) {
    await expect
      .poll(
        () =>
          page.evaluate((p) => {
            const w = window.hollowbaneWorld!,
              dx = p.x - w.position.x,
              dy = p.y - w.position.y;
            if (Math.hypot(dx, dy) < 0.12) {
              window.virtualPads[0]!.axes = [0, 0, 0, 0];
              return true;
            }
            const sx = dx - dy,
              sy = (dx + dy) / 2,
              length = Math.hypot(sx, sy),
              scale = Math.min(1, Math.hypot(dx, dy) * 4);
            window.virtualPads[0]!.axes = [
              (sx / length) * scale,
              (sy / length) * scale,
              0,
              0,
            ];
            return false;
          }, p),
        { timeout: 20000, intervals: [30] },
      )
      .toBe(true);
  }
  await page.keyboard.press("e");
  await expect(page.locator("#expedition-status")).toContainText(
    "Beacon attuned",
  );
  await page.screenshot({ path: "test-results/d01-crypt-beacon.png" });
  await readyController();
  for (const [source, exit, destination] of [
    ["ancient-crypt", "graveyard", "forgotten-graveyard"],
    ["forgotten-graveyard", "forest", "haunted-forest"],
    ["haunted-forest", "camp", "ashen-refuge"],
  ]) {
    try {
      await walkEnvironmentExit(page, source!, exit!);
    } catch (error) {
      console.log(
        "D01 travel diagnostic",
        await page.evaluate(() => ({
          world: window.hollowbaneWorld,
          input: window.hollowbaneInput,
        })),
      );
      throw error;
    }
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
      .toBe(destination);
  }
  await expect(page.locator("#expedition-status")).toContainText(
    "Expedition complete",
  );
  await saveWorldCheckpoint(page);
  const completed = await readWorldCheckpoint(page, "ashen-refuge");
  expect(completed.exploration!.expedition!.stage).toBe("complete");
  expect(completed.character).toEqual(initial.character);
  expect(completed.loot.sequence).toBe(initial.loot.sequence);
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await expect(page.locator("#expedition-status")).toContainText(
    "Expedition complete",
  );
  await page.locator("#combat-world").focus();
  await readyController();
  await walkEnvironmentExit(page, "ashen-refuge", "forest");
  await walkEnvironmentExit(page, "haunted-forest", "camp");
  await saveWorldCheckpoint(page);
  const repeated = await readWorldCheckpoint(page, "ashen-refuge");
  expect(repeated.exploration!.expedition).toEqual(
    completed.exploration!.expedition,
  );
  expect(repeated.character).toEqual(completed.character);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "test-results/d01-camp-complete.png" });
});
