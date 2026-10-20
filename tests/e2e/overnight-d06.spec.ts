import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import {
  followQuestPath,
  driveQuestPoint,
  neutralQuestController,
  prepareEarnedQuestWarrior,
} from "./quest-world-input";
import { loadD06Checkpoint } from "./d06-checkpoint";
import { createD06Checkpoints } from "../fixtures/d06-campaign";
import { deserializeCharacter } from "../../src/simulation/inventory-save";

// Share immutable fixture text only. Each test still owns a fresh browser
// context and its own IndexedDB; no mutable campaign state crosses tests.
const checkpoints = (() => {
  const generated = createD06Checkpoints();
  return Object.freeze({
    firstReady: generated.firstReady,
    secondReady: generated.secondReady,
    thirdReady: generated.thirdReady,
    forestNavigation: generated.forestNavigation,
    forestReturn: generated.forestReturn,
    graveyard: generated.graveyard,
    cryptBeacon: generated.cryptBeacon,
  });
})();

async function travel(page: Page, source: string, exit: string) {
  await followQuestPath(page, "exit", exit);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .not.toBe(source);
}
async function journal(page: Page) {
  await page.keyboard.press("j");
  await expect(page.locator("#quest-journal")).toBeVisible();
}
async function close(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.locator("#combat-world")).toBeFocused();
}
async function claim(page: Page, npc: string, title: string) {
  await followQuestPath(page, "npc", npc);
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-dialogue")).toBeVisible();
  await page.locator("#camp-quest-journal").click();
  await expect(page.locator("#quest-title")).toHaveText(title);
  await expect(page.locator("#quest-status")).toHaveText("Status: ready");
  await expect(page.locator('[data-quest-action="claim"]')).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#quest-status")).toHaveText("Status: claimed");
  await expect(page.locator("#quest-feedback")).toContainText(
    "Reward claimed.",
  );
  await close(page);
}

test("forest navigation rearms after UI ownership and reaches the graveyard from a cleared checkpoint", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.forestNavigation);
  await page.keyboard.press("r");
  // Real UI ownership handoff used to leave held axes permanently unarmed.
  await page.locator('[data-skill="0"]').click();
  const point = await page.evaluate(() => {
    const w = window.hollowbaneWorld!,
      to = w.routeToExit!("graveyard")[0]!;
    const d = Math.hypot(to.x - w.position.x, to.y - w.position.y),
      scale = Math.min(1, 0.6 / d);
    return {
      x: w.position.x + (to.x - w.position.x) * scale,
      y: w.position.y + (to.y - w.position.y) * scale,
    };
  });
  await driveQuestPoint(page, point);
  await neutralQuestController(page);
  expect(await page.evaluate(() => window.hollowbaneInput!.armed)).toBe(true);
  expect(await page.evaluate(() => window.virtualPads[0]!.axes)).toEqual([
    0, 0, 0, 0,
  ]);
  await travel(page, "haunted-forest", "graveyard");
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.progression).toEqual(
    deserializeCharacter(checkpoints.forestNavigation).progression,
  );
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
});

test("forest return checkpoint preserves navigation through graveyard, forest and camp", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.forestReturn);
  await page.keyboard.press("r");
  await travel(page, "forgotten-graveyard", "forest");
  await travel(page, "haunted-forest", "camp");
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.progression).toEqual(
    deserializeCharacter(checkpoints.forestReturn).progression,
  );
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
});

