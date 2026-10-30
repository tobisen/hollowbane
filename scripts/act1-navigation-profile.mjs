/* global window, performance, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[3] ?? "https://tobisen.github.io/hollowbane/";
const out = process.argv[2] ?? "/private/tmp/hollowbane-act1-navigation";
await mkdir(out, { recursive: true });
// Real input request costs are separate from steady walking frame-time cohorts.
// No traces, screenshots, video, synthetic simulation writes or outlier filtering.
const cases = [
  { name: "act1a-direct", mode: "act1", view: "a", target: { x: 19, y: 29 } },
  { name: "act1a-shrine", mode: "act1", view: "a", button: "#act1-shrine" },
  { name: "act1b-shrine", mode: "act1", view: "b", button: "#act1-shrine" },
  { name: "slice-direct", mode: "slice", target: { x: 16, y: 8 } },
  {
    name: "slice-obstructed",
    mode: "slice",
    prep: { x: 12, y: 9 },
    target: { x: 16, y: 14.5 },
  },
];
const stats = (rows) => {
  const v = rows
    .map((x) => x.interval)
    .filter((x) => x !== null)
    .sort((a, b) => a - b);
  return {
    count: v.length,
    p50: v[Math.ceil(v.length * 0.5) - 1],
    p95: v[Math.ceil(v.length * 0.95) - 1],
    p99: v[Math.ceil(v.length * 0.99) - 1],
    max: v.at(-1),
    over25: v.filter((x) => x > 25).length,
  };
};
const browser = await chromium.launch({ args: ["--use-angle=metal"] });
const results = [];
try {
  const gpu = (
    await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  ).gpu;
  if (!gpu.devices.some((d) => /Metal Renderer: Apple/.test(d.deviceString)))
    throw Error("Native Metal required");
  for (let rep = 0; rep < 3; rep++)
    for (const item of cases) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript((mode) => {
        window.probeRows = [];
        window.probeEvents = [];
        window.probeCollect = false;
        window.probeState = () =>
          mode === "act1" ? window.hollowbaneAct1 : window.hollowbaneSlice;
        window.addEventListener(
          "pointerdown",
          () => {
            if (window.probeCollect)
              window.probeEvents.push({
                kind: "pointerdown",
                at: performance.now(),
                tick: window.probeState().tick,
              });
          },
          { capture: true },
        );
        window.addEventListener(
          "click",
          () => {
            if (window.probeCollect)
              window.probeEvents.push({
                kind: "click",
                at: performance.now(),
                tick: window.probeState().tick,
              });
          },
          { capture: true },
        );
        let previous = null;
        const frame = (time) => {
          const s = window.probeState();
          if (window.probeCollect && s)
            window.probeRows.push({
              time,
              interval: previous === null ? null : time - previous,
              tick: s.tick,
              position: s.position,
              moving: s.moving,
            });
          previous = window.probeCollect ? time : null;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }, item.mode);
      await page.goto(
        base +
          (item.mode === "act1"
            ? `?act1readability=1&view=${item.view}`
            : "?d2slice=1"),
        { waitUntil: "commit" },
      );
      await page.waitForFunction(() => window.probeState()?.tick >= 2, null, {
        polling: "raf",
      });
      await page.locator("#world").focus();
      const ticks = async (n) => {
        const end = await page.evaluate((n) => window.probeState().tick + n, n);
        await page.waitForFunction(
          (end) => window.probeState().tick >= end,
          end,
          { polling: "raf" },
        );
      };
      const pointClick = async (target) => {
        const p = await page.evaluate((target) => {
          const s = window.probeState();
          return {
            x: (target.x - target.y) * 64 + 768 - s.camera.x + 640,
            y:
              (target.x + target.y) * (s.variant === "b" ? 44 : 32) +
              512 -
              s.camera.y +
              400,
          };
        }, target);
        if (p.x < 20 || p.x > 1260 || p.y < 120 || p.y > 715)
          throw Error("Target not clear visible ground " + JSON.stringify(p));
        await page.mouse.click(p.x, p.y);
      };
      if (item.prep) {
        await pointClick(item.prep);
        await page.waitForFunction(
          (p) => {
            const s = window.probeState();
            return Math.hypot(s.position.x - p.x, s.position.y - p.y) < 0.08;
          },
          item.prep,
          { polling: "raf" },
        );
      }
      await page.evaluate(() => {
        window.probeRows = [];
        window.probeEvents = [];
        window.probeCollect = true;
      });
      await ticks(60);
      const start = await page.evaluate(() => window.probeState());
      if (item.button) await page.locator(item.button).click();
      else await pointClick(item.target);
      await ticks(120);
      const raw = await page.evaluate(() => {
        window.probeCollect = false;
        return {
          rows: window.probeRows,
          events: window.probeEvents,
          end: window.probeState(),
        };
      });
      const eventAt = raw.events[0]?.at;
      const firstMove = raw.rows.find(
        (r) =>
          r.time >= eventAt &&
          Math.hypot(
            r.position.x - start.position.x,
            r.position.y - start.position.y,
          ) > 0.001,
      );
      const markedIndex = raw.rows.findIndex((r) => r.time >= eventAt);
      const during = raw.rows.slice(
        Math.max(0, markedIndex - 1),
        markedIndex + 12,
      );
      const result = {
        name: item.name,
        rep,
        errors,
        start,
        end: raw.end,
        events: raw.events,
        rows: raw.rows,
        before: stats(raw.rows.filter((r) => r.time < eventAt)),
        request: stats(during),
        after: stats(raw.rows.slice(markedIndex + 12)),
        firstMotionMs: firstMove ? firstMove.time - eventAt : null,
        total: stats(raw.rows),
      };
      results.push(result);
      await context.close();
      console.log(
        JSON.stringify({
          name: item.name,
          rep,
          before: result.before,
          request: result.request,
          after: result.after,
          firstMotionMs: result.firstMotionMs,
          errors,
        }),
      );
      await writeFile(
        out + "/request-performance.json",
        JSON.stringify(
          {
            base,
            gpu,
            browser: browser.version(),
            conditions:
              "Native Metal1280x800 DPR1, no screenshots/video/traces, trusted visible pointer or route-button click,60 pre-request ticks and120 post-request ticks, fresh contexts, read-only RAF/state and DOM event timestamps; request window contains marker preceding frame plus12 subsequent frames; not direct CPU instrumentation.",
            results,
          },
          null,
          2,
        ),
      );
    }
} finally {
  await browser.close();
}
