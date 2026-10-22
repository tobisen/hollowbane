import { expect, test } from "@playwright/test";
import {
  createD08CampaignFixture,
  fightD08Finale,
} from "../fixtures/d08-campaign";
import { loadD06Checkpoint } from "./d06-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import {
  driveQuestPoint,
  followQuestPath,
  neutralQuestController,
} from "./quest-world-input";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import { CRYPT_FINALE_ACTOR } from "../../src/simulation/world-encounters";
import { CRYPT_BOSS_XP } from "../../src/simulation/crypt-boss";
import { ACT1_FINALE, QUESTS } from "../../src/simulation/quests";
import {
  deserializeCharacter,
  serializeCharacter,
} from "../../src/simulation/inventory-save";

// Immutable fixture text only; each browser context owns its real IndexedDB.
let checkpoints: { fight: string; returning: string; camp: string };
test.beforeAll(() => {
  const f = createD08CampaignFixture();
  const fight = f.checkpoint().text;
  fightD08Finale(f);
  // Construct a post-fight return checkpoint at the already visited beacon.
  // The other case verifies the live browser fight; no live state is mutated.
  f.idleAt(f.session.travel.layout.spawn);
  const returning = f.checkpoint().text;
  f.travel("graveyard");
  f.travel("forest");
  f.travel("camp");
  f.idleAt({ x: 1.75, y: 1.25 });
  checkpoints = { fight, returning, camp: f.checkpoint().text };
});

test("campaign finale genuine mouse fight persists Sevra defeat and never grants another kill reward on reload", async ({
  page,
}, testInfo) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.fight);
  await expect(page.locator("#boss-name")).toHaveText("Sevra, the Vaultbound");
  await page.keyboard.press("r");
  const path = await page.evaluate(
    (id) => window.hollowbaneWorld!.routeToHostile!(id),
    CRYPT_FINALE_ACTOR,
  );
  const aim = () =>
    page.evaluate((id) => {
      const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
        c = window.hollowbaneWorld!.camera;
      const x = (a.x - c.x) * c.zoom,
        y = (a.y - 28 - c.y) * c.zoom;
      return {
        x,
        y,
        visible: !!document.elementFromPoint(x, y)?.closest("#combat-world"),
      };
    }, CRYPT_FINALE_ACTOR);
  for (const p of path) {
    if ((await aim()).visible) break;
    await driveQuestPoint(page, p);
  }
  await neutralQuestController(page);
  const point = await aim();
  expect(point.visible).toBe(true);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.phase), {
        timeout: 25000,
      })
      .toBe(1);
    await page.screenshot({
      path: testInfo.outputPath("campaign-sevra-phase-two.png"),
    });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.complete), {
        timeout: 25000,
      })
      .toBe(true);
  } finally {
    await page.mouse.up();
  }
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      (id) =>
        window.hollowbaneCombat!.events.some(
          (e) => e.kind === "death" && e.actor === 0 && e.target === id,
        ),
      CRYPT_FINALE_ACTOR,
    ),
  ).toBe(true);
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge"),
    prior = deserializeCharacter(checkpoints.fight);
  expect(saved.progression!.character.totalXp).toBe(
    prior.progression!.character.totalXp + CRYPT_BOSS_XP,
  );
  expect(saved.loot.sequence).toBe(prior.loot.sequence + 1);
  expect(saved.exploration!.quests!.entries.at(-1)).toMatchObject({
    id: ACT1_FINALE,
    status: "ready",
    seen: [[String(CRYPT_FINALE_ACTOR)]],
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ancient-crypt");
  expect(
    await page.evaluate(
      (id) => window.hollowbaneCombat!.actors.some((a) => a.id === id),
      CRYPT_FINALE_ACTOR,
    ),
  ).toBe(false);
  await page.keyboard.press("j");
  await expect(page.locator("#quest-status")).toHaveText("Status: ready");
  const restored = await readWorldCheckpoint(page, "ashen-refuge");
  expect(restored.progression).toEqual(saved.progression);
  expect(restored.loot.sequence).toBe(saved.loot.sequence);
});

