import { expect as baseExpect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
const expect = baseExpect.configure({ timeout: 20_000 });
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import { installVirtualController } from "./virtual-controller";
import { WorldSession } from "../../src/simulation/world-session";
import type { AreaId } from "../../src/simulation/world";
import { worldLayout } from "../../src/simulation/world-layout";
import {
  areaNavigation,
  findPath,
  fromGround,
} from "../../src/world/navigation";
import { driveQuestPoint } from "./quest-world-input";
import {
  allocateSkillRanks,
  assignSkill,
} from "../../src/simulation/skill-progression";
test.setTimeout(120_000);

async function existing(
  page: Page,
  classId: "warrior" | "sorcerer" | "ranger" = "warrior",
  area: AreaId = "ashen-refuge",
  legacy = false,
) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const s = characterSlotFixture(classId);
  if (area !== "ashen-refuge") {
    const w = new WorldSession(undefined, 42, 2, area);
    s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  }
  if (classId === "warrior")
    s.progression = {
      ...s.progression!,
      skills: assignSkill(
        allocateSkillRanks(s.progression!.skills, 24, {
          "warrior-resolve-foundation": 1,
        }),
        1,
        "oath-echo",
      ),
    };
  s.character.grid.items = [
    { item: inventoryItem("reed-bow"), x: 0, y: 0 },
    { item: inventoryItem("cinder-staff"), x: 3, y: 0 },
    { item: inventoryItem("bark-guard"), x: 5, y: 0 },
  ];
  const id = await page.evaluate(
    async ({ text, classId, legacy }) => {
      const api = window.characterStorageModule,
        store = new api.CharacterStorage();
      try {
        sessionStorage.setItem("hollowbane-warrior-legacy", legacy ? "1" : "0");
        return (
          await store.create(
            `Production ${classId}`,
            api.deserializeCharacter(text),
          )
        ).id;
      } finally {
        store.close();
      }
    },
    { text: serializeCharacter(s), classId, legacy },
  );
  await page.goto(`./?world=1&character=${id}`);
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-renderer",
    classId === "warrior" && !legacy ? "warrior" : "legacy",
  );
  return id;
}
const state = (page: Page) =>
  page.evaluate(() => {
    const v = window.hollowbaneWarriorProduction!;
    return { ...v, setLegacy: undefined };
  });

test("new Warrior uses approved production assets only after character creation", async ({
  page,
}, info) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  expect(
    requests.filter((r) => /\/assets\/warrior\/|\/dev\//.test(r)),
  ).toHaveLength(0);
  await page.locator("#menu-new").click();
  await page.locator('[data-class="warrior"]').click();
  await page.getByLabel("Character name").fill("Production Sword");
  await page.getByRole("button", { name: "Review character" }).click();
  await page.locator("#menu-create-confirm").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-renderer",
    "warrior",
  );
  expect(await state(page)).toMatchObject({
    mode: "warrior",
    reason: "supported",
    textures: 40,
    decodedBytes: 366215168,
  });
  expect(requests.filter((r) => /\/assets\/warrior\//.test(r))).toHaveLength(
    40,
  );
  expect(requests.filter((r) => /\/dev\//.test(r))).toHaveLength(0);
  await page.screenshot({ path: info.outputPath("new-warrior-camp.png") });
  expect(errors).toEqual([]);
});

test("historical blade, live bow/staff fallback, repeated debug leases and save/reload", async ({
  page,
}, info) => {
  const id = await existing(page);
  await page.locator("#inventory-open").click();
  for (const name of ["Reed Bow", "Cinder Staff", "Ash Blade"]) {
    // Select actual authored equipment by base metadata rather than generated display name.
    const base = {
      "Reed Bow": "reed-bow",
      "Cinder Staff": "cinder-staff",
      "Ash Blade": "ash-blade",
    }[name]!;
    const itemId = inventoryItem(base, 0, base === "ash-blade" ? 2 : 3).id;
    expect(itemId).toBeTruthy();
    await page
      .locator(`#inventory-grid button[data-item="${itemId}"]`)
      .first()
      .click();
    await page.locator("#inventory-equip").click();
    await expect
      .poll(async () => (await state(page)).reason)
      .toBe(base === "ash-blade" ? "supported" : `unsupported-weapon:${base}`);
    await expect
      .poll(async () => (await state(page)).textures)
      .toBe(base === "ash-blade" ? 40 : 0);
  }
  const shield = inventoryItem("bark-guard").id;
  await page
    .locator(`#inventory-grid button[data-item="${shield}"]`)
    .first()
    .click();
  await page.locator("#inventory-equip").click();
  await expect
    .poll(async () => (await state(page)).reason)
    .toBe("unsupported-offhand:bark-guard");
  await expect.poll(async () => (await state(page)).textures).toBe(0);
  await page.locator('#inventory-gear [data-slot="off"]').click();
  await page.locator("#inventory-take").click();
  await page.locator('[data-focus="cell-8-0"]').click();
  await expect.poll(async () => (await state(page)).mode).toBe("warrior");
  await page.locator('#inventory-gear [data-slot="main"]').click();
  await page.locator("#inventory-take").click();
  await page.locator('[data-focus="cell-7-0"]').click();
  await expect
    .poll(async () => (await state(page)).reason)
    .toBe("empty-main-hand");
  await expect.poll(async () => (await state(page)).textures).toBe(0);
  await page.locator('[data-focus="cell-7-0"]').click();
  await page.locator("#inventory-equip").click();
  await expect.poll(async () => (await state(page)).mode).toBe("warrior");
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.locator("#inventory-close").click();
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() =>
      window.hollowbaneWarriorProduction!.setLegacy(true),
    );
    await expect.poll(async () => (await state(page)).textures).toBe(0);
    expect((await state(page)).reason).toBe("debug-legacy");
    await page.evaluate(() =>
      window.hollowbaneWarriorProduction!.setLegacy(false),
    );
    await expect.poll(async () => (await state(page)).textures).toBe(40);
  }
  await page.screenshot({ path: info.outputPath("existing-warrior-camp.png") });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-renderer",
    "warrior",
  );
  expect(page.url()).toContain(id);
  await page.locator("#player-pause-open").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-continue").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-renderer",
    "warrior",
  );
});

