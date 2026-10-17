/* global window, navigator, performance, requestAnimationFrame */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { setInterval, clearInterval } from "node:timers";
import os from "node:os";
const current = process.argv[2] ?? "http://127.0.0.1:4173/hollowbane/";
const before = process.argv[3] ?? "https://tobisen.github.io/hollowbane/";
const seconds = Number(process.env.BENCHMARK_SECONDS ?? 20);
if (!Number.isFinite(seconds) || seconds < 5 || seconds > 60)
  throw new Error("Benchmark seconds must be 5–60");
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (const mode of [
    "before-keyboard",
    "current-keyboard",
    "current-gamepad",
  ]) {
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (mode === "current-gamepad")
      await page.addInitScript(() => {
        window.benchmarkPad = {
          index: 0,
          id: "Xbox virtual benchmark",
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
          value: () => [window.benchmarkPad],
        });
      });
    const base = mode === "before-keyboard" ? before : current;
    await page.goto(base + "?metrics=1");
    await expect(page.locator("html")).toHaveAttribute(
      "data-prototype-ready",
      "true",
    );
    if (mode === "before-keyboard")
      expect(await page.evaluate(() => Boolean(window.hollowbaneInput))).toBe(
        false,
      );
    if (mode === "current-gamepad")
      await page.waitForFunction(() => window.hollowbaneInput?.armed);
    await page.locator("#world").focus();
    let step = 0,
      held = "",
      work = Promise.resolve();
    const workload = setInterval(() => {
      work = work.then(async () => {
        if (mode === "current-gamepad") {
          const direction = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ][step % 4];
          await page.evaluate((v) => {
            window.benchmarkPad.axes = [...v, 0, 0];
            window.benchmarkPad.timestamp = performance.now();
          }, direction);
        } else {
          if (held) await page.keyboard.up(held);
          held = ["w", "d", "s", "a"][step % 4];
          await page.keyboard.down(held);
        }
        step++;
      });
    }, 1000);
    const pacing = await page.evaluate(async (seconds) => {
      const start = performance.now();
      let previous = start,
        lastSamples = 0;
      const frames = [],
        feedback = [];
      await new Promise((resolve) => {
        const sample = (now) => {
          if (now - start > 2000) {
            frames.push(now - previous);
            const s = window.hollowbanePrototype;
            if (s.inputSamples > lastSamples && s.inputFeedbackMs !== null)
              feedback.push(s.inputFeedbackMs);
            lastSamples = s.inputSamples;
          }
          previous = now;
          if (now - start < (seconds + 2) * 1000) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      frames.sort((a, b) => a - b);
      feedback.sort((a, b) => a - b);
      const p = (values, q) =>
        values[Math.min(values.length - 1, Math.floor(values.length * q))] ??
        null;
      return {
        frameP50Ms: p(frames, 0.5),
        frameP95Ms: p(frames, 0.95),
        frames: frames.length,
        adapterFeedbackP95Ms: p(feedback, 0.95),
        adapterFeedbackSamples: feedback.length,
        pollP95Ms: window.hollowbaneInput?.pollP95 ?? null,
        renderSize: {
          width: window.hollowbanePrototype.renderWidth,
          height: window.hollowbanePrototype.renderHeight,
        },
      };
    }, seconds);
    clearInterval(workload);
    await work;
    if (held) await page.keyboard.up(held);
    let injectedLatency = null;
    if (mode === "current-gamepad") {
      await page.evaluate(() => {
        window.benchmarkPad.axes = [0, 0, 0, 0];
      });
      await page.waitForFunction(() => !window.hollowbanePrototype.walking);
      const values = [];
      for (let i = 0; i < 20; i++) {
        if (i % 4 === 0) {
          await page.locator("#reset-view").click();
          await page.locator("#world").focus();
          await page.waitForFunction(() => window.hollowbaneInput.armed);
        }
        const sent = await page.evaluate(() => {
          window.benchmarkPad.axes = [0.8, 0, 0, 0];
          window.benchmarkPad.timestamp = performance.now();
          return performance.now();
        });
        await page.waitForFunction(
          (sent) =>
            window.hollowbanePrototype.walking &&
            window.hollowbanePrototype.movementObservedAt >= sent,
          sent,
        );
        values.push(
          await page.evaluate(
            (sent) => window.hollowbanePrototype.movementObservedAt - sent,
            sent,
          ),
        );
        await page.evaluate(() => {
          window.benchmarkPad.axes = [0, 0, 0, 0];
        });
        await page.waitForFunction(() => !window.hollowbanePrototype.walking);
      }
      values.sort((a, b) => a - b);
      injectedLatency = {
        samples: values.length,
        p50Ms: values[Math.floor(values.length * 0.5)],
        p95Ms: values[Math.floor(values.length * 0.95)],
        valuesMs: values,
      };
    }
    results.push({
      mode,
      url: base,
      seconds,
      warmupSeconds: 2,
      ...pacing,
      injectedLatency,
      errors,
    });
    await page.close();
  }
  const result = {
    date: new Date().toISOString(),
    environment: {
      cpu: os.cpus()[0]?.model,
      platform: os.platform(),
      arch: os.arch(),
      browser: browser.version(),
      renderer: "Explicit SwiftShader software WebGL",
      viewport: "1920x1080",
    },
    baseline:
      "Published pre-2.5 movement implementation; assertion requires no controller runtime. Run before publishing the new controller build.",
    limitations: [
      "API snapshot injection measures browser adaptation, not physical controller/OS/Bluetooth latency.",
      "Published baseline and local build have different asset servers; loading is excluded by warmup.",
      "Short software-rendering sample; no hardware controller verification.",
      "Adapter feedback timing is keyboard event-to-movement or gamepad poll-to-movement; injectedLatency separately includes waiting for the next poll.",
    ],
    results,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/gamepad-performance.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
