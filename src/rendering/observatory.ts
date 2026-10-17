import { controllerInput } from "./controller-input";
import type Phaser from "phaser";
import { project, createRng } from "../simulation/core";
import { createDiagnostics, instrumentDrawCalls } from "./diagnostics";
/** Both engine versions run this same adapter; simulation never imports Phaser. */
export function startObservatory(P: typeof Phaser, version: string): void {
  const output = document.querySelector<HTMLOutputElement>("#metrics")!;
  const button = document.querySelector<HTMLButtonElement>("#pause")!;
  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let diagnostics: ReturnType<typeof createDiagnostics>;
  class Observatory extends P.Scene {
    private sentinels: Phaser.GameObjects.Image[] = [];
    create(): void {
      const rng = createRng(772);
      const g = this.add.graphics();
      for (let x = 0; x < 12; x++)
        for (let y = 0; y < 12; y++) {
          const p = project(x, y);
          const sx = 480 + p.x,
            sy = 90 + p.y;
          g.fillStyle((x + y) % 2 === 0 ? 0x353d3d : 0x2c3437);
          g.fillPoints(
            [
              new P.Math.Vector2(sx, sy - 16),
              new P.Math.Vector2(sx + 32, sy),
              new P.Math.Vector2(sx, sy + 16),
              new P.Math.Vector2(sx - 32, sy),
            ],
            true,
          );
          g.lineStyle(1, 0x555b50, 0.3);
          g.strokePoints(
            [
              new P.Math.Vector2(sx, sy - 16),
              new P.Math.Vector2(sx + 32, sy),
              new P.Math.Vector2(sx, sy + 16),
              new P.Math.Vector2(sx - 32, sy),
            ],
            true,
          );
        }
      const texture = this.make.graphics({ x: 0, y: 0 });
      texture.fillStyle(0xb0b8a0);
      texture.fillCircle(8, 8, 6);
      texture.fillStyle(0x636f72);
      texture.fillRect(3, 14, 10, 17);
      texture.generateTexture("sentinel", 16, 32);
      texture.destroy();
      for (let i = 0; i < 50; i++) {
        const p = project(rng() * 10 + 0.5, rng() * 10 + 0.5);
        const sprite = this.add
          .image(480 + p.x, 90 + p.y, "sentinel")
          .setOrigin(0.5, 1)
          .setDepth(p.y);
        this.sentinels.push(sprite);
        if (this.game.renderer.type === P.WEBGL) {
          if (version === "4") sprite.setLighting(true);
          else
            (
              sprite as unknown as { setPipeline(name: string): void }
            ).setPipeline("Light2D");
        }
      }
      if (this.game.renderer.type === P.WEBGL) {
        this.lights.enable().setAmbientColor(0x697483);
        this.lights.addLight(430, 250, 300, 0xffac55, 2);
        this.lights.addLight(650, 300, 200, 0x6a9aaa, 1);
      }
      for (const x of [265, 695]) {
        this.add.rectangle(x, 320, 8, 42, 0x62513c);
        this.add.circle(x, 293, 5, 0xf7bc70);
      }
      this.add.text(28, 25, `HOLLOWBANE  /  PHASER ${version}`, {
        fontSize: "14px",
        color: "#cab48d",
      });
      this.add.text(
        28,
        510,
        "ASHEN COURTYARD     •     SEED 772     •     50 PLACEHOLDER SENTINELS",
        { fontSize: "11px", color: "#9ca69c" },
      );
      button.setAttribute("aria-pressed", String(paused));
      button.textContent = paused ? "Resume motion" : "Pause motion";
      button.onclick = () => {
        paused = !paused;
        button.setAttribute("aria-pressed", String(paused));
        button.textContent = paused ? "Resume motion" : "Pause motion";
      };
      diagnostics = createDiagnostics(
        P.VERSION,
        this.game.renderer.type === P.WEBGL ? "WebGL" : "Canvas",
      );
      if (
        new URLSearchParams(location.search).has("metrics") &&
        this.game.renderer.type === P.WEBGL
      ) {
        const counter = instrumentDrawCalls(
          (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl,
        );
        this.game.events.on(P.Core.Events.PRE_RENDER, counter.reset);
        const record = () => {
          diagnostics.state.drawCalls = counter.count();
        };
        this.game.events.on(P.Core.Events.POST_RENDER, record);
        this.events.once(P.Scenes.Events.SHUTDOWN, () => {
          counter.restore();
          this.game.events.off(P.Core.Events.PRE_RENDER, counter.reset);
          this.game.events.off(P.Core.Events.POST_RENDER, record);
        });
      }
      document.documentElement.dataset.engineReady = version;
    }
    update(time: number, delta: number): void {
      if (!paused && !controllerInput.blockGameplay)
        for (const [i, sprite] of this.sentinels.entries())
          sprite.rotation = Math.sin(time / 800 + i) * 0.035;
      diagnostics.sample(delta, this.game.loop.actualFps);
      if (this.game.loop.frame % 30 === 0) {
        const p95 = diagnostics.state.p95FrameMs;
        output.textContent = `Phaser ${P.VERSION} · ${this.game.renderer.type === P.WEBGL ? "WebGL / dynamic lights" : "Canvas / unlit fallback"} · 50 sprites · FPS ${this.game.loop.actualFps.toFixed(0)} · p95 ${p95.toFixed(1)} ms`;
      }
    }
  }
  new P.Game({
    type: P.AUTO,
    parent: "game",
    width: 960,
    height: 540,
    backgroundColor: "#15191e",
    scene: Observatory,
    scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_BOTH },
    banner: false,
    input: { gamepad: controllerInput.nativeGamepadAvailable() },
  });
}
