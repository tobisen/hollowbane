import { expect, type Page } from "@playwright/test";
export type Point = { x: number; y: number };
declare global {
  interface Window {
    hollowbaneQuestNavigation?: {
      arrived: boolean;
      frame: number;
      path: Point[];
      sourceArea: string | null;
      trace: {
        tick: number;
        area: string;
        position: Point;
        destination: Point;
        distance: number;
        phase: string;
        walking: boolean;
        axes: number[];
        decision: string;
      }[];
    };
  }
}
/** A concrete fresh-Warrior build, spending only points actually shown by the UI. */
export async function prepareEarnedQuestWarrior(page: Page) {
  await neutralQuestController(page);
  const budget = await page.evaluate(() => ({
    warrior:
      document
        .querySelector(".skill-identity")
        ?.textContent?.includes("Committed: warrior") ?? false,
    attributes: Number(
      document.querySelector("#character-points")?.textContent ?? 0,
    ),
    skills: Number(document.querySelector("#skill-points")?.textContent ?? 0),
  }));
  if (!budget.warrior || (!budget.attributes && !budget.skills)) return;
  const opened = await page.locator("#inventory-dialog").isVisible();
  if (!opened) await page.locator("#inventory-open").click();
  if (budget.attributes) {
    if (
      !(await page
        .locator("#character-panel")
        .evaluate((e) => (e as HTMLDetailsElement).open))
    )
      await page.locator("#character-toggle").click();
    for (let point = 0; point < budget.attributes; point++)
      await page.locator("#allocate-vitality").click();
  }
  if (budget.skills) {
    if (
      !(await page
        .locator("#skill-tree-panel")
        .evaluate((e) => (e as HTMLDetailsElement).open))
    )
      await page.locator("#skill-tree-toggle").click();
    for (let point = 0; point < budget.skills; point++) {
      const fan = await page
          .locator('[data-skill="0"] .slot-name')
          .textContent(),
        power = await page.locator('[data-skill="1"] .slot-name').textContent();
      const resolve = fan === "Sundering Fan" && power !== "Oath Echo";
      await page.locator(`#skill-branch-${resolve ? 1 : 0}`).click();
      await page
        .locator(`#node-warrior-${resolve ? "resolve" : "arms"}-foundation`)
        .click();
      await page.locator("#skill-learn").click();
      await page.locator("#skill-confirm").click();
      await page.locator(`#skill-assign-${resolve ? 1 : 0}`).click();
      await expect(
        page.locator(`[data-skill="${resolve ? 1 : 0}"] .slot-name`),
      ).toHaveText(resolve ? "Oath Echo" : "Sundering Fan");
    }
  }
  if (!opened) await page.locator("#inventory-close").click();
}
export async function neutralQuestController(page: Page) {
  const samples = await page.evaluate(() => {
    window.virtualPads[0]!.axes = [0, 0, 0, 0];
    return window.hollowbaneInput?.samples ?? 0;
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          (samples) =>
            !!window.hollowbaneInput?.armed &&
            window.hollowbaneInput.samples >= samples + 3 &&
            Math.hypot(
              window.hollowbaneInput.move.x,
              window.hollowbaneInput.move.y,
            ) === 0,
          samples,
        ),
      { intervals: [16] },
    )
    .toBe(true);
}
/** Read navigation only; every movement step goes through the existing virtual stick. */
export async function followQuestPath(
  page: Page,
  kind: "npc" | "treasure" | "objective" | "exit",
  id = "",
) {
  await neutralQuestController(page);
  const area = await page.evaluate(() => window.hollowbaneWorld!.area);
  const points = await page.evaluate(
    ({ kind, id }) => {
      const w = window.hollowbaneWorld!,
        path =
          kind === "npc"
            ? w.routeToNpc!(id)
            : kind === "exit"
              ? w.routeToExit!(id)
              : kind === "treasure"
                ? w.routeToContainer!(Number(id))
                : w.routeToObjective!();
      let from = w.position;
      return path.flatMap((endpoint, index) => {
        let to = endpoint;
        if (index === path.length - 1 && kind !== "exit") {
          const distance = Math.hypot(endpoint.x - from.x, endpoint.y - from.y),
            gap = kind === "treasure" ? 0.9 : 0.7;
          if (distance <= gap) return [];
          to = {
            x: endpoint.x + ((from.x - endpoint.x) / distance) * gap,
            y: endpoint.y + ((from.y - endpoint.y) / distance) * gap,
          };
        }
        const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 1.5);
        const points = Array.from({ length: steps }, (_, i) => ({
          x: from.x + ((to.x - from.x) * (i + 1)) / steps,
          y: from.y + ((to.y - from.y) * (i + 1)) / steps,
        }));
        from = to;
        return points;
      });
    },
    { kind, id },
  );
  for (const p of points) {
    if (
      await page.evaluate((area) => window.hollowbaneWorld!.area !== area, area)
    )
      return;
    await driveQuestPoint(page, p, kind === "exit" ? area : undefined, points);
    if (
      await page.evaluate((area) => window.hollowbaneWorld!.area !== area, area)
    )
      return;
  }
}
export async function driveQuestPoint(
  page: Page,
  p: Point,
  sourceArea?: string,
  activePath: Point[] = [p],
) {
  // Host polling can miss arrival while a stale held direction overshoots.
  // Steer and latch arrival beside rendering; the host only observes outcomes.
  await page.evaluate(
    ({ p, sourceArea, activePath }) => {
      const state = {
        arrived: false,
        frame: 0,
        path: activePath,
        sourceArea: sourceArea ?? null,
        trace: [] as {
          tick: number;
          area: string;
          position: Point;
          destination: Point;
          distance: number;
          phase: string;
          walking: boolean;
          axes: number[];
          decision: string;
        }[],
      };
      window.hollowbaneQuestNavigation = state;
      const steer = () => {
        const w = window.hollowbaneWorld!,
          player = window.hollowbaneCombat!.actors[0]!;
        const dx = p.x - w.position.x,
          dy = p.y - w.position.y;
        const distance = Math.hypot(dx, dy);
        state.arrived ||=
          (!!sourceArea && w.area !== sourceArea) || distance < 0.1;
        const sx = dx - dy,
          sy = (dx + dy) / 2,
          length = Math.hypot(sx, sy);
        const scale = Math.min(1, distance * 4);
        // Mouse/keyboard activity releases controller ownership. Holding the
        // stick while disarmed cannot rearm it; supply a real neutral sample.
        const armed = window.hollowbaneInput?.armed ?? false;
        const axes =
          state.arrived || player.hp <= 0 || !armed
            ? [0, 0, 0, 0]
            : [(sx / length) * scale, (sy / length) * scale, 0, 0];
        window.virtualPads[0]!.axes = axes;
        state.trace.push({
          tick: window.hollowbaneCombat!.tick,
          area: w.area,
          position: { ...w.position },
          destination: p,
          distance,
          phase: player.phase,
          walking: player.walking,
          axes,
          decision:
            player.hp <= 0
              ? "dead"
              : state.arrived
                ? "arrived"
                : !armed
                  ? "release-to-rearm"
                  : "steer",
        });
        if (state.trace.length > 64) state.trace.shift();
        if (!state.arrived && player.hp > 0)
          state.frame = requestAnimationFrame(steer);
      };
      steer();
    },
    { p, sourceArea, activePath },
  );
  try {
    await expect
      .poll(
        async () => {
          return page.evaluate(() => {
            if (window.hollowbaneCombat!.actors[0]!.hp <= 0)
              throw Error("Player died while navigating the active expedition");
            return window.hollowbaneQuestNavigation!.arrived;
          });
        },
        { timeout: 10000, intervals: [30] },
      )
      .toBe(true);
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      navigation: window.hollowbaneQuestNavigation,
      input: window.hollowbaneInput,
      player: window.hollowbaneCombat!.actors[0],
      exits: window.hollowbaneWorld!.exits,
    }));
    console.log(
      "D06 navigation diagnostic",
      JSON.stringify({ sourceArea, ...diagnostic }),
    );
    throw error;
  } finally {
    await page.evaluate(() => {
      cancelAnimationFrame(window.hollowbaneQuestNavigation!.frame);
      window.virtualPads[0]!.axes = [0, 0, 0, 0];
      delete window.hollowbaneQuestNavigation;
    });
  }
}
