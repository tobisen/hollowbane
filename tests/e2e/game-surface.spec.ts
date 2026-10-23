import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

declare global {
  interface Window {
    surfaceMenus: { target: string; prevented: boolean }[];
  }
}
async function ready(page: Page, url = "./?polish=1&training=1") {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
}
const active = (page: Page) =>
  page.evaluate(
    () => document.fullscreenElement === document.querySelector("main"),
  );
async function fits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const rect = document.querySelector("canvas")!.getBoundingClientRect();
        const hud = document
          .querySelector(".skill-bar")!
          .getBoundingClientRect();
        const fit =
          Math.abs(rect.width - innerWidth) < 2 &&
          Math.abs(rect.height - innerHeight) < 2 &&
          Math.abs(rect.width / rect.height - innerWidth / innerHeight) <
            0.01 &&
          Math.abs(
            rect.width / rect.height -
              document.querySelector("canvas")!.width /
                document.querySelector("canvas")!.height,
          ) < 0.01 &&
          hud.left >= 0 &&
          hud.right <= innerWidth &&
          hud.top >= 0 &&
          hud.bottom <= innerHeight;
        return fit
          ? "fits"
          : JSON.stringify({
              canvas: rect.toJSON(),
              hud: hud.toJSON(),
              viewport: [innerWidth, innerHeight],
              buffer: [
                document.querySelector("canvas")!.width,
                document.querySelector("canvas")!.height,
              ],
              metrics: window.hollowbaneCombat?.metrics,
            });
      }),
    )
    .toBe("fits");
}

test("fullscreen uses real user activation, keeps HUD and controller overlays, resizes and toggles off", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await ready(page);
  await page.locator(".arena-panel summary").click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator(".arena-panel summary").click();
  const enter = page.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await expect(enter).toBeVisible();
  await expect(enter).toHaveAttribute("aria-pressed", "false");
  await page.setViewportSize({ width: 1100, height: 760 });
  await fits(page);
  await enter.click(); // Native requestFullscreen, no API/activation stub.
  await expect.poll(() => active(page)).toBe(true);
  const exit = page.getByRole("button", {
    name: "Exit fullscreen",
    exact: true,
  });
  await expect(exit).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-fullscreen-icon="exit"]')).toBeVisible();
  await fits(page);
  await page.keyboard.press("F2");
  await expect(page.locator("#controller-menu")).toBeVisible();
  expect(
    await page
      .locator("#controller-menu")
      .evaluate((el) => document.fullscreenElement!.contains(el)),
  ).toBe(true);
  await page.keyboard.press("F2");
  await expect(page.locator("#combat-world")).toBeFocused();
  const before = await page.evaluate(() => window.hollowbaneCombat!.actors[0]!);
  await page.keyboard.down("d");
  try {
    await expect
      .poll(() =>
        page.evaluate(({ x, y }) => {
          const p = window.hollowbaneCombat!.actors[0]!;
          return Math.hypot(p.x - x, p.y - y);
        }, before),
      )
      .toBeGreaterThan(5);
  } finally {
    await page.keyboard.up("d");
  }
  await pressVirtualButton(page, 2);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.actor === 0 && e.kind === "start",
        ),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "test-results/q2-a1-fullscreen.png" });
  await exit.click();
  await expect.poll(() => active(page)).toBe(false);
  await expect(enter).toHaveAttribute("aria-pressed", "false");
  await page.setViewportSize({ width: 1440, height: 900 });
  await fits(page);
});

