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
    await press(1); // B/Circle
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  });
}