test("earned Warrior defeats Stonebound through real browser targeting and normal hostile AI", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, checkpoints.graveyard);
  await expect(page.locator('[data-skill="0"] .slot-name')).toHaveText(
    "Sundering Fan",
  );
  expect(
    await page.evaluate(
      () => window.hollowbaneCombat!.actors.find((a) => a.id === 3010)?.hp,
    ),
  ).toBe(248);
  await page.keyboard.press("r");
  const path = await page.evaluate(() => {
    const w = window.hollowbaneWorld!;
    let from = w.position;
    return w.routeToHostile!(3010).flatMap((to) => {
      const n = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 1.5);
      const points = Array.from({ length: n }, (_, i) => ({
        x: from.x + ((to.x - from.x) * (i + 1)) / n,
        y: from.y + ((to.y - from.y) * (i + 1)) / n,
      }));
      from = to;
      return points;
    });
  });
  const aim = () =>
    page.evaluate(() => {
      const w = window.hollowbaneWorld!,
        c = w.camera,
        a = window.hollowbaneCombat!.actors.find((a) => a.id === 3010)!;
      const x = (a.x - c.x) * c.zoom,
        y = (a.y - 28 - c.y) * c.zoom;
      return {
        x,
        y,
        visible: !!document.elementFromPoint(x, y)?.closest("#combat-world"),
      };
    });
  for (const point of path) {
    if ((await aim()).visible) break;
    await driveQuestPoint(page, point);
  }
  await neutralQuestController(page);
  const target = await aim();
  expect(target.visible).toBe(true);
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  try {
    // One held attack delegates approach, range, LOS and repeat timing to the game.
    await expect
      .poll(
        async () => {
          const state = await page.evaluate(() => ({
            player: window.hollowbaneCombat!.actors[0]!,
            target: window.hollowbaneCombat!.actors.find((a) => a.id === 3010)!,
          }));
          expect(state.player.hp).toBeGreaterThan(0);
          return state.target.hp;
        },
        { timeout: 25000, intervals: [30] },
      )
      .toBe(0);
  } finally {
    await page.mouse.up();
  }
  const combat = await page.evaluate(() => window.hollowbaneCombat!);
  expect(
    combat.events.some(
      (e) =>
        e.kind === "death" &&
        e.actor === 0 &&
        "target" in e &&
        e.target === 3010,
    ),
  ).toBe(true);
  expect(
    combat.events.some(
      (e) =>
        e.kind === "damage" &&
        e.actor === 3010 &&
        e.target === 0 &&
        e.result.amount > 0,
    ),
  ).toBe(true);
  expect(combat.actors[0]!.hp).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/d06-stonebound.png" });
});

const campaignReturns = [
  {
    checkpoint: "firstReady",
    npc: "edda-vey",
    title: "Embers on the Road",
    xp: 80,
    gold: 25,
  },
  {
    checkpoint: "secondReady",
    npc: "orren-thale",
    title: "Names Beneath the Ash",
    xp: 150,
    gold: 40,
  },
  {
    checkpoint: "thirdReady",
    npc: "edda-vey",
    title: "The Light Below",
    xp: 220,
    gold: 60,
  },
] as const;
for (const [index, stage] of campaignReturns.entries()) {
  test(`constructed campaign return ${index + 1} preserves ${stage.title} rewards, equipment, progression and duplicate prevention`, async ({
    page,
  }) => {
    const text = checkpoints[stage.checkpoint];
    await installVirtualController(page, "Xbox 360 Controller");
    const before = deserializeCharacter(text);
    await loadD06Checkpoint(page, text);
    await claim(page, stage.npc, stage.title);
    if (index === 0) {
      await expect(page.locator(".loot-label")).toHaveCount(1);
      await page.locator(".loot-label").click();
      await expect(page.locator(".loot-label")).toHaveCount(0);
      await page.locator("#inventory-open").click();
      await page.locator("#inventory-grid button[data-item]").first().click();
      if (await page.locator("#inventory-identify").isEnabled())
        await page.locator("#inventory-identify").click();
      await page.locator("#inventory-equip").click();
      await prepareEarnedQuestWarrior(page);
      await page.locator("#inventory-close").click();
      await expect(page.locator('[data-skill="0"] .slot-name')).toHaveText(
        "Sundering Fan",
      );
    }
    await saveWorldCheckpoint(page);
    const claimed = await readWorldCheckpoint(page, "ashen-refuge");
    expect(claimed.progression!.character.totalXp).toBe(
      before.progression!.character.totalXp + stage.xp,
    );
    expect(claimed.exploration!.containers!.gold).toBe(
      before.exploration!.containers!.gold + stage.gold,
    );
    expect(claimed.progression!.skills.classId).toBe("warrior");
    expect(claimed.character.equipment.boots?.base).toBe("trail-boots");
    expect(claimed.progression!.skills.ranks["warrior-arms-foundation"]).toBe(
      1,
    );
    expect(claimed.exploration!.quests!.entries.map((e) => e.status)).toEqual(
      Array.from({ length: index + 1 }, () => "claimed"),
    );
    await page.reload();
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint restored.",
    );
    await journal(page);
    await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
    const loaded = await readWorldCheckpoint(page, "ashen-refuge");
    expect(loaded.progression).toEqual(claimed.progression);
    expect(loaded.character).toEqual(claimed.character);
    expect(loaded.loot).toEqual(claimed.loot);
    expect(loaded.exploration!.quests).toEqual(claimed.exploration!.quests);
    if (index === 2) {
      expect(loaded.exploration!.expedition).toMatchObject({
        stage: "complete",
        reward: "claimed",
      });
      expect(loaded.progression!.character.totalXp).toBeGreaterThanOrEqual(700);
      await page.screenshot({ path: "test-results/d06-camp-report.png" });
    }
  });
}

