import { expect, test } from "@playwright/test";
for (const engine of ["3", "4"])
  test(`engine ${engine} exposes real presentation diagnostics`, async ({
    page,
  }, testInfo) => {
    await page.goto(`?engine=${engine}&metrics=1`);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneDiagnostics?.samples ?? 0),
      )
      .toBeGreaterThan(60);
    const metrics = await page.evaluate(() => window.hollowbaneDiagnostics);
    expect(metrics?.engine.startsWith(`${engine}.`)).toBe(true);
    expect(metrics?.readyMs).toBeGreaterThan(0);
    expect(metrics?.p95FrameMs).toBeGreaterThan(0);
    if (metrics?.renderer === "WebGL")
      expect(metrics.drawCalls).toBeGreaterThan(0);
    await testInfo.attach(`phaser-${engine}-metrics`, {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
  });
