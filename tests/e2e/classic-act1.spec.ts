import { expect, test, type Page } from "@playwright/test";
import { classicAct1Layout } from "../../src/simulation/classic-act1-layout";
import { layoutFingerprint } from "../../src/simulation/world-layout";
import { worldLayout } from "../../src/simulation/world-layout";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { newCharacter } from "../../src/simulation/new-character";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import {
  followQuestPath,
  driveQuestPoints,
  neutralQuestController,
} from "./quest-world-input";
import { act1Unproject } from "../../src/world/act1-view";
import { areaNavigation, findPath } from "../../src/world/navigation";
import { defaultPreferences } from "../../src/simulation/input";

async function createClassicCharacter(page: Page, classId: string) {
  await page.goto("?classicAct1=1");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await expect(page.locator("#classic-act1-error")).toHaveCount(0);
  await expect(page.locator(".menu-subtitle")).toContainText("Classic Act 1");
  await page.screenshot({
    path: test.info().outputPath("classic-character-selection.png"),
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-new").click();
  await page.locator(`[data-class="${classId}"]`).click();
  await page.getByLabel("Character name").fill(`Classic ${classId}`);
  await page.getByRole("button", { name: "Review character" }).click();
  await page.locator("#menu-create-confirm").click();
  await expect(page).toHaveURL(/\?classicAct1=1&character=[0-9a-f-]+$/);
}

async function approachHostile(page: Page, id: number) {
  await neutralQuestController(page);
  const path = await page.evaluate(
    (id) => window.hollowbaneWorld!.routeToHostile!(id),
    id,
  );
  if (!path.length) return;
  const end = path.at(-1)!,
    from =
      path.at(-2) ??
      (await page.evaluate(() => window.hollowbaneWorld!.position));
  const d = Math.hypot(end.x - from.x, end.y - from.y);
  if (d > 0.7)
    path[path.length - 1] = {
      x: end.x + ((from.x - end.x) * 0.7) / d,
      y: end.y + ((from.y - end.y) * 0.7) / d,
    };
  await driveQuestPoints(page, path);
  await neutralQuestController(page);
}
async function aimHostile(page: Page, id: number) {
  const p = await page.evaluate((id) => {
    const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
      c = window.hollowbaneWorld!.camera;
    return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
  }, id);
  await page.mouse.move(p.x, p.y);
}

async function castActualSkill(page: Page, target: number, skill: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await approachHostile(page, target);
    await expect
      .poll(() =>
        page.evaluate((skill) => {
          const r = window.hollowbaneSkills!,
            p = window.hollowbaneCombat!.actors[0]!;
          return (
            p.phase === "idle" && (r.users[0]!.cooldowns[skill] ?? 0) <= r.tick
          );
        }, skill),
      )
      .toBe(true);
    await aimHostile(page, target);
    const after = await page.evaluate(() => window.hollowbaneSkills!.tick);
    // Pointer casting uses the existing explicit hovered target; keyboard casting uses facing.
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });
    await expect
      .poll(() =>
        page.evaluate(
          ({ skill, after }) =>
            window.hollowbaneSkills!.events.some(
              (e) =>
                e.actor === 0 &&
                e.tick > after &&
                e.skill === skill &&
                ["effect", "interrupt", "rejected"].includes(e.kind),
            ),
          { skill, after },
        ),
      )
      .toBe(true);
    if (
      await page.evaluate(
        ({ skill, after }) =>
          window.hollowbaneSkills!.events.some(
            (e) =>
              e.actor === 0 &&
              e.tick > after &&
              e.skill === skill &&
              e.kind === "effect",
          ),
        { skill, after },
      )
    )
      return;
  }
  throw Error(`Actual ${skill} failed to release after three input attempts`);
}

