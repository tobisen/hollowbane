import { expect, type Page } from "@playwright/test";
/** Drive real virtual-controller input along the published navigation route. */
export async function walkEnvironmentExit(
  page: Page,
  source: string,
  exit: string,
): Promise<void> {
  const route = await page.evaluate((id) => {
    const w = window.hollowbaneWorld!;
    let from = w.position;
    const result: { x: number; y: number }[] = [];
    for (const to of w.routeToExit!(id)) {
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.5);
      for (let i = 1; i <= steps; i++)
        result.push({
          x: from.x + ((to.x - from.x) * i) / steps,
          y: from.y + ((to.y - from.y) * i) / steps,
        });
      from = to;
    }
    return result;
  }, exit);
  expect(route.length).toBeGreaterThan(0);
  for (const point of route) {
    await expect
      .poll(
        () =>
          page.evaluate(
            ({ p, source }) => {
              const w = window.hollowbaneWorld!,
                dx = p.x - w.position.x,
                dy = p.y - w.position.y;
              if (w.area !== source || Math.hypot(dx, dy) < 0.08) {
                window.virtualPads[0]!.axes = [0, 0, 0, 0];
                return true;
              }
              const sx = dx - dy,
                sy = (dx + dy) / 2,
                length = Math.hypot(sx, sy),
                scale = Math.min(1, Math.hypot(dx, dy) * 4);
              window.virtualPads[0]!.axes = [
                (sx / length) * scale,
                (sy / length) * scale,
                0,
                0,
              ];
              return false;
            },
            { p: point, source },
          ),
        { timeout: 15000, intervals: [30] },
      )
      .toBe(true);
    if ((await page.evaluate(() => window.hollowbaneWorld!.area)) !== source)
      break;
  }
}
