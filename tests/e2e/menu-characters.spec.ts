import { test, expect, type Page } from "@playwright/test";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function menu(page: Page) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
}
async function states(page: Page) {
  await characterApi(page);
  return page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const r = await s.list();
      return {
        ...r,
        saves: await Promise.all(
          r.characters.map(async (m) => {
            const loaded = await s.load(m.id);
            return {
              id: m.id,
              kind: loaded.kind,
              text:
                loaded.kind === "valid"
                  ? window.characterStorageModule.serializeCharacter(
                      loaded.session,
                    )
                  : null,
            };
          }),
        ),
      };
    } finally {
      s.close();
    }
  });
}
async function fixtures(page: Page, count = 3) {
  await menu(page);
  await characterApi(page);
  const texts = ["warrior", "sorcerer", "ranger"].map((id, i) =>
    serializeCharacter(
      characterSlotFixture(id as "warrior" | "sorcerer" | "ranger", 42 + i),
    ),
  );
  const ids = await page.evaluate(
    async ({ texts, count }) => {
      const s = new window.characterStorageModule.CharacterStorage();
      try {
        const ids: string[] = [];
        for (let i = 0; i < count; i++) {
          const m = await s.create(
            `Journey ${i + 1}`,
            window.characterStorageModule.deserializeCharacter(texts[i % 3]!),
          );
          ids.push(m.id);
        }
        return ids;
      } finally {
        s.close();
      }
    },
    { texts, count },
  );
  await menu(page);
  return ids;
}
async function play(page: Page, id: string) {
  await page
    .getByRole("button", { name: "Load Character", exact: true })
    .click();
  await page.locator(`[data-character-id="${id}"]`).click();
  await expect(page.locator("#menu-play")).toBeEnabled();
  await page.locator("#menu-play").click();
  await expect(page).toHaveURL(new RegExp(`character=${id}$`));
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
}

for (const className of ["Warrior", "Sorcerer", "Ranger"]) {
  test(`creates named ${className} only after confirmation, activates and continues the same owner`, async ({
    page,
  }) => {
    await menu(page);
    await page.getByRole("button", { name: "New Game", exact: true }).click();
    await page.getByRole("button", { name: className, exact: true }).click();
    await expect(page.locator("#menu-class-preview")).toContainText(className);
    await page.getByLabel("Character name").fill(`Aster ${className}`);
    await page.getByRole("button", { name: "Review character" }).click();
    expect((await states(page)).characters).toHaveLength(0);
    await expect(page.locator("#menu-confirm-detail")).toContainText(
      `Aster ${className}`,
    );
    await page.screenshot({
      path: `test-results/m1-c-confirm-${className}.png`,
    });
    await page.getByRole("button", { name: "Confirm creation" }).click();
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    const initial = await states(page);
    expect(initial.characters).toHaveLength(1);
    const m = initial.characters[0]!;
    expect(m).toMatchObject({
      name: `Aster ${className}`,
      classId: className.toLowerCase(),
      level: 1,
    });
    expect(initial.lastPlayed).toBe(m.id);
    expect(
      JSON.parse(initial.saves[0]!.text!).body.progression.character.totalXp,
    ).toBe(0);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe("ashen-refuge");
    await menu(page);
    await expect(page.locator("#menu-status")).toContainText(
      `Aster ${className}`,
    );
    await page.getByRole("button", { name: "Continue Game" }).click();
    await expect(page).toHaveURL(new RegExp(`character=${m.id}$`));
    await expect(page.locator("#inventory-dialog")).not.toBeVisible();
    expect((await states(page)).lastPlayed).toBe(m.id);
  });
}

test("switching and saving preserves complete inventories, progression, campaign and local stashes independently", async ({
  page,
}) => {
  const ids = await fixtures(page);
  const before = await states(page);
  for (const id of ids) {
    await play(page, id);
    await page.locator("#inventory-open").click();
    await page.locator("#inventory-save").click();
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint saved locally.",
    );
    const current = await states(page);
    expect(current.lastPlayed).toBe(id);
    for (const other of ids.filter((entry) => entry !== id)) {
      const baseline = before.saves.find((s) => s.id === other)!;
      // Earlier owners may already have their own successful save; retain that new baseline.
      expect(current.saves.find((s) => s.id === other)!.text).toBe(
        baseline.text,
      );
    }
    const stored = JSON.parse(
      current.saves.find((s) => s.id === id)!.text!,
    ).body;
    const original = JSON.parse(
      before.saves.find((s) => s.id === id)!.text!,
    ).body;
    expect(stored.progression).toEqual(original.progression);
    expect(stored.character).toEqual(original.character);
    expect(stored.exploration.stash).toEqual(original.exploration.stash);
    expect(stored.exploration.quests).toEqual(original.exploration.quests);
    expect(stored.exploration.containers.gold).toBe(123);
    before.saves = current.saves;
    await menu(page);
  }
});

