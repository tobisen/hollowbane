import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../../src/simulation/inventory-save";

declare global {
  interface Window {
    releaseExitWrite?: () => void;
    exitWrites: number;
    restoreExitFault?: () => void;
  }
}
async function menu(page: Page) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
}
async function states(page: Page) {
  await characterApi(page);
  return page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const registry = await s.list();
      return {
        registry,
        saves: await Promise.all(
          registry.characters.map(async (m) => {
            const load = await s.load(m.id);
            if (load.kind !== "valid") throw Error("Invalid test owner");
            return {
              id: m.id,
              revision: m.revision,
              text: window.characterStorageModule.serializeCharacter(
                load.session,
              ),
            };
          }),
        ),
      };
    } finally {
      s.close();
    }
  });
}
async function seed(page: Page) {
  await menu(page);
  await characterApi(page);
  const texts = ["warrior", "ranger"].map((id, i) => {
    const s = characterSlotFixture(id as "warrior" | "ranger", 42 + i);
    s.exploration!.containers!.gold = 321 + i * 100;
    return serializeCharacter(s);
  });
  return page.evaluate(async (texts) => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const ids: string[] = [];
      for (const [i, text] of texts.entries())
        ids.push(
          (
            await s.create(
              `Exit journey ${i + 1}`,
              window.characterStorageModule.deserializeCharacter(text),
            )
          ).id,
        );
      return ids;
    } finally {
      s.close();
    }
  }, texts);
}
async function play(page: Page, id: string) {
  await page.goto(`?world=1&character=${id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
}
async function exported(page: Page) {
  const download = page.waitForEvent("download");
  await page.locator("#inventory-export").click();
  const path = await (await download).path();
  if (!path) throw Error("No actual exported checkpoint");
  return serializeCharacter(deserializeCharacter(await readFile(path, "utf8")));
}
async function allocate(page: Page) {
  await page.locator("#inventory-open").click();
  await page.locator("#character-toggle").click();
  await page.locator("#allocate-vitality").click();
}
async function pause(page: Page) {
  await page.locator("#inventory-close").click();
  await page.locator("#player-pause-open").click();
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
}
async function exit(page: Page) {
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await expect(page).toHaveURL(/\/hollowbane\/$/);
}

test("Save & Exit awaits persistence, blocks double submit, restores full domains and switches two independent owners", async ({
  page,
}) => {
  const [first, second] = await seed(page);
  const originals = await states(page);
  await play(page, first!);
  await allocate(page);
  const expected = await exported(page);
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const before = await states(page);
  await pause(page);
  await page.evaluate(() => {
    const original =
      window.characterStorageModule.CharacterStorage.prototype.update;
    const gate = new Promise<void>(
      (resolve) => (window.releaseExitWrite = resolve),
    );
    window.exitWrites = 0;
    window.characterStorageModule.CharacterStorage.prototype.update =
      async function (...args) {
        window.exitWrites++;
        await gate;
        return original.apply(this, args);
      };
  });
  await page.evaluate(() => {
    const button =
      document.querySelector<HTMLButtonElement>("#player-save-exit")!;
    button.dispatchEvent(new MouseEvent("click"));
    button.dispatchEvent(new MouseEvent("click"));
  });
  await expect(page.locator("#player-save-status")).toHaveText(
    "Saving your adventure…",
  );
  await expect(page.locator("#player-resume")).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`character=${first}$`));
  expect(await page.evaluate(() => window.exitWrites)).toBe(1);
  expect((await states(page)).saves).toEqual(before.saves);
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-b-saving.png",
  });
  await page.evaluate(() => window.releaseExitWrite!());
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  const saved = await states(page);
  expect(saved.registry.lastPlayed).toBe(first);
  expect(saved.saves.find((s) => s.id === first)!.text).toBe(expected);
  expect(saved.saves.find((s) => s.id === first)!.revision).toBe(
    before.saves.find((s) => s.id === first)!.revision + 1,
  );
  expect(saved.saves.find((s) => s.id === second)).toEqual(
    originals.saves.find((s) => s.id === second),
  );
  await page.locator("#menu-continue").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#inventory-open").click();
  expect(await exported(page)).toBe(expected);
  await pause(page);
  await exit(page);
  await page.locator("#menu-load").click();
  await page.locator(`[data-character-id="${second}"]`).click();
  await page.locator("#menu-play").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await page.locator("#player-pause-open").click();
  await exit(page);
  const switched = await states(page);
  expect(switched.registry.lastPlayed).toBe(second);
  expect(switched.saves.find((s) => s.id === first)!.text).toBe(expected);
  const other = JSON.parse(
    switched.saves.find((s) => s.id === second)!.text!,
  ).body;
  expect(other.exploration.containers.gold).toBe(421);
  expect(other.progression.skills.classId).toBe("ranger");
});

test("failed Save & Exit preserves live allocation, current owner and stored originals, then retries safely", async ({
  page,
}) => {
  const [first, second] = await seed(page);
  await play(page, first!);
  const before = await states(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "characters")
        throw new DOMException("Injected quota failure", "QuotaExceededError");
      return original.apply(this, args);
    };
    window.restoreExitFault = () => (IDBObjectStore.prototype.put = original);
  });
  await allocate(page);
  const expected = await exported(page);
  await pause(page);
  await page.locator("#player-save-exit").click();
  await expect(page.locator("#player-save-status")).toContainText(
    "Injected quota failure",
  );
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await expect(page.locator("#player-save-exit")).toBeEnabled();
  expect(await page.evaluate(() => window.hollowbaneCombat!.paused)).toBe(true);
  expect((await states(page)).saves).toEqual(before.saves);
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-b-failed.png",
  });
  await page.locator("#player-resume").click();
  await page.locator("#inventory-open").click();
  expect(await exported(page)).toBe(expected);
  await page.evaluate(() => window.restoreExitFault!());
  await pause(page);
  await exit(page);
  const after = await states(page);
  expect(after.saves.find((s) => s.id === first)!.text).toBe(expected);
  expect(after.saves.find((s) => s.id === second)).toEqual(
    before.saves.find((s) => s.id === second),
  );
  expect(after.registry.lastPlayed).toBe(first);
});
