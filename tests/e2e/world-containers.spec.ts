import { expect, test } from "@playwright/test";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
test("nearby treasure supports mouse travel, controller opening and atomic reload", async ({
  page,
}) => {
  test.setTimeout(90000);
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto(
    "?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  const chosen = await page.evaluate(() => {
    const w = window.hollowbaneWorld!;
    return [...w.containers!].sort(
      (a, b) =>
        Math.hypot(a.position.x - w.position.x, a.position.y - w.position.y) -
        Math.hypot(b.position.x - w.position.x, b.position.y - w.position.y),
    )[0]!.id;
  });
  const route = await page.evaluate((id) => {
    const w = window.hollowbaneWorld!;
    let from = w.position;
    const points: { x: number; y: number }[] = [];
    const path = w.routeToContainer!(id);
    for (const [index, endpoint] of path.entries()) {
      let to = endpoint;
      if (index === path.length - 1) {
        const distance = Math.hypot(endpoint.x - from.x, endpoint.y - from.y);
        if (distance <= 1) break;
        to = {
          x: endpoint.x + (from.x - endpoint.x) / distance,
          y: endpoint.y + (from.y - endpoint.y) / distance,
        };
      }
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3);
      for (let i = 1; i <= steps; i++)
        points.push({
          x: from.x + ((to.x - from.x) * i) / steps,
          y: from.y + ((to.y - from.y) * i) / steps,
        });
      from = to;
    }
    return points;
  }, chosen);
  expect(route.length).toBeGreaterThan(0);
  for (const p of route) {
    const target = await page.evaluate((p) => {
      const c = window.hollowbaneWorld!.camera;
      return {
        x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
        y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
      };
    }, p);
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(
        () =>
          page.evaluate((p) => {
            const w = window.hollowbaneWorld!;
            return (
              !w.walking &&
              Math.hypot(w.position.x - p.x, w.position.y - p.y) < 0.22
            );
          }, p),
        { timeout: 10000, intervals: [50] },
      )
      .toBe(true);
  }
  await expect(page.locator(".world-treasure button")).toBeEnabled();
  await page.screenshot({ path: "test-results/w4-treasure-closed.png" });
  await pressVirtualButton(page, 0);
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          window.hollowbaneWorld!.containers!.find((c) => c.id === id)!.opened,
        chosen,
      ),
    )
    .toBe(true);
  const reward = await page.locator(".world-treasure output").textContent();
  expect(reward).not.toContain("Gold: 0 ");
  await page.keyboard.press("e");
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const saved = await readWorldCheckpoint(page, "haunted-forest");
  expect(saved.exploration!.containers!.opened).toContain(chosen);
  expect(saved.exploration!.containers!.gold).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator(".world-treasure output")).toHaveText(reward!);
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          window.hollowbaneWorld!.containers!.find((c) => c.id === id)!.opened,
        chosen,
      ),
    )
    .toBe(true);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await saveWorldCheckpoint(page);
  const repeated = await readWorldCheckpoint(page, "haunted-forest");
  expect(repeated.exploration!.containers).toEqual(
    saved.exploration!.containers,
  );
  expect(repeated.loot).toEqual(saved.loot);
  expect(repeated.character).toEqual(saved.character);
  expect(repeated.progression).toEqual(saved.progression);
  await page.locator("#inventory-close").click();
  await page.screenshot({ path: "test-results/w4-treasure-opened.png" });
});
