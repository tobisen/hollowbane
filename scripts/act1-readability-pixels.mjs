/* global window, requestAnimationFrame */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = process.argv[2] ?? "/private/tmp/hollowbane-act1-pixels";
const base = process.argv[3] ?? "http://127.0.0.1:4175/hollowbane/";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=metal"] });
// Locator screenshots include overlapping DOM. Exclude the screen-fixed captions
// from world-aligned comparisons without modifying the canvas or simulation.
const style =
  ".act1-caption,.act1-compare,.act1-controls{visibility:hidden!important}";
try {
  const gpu = (
    await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  ).gpu;
  if (!gpu.devices.some((d) => /Metal Renderer: Apple/.test(d.deviceString)))
    throw Error("Native Apple Metal required");
  const results = [];
  for (const variant of ["a", "b"]) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}?act1readability=1&view=${variant}`);
    await page.waitForFunction(() => window.hollowbaneAct1?.tick > 60);
    const camera = () => page.evaluate(() => window.hollowbaneAct1.camera);
    const beforeCamera = await camera();
    const before = await page
      .locator("canvas")
      .screenshot({ path: join(output, `${variant}-before.png`), style });
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          let count = 0;
          const next = () =>
            ++count === 30 ? resolve() : requestAnimationFrame(next);
          requestAnimationFrame(next);
        }),
    );
    const stationary = await page
      .locator("canvas")
      .screenshot({ path: join(output, `${variant}-stationary.png`), style });
    await page.keyboard.down("ArrowRight");
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const end = window.hollowbaneAct1.tick + 30;
          const next = () =>
            window.hollowbaneAct1.tick >= end
              ? resolve()
              : requestAnimationFrame(next);
          requestAnimationFrame(next);
        }),
    );
    await page.keyboard.up("ArrowRight");
    await page.waitForFunction(() => !window.hollowbaneAct1.moving);
    const afterCamera = await camera();
    const after = await page
      .locator("canvas")
      .screenshot({ path: join(output, `${variant}-after.png`), style });
    const dx = afterCamera.x - beforeCamera.x,
      dy = afterCamera.y - beforeCamera.y;
    const compare = async (image, patch, x, y) => {
      const a = await sharp(before)
        .extract(patch)
        .removeAlpha()
        .raw()
        .toBuffer();
      const b = await sharp(image)
        .extract({ ...patch, left: patch.left - x, top: patch.top - y })
        .removeAlpha()
        .raw()
        .toBuffer();
      let changed = 0,
        total = 0;
      for (let i = 0; i < a.length; i++) {
        const difference = Math.abs(a[i] - b[i]);
        total += difference;
        if (difference) changed++;
      }
      return {
        patch,
        dx: x,
        dy: y,
        channels: a.length,
        changed,
        meanAbsoluteChannelDifference: total / a.length,
      };
    };
    const patches = [
      { name: "ground-material", left: 680, top: 510, width: 180, height: 80 },
      // Same world rock/shadow region, with its projected vertical shift in B.
      {
        name: "rock-shadow",
        left: 170,
        top: variant === "a" ? 145 : 60,
        width: 95,
        height: 80,
      },
    ];
    const comparisons = [];
    for (const { name, ...patch } of patches)
      comparisons.push({
        name,
        stationary: await compare(stationary, patch, 0, 0),
        translated: await compare(after, patch, dx, dy),
      });
    results.push({ variant, beforeCamera, afterCamera, errors, comparisons });
    await page.close();
  }
  const report = {
    base,
    gpu,
    results,
    limits:
      "Native1280×800/DPR1, two fixed world patches per variant, stationary30frames and horizontal30tick scroll. Includes ground marks and rock/shadow; not foliage/crowns, every route/direction, physical display or proof of eliminating all shimmer. Instrumented captures excluded from performance cohorts.",
  };
  await writeFile(join(output, "pixels.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
