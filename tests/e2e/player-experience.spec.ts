import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../../src/simulation/inventory-save";
import { experienceAt } from "../../src/simulation/experience";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { WorldSession } from "../../src/simulation/world-session";

const classes = ["warrior", "sorcerer", "ranger"] as const;
async function root(page: Page) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
}
async function ready(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
}
async function state(page: Page) {
  await characterApi(page);
  return page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const registry = await s.list();
      return {
        ...registry,
        saves: await Promise.all(
          registry.characters.map(async (m) => {
            const r = await s.load(m.id);
            if (r.kind !== "valid") throw Error("Unexpected invalid owner");
            return {
              id: m.id,
              text: window.characterStorageModule.serializeCharacter(r.session),
            };
          }),
        ),
      };
    } finally {
      s.close();
    }
  });
}
async function exported(page: Page) {
  await page.locator("#inventory-open").click();
  const pending = page.waitForEvent("download");
  await page.locator("#inventory-export").click();
  const path = await (await pending).path();
  if (!path) throw Error("Missing player export");
  const text = serializeCharacter(
    deserializeCharacter(await readFile(path, "utf8")),
  );
  await page.locator("#inventory-close").click();
  return text;
}
async function exit(page: Page) {
  await page.locator("#player-pause-open").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await expect(page).toHaveURL(/\/hollowbane\/$/);
}
async function play(page: Page, id: string) {
  await page.locator("#menu-load").click();
  await page.locator(`[data-character-id="${id}"]`).click();
  await page.locator("#menu-play").click();
  await ready(page);
  await expect(page).toHaveURL(new RegExp(`character=${id}$`));
}

test("M3 fresh three-class journeys create, move, pause, exit and Continue the exact independent owners", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await root(page);
  const expected = new Map<string, string>();
  for (const classId of classes) {
    await page.locator("#menu-new").click();
    await page.locator(`[data-class="${classId}"]`).click();
    await page.getByLabel("Character name").fill(`Watchfire ${classId}`);
    await page.getByRole("button", { name: "Review character" }).click();
    expect((await state(page)).characters).toHaveLength(expected.size);
    await page.locator("#menu-create-confirm").click();
    await ready(page);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe("ashen-refuge");
    const created = await state(page);
    const owner = created.characters.find((m) => m.classId === classId)!;
    expect(owner).toMatchObject({ name: `Watchfire ${classId}`, level: 1 });
    expect(
      JSON.parse(created.saves.find((s) => s.id === owner.id)!.text).body
        .progression.character.totalXp,
    ).toBe(0);
    await page.locator("#combat-world").focus();
    const start = await page.evaluate(() => ({
      ...window.hollowbaneWorld!.position,
    }));
    await page.keyboard.down("d");
    try {
      await expect
        .poll(() =>
          page.evaluate(
            (start) =>
              Math.hypot(
                window.hollowbaneWorld!.position.x - start.x,
                window.hollowbaneWorld!.position.y - start.y,
              ),
            start,
          ),
        )
        .toBeGreaterThan(0.5);
    } finally {
      await page.keyboard.up("d");
    }
    await page.keyboard.press("Space");
    expected.set(owner.id, await exported(page));
    await exit(page);
    const saved = await state(page);
    expect(saved.lastPlayed).toBe(owner.id);
    expect(saved.saves).toEqual(
      [...expected].map(([id, text]) => ({ id, text })),
    );
    await page.locator("#menu-continue").click();
    await ready(page);
    await expect(page).toHaveURL(new RegExp(`character=${owner.id}$`));
    expect(await exported(page)).toBe(expected.get(owner.id));
    await exit(page);
  }
  await root(page);
  await expect(page.locator("#menu-status")).toContainText("Watchfire ranger");
  await page.locator("#menu-load").click();
  await expect(page.locator("[data-character-id]")).toHaveCount(3);
  await page
    .locator("#menu-character img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m3-fresh-three-journeys.png",
  });
  expect(errors).toEqual([]);
});

test("M3 distinct XP, items, gold, quests and worlds survive switching, awaited exit and named deletion", async ({
  page,
}) => {
  await root(page);
  await characterApi(page);
  const texts = classes.map((id, i) => {
    const s = characterSlotFixture(id, 42 + i);
    s.progression = {
      ...s.progression!,
      character: experienceAt(s.progression!.character.totalXp + i * 17),
    };
    s.exploration!.containers!.gold = 321 + i * 111;
    s.character.grid.items.push({
      item: inventoryItem("copper-band", 1000 + i * 100),
      x: 9,
      y: 3,
    });
    if (i === 1) {
      const w = new WorldSession(undefined, 43, 2);
      const quests = w.capture(w.travel.layout.spawn, s.loot).quests;
      if (!quests) throw Error("Missing empty quest fixture");
      s.exploration!.quests = quests;
    }
    return serializeCharacter(s);
  });
  const ids = await page.evaluate(async (texts) => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const ids: string[] = [];
      for (const [i, text] of texts.entries())
        ids.push(
          (
            await s.create(
              `Archive journey ${i + 1}`,
              window.characterStorageModule.deserializeCharacter(text),
            )
          ).id,
        );
      return ids;
    } finally {
      s.close();
    }
  }, texts);
  await root(page);
  let baseline = (await state(page)).saves;
  for (const [i, id] of ids.entries()) {
    await play(page, id);
    const text = await exported(page);
    const current = deserializeCharacter(text),
      original = deserializeCharacter(texts[i]!);
    expect(current.progression).toEqual(original.progression);
    expect(current.character).toEqual(original.character);
    expect(current.exploration!.stash).toEqual(original.exploration!.stash);
    expect(current.exploration!.quests).toEqual(original.exploration!.quests);
    expect(current.exploration!.containers).toEqual(
      original.exploration!.containers,
    );
    expect(current.exploration!.seed).toBe(original.exploration!.seed);
    await exit(page);
    baseline = baseline.map((s) => (s.id === id ? { id, text } : s));
    const saved = await state(page);
    expect(saved.lastPlayed).toBe(id);
    expect(saved.saves).toEqual(baseline);
  }
  await page.locator("#menu-load").click();
  await page.locator(`[data-character-id="${ids[1]}"]`).click();
  await page.locator("#menu-delete").click();
  await expect(page.locator("#menu-delete-detail")).toContainText(
    "Archive journey 2",
  );
  await page.getByRole("button", { name: "Keep character" }).click();
  expect((await state(page)).saves).toEqual(baseline);
  await page.locator("#menu-delete").click();
  await page.locator("#menu-delete-confirm").click();
  await expect(page.locator("[data-character-id]")).toHaveCount(2);
  const remaining = await state(page);
  expect(remaining.saves).toEqual(baseline.filter((s) => s.id !== ids[1]));
  expect(remaining.lastPlayed).toBe(ids[2]);
  expect(
    await page.evaluate(async (id) => {
      const s = new window.characterStorageModule.CharacterStorage();
      try {
        return Boolean(await s.archive(`deleted:${id}`));
      } finally {
        s.close();
      }
    }, ids[1]!),
  ).toBe(true);
  await page.locator("#menu-character [data-menu-back]").click();
  await page.locator("#menu-continue").click();
  await ready(page);
  await expect(page).toHaveURL(new RegExp(`character=${ids[2]}$`));
  expect(await exported(page)).toBe(
    baseline.find((s) => s.id === ids[2])!.text,
  );
});
