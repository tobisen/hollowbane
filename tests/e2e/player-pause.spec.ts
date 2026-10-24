import { expect, test, type Page } from "@playwright/test";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  allocateSkillRanks,
  assignSkill,
} from "../../src/simulation/skill-progression";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function play(page: Page, world: boolean) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const session = characterSlotFixture();
  if (!world) {
    delete session.exploration;
    session.progression = {
      ...session.progression!,
      skills: assignSkill(
        allocateSkillRanks(
          session.progression!.skills,
          session.character.level,
          { "warrior-resolve-foundation": 1 },
        ),
        2,
        "oath-echo",
      ),
    };
  }
  const id = await page.evaluate(async (text) => {
    const storage = new window.characterStorageModule.CharacterStorage();
    try {
      return (
        await storage.create(
          "Pause contract",
          window.characterStorageModule.deserializeCharacter(text),
        )
      ).id;
    } finally {
      storage.close();
    }
  }, serializeCharacter(session));
  await page.goto(
    `?${world ? "world=1" : "inventory=1&advanced=1"}&character=${id}`,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat?.tick ?? 0))
    .toBeGreaterThan(3);
}
async function renderFrames(page: Page, frames = 12) {
  await page.evaluate(
    (frames) =>
      new Promise<void>((resolve) => {
        let count = 0;
        const frame = () => {
          if (++count >= frames) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    frames,
  );
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const c = window.hollowbaneCombat!;
    return {
      tick: c.tick,
      actors: c.actors,
      projectiles: c.projectiles,
      events: c.events,
      users: window.hollowbaneSkills?.users,
      statuses: window.hollowbaneSkills?.statuses,
      bolts: window.hollowbaneSkills?.bolts,
    };
  });
}

test("pause freezes real combat, resources and committed timing while Escape and the UI remain responsive", async ({
  page,
}) => {
  await play(page, false);
  await page.locator("#combat-world").focus();
  // Latch the actual committed cast at a render boundary through the ordinary UI.
  // A fixed mouse coordinate cannot follow the live, moving enemy.
  await page.evaluate(() => {
    let frames = 0;
    const observe = () => {
      if (window.hollowbaneSkills?.users.find((user) => user.actor === 0)?.cast)
        document
          .querySelector<HTMLButtonElement>("#player-pause-open")!
          .click();
      else if (++frames < 240) requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  });
  await page.keyboard.press("Digit1");
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.paused))
    .toBe(true);
  const before = await snapshot(page);
  expect(before.actors.length).toBeGreaterThan(1);
  expect(before.users?.find((user) => user.actor === 0)?.cast).toBeTruthy();
  await renderFrames(page);
  expect(await snapshot(page)).toEqual(before);
  await expect(page.locator("#player-resume")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#player-settings")).toBeFocused();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-a-combat-paused.png",
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#player-pause-dialog")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
    .toBeGreaterThan(before.tick);
  await renderFrames(page, 36);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.sequence),
  ).toBe(before.actors[0]!.sequence);
});

test("virtual Menu respects inventory, settings cancel returns to pause, and resumed movement has no held-input leak", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox standard controller");
  await play(page, true);
  await pressVirtualButton(page, 9);
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await expect(page.locator("#controller-menu")).not.toBeVisible();
  await pressVirtualButton(page, 13);
  await pressVirtualButton(page, 0);
  await expect(page.locator("#controller-settings-form")).toBeVisible();
  await pressVirtualButton(page, 1);
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await expect(page.locator("#player-settings")).toBeFocused();
  expect(await page.evaluate(() => window.hollowbaneCombat!.paused)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#player-pause-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  await pressVirtualButton(page, 9);
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  await expect(page.locator("#player-pause-dialog")).not.toBeVisible();
  await page.locator("#inventory-close").click();
  await page.locator("#combat-world").focus();
  const start = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.keyboard.down("d");
  await expect
    .poll(() =>
      page.evaluate(
        (p) =>
          Math.hypot(
            window.hollowbaneWorld!.position.x - p.x,
            window.hollowbaneWorld!.position.y - p.y,
          ),
        start,
      ),
    )
    .toBeGreaterThan(0.15);
  await page.keyboard.press("Escape");
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await page.keyboard.up("d");
  const paused = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.locator("#player-resume").click();
  await renderFrames(page);
  expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
    paused,
  );
  expect(await page.evaluate(() => window.hollowbaneCombat!.paused)).toBe(
    false,
  );
});