test("eight visible slots prevent ninth creation and named deletion preserves the other seven archives", async ({
  page,
}) => {
  const ids = await fixtures(page, 8);
  const before = await states(page);
  await page.locator("#menu-load").click();
  await expect(page.locator("[data-character-id]")).toHaveCount(8);
  await expect(page.locator("#menu-create")).toBeDisabled();
  await page.locator(`[data-character-id="${ids[0]}"]`).click();
  await page.locator("#menu-delete").click();
  await expect(page.locator("#menu-delete-detail")).toContainText("Journey 1");
  await page.getByRole("button", { name: "Keep character" }).click();
  expect((await states(page)).characters).toHaveLength(8);
  await page.locator("#menu-delete").click();
  await page.locator("#menu-delete-confirm").click();
  await expect(page.locator("[data-character-id]")).toHaveCount(7);
  const after = await states(page);
  expect(after.saves).toEqual(before.saves.slice(1));
  await expect(
    page.getByRole("button", { name: "Empty slot 8 · Create character" }),
  ).toBeVisible();
  expect(
    await page.evaluate(async (id) => {
      const s = new window.characterStorageModule.CharacterStorage();
      try {
        return Boolean(await s.archive(`deleted:${id}`));
      } finally {
        s.close();
      }
    }, ids[0]!),
  ).toBe(true);
});

test("corrupt recent save blocks Continue, offers explicit same-owner recovery and never substitutes another character", async ({
  page,
}) => {
  const ids = await fixtures(page);
  await characterApi(page);
  await page.evaluate(async (id) => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      const loaded = await s.load(id);
      if (loaded.kind !== "valid") throw Error("Fixture invalid");
      await s.update(id, loaded.metadata.revision, loaded.session);
      await s.activate(id, loaded.metadata.revision + 1);
    } finally {
      s.close();
    }
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("hollowbane-characters-v1");
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("characters", "readwrite");
      tx.objectStore("characters").put(
        { id, revision: 2, text: "retained corrupt sentinel" },
        id,
      );
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, ids[1]!);
  await menu(page);
  await expect(page.locator("#menu-continue")).toBeDisabled();
  await expect(page.locator("#menu-status")).toContainText("Journey 2");
  await page.locator("#menu-recovery").click();
  await expect(page.locator("#menu-play")).toBeDisabled();
  await expect(page.locator("#menu-slot-recover")).toBeVisible();
  const before = await states(page);
  await page.locator("#menu-slot-recover").click();
  await expect(page.locator("#menu-play")).toBeEnabled();
  const after = await states(page);
  expect(after.lastPlayed).toBe(ids[1]);
  expect(after.saves[0]).toEqual(before.saves[0]);
  expect(after.saves[2]).toEqual(before.saves[2]);
  expect(after.saves[1]!.kind).toBe("valid");
});