for (const classId of ["sorcerer", "ranger"] as const)
  test(`${classId} keeps legacy presentation and downloads no Warrior or developer atlases`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await existing(page, classId);
    expect(await state(page)).toMatchObject({
      mode: "legacy",
      reason: "other-class",
      textures: 0,
    });
    expect(
      requests.filter((r) => /\/assets\/warrior\/|\/dev\//.test(r)),
    ).toHaveLength(0);
  });

test("virtual controller movement consumes campaign state with Warrior graphics", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox virtual standard");
  await existing(page);
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  const before = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes[0] = 1;
  });
  await expect
    .poll(async () => {
      const p = await page.evaluate(() => window.hollowbaneWorld!.position);
      return Math.hypot(p.x - before.x, p.y - before.y);
    })
    .toBeGreaterThan(0.2);
  await page.evaluate(() => {
    window.virtualPads[0]!.axes[0] = 0;
  });
  expect((await state(page)).mode).toBe("warrior");
});

test("missing combat atlas fails safely to legacy and releases partial textures", async ({
  page,
}) => {
  await page.route("**/assets/warrior/death-n-*.png", (route) =>
    route.fulfill({ status: 404, body: "Missing test atlas" }),
  );
  // This is a deliberate failed load; the helper's candidate-ready expectation is inapplicable.
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-new").click();
  await page.locator('[data-class="warrior"]').click();
  await page.getByLabel("Character name").fill("Safe Fallback");
  await page.getByRole("button", { name: "Review character" }).click();
  await page.locator("#menu-create-confirm").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(async () => (await state(page))?.reason)
    .toBe("asset-load-failed");
  await expect.poll(async () => (await state(page)).textures).toBe(0);
  expect((await state(page)).mode).toBe("legacy");
  const tick = await page.evaluate(() => window.hollowbaneCombat!.tick);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
    .toBeGreaterThan(tick);
});

for (const area of [
  "haunted-forest",
  "forgotten-graveyard",
  "ancient-crypt",
] as const)
  test(`approved Warrior draws on normal ${area} terrain and retains atlas ownership`, async ({
    page,
  }, info) => {
    await existing(page, "warrior", area);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe(area);
    expect((await state(page)).textures).toBe(40);
    await page.screenshot({ path: info.outputPath(`${area}-warrior.png`) });
  });

