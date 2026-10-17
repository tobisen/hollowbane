/* global window,performance,requestAnimationFrame */
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (const isolated of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    await page.goto(
      "http://127.0.0.1:4174/hollowbane/?skills=1&monsters=1&count=10&durable=1",
    );
    await page.waitForFunction(() => window.hollowbaneSkills?.tick > 60);
    await page.locator("#ai-practice").check();
    await page.locator("#combat-world").focus();
    if (isolated)
      await page.addStyleTag({
        content:
          ".arena-panel,.skill-bar,.arena-footer {contain:layout paint style;transform:translateZ(0)}",
      });
    if (!isolated)
      await page.addStyleTag({
        content:
          ".skill-arena .arena-panel,.skill-arena .skill-bar,.skill-arena .arena-footer {contain:none;transform:none}",
      });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const before = await cdp.send("Performance.getMetrics"),
      events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline,blink,cc,viz",
      transferMode: "ReportEvents",
    });
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const begin = performance.now();
          function frame(now) {
            if (now - begin >= 5000) resolve();
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }),
    );
    const completed = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    await completed;
    const after = await cdp.send("Performance.getMetrics"),
      metrics = {};
    for (const name of [
      "TaskDuration",
      "ScriptDuration",
      "LayoutDuration",
      "RecalcStyleDuration",
      "LayoutCount",
      "RecalcStyleCount",
    ])
      metrics[name] =
        after.metrics.find((m) => m.name === name)?.value -
        before.metrics.find((m) => m.name === name)?.value;
    const durations = {};
    for (const e of events)
      if (
        e.ph === "X" &&
        [
          "Layout",
          "Paint",
          "PrePaint",
          "UpdateLayoutTree",
          "Layerize",
          "Commit",
          "CompositeLayers",
          "DrawFrame",
        ].includes(e.name)
      ) {
        const d = (durations[e.name] ??= { count: 0, totalMs: 0, maxMs: 0 });
        d.count++;
        d.totalMs += e.dur / 1000;
        d.maxMs = Math.max(d.maxMs, e.dur / 1000);
      }
    results.push({
      isolated,
      metrics,
      durations,
      combat: await page.evaluate(() => window.hollowbaneCombat.metrics),
    });
    await writeFile(
      `.local/hud-trace-${isolated ? "isolated" : "original"}.json`,
      JSON.stringify({ traceEvents: events }),
    );
    await page.close();
  }
  await writeFile(
    ".local/hud-profile.json",
    JSON.stringify(
      {
        browser: browser.version(),
        method:
          "Separate 5s CDP trace per same 10-enemy scene; trace overhead excluded from performance claims; duration aggregates can overlap threads and are not GPU completion timing.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(results);
} finally {
  await browser.close();
}
