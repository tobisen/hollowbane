/* global window, navigator, performance, requestAnimationFrame, document */
import { chromium, firefox } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import { build } from "vite";
import { pathToFileURL } from "node:url";
await build({
  configFile: false,
  logLevel: "error",
  build: {
    lib: {
      entry: "src/simulation/loot.ts",
      formats: ["es"],
      fileName: () => "model.mjs",
    },
    outDir: ".local/loot-benchmark",
    emptyOutDir: true,
    minify: false,
  },
});
const { generateLoot } = await import(
  pathToFileURL(process.cwd() + "/.local/loot-benchmark/model.mjs").href
);
const testSequences = [];
for (let sequence = 0; testSequences.length < 30; sequence++)
  if (
    generateLoot({
      seed: 42,
      sequence,
      monsterLevel: 12,
      areaLevel: 12,
      table: "court",
    })
  )
    testSequences.push(sequence);
const base = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const engine = process.argv[3] ?? "chromium";
const browser = await (engine === "firefox" ? firefox : chromium).launch(
  engine === "firefox"
    ? {}
    : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
);
const scenarios = [];
for (let repeat = 0; repeat < 2; repeat++) {
  for (const count of [5, 10, 20, 30])
    for (const variant of ["before", "after"])
      scenarios.push({ repeat, count, variant });
  scenarios.push({ repeat, count: 30, variant: "loot30" });
}
const results = [];
try {
  for (const { count, variant, repeat } of scenarios) {
    const skills = true;
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.skillBenchPad = {
        index: 0,
        id: "Xbox standard benchmark",
        mapping: "standard",
        connected: true,
        axes: [0, 0, -1, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        timestamp: 0,
      };
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => [window.skillBenchPad],
      });
    });
    await page.goto(
      new URL(
        `?polish=1&monsters=1&durable=1&count=${count}${variant !== "before" ? "&loot=1" : ""}`,
        base,
      ).href,
    );
    await page.waitForFunction(() => window.hollowbaneCombat?.tick > 2);
    const details = page.locator(".arena-panel details");
    if (await details.count())
      await details.evaluate((d) => {
        d.open = true;
      });
    await page.locator("#ai-practice").check();
    await page.locator("#combat-sound").uncheck();
    await page.locator("#combat-world").focus();
    // Neutral first, then independent aim. No input is held while arming.
    await page.evaluate(() => {
      window.skillBenchPad.axes = [0, 0, 0, 0];
    });
    await page.waitForFunction(() => window.hollowbaneInput?.armed);
    if (variant === "loot30") {
      await page
        .locator(".loot-panel > details")
        .evaluate((d) => (d.open = true));
      await page.evaluate((sequences) => {
        const input = document.querySelector("#loot-sequence"),
          button = document.querySelector("#loot-test");
        for (const seq of sequences) {
          input.value = String(seq);
          button.click();
        }
      }, testSequences);
      await page.waitForFunction(
        () => window.hollowbaneLoot?.drops.length === 30,
      );
      await page
        .locator(".loot-panel > details")
        .evaluate((d) => (d.open = false));
      await page.locator("#combat-world").focus();
    }
    const result = await page.evaluate(
      async ({ skills, count }) => {
        const q = (a, p) => {
          const b = [...a].sort((x, y) => x - y);
          return b[Math.min(b.length - 1, Math.floor(b.length * p))] ?? 0;
        };
        const frames = [],
          samples = [],
          latencies = [];
        let previous = 0,
          start = 0,
          last = -1,
          minAlive = count,
          maxEffects = 0,
          maxBolts = 0,
          pending = null,
          wasHeld = false,
          missed = 0;
        await new Promise((resolve) => {
          const begin = performance.now();
          function warm(now) {
            if (now - begin < 2000) requestAnimationFrame(warm);
            else resolve();
          }
          requestAnimationFrame(warm);
        });
        await new Promise((resolve) => {
          function frame(now) {
            start ||= now;
            if (previous) frames.push(now - previous);
            previous = now;
            const elapsed = now - start,
              part = Math.floor(elapsed / 700);
            window.skillBenchPad.axes = [0, 0, -1, 0];
            if (skills) {
              const started =
                window.hollowbaneSkills.events
                  .filter((e) => e.actor === 0 && e.kind === "start")
                  .at(-1)?.tick ?? -1;
              if (pending && started > pending.last) {
                latencies.push(now - pending.at);
                pending = null;
              }
              const held = elapsed < 4000 && elapsed % 700 < 80;
              if (held && !wasHeld) {
                if (pending) missed++;
                pending = { at: now, last: started };
              }
              wasHeld = held;
              window.skillBenchPad.buttons[2] = {
                pressed: held,
                touched: held,
                value: Number(held),
              };
            }
            minAlive = Math.min(minAlive, window.hollowbaneAI.metrics.alive);
            const s = window.hollowbaneSkills;
            maxEffects = Math.max(maxEffects, s?.statuses.length ?? 0);
            maxBolts = Math.max(maxBolts, s?.bolts ?? 0);
            if (part !== last) {
              last = part;
              samples.push({
                elapsed,
                combat: window.hollowbaneCombat.metrics,
                ai: window.hollowbaneAI.metrics,
                skills: s?.metrics ?? null,
                bolts: s?.bolts ?? 0,
                statuses: s?.statuses.length ?? 0,
              });
            }
            if (elapsed >= 4000) {
              window.skillBenchPad.buttons[2] = {
                pressed: false,
                touched: false,
                value: 0,
              };
              resolve();
            } else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
        return {
          count,
          skills,
          durationMs: 4000,
          frameP50: q(frames, 0.5),
          frameP95: q(frames, 0.95),
          inputToSkillP95: q(latencies, 0.95),
          inputSamples: latencies.length,
          missed,
          latencies,
          minAlive,
          maxEffects,
          maxBolts,
          combat: window.hollowbaneCombat.metrics,
          ai: window.hollowbaneAI.metrics,
          ability: window.hollowbaneSkills?.metrics ?? null,
          loot: window.hollowbaneLoot ?? null,
          frames,
          samples,
        };
      },
      { skills, count },
    );
    result.variant = variant;
    result.repeat = repeat;
    result.errors = errors;
    results.push(result);
    console.log(
      JSON.stringify({
        count,
        variant,
        repeat,
        p95: result.frameP95,
        simulation: result.combat.simulationP95,
        input: result.inputToSkillP95,
        alive: result.minAlive,
        effects: result.maxEffects,
        bolts: result.maxBolts,
        errors,
      }),
    );
    await page.close();
  }
  await writeFile(
    `docs/loot/performance-${engine}.json`,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        runtimeCommit: process.argv[4] ?? "local",
        contentVersion: generateLoot({
          seed: 42,
          sequence: testSequences[0],
          monsterLevel: 12,
          areaLevel: 12,
          table: "court",
        }).contentVersion,
        cpu: os.cpus()[0]?.model,
        platform: os.platform(),
        browser: browser.version(),
        engine,
        viewport: [1920, 1080],
        method:
          "6s after 2s warmup per paired legacy/skill encounter, immortal player, durable 40000HP enemies to hold entity counts, virtual Xbox primary edge every 700ms aimed away from enemies. Injection-to-observed-skill-start latency measured separately from HUD request-to-start metric. No native hardware latency claim. CPU metrics are rolling p95; ability metric includes combat. Effects count is concurrent statuses and projectiles, not cumulative events.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (
    results.some(
      (r) =>
        r.errors.length ||
        r.minAlive !== r.count ||
        (r.skills && (r.inputSamples < 5 || r.missed)),
    )
  )
    throw Error(
      "Errors, entity drift or missing skill activations; inspect results",
    );
} finally {
  await browser.close();
}
