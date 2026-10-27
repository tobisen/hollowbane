import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("./?combat=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat?.tick ?? 0))
    .toBeGreaterThan(2);
  await page.locator("#combat-hostile").uncheck();
  await page.locator("#combat-sound").uncheck();
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
async function target(page: Page, id: number) {
  const a = await page.evaluate(
    (id) => window.hollowbaneCombat!.actors.find((a) => a.id === id)!,
    id,
  );
  return point(page, a.x, a.y - 28);
}
test("arena is inspectable and preserves its visual reference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.metrics.renderWidth),
  ).toBe(960);
  await page.locator("#combat-pause").click();
  await page.locator("#combat-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.tick))
    .toBe(0);
  await expect(page.locator("main")).toHaveScreenshot(
    `ashwood-arena-${process.platform}.png`,
    {
      mask: [page.locator("#combat-diagnostics")],
      maxDiffPixelRatio: 0.01,
    },
  );
  expect(errors).toEqual([]);
});
test("melee approaches and respects windup, recovery, held attacks and death", async ({
  page,
}) => {
  await ready(page);
  const p = await target(page, 1);
  await page.mouse.move(p.x, p.y);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.hovered))
    .toBe(1);
  // Arm before input and capture HP in the same browser observation as windup.
  // A separate host round trip can arrive after the valid first strike.
  const windupObservation = page.waitForFunction(() => {
    const state = window.hollowbaneCombat!;
    const player = state.actors[0]!;
    return (
      player.phase === "windup" &&
      player.sequence === 1 && {
        hp: state.actors[1]!.hp,
        tick: state.tick,
        remaining: player.remaining,
      }
    );
  });
  await page.mouse.down();
  const windup = await (await windupObservation).jsonValue();
  expect(windup).toBeTruthy();
  if (!windup) throw Error("First windup was not observed");
  expect(windup.hp).toBe(160);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[1]!.hp), {
      timeout: 12000,
    })
    .toBe(0);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBeNull();
  const state = await page.evaluate(() => window.hollowbaneCombat!);
  const firstDamage = state.events.find(
    (event) =>
      event.kind === "damage" && event.actor === 0 && event.target === 1,
  );
  expect(firstDamage?.tick).toBeGreaterThanOrEqual(
    windup.tick + windup.remaining,
  );
  expect(state.actors[1]!.phase).toBe("dead");
  expect(state.events.some((e) => e.kind === "death")).toBe(true);
  expect(state.metrics.attackSamples).toBeGreaterThan(0);
});
test("projectiles launch before impact and moving targets remain selectable", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#combat-weapon").selectOption("projectile");
  const p = await target(page, 1);
  await page.mouse.click(p.x, p.y);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some((e) => e.kind === "launch"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.hollowbaneCombat!.events.some((e) => e.kind === "impact"),
      ),
    )
    .toBe(true);
  const events = await page.evaluate(() => window.hollowbaneCombat!.events);
  expect(events.find((e) => e.kind === "impact")!.tick).toBeGreaterThan(
    events.find((e) => e.kind === "launch")!.tick,
  );
  const moving = await target(page, 2);
  await page.mouse.click(moving.x, moving.y);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.selected),
    )
    .toBe(2);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.sequence),
    )
    .toBeGreaterThan(1);
});
test("ground movement waits for recovery and breakpoints are observable", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#combat-weapon").selectOption("projectile");
  await page.locator("#combat-speed").selectOption("90");
  const p = await target(page, 1);
  const ground = await point(page, 550, 630);
  const windupObservation = page.waitForFunction(() => {
    const state = window.hollowbaneCombat!,
      player = state.actors[0]!;
    const windup = state.events.find(
      (event) =>
        event.kind === "phase" && event.actor === 0 && event.phase === "windup",
    );
    return windup && player.sequence === 1 && { ...player };
  });
  await page.locator("#combat-world").evaluate((field, ground) => {
    const capture = (event: Event) => {
      const pointer = event as PointerEvent;
      if (
        Math.hypot(pointer.clientX - ground.x, pointer.clientY - ground.y) > 1
      )
        return;
      field.removeEventListener("pointerdown", capture);
      const state = window.hollowbaneCombat!,
        actor = state.actors[0]!;
      field.setAttribute(
        "data-test-ground-delivery",
        JSON.stringify({
          x: actor.x,
          y: actor.y,
          phase: actor.phase,
          tick: state.tick,
        }),
      );
    };
    // Register fully before either click. Observe after the game's own listener;
    // only test DOM metadata changes, never simulation or its clock.
    field.addEventListener("pointerdown", capture);
  }, ground);
  await page.mouse.click(p.x, p.y);
  const observation = await windupObservation;
  // Send the queued move before another protocol round trip can consume recovery.
  await page.mouse.click(ground.x, ground.y);
  const before = await observation.jsonValue();
  if (!before) throw Error("First projectile windup was not observed");
  expect(before.windup).toBe(6);
  await expect(page.locator("#combat-world")).toHaveAttribute(
    "data-test-ground-delivery",
    /./,
  );
  const after = await page.locator("#combat-world").evaluate(
    (field) =>
      JSON.parse(field.getAttribute("data-test-ground-delivery")!) as {
        x: number;
        y: number;
        phase: string;
        tick: number;
      },
  );
  expect(["windup", "active", "recovery"]).toContain(after.phase);
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
  await expect
    .poll(() =>
      page.evaluate(() => window.hollowbaneCombat!.actors[0]!.walking),
    )
    .toBe(true);
  const phases = await page.evaluate(() => window.hollowbaneCombat!.events);
  const firstPhase = (phase: string) =>
    phases.find(
      (event) =>
        event.actor === 0 && event.kind === "phase" && event.phase === phase,
    )!.tick;
  // Entry consumes the first windup tick in the existing timeline contract.
  expect(firstPhase("active") - firstPhase("windup") + 1).toBe(6);
  expect(after.tick).toBeLessThan(firstPhase("idle"));
  expect(firstPhase("idle") - firstPhase("recovery")).toBe(before.recovery);
  await page.locator("#combat-world").focus();
  await page.keyboard.press("Space");
  const stopped = await page.evaluate(
    () => window.hollowbaneCombat!.actors[0]!.x,
  );
  await page.keyboard.down("d");
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.x))
    .toBeGreaterThan(stopped + 5);
  await page.keyboard.up("d");
});
test("hostile attacks cause hit recovery and player death remains terminal", async ({
  page,
}) => {
  test.setTimeout(60000);
  await ready(page);
  await page.locator("#combat-hostile").check();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.kind === "damage" && e.target === 0,
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.hollowbaneCombat!.events.some(
            (e) => e.kind === "stagger" && e.target === 0,
          ),
        ),
      { timeout: 5000 },
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp), {
      timeout: 45000,
    })
    .toBe(0);
  const p = await target(page, 1);
  await page.mouse.click(p.x, p.y);
  expect(
    await page.evaluate(() => window.hollowbaneCombat!.actors[0]!.phase),
  ).toBe("dead");
  await page.locator("#combat-reset").click();
  await expect
    .poll(() => page.evaluate(() => window.hollowbaneCombat!.actors[0]!.hp))
    .toBe(300);
});
