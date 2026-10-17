/* global window, document, performance, requestAnimationFrame, location, Buffer */
import { chromium } from "@playwright/test";
import { build } from "vite";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import os from "node:os";
await mkdir(".local/inventory-benchmark", { recursive: true });
await writeFile(
  ".local/inventory-benchmark/entry.ts",
  `export * from '../../src/simulation/inventory-save';
export * from '../../src/simulation/inventory-world';
export * from '../../src/simulation/inventory-test-helper';
export * from '../../src/simulation/equipment-stats';
export * from '../../src/simulation/combat';
export * from '../../src/rendering/inventory-storage';`,
);
await build({
  configFile: false,
  logLevel: "error",
  build: {
    lib: {
      entry: ".local/inventory-benchmark/entry.ts",
      formats: ["es"],
      fileName: () => "model.mjs",
    },
    outDir: ".local/inventory-benchmark/out",
    emptyOutDir: true,
    minify: false,
  },
});
const modulePath = process.cwd() + "/.local/inventory-benchmark/out/model.mjs";
const model = await import(pathToFileURL(modulePath).href);
const session = model.createInventorySession();
for (const [slot, base] of Object.entries({
  main: "ash-blade",
  off: "bark-guard",
  helmet: "iron-cap",
  chest: "woven-coat",
  gloves: "sootwrap-gloves",
  boots: "trail-boots",
  belt: "hemp-sash",
  ring1: "copper-band",
  ring2: "copper-band",
  amulet: "slate-pendant",
}))
  session.character.equipment[slot] = model.inventoryItem(
    base,
    slot === "ring2" ? 1000 : 0,
  );
session.character.grid.items.push({
  item: model.inventoryItem("reed-bow"),
  x: 0,
  y: 0,
});
let sequence = 2000;
for (let i = 0; i < 20; i++) {
  const item = model.inventoryItem("copper-band", sequence);
  sequence = item.origin.sequence + 1;
  session.character.grid.items.push({
    item,
    x: 2 + (i % 8),
    y: Math.floor(i / 8),
  });
}
const text = model.serializeCharacter(session);
const baseStats = model.captureEquipmentBase(model.createCombat().actors[0]);
const q = (v, p) =>
  [...v].sort((a, b) => a - b)[
    Math.min(v.length - 1, Math.floor(v.length * p))
  ] ?? 0;
const statTimes = [],
  encodeTimes = [],
  decodeTimes = [];
for (let i = 0; i < 1000; i++) {
  const t = performance.now();
  model.deriveEquipment(session.character, baseStats);
  statTimes.push(performance.now() - t);
}
for (let i = 0; i < 100; i++) {
  let t = performance.now();
  model.serializeCharacter(session);
  encodeTimes.push(performance.now() - t);
  t = performance.now();
  model.deserializeCharacter(text);
  decodeTimes.push(performance.now() - t);
}
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const url = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const ablation = process.argv[3] === "ablation";
const results = [],
  ui = {};
const frames = (page) =>
  page.evaluate(async () => {
    const values = [];
    let last;
    for (let i = 0; i < 120; i++) {
      const now = await new Promise((resolve) =>
        requestAnimationFrame(resolve),
      );
      if (last !== undefined) values.push(now - last);
      last = now;
    }
    return {
      frames: values,
      combat: window.hollowbaneCombat.metrics,
      alive: window.hollowbaneCombat.actors.filter(
        (a) => a.id !== 0 && a.hp > 0,
      ).length,
    };
  });
