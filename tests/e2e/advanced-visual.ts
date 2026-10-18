import { expect, type Locator, type TestInfo } from "@playwright/test";
/** Reviewed platform-specific references; missing coverage fails explicitly. */
export async function advancedReference(
  locator: Locator,
  name: string,
  info: TestInfo,
) {
  await expect(locator).toHaveScreenshot(
    `${name}-${info.project.name || "chromium"}-${process.platform}.png`,
    { maxDiffPixelRatio: 0.005 },
  );
}
