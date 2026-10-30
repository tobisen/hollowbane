/* global window, requestAnimationFrame */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Native renderer diagnostics, separate from the software-rendered CI smoke.
const output = process.argv[2] ?? "/private/tmp/hollowbane-dungeon-slice";
const url = process.argv[3] ?? "http://127.0.0.1:4174/hollowbane/";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=metal"] });
try {
  const gpu = (
    await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  ).gpu;
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}?d2slice=1`);
  await page.waitForFunction(() => window.hollowbaneSlice?.tick > 60);
  const beforeCamera = await page.evaluate(() => window.hollowbaneSlice.camera);
  const before = await page
    .locator("canvas")
    .screenshot({ path: join(output, "before.png") });
  await page.keyboard.down("ArrowRight");
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const rows = [];
        let previous = null;
        const sample = (time) => {
          const s = window.hollowbaneSlice;
          rows.push({
            time,
            interval: previous === null ? null : time - previous,
            tick: s.tick,
            camera: s.camera,
            position: s.position,
          });
          previous = time;
          if (rows.length < 30) requestAnimationFrame(sample);
          else resolve(rows);
        };
        requestAnimationFrame(sample);
      }),
  );
  await page.keyboard.up("ArrowRight");
  await page.waitForFunction(() => !window.hollowbaneSlice.moving);
  const afterCamera = await page.evaluate(() => window.hollowbaneSlice.camera);
  const after = await page
    .locator("canvas")
    .screenshot({ path: join(output, "after.png") });
  const dx = afterCamera.x - beforeCamera.x,
    dy = afterCamera.y - beforeCamera.y;
  // A fixed world floor patch well below the animated actor, UI and cutaway walls.
  const patch = { left: 680, top: 510, width: 180, height: 80 };
  const a = await sharp(before).extract(patch).removeAlpha().raw().toBuffer();
  const b = await sharp(after)
    .extract({ ...patch, left: patch.left - dx, top: patch.top - dy })
    .removeAlpha()
    .raw()
    .toBuffer();
  let absolute = 0,
    changed = 0;
  for (let i = 0; i < a.length; i++) {
    absolute += Math.abs(a[i] - b[i]);
    if (a[i] !== b[i]) changed++;
  }
  const intervals = frames
    .slice(1)
    .map((r) => r.interval)
    .sort((a, b) => a - b);
  const report = {
    url,
    gpu,
    errors,
    frames,
    floorPatch: {
      ...patch,
      dx,
      dy,
      channels: a.length,
      changed,
      meanAbsoluteChannelDifference: absolute / a.length,
    },
    raf: {
      count: intervals.length,
      p95: intervals[Math.floor(intervals.length * 0.95)],
      max: Math.max(...intervals),
    },
    limits:
      "30-frame short native headless scroll; one translated floor patch only. No physical display/controller or campaign performance acceptance.",
  };
  await writeFile(
    join(output, "profile.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      { floorPatch: report.floorPatch, raf: report.raf, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
