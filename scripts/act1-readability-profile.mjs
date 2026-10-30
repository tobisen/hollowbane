/* global window, document, requestAnimationFrame, performance, localStorage */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Read-only local/hosted diagnostics. Captures never enter untraced timing cohorts.
const output = process.argv[2] ?? "/private/tmp/hollowbane-act1-profile";
const base = process.argv[3] ?? "https://tobisen.github.io/hollowbane/";
const capture = process.argv.includes("--capture");
await mkdir(output, { recursive: true });
const routes = {
  act1a: "?act1readability=1&view=a",
  act1b: "?act1readability=1&view=b",
  slice: "?d2slice=1",
  campaign:
    "?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42&profile=1&quality=full",
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
    max: sorted.at(-1) ?? null,
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
    // Rotate/reverse fresh contexts to expose network/order variation.
    const order = ["act1a", "act1b", "slice", "campaign"];
    const rotated = [...order.slice(repetition), ...order.slice(0, repetition)];
    if (repetition % 2) rotated.reverse();
    for (const mode of rotated) {
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
          if (mode === "act1a" || mode === "act1b") {
            const s = window.hollowbaneAct1;
            return (
              s && {
                tick: s.tick,
                position: s.position,
                camera: s.camera,
                zoom: 1,
                moving: s.moving,
                variant: s.variant,
                textures: s.textures,
                environment: s.environment,
              }
            );
          }
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
          encodedBodySize: r.encodedBodySize,
          decodedBodySize: r.decodedBodySize,
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
      await page
        .locator(mode === "campaign" ? "#combat-world" : "#world")
        .focus();
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
      const cohortEnd = await page.evaluate(
        () => window.acceptState().position,
      );
      const visualStates = [];
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
        if (mode === "act1a" || mode === "act1b") {
          const snapshot = async (label) => {
            await page.screenshot({
              path: join(output, `${mode}-${label}.png`),
            });
            visualStates.push({
              label,
              state: await page.evaluate(() => window.hollowbaneAct1),
            });
          };
          const arrive = async (point) => {
            await page.waitForFunction(
              (target) => {
                const s = window.hollowbaneAct1;
                return (
                  Math.hypot(s.position.x - target.x, s.position.y - target.y) <
                  0.08
                );
              },
              point,
              { polling: "raf", timeout: 30_000 },
            );
          };
          // Trusted pointer clicks target visible ground; diagnostics only read state.
          const walkClick = async (point) => {
            const screen = await page.evaluate((target) => {
              const s = window.hollowbaneAct1;
              return {
                x: (target.x - target.y) * 64 + 768 - s.camera.x + 640,
                y:
                  (target.x + target.y) * (s.variant === "a" ? 32 : 44) +
                  512 -
                  s.camera.y +
                  400,
              };
            }, point);
            if (
              screen.x < 40 ||
              screen.x > 1240 ||
              screen.y < 140 ||
              screen.y > 680
            )
              throw Error(
                `Ground click outside clear viewport: ${JSON.stringify(screen)}`,
              );
            await page.mouse.click(screen.x, screen.y);
            await arrive(point);
          };
          await page.locator("#act1-reset").click();
          await ticks(2);
          await walkClick({ x: 10.5, y: 27 });
          await walkClick({ x: 9, y: 24 });
          await snapshot("tree-boundary");
          await page.locator("#act1-reset").click();
          await page.locator("#act1-meadow").click();
          await page.waitForFunction(
            () => {
              const s = window.hollowbaneAct1;
              return s.actors.some(
                (a) =>
                  a.id !== 0 &&
                  a.hp > 0 &&
                  Math.hypot(
                    a.position.x - s.position.x,
                    a.position.y - s.position.y,
                  ) < 5,
              );
            },
            null,
            { polling: "raf", timeout: 30_000 },
          );
          await snapshot("combat-approach");
          for (let enemy = 0; enemy < 2; enemy++) {
            const target = await page.evaluate(() => {
              const s = window.hollowbaneAct1;
              return s.actors
                .filter((a) => a.id !== 0 && a.hp > 0)
                .sort(
                  (a, b) =>
                    Math.hypot(
                      a.position.x - s.position.x,
                      a.position.y - s.position.y,
                    ) -
                      Math.hypot(
                        b.position.x - s.position.x,
                        b.position.y - s.position.y,
                      ) || a.id - b.id,
                )[0];
            });
            if (!target) throw Error("Expected a living combat capture target");
            await page.keyboard.down("x");
            await ticks(2);
            await page.keyboard.up("x");
            await page.waitForFunction(
              (before) => {
                const s = window.hollowbaneAct1;
                return s.actors.some(
                  (a) => a.id === before.id && a.hp < before.hp,
                );
              },
              target,
              { polling: "raf", timeout: 30_000 },
            );
            await snapshot(`combat-hit-${enemy + 1}`);
            await page.waitForFunction(
              (id) => {
                const s = window.hollowbaneAct1;
                return s.actors.some((a) => a.id === id && a.hp <= 0);
              },
              target.id,
              { polling: "raf", timeout: 30_000 },
            );
          }
          const afterCombat = await page.evaluate(() => window.hollowbaneAct1);
          if (
            afterCombat.hp <= 0 ||
            afterCombat.actors.some((a) => a.id !== 0 && a.hp > 0)
          )
            throw Error(
              "Combat capture failed to survive and defeat both existing monsters",
            );
          await snapshot("combat-cleared");
          await page.locator("#act1-shrine").click();
          await arrive({ x: 42, y: 14 });
          await snapshot("shrine");
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
        ...(capture ? { visualStates } : {}),
        raf: stats(intervals),
        cameraStep: stats(
          deltas.filter((r) => r.distance > 0).map((r) => r.cameraStep),
        ),
        ticks: {
          zero: deltas.filter((d) => d.ticks === 0).length,
          multiple: deltas.filter((d) => d.ticks > 1).length,
        },
        start,
        end: cohortEnd,
        returnDistance: Math.hypot(
          cohortEnd.x - start.x,
          cohortEnd.y - start.y,
        ),
        movedFrames: deltas.filter((r) => r.distance > 0).length,
      };
      // Retain failing/slow cohorts as evidence; do not silently discard or retry.
      result.valid = result.movedFrames >= 200 && errors.length === 0;
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
          movedFrames: result.movedFrames,
          returnDistance: result.returnDistance,
          valid: result.valid,
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
            aggregate: Object.fromEntries(
              Object.keys(routes).map((name) => {
                const cohorts = results.filter((r) => r.mode === name);
                return [
                  name,
                  {
                    cohorts: cohorts.length,
                    valid: cohorts.every((r) => r.valid),
                    coldMs: stats(cohorts.map((r) => r.cold.readyMs)),
                    raf: stats(
                      cohorts.flatMap((r) =>
                        r.frames.slice(1).map((frame) => frame.interval),
                      ),
                    ),
                    ticks: {
                      zero: cohorts.reduce((n, r) => n + r.ticks.zero, 0),
                      multiple: cohorts.reduce(
                        (n, r) => n + r.ticks.multiple,
                        0,
                      ),
                    },
                  },
                ];
              }),
            ),
            conditions:
              "Chromium headless, native Apple Metal, viewport/render1280x800 DPR1, fresh contexts/cache disabled, default camera presentation, Act1 A/B with real isolated encounter, dungeon study, peaceful campaign haunted-forest seed42 Full. 120 warmup ticks and two36-tick legs, then ten alternating36-tick trusted-keyboard legs. Video/screenshots only in separately instrumented capture cohorts. Cold means uncached application navigation in a running browser, not OS/browser launch. Equal viewport/input protocol does not imply equal geometry, visible work, HUD, enemy workload or zoom. Texture counts are reported only where exposed, not inferred as GPU memory. Raw failing/slow cohorts are retained; no retry or outlier exclusion.",
          },
          null,
          2,
        ),
      );
    }
  }
  if (results.some((result) => !result.valid))
    throw Error(
      "Invalid cohorts retained in report; inspect movement and runtime errors",
    );
} finally {
  await browser.close();
}
