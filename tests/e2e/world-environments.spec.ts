import { expect, test } from "@playwright/test";
test("Ashen Refuge scenery preserves spawn, mouse travel and return", async ({
  page,
}) => {
  await page.goto("?world=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
    .toBe("ashen-refuge");
  expect(await page.evaluate(() => window.hollowbaneWorld!.fingerprint)).toBe(
    "c6920a7c",
  );
  await page.screenshot({ path: "test-results/w3-ashen-refuge.png" });
  for (const area of ["haunted-forest", "ashen-refuge"]) {
    const target = await page.evaluate(() => {
      const world = window.hollowbaneWorld!,
        p = world.exits[0]!,
        c = world.camera;
      return { x: (p.x - c.x) * c.zoom, y: (p.y - c.y) * c.zoom };
    });
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.area), {
        timeout: 15000,
      })
      .toBe(area);
  }
});

test("Haunted Forest environment preserves generated arrival and mouse return", async ({
  page,
}) => {
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  for (const area of ["haunted-forest", "ashen-refuge"]) {
    const target = await page.evaluate(() => {
      const w = window.hollowbaneWorld!,
        p = w.exits[0]!,
        c = w.camera;
      return { x: (p.x - c.x) * c.zoom, y: (p.y - c.y) * c.zoom };
    });
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.area), {
        timeout: 20000,
      })
      .toBe(area);
    if (area === "haunted-forest") {
      expect(
        await page.evaluate(() => window.hollowbaneWorld!.fingerprint),
      ).toBe("323b57eb");
      await page.screenshot({ path: "test-results/w3-haunted-forest.png" });
    }
  }
});