test("browser Escape exits fullscreen without a new game shortcut", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await expect.poll(() => active(page)).toBe(true);
  await page.keyboard.press("F2");
  await expect(page.locator("#controller-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#controller-menu")).not.toBeVisible();
  expect(await active(page)).toBe(true);
  await page.keyboard.press("Escape");
  await expect.poll(() => active(page)).toBe(false);
  await expect(
    page.getByRole("button", { name: "Enter fullscreen", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("game context menus include loot overlays, preserve right-click casts and leave outside menus native", async ({
  page,
}) => {
  await ready(page, "./?loot=1&training=1");
  await page.locator(".arena-panel summary").click();
  await page.locator("#combat-hostile").uncheck();
  await page.locator(".loot-panel > details > summary").click();
  await page.locator("#loot-sequence").fill("3");
  await page.locator("#loot-test").click();
  const label = page.locator(".loot-label").first();
  await expect(label).toBeVisible();
  await page.evaluate(() => {
    window.surfaceMenus = [];
    document.addEventListener("contextmenu", (event) => {
      const target = event.target as Element;
      window.surfaceMenus.push({
        target: target.closest(".loot-label")
          ? "loot"
          : target.tagName.toLowerCase(),
        prevented: event.defaultPrevented,
      });
    });
  });
  await label.click({ button: "right" });
  expect(await page.evaluate(() => window.surfaceMenus.at(-1))).toEqual({
    target: "loot",
    prevented: true,
  });
  await expect(label).toBeVisible();
  const point = await page.evaluate(() => {
    const view = window.hollowbaneCombat!,
      target = view.actors.find((a) => a.id === 1)!;
    const rect = document.querySelector("canvas")!.getBoundingClientRect();
    return {
      x: rect.x + ((target.x - view.view.x) / view.view.width) * rect.width,
      y:
        rect.y +
        ((target.y - 28 - view.view.y) / view.view.height) * rect.height,
    };
  });
  await page.mouse.click(point.x, point.y, { button: "right" });
  expect(await page.evaluate(() => window.surfaceMenus.at(-1))).toEqual({
    target: "canvas",
    prevented: true,
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.kind === "start" && e.actor === 0,
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some(
          (e) => e.kind === "damage" && e.actor === 0,
        ),
      ),
    )
    .toBe(true);
  // Real left-click inspection remains intact after right-clicking a label.
  await label.click();
  await expect(page.locator("#loot-info")).not.toHaveText("No item selected.");
  await page.evaluate(() => {
    const outside = document.createElement("button");
    outside.id = "outside-game";
    outside.textContent = "Outside game surface";
    outside.style.cssText = "position:fixed;left:5px;top:5px;z-index:30000";
    document.body.append(outside);
  });
  await page.locator("#outside-game").click({ button: "right" });
  expect(await page.evaluate(() => window.surfaceMenus.at(-1))).toEqual({
    target: "button",
    prevented: false,
  });
  await page.keyboard.press("Escape");
});

test("unavailable fullscreen stays visible and safely disabled", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(document, "fullscreenEnabled", { value: false }),
  );
  await ready(page);
  const button = page.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("title", /unavailable/);
});

test("denied fullscreen and fullscreenerror provide feedback without a crash", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Failure-path emulation only. Successful fullscreen tests above use native APIs.
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await ready(page);
  const button = page.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await button.click();
  await expect(page.locator("#fullscreen-status")).toContainText(
    "could not be changed",
  );
  await expect(button).toBeEnabled();
  await page.evaluate(() => {
    document.querySelector("#fullscreen-status")!.textContent = "";
    document
      .querySelector("main")!
      .dispatchEvent(new Event("fullscreenerror", { bubbles: true }));
  });
  await expect(page.locator("#fullscreen-status")).toContainText(
    "could not be changed",
  );
  expect(await active(page)).toBe(false);
  expect(errors).toEqual([]);
});

test("surface listeners are released on pagehide and restored after bfcache pageshow", async ({
  page,
}) => {
  await ready(page);
  const canceled = () =>
    page
      .locator("main")
      .evaluate(
        (el) =>
          !el.dispatchEvent(
            new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
          ),
      );
  expect(await canceled()).toBe(true);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await expect(page.locator("#game-fullscreen")).toHaveCount(0);
  expect(await canceled()).toBe(false);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect(page.locator("#game-fullscreen")).toHaveCount(1);
  expect(await canceled()).toBe(true);
  await page.screenshot({ path: "test-results/q2-a1-windowed.png" });
});

test("cloister uses the same fullscreen control and scoped context menu", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await expect.poll(() => active(page)).toBe(true);
  expect(
    await page
      .locator("main")
      .evaluate(
        (el) =>
          !el.dispatchEvent(
            new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
          ),
      ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/q2-a1-cloister.png" });
  await page
    .getByRole("button", { name: "Exit fullscreen", exact: true })
    .click();
  await expect.poll(() => active(page)).toBe(false);
});
