/* global window, navigator, performance, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
const base = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const duration = 20000;
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (const count of [0, 5, 10, 20, 30]) {
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.benchmarkPad = {
        index: 0,
        id: "Xbox standard benchmark",
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
          touched: false,
        })),
        timestamp: 0,
      };
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [window.benchmarkPad],
        configurable: true,
      });
    });
    await page.goto(
      new URL(count ? `?monsters=1&count=${count}` : "?combat=1", base).href,
    );
    await page.waitForFunction(() => Boolean(window.hollowbaneCombat));
    if (count) await page.locator("#ai-practice").check();
    else await page.locator("#combat-hostile").uncheck();
    await page.locator("#combat-world").focus();
    await page.waitForFunction(() => window.hollowbaneInput?.armed);
    const result = await page.evaluate(
      async ({ duration, count }) => {
        const percentile = (a, p) => {
          const b = [...a].sort((a, b) => a - b);
          return b[Math.min(b.length - 1, Math.floor(b.length * p))] ?? 0;
        };
        const frames = [],
          latencies = [],
          samples = [];
        let previous = 0,
          start = 0,
          segment = -1,
          pending = null,
          missed = 0,
          minAlive = Infinity,
          maxAlive = 0;
        await new Promise((resolve) => {
          const warm = performance.now();
          const tick = (now) => {
            if (now - warm < 2000) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        await new Promise((resolve) => {
          const tick = (now) => {
            if (!start) start = now;
            if (previous) frames.push(now - previous);
            previous = now;
            const elapsed = now - start,
              part = Math.floor(elapsed / 1000),
              actor = window.hollowbaneCombat.actors[0];
            const alive = count ? window.hollowbaneAI.metrics.alive : 0;
            minAlive = Math.min(minAlive, alive);
            maxAlive = Math.max(maxAlive, alive);
            if (
              pending &&
              Math.hypot(actor.x - pending.x, actor.y - pending.y) > 0.2
            ) {
              latencies.push(now - pending.at);
              pending = null;
            }
            if (part !== segment && elapsed < duration) {
              if (pending) missed++;
              segment = part;
              pending = { at: now, x: actor.x, y: actor.y };
              const vectors = [
                [0.55, 0],
                [0, 0.55],
                [-0.55, 0],
                [0, -0.55],
              ];
              window.benchmarkPad.axes = [...vectors[part % 4], 0, -0.8];
              samples.push({
                atMs: elapsed,
                combat: { ...window.hollowbaneCombat.metrics },
                ai: count ? { ...window.hollowbaneAI.metrics } : null,
              });
            } else if (elapsed % 1000 > 800)
              window.benchmarkPad.axes = [0, 0, 0, -0.8];
            if (elapsed >= duration) {
              window.benchmarkPad.axes = [0, 0, 0, 0];
              resolve();
            } else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        return {
          count,
          durationMs: duration,
          frameP50: percentile(frames, 0.5),
          frameP95: percentile(frames, 0.95),
          inputToMovementP50: percentile(latencies, 0.5),
          inputToMovementP95: percentile(latencies, 0.95),
          inputSamples: latencies.length,
          missed,
          minAlive,
          maxAlive,
          combat: window.hollowbaneCombat.metrics,
          ai: count ? window.hollowbaneAI.metrics : null,
          frames,
          latencies,
          samples,
        };
      },
      { duration, count },
    );
    result.errors = errors;
    results.push(result);
    console.log(
      JSON.stringify({
        count,
        frameP95: result.frameP95,
        aiP95: result.ai?.aiP95,
        inputP95: result.inputToMovementP95,
        alive: [result.minAlive, result.maxAlive],
        errors,
      }),
    );
    await page.close();
  }
  const output = {
    measuredAt: new Date().toISOString(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model,
    browser: browser.version(),
    viewport: [1920, 1080],
    renderer: "explicit SwiftShader software WebGL",
    method:
      "20s after 2s warmup, standard virtual pad pulses .55, independent aim, immortal player for AI combat workloads; no player attacks; API-injection-to-observed-simulation movement (not hardware/photon latency). Zero-enemy baseline is the preserved combat trial with hostile disabled; different geometry/content prevents causal AI-overhead attribution.",
    results,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/monster-performance.json",
    JSON.stringify(output, null, 2) + "\n",
  );
  if (
    results.some(
      (r) =>
        r.errors.length ||
        r.missed ||
        r.inputSamples < 19 ||
        (r.count && r.minAlive !== r.count),
    )
  )
    throw Error(
      "Benchmark errors, missing input samples or enemy-count drift; inspect retained evidence",
    );
} finally {
  await browser.close();
}
