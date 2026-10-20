import { expect, test, type Page } from "@playwright/test";
import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { saveWorldCheckpoint, readWorldCheckpoint } from "./world-checkpoint";

/** End a navigation tap when the real dialog consumes it, independent of RAF speed. */
async function dialogueDirection(page: Page, index: 12 | 13) {
  await page.evaluate((index) => {
    const dialog = document.querySelector("#camp-dialogue")!;
    dialog.addEventListener(
      "focusin",
      () => {
        window.virtualPads[0]!.buttons[index] = {
          pressed: false,
          touched: false,
          value: 0,
        };
      },
      { once: true },
    );
    window.virtualPads[0]!.buttons[index] = {
      pressed: true,
      touched: true,
      value: 1,
    };
  }, index);
}

async function walkNpc(page: Page, id: string, mouse = false) {
  await expect
    .poll(() => page.evaluate(() => !!window.hollowbaneWorld?.routeToNpc))
    .toBe(true);
  if (!mouse) {
    await page.evaluate(() => {
      window.virtualPads[0]!.axes = [0, 0, 0, 0];
    });
    await expect
      .poll(() => page.evaluate(() => !!window.hollowbaneInput?.armed))
      .toBe(true);
  }
  const goal = await page.evaluate((id) => {
    const w = window.hollowbaneWorld!,
      target = w.routeToNpc!(id).at(-1)!;
    const dx = w.position.x - target.x,
      dy = w.position.y - target.y,
      d = Math.hypot(dx, dy);
    return { x: target.x + (dx / d) * 0.85, y: target.y + (dy / d) * 0.85 };
  }, id);
  if (mouse) {
    const target = await page.evaluate((p) => {
      const c = window.hollowbaneWorld!.camera;
      return {
        x: (768 + (p.x - p.y) * 64 - c.x) * c.zoom,
        y: (512 + (p.x + p.y) * 32 - c.y) * c.zoom,
      };
    }, goal);
    await page.locator("#combat-world").click({ position: target });
    await expect
      .poll(() =>
        page.evaluate((p) => {
          const w = window.hollowbaneWorld!;
          return (
            !w.walking &&
            Math.hypot(w.position.x - p.x, w.position.y - p.y) < 0.2
          );
        }, goal),
      )
      .toBe(true);
  } else {
    await expect
      .poll(
        () =>
          page.evaluate((p) => {
            const w = window.hollowbaneWorld!,
              dx = p.x - w.position.x,
              dy = p.y - w.position.y,
              d = Math.hypot(dx, dy);
            if (d < 0.12) {
              window.virtualPads[0]!.axes = [0, 0, 0, 0];
              return true;
            }
            const sx = dx - dy,
              sy = (dx + dy) / 2,
              length = Math.hypot(sx, sy),
              scale = Math.min(1, d * 4);
            window.virtualPads[0]!.axes = [
              (sx / length) * scale,
              (sy / length) * scale,
              0,
              0,
            ];
            return false;
          }, goal),
        { timeout: 10000, intervals: [30] },
      )
      .toBe(true);
  }
  await expect(page.locator("#camp-talk")).toHaveAttribute("data-npc", id);
  await expect(page.locator("#camp-talk")).toBeVisible();
}

test("camp NPC dialogue uses real mouse keyboard and controller input, restores focus and persists greetings", async ({
  page,
}) => {
  await installVirtualController(page, "Xbox 360 Controller");
  await page.goto("?world=1&developer=1&worldSeed=42");
  await expect(page.locator("#inventory-status")).toHaveText(
    "Ready · no character checkpoint yet.",
  );
  await expect(page.locator("#inventory-dialog")).not.toBeVisible();
  await expect(page.locator("#camp-talk")).not.toBeVisible();
  await walkNpc(page, "edda-vey", true);
  await page.screenshot({ path: "test-results/d04-camp-npcs.png" });
  await page.locator("#camp-talk").click();
  const dialogue = page.getByRole("dialog", { name: "Edda Vey", exact: true });
  await expect(dialogue).toBeVisible();
  await expect(page.locator("#camp-speech")).toContainText("Another traveller");
  await expect(
    page.getByRole("button", {
      name: "Tell me about the refuge.",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("button", { name: "I should keep moving.", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.locator("#camp-speech")).toContainText(
    "Ashen Refuge was a watch post",
  );
  await page.screenshot({ path: "test-results/d04-edda-dialogue.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator("#camp-dialogue")).not.toBeVisible();
  await expect(page.locator("#combat-world")).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speech")).toContainText(
    "Your lantern is still burning",
  );
  await expect(page.locator(".camp-dialogue-help")).toContainText("B: Back");
  const held = await page.evaluate(() => {
    window.virtualPads[0]!.axes = [1, 0, 0, 0];
    return {
      p: window.hollowbaneWorld!.position,
      samples: window.hollowbaneInput!.samples,
    };
  });
  await expect
    .poll(() =>
      page.evaluate(
        (previous) => window.hollowbaneInput!.samples >= previous + 10,
        held.samples,
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => window.hollowbaneWorld!.position)).toEqual(
    held.p,
  );
  await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
  });
  await pressVirtualButton(page, 1);
  await expect(page.locator("#camp-dialogue")).not.toBeVisible();
  await expect(page.locator("#combat-world")).toBeFocused();
  await walkNpc(page, "orren-thale");
  await pressVirtualButton(page, 0);
  await expect(
    page.getByRole("dialog", { name: "Orren Thale", exact: true }),
  ).toBeVisible();
  await dialogueDirection(page, 13);
  await expect(
    page.getByRole("button", {
      name: "We will speak another time.",
      exact: true,
    }),
  ).toBeFocused();
  await dialogueDirection(page, 12);
  await expect(
    page.getByRole("button", {
      name: "What lies beyond the forest?",
      exact: true,
    }),
  ).toBeFocused();
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speech")).toContainText(
    "Follow the forest trail",
  );
  await pressVirtualButton(page, 0);
  await expect(page.locator("#camp-speech")).toContainText(
    "old light in the far chamber",
  );
  await pressVirtualButton(page, 1);
  await saveWorldCheckpoint(page);
  const saved = await readWorldCheckpoint(page, "ashen-refuge");
  expect(saved.exploration!.version).toBe(6);
  expect(saved.exploration!.quests).toEqual({
    version: 1,
    tracked: null,
    entries: [],
  });
  expect(saved.exploration!.dialogue).toEqual({
    version: 1,
    met: ["edda-vey", "orren-thale"],
  });
  expect(saved.exploration!.expedition!.stage).toBe("ready");
  expect(saved.progression!.character.totalXp).toBe(0);
  expect(saved.exploration!.containers!.gold).toBe(0);
  expect(saved.loot.sequence).toBe(0);
  await page.reload();
  await expect(page.locator("#inventory-status")).toHaveText(
    "Character checkpoint restored.",
  );
  await page.locator("#combat-world").focus();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("dialog", { name: "Orren Thale", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#camp-speech")).toContainText("A returning face");
  await page.screenshot({ path: "test-results/d04-orren-reloaded.png" });
  await page
    .getByRole("button", { name: "End conversation", exact: true })
    .click();
  await expect(page.locator("#combat-world")).toBeFocused();
});
