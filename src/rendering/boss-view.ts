import type Phaser from "phaser";
import { onGround } from "../world/navigation";
import type { CombatWorld } from "../simulation/combat";
import type {
  BossArena,
  BossDefinition,
  BossState,
  BossTelegraph,
} from "../simulation/boss";
import "./boss.css";
import { bossPresentation } from "./boss-presentation";
export interface BossEncounterView {
  definition: BossDefinition;
  state: BossState;
  arena: BossArena;
}
declare global {
  interface Window {
    hollowbaneBoss?: {
      state: BossState;
      name: string;
      health: number;
      maxHealth: number;
    } | null;
  }
}
function outline(t: BossTelegraph): { x: number; y: number }[] {
  const angle = Math.atan2(t.direction.y, t.direction.x);
  let points: { x: number; y: number }[];
  if (t.shape.kind === "line") {
    const { length, width } = t.shape;
    points = [
      [0, -width / 2],
      [length, -width / 2],
      [length, width / 2],
      [0, width / 2],
    ].map(([x, y]) => ({ x: x!, y: y! }));
  } else {
    const half = t.shape.kind === "circle" ? Math.PI : t.shape.halfAngle;
    const radius = t.shape.radius;
    points = Array.from({ length: 65 }, (_, i) => ({
      x: Math.cos(-half + (2 * half * i) / 64) * radius,
      y: Math.sin(-half + (2 * half * i) / 64) * radius,
    }));
    if (t.shape.kind === "cone") points.push({ x: 0, y: 0 });
  }
  return points.map((p) =>
    onGround({
      x: t.origin.x + p.x * Math.cos(angle) - p.y * Math.sin(angle),
      y: t.origin.y + p.x * Math.sin(angle) + p.y * Math.cos(angle),
    }),
  );
}
export class BossView {
  private element = document.createElement("section");
  private graphics: Phaser.GameObjects.Graphics;
  private name: HTMLElement;
  private health: HTMLElement;
  private phase: HTMLElement;
  private warning: HTMLElement;
  private progress: HTMLProgressElement;
  constructor(scene: Phaser.Scene, root: HTMLElement) {
    this.element.id = "boss-hud";
    this.element.hidden = true;
    this.element.innerHTML =
      '<strong><span id="boss-name"></span> <span id="boss-vitality"></span></strong><progress id="boss-health" aria-label="Boss health"></progress><span id="boss-phase"></span><span id="boss-warning" role="status"></span>';
    this.name = this.element.querySelector("#boss-name")!;
    this.health = this.element.querySelector("#boss-vitality")!;
    this.phase = this.element.querySelector("#boss-phase")!;
    this.warning = this.element.querySelector("#boss-warning")!;
    this.progress = this.element.querySelector("progress")!;
    root.append(this.element);
    this.graphics = scene.add.graphics().setDepth(-5);
    scene.events.once("shutdown", () => {
      this.element.remove();
      window.hollowbaneBoss = null;
    });
  }
  draw(encounter: BossEncounterView | null, world: CombatWorld): void {
    this.graphics.clear();
    const actor =
      encounter && world.actors.find((a) => a.id === encounter.state.actor);
    const hidden =
      !actor ||
      !encounter ||
      (!encounter.state.engaged && !encounter.state.complete);
    if (this.element.hidden !== hidden) this.element.hidden = hidden;
    if (!actor || !encounter) {
      window.hollowbaneBoss = null;
      return;
    }
    const { definition, state } = encounter;
    window.hollowbaneBoss = {
      state: structuredClone(state),
      name: definition.name,
      health: actor.hp,
      maxHealth: actor.maxHp,
    };
    const presentation = bossPresentation(definition, state, actor, world.tick);
    for (const [element, value] of [
      [this.name, presentation.name],
      [this.health, presentation.health],
      [this.phase, presentation.phase],
      [this.warning, presentation.warning],
    ] as const)
      if (element.textContent !== value) element.textContent = value;
    if (this.progress.max !== actor.maxHp) this.progress.max = actor.maxHp;
    if (this.progress.value !== actor.hp) this.progress.value = actor.hp;
    const telegraph = state.telegraph;
    if (
      telegraph &&
      ["windup", "active"].includes(actor.controller.timeline.phase)
    ) {
      const active = actor.controller.timeline.phase === "active";
      const points = outline(telegraph);
      this.graphics.fillStyle(active ? 0xffd392 : 0xb94726, active ? 0.5 : 0.3);
      this.graphics.lineStyle(3, active ? 0xfff3c4 : 0xffad66, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(points[0]!.x, points[0]!.y);
      for (const point of points.slice(1))
        this.graphics.lineTo(point.x, point.y);
      this.graphics.closePath();
      this.graphics.fillPath();
      this.graphics.strokePath();
    }
  }
}