test.describe.serial("persisted campaign return journey", () => {
  let returning: string;
  test.beforeAll(() => {
    returning = checkpoints.returning;
  });
  for (const [source, exit, destination] of [
    ["ancient-crypt", "graveyard", "forgotten-graveyard"],
    ["forgotten-graveyard", "forest", "haunted-forest"],
    ["haunted-forest", "camp", "ashen-refuge"],
  ] as const)
    test(`campaign finale safe return ${source} to ${destination} preserves the chained checkpoint`, async ({
      page,
    }, testInfo) => {
      // Each leg starts from the preceding leg's actual browser save. This keeps
      // every route and state assertion inside the unchanged per-case deadline.
      await installVirtualController(page, "Xbox 360 Controller");
      await loadD06Checkpoint(page, returning);
      await page.keyboard.press("r");
      expect(await page.evaluate(() => window.hollowbaneWorld!.area)).toBe(
        source,
      );
      // Finish each turn closely before changing direction around graveyard props.
      await followQuestPath(page, "exit", exit, 0.01);
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
        .toBe(destination);
      expect(
        await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
      ).toBeGreaterThan(0);
      await saveWorldCheckpoint(page);
      const saved = await readWorldCheckpoint(page, "ashen-refuge"),
        prior = deserializeCharacter(checkpoints.returning);
      expect(saved.progression).toEqual(prior.progression);
      expect(saved.character).toEqual(prior.character);
      expect(saved.exploration!.quests).toEqual(prior.exploration!.quests);
      expect(saved.exploration!.containers).toEqual(
        prior.exploration!.containers,
      );
      expect(saved.loot.sequence).toBe(prior.loot.sequence);
      expect(saved.exploration!.area).toBe(destination);
      returning = serializeCharacter(saved);
      await page.screenshot({
        path: testInfo.outputPath(`campaign-safe-return-${destination}.png`),
      });
    });
});

test("campaign finale controller conclusion claim preserves one-time rewards, dialogue and save ownership", async ({
  page,
}, testInfo) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.camp);
  await followQuestPath(page, "npc", "edda-vey");
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-dialogue")).toBeVisible();
  await page.locator("#camp-quest-journal").click();
  await expect(page.locator("#quest-title")).toHaveText("A Lantern Unbound");
  await expect(page.locator('[data-quest-action="claim"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-status")).toHaveText(
    "Status: claimed · Act 1 complete",
  );
  await expect(page.locator("#quest-feedback")).toContainText(
    "Reward claimed.",
  );
  await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("campaign-conclusion-reward.png"),
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speech")).toContainText("Act 1 complete.");
  await page.screenshot({
    path: testInfo.outputPath("campaign-edda-conclusion.png"),
  });
  await page.keyboard.press("Escape");
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge"),
    prior = deserializeCharacter(checkpoints.camp),
    reward = QUESTS.find((q) => q.id === ACT1_FINALE)!.reward;
  expect(saved.progression!.character.totalXp).toBe(
    prior.progression!.character.totalXp + reward.xp,
  );
  expect(saved.exploration!.containers!.gold).toBe(
    prior.exploration!.containers!.gold + reward.gold,
  );
  expect(saved.loot.drops).toHaveLength(1);
  expect(saved.character).toEqual(prior.character);
  expect(saved.loot.sequence).toBe(prior.loot.sequence);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  await page.keyboard.press("j");
  // A claimed finale is no longer tracked; choose the last Act 1 entry.
  for (
    let i = 0;
    i < 4 &&
    (await page.locator("#quest-title").textContent()) !== "A Lantern Unbound";
    i++
  )
    await page.locator("#quest-next").click();
  await expect(page.locator("#quest-status")).toHaveText(
    "Status: claimed · Act 1 complete",
  );
  await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
  const restored = await readWorldCheckpoint(page, "ashen-refuge");
  expect(restored.progression).toEqual(saved.progression);
  expect(restored.loot).toEqual(saved.loot);
  expect(restored.exploration!.containers).toEqual(
    saved.exploration!.containers,
  );
  await page.keyboard.press("Escape");
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speech")).toContainText("Act 1 complete.");
});
