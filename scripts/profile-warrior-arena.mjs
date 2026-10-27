/* global window, document, navigator, requestAnimationFrame, performance */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/";
const output = process.argv[3];
if (!output) throw Error("Pass base URL and an untracked evidence directory");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: false,
  args: ["--use-angle=metal", "--enable-precise-memory-info"],
});
const route = `${base}?developer=1&warriorPilot=1&warriorArena=1`;
const cold = [],
  samples = [];
try {
  for (let repeat = 0; repeat < 3; repeat++) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.addInitScript(() => {
      window.arenaLoadFrames = [];
      const frame = (t) => {
        window.arenaLoadFrames.push(t);
        if (!document.documentElement.dataset.warriorArenaReady)
          requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.goto(route);
    await page.waitForSelector("html[data-warrior-arena-ready=true]");
    cold.push(
      await page.evaluate(() => {
        const o = window.hollowbaneWarriorArena;
        const png = performance
          .getEntriesByType("resource")
          .filter((e) => /\/dev\/.*\.png$/.test(e.name));
        const gaps = window.arenaLoadFrames
          .slice(1)
          .map((t, i) => t - window.arenaLoadFrames[i]);
        return {
          readyMs: o.readyMs,
          requests: png.length,
          unique: new Set(png.map((e) => e.name)).size,
          encodedBodyBytes: png.reduce((n, e) => n + e.encodedBodySize, 0),
          transferBytes: png.reduce((n, e) => n + e.transferSize, 0),
          decodedBaseBytes: o.decodedBytes,
          textures: o.candidateTextures,
          maxTextureSize: o.maxTextureSize,
          loadingRafLongest: Math.max(...gaps),
          loadingRafOver25: gaps.filter((g) => g > 25).length,
          jsHeapOnly: performance.memory
            ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
              }
            : null,
        };
      }),
    );
    if (repeat === 0)
      await page.screenshot({
        path: `${output}/cold-ready.png`,
        fullPage: true,
      });
    await context.close();
  }
  for (const device of ["keyboard", "controller"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    if (device === "controller")
      await page.addInitScript(() => {
        window.arenaProfilePad = {
          id: "Xbox virtual browser profile only",
          index: 0,
          mapping: "standard",
          connected: true,
          axes: [0, 0, 0, 0],
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            value: 0,
            touched: false,
          })),
        };
        Object.defineProperty(navigator, "getGamepads", {
          value: () => [window.arenaProfilePad],
          configurable: true,
        });
      });
    await page.exposeFunction("arenaProfileKey", async (key, down) => {
      if (down === null) await page.keyboard.press(key);
      else if (down) await page.keyboard.down(key);
      else await page.keyboard.up(key);
    });
    await page.goto(route);
    await page.waitForSelector("html[data-warrior-arena-ready=true]");
    await page.bringToFront();
    await page.locator("#arena-guides").uncheck();
    const environment = await page.evaluate(() => {
      const canvas = document.querySelector("#pilot-stage canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        visible: document.visibilityState,
        renderer: ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : "unknown",
        userAgent: navigator.userAgent,
        dpr: window.devicePixelRatio,
        canvas: [canvas.width, canvas.height],
        displayed: [canvas.clientWidth, canvas.clientHeight],
      };
    });
    if (!/Metal Renderer: Apple/.test(environment.renderer))
      throw Error("Native Apple Metal required");
    for (const source of [
      "shipped",
      "candidate",
      "candidate",
      "shipped",
      "shipped",
      "candidate",
    ]) {
      await page.locator("#arena-source").selectOption(source);
      await page.locator("#arena-reset").click();
      await page.locator("#pilot-stage").scrollIntoViewIfNeeded();
      await page.locator("#pilot-stage").focus();
      const result = await page.evaluate(
        (device) =>
          new Promise((resolve) => {
            let warm = 60,
              frame = 0;
            const times = [],
              observations = [],
              pending = [];
            const events = new Map([
              [1, ["2", null, 7]],
              [40, ["x", null, 2]],
              [95, ["1", null, 5]],
              [150, ["r", null, 10]],
              [160, ["d", true, 0]],
              [190, ["d", false, 0]],
              [191, ["w", true, 1]],
              [220, ["w", false, 1]],
              [221, ["a", true, 2]],
              [250, ["a", false, 2]],
              [280, ["q", null, 3]],
            ]);
            const releases = new Map();
            function sample(t) {
              if (warm-- > 0) {
                requestAnimationFrame(sample);
                return;
              }
              times.push(t);
              const o = window.hollowbaneWarriorArena;
              observations.push({
                tick: o.sample.tick,
                pose: o.sample.pose,
                position: o.sample.position,
                camera: o.cameraRelative,
                sequence: o.sample.sequence,
                effects: o.sample.effects,
                hp: o.sample.hp,
                textures: o.candidateTextures,
              });
              if (device === "controller" && releases.has(frame)) {
                const button = releases.get(frame);
                window.arenaProfilePad.buttons[button] = {
                  pressed: false,
                  touched: false,
                  value: 0,
                };
              }
              if (events.has(frame)) {
                const [key, down, index] = events.get(frame);
                if (device === "keyboard")
                  pending.push(window.arenaProfileKey(key, down));
                else if (down === null) {
                  window.arenaProfilePad.buttons[index] = {
                    pressed: true,
                    touched: true,
                    value: 1,
                  };
                  releases.set(frame + 3, index);
                } else {
                  window.arenaProfilePad.axes[0] =
                    down && key !== "w" ? (key === "a" ? -1 : 1) : 0;
                  window.arenaProfilePad.axes[1] = down && key === "w" ? -1 : 0;
                }
              }
              if (++frame < 421) {
                requestAnimationFrame(sample);
                return;
              }
              const deltas = times.slice(1).map((t, i) => t - times[i]),
                sorted = [...deltas].sort((a, b) => a - b);
              Promise.all(pending).then(() =>
                resolve({
                  frames: deltas.length,
                  p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
                  p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
                  p99: sorted[Math.ceil(sorted.length * 0.99) - 1],
                  longest: sorted.at(-1),
                  over25: deltas.filter((d) => d > 25).length,
                  cameraDrift: Math.max(
                    ...observations.map((o) =>
                      Math.hypot(o.camera.x - 480, o.camera.y - 270),
                    ),
                  ),
                  textures: [...new Set(observations.map((o) => o.textures))],
                  deltas,
                  observations,
                }),
              );
            }
            requestAnimationFrame(sample);
          }),
        device,
      );
      samples.push({ device, source, environment, ...result });
      console.log(
        JSON.stringify({
          device,
          source,
          ...result,
          observations: undefined,
          deltas: undefined,
        }),
      );
      await page.screenshot({
        path: `${output}/${device}-${source}-${samples.length}.png`,
        fullPage: true,
      });
    }
    await page.waitForFunction(
      () =>
        window.hollowbaneWarriorArena.sample.pose.set === "death" &&
        window.hollowbaneWarriorArena.sample.pose.frame === 15,
    );
    await page.screenshot({
      path: `${output}/${device}-native-held-corpse.png`,
      fullPage: true,
    });
    await context.close();
  }
  await writeFile(
    `${output}/native.json`,
    JSON.stringify(
      {
        browser: browser.version(),
        condition:
          "Visible native Metal, 1280x800/DPR1, 960x480 gameplay canvas/zoom1, five real training actors, obstacle, all forty textures resident in both sources; reset, 60 RAF warmup, 420 measured intervals; keyboard and virtual controller use matching semantic event schedules; no physical or total GPU memory claim",
        cold,
        samples,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ cold }));
} finally {
  await browser.close();
}
