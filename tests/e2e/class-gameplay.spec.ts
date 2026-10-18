import {
  installVirtualController,
  pressVirtualButton,
} from "./virtual-controller";
import { expect, test } from "@playwright/test";
for (const classId of ["warrior", "sorcerer", "ranger"] as const)
  test(`developer ${classId} combat stays separate from saved progression`, async ({
    page,
  }) => {
    await installVirtualController(
      page,
      classId === "sorcerer"
        ? "Wireless Controller (STANDARD GAMEPAD)"
        : "Xbox 360 Controller",
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(indexedDB, "open", {
        value: () => {
          throw Error("Class laboratory accessed character storage");
        },
      });
    });
    await page.goto(
      `./?developer=1&classLab=${classId}${classId === "warrior" ? "&inventory=1&loot=1&monsters=1" : ""}`,
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-combat-ready",
      "true",
    );
    await expect(page.locator("#inventory-open")).toHaveCount(0);
    await expect(page.locator(".arena-header p")).toContainText(
      "NO PLAYER SAVES",
    );
    await page.locator("#combat-world").focus();
    // Q triggers the second authored class slot: defense, area slow, or piercing shot.
    if (classId === "ranger") {
      await page.locator('[data-skill="1"]').click();
      const view = await page.evaluate(() => window.hollowbaneCombat!);
      const target = view.actors.find((a) => a.id === 3)!,
        bounds = await page.locator("canvas").boundingBox();
      if (!bounds) throw Error("Missing class canvas");
      await page.mouse.click(
        bounds.x + ((target.x - view.view.x) / view.view.width) * bounds.width,
        bounds.y +
          ((target.y - 28 - view.view.y) / view.view.height) * bounds.height,
        { button: "right" },
      );
    } else await page.keyboard.press("q");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.hollowbaneSkills?.events.some((e) => e.kind === "effect"),
        ),
      )
      .toBe(true);
    if (classId === "warrior")
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.hollowbaneSkills?.statuses.some(
              (s) => s.kind === "power" && s.actor === 0,
            ),
          ),
        )
        .toBe(true);
    if (classId === "sorcerer")
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.hollowbaneSkills?.statuses.some((s) => s.kind === "slow"),
          ),
        )
        .toBe(true);
    if (classId === "ranger")
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              new Set(
                window
                  .hollowbaneCombat!.events.filter((e) => e.kind === "damage")
                  .map((e) => e.target),
              ).size,
          ),
        )
        .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() =>
        page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase),
      )
      .toBe("idle");
    await page.locator('[data-skill="0"]').click();
    const aimed = await page.evaluate(() => window.hollowbaneCombat!);
    const first = aimed.actors.find((a) => a.id === 1)!,
      rect = await page.locator("canvas").boundingBox();
    if (!rect) throw Error("Missing combat canvas");
    await page.mouse.click(
      rect.x + ((first.x - aimed.view.x) / aimed.view.width) * rect.width,
      rect.y +
        ((first.y - 28 - aimed.view.y) / aimed.view.height) * rect.height,
      { button: "right" },
    );
    const primary =
      classId === "warrior"
        ? "iron-fan"
        : classId === "sorcerer"
          ? "ember-lance"
          : "briar-edge";
    await expect
      .poll(() =>
        page.evaluate(
          (skill) =>
            window.hollowbaneSkills!.events.some(
              (e) => e.kind === "effect" && e.skill === skill,
            ),
          primary,
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
    if (classId === "warrior")
      await page.screenshot({ path: "test-results/class-warrior.png" });
    await expect
      .poll(() =>
        page.evaluate((skill) => {
          const r = window.hollowbaneSkills!;
          return (
            window.hollowbaneCombat!.actors[0]!.phase === "idle" &&
            (r.users[0]!.cooldowns[skill] ?? 0) <= r.tick
          );
        }, primary),
      )
      .toBe(true);
    const count = await page.evaluate(
      (skill) =>
        window.hollowbaneSkills!.events.filter(
          (e) => e.kind === "start" && e.actor === 0 && e.skill === skill,
        ).length,
      primary,
    );
    const hits = await page.evaluate(
      () =>
        window.hollowbaneCombat!.events.filter(
          (e) => e.kind === "damage" && e.actor === 0,
        ).length,
    );
    await page.evaluate(() => {
      window.virtualPads[0]!.axes[2] = 0.8;
      window.virtualPads[0]!.axes[3] = 0.4;
    });
    await pressVirtualButton(page, 2, 15);
    await expect
      .poll(() =>
        page.evaluate(
          (skill) =>
            window.hollowbaneSkills!.events.filter(
              (e) => e.kind === "start" && e.actor === 0 && e.skill === skill,
            ).length,
          primary,
        ),
      )
      .toBe(count + 1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.hollowbaneCombat!.events.filter(
              (e) => e.kind === "damage" && e.actor === 0,
            ).length,
        ),
      )
      .toBeGreaterThan(hits);
    expect(
      await page.evaluate(() =>
        window.hollowbaneSkills!.events.some(
          (e) => e.actor !== 0 && e.kind === "start",
        ),
      ),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
