import { test, expect, type Page } from "@playwright/test";
async function ready(page: Page, query = "&training=1") {
  await page.goto("./?loot=1" + query);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.seed))
    .toBe(42);
  await page.locator(".arena-panel summary").click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
  await page.locator("#combat-world").focus();
}
async function replay(page: Page, seq: number) {
  if (
    (await page.locator(".loot-panel > details").getAttribute("open")) === null
  )
    await page.locator(".loot-panel > details > summary").click();
  const before = await page.evaluate(() => window.hollowbaneLoot!.drops.length);
  await page.locator("#loot-sequence").fill(String(seq));
  await page.locator("#loot-test").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot!.drops.length))
    .toBe(before + 1);
}
async function point(page: Page, x: number, y: number) {
  return page.evaluate(
    ({ x, y }) => {
      const r = document.querySelector("canvas")!.getBoundingClientRect(),
        v = window.hollowbaneCombat!.view;
      return {
        x: r.x + ((x - v.x) / v.width) * r.width,
        y: r.y + ((y - v.y) / v.height) * r.height,
      };
    },
    { x, y },
  );
}
test("monster death produces exactly one deterministic natural drop", async ({
  page,
}) => {
  await ready(page, "");
  const a = await page.evaluate(() => window.hollowbaneCombat!.actors[1]!);
  const p = await point(page, a.x, a.y - 28);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 15000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot!.attempts))
    .toBe(1);
  await expect(page.locator(".loot-label")).toHaveCount(1);
  expect(
    await page.evaluate(() => window.hollowbaneLoot!.drops[0]?.source),
  ).toBe(1);
  await page.locator("#combat-pause").click();
  expect(await page.evaluate(() => window.hollowbaneLoot!.sequence)).toBe(1);
});
test("inspection identification archive and corrupted load preserve generated items", async ({
  page,
}) => {
  await ready(page);
  await replay(page, 1);
  await expect(page.locator("#loot-info")).toContainText("Unidentified");
  await page.locator("#loot-identify").click();
  await expect(page.locator("#loot-info")).toContainText("Emberward Iron Cap");
  await expect(page.locator("#loot-info")).toContainText("fireResistance");
  await page.locator("#loot-save").click();
  const saved = await page.evaluate(() =>
    localStorage.getItem("hollowbane.l1.items"),
  );
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneLoot?.drops.length))
    .toBe(0);
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-load").click();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneLoot!.drops[0]?.identified),
    )
    .toBe(true);
  await page.evaluate(() =>
    localStorage.setItem("hollowbane.l1.items", '{"schema":999}'),
  );
  await page.locator("#loot-load").click();
  await expect(page.locator("#loot-message")).toContainText("world retained");
  expect(await page.evaluate(() => window.hollowbaneLoot!.drops.length)).toBe(
    1,
  );
  expect(saved).toContain("emberward");
});
for (const id of ["Xbox virtual standard", "Wireless Controller"])
  test(`${id} selects and inspects ground loot through semantic controls`, async ({
    page,
  }) => {
    await page.addInitScript((id) => {
      const pad = {
        index: 0,
        id,
        mapping: "standard",
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        timestamp: 0,
      };
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [pad],
        configurable: true,
      });
      (window as unknown as { lootPad: typeof pad }).lootPad = pad;
    }, id);
    await ready(page);
    await replay(page, 1);
    await replay(page, 37);
    const selected = await page.evaluate(() => window.hollowbaneLoot!.selected);
    await page.locator("#combat-world").focus();
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.armed))
      .toBe(true);
    const press = async (index: number, held: boolean) => {
      await page.evaluate(
        ({ index, held }) => {
          const p = (
            window as unknown as {
              lootPad: {
                buttons: {
                  pressed: boolean;
                  touched: boolean;
                  value: number;
                }[];
              };
            }
          ).lootPad;
          p.buttons[index] = {
            pressed: held,
            touched: held,
            value: Number(held),
          };
        },
        { index, held },
      );
    };
    await press(13, true);
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneInput?.device))
      .toBe("gamepad");
    await expect
      .poll(() => page.evaluate(() => window.hollowbaneLoot!.selected))
      .not.toBe(selected);
    await press(13, false);
    await press(0, true);
    await expect(page.locator("#loot-message")).toContainText(
      "Inspecting ground item",
    );
    await press(0, false);
    await expect(page.locator("#loot-help")).toContainText(
      id.startsWith("Xbox") ? "A: inspect" : "Cross: inspect",
    );
    expect(
      await page.evaluate(
        () =>
          window.hollowbaneSkills?.events.filter(
            (e) => e.kind === "start" && e.actor === 0,
          ).length,
      ),
    ).toBe(0);
  });
test("loot labels and inspection retain their visual reference", async ({
  page,
}) => {
  await ready(page);
  await replay(page, 35078);
  await page.locator("#loot-identify").click();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#combat-pause").click();
  await expect(page).toHaveScreenshot("l1-loot.png", {
    maxDiffPixelRatio: 0.01,
    mask: [
      page.locator(".arena-header"),
      page.locator(".arena-panel"),
      page.locator(".skill-bar"),
      page.locator("#loot-help"),
    ],
  });
});

test("multiple labels avoid overlap and duplicate replay preserves identities", async ({
  page,
}) => {
  await ready(page);
  for (const seq of [0, 1, 37, 35078]) await replay(page, seq);
  const boxes = await page.locator(".loot-label").evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  expect(boxes).toHaveLength(4);
  const panel = await page.locator(".loot-panel").boundingBox(),
    nav = await page.locator(".polish-navigation").boundingBox();
  expect(panel!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!,
        b = boxes[j]!;
      expect(
        a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y,
      ).toBe(true);
    }
  await page.locator("#loot-test").click();
  await expect(page.locator("#loot-message")).toContainText("Duplicate");
  expect(await page.evaluate(() => window.hollowbaneLoot!.drops.length)).toBe(
    4,
  );
});
