import { expect, test, type Page } from "@playwright/test";
import { createD07MinibossCheckpoint } from "../fixtures/d07-miniboss";
import { loadD06Checkpoint } from "./d06-checkpoint";
import {
  driveQuestPoint,
  neutralQuestController,
  prepareEarnedQuestWarrior,
} from "./quest-world-input";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import { deserializeCharacter } from "../../src/simulation/inventory-save";
import { CAIRNWARDEN_XP } from "../../src/simulation/stonebound-miniboss";

const fixture = createD07MinibossCheckpoint();
async function approach(page: Page) {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, fixture.text);
  await prepareEarnedQuestWarrior(page);
  // The approach already uses a virtual stick. Sample Run on that same device
  // after inventory closes, rather than racing keyboard/controller ownership.
  await pressVirtualButton(page, 10);
  const path = await page.evaluate(
    (id) => window.hollowbaneWorld!.routeToHostile!(id),
    fixture.id,
  );
  const aim = () =>
    page.evaluate((id) => {
      const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!;
      const c = window.hollowbaneWorld!.camera;
      const x = (a.x - c.x) * c.zoom,
        y = (a.y - 28 - c.y) * c.zoom;
      return {
        x,
        y,
        visible: !!document.elementFromPoint(x, y)?.closest("#combat-world"),
      };
    }, fixture.id);
  for (const p of path) {
    await driveQuestPoint(page, p);
  }
  await neutralQuestController(page);
  const target = await aim();
  expect(target.visible).toBe(true);
  return target;
}

test("Cairnwarden real mouse fight changes phase, records one reward and stays defeated after reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = deserializeCharacter(fixture.text);
  await approach(page);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneBoss?.state.events.some((e) => e.kind === "strike"),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  // Sample the current camera/actor after the real windup/strike, before attacking.
  const target = await page.evaluate((id) => {
    const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
      c = window.hollowbaneWorld!.camera;
    return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
  }, fixture.id);
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  try {
    await expect(page.locator("#boss-name")).toHaveText("Cairnwarden Rhusk");
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss?.state.phase), {
        timeout: 25000,
      })
      .toBe(1);
    await expect(page.locator("#boss-phase")).toContainText(
      "The binding breaks",
    );
    await page.screenshot({
      path: testInfo.outputPath("cairnwarden-phase-two.png"),
    });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss?.state.complete), {
        timeout: 25000,
      })
      .toBe(true);
  } finally {
    await page.mouse.up();
  }
  await expect(page.locator("#boss-phase")).toHaveText("Encounter complete");
  const combat = await page.evaluate(() => window.hollowbaneCombat!);
  expect(combat.actors[0]!.hp).toBeGreaterThan(0);
  expect(
    combat.events.some(
      (e) =>
        e.kind === "damage" &&
        e.actor === fixture.id &&
        e.target === 0 &&
        e.result.amount > 0,
    ),
  ).toBe(true);
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.progression!.character.totalXp).toBe(
    before.progression!.character.totalXp + CAIRNWARDEN_XP,
  );
  expect(
    saved.exploration!.areas.find((a) => a.id === "forgotten-graveyard")!
      .deaths,
  ).toContain(fixture.id);
  expect(saved.exploration!.quests).toEqual(before.exploration!.quests);
  expect(saved.loot.sequence).toBe(before.loot.sequence + 1);
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  expect(
    await page.evaluate(
      (id) => window.hollowbaneCombat!.actors.some((a) => a.id === id),
      fixture.id,
    ),
  ).toBe(false);
  await saveWorldCheckpoint(page);
  const repeated = await readWorldCheckpoint(page, "ashen-refuge");
  expect(repeated.progression).toEqual(saved.progression);
  expect(repeated.loot).toEqual(saved.loot);
  expect(repeated.exploration!.quests).toEqual(saved.exploration!.quests);
  expect(errors).toEqual([]);
});

test("virtual controller locks and damages the campaign miniboss with the normal assigned skill", async ({
  page,
}, testInfo) => {
  await approach(page);
  await page.locator("#combat-world").focus();
  await pressVirtualButton(page, 11);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(fixture.id);
  await expect
    .poll(() => page.evaluate(() => !!window.hollowbaneBoss?.state.telegraph), {
      timeout: 15000,
    })
    .toBe(true);
  await expect(page.locator("#boss-warning")).not.toBeEmpty();
  await page.screenshot({
    path: testInfo.outputPath("cairnwarden-warning.png"),
  });
  await pressVirtualButton(page, 0);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneBoss?.health), {
      timeout: 15000,
    })
    .toBeLessThan(360);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
});
