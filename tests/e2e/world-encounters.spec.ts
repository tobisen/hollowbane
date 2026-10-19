import { expect, test } from "@playwright/test";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import { installVirtualController } from "./virtual-controller";
test("generated expedition installs stable safe monster identities across save/reload", async ({
  page,
}) => {
  await page.goto("?world=1&developer=1&worldArea=haunted-forest");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneAI?.enemies.length ?? 0))
    .toBeGreaterThan(0);
  const ids = await page.evaluate(() =>
    window.hollowbaneAI!.enemies.map((e) => e.id),
  );
  expect(new Set(ids).size).toBe(ids.length);
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const context = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("hollowbane-world-test-42-0-haunted-forest", 1);
      r.onsuccess = () => resolve(r.result);
    });
    const result = await new Promise<{
      areaLevel: number;
      monsterLevel: number;
    }>((resolve) => {
      const r = db
        .transaction("snapshots")
        .objectStore("snapshots")
        .get("current");
      r.onsuccess = () => resolve(JSON.parse(r.result.text).body.loot);
    });
    db.close();
    return result;
  });
  expect(context.areaLevel).toBe(1);
  expect(context.monsterLevel).toBe(1);
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneAI?.enemies.map((e) => e.id)),
    )
    .toEqual(ids);
  await page.screenshot({ path: "test-results/w4-forest-encounters.png" });
});

test("real expedition kill persists XP and loot ownership without respawning after reload", async ({
  page,
}) => {
  test.setTimeout(90000);
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldArea=haunted-forest&worldSeed=42");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  // Keep the virtual stick neutral until the normal controller safety gate
  // has sampled it, just as a player must release the stick before moving.
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  const route = await page.evaluate(() => {
    const w = window.hollowbaneWorld!;
    let from = w.position;
    return w.routeToExit!("graveyard").flatMap((to) => {
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 2);
      const points = Array.from({ length: steps }, (_, i) => ({
        x: from.x + ((to.x - from.x) * (i + 1)) / steps,
        y: from.y + ((to.y - from.y) * (i + 1)) / steps,
      }));
      from = to;
      return points;
    });
  });
  const visibleEnemy = () =>
    page.evaluate(() => {
      const w = window.hollowbaneWorld!,
        c = w.camera;
      return (
        window
          .hollowbaneAI!.enemies.map((e) => {
            const actor = window.hollowbaneCombat!.actors.find(
              (a) => a.id === e.id,
            )!;
            return {
              id: e.id,
              hp: actor.hp,
              x: (actor.x - c.x) * c.zoom,
              y: (actor.y - 28 - c.y) * c.zoom,
              distance: Math.hypot(
                e.position.x - w.position.x,
                e.position.y - w.position.y,
              ),
            };
          })
          .filter(
            (e) =>
              e.hp > 0 &&
              e.x > 30 &&
              e.x < innerWidth - 30 &&
              e.y > 60 &&
              e.y < innerHeight - 100 &&
              e.distance < 6,
          )
          .sort((a, b) => a.distance - b.distance)[0] ?? null
      );
    });
  for (const p of route) {
    if (await visibleEnemy()) break;
    await expect
      .poll(
        async () => {
          if (await visibleEnemy()) return true;
          return page.evaluate((p) => {
            const w = window.hollowbaneWorld!,
              dx = p.x - w.position.x,
              dy = p.y - w.position.y;
            if (Math.hypot(dx, dy) < 0.08) {
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
          }, p);
        },
        { timeout: 10000, intervals: [30] },
      )
      .toBe(true);
  }
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  const target = await visibleEnemy();
  expect(target).not.toBeNull();
  await page.mouse.move(target!.x, target!.y);
  await page.mouse.down();
  try {
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) =>
              window.hollowbaneCombat!.actors.find((a) => a.id === id)!.hp,
            target!.id,
          ),
        { timeout: 25000 },
      )
      .toBe(0);
  } finally {
    await page.mouse.up();
  }
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "haunted-forest");
  expect(saved.progression!.character.totalXp).toBeGreaterThan(0);
  expect(
    saved.exploration!.areas.find((a) => a.id === "haunted-forest")!.deaths,
  ).toContain(target!.id);
  expect(saved.loot.sequence).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  // Scene creation precedes the asynchronous IndexedDB restore. Wait for
  // that transaction before inspecting actors or saving another checkpoint.
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      (id) => window.hollowbaneCombat!.actors.some((a) => a.id === id),
      target!.id,
    ),
  ).toBe(false);
  await saveWorldCheckpoint(page);
  const restored = await readWorldCheckpoint(page, "haunted-forest");
  expect(restored.progression).toEqual(saved.progression);
  expect(restored.loot).toEqual(saved.loot);
  expect(restored.character).toEqual(saved.character);
  await page.locator("#inventory-close").click();
  await page.screenshot({ path: "test-results/d00-live-kill-reloaded.png" });
});
