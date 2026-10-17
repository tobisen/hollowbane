/* global window */
import { chromium } from "@playwright/test";
import sharp from "sharp";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await page.goto(
    new URL(
      "?loot=1&training=1",
      process.argv[2] ?? "http://127.0.0.1:4174/hollowbane/",
    ).href,
  );
  await page.waitForFunction(() => window.hollowbaneLoot?.seed === 42);
  await page.locator(".arena-panel summary").click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("35078");
  await page.locator("#loot-test").click();
  await page.locator("#loot-identify").click();
  await page.waitForFunction(() => window.hollowbaneLoot?.drops[0]?.identified);
  await page.locator("#combat-pause").click();
  await page.locator(".arena-panel summary").click();
  await page.locator(".loot-panel > details > summary").click();
  await sharp(await page.screenshot())
    .resize(960, 600)
    .webp({ quality: 88 })
    .toFile("docs/loot/showcase.webp");
  console.log(
    "Original scene, explicit seed42 sequence35078 level12 replay; actual Last Coal identification, no injected visuals.",
  );
} finally {
  await browser.close();
}
