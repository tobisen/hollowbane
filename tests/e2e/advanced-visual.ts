import { expect, type Locator, type TestInfo } from "@playwright/test";
/** Functional scenarios always run; unavailable platform references are explicit exceptions. */
export async function advancedReference(
  locator: Locator,
  name: string,
  info: TestInfo,
) {
  if (process.platform !== "darwin") {
    info.annotations.push({
      type: "visual-exception",
      description:
        "DBL-348: reviewed Linux advanced item references pending; functional scenario still runs.",
    });
    return;
  }
  await expect(locator).toHaveScreenshot(
    `${name}-${info.project.name || "chromium"}-${process.platform}.png`,
    { maxDiffPixelRatio: 0.005 },
  );
}
