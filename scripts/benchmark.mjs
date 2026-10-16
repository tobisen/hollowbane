/* global performance, requestAnimationFrame, document, window, innerWidth, innerHeight */
import { chromium, firefox, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import { setInterval, clearInterval } from "node:timers";
const url = process.argv[2] ?? "http://127.0.0.1:4173/hollowbane/?metrics=1";
const duration = Number(process.env.BENCHMARK_SECONDS ?? 60);
if (!Number.isFinite(duration) || duration < 5 || duration > 120)
  throw new Error("Benchmark duration must be 5–120 seconds");
const browserName = process.env.BENCHMARK_BROWSER ?? "chromium";
if (!["chromium", "firefox"].includes(browserName))
  throw new Error("Supported benchmarks: chromium, firefox");
const browser = await (browserName === "firefox" ? firefox : chromium).launch(
  browserName === "firefox"
    ? {}
    : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
);
try {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Warm up for 10 seconds, sample for a real elapsed duration. This is workload measurement, not a task delay.
  await page.locator("#world").focus();
  const directions = ["w", "d", "s", "a"];
  let direction = 0,
    held = "w",
    inputQueue = Promise.resolve();
  await page.keyboard.down(held);
  const movementTimer = setInterval(() => {
    inputQueue = inputQueue.then(async () => {
      await page.keyboard.up(held);
      direction = (direction + 1) % directions.length;
      held = directions[direction];
      await page.keyboard.down(held);
    });
  }, 1000);
  const timingPromise = page.evaluate(async (seconds) => {
    const warmup = 10000,
      started = performance.now();
    let previous = started;
    const deltas = [];
    await new Promise((resolve) => {
      const sample = (now) => {
        if (now - started > warmup) deltas.push(now - previous);
        previous = now;
        if (now - started < warmup + seconds * 1000)
          requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    deltas.sort((a, b) => a - b);
    const percentile = (p) =>
      deltas[Math.min(deltas.length - 1, Math.ceil(deltas.length * p) - 1)];
    const gl =
      document.querySelector("canvas").getContext("webgl2") ??
      document.querySelector("canvas").getContext("webgl");
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      seconds,
      samples: deltas.length,
      medianFps: 1000 / percentile(0.5),
      p95FrameMs: percentile(0.95),
      p99FrameMs: percentile(0.99),
      gpu: debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : "unavailable",
      metrics: window.hollowbaneDiagnostics,
      renderState: window.hollowbanePrototype,
      viewport: { width: innerWidth, height: innerHeight },
      resources: performance.getEntriesByType("resource").map((r) => ({
        name: r.name.split("/").pop(),
        bytes: r.encodedBodySize,
      })),
    };
  }, duration);
  let timing;
  try {
    timing = await timingPromise;
  } finally {
    clearInterval(movementTimer);
    await inputQueue;
    await page.keyboard.up(held);
  }
  const input = [];
  for (let i = 0; i < 12; i++) {
    const before = await page.evaluate(
      () => window.hollowbanePrototype.inputSamples,
    );
    const point = await page.evaluate((i) => {
      const v = window.hollowbanePrototype.view;
      const target = { x: i % 2 ? 730 : 840, y: i % 2 ? 470 : 520 };
      return {
        x: ((target.x - v.x) * innerWidth) / v.width,
        y: ((target.y - v.y) * innerHeight) / v.height,
      };
    }, i);
    await page.locator("#world").click({ position: point });
    await expect
      .poll(() =>
        page.evaluate(
          (t) =>
            window.hollowbanePrototype.inputSamples > t &&
            window.hollowbanePrototype.inputFeedbackMs !== null,
          before,
        ),
      )
      .toBe(true);
    input.push(
      await page.evaluate(() => window.hollowbanePrototype.inputFeedbackMs),
    );
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype.walking), {
        timeout: 10000,
      })
      .toBe(false);
  }
  input.sort((a, b) => a - b);
  const result = {
    date: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      browser: browser.version(),
      rendererMode:
        browserName === "firefox"
          ? "Firefox default GPU backend; see recorded GPU identity"
          : "Explicit SwiftShader software WebGL; adaptive balanced detail",
      browserName,
      workload: "Continuous keyboard traversal; decorative effects active",
      server: url.includes("127.0.0.1") ? "local production preview" : "remote",
    },
    ...timing,
    inputFeedback: {
      samples: input.length,
      p95Ms: input[Math.ceil(input.length * 0.95) - 1],
    },
    errors,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/prototype-benchmark.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await writeFile(
    `.local/prototype-benchmark-${browserName}.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      medianFps: result.medianFps,
      p95FrameMs: result.p95FrameMs,
      readyMs: result.metrics.readyMs,
      heapBytes: result.metrics.heapBytes,
      drawCalls: result.metrics.drawCalls,
      inputP95Ms: result.inputFeedback.p95Ms,
      seconds: result.seconds,
      samples: result.samples,
      errors,
    }),
  );
} finally {
  await browser.close();
}
