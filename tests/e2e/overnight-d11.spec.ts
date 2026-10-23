import { expect, test, type Page } from "@playwright/test";
import { createD11Checkpoints } from "../fixtures/d11-waypoints";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { WorldSession } from "../../src/simulation/world-session";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { chooseSkillClass } from "../../src/simulation/skill-progression";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../../src/simulation/inventory-save";
import { loadD06Checkpoint } from "./d06-checkpoint";
import { readWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { driveQuestPoint } from "./quest-world-input";
import type { AreaId } from "../../src/simulation/world";

let checkpoints: ReturnType<typeof createD11Checkpoints>;
test.beforeAll(() => {
  checkpoints = createD11Checkpoints();
});
function freshCamp() {
  const s = createInventorySession(900),
    p = progressionAtLevel(3),
    w = new WorldSession();
  s.character.level = 3;
  s.progression = { ...p, skills: chooseSkillClass(p.skills, "warrior") };
  s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  return serializeCharacter(s);
}
async function saved(page: Page, area: AreaId, revision: number) {
  await expect
    .poll(async () => {
      const s = await readWorldCheckpoint(page, "ashen-refuge");
      return {
        area: s.exploration!.area,
        revision: s.exploration!.waypoints?.revision,
      };
    })
    .toEqual({ area, revision });
  await expect(page.locator("#waypoint-save-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  return readWorldCheckpoint(page, "ashen-refuge");
}
async function down(page: Page) {
  await page.evaluate(() => {
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
    );
  });
  await pressVirtualButton(page, 13);
}
async function controllerWaypoints(page: Page) {
  await pressVirtualButton(page, 9);
  await expect(page.locator("#controller-menu")).toBeVisible();
  await expect(page.locator("#controller-waypoints")).toBeVisible();
  for (let n = 0; n < 2; n++) await down(page);
  await expect(page.locator("#controller-waypoints")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#world-waypoints")).toBeVisible();
}
test("waypoint camp attunement persists, locked destinations remain disabled and the original pause binding is preserved", async ({
  page,
}, info) => {
  await loadD06Checkpoint(page, freshCamp());
  await page.locator("#combat-world").focus();
  await page.keyboard.down("p");
  await expect(page.locator("#controller-menu")).toBeVisible();
  await page.keyboard.up("p");
  await expect(page.locator("#world-waypoints")).not.toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("n");
  await expect(page.locator("#world-waypoints")).toBeVisible();
  await expect(page.locator("#waypoint-attune")).toBeFocused();
  await page.keyboard.press("Enter");
  const state = await saved(page, "ashen-refuge", 1);
  expect(state.exploration!.waypoints!.unlocked).toEqual(["ashen-refuge"]);
  await expect(page.locator('[data-destination="ashen-refuge"]')).toHaveText(
    /Current/,
  );
  await expect(
    page.locator('[data-destination="haunted-forest"]'),
  ).toBeDisabled();
  await page.screenshot({ path: info.outputPath("waypoint-camp-attuned.png") });
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.screenshot({ path: info.outputPath("waypoint-world-anchor.png") });
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.locator("#world-waypoints-open").click();
  await expect(page.locator("#waypoint-attune")).toBeDisabled();
  expect(
    (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.waypoints,
  ).toEqual(state.exploration!.waypoints);
});
test("waypoint mouse attunes a discovered forest endpoint then cancels and returns to camp with atomic saved world ownership", async ({
  page,
}, info) => {
  await loadD06Checkpoint(page, checkpoints.forest);
  const before = deserializeCharacter(checkpoints.forest);
  await page.locator("#world-waypoints-open").click();
  await page.locator("#waypoint-attune").click();
  await saved(page, "haunted-forest", 2);
  await page.locator('[data-destination="ashen-refuge"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#waypoint-feedback")).toContainText("cancelled");
  expect(await page.evaluate(() => window.hollowbaneWorld?.area)).toBe(
    "haunted-forest",
  );
  const resources = await page.evaluate(() => ({
    hp: window.hollowbaneCombat!.actors[0]!.hp,
    mana: window.hollowbaneSkills!.users.find((u) => u.actor === 0)!.mana,
  }));
  await page.locator('[data-destination="ashen-refuge"]').click();
  await page.locator("#waypoint-confirm").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  const after = await saved(page, "ashen-refuge", 3);
  expect(after.character).toEqual(before.character);
  expect(after.progression).toEqual(before.progression);
  expect(after.exploration!.quests).toEqual(before.exploration!.quests);
  expect(after.exploration!.containers).toEqual(before.exploration!.containers);
  expect(after.loot.sequence).toBe(before.loot.sequence);
  expect(after.loot.drops).toEqual(
    before.exploration!.areas.find((a) => a.id === "ashen-refuge")!.drops,
  );
  expect(
    after.exploration!.areas.find((a) => a.id === "haunted-forest")!.drops,
  ).toEqual(before.loot.drops);
  expect(
    await page.evaluate(() => ({
      hp: window.hollowbaneCombat!.actors[0]!.hp,
      mana: window.hollowbaneSkills!.users.find((u) => u.actor === 0)!.mana,
    })),
  ).toEqual(resources);
  await page.screenshot({ path: info.outputPath("waypoint-camp-return.png") });
  await page.locator("#waypoint-close").click();
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  expect(
    (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.waypoints!
      .revision,
  ).toBe(3);
});
test("waypoint virtual controller chooses cancels confirms once and reloads both directions without duplication or focus traps", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.camp);
  await page.locator("#combat-world").focus();
  const prior = deserializeCharacter(checkpoints.camp);
  await controllerWaypoints(page);
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  expect(await page.evaluate(() => window.hollowbaneWorld?.area)).toBe(
    "ashen-refuge",
  );
  await controllerWaypoints(page);
  await expect(
    page.locator('[data-destination="haunted-forest"]'),
  ).toBeFocused();
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 0, 12);
  const forest = await saved(page, "haunted-forest", 4);
  expect(forest.character).toEqual(prior.character);
  expect(forest.progression).toEqual(prior.progression);
  await expect(page.locator("#waypoint-help")).toContainText("B: Back");
  await page.screenshot({
    path: info.outputPath("waypoint-controller-forest.png"),
  });
  await pressVirtualButton(page, 1);
  await expect(page.locator("#combat-world")).toBeFocused();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("haunted-forest");
  await page.locator("#combat-world").focus();
  await controllerWaypoints(page);
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 0);
  const camp = await saved(page, "ashen-refuge", 5);
  expect(camp.character).toEqual(prior.character);
  expect(camp.exploration!.quests).toEqual(prior.exploration!.quests);
  expect(camp.loot.drops).toEqual(prior.loot.drops);
  expect(camp.loot.sequence).toBe(prior.loot.sequence);
});
test("waypoint menu keeps attuned destinations unavailable away from the anchor after genuine controller movement", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.camp);
  await page.locator("#combat-world").focus();
  await driveQuestPoint(page, { x: 1, y: 3 });
  await page.locator("#world-waypoints-open").click();
  await expect(page.locator("#waypoint-condition")).toContainText("Approach");
  await expect(
    page.locator('[data-destination="haunted-forest"]'),
  ).toBeDisabled();
  await expect(page.locator("#waypoint-confirm")).toBeHidden();
  expect(
    (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.waypoints!
      .revision,
  ).toBe(3);
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
});
