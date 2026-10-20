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
  constructor(scene: Phaser.Scene, root: HTMLElement) {
    this.element.id = "boss-hud";
    this.element.hidden = true;
    this.element.innerHTML =
      '<strong id="boss-name"></strong><progress id="boss-health" aria-label="Boss health"></progress><span id="boss-phase"></span><span id="boss-warning" role="status"></span>';
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
    this.element.hidden =
      !actor ||
      !encounter ||
      (!encounter.state.engaged && !encounter.state.complete);
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
    this.element.querySelector("#boss-name")!.textContent = definition.name;
    const progress =
      this.element.querySelector<HTMLProgressElement>("progress")!;
    progress.max = actor.maxHp;
    progress.value = actor.hp;
    this.element.querySelector("#boss-phase")!.textContent = state.complete
      ? "Encounter complete"
      : `Phase ${state.phase + 1} · ${definition.phases[state.phase]!.name}`;
    const telegraph = state.telegraph;
    const warning = this.element.querySelector("#boss-warning")!;
    warning.textContent = state.complete
      ? "The binding is broken."
      : world.tick < state.transitionUntil
        ? "The stone shifts · prepare"
        : telegraph && actor.controller.timeline.phase === "windup"
          ? definition.attacks.find((a) => a.id === telegraph.attack)!.name
          : "";
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