test("invalid/developer character links and a missing owner cannot load or overwrite a different save", async ({
  page,
}) => {
  const [id] = await fixtures(page, 1);
  const before = await states(page);
  await page.goto(`?world=1&character=${id}&developer=1`);
  await expect(page.locator("#menu-status")).toContainText(
    "unsupported options",
  );
  expect((await states(page)).saves).toEqual(before.saves);
  await page.goto("?world=1&character=10000000-0000-4000-8000-000000000099");
  await expect(page.locator("#inventory-status")).toContainText(
    "no longer exists",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#inventory-dialog")).toBeVisible();
  expect((await states(page)).saves).toEqual(before.saves);
  await page
    .getByRole("link", { name: "Return to character selection" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
});

for (const device of [
  "Xbox standard controller",
  "DualSense Wireless Controller",
]) {
  test(`${device} navigates creation, switches to keyboard naming and cancels without allocating a slot`, async ({
    page,
  }) => {
    await installVirtualController(page, device);
    await menu(page);
    await pressVirtualButton(page, 0);
    await expect(page.locator("[data-class=warrior]")).toBeFocused();
    await pressVirtualButton(page, 13);
    await pressVirtualButton(page, 0);
    await expect(page.locator("#menu-class-preview")).toContainText("Sorcerer");
    await page.getByLabel("Character name").fill("Moon traveller");
    await page.getByRole("button", { name: "Review character" }).click();
    await pressVirtualButton(page, 1);
    await expect(page.locator("#menu-confirm-dialog")).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu-create-dialog")).not.toBeVisible();
    expect((await states(page)).characters).toHaveLength(0);
  });
}

test("creation and eight-slot selection remain readable in narrow and ultrawide layouts", async ({
  page,
}) => {
  await fixtures(page, 3);
  for (const size of [
    { width: 360, height: 640 },
    { width: 2560, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await menu(page);
    await page.locator("#menu-load").click();
    await page.screenshot({
      path: `test-results/m1-c-selection-${size.width}.png`,
    });
    expect(
      await page
        .locator("#menu-character")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "Create New", exact: true }).click();
    await page.screenshot({
      path: `test-results/m1-c-creation-${size.width}.png`,
    });
    expect(
      await page
        .locator("#menu-create-dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  }
});

test("failed creation stays retryable and duplicate confirms allocate exactly one character", async ({
  page,
}) => {
  await menu(page);
  await page.locator("#menu-new").click();
  await page.getByLabel("Character name").fill("Mira <&> 雪");
  await page.getByRole("button", { name: "Review character" }).click();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "characters" && fail) {
        fail = false;
        throw new DOMException("Injected storage full", "QuotaExceededError");
      }
      return put.apply(this, args);
    };
  });
  await page.locator("#menu-create-confirm").click();
  await expect(
    page.locator("#menu-confirm-dialog [data-menu-message]"),
  ).toContainText("Injected storage full");
  expect((await states(page)).characters).toHaveLength(0);
  await page.evaluate(() => {
    const confirm = document.querySelector<HTMLButtonElement>(
      "#menu-create-confirm",
    )!;
    confirm.click();
    confirm.click();
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const state = await states(page);
  expect(state.characters).toHaveLength(1);
  expect(state.characters[0]!.name).toBe("Mira <&> 雪");
});

test("two gameplay tabs cannot overwrite the same owner from a stale checkpoint", async ({
  page,
  context,
}) => {
  const [id] = await fixtures(page, 1);
  await play(page, id!);
  const second = await context.newPage();
  await second.goto(`?world=1&character=${id}`);
  await expect(second.locator("#inventory-dialog")).not.toBeVisible();
  await expect(second.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await page.bringToFront();
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  const committed = await states(page);
  await second.bringToFront();
  await second.locator("#inventory-open").click();
  await second.locator("#inventory-save").click();
  await expect(second.locator("#inventory-status")).toContainText(
    "changed in another session",
  );
  expect((await states(second)).saves).toEqual(committed.saves);
  await second.close();
});

test("legacy import remains accessible after playing a different character and retains both independent saves", async ({
  page,
}) => {
  const [id] = await fixtures(page, 1);
  await characterApi(page);
  const legacy = serializeCharacter(characterSlotFixture("ranger", 71));
  await page.evaluate(
    async ({ id, legacy }) => {
      const s = new window.characterStorageModule.CharacterStorage();
      try {
        const m = (await s.list()).characters.find((c) => c.id === id)!;
        await s.activate(id!, m.revision);
      } finally {
        s.close();
      }
      const db = await new Promise<IDBDatabase>((resolve) => {
        const r = indexedDB.open("hollowbane-character-v1");
        r.onsuccess = () => resolve(r.result);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("snapshots", "readwrite");
        tx.objectStore("snapshots").put(
          { revision: 1, text: legacy },
          "current",
        );
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
      db.close();
    },
    { id, legacy },
  );
  const before = await states(page);
  await menu(page);
  await expect(page.locator("#menu-status")).toContainText("Journey 1");
  await page.locator("#menu-load").click();
  await page
    .getByRole("button", { name: "Import legacy adventure", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import and Play Legacy Adventurer" })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  const after = await states(page);
  expect(after.characters).toHaveLength(2);
  expect(after.saves.find((s) => s.id === id)).toEqual(before.saves[0]);
  expect(after.lastPlayed).toBe("00000000-0000-4000-8000-000000000001");
  expect(after.characters[1]!.classId).toBe("ranger");
});
