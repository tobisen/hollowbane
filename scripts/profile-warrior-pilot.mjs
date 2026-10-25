/* global document, navigator, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const url =
  process.argv[2] ??
  "http://127.0.0.1:4173/hollowbane/?developer=1&warriorPilot=1";
const destination = process.argv[3];
if (!destination) throw Error("Pass preview URL and an untracked report path");
const browser = await chromium.launch({
  headless: false,
  args: ["--use-angle=metal"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await page.goto(url);
  await page.waitForSelector("html[data-warrior-pilot-ready=true]");
  await page.bringToFront();
  await page.locator("#pilot-play").click();
  await page.locator("#pilot-zoom").selectOption("2");
  await page.locator("#pilot-stage").scrollIntoViewIfNeeded();
  const environment = await page.evaluate(() => {
    const canvas = document.querySelector("#pilot-stage canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      visible: document.visibilityState,
      renderer: ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : "unavailable",
      userAgent: navigator.userAgent,
    };
  });
  const samples = [];
  for (const source of [
    "shipped",
    "pilot",
    "pilot",
    "shipped",
    "shipped",
    "pilot",
  ]) {
    await page.locator("#pilot-source").selectOption(source);
    await page.locator("#pilot-stage").focus();
    await page.keyboard.down("KeyD");
    const sample = await page.evaluate(async () => {
      const timestamps = [];
      await new Promise((resolve) => {
        let warm = 60;
        function frame(t) {
          if (warm > 0) warm--;
          else timestamps.push(t);
          if (timestamps.length < 241) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
      const deltas = timestamps.slice(1).map((t, i) => t - timestamps[i]);
      const sorted = [...deltas].sort((a, b) => a - b);
      const q = (p) => sorted[Math.ceil(sorted.length * p) - 1];
      return {
        frames: deltas.length,
        p50: q(0.5),
        p95: q(0.95),
        p99: q(0.99),
        longest: sorted.at(-1),
        over25: deltas.filter((t) => t > 25).length,
        over33: deltas.filter((t) => t > 33).length,
        over50: deltas.filter((t) => t > 50).length,
        deltas,
      };
    });
    await page.keyboard.up("KeyD");
    samples.push({ source, ...sample });
  }
  await mkdir(dirname(destination), { recursive: true });
  await page.screenshot({ path: destination + ".png", fullPage: true });
  await writeFile(
    destination,
    JSON.stringify(
      {
        url,
        environment,
        browser: browser.version(),
        condition:
          "visible native window; zoom2; moving; comparison paused; 3 alternating pairs",
        samples,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        environment,
        samples: samples.map((sample) => ({ ...sample, deltas: undefined })),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
