import { expect, test, type Page } from "@playwright/test";
import {
  CLASS_IDS,
  type ClassId,
} from "../../src/simulation/character-classes";
import { createD14Fixture } from "../fixtures/d14-campaign";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../../src/simulation/inventory-save";
import { CRYPT_FINALE_ACTOR } from "../../src/simulation/world-encounters";
import { CRYPT_BOSS_XP } from "../../src/simulation/crypt-boss";
import { ACT1_FINALE, QUESTS } from "../../src/simulation/quests";
import {
  merchantItem,
  merchantSalePrice,
} from "../../src/simulation/camp-merchant-state";
import { loadD06Checkpoint } from "./d06-checkpoint";
import { readWorldCheckpoint, saveWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import {
  driveQuestPoint,
  followQuestPath,
  neutralQuestController,
} from "./quest-world-input";

const initial = {} as Record<ClassId, string>,
  fought = {} as Record<ClassId, string>,
  completed = {} as Record<ClassId, string>;
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
async function openOrren(
  page: Page,
  action: "camp-merchant-open" | "camp-stash-open",
) {
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  await page.locator(`#${action}`).click();
}
async function lastQuest(page: Page) {
  await page.keyboard.press("j");
  for (
    let n = 0;
    n < 4 &&
    (await page.locator("#quest-title").textContent()) !== "A Lantern Unbound";
    n++
  )
    await page.locator("#quest-next").click();
}

// Every leg consumes the preceding actual browser save in a fresh context. This
// follows the existing resource-restart policy, not uninterrupted pack survival.
test.describe.serial("Act1 release persisted three-class campaign", () => {
  test.beforeAll(() => {
    for (const id of CLASS_IDS)
      initial[id] = createD14Fixture(id).checkpoint().text;
  });
  for (const id of CLASS_IDS) {
    test(`Act1 release ${id} defeats the real finale through both phases and saves one kill reward`, async ({
      page,
    }, info) => {
      await installVirtualController(page, "Xbox 360 Controller");
      await loadD06Checkpoint(page, initial[id]);
      const before = deserializeCharacter(initial[id]);
      await expect(page.locator("#boss-name")).toHaveText(
        "Sevra, the Vaultbound",
      );
      await page.keyboard.press("r");
      const path = await page.evaluate(
        (id) => window.hollowbaneWorld!.routeToHostile!(id),
        CRYPT_FINALE_ACTOR,
      );
      const aim = () =>
        page.evaluate((id) => {
          const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
            c = window.hollowbaneWorld!.camera,
            x = (a.x - c.x) * c.zoom,
            y = (a.y - 28 - c.y) * c.zoom;
          return {
            x,
            y,
            visible: !!document
              .elementFromPoint(x, y)
              ?.closest("#combat-world"),
          };
        }, CRYPT_FINALE_ACTOR);
      for (const p of path) {
        if ((await aim()).visible) break;
        await driveQuestPoint(page, p);
      }
      await neutralQuestController(page);
      const p = await aim();
      expect(p.visible).toBe(true);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      try {
        await expect
          .poll(() => page.evaluate(() => window.hollowbaneBoss!.state.phase), {
            timeout: 25000,
          })
          .toBe(1);
        await expect
          .poll(
            () => page.evaluate(() => window.hollowbaneBoss!.state.complete),
            { timeout: 25000 },
          )
          .toBe(true);
      } finally {
        await page.mouse.up();
      }
      expect(
        await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
      ).toBeGreaterThan(0);
      await expect(page.locator("#combat-log")).toContainText(
        "Return safely to Edda Vey",
      );
      await page.screenshot({
        path: info.outputPath(`release-${id}-finale.png`),
      });
      await saveWorldCheckpoint(page);
      const saved = await readWorldCheckpoint(page, "ashen-refuge");
      expect(saved.progression!.skills.classId).toBe(id);
      expect(saved.progression!.character.totalXp).toBe(
        before.progression!.character.totalXp + CRYPT_BOSS_XP,
      );
      expect(saved.loot.sequence).toBe(before.loot.sequence + 1);
      expect(saved.exploration!.quests!.entries.at(-1)).toMatchObject({
        id: ACT1_FINALE,
        status: "ready",
        seen: [[String(CRYPT_FINALE_ACTOR)]],
      });
      expect(saved.exploration!.waypoints).toEqual(
        before.exploration!.waypoints,
      );
      fought[id] = serializeCharacter(saved);
    });
    test(`Act1 release ${id} walks back to the saved waypoint returns claims once and reloads campaign completion`, async ({
      page,
    }, info) => {
      await installVirtualController(page, "Xbox 360 Controller");
      await loadD06Checkpoint(page, fought[id]);
      const before = deserializeCharacter(fought[id]),
        reward = QUESTS.find((q) => q.id === ACT1_FINALE)!.reward;
      expect(
        await page.evaluate(
          (id) => window.hollowbaneCombat!.actors.some((a) => a.id === id),
          CRYPT_FINALE_ACTOR,
        ),
      ).toBe(false);
      await page.keyboard.press("r");
      const path = await page.evaluate(() =>
        window.hollowbaneWorld!.routeToWaypoint!(),
      );
      for (const p of path) await driveQuestPoint(page, p);
      await neutralQuestController(page);
      if (id === "ranger") {
        await pressVirtualButton(page, 9);
        await expect(page.locator("#controller-menu")).toBeVisible();
        await down(page);
        await down(page);
        await pressVirtualButton(page, 0);
        await expect(page.locator("#world-waypoints")).toBeVisible();
        await expect(
          page.locator('[data-destination="ashen-refuge"]'),
        ).toBeFocused();
        await pressVirtualButton(page, 0);
        await pressVirtualButton(page, 0);
      } else {
        await page.keyboard.press("n");
        await page.locator('[data-destination="ashen-refuge"]').click();
        await page.locator("#waypoint-confirm").click();
      }
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
        .toBe("ashen-refuge");
      if (id === "ranger") await pressVirtualButton(page, 1);
      else await page.keyboard.press("Escape");
      await expect(page.locator("#combat-world")).toBeFocused();
      await followQuestPath(page, "npc", "edda-vey");
      await page.keyboard.press("e");
      await expect(page.locator("#camp-speaker")).toHaveText("Edda Vey");
      await page.locator("#camp-quest-journal").click();
      await expect(page.locator("#quest-title")).toHaveText(
        "A Lantern Unbound",
      );
      await expect(page.locator('[data-quest-action="claim"]')).toBeFocused();
      if (id === "ranger") await pressVirtualButton(page, 0);
      else await page.keyboard.press("Enter");
      await expect(page.locator("#quest-status")).toHaveText(
        "Status: claimed · Act 1 complete",
      );
      await page.screenshot({
        path: info.outputPath(`release-${id}-completion.png`),
      });
      await page.keyboard.press("Escape");
      await saveWorldCheckpoint(page);
      const saved = await readWorldCheckpoint(page, "ashen-refuge");
      expect(saved.progression!.skills.classId).toBe(id);
      expect(saved.progression!.character.totalXp).toBe(
        before.progression!.character.totalXp + reward.xp,
      );
      expect(saved.exploration!.containers!.gold).toBe(
        before.exploration!.containers!.gold + reward.gold,
      );
      expect(saved.loot.sequence).toBe(before.loot.sequence);
      expect(saved.character).toEqual(before.character);
      expect(saved.exploration!.waypoints!.revision).toBe(3);
      await page.reload();
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
        .toBe("ashen-refuge");
      await lastQuest(page);
      await expect(page.locator("#quest-status")).toHaveText(
        "Status: claimed · Act 1 complete",
      );
      await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
      const loaded = await readWorldCheckpoint(page, "ashen-refuge");
      expect(loaded.progression).toEqual(saved.progression);
      expect(loaded.loot).toEqual(saved.loot);
      completed[id] = serializeCharacter(loaded);
    });
  }
  test("Act1 release completed character buys stores reloads retrieves sells and retains completion without duplication", async ({
    page,
  }, info) => {
    await installVirtualController(page, "Xbox 360 Controller");
    await loadD06Checkpoint(page, completed.warrior);
    const before = deserializeCharacter(completed.warrior),
      gold = before.exploration!.containers!.gold,
      item = merchantItem("ash-blade");
    await driveQuestPoint(page, { x: 1, y: 3 });
    await neutralQuestController(page);
    await openOrren(page, "camp-merchant-open");
    const offer = page.locator(
      '[data-trade-kind="buy"][data-item="ash-blade"]',
    );
    await offer.click();
    await page.locator("#merchant-confirm").click();
    await expect
      .poll(
        async () =>
          (await readWorldCheckpoint(page, "ashen-refuge")).exploration!
            .merchant?.revision,
      )
      .toBe(1);
    await page.locator("#merchant-close").click();
    await openOrren(page, "camp-stash-open");
    await page.locator('[data-stash-action="store"]').click();
    await page.locator("#stash-confirm").click();
    await expect
      .poll(
        async () =>
          (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.stash
            ?.revision,
      )
      .toBe(1);
    const stored = await readWorldCheckpoint(page, "ashen-refuge");
    expect(stored.character.grid.items).toEqual([]);
    expect(stored.exploration!.stash!.grid.items[0]!.item).toEqual(item);
    await page.locator("#stash-close").click();
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe("ashen-refuge");
    await openOrren(page, "camp-stash-open");
    await page.locator('[data-stash-action="retrieve"]').click();
    await page.locator("#stash-confirm").click();
    await expect
      .poll(
        async () =>
          (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.stash
            ?.revision,
      )
      .toBe(2);
    await page.locator("#stash-close").click();
    await openOrren(page, "camp-merchant-open");
    await page.locator('[data-trade-kind="sell"]').click();
    await page.locator("#merchant-confirm").click();
    await expect
      .poll(
        async () =>
          (await readWorldCheckpoint(page, "ashen-refuge")).exploration!
            .merchant?.revision,
      )
      .toBe(2);
    await page.screenshot({
      path: info.outputPath("release-complete-economy.png"),
    });
    await page.locator("#merchant-close").click();
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe("ashen-refuge");
    await openOrren(page, "camp-merchant-open");
    await expect(offer).toBeDisabled();
    await expect(page.locator('[data-trade-kind="sell"]')).toHaveCount(0);
    const final = await readWorldCheckpoint(page, "ashen-refuge");
    expect(final.character.grid.items).toEqual([]);
    expect(final.exploration!.stash!.grid.items).toEqual([]);
    expect(final.exploration!.merchant!.retired).toEqual([item.id]);
    expect(final.exploration!.containers!.gold).toBe(
      gold - 60 + merchantSalePrice(item),
    );
    expect(final.progression).toEqual(before.progression);
    expect(final.exploration!.quests).toEqual(before.exploration!.quests);
    expect(final.exploration!.waypoints).toEqual(before.exploration!.waypoints);
    expect(final.loot.sequence).toBe(before.loot.sequence);
    await pressVirtualButton(page, 1);
    await expect(page.locator("#combat-world")).toBeFocused();
  });
});
