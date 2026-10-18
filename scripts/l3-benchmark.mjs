/* global window, document, navigator, performance, requestAnimationFrame, Buffer */
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { writeFile } from "node:fs/promises";
import os from "node:os";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
});
const load = (path) => server.ssrLoadModule(`/src/simulation/${path}.ts`);
const { createInventorySession } = await load("inventory-world");
const { inventoryItem } = await load("inventory-test-helper");
const { advancedItem } = await load("advanced-item-test-helper");
const { generateLoot } = await load("loot");
const { identifyItem } = await load("item-save");
const { registeredItemContent } = await load("item-registry");
const { insertSocket } = await load("item-sockets");
const { captureEquipmentBase, deriveEquipment } = await load("equipment-stats");
const { createCombat } = await load("combat");
const { serializeCharacter, deserializeCharacter } =
  await load("inventory-save");
const q = (values, p = 0.95) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ] ?? 0;
function fixture(advanced) {
  const s = createInventorySession();
  s.character.level = 40;
  const slots = {
    main: "reed-bow",
    helmet: "iron-cap",
    chest: "woven-coat",
    gloves: "sootwrap-gloves",
    boots: "trail-boots",
    belt: "hemp-sash",
    ring1: "copper-band",
    ring2: "copper-band",
    amulet: "slate-pendant",
  };
  for (const [slot, base] of Object.entries(slots))
    s.character.equipment[slot] = inventoryItem(
      base,
      slot === "ring2" ? 1000 : 0,
    );
  if (advanced) {
    const sequences = {
      helmet: 4690,
      chest: 1964,
      gloves: 47,
      boots: 1873,
      belt: 26534,
      ring1: 233735,
      ring2: 312426,
      amulet: 380035,
    };
    for (const [slot, sequence] of Object.entries(sequences))
      s.character.equipment[slot] = identifyItem(
        generateLoot(
          {
            seed: 42,
            sequence,
            areaLevel: 12,
            monsterLevel: 12,
            table: "sanctum",
          },
          registeredItemContent(4),
        ),
      );
    const host = advancedItem("reed-bow", {
      accept: (i) => i.quality === "normal" && i.socketCapacity === 4,
    });
    s.character.equipment.main = host;
    for (const [x, id] of [
      "sigil-jorath",
      "sigil-kessil",
      "sigil-lyrvek",
      "sigil-faelor",
    ].entries())
      s.character.grid.items.push({
        item: advancedItem(id, { seed: 44 }),
        x,
        y: 0,
      });
    for (const id of s.character.grid.items.map((e) => e.item.id)) {
      const next = insertSocket(s.character, host.id, id);
      if (!next.ok) throw Error(next.reason);
      s.character = next.value;
    }
  }
  let start = 0;
  for (let i = 0; i < 21; i++) {
    const item = advanced
      ? advancedItem("fire-gem-3", { seed: 43, start })
      : inventoryItem("copper-band", start);
    start = item.origin.sequence + 1;
    // Avoid the equipped ring identities in the legacy fixture.
    if (
      !advanced &&
      Object.values(s.character.equipment).some((e) => e.id === item.id)
    ) {
      i--;
      continue;
    }
    s.character.grid.items.push({ item, x: i % 10, y: Math.floor(i / 10) });
  }
  return s;
}
const fixtures = { l2: fixture(false), l3: fixture(true) },
  cpu = {};
const base = captureEquipmentBase(createCombat().actors[0]);
for (const [name, s] of Object.entries(fixtures)) {
  const encoded = serializeCharacter(s),
    derive = [],
    encode = [],
    decode = [];
  for (let i = 0; i < 1100; i++) {
    const t = performance.now();
    deriveEquipment(s.character, base);
    if (i >= 100) derive.push(performance.now() - t);
  }
  for (let i = 0; i < 110; i++) {
    let t = performance.now();
    serializeCharacter(s);
    if (i >= 10) encode.push(performance.now() - t);
    t = performance.now();
    deserializeCharacter(encoded);
    if (i >= 10) decode.push(performance.now() - t);
  }
  cpu[name] = {
    derivedP50: q(derive, 0.5),
    derivedP95: q(derive),
    encodeP95: q(encode),
    decodeP95: q(decode),
    bytes: encoded.length,
    modifiers:
      deriveEquipment(s.character, base).advanced?.modifiers.length ?? 0,
  };
}
await server.close();
const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  }),
  results = [];
const url = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const frames = (page, n) =>
  page.evaluate(async (n) => {
    const values = [];
    let last;
    for (let i = 0; i < n; i++) {
      const t = await new Promise((resolve) => requestAnimationFrame(resolve));
      if (last !== undefined) values.push(t - last);
      last = t;
    }
    return {
      p50: [...values].sort((a, b) => a - b)[Math.floor(values.length * 0.5)],
      p95: [...values].sort((a, b) => a - b)[Math.floor(values.length * 0.95)],
      combat: window.hollowbaneCombat.metrics,
      ai: window.hollowbaneAI.metrics,
      skills: window.hollowbaneSkills.metrics,
      effects: {
        statuses: window.hollowbaneSkills.statuses.length,
        bolts: window.hollowbaneSkills.bolts,
      },
      items: window.hollowbaneItems ?? null,
    };
  }, n);
