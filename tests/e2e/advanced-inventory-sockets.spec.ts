import { test, expect, type Page } from "@playwright/test";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { advancedItem } from "../../src/simulation/advanced-item-test-helper";
import { insertSocket } from "../../src/simulation/item-sockets";
import { itemTree } from "../../src/simulation/item-ownership";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { advancedReference } from "./advanced-visual";
function fixture(full = false) {
  const s = createInventorySession();
  s.character.level = 40;
  s.character.equipment.main = advancedItem("ash-blade", {
    accept: (i) => i.quality === "normal" && i.socketCapacity === 2,
  });
  s.character.grid.items = [
    { item: advancedItem("sigil-aevin", { version: 6, seed: 44 }), x: 0, y: 0 },
    { item: advancedItem("sigil-brask", { version: 6, seed: 44 }), x: 1, y: 0 },
  ];
  if (full)
    for (const id of s.character.grid.items.map((e) => e.item.id)) {
      const result = insertSocket(
        s.character,
        s.character.equipment.main!.id,
        id,
      );
      if (!result.ok) throw Error(result.reason);
      s.character = result.value;
    }
  return s;
}
async function stage(page: Page, s = fixture()) {
  await page.goto("./?inventory=1&advanced=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "sockets.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(s)),
  });
  await expect(page.locator("#inventory-gear [data-item]")).toHaveCount(1);
}
test("explicit socket preview, ordered insertion, pattern removal and save reload", async ({
  page,
}, info) => {
  const s = fixture();
  await stage(page, s);
  await page.locator('[data-slot="main"]').click();
  await expect(page.locator("#inventory-details")).toContainText("Sockets 0/2");
  await page.locator("#inventory-socket").click();
  await expect(page.locator("#inventory-component")).toBeFocused();
  await expect(page.locator("#inventory-socket-preview")).toContainText(
    "1. Aevin Sigil",
  );
  await advancedReference(
    page.locator("#inventory-socket-controls"),
    "socket-preview",
    info,
  );
  await page.locator("#inventory-socket-cancel").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(2);
  await expect(page.locator("#inventory-socket-controls")).not.toBeVisible();
  await page.locator("#inventory-socket").click();
  await page.locator("#inventory-insert").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await expect(page.locator("#inventory-details")).toContainText("Sockets 1/2");
  await page.locator("#inventory-socket").click();
  await expect(page.locator("#inventory-socket-preview")).toContainText(
    "Cinder Covenant · ACTIVE",
  );
  await page.locator("#inventory-insert").click();
  await expect(page.locator("#inventory-stats")).toContainText(
    "Active patterns: Cinder Covenant",
  );
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(0);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await page.locator('[data-slot="main"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "1. Aevin Sigil",
  );
  await expect(page.locator("#inventory-details")).toContainText(
    "2. Brask Sigil",
  );
  await page.locator("#inventory-extract").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(2);
  await expect(page.locator("#inventory-stats")).not.toContainText(
    "Cinder Covenant",
  );
  await expect(page.locator("#inventory-details")).toContainText("Sockets 0/2");
  const ids = await page
    .locator("#inventory-grid .inventory-item")
    .evaluateAll((els) =>
      els.map((e) => (e as HTMLElement).dataset.item).sort(),
    );
  expect(ids).toEqual(s.character.grid.items.map((e) => e.item.id).sort());
});
for (const id of [
  "Xbox virtual standard",
  "Wireless Controller PlayStation virtual",
]) {
  test(`${id}: controller-only ordered socket lifecycle and readable preview`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await installVirtualController(page, id);
    const s = fixture();
    await stage(page, s);
    await page.locator("#inventory-close").click();
    await page.locator("#combat-world").focus();
    const press = (i: number, frames = 3) =>
      pressVirtualButton(page, i, frames);
    await press(8);
    await press(15);
    await expect(page.locator('[data-slot="main"]')).toBeFocused();
    await press(0);
    await press(3);
    await expect(page.locator("#inventory-compare")).toBeFocused();
    await press(14);
    await expect(page.locator("#inventory-details")).toBeFocused();
    await press(14); // grid origin, selection remains the host
    for (let i = 0; i < 4; i++) await press(13);
    await expect(page.locator("#inventory-take")).toBeFocused();
    for (
      let i = 0;
      i < 8 &&
      !(await page
        .locator("#inventory-socket")
        .evaluate((e) => e === document.activeElement));
      i++
    )
      await press(13);
    await expect(page.locator("#inventory-socket")).toBeFocused();
    await press(0);
    await expect(page.locator("#inventory-component")).toBeFocused();
    await press(3);
    await expect(page.locator("#inventory-socket-preview")).toBeFocused();
    await press(13);
    await press(14);
    await expect(page.locator("#inventory-component")).toBeFocused();
    await press(1);
    await expect(page.locator("#inventory-dialog")).toBeVisible();
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      2,
    );
    await press(0);
    await press(2, 12); // Held primary must insert only once, then release.
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      1,
    );
    await expect(page.locator("#inventory-details")).toContainText(
      "Sockets 1/2",
    );
    await press(13);
    await expect(page.locator("#inventory-socket")).toBeFocused();
    await press(0);
    await expect(page.locator("#inventory-socket-preview")).toContainText(
      "Cinder Covenant · ACTIVE",
    );
    await press(2);
    await expect(page.locator("#inventory-stats")).toContainText(
      "Cinder Covenant",
    );
    await press(13);
    await expect(page.locator("#inventory-extract")).toBeFocused();
    await press(0);
    await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(
      2,
    );
    await expect(page.locator("#inventory-stats")).not.toContainText(
      "Cinder Covenant",
    );
    await press(1);
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  });
}
test("full-bag extraction fails atomically, then succeeds only after enough room exists", async ({
  page,
}) => {
  const s = fixture(true);
  let sequence = 0;
  for (let i = 0; i < 39; i++) {
    const item = advancedItem("fire-gem-1", { seed: 45, start: sequence });
    sequence = item.origin.sequence + 1;
    s.character.grid.items.push({ item, x: i % 10, y: Math.floor(i / 10) });
  }
  const expected = new Set(
    itemTree([
      ...s.character.grid.items.map((e) => e.item),
      s.character.equipment.main!,
    ]).map((i) => i.id),
  );
  await stage(page, s);
  await page.locator('[data-slot="main"]').click();
  await page.locator("#inventory-extract").click();
  await expect(page.locator("#inventory-socket-message")).toContainText(
    "Make room for all",
  );
  await expect(page.locator("#inventory-details")).toContainText("Sockets 2/2");
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(39);
  await page.locator('[data-focus="cell-0-0"]').click();
  await page.locator("#inventory-drop").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  await page.locator('[data-slot="main"]').click();
  await page.locator("#inventory-extract").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(40);
  await expect(page.locator("#inventory-details")).toContainText("Sockets 0/2");
  const ids = await page
    .locator(
      "#inventory-grid .inventory-item,#inventory-gear button[data-item]",
    )
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.item!));
  const drops = await page.evaluate(() =>
    window.hollowbaneLoot!.drops.map((d) => d.id),
  );
  expect(new Set([...ids, ...drops])).toEqual(expected);
  expect(ids.length + drops.length).toBe(expected.size);
});
