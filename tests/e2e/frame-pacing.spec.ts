import { expect, test } from "@playwright/test";
import type Phaser from "phaser";

test("fixed ticks follow RAF time despite CPU callback jitter and retain the catch-up cap", async ({
  page,
}) => {
  await page.goto(
    "?world=1&developer=1&worldPeaceful=1&worldArea=haunted-forest&worldSeed=42&profile=1",
  );
  await page.waitForFunction(() => window.hollowbaneCombat?.tick);
  await page.locator("#combat-world").focus();
  const result = await page.evaluate(() => {
    const game = window.hollowbaneProfileGame!;
    const scene = game.scene.scenes[0] as Phaser.Scene & {
      accumulator: number;
      previousFrame: number;
      droppedTicks: number;
      keys: Set<string>;
    };
    const systems = scene.sys as Phaser.Scenes.Systems & {
      sceneUpdate(time: number, delta: number): void;
    };
    // Isolated, memory-only fixture: deliver exact RAF intervals while varying
    // CPU arrival by +/-6ms. No browser performance threshold or sleep.
    game.loop.stop();
    scene.accumulator = 0;
    scene.keys.add("d");
    let tick = window.hollowbaneCombat!.tick;
    const ticks: number[] = [];
    for (let frame = 0; frame < 16; frame++) {
      game.loop.rawDelta = 1000 / 60;
      scene.previousFrame =
        performance.now() - (1000 / 60 + (frame % 2 ? 6 : -6));
      systems.sceneUpdate.call(scene, 0, 0);
      const next = window.hollowbaneCombat!.tick;
      ticks.push(next - tick);
      tick = next;
    }
    scene.accumulator = 0;
    const quantized: number[] = [];
    for (let frame = 0; frame < 60; frame++) {
      game.loop.rawDelta = [16.6, 16.7, 16.7][frame % 3]!;
      scene.previousFrame = performance.now() - game.loop.rawDelta;
      systems.sceneUpdate.call(scene, 0, 0);
      const next = window.hollowbaneCombat!.tick;
      quantized.push(next - tick);
      tick = next;
    }
    const residual = scene.accumulator;
    scene.keys.clear();
    const rates: number[] = [];
    for (const hz of [30, 60, 120]) {
      scene.accumulator = 0;
      const begin = window.hollowbaneCombat!.tick;
      for (let frame = 0; frame < hz; frame++) {
        game.loop.rawDelta = 1000 / hz;
        systems.sceneUpdate.call(scene, 0, 0);
      }
      rates.push(window.hollowbaneCombat!.tick - begin);
    }
    tick = window.hollowbaneCombat!.tick;
    scene.accumulator = 0;
    const dropped = scene.droppedTicks;
    game.loop.rawDelta = 250;
    systems.sceneUpdate.call(scene, 0, 0);
    return {
      ticks,
      quantized,
      residual,
      rates,
      catchUp: window.hollowbaneCombat!.tick - tick,
      dropped: scene.droppedTicks - dropped,
    };
  });
  expect(result.ticks).toEqual(Array.from({ length: 16 }, () => 1));
  expect(result.quantized).toEqual(Array.from({ length: 60 }, () => 1));
  expect(result.residual).toBeCloseTo(0, 8);
  expect(result.rates).toEqual([60, 60, 60]);
  expect(result.catchUp).toBe(6);
  expect(result.dropped).toBe(9);
});
