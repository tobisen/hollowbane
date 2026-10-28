import { expect as baseExpect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
const expect = baseExpect.configure({ timeout: 20_000 });
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { WorldSession } from "../../src/simulation/world-session";
import type { AreaId } from "../../src/simulation/world";
import equipmentAssets from "../../src/rendering/warrior-equipment-assets.json" with { type: "json" };
import { worldLayout } from "../../src/simulation/world-layout";
import { createCombat } from "../../src/simulation/combat";
import {
  areaNavigation,
  findPath,
  fromGround,
} from "../../src/world/navigation";
import { driveQuestPoint, driveQuestPoints } from "./quest-world-input";
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
  shield = false,
  initial?: ReturnType<typeof characterSlotFixture>,
) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await characterApi(page);
  const s = initial ?? characterSlotFixture(classId);
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
  if (shield) {
    s.character.equipment.off = inventoryItem("bark-guard");
    s.character.grid.items = s.character.grid.items.filter(
      (entry) => entry.item.base !== "bark-guard",
    );
  }
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

test("historical blade, live shield, bow/staff fallback, repeated debug leases and save/reload", async ({
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
    .toBe("supported-shield");
  await expect.poll(async () => (await state(page)).textures).toBe(42);
  expect((await state(page)).decodedBytes).toBe(373.25 * 1024 ** 2);
  await page.locator('#inventory-gear [data-slot="off"]').click();
  await page.locator("#inventory-take").click();
  await page.locator('[data-focus="cell-8-0"]').click();
  await expect.poll(async () => (await state(page)).mode).toBe("warrior");
  await expect.poll(async () => (await state(page)).textures).toBe(40);
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

test("restored sword/shield survives Save and Exit and releases its conditional textures", async ({
  page,
}, info) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.message));
  await existing(page, "warrior", "ashen-refuge", false, true);
  await expect
    .poll(async () => (await state(page)).equipment.visible)
    .toBe(true);
  expect(await state(page)).toMatchObject({
    reason: "supported-shield",
    textures: 42,
    decodedBytes: 373.25 * 1024 ** 2,
    equipment: { textures: 2, visible: true, bodyVariant: false },
  });
  expect(requests.filter((url) => /\/dev\//.test(url))).toEqual([]);
  await page.locator("#combat-world").focus();
  const start = await page.evaluate(() => window.hollowbaneWorld!.position);
  await page.keyboard.down("s");
  await page.waitForFunction((start) => {
    const p = window.hollowbaneWorld!.position;
    return Math.hypot(p.x - start.x, p.y - start.y) > 1.5;
  }, start);
  await page.keyboard.up("s");
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.walking),
    )
    .toBe(false);
  const savedPosition = await page.evaluate(
    () => window.hollowbaneWorld!.position,
  );
  await page.screenshot({ path: info.outputPath("restored-shield-camp.png") });
  await page.locator("#player-pause-open").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-continue").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-warrior-renderer",
    "warrior",
  );
  await expect
    .poll(async () => (await state(page)).equipment.visible)
    .toBe(true);
  expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
    savedPosition,
  );
  expect(await state(page)).toMatchObject({
    reason: "supported-shield",
    textures: 42,
    equipment: { textures: 2, visible: true },
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.evaluate(() =>
      window.hollowbaneWarriorProduction!.setLegacy(true),
    );
    await expect.poll(async () => (await state(page)).textures).toBe(0);
    await page.evaluate(() =>
      window.hollowbaneWarriorProduction!.setLegacy(false),
    );
    await expect.poll(async () => (await state(page)).textures).toBe(42);
    await expect
      .poll(async () => (await state(page)).equipment.visible)
      .toBe(true);
  }
  expect(errors).toEqual([]);
});

for (const [name, entry] of Object.entries(equipmentAssets.textures))
  test(`missing ${name} equipment atlas fails completely and recovers after reload`, async ({
    page,
  }) => {
    const requests: string[] = [],
      errors: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/assets/warrior/equipment-"))
        requests.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await existing(page, "warrior", "ashen-refuge", true, true);
    const pattern = `**/${entry.image}`;
    await page.route(pattern, (r) =>
      r.fulfill({ status: 404, body: "Deliberately missing equipment atlas" }),
    );
    await page.evaluate(() =>
      window.hollowbaneWarriorProduction!.setLegacy(false),
    );
    await expect
      .poll(async () => (await state(page)).reason)
      .toBe("asset-load-failed");
    await expect.poll(async () => (await state(page)).textures).toBe(0);
    expect((await state(page)).equipment.visible).toBe(false);
    const count = requests.length,
      tick = await page.evaluate(() => window.hollowbaneCombat!.tick);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
      .toBeGreaterThan(tick + 30);
    expect(requests).toHaveLength(count);
    await page.unroute(pattern);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-warrior-renderer",
      "warrior",
    );
    await expect.poll(async () => (await state(page)).textures).toBe(42);
    await expect
      .poll(async () => (await state(page)).equipment.visible)
      .toBe(true);
    expect(errors).toEqual([]);
  });

