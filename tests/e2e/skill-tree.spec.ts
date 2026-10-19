import { test, expect } from "@playwright/test";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { createSkillProgression } from "../../src/simulation/skill-progression";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
async function open(
  page: import("@playwright/test").Page,
  classId: "warrior" | "sorcerer" | "ranger" | null = "warrior",
) {
  await page.goto("./?inventory=1&training=1&polish=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await page.locator("#inventory-open").click();
  const session = createInventorySession();
  session.character.level = 12;
  session.progression = {
    ...progressionAtLevel(12),
    skills: createSkillProgression(classId, 12),
  };
  await page.locator("#inventory-import").setInputFiles({
    name: "skills.json",
    mimeType: "application/json",
    buffer: Buffer.from(serializeCharacter(session)),
  });
  await page.locator("#skill-tree-toggle").click();
  await expect(page.locator("#skill-points")).toHaveText("11");
}
test("skill tree confirmation, assignment and save/reload", async ({
  page,
}) => {
  await open(page, "sorcerer");
  await expect(page.locator("#node-sorcerer-ember-foundation")).toHaveAttribute(
    "data-state",
    "available",
  );
  await page.locator("#skill-learn").click();
  await page.locator("#skill-back").click();
  await expect(page.locator("#skill-points")).toHaveText("11");
  await page.locator("#skill-learn").click();
  await page.locator("#skill-confirm").click();
  await expect(page.locator("#skill-points")).toHaveText("10");
  await page.locator("#skill-assign-1").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.reload();
  await page.locator("#inventory-open").click();
  await page.locator("#skill-tree-toggle").click();
  await expect(page.locator("#node-sorcerer-ember-foundation")).toContainText(
    "1 / 5",
  );
  await expect(page.locator("#skill-points")).toHaveText("10");
  await page.screenshot({ path: "test-results/skill-tree.png" });
  await page.locator("#inventory-close").click();
  await expect(page.locator('[data-skill="1"]')).toContainText("Ember Lance");
});
for (const id of [
  "Xbox 360 Controller",
  "Wireless Controller (STANDARD GAMEPAD)",
])
  test(`skill allocation and cancel via virtual ${id}`, async ({ page }) => {
    await installVirtualController(page, id);
    await open(page);
    await page.locator("#skill-learn").focus();
    await pressVirtualButton(page, 0);
    await expect(page.locator("#skill-back")).toBeFocused();
    await pressVirtualButton(page, 15);
    await expect(page.locator("#skill-confirm")).toBeFocused();
    await pressVirtualButton(page, 0, 15);
    await expect(page.locator("#skill-points")).toHaveText("10");
    await page.locator("#skill-learn").focus();
    await pressVirtualButton(page, 0);
    await page.evaluate(() => {
      window.virtualPads[0]!.connected = false;
    });
    await expect(page.locator("#skill-confirm")).toHaveCount(0);
    await expect(page.locator("#skill-points")).toHaveText("10");
  });
test("legacy discipline confirmation and keyboard learning remain explicit", async ({
  page,
}) => {
  await open(page, null);
  await page.locator("#skill-class-ranger").click();
  await expect(page.getByRole("tab", { name: "Trailcraft" })).toBeVisible();
  await page.locator("#skill-choose-class").click();
  await expect(page.locator("#skill-back")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#skill-confirm")).toHaveCount(0);
  await page.locator("#skill-choose-class").click();
  await expect(page.locator("#skill-back")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#skill-confirm")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".skill-identity")).toContainText(
    "Committed: ranger",
  );
  await page.locator("#skill-learn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#skill-back")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#skill-confirm")).toBeFocused();
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await expect(page.locator("#skill-points")).toHaveText("10");
  await expect(page.locator("#node-ranger-wilds-foundation")).toContainText(
    "1 / 5",
  );
  await page.locator("#skill-branch-2").click();
  await expect(page.locator("#skill-learn")).toBeDisabled();
  await expect(page.locator("#skill-inspector")).toContainText(
    "Ability not implemented",
  );
  await page.setViewportSize({ width: 600, height: 900 });
  await page.locator("#skill-inspector").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/skill-tree-narrow.png" });
});
