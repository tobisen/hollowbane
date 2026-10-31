import { expect, test, type Page } from "@playwright/test";
import { classicAct1Layout } from "../../src/simulation/classic-act1-layout";
import { layoutFingerprint } from "../../src/simulation/world-layout";
import { worldLayout } from "../../src/simulation/world-layout";
import { characterApi } from "../fixtures/character-api";
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
    await page.goto(`?classicAct1=1&class=${classId}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-classic-act1",
      "active",
    );
    await expect(page.locator("#classic-act1-indicator")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.fingerprint))
      .toBe(layoutFingerprint(classicAct1Layout(42)));
    await expect(page.locator("#classic-act1-error")).toHaveCount(0);
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
  await page.goto("?classicAct1=1");
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
  await page.goto("?classicAct1=1");
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
    serializeCharacter(newCharacter("warrior")),
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
        };
      } finally {
        storage.close();
      }
    }, id);
  };
  const before = await snapshot();
  await page.goto("?classicAct1=1");
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
  await expect(page.locator("#menu-status")).toContainText(
    "unsupported options",
  );
  expect(await snapshot()).toEqual(before);
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
  await page.goto("?classicAct1=1");
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
