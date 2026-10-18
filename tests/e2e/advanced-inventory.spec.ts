import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { ADVANCED_CONTENT } from "../../src/simulation/item-registry";
import { generateLoot } from "../../src/simulation/loot";
import { identifyItem } from "../../src/simulation/item-save";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { test, expect } from "@playwright/test";
import { ADVANCED_EXAMPLES } from "../../src/simulation/advanced-item-examples";
test("advanced unique inspection and equipped set transitions persist without rerolling", async ({
  page,
}, info) => {
  await page.goto("./?inventory=1&advanced=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator(".loot-panel > details > summary").click();
  const acquire = async (id: string) => {
    await page
      .locator("#loot-example")
      .selectOption(String(ADVANCED_EXAMPLES[id]));
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
    await page.locator("#inventory-grid button[data-item]").first().click();
    await expect(page.locator("#inventory-details")).toContainText("concealed");
    await page.locator("#inventory-identify").click();
  };
  await acquire("coalward-edge");
  await expect(page.locator("#inventory-details")).toContainText(
    "Unique identity: coalward-edge",
  );
  await expect(page.locator("#inventory-details")).toContainText("15% on hit");
  await page.locator("#inventory-equip").click();
  await page.locator("#inventory-close").click();
  for (const id of ["watch-brow", "watch-coat", "watch-hands", "watch-tread"]) {
    await acquire(id);
    await page.locator("#inventory-equip").click();
    await page.locator("#inventory-close").click();
  }
  await page.locator("#inventory-open").click();
  await page.locator('[data-slot="helmet"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "Ashen Watch · 4/4 equipped",
  );
  await expect(page.locator("#inventory-details")).toContainText(
    "ACTIVE 4-piece bonus",
  );
  await expect(page.locator("#inventory-stats")).toContainText(
    "ashen-watch 4-piece",
  );
  if (process.platform !== "darwin")
    info.annotations.push({
      type: "visual-exception",
      description:
        "DBL-348: Linux advanced set visual baselines pending; this functional scenario still runs.",
    });
  if (process.platform === "darwin")
    await expect(page.locator("#inventory-details")).toHaveScreenshot(
      `advanced-set-${info.project.name || "chromium"}-${process.platform}.png`,
      { maxDiffPixelRatio: 0.005 },
    );
  await page.screenshot({
    path: `test-results/advanced-set-${info.project.name}.png`,
  });
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(5);
  await page.locator('[data-slot="helmet"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "ACTIVE 4-piece bonus",
  );
  await page.locator("#inventory-drop").click();
  await page.locator('[data-slot="chest"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "Ashen Watch · 3/4 equipped",
  );
  await expect(page.locator("#inventory-details")).toContainText(
    "Inactive 4-piece bonus",
  );
  await expect(page.locator("#inventory-stats")).not.toContainText(
    "ashen-watch 4-piece",
  );
  await expect(page.locator("#inventory-stats")).toContainText(
    "ashen-watch 3-piece",
  );
});

for (const id of [
  "Xbox virtual standard",
  "Wireless Controller PlayStation virtual",
]) {
  test(`${id}: advanced item inspection and equip use semantic controls`, async ({
    page,
  }) => {
    await installVirtualController(page, id);
    await page.goto("./?inventory=1&advanced=1&training=1");
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    const session = createInventorySession();
    session.loot.table = "sanctum";
    const item = generateLoot(
      {
        seed: 42,
        sequence: ADVANCED_EXAMPLES["coalward-edge"]!,
        areaLevel: 12,
        monsterLevel: 12,
        table: "sanctum",
      },
      ADVANCED_CONTENT,
    )!;
    session.character.grid.items.push({ item: identifyItem(item), x: 0, y: 0 });
    await page.locator("#inventory-open").click();
    await page.locator("#inventory-import").setInputFiles({
      name: "advanced.json",
      mimeType: "application/json",
      buffer: Buffer.from(serializeCharacter(session)),
    });
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    await page.locator("#inventory-close").click(); // Developer fixture ends here.
    await page.locator("#combat-world").focus();
    const press = (button: number) => pressVirtualButton(page, button);
    await press(8);
    await expect(page.locator("#inventory-close")).toBeFocused();
    await press(15);
    await press(15);
    await press(0);
    await expect(page.locator("#inventory-details")).toContainText(
      "Unique identity: coalward-edge",
    );
    await press(2);
    await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
    await press(3);
    await expect(page.locator("#inventory-compare")).toBeVisible();
    await press(1);
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  });
}
