import { expect, test } from "@playwright/test";
for (const engine of ["3", "4"]) {
  test(`Phaser ${engine} renders and honors pause`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`?engine=${engine}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-engine-ready",
      engine,
    );
    await expect(page.locator("canvas")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#metrics")).toContainText(`Phaser ${engine}.`);
    await expect(page.locator("#game")).toHaveScreenshot(
      `courtyard-phaser-${engine}.png`,
      { maxDiffPixelRatio: 0.01 },
    );
    await page.getByRole("button", { name: "Resume motion" }).click();
    await expect(
      page.getByRole("button", { name: "Pause motion" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(errors).toEqual([]);
  });
}
