import { createInventorySession } from "../../src/simulation/inventory-world";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { fromGround } from "../../src/world/navigation";
import { test, expect } from "@playwright/test";
test("world pickup, multi-cell bag, identify, equipment and local checkpoint survive reload", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("3");
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-cell")).toHaveCount(40);
  await page.locator("#inventory-grid button[data-item]").first().click();
  const identify = page.locator("#inventory-identify");
  if (await identify.isEnabled()) await identify.click();
  await expect(page.locator("#inventory-details")).not.toContainText(
    "concealed",
  );
  await page.locator("#inventory-equip").click();
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await expect(page.locator("#loot-save")).toBeHidden();
  await page.screenshot({
    path: `test-results/inventory-${test.info().project.name}.png`,
  });
});

test("drag previews valid/invalid cells and commits only a valid move", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("3");
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await page.locator("#inventory-open").click();
  const source = page.locator('[data-focus="cell-0-0"]');
  const start = await source.boundingBox(),
    bad = await page.locator('[data-focus="cell-9-3"]').boundingBox();
  if (!start || !bad) throw Error("Missing grid geometry");
  await page.mouse.move(start.x + 10, start.y + 10);
  await page.mouse.down();
  await page.mouse.move(bad.x + 10, bad.y + 10, { steps: 4 });
  await expect(page.locator('[data-placement="invalid"]')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCSS(
    "grid-column-start",
    "1",
  );
  const valid = await page.locator('[data-focus="cell-4-2"]').boundingBox();
  if (!valid) throw Error("Missing destination");
  await page.mouse.move(start.x + 10, start.y + 10);
  await page.mouse.down();
  await page.mouse.move(valid.x + 10, valid.y + 10, { steps: 4 });
  await expect(page.locator('[data-placement="valid"]')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCSS(
    "grid-column-start",
    "5",
  );
  await expect(page.locator(".inventory-drag-ghost")).toHaveCount(0);
});
for (const id of [
  "Xbox virtual standard",
  "Wireless Controller PlayStation virtual",
]) {
  test(`${id}: controller-only inventory open, grid navigation, equip and cancel`, async ({
    page,
  }) => {
    if (id.includes("PlayStation"))
      await page.setViewportSize({ width: 1024, height: 800 });
    await page.addInitScript((id) => {
      window.virtualPads = [
        {
          id,
          index: 0,
          mapping: "standard",
          connected: true,
          axes: [0, 0, 0, 0],
          timestamp: 0,
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            touched: false,
            value: 0,
          })),
        },
      ];
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => window.virtualPads,
      });
    }, id);
    await page.goto("./?inventory=1&training=1");
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(true);
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    // Developer fixture setup only; subsequent inventory actions use the virtual pad exclusively.
    await page.locator(".loot-panel > details > summary").click();
    await page.locator("#loot-sequence").fill("3");
    await page.locator("#loot-test").click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
      .toBe(1);
    await page.locator("#combat-world").focus();
    async function press(index: number) {
      for (const value of [1, 0])
        await page.evaluate(
          async ({ index, value }) => {
            window.virtualPads[0]!.buttons[index] = {
              pressed: !!value,
              touched: !!value,
              value,
            };
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              ),
            );
          },
          { index, value },
        );
    }
    await press(0); // semantic interact: pickup
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
      .toBe(0);
    await press(8); // View/Create
    await expect(page.locator("#inventory-dialog")).toBeVisible();
    await expect(page.locator("#inventory-close")).toBeFocused();
    await press(15); // right → main slot
    await press(15); // right → grid (0,0)
    await expect(page.locator('[data-focus="cell-0-0"]')).toBeFocused();
    await press(0);
    await press(0); // select, carry
    await press(15);
    await expect(page.locator('[data-focus="cell-1-0"]')).toBeFocused();
    await press(0); // place
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCSS(
      "grid-column-start",
      "2",
    );
    await press(2); // X/Square → equip
    await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
    await press(14); // left to (0,0)
    await press(14); // left boundary to main slot
    await press(13);
    await press(13); // helmet slot
    await expect(page.locator('[data-focus="gear-helmet"]')).toBeFocused();
    await press(0); // same selected item: carry equipment
    await press(1); // cancel selection only
    await expect(page.locator("#inventory-dialog")).toBeVisible();
    await press(0); // carry same selected helmet again
    await press(15); // grid origin
    await press(0); // unequip
    await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(0);
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    for (let i = 0; i < 4; i++) await press(13); // down through rows into actions
    await press(13);
    await press(13); // equip, then drop (identify disabled)
    await expect(page.locator("#inventory-drop")).toBeFocused();
    await press(0);
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      0,
    );
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
      .toBe(1);
    await press(1); // B/Circle
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  });
}

