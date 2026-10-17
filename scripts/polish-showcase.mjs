/* global window,document,requestAnimationFrame */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await page.goto(
    new URL(
      "?polish=1&showcase=1",
      process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/",
    ).href,
  );
  await page.waitForFunction(() => window.hollowbanePolish?.tick > 2);
  const frames = [];
  await mkdir(".local/polish-showcase", { recursive: true });
  for (const skill of [
    "ember-lance",
    "rime-ring",
    "storm-thread",
    "iron-fan",
    "oath-echo",
    "briar-edge",
  ]) {
    const frame = await page.evaluate(
      (skill) =>
        new Promise((resolve) => {
          function capture() {
            const state = window.hollowbaneSkills,
              event = state?.events.find(
                (e) =>
                  e.actor === 0 && e.skill === skill && e.kind === "effect",
              );
            if (
              event &&
              state.tick - event.tick >= (skill === "ember-lance" ? 0 : 4)
            ) {
              document.querySelector("#combat-pause").click();
              resolve({
                skill,
                tick: state.tick,
                effectTick: event.tick,
                phase: window.hollowbaneCombat.actors[0].phase,
                mana: state.users[0].mana,
              });
            } else requestAnimationFrame(capture);
          }
          requestAnimationFrame(capture);
        }),
      skill,
    );
    await page.waitForFunction(
      (phase) =>
        document.querySelector("#skill-resource").textContent.includes(phase),
      frame.phase,
    );
    const png = await page.screenshot();
    await sharp(png)
      .resize(960, 600)
      .webp({ quality: 85 })
      .toFile(`.local/polish-showcase/${skill}.webp`);
    frames.push(frame);
    await page.evaluate(() => document.querySelector("#combat-pause").click());
    await page.locator("#combat-world").focus();
  }
  await writeFile(
    ".local/polish-showcase/frames.json",
    JSON.stringify(
      {
        method:
          "Actual live showcase; pause at Ember release or four ticks after other deterministic effect events; wait for HUD phase to reflect frozen simulation, capture without injected visual state. Original scene/UI, no external image assets. Images resized to 960x600 WebP for review.",
        frames,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(frames);
} finally {
  await browser.close();
}
