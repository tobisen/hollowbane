import { expect, test } from "@playwright/test";
import { worldLayout } from "../../src/simulation/world-layout";
import { areaNavigation, canWalk, findPath } from "../../src/world/navigation";
import { installVirtualController } from "./virtual-controller";

test("Haunted Forest held keyboard slides past a tree and switches to analog and click travel", async ({
  page,
}) => {
  const layout = worldLayout("haunted-forest", 42, 2);
  const nav = areaNavigation(layout.map);
  const candidates = layout.map.objects
    .filter((o) => o.blocking)
    .map((o) => {
      const radius = o.radius + 0.23;
      const start = {
        x: o.position.x - radius * Math.cos(Math.PI / 12),
        y: o.position.y + radius * Math.sin(Math.PI / 12),
      };
      return {
        start,
        obstacle: o,
        distance: Math.hypot(
          start.x - layout.spawn.x,
          start.y - layout.spawn.y,
        ),
      };
    })
    .filter((c) => canWalk(nav, c.start))
    .sort((a, b) => a.distance - b.distance);
  const fixture = candidates.find(
    (c) => findPath(nav, layout.spawn, c.start).length,
  );
  expect(fixture).toBeDefined();
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto(
    "?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#combat-world").focus();
  const route: { x: number; y: number }[] = [];
  let from = layout.spawn;
  for (const to of findPath(nav, layout.spawn, fixture!.start)) {
    const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 2.5);
    for (let i = 1; i <= steps; i++)
      route.push({
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
    from = to;
  }
  for (const goal of route) {
    const position = await page.evaluate((p) => {
      const c = window.hollowbaneWorld!.camera;
      return {
        x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
        y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
      };
    }, goal);
    await page.mouse.click(position.x, position.y);
    await page.waitForFunction(
      (p) => {
        const w = window.hollowbaneWorld!;
        return (
          !w.walking &&
          Math.hypot(w.position.x - p.x, w.position.y - p.y) < 0.04
        );
      },
      goal,
      { polling: "raf", timeout: 10000 },
    );
  }
  await page.keyboard.down("d");
  // The tree blocks a straight screen-right step. Continue held input until actual
  // tangential progress passes the contact; sample in the browser to avoid host lag.
  const observations = await page.evaluate(async ({ start }) => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 120; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const p = window.hollowbaneWorld!.position;
      points.push({ ...p });
      if (Math.hypot(p.x - start.x, p.y - start.y) > 0.7) break;
    }
    return points;
  }, fixture!);
  await page.keyboard.up("d");
  await page.keyboard.press("Space");
  expect(observations.every((p) => canWalk(nav, p))).toBe(true);
  const end = observations.at(-1)!;
  expect(
    Math.hypot(end.x - fixture!.start.x, end.y - fixture!.start.y),
  ).toBeGreaterThan(0.7);
  expect(
    Math.abs(end.x - fixture!.start.x + (end.y - fixture!.start.y)),
  ).toBeGreaterThan(0.1);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [-0.5, 0, 0, 0];
  });
  await page.waitForFunction(
    (p) =>
      Math.hypot(
        window.hollowbaneWorld!.position.x - p.x,
        window.hollowbaneWorld!.position.y - p.y,
      ) > 0.15,
    end,
    { polling: "raf" },
  );
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  await page.keyboard.press("Space");
  const back = await page.evaluate((p) => {
    const c = window.hollowbaneWorld!.camera;
    return {
      x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
      y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
    };
  }, fixture!.start);
  await page.mouse.click(back.x, back.y);
  await page.waitForFunction(
    (p) => {
      const w = window.hollowbaneWorld!;
      return (
        !w.walking && Math.hypot(w.position.x - p.x, w.position.y - p.y) < 0.04
      );
    },
    fixture!.start,
    { polling: "raf", timeout: 10000 },
  );
  await page.screenshot({ path: "test-results/forest-wall-sliding.png" });
  expect(
    canWalk(nav, await page.evaluate(() => window.hollowbaneWorld!.position)),
  ).toBe(true);
});