test("real forest melee and both Warrior abilities retain existing input and simulation effects", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual standard");
  const profiling = process.env.WARRIOR_PRODUCTION_PROFILE === "1";
  const legacy = profiling && process.env.WARRIOR_PRODUCTION_LEGACY === "1";
  if (profiling)
    await page.addInitScript(() =>
      localStorage.setItem(
        "hollowbane.presentation.v1",
        JSON.stringify({ version: 1, quality: "full", volume: 1, muted: true }),
      ),
    );
  await existing(page, "warrior", "haunted-forest", legacy);
  if (profiling) {
    await page.evaluate(async () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        "#combat-world canvas",
      )!;
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) throw Error("Native WebGL unavailable");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : "unknown";
      if (!/Metal Renderer: Apple M4/.test(renderer))
        throw Error(`Expected native M4/Metal: ${renderer}`);
      await new Promise<void>((resolve) => {
        let n = 0;
        const warm = () => {
          if (++n === 60) resolve();
          else requestAnimationFrame(warm);
        };
        requestAnimationFrame(warm);
      });
      const frames: {
        ms: number;
        tick: number;
        hp: number;
        actors: number;
        clip: string | null;
        direction: number;
        textures: number;
        x: number;
        y: number;
        relativeX: number;
        relativeY: number;
        updateP95: number;
        renderP95: number;
      }[] = [];
      let previous: number | null = null,
        running = true;
      window.warriorBattleEvidence = {
        renderer,
        frames,
        stop: () => {
          running = false;
        },
      };
      const sample = (now: number) => {
        const c = window.hollowbaneCombat!,
          w = window.hollowbaneWorld!,
          v = window.hollowbaneWarriorProduction!;
        if (previous !== null)
          frames.push({
            ms: now - previous,
            tick: c.tick,
            hp: c.actors[0]!.hp,
            actors: c.actors.length,
            clip: v.pose?.clip ?? null,
            direction: c.actors[0]!.direction,
            textures: v.textures,
            x: w.position.x,
            y: w.position.y,
            relativeX:
              (768 + (w.position.x - w.position.y) * 64 - w.camera.x) *
              w.camera.zoom,
            relativeY:
              (512 + (w.position.x + w.position.y) * 32 - w.camera.y) *
              w.camera.zoom,
            updateP95: c.metrics.updateP95,
            renderP95: c.metrics.renderP95,
          });
        previous = now;
        if (running && frames.length < 10000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  }
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  // Prepare the self buff before approaching the hostile pack, as a player can.
  await page.keyboard.press("q");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) =>
            e.kind === "effect" && e.actor === 0 && e.skill === "oath-echo",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  const target = await page.evaluate(() => {
    const c = window.hollowbaneCombat!,
      p = c.actors[0]!;
    const enemy = c.actors
      .filter((a) => a.id !== 0 && a.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0]!;
    return {
      id: enemy.id,
      position: { x: enemy.x, y: enemy.y },
      start: window.hollowbaneWorld!.position,
    };
  });
  const route = findPath(
    areaNavigation(worldLayout("haunted-forest", 42, 2).map),
    target.start,
    fromGround(target.position),
  );
  expect(route.length).toBeGreaterThan(0);
  for (const point of route) await driveQuestPoint(page, point);
  const aim = await page.evaluate((id) => {
    const enemy = window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
      camera = window.hollowbaneWorld!.camera;
    return {
      x: (enemy.x - camera.x) * camera.zoom,
      y: (enemy.y - 28 - camera.y) * camera.zoom,
    };
  }, target.id);
  await page.mouse.move(aim.x, aim.y);
  await page.mouse.down();
  try {
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.kind === "damage" && e.actor === 0,
          ),
        ),
      )
      .toBe(true);
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  // Real hostile hits may legitimately interrupt a cast. Reissue through normal
  // input only after actual recovery/cooldown; never grant immunity or effects.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (
      await page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.kind === "effect" && e.actor === 0 && e.skill === "iron-fan",
        ),
      )
    )
      break;
    await expect
      .poll(() =>
        page.evaluate(() => {
          const c = window.hollowbaneCombat!,
            u = window.hollowbaneSkills!.users.find((u) => u.actor === 0)!;
          return (
            c.actors[0]!.phase === "idle" &&
            (u.cooldowns["iron-fan"] ?? 0) <= c.tick
          );
        }),
      )
      .toBe(true);
    const tick = await page.evaluate(() => window.hollowbaneCombat!.tick);
    await page.keyboard.press("1");
    await expect
      .poll(() =>
        page.evaluate(
          (tick) =>
            window.hollowbaneSkills!.events.some(
              (e) =>
                e.actor === 0 &&
                e.skill === "iron-fan" &&
                e.tick > tick &&
                e.kind !== "start",
            ),
          tick,
        ),
      )
      .toBe(true);
  }
  expect(
    await page.evaluate(() =>
      window.hollowbaneSkills!.events.some(
        (e) => e.kind === "effect" && e.actor === 0 && e.skill === "iron-fan",
      ),
    ),
  ).toBe(true);
  expect((await state(page)).mode).toBe(legacy ? "legacy" : "warrior");
  if (profiling) {
    const evidence = await page.evaluate(() => {
      window.warriorBattleEvidence!.stop();
      return {
        renderer: window.warriorBattleEvidence!.renderer,
        frames: window.warriorBattleEvidence!.frames,
        dpr: devicePixelRatio,
        resolution: [innerWidth, innerHeight],
      };
    });
    writeFileSync(
      info.outputPath("native-battle.json"),
      JSON.stringify(
        { mode: legacy ? "legacy" : "warrior", ...evidence },
        null,
        2,
      ),
    );
  }
  await page.screenshot({ path: info.outputPath("forest-real-combat.png") });
});