test("crypt checkpoint attunes the real beacon once and preserves its reward through reload", async ({
  page,
}) => {
  const text = checkpoints.cryptBeacon,
    before = deserializeCharacter(text);
  await installVirtualController(page, "Xbox 360 Controller");
  await loadD06Checkpoint(page, text);
  expect(await page.evaluate(() => window.hollowbaneWorld!.area)).toBe(
    "ancient-crypt",
  );
  await expect(page.locator(".world-minimap output")).toContainText("◉ beacon");
  await page.keyboard.press("e");
  await expect(page.locator("#expedition-status")).toHaveText(
    "Beacon attuned · +250 XP · +120 gold. Return through graveyard → forest → camp to finish.",
  );
  await page.screenshot({ path: "test-results/d06-crypt-objective.png" });
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.exploration!.expedition).toMatchObject({
    stage: "returning",
    reward: "claimed",
  });
  expect(saved.progression!.character.totalXp).toBe(
    before.progression!.character.totalXp + 250,
  );
  expect(saved.exploration!.containers!.gold).toBe(
    before.exploration!.containers!.gold + 120,
  );
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.keyboard.press("e");
  await saveWorldCheckpoint(page);
  const repeated = await readWorldCheckpoint(page, "ashen-refuge");
  expect(repeated.progression).toEqual(saved.progression);
  expect(repeated.loot).toEqual(saved.loot);
  expect(repeated.exploration!.quests).toEqual(saved.exploration!.quests);
  expect(repeated.exploration!.containers!.gold).toBe(
    saved.exploration!.containers!.gold,
  );
});
test("NPC road briefing opens the chapter journal without accepting quests or granting rewards", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await followQuestPath(page, "npc", "edda-vey");
  await pressVirtualButton(page, 0);
  await page
    .getByRole("button", { name: "Tell me about the unlit road.", exact: true })
    .click();
  await expect(page.locator("#camp-speech")).toContainText(
    "The missing followed three signs",
  );
  await page.screenshot({ path: "test-results/d06-edda-road.png" });
  await page.locator("#camp-quest-journal").click();
  await expect(page.locator("#camp-dialogue")).not.toBeVisible();
  await expect(page.locator("#quest-title")).toHaveText("Embers on the Road");
  await expect(page.locator("#quest-act1")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#quest-status")).toHaveText("Status: available");
  await close(page);
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.exploration!.quests).toEqual({
    version: 1,
    tracked: null,
    entries: [],
  });
  expect(saved.progression!.character.totalXp).toBe(0);
  expect(saved.exploration!.containers!.gold).toBe(0);
});

test("fresh context chooses a discipline and accepts only the unlocked chapter quest", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await page.locator("#inventory-open").click();
  await page.locator("#skill-tree-toggle").click();
  await page.locator("#skill-choose-class").click();
  await page.locator("#skill-confirm").click();
  await page.locator("#inventory-close").click();
  await journal(page);
  await expect(page.locator("#quest-title")).toHaveText("Embers on the Road");
  await page.locator("#quest-next").click();
  await expect(page.locator("#quest-status")).toHaveText("Status: locked");
  await page.locator("#quest-previous").click();
  await page.getByRole("button", { name: "Accept quest", exact: true }).click();
  await expect(page.locator("#quest-status")).toHaveText("Status: active");
  await page.screenshot({ path: "test-results/d06-forest-briefing.png" });
  await close(page);
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.progression!.skills.classId).toBe("warrior");
  expect(saved.progression!.character.totalXp).toBe(0);
  expect(saved.exploration!.quests!.entries.map((e) => e.status)).toEqual([
    "active",
  ]);
});