test("shield ownership survives saved waypoint travel and a real forest-to-camp portal", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual standard");
  const fixture = characterSlotFixture("warrior"),
    world = new WorldSession(fixture.exploration),
    combat = createCombat();
  combat.actors = [combat.actors[0]!];
  // Construct a legal previously visited/attuned save before the browser opens.
  for (const exit of ["forest", "camp"]) {
    combat.actors[0]!.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === exit)!.trigger,
    };
    expect(world.transition(combat, fixture.loot)).toBe(true);
    world.attuneWaypoint(world.travel.layout.spawn, true, true, true);
  }
  fixture.exploration = world.capture(world.travel.layout.spawn, fixture.loot);
  const id = await existing(
    page,
    "warrior",
    "ashen-refuge",
    false,
    true,
    fixture,
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.locator("#world-waypoints-open").click();
  await page.locator('[data-destination="haunted-forest"]').click();
  await page.locator("#waypoint-confirm").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("haunted-forest");
  await expect(page.locator("#waypoint-save-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  expect(await state(page)).toMatchObject({
    textures: 42,
    reason: "supported-shield",
    equipment: { visible: true },
  });
  await page.locator("#waypoint-close").click();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("haunted-forest");
  await expect.poll(async () => (await state(page)).textures).toBe(42);
  await page.locator("#combat-world").focus();
  await pressVirtualButton(page, 10);
  // Normal character routes intentionally omit developer navigation callbacks.
  // Use the same pure layout/pathfinder, then deliver the original live stick input.
  const layout = worldLayout("haunted-forest", 42, 2);
  const start = await page.evaluate(() => window.hollowbaneWorld!.position);
  const path = findPath(
    areaNavigation(layout.map),
    start,
    layout.exits.find((e) => e.id === "camp")!.trigger,
  );
  expect(path.length).toBeGreaterThan(0);
  await driveQuestPoints(page, path, "haunted-forest", path);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld!.area))
    .toBe("ashen-refuge");
  await expect
    .poll(async () => (await state(page)).equipment.visible)
    .toBe(true);
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.locator("#inventory-close").click();
  await characterApi(page);
  const saved = await page.evaluate(async (id) => {
    const store = new window.characterStorageModule.CharacterStorage();
    try {
      const result = await store.load(id);
      if (result.kind !== "valid")
        throw Error("Invalid equipment/travel checkpoint");
      return {
        area: result.session.exploration!.area,
        main: result.session.character.equipment.main?.id,
        off: result.session.character.equipment.off?.id,
      };
    } finally {
      store.close();
    }
  }, id);
  expect(saved).toEqual({
    area: "ashen-refuge",
    main: fixture.character.equipment.main!.id,
    off: inventoryItem("bark-guard").id,
  });
  await page.screenshot({ path: info.outputPath("shield-returned-camp.png") });
  expect(errors).toEqual([]);
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
    await existing(page, "warrior", area, false, true);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
      .toBe(area);
    expect((await state(page)).textures).toBe(42);
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
  await existing(page, "warrior", "haunted-forest", legacy, true);
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
  const cpu =
    profiling && process.env.WARRIOR_PRODUCTION_CPU === "1"
      ? await page.context().newCDPSession(page)
      : null;
  if (cpu) {
    await cpu.send("Profiler.enable");
    await cpu.send("Profiler.start");
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
  // Use the normal Run control for the long forest approach; the original
  // ten-second waypoint deadlines also apply on slower software-rendered CI.
  await pressVirtualButton(page, 10);
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
  try {
    await expect
      .poll(async () => {
        const observation = await page.evaluate(() => {
          const combat = window.hollowbaneCombat!,
            player = combat.actors[0]!,
            camera = window.hollowbaneWorld!.camera;
          const enemy = combat.actors
            .filter((a) => a.id !== 0 && a.hp > 0)
            .sort(
              (a, b) =>
                Math.hypot(a.x - player.x, a.y - player.y) -
                Math.hypot(b.x - player.x, b.y - player.y),
            )[0];
          return {
            damaged: combat.events.some(
              (e) => e.kind === "damage" && e.actor === 0,
            ),
            phase: player.phase,
            aim: enemy
              ? {
                  x: (enemy.x - camera.x) * camera.zoom,
                  y: (enemy.y - 28 - camera.y) * camera.zoom,
                }
              : null,
          };
        });
        if (observation.damaged) return true;
        // The pack moves during approach. Re-acquire a nearby living opponent
        // through trusted mouse input; let committed attacks finish normally.
        if (observation.phase === "idle" && observation.aim) {
          await page.mouse.up();
          await page.mouse.move(observation.aim.x, observation.aim.y);
          await page.mouse.down();
        }
        return page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.kind === "damage" && e.actor === 0,
          ),
        );
      })
      .toBe(true);
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase))
    .toBe("idle");
  // Read only public presentation snapshots. Approach/cycle/cast through the
  // same sampled virtual controller as normal play, without a host polling race.
  const fan = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const pad = window.virtualPads[0]!,
          start = window.hollowbaneCombat!.tick;
        let down: { index: number; sample: number } | null = null,
          readyAfter = 0;
        const button = (index: number, pressed: boolean) => {
          pad.buttons[index] = {
            pressed,
            touched: pressed,
            value: pressed ? 1 : 0,
          };
        };
        const finish = (success: boolean) => {
          pad.axes[0] = pad.axes[1] = 0;
          button(5, false);
          button(11, false);
          resolve(success);
        };
        const sample = () => {
          const c = window.hollowbaneCombat!,
            p = c.actors[0]!,
            u = window.hollowbaneSkills!.users.find((u) => u.actor === 0)!,
            count = window.hollowbaneInput!.samples;
          if (
            window.hollowbaneSkills!.events.some(
              (e) =>
                e.actor === 0 && e.skill === "iron-fan" && e.kind === "effect",
            )
          )
            return finish(true);
          if (p.hp <= 0 || c.tick - start > 1800) return finish(false);
          if (down) {
            if (count >= down.sample + 3) {
              button(down.index, false);
              down = null;
              readyAfter = count + 3;
            }
            requestAnimationFrame(sample);
            return;
          }
          const targets = c.actors
            .filter((a) => a.id !== 0 && a.hp > 0)
            .map((a) => {
              const dx = (a.x - p.x) / 64,
                dy = (a.y - p.y) / 32;
              return {
                id: a.id,
                dx,
                dy,
                distance: Math.hypot((dx + dy) / 2, (dy - dx) / 2),
              };
            })
            .sort((a, b) => a.distance - b.distance);
          const nearest = targets[0];
          if (!nearest) return finish(false);
          const selected = targets.find((a) => a.id === p.selected);
          if (nearest.distance > 1) {
            const n = Math.hypot(nearest.dx, nearest.dy);
            pad.axes[0] = nearest.dx / n;
            pad.axes[1] = nearest.dy / n;
          } else {
            pad.axes[0] = pad.axes[1] = 0;
            if (count >= readyAfter) {
              const index =
                !selected || selected.distance > 1.25
                  ? 11
                  : p.phase === "idle" &&
                      (u.cooldowns["iron-fan"] ?? 0) <= c.tick
                    ? 5
                    : null;
              if (index !== null) {
                button(index, true);
                down = { index, sample: count };
              }
            }
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(fan).toBe(true);
  expect(
    await page.evaluate(
      () =>
        window.hollowbaneSkills!.events.filter(
          (e) => e.actor === 0 && e.skill === "iron-fan" && e.kind === "effect",
        ).length,
    ),
  ).toBe(1);
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
    if (cpu) {
      const { profile } = await cpu.send("Profiler.stop");
      writeFileSync(
        info.outputPath("native-battle.cpuprofile"),
        JSON.stringify(profile),
      );
      await cpu.detach();
    }
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

test("normal campaign Warrior walks and runs in all eight facing directions", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual standard");
  await existing(page, "warrior", "ashen-refuge", false, true);
  await page.locator("#combat-world").focus();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
    .toBe(true);
  for (const gait of ["walk", "run"] as const) {
    if (gait === "run") await pressVirtualButton(page, 10);
    const directions = new Set<number>();
    for (const [x, y] of [
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
    ]) {
      const before = await page.evaluate(
        () => window.hollowbaneWorld!.position,
      );
      await page.evaluate(
        ({ x, y }) => {
          window.virtualPads[0]!.axes[0] = x!;
          window.virtualPads[0]!.axes[1] = y!;
        },
        { x, y },
      );
      const sample = await page.waitForFunction(
        ({ before, gait }) => {
          const p = window.hollowbaneWorld!.position,
            actor = window.hollowbaneCombat!.actors[0]!,
            clip = window.hollowbaneWarriorProduction!.pose?.clip,
            distance = Math.hypot(p.x - before.x, p.y - before.y);
          if (!actor.walking || clip !== gait || distance <= 0.15) return null;
          // End the real input at the observed displacement, before host polling
          // or a slow screenshot can carry the actor into the camp boundary.
          window.virtualPads[0]!.axes[0] = window.virtualPads[0]!.axes[1] = 0;
          return {
            direction: actor.direction,
            walking: actor.walking,
            clip,
            distance,
          };
        },
        { before, gait },
        { timeout: 10_000 },
      );
      const observed = await sample.jsonValue();
      expect(observed?.walking).toBe(true);
      expect(observed?.clip).toBe(gait);
      expect(observed?.distance).toBeGreaterThan(0.15);
      directions.add(observed!.direction);
      if (directions.size === 1)
        await page.screenshot({
          path: info.outputPath(`campaign-after-${gait}.png`),
        });
      await expect
        .poll(() =>
          page.evaluate(() => window.hollowbaneCombat!.actors[0]!.walking),
        )
        .toBe(false);
    }
    expect([...directions].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  }
  expect((await state(page)).textures).toBe(42);
});

test("natural campaign death holds its terminal pose across legacy switching and texture reload", async ({
  page,
}, info) => {
  await installVirtualController(page, "Xbox virtual standard");
  await existing(page, "warrior", "ancient-crypt", false, true);
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
  await expect
    .poll(async () => (await state(page)).equipment.bodyVariant)
    .toBe(true);
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
