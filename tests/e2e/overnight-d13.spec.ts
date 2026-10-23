import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { WorldSession } from "../../src/simulation/world-session";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { chooseSkillClass } from "../../src/simulation/skill-progression";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { loadD06Checkpoint } from "./d06-checkpoint";
function camp() {
  const s = createInventorySession(900),
    p = progressionAtLevel(3),
    w = new WorldSession();
  s.character.level = 3;
  s.progression = { ...p, skills: chooseSkillClass(p.skills, "warrior") };
  s.exploration = w.capture({ x: 1, y: 3 }, s.loot);
  return serializeCharacter(s);
}
test("Act1 polish inventory shortcut cannot stack above merchant stash waypoint or journal and each close restores gameplay", async ({
  page,
}) => {
  await loadD06Checkpoint(page, camp());
  for (const [id, open] of [
    ["camp-merchant", "camp-merchant-open"],
    ["camp-stash", "camp-stash-open"],
    ["world-waypoints", "world-waypoints-open"],
    ["quest-journal", "quest-journal-open"],
  ] as const) {
    if (id.startsWith("camp-")) {
      await page.locator("#combat-world").focus();
      await page.keyboard.press("e");
      await page.locator(`#${open}`).click();
    } else if (id === "quest-journal") await page.keyboard.press("j");
    else await page.locator(`#${open}`).click();
    await expect(page.locator(`#${id}`)).toBeVisible();
    await page.keyboard.press("v");
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await expect(page.locator(`#${id}`)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#combat-world")).toBeFocused();
  }
});
test("Act1 polish boss HUD avoids unchanged frame writes and memory-only trial exposes no unusable waypoint action", async ({
  page,
}, info) => {
  await page.goto("./?world=1&developer=1&cryptBossTrial=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#boss-hud")).toBeVisible();
  const measurements = await page.evaluate(async () => {
    let mutations = 0;
    const observer = new MutationObserver(
      (records) => (mutations += records.length),
    );
    observer.observe(document.querySelector("#boss-hud")!, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    for (let n = 0; n < 30; n++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    mutations += observer.takeRecords().length;
    observer.disconnect();
    return { frames: 30, mutations };
  });
  const report = info.outputPath("boss-hud-mutations.json");
  await writeFile(report, JSON.stringify(measurements));
  await info.attach("boss-hud-mutations.json", {
    path: report,
    contentType: "application/json",
  });
  expect(measurements.mutations).toBeLessThanOrEqual(30);
  await expect(page.locator("#world-waypoints-open")).toHaveCount(0);
  await expect(page.locator("#quest-journal-open")).toHaveCount(0);
  await expect(page.locator("#boss-vitality")).toContainText("/ 840");
  const aim = await page.evaluate(() => {
    const a = window.hollowbaneCombat!.actors.find(
        (a) => a.id === window.hollowbaneBoss!.state.actor,
      )!,
      c = window.hollowbaneWorld!.camera;
    return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
  });
  await page.mouse.move(aim.x, aim.y);
  await page.mouse.down();
  try {
    await expect(page.locator("#boss-warning")).toContainText(
      "Resisting interruption",
      { timeout: 15000 },
    );
  } finally {
    await page.mouse.up();
  }
  await page.screenshot({ path: info.outputPath("polished-boss-hud.png") });
  for (const width of [1280, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    const boss = await page.locator("#boss-hud").boundingBox(),
      treasure = await page.locator(".world-treasure").boundingBox();
    expect(boss).not.toBeNull();
    expect(treasure).not.toBeNull();
    expect(boss!.x + boss!.width).toBeLessThanOrEqual(treasure!.x);
  }
  await page.keyboard.press("F2");
  await expect(page.locator("#controller-waypoints")).not.toBeVisible();
  await expect(page.locator("#controller-journal")).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
});
async function down(page: Page) {
  await page.evaluate(() =>
    document.querySelector("dialog[open]")!.addEventListener(
      "focusin",
      () => {
        window.virtualPads[0]!.buttons[13] = {
          pressed: false,
          touched: false,
          value: 0,
        };
      },
      { once: true },
    ),
  );
  await pressVirtualButton(page, 13);
}
test("Act1 polish virtual controller dismisses merchant stash waypoint journal and inventory without focus traps", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, camp());
  for (const [index, id] of [
    [4, "camp-merchant"],
    [5, "camp-stash"],
  ] as const) {
    await pressVirtualButton(page, 0);
    await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
    for (let n = 0; n < index; n++) await down(page);
    await pressVirtualButton(page, 0);
    await expect(page.locator(`#${id}`)).toBeVisible();
    await pressVirtualButton(page, 1);
    await expect(page.locator("#combat-world")).toBeFocused();
  }
  await pressVirtualButton(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  for (let n = 0; n < 2; n++) await down(page);
  await pressVirtualButton(page, 0);
  await expect(page.locator("#world-waypoints")).toBeVisible();
  await expect(page.locator("#waypoint-help")).toContainText("A:");
  await page.screenshot({
    path: info.outputPath("polished-controller-waypoints.png"),
  });
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await pressVirtualButton(page, 9);
  await down(page);
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-journal")).toBeVisible();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.keyboard.press("v");
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
});
test("Act1 polish inventory shortcut respects modifier keys and returns focus after an ordinary open close", async ({
  page,
}) => {
  await loadD06Checkpoint(page, camp());
  await page.locator("#combat-world").focus();
  for (const key of ["Control+v", "Meta+v", "Alt+v"]) {
    await page.keyboard.press(key);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  }
  await page.keyboard.press("v");
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
});
