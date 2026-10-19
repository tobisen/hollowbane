import Phaser from "phaser";
import type { WorldSession } from "../simulation/world-session";
import { canOpenContainer } from "../simulation/world-containers";
import { onGround } from "../world/navigation";
import type { WorldPoint } from "../simulation/world";
/** Original code-drawn wood/iron props; no external bitmap assets. */
export class ContainerView {
  private panel: HTMLDivElement;
  private button: HTMLButtonElement;
  private label: HTMLOutputElement;
  private graphics: Phaser.GameObjects.Graphics[] = [];
  private layout: WorldSession["travel"]["layout"] | undefined;
  private nearest: number | undefined;
  constructor(
    private scene: Phaser.Scene,
    root: HTMLElement,
    private open: (id: number) => boolean,
  ) {
    this.panel = document.createElement("div");
    this.panel.className = "world-treasure";
    this.panel.style.cssText =
      "position:absolute;right:18px;top:125px;z-index:12;padding:8px;background:#181914e8;color:#d5c493;border:1px solid #685839;max-width:280px;font-size:12px";
    this.label = document.createElement("output");
    this.label.setAttribute("aria-live", "polite");
    this.button = document.createElement("button");
    this.button.textContent = "Open nearby container · E / Interact";
    this.button.onclick = () => {
      if (this.nearest !== undefined) this.open(this.nearest);
      root.querySelector<HTMLElement>("#combat-world")!.focus();
    };
    this.panel.append(this.label, document.createElement("br"), this.button);
    root.append(this.panel);
    scene.events.once("shutdown", () => {
      this.panel.remove();
      this.graphics.forEach((g) => g.destroy());
    });
  }
  update(world: WorldSession, player: WorldPoint, alive: boolean): void {
    const plan = world.containers;
    if (this.layout !== world.travel.layout) {
      this.graphics.forEach((g) => g.destroy());
      this.layout = world.travel.layout;
      this.graphics = plan.map((c) =>
        this.scene.add.graphics().setDepth(onGround(c.position).y),
      );
    }
    const state = world.containerState;
    this.nearest = plan
      .filter(
        (c) =>
          !state.opened.includes(c.id) &&
          canOpenContainer(world.travel.layout, c, player),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.position.x - player.x, a.position.y - player.y) -
            Math.hypot(b.position.x - player.x, b.position.y - player.y) ||
          a.id - b.id,
      )[0]?.id;
    this.button.disabled = !alive || this.nearest === undefined;
    const text = `Gold: ${state.gold} · Opened: ${state.opened.length} · E / Interact near treasure`;
    if (this.label.textContent !== text) this.label.textContent = text;
    plan.forEach((c, i) => {
      const g = this.graphics[i]!,
        p = onGround(c.position),
        opened = state.opened.includes(c.id);
      g.clear();
      g.fillStyle(0x080b0a, 0.4).fillEllipse(p.x, p.y + 2, 48, 18);
      g.lineStyle(2, c.rare ? 0xc4a453 : 0x645e52, 1);
      g.fillStyle(opened ? 0x24241e : 0x61492f, 1);
      if (c.kind === "barrel")
        g.fillEllipse(p.x, p.y - 12, 30, 34).strokeEllipse(
          p.x,
          p.y - 12,
          30,
          34,
        );
      else
        g.fillRoundedRect(p.x - 22, p.y - 23, 44, 25, 3).strokeRoundedRect(
          p.x - 22,
          p.y - 23,
          44,
          25,
          3,
        );
      g.lineBetween(p.x - 17, p.y - 15, p.x + 17, p.y - 15);
      g.lineBetween(p.x - 10, p.y - 23, p.x - 10, p.y + 1);
      g.lineBetween(p.x + 10, p.y - 23, p.x + 10, p.y + 1);
      if (opened) g.lineBetween(p.x - 20, p.y - 28, p.x + 20, p.y - 34);
      if (c.id === this.nearest)
        g.lineStyle(1, 0xe5c577, 0.9).strokeEllipse(p.x, p.y + 3, 56, 22);
    });
  }
}