for (const [classId, skill] of [
  ["warrior", "iron-fan"],
  ["sorcerer", "ember-lance"],
  ["ranger", "briar-edge"],
] as const)
  test(`Classic ${classId} uses actual ability and combat, then receives authoritative death`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installVirtualController(
      page,
      "Classic class combat virtual standard",
    );
    await page.goto(`?classicAct1=1&class=${classId}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    const nearest = () =>
      page.evaluate((classId) => {
        const p = window.hollowbaneCombat!.actors[0]!;
        return window
          .hollowbaneCombat!.actors.filter(
            (a) =>
              a.id !== 0 &&
              a.hp > 0 &&
              (classId !== "warrior" ||
                window.hollowbaneAI!.enemies.find((b) => b.id === a.id)
                  ?.role === "melee"),
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - p.x, a.y - p.y) -
              Math.hypot(b.x - p.x, b.y - p.y),
          )[0]!.id;
      }, classId);
    const target = await nearest();
    await castActualSkill(page, target, skill);
    expect(
      await page.evaluate(
        (skill) =>
          window.hollowbaneSkills!.events.filter(
            (e) => e.actor === 0 && e.skill === skill && e.kind === "effect",
          ).length,
        skill,
      ),
    ).toBe(1);
    const attack = await nearest();
    await approachHostile(page, attack);
    await aimHostile(page, attack);
    await page.mouse.down();
    try {
      await expect
        .poll(
          () =>
            page.evaluate(
              (id) =>
                window.hollowbaneCombat!.actors.find((a) => a.id === id)?.hp ??
                0,
              attack,
            ),
          { timeout: 20000 },
        )
        .toBeLessThanOrEqual(0);
    } finally {
      await page.mouse.up();
    }
    await page.screenshot({ path: info.outputPath(`${classId}-combat.png`) });
    await approachHostile(page, await nearest());
    await page.keyboard.press("Space");
    await expect
      .poll(
        () => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase),
        { timeout: 60000 },
      )
      .toBe("dead");
    if (classId === "warrior")
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              window.hollowbaneClassicAct1!.actorTextures.find(
                (a) => a.id === 0,
              )!.frame,
          ),
        )
        .toMatch(/warrior-death-.+-15$/);
    await page.screenshot({ path: info.outputPath(`${classId}-death.png`) });
    expect(errors).toEqual([]);
  });

for (const classId of ["warrior", "sorcerer", "ranger"] as const)
  test(`Classic Act 1 launches real ${classId} campaign, moves and restores isolated checkpoint`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await createClassicCharacter(page, classId);
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    await expect(page.locator("#classic-act1-indicator")).toBeVisible();
    expect(
      await page.evaluate(() => window.hollowbaneClassicAct1!.ownerId),
    ).toBe(new URL(page.url()).searchParams.get("character"));
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.fingerprint))
      .toBe(layoutFingerprint(classicAct1Layout(42)));
    await expect(page.locator("#classic-act1-error")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        window.hollowbaneClassicAct1!.actorTextures.map((a) => a.shadow),
      ),
    ).toEqual(expect.arrayContaining(["classic-contact"]));
    expect(
      await page.evaluate(() =>
        window.hollowbaneClassicAct1!.actorTextures.every(
          (a) => a.shadow === "classic-contact",
        ),
      ),
    ).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneClassicAct1?.groundCells),
      )
      .toBe(1083);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.hollowbaneClassicAct1?.actorTextures.find((a) => a.id === 0)
              ?.texture,
        ),
      )
      .toBe(classId === "warrior" ? "classic-warrior" : "arena-wanderer");
    await page.locator("#combat-world").focus();
    const views = new Set<string>();
    const directions =
      classId === "warrior"
        ? [
            ["ArrowUp"],
            ["ArrowUp", "ArrowRight"],
            ["ArrowRight"],
            ["ArrowRight", "ArrowDown"],
            ["ArrowDown"],
            ["ArrowDown", "ArrowLeft"],
            ["ArrowLeft"],
            ["ArrowLeft", "ArrowUp"],
          ]
        : [["ArrowRight"]];
    for (const keys of directions) {
      const before = await page.evaluate(
        () => window.hollowbaneWorld!.position,
      );
      for (const key of keys) await page.keyboard.down(key);
      await expect
        .poll(() =>
          page.evaluate(
            (before) =>
              Math.hypot(
                window.hollowbaneWorld!.position.x - before.x,
                window.hollowbaneWorld!.position.y - before.y,
              ),
            before,
          ),
        )
        .toBeGreaterThan(0.5);
      for (const key of keys) await page.keyboard.up(key);
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneWorld!.walking))
        .toBe(false);
      if (classId === "warrior")
        views.add(
          await page.evaluate(() =>
            window
              .hollowbaneClassicAct1!.actorTextures.find((a) => a.id === 0)!
              .frame.split("-")
              .at(-2)!,
          ),
        );
    }
    if (classId === "warrior")
      expect([...views].sort()).toEqual(["ne", "nw", "se", "sw"]);
    await page.screenshot({ path: info.outputPath(`classic-${classId}.png`) });
    await page.locator("#inventory-open").click();
    await expect(page.locator(".skill-identity")).toContainText(
      `Committed: ${classId}`,
    );
    await page.locator("#inventory-save").click();
    await expect(page.locator("#inventory-status")).toContainText(
      "saved locally",
    );
    const position = await page.evaluate(
      () => window.hollowbaneWorld!.position,
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
      position,
    );
    await page.locator("#player-pause-open").click();
    await page.locator("#player-save-exit").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-menu-ready",
      "true",
    );
    await expect(page.locator("#classic-act1-indicator")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.dataset.classicAct1),
    ).toBeUndefined();
    await page.locator("#menu-continue").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneClassicAct1?.classId))
      .toBe(classId);
    expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
      position,
    );
    expect(errors).toEqual([]);
  });

test("invalid Classic options report an explicit error instead of normal campaign fallback", async ({
  page,
}) => {
  await page.goto("?classicAct1=1&class=unknown");
  await expect(page.locator("#classic-act1-error")).toContainText(
    "Classic Act 1 unavailable",
  );
  await expect(page.locator("#classic-act1-indicator")).toHaveCount(0);
  expect(await page.evaluate(() => window.hollowbaneWorld)).toBeUndefined();
});

test("missing Classic scenery stops initialization with an explicit error and no active indicator", async ({
  page,
}) => {
  await page.route("**/dev/classic-visual/earth.png", (route) => route.abort());
  await page.goto("?classicAct1=1&class=warrior");
  await expect(page.locator("#classic-act1-error")).toContainText(
    "Classic scenery unavailable: earth",
  );
  await expect(page.locator("#classic-act1-indicator")).not.toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.dataset.classicAct1),
  ).not.toBe("active");
  expect(await page.evaluate(() => window.hollowbaneWorld)).toBeUndefined();
});

test("Classic uses the same saved movement bindings as the normal player session", async ({
  page,
}) => {
  const preferences = defaultPreferences();
  preferences.bindings.east = ["KeyL", "ArrowRight"];
  await page.addInitScript(
    (preferences) =>
      localStorage.setItem(
        "hollowbane.movement.v1",
        JSON.stringify(preferences),
      ),
    preferences,
  );
  await page.goto("?classicAct1=1&class=warrior");
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  await page.locator("#combat-world").focus();
  const before = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.keyboard.down("KeyL");
  await expect
    .poll(() =>
      page.evaluate(
        (before) =>
          Math.hypot(
            window.hollowbaneWorld!.position.x - before.x,
            window.hollowbaneWorld!.position.y - before.y,
          ),
        before,
      ),
    )
    .toBeGreaterThan(0.5);
  await page.keyboard.up("KeyL");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.walking))
    .toBe(false);
});

test("Classic campaign retains production owner bytes and normal forest geometry", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const id = await page.evaluate(
    async (text) => {
      const api = window.characterStorageModule,
        storage = new api.CharacterStorage();
      try {
        return (
          await storage.create(
            "Protected Classic owner",
            api.deserializeCharacter(text),
          )
        ).id;
      } finally {
        storage.close();
      }
    },
    serializeCharacter(characterSlotFixture("warrior")),
  );
  const snapshot = async () => {
    await characterApi(page);
    return page.evaluate(async (id) => {
      const api = window.characterStorageModule,
        storage = new api.CharacterStorage();
      try {
        const loaded = await storage.load(id);
        if (loaded.kind !== "valid") throw Error("Owner lost");
        return {
          registry: await storage.list(),
          text: api.serializeCharacter(loaded.session),
          records: await new Promise<unknown[]>((resolve, reject) => {
            const r = indexedDB.open("hollowbane-characters-v1");
            r.onerror = () => reject(r.error);
            r.onsuccess = () => {
              const db = r.result;
              const tx = db.transaction(
                ["registry", "characters", "previous", "archives"],
                "readonly",
              );
              const requests = Array.from(tx.objectStoreNames).map((name) =>
                tx.objectStore(name).getAll(),
              );
              tx.oncomplete = () => {
                db.close();
                resolve(requests.map((request) => request.result));
              };
              tx.onabort = () => {
                db.close();
                reject(tx.error);
              };
            };
          }),
        };
      } finally {
        storage.close();
      }
    }, id);
  };
  const before = await snapshot();
  await page.goto("?classicAct1=1");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-load").click();
  await page.locator(`[data-character-id="${id}"]`).click();
  await page.locator("#menu-play").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toContainText(
    "saved locally",
  );
  expect(await snapshot()).toEqual(before);
  await page.goto(`?classicAct1=1&character=${id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  expect(await snapshot()).toEqual(before);
  await page
    .getByRole("link", { name: "Return to title", exact: true })
    .click();
  await expect(page).toHaveURL(/\?classicAct1=1$/);
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-continue").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  expect(await snapshot()).toEqual(before);
  await page.goto(`?world=1&character=${id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  expect((await snapshot()).text).toBe(before.text);
  await page.goto(
    "?world=1&developer=1&worldArea=haunted-forest&worldPeaceful=1",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.fingerprint))
    .toBe(layoutFingerprint(worldLayout("haunted-forest", 42, 2)));
  await expect(page.locator("#classic-act1-indicator")).toHaveCount(0);
  expect(
    await page.evaluate(() => window.hollowbaneClassicAct1),
  ).toBeUndefined();
});

test("Classic actual campaign reaches NPC quest, clearings, combat, loot, containers and next area", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await installVirtualController(page, "Classic campaign virtual standard");
  await createClassicCharacter(page, "warrior");
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  await followQuestPath(page, "exit", "camp");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("ashen-refuge");
  await followQuestPath(page, "npc", "edda-vey");
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-dialogue")).toBeVisible();
  await page.locator("#camp-quest-journal").click();
  await expect(page.locator("#quest-title")).toHaveText("Embers on the Road");
  await page.locator('[data-quest-action="accept"]').click();
  await expect(page.locator("#quest-status")).toContainText("active");
  await page.locator("#quest-journal-close").click();
  await followQuestPath(page, "exit", "forest");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.fingerprint))
    .toBe(layoutFingerprint(classicAct1Layout(42)));
  await page.screenshot({ path: info.outputPath("classic-entry.png") });
  await neutralQuestController(page);
  const target = await page.evaluate(() => {
    const p = window.hollowbaneCombat!.actors[0]!;
    return window
      .hollowbaneCombat!.actors.filter(
        (a) =>
          a.id !== 0 &&
          a.hp > 0 &&
          window.hollowbaneAI!.enemies.find((b) => b.id === a.id)?.role ===
            "melee",
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0]!.id;
  });
  const aim = () =>
    page.evaluate((id) => {
      const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
        c = window.hollowbaneWorld!.camera;
      return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
    }, target);
  await castActualSkill(page, target, "iron-fan");
  const point = await aim();
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) =>
              window.hollowbaneCombat!.actors.find((a) => a.id === id)?.hp ?? 0,
            target,
          ),
        { timeout: 20000 },
      )
      .toBeLessThanOrEqual(0);
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot!.sequence))
    .toBeGreaterThan(0);
  await neutralQuestController(page);
  const second = await page.evaluate(() => {
    const p = window.hollowbaneCombat!.actors[0]!;
    return window
      .hollowbaneCombat!.actors.filter((a) => a.id !== 0 && a.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0]!.id;
  });
  const secondPoint = await page.evaluate((id) => {
    const a = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
      c = window.hollowbaneWorld!.camera;
    return { x: (a.x - c.x) * c.zoom, y: (a.y - 28 - c.y) * c.zoom };
  }, second);
  await page.mouse.move(secondPoint.x, secondPoint.y);
  await page.mouse.down();
  try {
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) =>
              window.hollowbaneCombat!.actors.find((a) => a.id === id)?.hp ?? 0,
            second,
          ),
        { timeout: 20000 },
      )
      .toBeLessThanOrEqual(0);
  } finally {
    await page.mouse.up();
  }
  await page.screenshot({ path: info.outputPath("classic-actual-combat.png") });
  // Traverse the hostile clearings using the player's existing run toggle.
  // Slow walking past every remaining pack can legitimately kill this fresh hero.
  await neutralQuestController(page);
  await pressVirtualButton(page, 10);
  // Follow actual pathfinder turns through real stick input, never moving live actors directly.
  for (const destination of [
    { x: 12, y: 30 },
    { x: 23, y: 11 },
    { x: 42, y: 14 },
    { x: 29, y: 29 },
  ]) {
    const from = await page.evaluate(() => window.hollowbaneWorld!.position);
    await driveQuestPoints(
      page,
      findPath(areaNavigation(classicAct1Layout(42).map), from, destination),
    );
    await page.screenshot({
      path: info.outputPath(`clearing-${destination.x}.png`),
    });
  }
  const treasure = await page.evaluate(
    () => window.hollowbaneWorld!.containers!.find((c) => !c.opened)!.id,
  );
  await followQuestPath(page, "treasure", String(treasure));
  await page.locator(".world-treasure button").click();
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          window.hollowbaneWorld!.containers!.find((c) => c.id === id)?.opened,
        treasure,
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot!.drops.length))
    .toBeGreaterThan(0);
  const drop = await page.evaluate(() => window.hollowbaneLoot!.drops[0]!);
  const from = await page.evaluate(() => window.hollowbaneWorld!.position);
  await driveQuestPoints(
    page,
    findPath(
      areaNavigation(classicAct1Layout(42).map),
      from,
      act1Unproject(drop, "b"),
    ),
  );
  await page.locator(`.loot-label[data-item="${drop.id}"]`).click();
  await expect
    .poll(() =>
      page.evaluate(
        (id) => window.hollowbaneLoot!.drops.some((d) => d.id === id),
        drop.id,
      ),
    )
    .toBe(false);
  await page.locator("#inventory-open").click();
  await expect(
    page.locator(`#inventory-grid .inventory-item[data-item="${drop.id}"]`),
  ).toHaveCount(1);
  await page.locator("#inventory-close").click();
  await page.locator("#quest-journal-open").click();
  await expect(page.locator("#quest-status")).toContainText("ready");
  await page.locator("#quest-journal-close").click();
  await followQuestPath(page, "exit", "camp");
  await followQuestPath(page, "npc", "edda-vey");
  await pressVirtualButton(page, 0);
  await page.locator("#camp-quest-journal").click();
  await page.locator('[data-quest-action="claim"]').click();
  await expect(page.locator("#quest-status")).toContainText("claimed");
  await page.screenshot({ path: info.outputPath("classic-quest-reward.png") });
  await page.locator("#quest-journal-close").click();
  await followQuestPath(page, "exit", "forest");
  await followQuestPath(page, "exit", "graveyard");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("forgotten-graveyard");
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp),
  ).toBeGreaterThan(0);
  await page.locator("#player-pause-open").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.goto("?classicAct1=1");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-continue").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("forgotten-graveyard");
  await page.locator("#inventory-open").click();
  await expect(
    page.locator(`#inventory-grid .inventory-item[data-item="${drop.id}"]`),
  ).toHaveCount(1);
  await page.locator("#inventory-close").click();
  await page.locator("#quest-journal-open").click();
  await expect(page.locator("#quest-status")).toContainText("claimed");
  await page.locator("#quest-journal-close").click();
  expect(errors).toEqual([]);
});

