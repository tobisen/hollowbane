import { expect, type Page } from "@playwright/test";
/** Browser API emulation only; never physical-controller evidence. */
export async function installVirtualController(page: Page, id: string) {
  await page.addInitScript((id) => {
    window.virtualPads = [
      {
        id,
        index: 0,
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        timestamp: 0,
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
      },
    ];
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => window.virtualPads,
    });
  }, id);
}
export async function pressVirtualButton(page: Page, index: number) {
  const samples = await page.evaluate(
    () => window.hollowbaneInput?.samples ?? 0,
  );
  await expect
    .poll(() =>
      page.evaluate(
        (previous) =>
          !!window.hollowbaneInput?.armed &&
          window.hollowbaneInput.samples > previous,
        samples,
      ),
    )
    .toBe(true);
  for (const value of [1, 0])
    await page.evaluate(
      async ({ index, value }) => {
        window.virtualPads[0]!.buttons[index] = {
          pressed: !!value,
          touched: !!value,
          value,
        };
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        );
      },
      { index, value },
    );
}
