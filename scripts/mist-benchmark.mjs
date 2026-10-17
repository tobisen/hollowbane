/* global window,performance,requestAnimationFrame */
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (let repeat = 0; repeat < 2; repeat++)
    for (const quality of ["balanced", "full"])
      for (const mist of [true, false]) {
        const page = await browser.newPage({
            viewport: { width: 1920, height: 1080 },
          }),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(
          `http://127.0.0.1:4174/hollowbane/?metrics=1${quality === "full" ? "&quality=full" : ""}${mist ? "" : "&noMist=1"}`,
        );
        await page.waitForFunction(() => window.hollowbanePrototype?.tick > 2);
        const result = await page.evaluate(async () => {
          const frames = [];
          let start = 0,
            previous = 0;
          await new Promise((resolve) => {
            const begin = performance.now();
            function warm(now) {
              if (now - begin < 2000) requestAnimationFrame(warm);
              else resolve();
            }
            requestAnimationFrame(warm);
          });
          await new Promise((resolve) => {
            function frame(now) {
              start ||= now;
              if (previous) frames.push(now - previous);
              previous = now;
              if (now - start >= 6000) resolve();
              else requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          });
          const sorted = [...frames].sort((a, b) => a - b);
          return {
            frameP50: sorted[Math.floor(sorted.length * 0.5)],
            frameP95: sorted[Math.floor(sorted.length * 0.95)],
            frames,
            diagnostics: window.hollowbaneDiagnostics,
          };
        });
        results.push({ repeat, quality, mist, ...result, errors });
        console.log({ repeat, quality, mist, p95: result.frameP95, errors });
        await page.close();
      }
  await writeFile(
    ".local/mist-performance.json",
    JSON.stringify(
      {
        browser: browser.version(),
        renderer: "explicit SwiftShader",
        method:
          "Two interleaved 6s repeats after 2s warmup, idle cloister at same viewport1920x1080. Only mist rendering toggled, full/balanced reported separately; no hardware GPU claim.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (results.some((r) => r.errors.length))
    throw Error("Page errors in mist benchmark");
} finally {
  await browser.close();
}