test("existing same-class owners keep separate Classic saves and retain their actual equipment, progression and stash", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const owners = await page.evaluate(
    async (texts) => {
      const api = window.characterStorageModule;
      const store = new api.CharacterStorage();
      try {
        const owners = [];
        for (const [index, text] of texts.entries()) {
          const metadata = await store.create(
            `Existing journey ${index + 1}`,
            api.deserializeCharacter(text),
          );
          owners.push({ id: metadata.id, body: JSON.parse(text).body });
        }
        return owners;
      } finally {
        store.close();
      }
    },
    [
      serializeCharacter(characterSlotFixture("warrior", 42)),
      serializeCharacter(newCharacter("warrior", 51)),
    ],
  );
  const positions = [];
  for (const owner of owners) {
    await page.goto("?classicAct1=1");
    await expect(page.locator("html")).toHaveAttribute(
      "data-menu-ready",
      "true",
    );
    await page.locator("#menu-load").click();
    await page.locator(`[data-character-id="${owner.id}"]`).click();
    await page.locator("#menu-play").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    expect(
      await page.evaluate(() => window.hollowbaneClassicAct1!.ownerId),
    ).toBe(owner.id);
    await page.locator("#combat-world").focus();
    const from = await page.evaluate(() => window.hollowbaneWorld!.position);
    await page.keyboard.down("ArrowRight");
    await expect
      .poll(() =>
        page.evaluate(
          (from) => window.hollowbaneWorld!.position.x - from.x,
          from,
        ),
      )
      .toBeGreaterThan(0.5);
    await page.keyboard.up("ArrowRight");
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.walking))
      .toBe(false);
    positions.push(await page.evaluate(() => window.hollowbaneWorld!.position));
    await page.locator("#player-pause-open").click();
    await page.locator("#player-save-exit").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-menu-ready",
      "true",
    );
    const saved = await page.evaluate(async (id) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open(`hollowbane-classic-act1-owner-v1-${id}`);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      try {
        return await new Promise<{ text: string }>((resolve, reject) => {
          const tx = db.transaction("snapshots", "readonly");
          const r = tx.objectStore("snapshots").get("current");
          tx.oncomplete = () => resolve(r.result);
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    }, owner.id);
    const body = JSON.parse(saved.text).body;
    expect(body.character).toEqual(owner.body.character);
    expect(body.progression).toEqual(owner.body.progression);
    expect(body.exploration.stash).toEqual(owner.body.exploration.stash);
    expect(body.exploration.area).toBe("haunted-forest");
    // Return via the exact bare entry and Continue, then refresh the bound owner.
    await page.goto("?classicAct1=1");
    await expect(page.locator("html")).toHaveAttribute(
      "data-menu-ready",
      "true",
    );
    await page.locator("#menu-continue").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
      positions.at(-1),
    );
  }
  await page.goto(`?classicAct1=1&character=${owners[0]!.id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
    positions[0],
  );
});

test("missing Classic owner blocks readiness and saving with actionable selection recovery", async ({
  page,
}) => {
  await page.goto(
    "?classicAct1=1&character=10000000-0000-4000-8000-000000000099",
  );
  await expect(page.locator("#inventory-status")).toContainText(
    "no longer exists",
  );
  await expect(page.locator("#inventory-save")).toBeDisabled();
  await expect(page.locator("#classic-act1-indicator")).not.toBeVisible();
  expect(
    await page.evaluate(() => window.hollowbaneClassicAct1),
  ).toBeUndefined();
  await page
    .getByRole("link", { name: "Return to character selection" })
    .click();
  await expect(page).toHaveURL(/\?classicAct1=1$/);
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
});

test("Classic waits for IndexedDB owner readiness before activating the campaign", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const id = await page.evaluate(
    async (text) => {
      const api = window.characterStorageModule;
      const store = new api.CharacterStorage();
      try {
        return (
          await store.create("Awaited Ranger", api.deserializeCharacter(text))
        ).id;
      } finally {
        store.close();
      }
    },
    serializeCharacter(newCharacter("ranger")),
  );
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open;
    const success = Object.getOwnPropertyDescriptor(
      IDBRequest.prototype,
      "onsuccess",
    )!;
    const pending: (() => void)[] = [];
    let released = false;
    window.addEventListener("release-classic-owner-storage", () => {
      released = true;
      for (const ready of pending.splice(0)) ready();
    });
    IDBFactory.prototype.open = function (name, version) {
      const request =
        version === undefined
          ? open.call(this, name)
          : open.call(this, name, version);
      if (name === "hollowbane-characters-v1")
        Object.defineProperty(request, "onsuccess", {
          set(handler: (this: IDBOpenDBRequest, event: Event) => void) {
            success.set!.call(request, (event: Event) => {
              if (released) handler.call(request, event);
              else {
                pending.push(() => handler.call(request, event));
                document.documentElement.dataset.classicOwnerWaiting = "true";
              }
            });
          },
        });
      return request;
    };
  });
  await page.goto(`?classicAct1=1&character=${id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-owner-waiting",
    "true",
  );
  await expect(page.locator("#inventory-save")).toBeDisabled();
  await expect(page.locator("#classic-act1-indicator")).not.toBeVisible();
  expect(
    await page.evaluate(() => window.hollowbaneClassicAct1),
  ).toBeUndefined();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("release-classic-owner-storage")),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-classic-act1",
    "active",
  );
  expect(await page.evaluate(() => window.hollowbaneClassicAct1!.ownerId)).toBe(
    id,
  );
  expect(await page.evaluate(() => window.hollowbaneClassicAct1!.classId)).toBe(
    "ranger",
  );
  expect(await page.evaluate(() => window.hollowbaneWorld!.fingerprint)).toBe(
    layoutFingerprint(classicAct1Layout(42)),
  );
});
