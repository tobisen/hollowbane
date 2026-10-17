/* global window, document, requestAnimationFrame, performance */
import { chromium, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { setInterval, clearInterval } from "node:timers";
import os from "node:os";
const base = process.argv[2] ?? "http://127.0.0.1:4173/hollowbane/";
const seconds = Number(process.env.BENCHMARK_SECONDS ?? 20);
if (!Number.isFinite(seconds) || seconds < 5 || seconds > 60)
  throw new Error("Benchmark seconds must be 5–60");
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (const combat of [false, true]) {
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + (combat ? "?combat=1" : "?metrics=1"));
    await expect(page.locator("html")).toHaveAttribute(
      combat ? "data-combat-ready" : "data-prototype-ready",
      "true",
    );
    if (combat) {
      await page.locator("#combat-weapon").selectOption("projectile");
      await page.locator("#combat-sound").uncheck();
    } else await page.locator("#world").focus();
    let action = 0,
      busy = false,
      held = "";
    const workload = setInterval(
      async () => {
        if (busy) return;
        busy = true;
        try {
          if (combat) {
            if (action % 6 === 0) await page.locator("#combat-reset").click();
            const id = [1, 4, 2][action % 3];
            const p = await page.evaluate((id) => {
              const a = window.hollowbaneCombat.actors.find((a) => a.id === id),
                v = window.hollowbaneCombat.view,
                r = document.querySelector("canvas").getBoundingClientRect();
              return {
                x: r.x + ((a.x - v.x) / v.width) * r.width,
                y: r.y + ((a.y - 28 - v.y) / v.height) * r.height,
              };
            }, id);
            await page.mouse.click(p.x, p.y);
          } else {
            if (held) await page.keyboard.up(held);
            held = ["w", "d", "s", "a"][action % 4];
            await page.keyboard.down(held);
          }
          action++;
        } catch (e) {
          errors.push(String(e));
        } finally {
          busy = false;
        }
      },
      combat ? 700 : 1000,
    );
    const timing = await page.evaluate(
      async ({ seconds, combat }) => {
        const start = performance.now();
        let previous = start;
        const frames = [];
        let maxEntities = combat ? 0 : 1;
        await new Promise((resolve) => {
          const frame = (now) => {
            if (now - start > 2000) frames.push(now - previous);
            previous = now;
            if (combat)
              maxEntities = Math.max(
                maxEntities,
                window.hollowbaneCombat?.metrics.activeEntities ?? 0,
              );
            if (now - start < (seconds + 2) * 1000)
              requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
        frames.sort((a, b) => a - b);
        const p = (q) =>
          frames[Math.min(frames.length - 1, Math.floor(frames.length * q))];
        return {
          frameP50: p(0.5),
          frameP95: p(0.95),
          samples: frames.length,
          maxEntities,
          metrics: combat
            ? window.hollowbaneCombat.metrics
            : window.hollowbaneDiagnostics,
        };
      },
      { seconds, combat },
    );
    clearInterval(workload);
    // Complete any in-flight UI command before closing the page.
    while (busy)
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
    results.push({
      workload: combat
        ? "Combat arena: repeated ballistic attacks, three targets, moving dummy, hostile sentinel; reset every six commands"
        : "Existing cloister: continuous WASD traversal with decorative effects",
      seconds,
      warmupSeconds: 2,
      ...timing,
      errors,
    });
    await page.close();
  }
  const result = {
    date: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      browser: browser.version(),
      viewport: "1920x1080",
      renderer: "Explicit SwiftShader software WebGL",
      server: base,
    },
    limitations: [
      "Different scenes/workloads: comparison is a rendering envelope, not an isolated causal combat overhead measurement.",
      "Render metric measures CPU submission; it is not GPU execution time.",
      "Attack latency includes command queue/recovery; approach distance can add latency.",
      "Short local software-rendering sample; hardware and browser coverage differ.",
    ],
    results,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/combat-performance.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