test("full backpack pickup is atomic and corrupt checkpoints require explicit recovery", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const s = createInventorySession(),
    ring = inventoryItem("copper-band"),
    coat = inventoryItem("woven-coat");
  s.character.grid = {
    columns: 1,
    rows: 1,
    items: [{ item: ring, x: 0, y: 0 }],
  };
  s.loot.drops.push({
    item: coat,
    position: fromGround({ x: 650, y: 560 }),
    tick: 1,
    source: 1,
  });
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "character.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(s)),
  });
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.locator("#inventory-close").click();
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect(page.locator("#loot-message")).toContainText("Inventory full");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops[0]?.id))
    .toBe(coat.id);
  await page.locator("#inventory-open").click();
  await expect(
    page.locator(`#inventory-grid .inventory-item[data-item="${ring.id}"]`),
  ).toHaveCount(1);
  // Create a known backup, then corrupt only the current payload.
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("hollowbane-character-v1");
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("snapshots", "readwrite"),
        store = tx.objectStore("snapshots"),
        get = store.get("current");
      get.onsuccess = () =>
        store.put(
          {
            revision: (get.result as { revision: number }).revision,
            text: "corrupt",
          },
          "current",
        );
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator("#inventory-recover")).toBeVisible();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await page.locator("#inventory-recover").click();
  await expect(
    page.locator(`#inventory-grid .inventory-item[data-item="${ring.id}"]`),
  ).toHaveCount(1);
  await expect(page.locator("#inventory-status")).toContainText(
    "damaged current retained",
  );
});

for (const width of [1920, 1024])
  test(`inventory visual reference at ${width}`, async ({ page }, info) => {
    test.skip(
      !!info.project.name && info.project.name !== "chromium",
      "Chromium visual baseline; all engines have functional coverage",
    );
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 800 });
    await page.goto("./?inventory=1&training=1");
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    const s = createInventorySession();
    s.character.grid.items = [
      { item: inventoryItem("reed-bow"), x: 0, y: 0 },
      { item: inventoryItem("copper-band"), x: 3, y: 0 },
      { item: inventoryItem("sootwrap-gloves"), x: 5, y: 1 },
      { item: inventoryItem("woven-coat"), x: 8, y: 0 },
    ];
    s.character.equipment.helmet = inventoryItem("iron-cap");
    await page.locator("#inventory-open").click();
    await page.locator("#inventory-import").setInputFiles({
      name: "character.json",
      mimeType: "application/json",
      buffer: Buffer.from(serializeCharacter(s)),
    });
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      4,
    );
    await page.locator('[data-focus="cell-0-0"]').click();
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint saved locally.",
    );
    await expect(page.locator("#inventory-dialog")).toHaveScreenshot(
      `inventory-${width}-${process.platform}.png`,
      { maxDiffPixelRatio: 0.005 },
    );
    await page.screenshot({
      path: `test-results/inventory-showcase-${width}.png`,
    });
  });

test("natural monster death transfers one rolled item to inventory", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1&lootSeed=0");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const p = await page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors[1]!,
      v = window.hollowbaneCombat!.view,
      r = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: r.x + ((a.x - v.x) / v.width) * r.width,
      y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
    };
  });
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 15000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  const id = await page.evaluate(() => window.hollowbaneLoot!.drops[0]!.id);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.locator("#inventory-open").click();
  await expect(
    page.locator(`#inventory-grid .inventory-item[data-item="${id}"]`),
  ).toHaveCount(1);
});

test("ring comparison uses the same free slot as the equip transaction", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const s = createInventorySession(),
    incoming = inventoryItem("copper-band", 1000);
  s.character.equipment.ring1 = inventoryItem("copper-band");
  s.character.grid.items.push({ item: incoming, x: 0, y: 0 });
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "character.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(s)),
  });
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await page.locator('[data-focus="cell-0-0"]').click();
  await expect(page.locator("#inventory-compare")).toContainText(
    "Compared in ring2",
  );
  await page.locator("#inventory-equip").click();
  await expect(page.locator('[data-slot="ring2"]')).toHaveAttribute(
    "data-item",
    incoming.id,
  );
});

test("gamepad to mouse handoff preserves the first drag without moving invalid items", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.virtualPads = [
      {
        id: "Xbox virtual standard",
        index: 0,
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        timestamp: 0,
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
      },
    ];
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => window.virtualPads,
    });
  });
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("3");
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.evaluate(() => {
    window.virtualPads[0]!.buttons[8] = {
      pressed: true,
      touched: true,
      value: 1,
    };
  });
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  await page.evaluate(() => {
    window.virtualPads[0]!.buttons[8] = {
      pressed: false,
      touched: false,
      value: 0,
    };
  });
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.device))
    .toBe("gamepad");
  await expect(page.locator("#inventory-prompts")).toContainText("D-pad");
  const item = page.locator("#inventory-grid .inventory-item"),
    id = await item.getAttribute("data-item");
  const a = await page.locator('[data-focus="cell-0-0"]').boundingBox(),
    b = await page.locator('[data-focus="cell-9-3"]').boundingBox();
  if (!a || !b) throw Error("Missing grid geometry");
  await page.mouse.move(a.x + 10, a.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + 10, b.y + 10, { steps: 4 });
  await expect(page.locator("#inventory-prompts")).toContainText(
    "Click / Enter",
  );
  await expect(page.locator('[data-placement="invalid"]')).toHaveCount(1);
  await page.mouse.up();
  await expect(item).toHaveAttribute("data-item", id!);
  await expect(item).toHaveCSS("grid-column-start", "1");
});
