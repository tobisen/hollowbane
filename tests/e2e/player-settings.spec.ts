import { expect, test, type Page } from "@playwright/test";
import { characterApi } from "../fixtures/character-api";
import { characterSlotFixture } from "../fixtures/character-slot";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";

async function ready(page: Page) {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
}
async function frames(page: Page, n = 12) {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = () => {
          if (--n <= 0) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    n,
  );
}
async function position(page: Page) {
  return page.evaluate(() => ({ ...window.hollowbaneWorld!.position }));
}
async function owners(page: Page) {
  await characterApi(page);
  return page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      return await Promise.all(
        (await s.list()).characters.map(async (m) => {
          const r = await s.load(m.id);
          if (r.kind !== "valid") throw Error("Invalid fixture");
          return {
            id: m.id,
            revision: m.revision,
            text: window.characterStorageModule.serializeCharacter(r.session),
          };
        }),
      );
    } finally {
      s.close();
    }
  });
}

test("shared settings persist independently, apply live graphics/audio/keyboard and reuse fullscreen while paused", async ({
  page,
}) => {
  await ready(page);
  await characterApi(page);
  const id = await page.evaluate(async (text) => {
    const s = new window.characterStorageModule.CharacterStorage();
    try {
      return (
        await s.create(
          "Settings journey",
          window.characterStorageModule.deserializeCharacter(text),
        )
      ).id;
    } finally {
      s.close();
    }
  }, serializeCharacter(characterSlotFixture()));
  await page.locator("#menu-settings").click();
  await expect(page.locator("#player-fullscreen")).toBeDisabled();
  await page.locator("#player-quality").selectOption("full");
  await page.locator("#player-volume").fill("35");
  await page.locator("#player-muted").check();
  await page.locator("#player-presentation-save").click();
  await expect(page.locator("#player-presentation-status")).toHaveText(
    "Graphics and sound settings saved.",
  );
  await page.locator("#player-key-east").selectOption("KeyE");
  await page.locator("#player-keyboard-save").click();
  await expect(page.locator("#player-keyboard-status")).toContainText(
    "Reserved gameplay key",
  );
  await page.locator("#player-key-east").selectOption("KeyZ");
  await page.locator("#player-key-toggleRun").selectOption("KeyG");
  await page.locator("#player-key-stop").selectOption("KeyB");
  await page.locator("#player-keyboard-save").click();
  await expect(page.locator("#player-keyboard-status")).toContainText(
    "Keyboard controls saved",
  );
  await page.locator("#player-keyboard-form").scrollIntoViewIfNeeded();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-c-keyboard-settings.png",
  });
  await page.locator("#pad-move-deadzone").fill("0.28");
  await page.locator("#pad-bind-primary").selectOption("16");
  await page.locator("#pad-save").click();
  await expect(page.locator("#pad-error")).toHaveText(
    "Controller settings saved.",
  );
  await page.locator("#menu-settings-dialog [data-menu-back]").click();
  await expect(page.locator("#menu-settings")).toBeFocused();
  await page.goto(`?world=1&character=${id}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish?.audio))
    .toMatchObject({ muted: true, volume: 0.35 });
  await expect(page.locator("#combat-world canvas")).toHaveAttribute(
    "width",
    "1280",
  );
  await page.locator("#combat-world").focus();
  const start = await position(page);
  await page.keyboard.down("d");
  await frames(page);
  await page.keyboard.up("d");
  expect(await position(page)).toEqual(start);
  await page.keyboard.down("z");
  await expect
    .poll(async () =>
      Math.hypot(
        (await position(page)).x - start.x,
        (await position(page)).y - start.y,
      ),
    )
    .toBeGreaterThan(0.5);
  await page.keyboard.press("b");
  const stopped = await position(page);
  await frames(page);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up("z");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () =>
      Math.hypot(
        (await position(page)).x - stopped.x,
        (await position(page)).y - stopped.y,
      ),
    )
    .toBeGreaterThan(0.3);
  await page.keyboard.up("ArrowRight");
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint saved locally.",
  );
  await page.locator("#inventory-close").click();
  await page.locator("#player-pause-open").click();
  await page.locator("#player-settings").click();
  const before = await owners(page);
  const tick = await page.evaluate(() => window.hollowbaneCombat!.tick);
  await expect(page.locator("#player-key-east")).toHaveValue("KeyZ");
  await expect(page.locator("#pad-move-deadzone")).toHaveValue("0.28");
  await expect(page.locator("#pad-bind-primary")).toHaveValue("16");
  await page.locator("#player-quality").selectOption("balanced");
  await page.locator("#player-volume").fill("65");
  await page.locator("#player-muted").uncheck();
  await page.locator("#player-presentation-save").click();
  await expect(page.locator("#combat-world canvas")).toHaveAttribute(
    "width",
    "960",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish?.audio))
    .toMatchObject({ muted: false, volume: 0.65 });
  await frames(page);
  expect(await page.evaluate(() => window.hollowbaneCombat!.tick)).toBe(tick);
  expect(await owners(page)).toEqual(before);
  await page.locator("#player-presentation-form").scrollIntoViewIfNeeded();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-c-pause-settings.png",
  });
  await page.locator("#player-fullscreen").click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  await expect(page.locator("#player-fullscreen")).toBeEnabled();
  await expect(page.locator("#player-fullscreen")).toHaveText(
    "Exit fullscreen",
  );
  await page.locator("#player-fullscreen").click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(false);
  await expect(page.locator("#player-pause-dialog")).toBeVisible();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "hollowbane.presentation.v1")
        throw new DOMException(
          "Test storage unavailable",
          "QuotaExceededError",
        );
      return original.call(this, key, value);
    };
    (window as unknown as { restoreSetting: () => void }).restoreSetting = () =>
      (Storage.prototype.setItem = original);
  });
  await page.locator("#player-volume").fill("70");
  await page.locator("#player-presentation-save").click();
  await expect(page.locator("#player-presentation-status")).toContainText(
    "for this page",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbanePolish?.audio.volume))
    .toBe(0.7);
  expect(await owners(page)).toEqual(before);
  await page.evaluate(() =>
    (window as unknown as { restoreSetting: () => void }).restoreSetting(),
  );
  await page.locator("#player-volume").fill("65");
  await page.locator("#player-presentation-save").click();
  await page.locator("#player-settings-back").click();
  await page.locator("#player-save-exit").click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-ready", "true");
  await page.locator("#menu-settings").click();
  await expect(page.locator("#player-quality")).toHaveValue("balanced");
  await expect(page.locator("#player-volume")).toHaveValue("65");
  await expect(page.locator("#player-key-east")).toHaveValue("KeyZ");
  await expect(page.locator("#pad-bind-primary")).toHaveValue("16");
});

test("virtual settings navigation adjusts native controls, returns to its origin and survives reload at narrow width", async ({
  page,
}) => {
  await installVirtualController(
    page,
    "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)",
  );
  await page.setViewportSize({ width: 760, height: 800 });
  await ready(page);
  await page.locator("#menu-settings").click();
  await expect(
    page.locator("#menu-settings-dialog [data-menu-back]"),
  ).toBeFocused();
  await pressVirtualButton(page, 13);
  await expect(page.locator("#player-quality")).toBeFocused();
  await pressVirtualButton(page, 15);
  await expect(page.locator("#player-quality")).toHaveValue("balanced");
  await pressVirtualButton(page, 13);
  await expect(page.locator("#player-volume")).toBeFocused();
  await pressVirtualButton(page, 14);
  await expect(page.locator("#player-volume")).toHaveValue("95");
  await page.locator("#player-presentation-save").focus();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#player-presentation-status")).toHaveText(
    "Graphics and sound settings saved.",
  );
  await pressVirtualButton(page, 1);
  await expect(page.locator("#menu-settings-dialog")).not.toBeVisible();
  await expect(page.locator("#menu-settings")).toBeFocused();
  await page.reload();
  await page.locator("#menu-settings").click();
  await expect(page.locator("#player-quality")).toHaveValue("balanced");
  await expect(page.locator("#player-volume")).toHaveValue("95");
  await expect(page.locator("#menu-settings-dialog")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("#menu-settings-dialog").evaluate((e) => e.clientWidth),
  );
  await page.screenshot({
    animations: "disabled",
    path: "test-results/m2-c-main-settings-760.png",
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-settings")).toBeFocused();
});
