import { advancedReference } from "./advanced-visual";
import { advancedItem } from "../../src/simulation/advanced-item-test-helper";
import { insertSocket } from "../../src/simulation/item-sockets";
import { SOCKET_ITEM_CONTENT } from "../../src/simulation/item-registry";
import { AFFIX_ITEM_CONTENT } from "../../src/simulation/item-registry";
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
  await advancedReference(
    page.locator("#inventory-details"),
    "advanced-set",
    info,
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

test("equipped bow and attack speed survive idle scene updates and launch real projectiles", async ({
  page,
}) => {
  await page.goto("./?inventory=1&advanced=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page.locator("#combat-hostile").uncheck();
  const session = createInventorySession();
  session.character.level = 40;
  session.character.equipment.main = identifyItem(
    generateLoot(
      {
        seed: 42,
        sequence: ADVANCED_EXAMPLES.reedwake!,
        areaLevel: 12,
        monsterLevel: 12,
        table: "sanctum",
      },
      ADVANCED_CONTENT,
    )!,
  );
  for (let sequence = 0; sequence < 100000; sequence++) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 40, monsterLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (
      i?.base === "sootwrap-gloves" &&
      i.advanced?.modifiers.some(
        (m) => m.kind === "stat" && m.stat === "attackSpeed" && m.value >= 10,
      )
    ) {
      session.character.equipment.gloves = identifyItem(i);
      break;
    }
  }
  expect(session.character.equipment.gloves).toBeDefined();
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "bow.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(session)),
  });
  await expect(page.locator("#inventory-stats")).toContainText("projectile");
  await page.locator("#inventory-close").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat?.actors[0]?.weapon))
    .toBe("projectile");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat?.actors[0]?.attackSpeed ?? 0),
    )
    .toBeGreaterThanOrEqual(20);
  const point = await page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors[1]!,
      v = window.hollowbaneCombat!.view,
      r = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: r.x + ((a.x - v.x) / v.width) * r.width,
      y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
    };
  });
  await page.mouse.click(point.x, point.y);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some(
          (e) => e.kind === "launch" && e.actor === 0,
        ),
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.windup),
  ).toBe(10);
});

test("an embedded gem adds one real elemental impact without recursive activations", async ({
  page,
}) => {
  await page.goto("./?inventory=1&advanced=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page.locator("#combat-hostile").uncheck();
  let host: ReturnType<typeof generateLoot> = null,
    gem: ReturnType<typeof generateLoot> = null;
  for (let sequence = 0; sequence < 10000 && (!host || !gem); sequence++) {
    const context = { seed: 42, sequence, areaLevel: 40, monsterLevel: 40 };
    const h = generateLoot(
        { ...context, table: "sanctum" },
        SOCKET_ITEM_CONTENT,
      ),
      g = generateLoot(
        { ...context, seed: 43, table: "gem-cache" },
        SOCKET_ITEM_CONTENT,
      );
    if (h?.base === "ash-blade" && h.quality === "normal" && h.socketCapacity)
      host = identifyItem(h);
    if (g?.base === "fire-gem-1") gem = g;
  }
  if (!host || !gem) throw Error("Missing fixtures");
  const session = createInventorySession();
  session.character.level = 40;
  session.character.equipment.main = host;
  session.character.grid.items = [{ item: gem, x: 0, y: 0 }];
  const inserted = insertSocket(session.character, host.id, gem.id);
  if (!inserted.ok) throw Error(inserted.reason);
  session.character = inserted.value;
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "gem.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(session)),
  });
  await page.locator("#inventory-close").click();
  const point = await page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors[1]!,
      v = window.hollowbaneCombat!.view,
      r = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: r.x + ((a.x - v.x) / v.width) * r.width,
      y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
    };
  });
  await page.mouse.click(point.x, point.y);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneItems?.applied ?? 0))
    .toBe(1);
  const effects = await page.evaluate(() => window.hollowbaneItems!);
  expect(effects.procs).toBe(1);
  expect(effects.pending).toBe(0);
  const hits = await page.evaluate(() =>
    window.hollowbaneCombat!.events.filter(
      (e) => e.kind === "damage" && e.actor === 0,
    ),
  );
  expect(
    hits.filter((e) => e.kind === "damage" && e.result.type === "physical"),
  ).toHaveLength(1);
  expect(
    hits.filter(
      (e) =>
        e.kind === "damage" && e.result.type === "fire" && e.result.amount > 0,
    ),
  ).toHaveLength(1);
});

test("older inventory route safely resumes a saved advanced component table", async ({
  page,
}) => {
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const session = createInventorySession();
  session.loot.table = "gem-cache";
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "advanced-table.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(session)),
  });
  await page.locator("#inventory-close").click();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("0");
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(1);
  const drop = await page.evaluate(() => window.hollowbaneLoot!.drops[0]!);
  expect(drop.id).toMatch(/^l8-/);
  await expect(page.locator("#loot-table")).toContainText(
    '"contentVersion": 8',
  );
  await expect(page.locator("#loot-diagnostics")).toContainText(
    "gem-cache: 100% drop",
  );
  expect(drop.name).toMatch(/Coalglass|Hoarfleck|Rainshard|Mirestone/);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-grid .inventory-item")).toHaveCount(1);
});

test("component grades, original glyphs and slot-specific effects are inspectable", async ({
  page,
}, info) => {
  await page.goto("./?inventory=1&advanced=1&training=1");
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const session = createInventorySession();
  session.character.level = 40;
  session.character.equipment.main = advancedItem("ash-blade", {
    accept: (i) => i.quality === "normal" && i.socketCapacity === 2,
  });
  session.character.grid.items = [
    { item: advancedItem("fire-gem-3", { version: 5, seed: 43 }), x: 0, y: 0 },
    {
      item: advancedItem("sigil-lyrvek", { version: 6, seed: 44 }),
      x: 2,
      y: 0,
    },
  ];
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-import").setInputFiles({
    name: "components.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(session)),
  });
  await page.locator('[data-focus="cell-0-0"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "Gem grade 3 · fire",
  );
  await expect(page.locator("#inventory-details")).toContainText(
    "Fire resistance: +15%",
  );
  await expect(page.locator("#inventory-equip")).toBeDisabled();
  await expect(page.locator("#inventory-grid .inventory-item svg")).toHaveCount(
    2,
  );
  await advancedReference(
    page.locator(".inventory-layout"),
    "advanced-components",
    info,
  );
  await page.screenshot({
    path: `test-results/advanced-components-${info.project.name}.png`,
  });
  await page.locator('[data-focus="cell-2-0"]').click();
  await expect(page.locator("#inventory-details")).toContainText(
    "Cast speed: +5%",
  );
});
