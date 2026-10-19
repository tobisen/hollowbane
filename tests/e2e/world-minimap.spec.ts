import { expect, test } from "@playwright/test";
import { readWorldCheckpoint } from "./world-checkpoint";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
for (const [area, exit] of [
  ["haunted-forest", "camp"],
  ["forgotten-graveyard", "forest"],
  ["ancient-crypt", "graveyard"],
] as const)
  test(`${area}: minimap reveals movement, toggles without modal capture and restores atomic discovery`, async ({
    page,
  }) => {
    await installVirtualController(page, "Xbox 360 Controller");
    await page.goto(`?world=1&developer=1&worldArea=${area}&worldSeed=42`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    const map = page.locator(".world-minimap canvas"),
      toggle = page.locator(".world-minimap button");
    await expect(map).toBeVisible();
    const initial = Number(await map.getAttribute("data-explored"));
    expect(initial).toBeGreaterThan(0);
    const fingerprint = await map.getAttribute("data-fingerprint");
    await page.locator("#combat-world").focus();
    await page.keyboard.press("Tab");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await pressVirtualButton(page, 8);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator("#combat-world")).toBeFocused();
    const target = await page.evaluate((exit) => {
      const w = window.hollowbaneWorld!,
        path = w.routeToExit!(exit),
        from = w.position;
      const to =
        path.find((p) => Math.hypot(p.x - from.x, p.y - from.y) > 2) ??
        path[0]!;
      const distance = Math.hypot(to.x - from.x, to.y - from.y),
        fraction = Math.min(1, 3 / distance),
        p = {
          x: from.x + (to.x - from.x) * fraction,
          y: from.y + (to.y - from.y) * fraction,
        },
        c = w.camera;
      return {
        x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
        y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
      };
    }, exit);
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(async () => Number(await map.getAttribute("data-explored")), {
        timeout: 10000,
      })
      .toBeGreaterThan(initial);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneWorld!.walking))
      .toBe(false);
    const count = await map.getAttribute("data-explored");
    await page.locator("#inventory-open").click();
    await page.locator("#inventory-save").click();
    await expect(page.locator("#inventory-status")).toHaveText(
      "Character checkpoint saved locally.",
    );
    const saved = await readWorldCheckpoint(page, area);
    expect(saved.exploration!.seed).toBe(42);
    expect(saved.exploration!.contentVersion).toBe(2);
    const discovery = saved.exploration!.areas.find(
      (a) => a.id === area,
    )!.discovery!;
    expect(discovery.fingerprint).toBe(fingerprint);
    expect(discovery.cells).toHaveLength(Number(count));
    await page.reload();
    await expect(map).toHaveAttribute("data-explored", count!);
    await expect(map).toHaveAttribute("data-fingerprint", fingerprint!);
    await page.screenshot({ path: `test-results/d00-minimap-${area}.png` });
  });
