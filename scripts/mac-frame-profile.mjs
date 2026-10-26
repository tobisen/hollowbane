/* global window,performance,navigator */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// One local developer fixture; no character saves, simulation edits or FPS gates.
const option = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const output = option("output", "/private/tmp/hollowbane-mac-profile.json");
const renderer = option("renderer", "metal");
const qualities = option("quality", "full,balanced").split(",");
const inputs = option("input", "stationary,keyboard,controller").split(",");
const manualSeconds = Number(option("seconds", "30"));
if (!["metal", "swiftshader"].includes(renderer))
  throw Error("Use --renderer metal or swiftshader");
if (
  !qualities.every((v) => ["full", "balanced"].includes(v)) ||
  !inputs.every((v) =>
    ["stationary", "keyboard", "controller", "manual"].includes(v),
  ) ||
  !Number.isFinite(manualSeconds) ||
  manualSeconds < 1 ||
  manualSeconds > 120
)
  throw Error("Invalid quality/input or seconds (1–120)");
const browser = await chromium.launch({
  headless: !process.argv.includes("--headed"),
  args: [
    `--use-angle=${renderer}`,
    "--enable-precise-memory-info",
    ...(renderer === "swiftshader" ? ["--enable-unsafe-swiftshader"] : []),
  ],
});
const gpu = (
  await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
).gpu;
const results = [];
try {
  for (const quality of qualities)
    for (const input of inputs) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      });
      if (input !== "manual")
        await page.addInitScript(() => {
          const pad = {
            id: "Xbox 360 Controller",
            index: 0,
            mapping: "standard",
            connected: true,
            axes: [0, 0, 0, 0],
            timestamp: 0,
            buttons: Array.from({ length: 17 }, () => ({
              pressed: false,
              touched: false,
              value: 0,
            })),
          };
          window.profilePad = pad;
          Object.defineProperty(navigator, "getGamepads", {
            configurable: true,
            value: () => [pad],
          });
        });
      await page.goto(
        `${option("url", "http://127.0.0.1:4174/hollowbane/")}?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42&profile=1`,
      );
      await page.waitForFunction(
        () => window.hollowbaneWorld && window.hollowbaneProfileGame,
      );
      // Optional test-driver skin only. The application and simulation are untouched;
      // use the identical P2 forest route/load to compare the new atlas fairly.
      const warriorAtlas = option("warrior-atlas-url", "");
      if (warriorAtlas)
        await page.evaluate(async (url) => {
          const scene = window.hollowbaneProfileGame.scene.scenes[0];
          const response = await fetch(url.replace(/\.png$/, ".json"));
          if (!response.ok) throw Error("Missing profiling atlas metadata");
          const metadata = await response.json();
          await new Promise((resolve, reject) => {
            scene.load.once("complete", resolve);
            scene.load.once("loaderror", () =>
              reject(Error("Profiling atlas load failed")),
            );
            const sources = metadata.views
              ? Object.entries(metadata.views).map(([direction, view]) => [
                  direction,
                  new URL(view.atlas, url).href,
                ])
              : [["cadence", url]];
            for (const [direction, image] of sources)
              scene.load.spritesheet(`profile-warrior-${direction}`, image, {
                frameWidth: 256,
                frameHeight: metadata.cellHeight ?? 256,
              });
            scene.load.start();
          });
          window.profileWarriorSkin = metadata;
        }, warriorAtlas);
      const conditions = await page.evaluate((quality) => {
        const game = window.hollowbaneProfileGame;
        const scene = game.scene.scenes[0];
        // Pin existing profiles for comparisons, including software rendering.
        // These developer-instance fields never touch simulation or saved settings.
        scene.balancedDetail = quality === "balanced";
        scene.startedAt = Infinity;
        scene.syncResolution();
        const originalUpdate = scene.sys.sceneUpdate;
        const originalRecord = scene.record;
        let updateMs = 0,
          simulationMs = 0;
        scene.record = function (values, value) {
          if (values === this.simulations) simulationMs += value;
          return originalRecord.call(this, values, value);
        };
        scene.sys.sceneUpdate = function (...args) {
          const start = performance.now();
          simulationMs = 0;
          originalUpdate.apply(this, args);
          const skin = window.profileWarriorSkin;
          if (skin) {
            const walker = scene.world.actors[0].controller.walker;
            const clip = skin.clips[walker.walking ? walker.gait : "idle"];
            const phase = walker.walking
              ? walker.distance / clip.worldStride
              : ((walker.tick / 60) * clip.fps) / clip.count;
            scene.sprites
              .get(0)
              .setTexture(
                skin.views
                  ? `profile-warrior-${["s", "sw", "w", "nw", "n", "ne", "e", "se"][walker.direction]}`
                  : "profile-warrior-cadence",
                clip.start + (Math.floor(phase * clip.count) % clip.count),
              )
              .setOrigin(0.5, 210 / (skin.cellHeight ?? 256))
              .setScale(0.5)
              .setAngle(0)
              .setPosition(
                768 + (walker.position.x - walker.position.y) * 64,
                512 + (walker.position.x + walker.position.y) * 32,
              );
          }
          updateMs = performance.now() - start;
        };
        window.profileFrames = [];
        window.profileCollect = false;
        let collecting = false;
        game.events.on("postrender", () => {
          if (!window.profileCollect) {
            collecting = false;
            return;
          }
          // The first interval straddles setup and recording. Start at its end.
          if (!collecting) {
            collecting = true;
            return;
          }
          const w = window.hollowbaneWorld;
          window.profileFrames.push({
            frameMs: game.loop.rawDelta,
            submittedAt: performance.now(),
            updateMs,
            simulationMs,
            renderMs: scene.renders.at(-1),
            tick: scene.world.tick,
            x: w.position.x,
            y: w.position.y,
            cameraX: w.camera.x,
            cameraY: w.camera.y,
            zoom: w.camera.zoom,
            objects: scene.children.list.length,
            // This peaceful movement fixture creates no particle emitters.
            particles: 0,
            activeEntities: window.hollowbaneCombat.metrics.activeEntities,
            heap: performance.memory?.usedJSHeapSize ?? null,
          });
        });
        const gl = game.renderer.gl;
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        return {
          renderer: debug
            ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
            : "unknown",
          renderWidth: game.scale.width,
          renderHeight: game.scale.height,
        };
      }, quality);
      if (
        renderer === "metal" &&
        !/Metal Renderer: Apple/.test(conditions.renderer)
      )
        throw Error(`Native Apple Metal unavailable: ${conditions.renderer}`);
      await page.locator("#combat-world").focus();
      const waitTicks = async (ticks) => {
        const target = await page.evaluate(
          (ticks) => window.hollowbaneCombat.tick + ticks,
          ticks,
        );
        await page.waitForFunction(
          (target) => window.hollowbaneCombat.tick >= target,
          target,
          { polling: "raf", timeout: Math.max(60000, ticks * 50) },
        );
      };
      const leg = async (direction, device) => {
        if (device === "keyboard") await page.keyboard.down(direction);
        if (device === "controller")
          await page.evaluate((direction) => {
            window.profilePad.axes[0] = direction === "d" ? 1 : -1;
          }, direction);
        await waitTicks(36);
        if (device === "keyboard") await page.keyboard.up(direction);
        if (device === "controller")
          await page.evaluate(() => (window.profilePad.axes[0] = 0));
      };
      // Warm shaders/textures and both ends of the route before collecting.
      await waitTicks(120);
      const origin = await page.evaluate(() => window.hollowbaneWorld.position);
      await leg("d", "keyboard");
      await leg("a", "keyboard");
      await page.keyboard.press("Space");
      // CDP arrival can differ by one frame at a turn. Return through the real
      // click-navigation path so every comparison starts at the same position.
      const target = await page.evaluate((p) => {
        const c = window.hollowbaneWorld.camera;
        return {
          x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
          y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
        };
      }, origin);
      await page.mouse.click(target.x, target.y);
      await page.waitForFunction(
        (p) =>
          !window.hollowbaneWorld.walking &&
          Math.hypot(
            window.hollowbaneWorld.position.x - p.x,
            window.hollowbaneWorld.position.y - p.y,
          ) < 0.00001,
        origin,
        { polling: "raf", timeout: 10000 },
      );
      await waitTicks(30);
      const start = await page.evaluate(() => window.hollowbaneWorld.position);
      const cdp = await page.context().newCDPSession(page);
      const trace = process.argv.includes("--trace");
      if (trace) {
        await cdp.send("Profiler.enable");
        await cdp.send("Profiler.start");
      }
      // Let CDP attachment/profiler startup settle outside the measured window.
      await waitTicks(30);
      if (input === "manual")
        console.log(
          `Manual ${quality}: move now for ${manualSeconds}s; native controller API retained.`,
        );
      await page.evaluate(() => (window.profileCollect = true));
      if (input === "manual") await waitTicks(manualSeconds * 60);
      else if (input === "stationary") await waitTicks(360);
      else for (let i = 0; i < 10; i++) await leg(i % 2 ? "a" : "d", input);
      const frames = await page.evaluate(() => {
        window.profileCollect = false;
        return window.profileFrames;
      });
      if (!frames.length || !frames.some((f) => f.updateMs > 0))
        throw Error("No scene-update samples: profiling hook is incompatible");
      if (trace) {
        const { profile } = await cdp.send("Profiler.stop");
        await mkdir(dirname(output), { recursive: true });
        await writeFile(
          `${output}.${quality}-${input}.cpuprofile`,
          JSON.stringify(profile),
        );
      }
      const stats = (values) => {
        const sorted = [...values].sort((a, b) => a - b);
        const p = (fraction) =>
          sorted[Math.ceil(sorted.length * fraction) - 1] ?? 0;
        return {
          p50: p(0.5),
          p95: p(0.95),
          p99: p(0.99),
          max: sorted.at(-1) ?? 0,
        };
      };
      const deltas = frames.slice(1).map((f, i) => {
        const prev = frames[i];
        const screen = (v) => ({
          x: (768 + (v.x - v.y) * 64 - v.cameraX) * v.zoom,
          y: (512 + (v.x + v.y) * 32 - v.cameraY) * v.zoom,
        });
        const a = screen(f),
          b = screen(prev);
        return {
          player: Math.hypot(f.x - prev.x, f.y - prev.y),
          camera:
            Math.hypot(f.cameraX - prev.cameraX, f.cameraY - prev.cameraY) *
            f.zoom,
          screen: Math.hypot(a.x - b.x, a.y - b.y),
          heapDrop:
            f.heap !== null && prev.heap !== null ? prev.heap - f.heap : 0,
        };
      });
      const summary = {
        quality,
        input,
        conditions,
        start,
        count: frames.length,
        frameMs: stats(frames.map((f) => f.frameMs)),
        submissionIntervalMs: stats(
          frames.slice(1).map((f, i) => f.submittedAt - frames[i].submittedAt),
        ),
        ticksPerFrame: Object.fromEntries(
          [0, 1, 2].map((ticks) => [
            ticks,
            frames.slice(1).filter((f, i) => f.tick - frames[i].tick === ticks)
              .length,
          ]),
        ),
        over25: frames.filter((f) => f.frameMs > 25).length,
        over33: frames.filter((f) => f.frameMs > 33).length,
        over50: frames.filter((f) => f.frameMs > 50).length,
        updateMs: stats(frames.map((f) => f.updateMs)),
        simulationMs: stats(frames.map((f) => f.simulationMs)),
        renderMs: stats(frames.map((f) => f.renderMs)),
        playerDelta: stats(deltas.map((d) => d.player)),
        cameraDeltaCss: stats(deltas.map((d) => d.camera)),
        playerScreenDeltaCss: stats(deltas.map((d) => d.screen)),
        heapDropOver1MiB: deltas.filter((d) => d.heapDrop > 1048576).length,
        objects: frames.at(-1)?.objects,
        particles: frames.at(-1)?.particles,
        activeEntities: frames.at(-1)?.activeEntities,
      };
      if (
        ["keyboard", "controller"].includes(input) &&
        !deltas.some((d) => d.player > 0)
      )
        throw Error("Movement workload did not move the player");
      results.push({ summary, frames });
      await mkdir(dirname(output), { recursive: true });
      await page.screenshot({ path: `${output}.${quality}-${input}.png` });
      await page.close();
      console.log(JSON.stringify(summary));
    }
} finally {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        browser: browser.version(),
        renderer,
        cpuProfiler: process.argv.includes("--trace"),
        warriorAtlas: option("warrior-atlas-url", ""),
        headed: process.argv.includes("--headed"),
        gpu,
        seed: 42,
        viewport: { width: 1280, height: 800, dpr: 1 },
        method:
          "Warmed peaceful forest; ten alternating 36-tick screen-horizontal legs. Raw RAF delta, full scene update and existing render CPU timers. Heap drops indicate collection/reclamation, not confirmed GC causes. Headless GPU submission timing is not display scanout or input latency.",
        results,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