declare global {
  interface Window {
    warriorBattleEvidence?: {
      renderer: string;
      frames: {
        ms: number;
        tick: number;
        hp: number;
        actors: number;
        clip: string | null;
        direction: number;
        textures: number;
        x: number;
        y: number;
        relativeX: number;
        relativeY: number;
        updateP95: number;
        renderP95: number;
      }[];
      stop(): void;
    };
  }
}

test("natural campaign death holds its terminal pose across legacy switching and texture reload", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual standard");
  await existing(page, "warrior", "ancient-crypt");
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  const target = await page.evaluate(() => {
    const c = window.hollowbaneCombat!,
      p = c.actors[0]!;
    const a = c.actors
      .filter((a) => a.id !== 0 && a.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0]!;
    return {
      start: window.hollowbaneWorld!.position,
      end: { x: a.x, y: a.y },
      hp: p.hp,
    };
  });
  const route = findPath(
    areaNavigation(worldLayout("ancient-crypt", 42, 2).map),
    target.start,
    fromGround(target.end),
  );
  expect(route.length).toBeGreaterThan(0);
  for (const point of route) {
    try {
      await driveQuestPoint(page, point);
    } catch (error) {
      if (await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp > 0))
        throw error;
    }
    if (
      await page.evaluate(
        (hp) => window.hollowbaneCombat!.actors[0]!.hp < hp,
        target.hp,
      )
    )
      break;
  }
  await expect
    .poll(
      () => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase),
      { timeout: 90_000 },
    )
    .toBe("dead");
  await expect
    .poll(async () => (await state(page)).pose)
    .toEqual({ set: "death", frame: 15, clip: "death" });
  const before = await page.evaluate(() => {
    const c = window.hollowbaneCombat!,
      a = c.actors[0]!;
    return { tick: c.tick, x: a.x, y: a.y, sequence: a.sequence };
  });
  await page.evaluate(() =>
    window.hollowbaneWarriorProduction!.setLegacy(true),
  );
  await expect.poll(async () => (await state(page)).textures).toBe(0);
  await page.evaluate(() =>
    window.hollowbaneWarriorProduction!.setLegacy(false),
  );
  await expect.poll(async () => (await state(page)).mode).toBe("warrior");
  expect((await state(page)).pose).toEqual({
    set: "death",
    frame: 15,
    clip: "death",
  });
  expect(
    await page.evaluate(() => {
      const a = window.hollowbaneCombat!.actors[0]!;
      return { hp: a.hp, phase: a.phase, x: a.x, y: a.y, sequence: a.sequence };
    }),
  ).toEqual({
    hp: 0,
    phase: "dead",
    x: before.x,
    y: before.y,
    sequence: before.sequence,
  });
  expect(
    await page.evaluate(
      (tick) =>
        window.hollowbaneSkills!.events.some(
          (e) => e.actor === 0 && e.kind === "effect" && e.tick > tick,
        ),
      before.tick,
    ),
  ).toBe(false);
  await page.screenshot({ path: info.outputPath("crypt-held-corpse.png") });
  await page.screenshot({
    path: info.outputPath("crypt-held-corpse-detail.png"),
    clip: { x: 448, y: 100, width: 384, height: 300 },
  });
});
