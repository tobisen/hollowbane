/* global window, navigator, performance, requestAnimationFrame */
import { chromium, firefox } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import os from "node:os";
const base = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const engine = process.argv[3] ?? "chromium";
const browser = await (engine === "firefox" ? firefox : chromium).launch(
  engine === "firefox"
    ? {}
    : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
);
const sweep = process.argv[4] === "effects";
const scenarios = [];
for (let repeat = 0; repeat < (sweep ? 2 : 3); repeat++) {
  if (sweep) {
    for (const variant of ["after", "flat", "noBackdrop", "noSkillFx"])
      scenarios.push({ repeat, count: 30, variant });
    for (const variant of ["hudBefore", "hudAfter"])
      scenarios.push({ repeat, count: 10, variant });
  } else
    for (const count of [5, 10, 20, 30])
      for (const variant of ["before", "after"])
        scenarios.push({ repeat, count, variant });
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
        `?monsters=1&durable=1&count=${count}${["before", "hudBefore", "hudAfter"].includes(variant) ? "&skills=1" : "&polish=1"}${variant === "flat" ? "&flat=1" : variant === "noBackdrop" ? "&noBackdrop=1" : variant === "noSkillFx" ? "&simplefx=1" : ""}`,
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
    if (variant === "before" || variant === "hudBefore")
      await page.addStyleTag({
        content:
          ".skill-arena .arena-panel,.skill-arena .skill-bar,.skill-arena .arena-footer{contain:none;transform:none}",
      });
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
              const held = elapsed < 6000 && elapsed % 700 < 80;
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
            if (elapsed >= 6000) {
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
          durationMs: 6000,
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
    `.local/polish-performance-${engine}-${sweep ? "effects" : "main"}.json`,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        cpu: os.cpus()[0]?.model,
        platform: os.platform(),
        browser: browser.version(),
        engine,
        viewport: [1920, 1080],
        method:
          "6s after 2s warmup per paired legacy/skill encounter, immortal player, durable 60000HP enemies to hold entity counts, virtual Xbox primary edge every 700ms aimed away from enemies. Injection-to-observed-skill-start latency measured separately from HUD request-to-start metric. No native hardware latency claim. CPU metrics are rolling p95; ability metric includes combat. Effects count is concurrent statuses and projectiles, not cumulative events.",
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
        (r.skills && (r.inputSamples < 8 || r.missed)),
    )
  )
    throw Error(
      "Errors, entity drift or missing skill activations; inspect results",
    );
} finally {
  await browser.close();
}