try {
  for (let repeat = 0; repeat < 2; repeat++)
    for (const count of ablation ? [10] : [5, 10, 20, 30])
      for (const variant of ablation
        ? [
            "l1",
            "equipped-no-save",
            "equipped-hidden-button",
            "equipped-hidden-loot",
          ]
        : ["l1", "equipped-l2"]) {
        const page = await browser.newPage({
          viewport: { width: 1920, height: 1080 },
        });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(
          new URL(
            `?${variant === "l1" ? "loot" : "inventory"}=1&monsters=1&durable=1&count=${count}`,
            url,
          ).href,
        );
        await page.waitForFunction(() => window.hollowbaneCombat?.tick > 2);
        await page.locator(".arena-panel summary").click();
        await page.locator("#ai-practice").check();
        await page.locator(".arena-panel summary").click();
        if (variant !== "l1") {
          await page.locator("#inventory-open").click();
          await page.locator("#inventory-import").setInputFiles({
            name: "character.json",
            mimeType: "application/json",
            buffer: Buffer.from(text),
          });
          await page.waitForFunction(
            () =>
              document.querySelectorAll("#inventory-grid .inventory-item")
                .length === 21,
          );
          await page.locator("#inventory-save").click();
          await page.waitForFunction(
            () =>
              document.querySelector("#inventory-status").textContent ===
              "Character checkpoint saved locally.",
          );
          await page.locator("#inventory-close").click();
        }
        if (variant === "equipped-hidden-button")
          await page.locator("#inventory-open").evaluate((el) => {
            el.hidden = true;
          });
        if (variant === "equipped-hidden-loot")
          await page.locator(".loot-panel").evaluate((el) => {
            el.hidden = true;
          });
        await page.evaluate(async () => {
          for (let i = 0; i < 45; i++)
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });
        // Repeated asynchronous save requests during combat; no modal or simulation reset.
        if (variant === "equipped-l2")
          await page.evaluate(() => {
            let writes = 0;
            const pulse = () => {
              if (++writes > 120) return;
              if (writes % 30 === 0)
                document.querySelector("#inventory-save").click();
              requestAnimationFrame(pulse);
            };
            requestAnimationFrame(pulse);
          });
        const sample = await frames(page);
        results.push({
          repeat,
          count,
          variant,
          frameP50: q(sample.frames, 0.5),
          frameP95: q(sample.frames, 0.95),
          metrics: sample.combat,
          alive: sample.alive,
          errors,
        });
        if (variant !== "l1" && count === 5) {
          const opening = await page.evaluate(async () => {
            const cpu = [],
              present = [];
            for (let i = 0; i < 10; i++) {
              const t = performance.now();
              document.querySelector("#inventory-open").click();
              cpu.push(performance.now() - t);
              await new Promise((resolve) => requestAnimationFrame(resolve));
              present.push(performance.now() - t);
              document.querySelector("#inventory-close").click();
              await new Promise((resolve) => requestAnimationFrame(resolve));
            }
            return { cpu, present };
          });
          await page.locator("#inventory-open").click();
          const open = await frames(page);
          await page.evaluate(() => {
            window.inventoryDragCpu = [];
            window.inventoryDragPaint = [];
            let start = 0;
            document.querySelector("#inventory-dialog").addEventListener(
              "pointermove",
              (e) => {
                if (e.buttons === 1) start = performance.now();
              },
              true,
            );
            window.addEventListener("pointermove", (e) => {
              if (e.buttons === 1 && start) {
                window.inventoryDragCpu.push(performance.now() - start);
                const t = start;
                requestAnimationFrame(() =>
                  window.inventoryDragPaint.push(performance.now() - t),
                );
                start = 0;
              }
            });
          });
          const a = await page.locator('[data-focus="cell-0-0"]').boundingBox(),
            b = await page.locator('[data-focus="cell-9-3"]').boundingBox();
          for (let i = 0; i < 5; i++) {
            await page.mouse.move(a.x + 10, a.y + 10);
            await page.mouse.down();
            await page.mouse.move(b.x + 10, b.y + 10, { steps: 10 });
            await page.mouse.up();
          }
          const drag = await page.evaluate(() => ({
            cpu: window.inventoryDragCpu,
            paint: window.inventoryDragPaint,
          }));
          const code = await readFile(modulePath, "utf8");
          await page.route("**/__inventory-benchmark.js", (route) =>
            route.fulfill({ contentType: "text/javascript", body: code }),
          );
          const storage = await page.evaluate(async (text) => {
            const { InventoryStorage, deserializeCharacter } = await import(
              new URL("__inventory-benchmark.js", location.href).href
            );
            const db = new InventoryStorage(undefined, "hollowbane-benchmark"),
              s = deserializeCharacter(text),
              writes = [],
              reads = [];
            await db.load();
            for (let i = 0; i < 20; i++) {
              let t = performance.now();
              await db.save(s);
              writes.push(performance.now() - t);
              t = performance.now();
              await db.load();
              reads.push(performance.now() - t);
            }
            db.close();
            return { writes, reads };
          }, text);
          ui[repeat] = {
            openingCpuP95: q(opening.cpu, 0.95),
            openingNextRafP95: q(opening.present, 0.95),
            openFrameP50: q(open.frames, 0.5),
            openFrameP95: q(open.frames, 0.95),
            dragCpuP95: q(drag.cpu, 0.95),
            dragNextRafP95: q(drag.paint, 0.95),
            dragSamples: drag.cpu.length,
            saveP95: q(storage.writes, 0.95),
            loadP95: q(storage.reads, 0.95),
          };
        }
        console.log(JSON.stringify(results.at(-1)));
        await page.close();
      }
  await writeFile(
    `docs/inventory/performance${ablation ? "-ablation" : ""}.json`,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        cpu: os.cpus()[0]?.model,
        platform: process.platform,
        browser: browser.version(),
        renderer: "Chromium SwiftShader; not hardware GPU evidence",
        viewport: [1920, 1080],
        method:
          "Two paired repetitions per count, same1920 viewport/auto-balanced render settings. Immortal player and durable enemies hold counts. 45-frame warmup then120 RAF frames; L2 equipped with10 gear+21 bag items, async save requested every30 frames. UI modal pauses simulation using existing controller modal policy. Opening CPU and event-to-next-RAF are distinct; next RAF is not completed presentation. Drag uses real Playwright pointer events to invalid destination. Save/load includes validation+IndexedDB. Node CPU samples1000 derived/100 encode/decode; no hardware controller latency claim.",
        snapshotBytes: Buffer.byteLength(text),
        model: {
          deriveP95: q(statTimes, 0.95),
          encodeP95: q(encodeTimes, 0.95),
          decodeP95: q(decodeTimes, 0.95),
        },
        ui,
        results,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
