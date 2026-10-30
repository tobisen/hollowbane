/* global window, document, requestAnimationFrame, performance, localStorage */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Read-only diagnostics against a published candidate. Captures never enter timing cohorts.
const output = process.argv[2] ?? "/private/tmp/hollowbane-slice-acceptance";
const base = process.argv[3] ?? "https://tobisen.github.io/hollowbane/";
const capture = process.argv.includes("--capture");
await mkdir(output, { recursive: true });
const routes = {
  slice: "?d2slice=1",
  campaign:
    "?world=1&developer=1&worldPeaceful=1&worldArea=ancient-crypt&worldSeed=42&profile=1&quality=full",
};
const browser = await chromium.launch({ args: ["--use-angle=metal"] });
const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const p = (n) => sorted[Math.ceil(sorted.length * n) - 1] ?? 0;
  return {
    count: values.length,
    p50: p(0.5),
    p95: p(0.95),
    p99: p(0.99),
    max: sorted.at(-1),
    over25: values.filter((v) => v > 25).length,
  };
};
try {
  const gpu = (
    await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  ).gpu;
  if (!gpu.devices.some((d) => /Metal Renderer: Apple/.test(d.deviceString)))
    throw Error("Native Apple Metal required");
  const results = [];
  for (let repetition = 0; repetition < (capture ? 1 : 3); repetition++) {
    // Alternate order to expose rather than hide network/order variation.
    for (const mode of repetition % 2
      ? ["campaign", "slice"]
      : ["slice", "campaign"]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        ...(capture
          ? { recordVideo: { dir: output, size: { width: 1280, height: 800 } } }
          : {}),
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript((mode) => {
        localStorage.setItem(
          "hollowbane.presentation.v1",
          JSON.stringify({
            version: 1,
            quality: "full",
            volume: 1,
            muted: true,
          }),
        );
        window.acceptMode = mode;
        window.acceptFrames = [];
        window.acceptCollect = false;
        window.acceptState = () => {
          if (mode === "slice") {
            const s = window.hollowbaneSlice;
            return (
              s && {
                tick: s.tick,
                position: s.position,
                camera: s.camera,
                zoom: 1,
                moving: s.moving,
              }
            );
          }
          const w = window.hollowbaneWorld,
            c = window.hollowbaneCombat;
          return (
            w &&
            c && {
              tick: c.tick,
              position: w.position,
              camera: w.camera,
              zoom: w.camera.zoom,
              moving: w.walking,
            }
          );
        };
        let previous = null;
        const sample = (time) => {
          const s = window.acceptState();
          if (s?.tick >= 2 && !window.acceptReadyAt)
            window.acceptReadyAt = performance.now();
          if (window.acceptCollect && s)
            window.acceptFrames.push({
              time,
              interval: previous === null ? null : time - previous,
              ...s,
            });
          previous = window.acceptCollect ? time : null;
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, mode);
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.clearBrowserCache");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.goto(base + routes[mode], { waitUntil: "commit" });
      await page.waitForFunction(() => window.acceptReadyAt, null, {
        polling: "raf",
      });
      const cold = await page.evaluate(() => ({
        readyMs: window.acceptReadyAt,
        resources: performance.getEntriesByType("resource").map((r) => ({
          name: r.name,
          transferSize: r.transferSize,
          duration: r.duration,
        })),
        canvas: {
          width: document.querySelector("canvas").width,
          height: document.querySelector("canvas").height,
        },
        state: window.acceptState(),
      }));
      if (cold.canvas.width !== 1280 || cold.canvas.height !== 800)
        throw Error("Mismatched render buffer");
      await page.locator(mode === "slice" ? "#world" : "#combat-world").focus();
      const ticks = async (n) => {
        const target = await page.evaluate(
          (n) => window.acceptState().tick + n,
          n,
        );
        await page.waitForFunction(
          (target) => window.acceptState().tick >= target,
          target,
          { polling: "raf" },
        );
      };
      const leg = async (key) => {
        await page.keyboard.down(key);
        await ticks(36);
        await page.keyboard.up(key);
      };
      await ticks(120);
      await leg("ArrowRight");
      await leg("ArrowLeft");
      const start = await page.evaluate(() => window.acceptState().position);
      if (capture)
        await page.screenshot({ path: join(output, `${mode}-start.png`) });
      await page.evaluate(() => {
        window.acceptFrames = [];
        window.acceptCollect = true;
      });
      for (let i = 0; i < 10; i++)
        await leg(i % 2 ? "ArrowLeft" : "ArrowRight");
      const frames = await page.evaluate(() => {
        window.acceptCollect = false;
        return window.acceptFrames;
      });
      if (capture) {
        // Deliberately instrumented visual-only sequence: screenshots at real motion poses.
        for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
          await page.keyboard.down(key);
          for (let i = 0; i < 4; i++) {
            await ticks(5);
            await page.screenshot({
              path: join(output, `${mode}-${key}-${i}.png`),
            });
          }
          await page.keyboard.up(key);
        }
      }
      const intervals = frames.slice(1).map((r) => r.interval);
      const deltas = frames.slice(1).map((r, i) => {
        const previous = frames[i];
        return {
          ticks: r.tick - previous.tick,
          distance: Math.hypot(
            r.position.x - previous.position.x,
            r.position.y - previous.position.y,
          ),
          cameraStep:
            Math.hypot(
              r.camera.x - previous.camera.x,
              r.camera.y - previous.camera.y,
            ) * r.zoom,
        };
      });
      const result = {
        mode,
        repetition,
        instrumented: capture,
        cold,
        errors,
        frames,
        raf: stats(intervals),
        cameraStep: stats(
          deltas.filter((r) => r.distance > 0).map((r) => r.cameraStep),
        ),
        ticks: {
          zero: deltas.filter((d) => d.ticks === 0).length,
          multiple: deltas.filter((d) => d.ticks > 1).length,
        },
        start,
        end: await page.evaluate(() => window.acceptState().position),
        movedFrames: deltas.filter((r) => r.distance > 0).length,
      };
      if (result.movedFrames < 200 || errors.length)
        throw Error(
          `Invalid movement cohort: ${mode} ${JSON.stringify(result.errors)}`,
        );
      const video = page.video();
      await context.close();
      if (capture) {
        await video.saveAs(join(output, `${mode}-movement.webm`));
        await video.delete();
      }
      results.push(result);
      console.log(
        JSON.stringify({
          mode,
          repetition,
          coldMs: cold.readyMs,
          raf: result.raf,
          ticks: result.ticks,
        }),
      );
      await writeFile(
        join(
          output,
          capture ? "visual-captures.json" : "matched-performance.json",
        ),
        JSON.stringify(
          {
            base,
            browserVersion: browser.version(),
            gpu,
            capture,
            results,
            conditions:
              "Chromium headless, native Metal, viewport/render1280x800 DPR1, fresh contexts/cache disabled, default camera presentation, peaceful crypt seed42, 120 warmup ticks and two36-tick legs, then ten alternating36-tick trusted-keyboard legs. Video/screenshots only in separately instrumented capture cohorts. Cold means uncached application navigation in a running browser, not OS/browser launch.",
          },
          null,
          2,
        ),
      );
    }
  }
} finally {
  await browser.close();
}
