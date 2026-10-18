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
export async function pressVirtualButton(
  page: Page,
  index: number,
  holdFrames = 3,
) {
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
      async ({ index, value, frames, holdFrames }) => {
        window.virtualPads[0]!.buttons[index] = {
          pressed: !!value,
          touched: !!value,
          value,
        };
        // A navigation tap ends when the UI consumes it. Three slow CI RAFs
        // can exceed the real 400 ms repeat threshold and are not a short tap.
        const directions: Record<number, string> = {
          12: "up",
          13: "down",
          14: "left",
          15: "right",
        };
        const releaseTap = (event: Event) => {
          if (
            value &&
            holdFrames === 3 &&
            (event as CustomEvent<string>).detail === directions[index]
          )
            window.virtualPads[0]!.buttons[index] = {
              pressed: false,
              touched: false,
              value: 0,
            };
        };
        window.addEventListener(
          "hollowbane-inventory-action",
          releaseTap,
          true,
        );
        try {
          for (let frame = 0; frame < frames; frame++)
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
        } finally {
          window.removeEventListener(
            "hollowbane-inventory-action",
            releaseTap,
            true,
          );
        }
      },
      { index, value, frames: value ? holdFrames : 3, holdFrames },
    );
}
