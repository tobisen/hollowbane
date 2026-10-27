/* global window, document, navigator, performance, requestAnimationFrame, KeyboardEvent, location, sessionStorage, localStorage */
import { chromium } from "@playwright/test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

// Explicit preconstructed save fixtures, not live simulation/graphics overrides.
const [base, fixturePath, output] = process.argv.slice(2);
if (!base || !fixturePath || !output)
  throw Error(
    "Pass base URL, constructed session JSON and untracked output directory",
  );
const fixtures = JSON.parse(await readFile(fixturePath, "utf8"));
const files = (await readdir("dist/assets"))
  .filter((f) => /^character-storage-[\w-]+\.js$/.test(f))
  .map((f) => `assets/${f}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: false,
  args: ["--use-angle=metal", "--enable-precise-memory-info"],
});
const results = [],
  cold = [];
const percentile = (a, p) =>
  [...a].sort((x, y) => x - y)[
    Math.min(a.length - 1, Math.floor(a.length * p))
  ];
try {
  const gpu = (
    await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  ).gpu;
  for (const device of ["keyboard", "controller"])
    for (let repeat = 0; repeat < 3; repeat++)
      for (const mode of repeat % 2
        ? ["legacy", "warrior"]
        : ["warrior", "legacy"]) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 800 },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.addInitScript(() => {
          window.productionLoadFrames = [];
          const sample = (now) => {
            window.productionLoadFrames.push(now);
            const v = window.hollowbaneWarriorProduction;
            if (
              !v ||
              v.mode === "loading" ||
              !["supported", "debug-legacy", "asset-load-failed"].includes(
                v.reason,
              )
            )
              requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        if (device === "controller")
          await page.addInitScript(() => {
            window.productionProfilePad = {
              id: "Xbox virtual browser profiling only",
              index: 0,
              mapping: "standard",
              connected: true,
              timestamp: 0,
              axes: [0, 0, 0, 0],
              buttons: Array.from({ length: 17 }, () => ({
                pressed: false,
                touched: false,
                value: 0,
              })),
            };
            Object.defineProperty(navigator, "getGamepads", {
              configurable: true,
              value: () => [window.productionProfilePad],
            });
          });
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await page.goto(base);
        await page.waitForSelector("html[data-menu-ready=true]");
        const id = await page.evaluate(
          async ({ files, text, mode }) => {
            for (const file of files) {
              const api = await import(new URL(file, location.href).href);
              if (
                typeof api.CharacterStorage !== "function" ||
                typeof api.deserializeCharacter !== "function"
              )
                continue;
              const store = new api.CharacterStorage();
              try {
                const record = await store.create(
                  "Native Production",
                  api.deserializeCharacter(text),
                );
                sessionStorage.setItem(
                  "hollowbane-warrior-legacy",
                  mode === "legacy" ? "1" : "0",
                );
                localStorage.setItem(
                  "hollowbane.presentation.v1",
                  JSON.stringify({
                    version: 1,
                    quality: "full",
                    volume: 1,
                    muted: true,
                  }),
                );
                return record.id;
              } finally {
                store.close();
              }
            }
            throw Error("Missing published character API");
          },
          { files, text: fixtures["haunted-forest"], mode },
        );
        const navigationAt = Date.now();
        await page.goto(`${base}?world=1&character=${id}`);
        await page.waitForFunction(
          (mode) => {
            const v = window.hollowbaneWarriorProduction;
            return (
              v &&
              v.mode === mode &&
              v.reason === (mode === "legacy" ? "debug-legacy" : "supported")
            );
          },
          mode,
          { timeout: 30000 },
        );
        const load = await page.evaluate(() => {
          const canvas = document.querySelector("#combat-world canvas");
          const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          const requests = performance
            .getEntriesByType("resource")
            .filter((e) => /\/assets\/warrior\//.test(e.name));
          const gaps = window.productionLoadFrames
            .slice(1)
            .map((t, i) => t - window.productionLoadFrames[i]);
          return {
            graphics: "full",
            canvas: [canvas.width, canvas.height],
            renderer: ext
              ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
              : "unknown",
            loadMs: window.hollowbaneWarriorProduction.loadMs,
            textures: window.hollowbaneWarriorProduction.textures,
            decodedBaseBytes: window.hollowbaneWarriorProduction.decodedBytes,
            requests: requests.length,
            encodedBodyBytes: requests.reduce(
              (n, e) => n + e.encodedBodySize,
              0,
            ),
            transferBytes: requests.reduce((n, e) => n + e.transferSize, 0),
            developerRequests: performance
              .getEntriesByType("resource")
              .filter((e) => /\/dev\//.test(e.name)).length,
            loadingRafLongest: Math.max(0, ...gaps),
            loadingRafOver25: gaps.filter((v) => v > 25).length,
            jsHeapOnly: performance.memory?.usedJSHeapSize ?? null,
          };
        });
        if (!/Metal Renderer: Apple M4/.test(load.renderer))
          throw Error(`Expected native M4/Metal: ${load.renderer}`);
        cold.push({
          device,
          repeat,
          mode,
          navigationReadyMs: Date.now() - navigationAt,
          ...load,
        });
        await page.bringToFront();
        await page.locator("#combat-world").focus();
        const frames = await page.evaluate(async (device) => {
          const key = (name, down) =>
            window.dispatchEvent(
              new KeyboardEvent(down ? "keydown" : "keyup", {
                key: name,
                code: `Key${name.toUpperCase()}`,
                bubbles: true,
              }),
            );
          const drive = (x) => {
            if (device === "controller")
              window.productionProfilePad.axes[0] = x;
            else {
              key("d", x > 0);
              key("a", x < 0);
            }
          };
          return new Promise((resolve) => {
            const frames = [];
            let warm = 0,
              previous = null;
            const sample = (now) => {
              if (++warm <= 60) {
                requestAnimationFrame(sample);
                return;
              }
              const w = window.hollowbaneWorld,
                v = window.hollowbaneWarriorProduction,
                c = window.hollowbaneCombat;
              if (previous !== null)
                frames.push({
                  ms: now - previous,
                  tick: c.tick,
                  area: w.area,
                  x: w.position.x,
                  y: w.position.y,
                  cameraX: w.camera.x,
                  cameraY: w.camera.y,
                  zoom: w.camera.zoom,
                  relativeX:
                    (768 + (w.position.x - w.position.y) * 64 - w.camera.x) *
                    w.camera.zoom,
                  relativeY:
                    (512 + (w.position.x + w.position.y) * 32 - w.camera.y) *
                    w.camera.zoom,
                  hp: c.actors[0].hp,
                  actors: c.actors.length,
                  phase: c.actors[0].phase,
                  pose: v.pose,
                  textures: v.textures,
                  heap: performance.memory?.usedJSHeapSize ?? null,
                });
              previous = now;
              drive(Math.floor(frames.length / 60) % 2 ? -1 : 1);
              if (frames.length >= 420) {
                drive(0);
                resolve(frames);
              } else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
        }, device);
        const ms = frames.map((f) => f.ms),
          span = (k) =>
            Math.max(...frames.map((f) => f[k])) -
            Math.min(...frames.map((f) => f[k]));
        const sample = {
          device,
          repeat,
          mode,
          frames: frames.length,
          p50: percentile(ms, 0.5),
          p95: percentile(ms, 0.95),
          p99: percentile(ms, 0.99),
          longest: Math.max(...ms),
          over25: ms.filter((v) => v > 25).length,
          cameraRelativeRange: { x: span("relativeX"), y: span("relativeY") },
          hp: [frames[0].hp, frames.at(-1).hp],
          actors: [
            Math.min(...frames.map((f) => f.actors)),
            Math.max(...frames.map((f) => f.actors)),
          ],
          jsHeapOnly: [frames[0].heap, frames.at(-1).heap],
          errors,
        };
        results.push(sample);
        await writeFile(
          `${output}/${device}-${repeat}-${mode}.json`,
          JSON.stringify({ sample, frames }, null, 2),
        );
        if (repeat === 0)
          await page.screenshot({
            path: `${output}/${device}-${mode}-forest.png`,
          });
        console.log(JSON.stringify(sample));
        await context.close();
      }
  await writeFile(
    `${output}/summary.json`,
    JSON.stringify(
      {
        gpu,
        browser: browser.version(),
        resolution: [1280, 800],
        dpr: 1,
        cold,
        results,
        limitations: [
          "Browser keyboard events and virtual pads, no physical hardware",
          "Normal deterministic constructed forest save, not full human campaign",
          "HTTP cache disabled, OS/GPU cache not reset",
          "Base RGBA and JS heap are not GPU memory",
          "Actual campaign attacks/skills are verified separately; this cohort measures movement with natural encounters",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
