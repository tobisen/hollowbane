/* global window */
import { firefox, webkit, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const url = process.argv[2] ?? "http://127.0.0.1:4173/hollowbane/?metrics=1";
const results = [];
for (const [name, type] of [
  ["firefox", firefox],
  ["webkit", webkit],
]) {
  let browser;
  try {
    browser = await type.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(url);
    expect(response.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute(
      "data-prototype-ready",
      "true",
    );
    await page.locator("#world").focus();
    await page.keyboard.down("d");
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype?.walking))
      .toBe(true);
    await page.keyboard.up("d");
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype?.walking))
      .toBe(false);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect
      .poll(() => page.evaluate(() => window.hollowbanePrototype.zoom))
      .toBeGreaterThan(1.2);
    expect(errors).toEqual([]);
    results.push({
      browser: name,
      version: browser.version(),
      status: response.status(),
      errors,
      state: await page.evaluate(() => window.hollowbanePrototype),
      metrics: await page.evaluate(() => window.hollowbaneDiagnostics),
    });
  } catch (error) {
    results.push({ browser: name, error: String(error) });
  } finally {
    await browser?.close();
  }
}
await mkdir(".local", { recursive: true });
await writeFile(
  ".local/browser-smoke.json",
  JSON.stringify(results, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    results.map((r) => ({
      browser: r.browser,
      version: r.version,
      status: r.status,
      error: r.error,
      renderer: r.metrics?.renderer,
    })),
  ),
);
if (results.some((r) => r.error)) process.exitCode = 1;