try {
  for (let repeat = 0; repeat < 3; repeat++)
    for (const count of [5, 10, 20, 30])
      for (const variant of ["l2", "l3"]) {
        const page = await browser.newPage({
            viewport: { width: 1920, height: 1080 },
          }),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.addInitScript(() => {
          window.l3BenchPad = {
            id: "Xbox standard benchmark",
            index: 0,
            mapping: "standard",
            connected: true,
            axes: [0, 0, 0, 0],
            buttons: Array.from({ length: 17 }, () => ({
              pressed: false,
              touched: false,
              value: 0,
            })),
            timestamp: 0,
          };
          Object.defineProperty(navigator, "getGamepads", {
            value: () => [window.l3BenchPad],
            configurable: true,
          });
        });
        await page.goto(
          new URL(
            `?inventory=1&monsters=1&durable=1&count=${count}${variant === "l3" ? "&advanced=1&itemLab=1" : ""}`,
            url,
          ).href,
        );
        await page.waitForFunction(() => window.hollowbaneCombat?.tick > 2);
        await page.locator(".arena-panel summary").click();
        await page.locator("#ai-practice").check();
        await page.locator(".arena-panel summary").click();
        await page.locator("#inventory-open").click();
        await page.locator("#inventory-import").setInputFiles({
          name: "fixture.json",
          mimeType: "application/json",
          buffer: Buffer.from(serializeCharacter(fixtures[variant])),
        });
        await page.waitForFunction(
          () =>
            document.querySelectorAll("#inventory-grid .inventory-item")
              .length === 21,
        );
        await page.locator("#inventory-close").click();
        await frames(page, 45);
        const target = await page.evaluate(() => {
          const a = window.hollowbaneCombat.actors.find(
              (a) => a.id !== 0 && a.hp > 0,
            ),
            v = window.hollowbaneCombat.view,
            r = document.querySelector("canvas").getBoundingClientRect();
          return {
            x: r.x + ((a.x - v.x) / v.width) * r.width,
            y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
          };
        });
        await page.mouse.move(target.x, target.y);
        await page.mouse.down();
        const combat = await frames(page, 120);
        await page.mouse.up();
        await frames(page, 60);
        await page.locator("#combat-world").focus();
        await page.waitForFunction(() => window.hollowbaneInput?.armed);
        await page.evaluate(() => {
          window.l3BenchPad.buttons[4] = {
            pressed: true,
            touched: true,
            value: 1,
          };
        });
        await frames(page, 4);
        await page.evaluate(() => {
          window.l3BenchPad.buttons[4] = {
            pressed: false,
            touched: false,
            value: 0,
          };
        });
        const skill = await frames(page, 120);
        const opening = [];
        for (let i = 0; i < 5; i++) {
          opening.push(
            await page.evaluate(() => {
              const t = performance.now();
              document.querySelector("#inventory-open").click();
              return performance.now() - t;
            }),
          );
          await page.locator("#inventory-close").click();
        }
        await page.locator("#inventory-open").click();
        const inventory = await frames(page, 60);
        const alive = await page.evaluate(
          () => window.hollowbaneAI.metrics.alive,
        );
        if (alive !== count || errors.length || skill.skills.inputSamples < 1)
          throw Error(`Invalid fixture ${alive}/${count}: ${errors}`);
        results.push({
          repeat,
          count,
          variant,
          combat,
          skill,
          inventory: {
            p50: inventory.p50,
            p95: inventory.p95,
            openCpuP95: q(opening),
          },
          alive,
          errors,
        });
        console.log(
          repeat,
          count,
          variant,
          combat.p95,
          combat.combat.simulationP95,
          combat.combat.renderP95,
          skill.skills.inputP95,
        );
        await page.close();
      }
  await writeFile(
    "docs/items/l3-performance.json",
    JSON.stringify(
      {
        cpu: os.cpus()[0]?.model,
        browser: browser.version(),
        renderer:
          "Chromium ANGLE SwiftShader software rendering; no native GPU or physical input verification",
        method:
          "Three paired repetitions per count5/10/20/30,1920×1080, same default auto-balanced rendering, practice-player/durable-enemy fixtures. Both have9 equipped+21 bag items; L3 includes full Ashen Watch, Lastlight Vow, unique effects and embedded sigils.45 RAF warmup,120 held weapon frames,60 recovery frames,one virtual semantic Oath Echo self-buff press (avoids target-range rejection) and120 skill frames. Simulation/render/update CPU diagnostics are distinct from RAF pacing (which is not completed presentation). Modal60 RAF frames and5 synchronous opening CPU samples. Node1000 warm derive and100 encode/decode samples. Input metrics are software event-to-simulation, not hardware latency. No concurrent browser workloads during these measurements.",
        cpuSamples: cpu,
        results,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
