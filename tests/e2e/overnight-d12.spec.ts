import { expect, test } from "@playwright/test";
import {
  CLASS_IDS,
  type ClassId,
} from "../../src/simulation/character-classes";
import { createD12Fixture, measureD12Finale } from "../fixtures/d12-balance";
import { ACT1_FINALE, QUESTS } from "../../src/simulation/quests";
import {
  deserializeCharacter,
  serializeCharacter,
} from "../../src/simulation/inventory-save";
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

let checkpoints: Record<ClassId, string>;
// Earned timed duels and the measured live-hook skill finale, then ordinary travel.
// Each browser context receives a pre-game save; no live gameplay state is assigned.
test.beforeAll(() => {
  checkpoints = {} as Record<ClassId, string>;
  for (const id of CLASS_IDS) {
    const f = createD12Fixture(id),
      m = measureD12Finale(f);
    if (!m.complete || m.hp <= 0)
      throw Error(`D12 ${id} finale fixture failed`);
    for (const exit of ["graveyard", "forest", "camp"]) f.travel(exit);
    f.idleAt({ x: 1.75, y: 1.25 });
    checkpoints[id] = f.checkpoint().text;
  }
});
for (const id of CLASS_IDS)
  test(`Act1 balance ${id} claims the measured finale reward once and reloads its earned class and progression`, async ({
    page,
  }, info) => {
    if (id === "ranger")
      await installVirtualController(page, "Xbox 360 Controller");
    await loadD06Checkpoint(page, checkpoints[id]);
    const before = deserializeCharacter(checkpoints[id]),
      reward = QUESTS.find((q) => q.id === ACT1_FINALE)!.reward;
    await page.locator("#combat-world").focus();
    if (id === "ranger") await pressVirtualButton(page, 0);
    else await page.keyboard.press("e");
    await expect(page.locator("#camp-speaker")).toHaveText("Edda Vey");
    await page.locator("#camp-quest-journal").click();
    await expect(page.locator("#quest-title")).toHaveText("A Lantern Unbound");
    await expect(page.locator('[data-quest-action="claim"]')).toBeFocused();
    if (id === "ranger") await pressVirtualButton(page, 0);
    else await page.keyboard.press("Enter");
    await expect(page.locator("#quest-status")).toHaveText(
      "Status: claimed · Act 1 complete",
    );
    await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
    await page.screenshot({
      path: info.outputPath(`balance-${id}-completion.png`),
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("#combat-world")).toBeFocused();
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
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe("ashen-refuge");
    // Area metadata exists before the asynchronous checkpoint restore finishes.
    // Journal input is intentionally unavailable while inventory owns loading.
    await expect(page.locator("#quest-journal-open")).toBeEnabled();
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    await page.locator("#combat-world").focus();
    await page.keyboard.press("j");
    await expect(page.locator("#quest-journal")).toBeVisible();
    for (
      let i = 0;
      i < 4 &&
      (await page.locator("#quest-title").textContent()) !==
        "A Lantern Unbound";
      i++
    )
      await page.locator("#quest-next").click();
    await expect(page.locator("#quest-title")).toHaveText("A Lantern Unbound");
    await expect(page.locator("#quest-status")).toHaveText(
      "Status: claimed · Act 1 complete",
    );
    await expect(page.locator('[data-quest-action="claim"]')).toHaveCount(0);
    const reloaded = await readWorldCheckpoint(page, "ashen-refuge");
    expect(reloaded.progression).toEqual(saved.progression);
    expect(reloaded.loot).toEqual(saved.loot);
    expect(reloaded.exploration!.containers).toEqual(
      saved.exploration!.containers,
    );
  });

test("Act1 balance earned quest gold buys finite stock and resale loses gold without XP or loot farming after reload", async ({
  page,
}) => {
  // Same earned Warrior camp checkpoint, explicitly positioned by Orren before loading.
  const s = deserializeCharacter(checkpoints.warrior);
  s.exploration!.position = { x: 1, y: 3 };
  await loadD06Checkpoint(page, serializeCharacter(s));
  const gold = s.exploration!.containers!.gold,
    item = merchantItem("ash-blade");
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await expect(page.locator("#camp-speaker")).toHaveText("Orren Thale");
  await page.locator("#camp-merchant-open").click();
  const offer = page.locator('[data-trade-kind="buy"][data-item="ash-blade"]');
  await offer.click();
  await page.locator("#merchant-confirm").click();
  await expect(page.locator("#merchant-gold")).toHaveText(`Gold: ${gold - 60}`);
  await page.locator('[data-trade-kind="sell"]').click();
  await page.locator("#merchant-confirm").click();
  await expect(page.locator("#merchant-gold")).toHaveText(
    `Gold: ${gold - 60 + merchantSalePrice(item)}`,
  );
  await expect
    .poll(
      async () =>
        (await readWorldCheckpoint(page, "ashen-refuge")).exploration!.merchant
          ?.revision,
    )
    .toBe(2);
  await page.locator("#merchant-close").click();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await page.locator("#camp-merchant-open").click();
  await expect(offer).toBeDisabled();
  await expect(page.locator('[data-trade-kind="sell"]')).toHaveCount(0);
  const after = await readWorldCheckpoint(page, "ashen-refuge");
  expect(after.progression).toEqual(s.progression);
  expect(after.exploration!.containers!.gold).toBeLessThan(gold);
  expect(after.loot.sequence).toBe(s.loot.sequence);
  expect(after.exploration!.merchant!.retired).toEqual([item.id]);
});
