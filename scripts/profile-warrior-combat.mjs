/* global document, window, requestAnimationFrame, navigator */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] ?? "http://127.0.0.1:4173/hollowbane/";
const output = process.argv[3];
const abilities = process.argv[4] === "abilities";
const multiDirection = abilities || process.argv[4] === "directions";
if (!output) throw Error("Pass base URL and untracked evidence directory");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: false,
  args: ["--use-angle=metal", "--enable-precise-memory-info"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const begin = Date.now();
  await page.goto(
    `${base}?developer=1&warriorPilot=1&warriorCombat=1${abilities ? "&warriorAbilities=1" : multiDirection ? "&warriorAttackDirections=1" : ""}`,
  );
  await page.waitForSelector("html[data-warrior-combat-ready=true]");
  const readyMs = Date.now() - begin;
  await page.bringToFront();
  await page.locator("#attack-guides").uncheck();
  const environment = await page.evaluate(() => {
    const canvas = document.querySelector("#pilot-stage canvas"),
      gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      visible: document.visibilityState,
      userAgent: navigator.userAgent,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown",
      dpr: window.devicePixelRatio,
    };
  });
  if (!/Metal Renderer: Apple/.test(environment.renderer))
    throw Error("Native Apple Metal required");
  const motion = [];
  for (const direction of multiDirection
    ? ["n", "ne", "e", "se", "s", "sw", "w", "nw"]
    : ["se"]) {
    if (multiDirection)
      await page.locator("#attack-direction").selectOption(direction);
    for (const rate of ["1", "0.25"])
      for (const clip of abilities
        ? ["iron-fan", "oath-echo"]
        : ["primary", "secondary"]) {
        await page.locator("#attack-rate").selectOption(rate);
        await page.locator("#attack-clip").selectOption(clip);
        await page.locator("#attack-reset").click();
        // Arm capture before trusted input; record actual presentation, never step poses.
        await page.evaluate(() => {
          window.attackCapture = new Promise((resolve) => {
            const frames = [];
            let seen = -1,
              first;
            function capture(t) {
              const o = window.hollowbaneWarriorCombat;
              if (o.sample.sequence === 1 && o.sample.tick !== seen) {
                first ??= t;
                seen = o.sample.tick;
                frames.push({
                  t: t - first,
                  ...o.sample,
                  image: document
                    .querySelector("#cadence-inspector")
                    .toDataURL(),
                });
                if (o.sample.phase === "idle") {
                  resolve(frames);
                  return;
                }
              }
              requestAnimationFrame(capture);
            }
            requestAnimationFrame(capture);
          });
        });
        await page.locator("#attack-start").click();
        const frames = await page.evaluate(() => window.attackCapture);
        const selected = frames.filter(
          (f, i) => i === 0 || f.frame !== frames[i - 1].frame,
        );
        const layers = [];
        for (const [i, f] of selected.entries())
          layers.push({
            input: await sharp(Buffer.from(f.image.split(",")[1], "base64"))
              .resize(256, 256)
              .png()
              .toBuffer(),
            left: (i % 7) * 256,
            top: Math.floor(i / 7) * 256,
          });
        await sharp({
          create: {
            width: 7 * 256,
            height: Math.ceil(layers.length / 7) * 256,
            channels: 4,
            background: "#171c22",
          },
        })
          .composite(layers)
          .png()
          .toFile(
            `${output}/${multiDirection ? direction + "-" : ""}${clip}-${rate}-motion.png`,
          );
        motion.push({
          direction,
          clip,
          rate,
          frames: frames.map((f) => ({ ...f, image: undefined })),
        });
      }
  }
  if (multiDirection)
    await page.locator("#attack-direction").selectOption("se");
  await page.locator("#attack-rate").selectOption("1");
  await page.locator("#attack-repeat").check();
  await page.locator("#attack-zoom").selectOption("2");
  await page.locator("#pilot-stage").scrollIntoViewIfNeeded();
  const samples = [];
  for (const source of [
    "shipped",
    "candidate",
    "candidate",
    "shipped",
    "shipped",
    "candidate",
  ]) {
    await page.locator("#attack-source").selectOption(source);
    const sample = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let warm = 60;
          const times = [],
            camera = [];
          function sample(t) {
            if (warm > 0) warm--;
            else {
              times.push(t);
              camera.push(window.hollowbaneWarriorCombat.cameraRelative);
            }
            if (times.length < 241) {
              requestAnimationFrame(sample);
              return;
            }
            const deltas = times.slice(1).map((t, i) => t - times[i]),
              sorted = [...deltas].sort((a, b) => a - b),
              q = (p) => sorted[Math.ceil(sorted.length * p) - 1];
            resolve({
              frames: deltas.length,
              p50: q(0.5),
              p95: q(0.95),
              p99: q(0.99),
              longest: sorted.at(-1),
              over25: deltas.filter((d) => d > 25).length,
              cameraDrift: Math.max(
                ...camera.map((c) =>
                  Math.hypot(c.x - camera[0].x, c.y - camera[0].y),
                ),
              ),
              deltas,
            });
          }
          requestAnimationFrame(sample);
        }),
    );
    samples.push({ source, ...sample });
  }
  await page.screenshot({ path: `${output}/native-stage.png`, fullPage: true });
  await writeFile(
    `${output}/native.json`,
    JSON.stringify(
      {
        browser: browser.version(),
        environment,
        readyMs,
        condition: abilities
          ? "native visible isolated ability preview; Oath Echo replay, real 10/1/16 ticks; zoom2; paired sources; ability/movement textures resident in both"
          : "native visible isolated combat preview; secondary replay, real 12/2/18 ticks; zoom2; paired sources; all textures resident in both",
        motion,
        samples,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      environment,
      readyMs,
      samples: samples.map((s) => ({ ...s, deltas: undefined })),
    }),
  );
} finally {
  await browser.close();
}
