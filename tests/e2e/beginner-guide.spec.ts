import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
async function create(page: Page, name: string) {
  await page.goto("./");
  await page.locator("#menu-new").click();
  await page.locator('[data-class="sorcerer"]').click();
  await page.getByLabel("Character name").fill(name);
  await page.getByRole("button", { name: "Review character" }).click();
  await page.locator("#menu-create-confirm").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#beginner-hint")).toHaveAttribute(
    "data-hint",
    "movement",
  );
  return new URL(page.url()).searchParams.get("character")!;
}
async function settings(page: Page) {
  await page.locator("#player-pause-open").click();
  await page.locator("#player-settings").click();
}
test("contextual hints never pause gameplay and preserve dismiss/disable per character", async ({
  page,
}) => {
  const owner = await create(page, "First Trail");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  const before = await page.evaluate(() => window.hollowbaneCombat!.tick);
  await page.locator("#combat-world").focus();
  await page.keyboard.down("d");
  try {
    await expect(page.locator("#beginner-hint")).toHaveAttribute(
      "data-hint",
      "quests",
    );
  } finally {
    await page.keyboard.up("d");
  }
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.tick),
  ).toBeGreaterThan(before);
  await expect(page.locator("#beginner-hint-message")).toContainText(
    "J opens the quest journal",
  );
  await page.locator("#beginner-hint-dismiss").click();
  expect(
    await page.evaluate(() =>
      window.hollowbaneSkills!.events.filter(
        (e) => e.actor === 0 && e.kind === "start",
      ),
    ),
  ).toEqual([]);
  await expect(page.locator("#beginner-hint")).toHaveAttribute(
    "data-hint",
    "inventory",
  );
  await page.reload();
  await expect(page.locator("#beginner-hint")).toHaveAttribute(
    "data-hint",
    "inventory",
  );
  await settings(page);
  await page.locator("#beginner-enabled").uncheck();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#beginner-hint")).toBeHidden();
  await page.goto("./");
  const other = await create(page, "Second Trail");
  expect(other).not.toBe(owner);
  await expect(page.locator("#beginner-hint")).toBeVisible();
  const progress = await page.evaluate(
    ({ owner, other }) =>
      [owner, other].map((id) =>
        JSON.parse(
          localStorage.getItem("hollowbane.guidance.v1:" + id) ?? "null",
        ),
      ),
    { owner, other },
  );
  expect(progress[0]).toMatchObject({
    enabled: false,
    dismissed: ["quests"],
    completed: ["movement"],
  });
  expect(progress[1]).toBeNull(); // A displayed hint alone does not write progress.
  const mutations = await page
    .locator("#beginner-hint")
    .evaluate(async (element) => {
      let count = 0;
      const observer = new MutationObserver((records) => {
        count += records.length;
      });
      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
      for (let frame = 0; frame < 30; frame++)
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
      count += observer.takeRecords().length;
      observer.disconnect();
      return count;
    });
  expect(mutations).toBe(0);
  await page.screenshot({ path: "test-results/beginner-keyboard.png" });
});
test("virtual controller can dismiss, disable, replay and reach existing journal and inventory", async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 800 });
  await installVirtualController(page, "Xbox 360 Controller");
  await create(page, "Pad Trail");
  await page.locator("#combat-world").focus();
  // Switch input source without moving or completing the first hint.
  await pressVirtualButton(page, 11);
  await expect(page.locator("#beginner-hint-message")).toContainText(
    "left stick",
  );
  await pressVirtualButton(page, 9);
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await pressVirtualButton(page, 13);
  await expect(page.locator("#player-settings")).toBeFocused();
  await pressVirtualButton(page, 0);
  await pressVirtualButton(page, 13); // back -> enabled
  await expect(page.locator("#beginner-enabled")).toBeFocused();
  await pressVirtualButton(page, 13);
  await expect(page.locator("#beginner-settings-dismiss")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#beginner-settings-status")).toHaveText(
    "Current hint dismissed.",
  );
  await pressVirtualButton(page, 12);
  await pressVirtualButton(page, 0);
  await expect(page.locator("#beginner-enabled")).not.toBeChecked();
  await pressVirtualButton(page, 13);
  await pressVirtualButton(page, 13);
  await expect(page.locator("#beginner-replay")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#beginner-enabled")).toBeChecked();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#player-settings")).toBeFocused();
  for (let i = 0; i < 2; i++) await pressVirtualButton(page, 13);
  await expect(page.locator("#player-inventory")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  await pressVirtualButton(page, 1);
  await pressVirtualButton(page, 9);
  for (let i = 0; i < 4; i++) await pressVirtualButton(page, 13);
  await expect(page.locator("#player-journal")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-journal")).toBeVisible();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#beginner-hint")).toHaveAttribute(
    "data-hint",
    "movement",
  );
  await page.screenshot({ path: "test-results/beginner-controller.png" });
});
