import { expect, test } from "@playwright/test";
test("all eight directions are inspectable and animation can be paused", async ({
  page,
}) => {
  await page.goto("?gallery=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-gallery-ready",
    "true",
  );
  await expect(page.locator("#direction-gallery canvas")).toHaveCount(8);
  await expect(page.locator("#direction-gallery")).toHaveScreenshot(
    "wanderer-directions.png",
    { maxDiffPixelRatio: 0.01 },
  );
  await page.getByRole("button", { name: "Play walk cycle" }).click();
  await expect(
    page.getByRole("button", { name: "Pause walk cycle" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Pause walk cycle" }).click();
  await expect(
    page.getByRole("button", { name: "Play walk cycle" }),
  ).toHaveAttribute("aria-pressed", "false");
});
