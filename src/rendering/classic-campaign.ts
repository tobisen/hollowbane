import Phaser from "phaser";
import actors from "../../public/dev/classic-visual/actors.json";
import type { AreaLayout } from "../simulation/area-anchors";
import type { CombatActor } from "../simulation/combat";
import type { Cast } from "../simulation/skills";
import type { Point } from "../world/isometric";
import {
  createClassicContact,
  drawClassicEnvironment,
} from "./classic-environment";
import { classicActorFrame, observeClassicMotion } from "./classic-actor-frame";
import { WarriorMotion } from "./warrior-pose";
import "./classic-act1.css";

declare global {
  interface Window {
    hollowbaneClassicAct1?: {
      area: string;
      groundCells: number;
      actorTextures: {
        id: number;
        texture: string;
        frame: string;
        shadow: string;
      }[];
      textures: string[];
      classId: string | null;
    };
  }
}

/** Approved presentation only; owns no campaign, input, combat or storage state. */
export class ClassicCampaign {
  private scenery: Phaser.GameObjects.GameObject[] = [];
  private memory = new Map<number, WarriorMotion>();
  private frames = new Map(actors.frames.map((f) => [f.name, f]));
  constructor(private scene: Phaser.Scene) {
    createClassicContact(scene);
    for (const name of ["oak", "bell", "earth", "rocks", "undergrowth"])
      if (!scene.textures.exists(`classic-${name}`))
        throw Error(`Classic scenery unavailable: ${name}`);
    for (const atlas of actors.atlases) {
      const texture = scene.textures.get(`classic-${atlas.kind}`);
      if (!scene.textures.exists(`classic-${atlas.kind}`))
        throw Error(`Classic actor atlas unavailable: ${atlas.kind}`);
      for (const f of actors.frames.filter((f) => f.kind === atlas.kind))
        if (!texture.has(f.name))
          texture.add(f.name, 0, f.x, f.y, f.width, f.height);
    }
  }
  static preload(scene: Phaser.Scene): void {
    for (const name of ["oak", "bell", "earth", "rocks", "undergrowth"])
      scene.load.image(
        `classic-${name}`,
        import.meta.env.BASE_URL + `dev/classic-visual/${name}.png`,
      );
    for (const a of actors.atlases)
      scene.load.image(
        `classic-${a.kind}`,
        import.meta.env.BASE_URL + `dev/classic-visual/${a.file}`,
      );
  }
  draw(layout: AreaLayout, active: boolean): void {
    for (const object of this.scenery) object.destroy();
    this.scenery = [];
    this.memory.clear();
    if (!active) return;
    const before = new Set(this.scene.children.list);
    drawClassicEnvironment(this.scene, layout.map);
    this.scenery = this.scene.children.list.filter(
      (child) => !before.has(child),
    );
  }
  observe(actor: CombatActor, tick: number): void {
    let memory = this.memory.get(actor.id);
    if (!memory) {
      memory = new WarriorMotion();
      this.memory.set(actor.id, memory);
    }
    observeClassicMotion(memory, actor, tick);
  }
  actor(
    actor: CombatActor,
    tick: number,
    deathAt: number | null,
    cast: Cast | null,
    position: Point,
    sprite: Phaser.GameObjects.Sprite,
    shadow: Phaser.GameObjects.Image | undefined,
    role: string | undefined,
    classId: string | null,
  ): boolean {
    if (actor.id === 0 && (classId !== "warrior" || actor.weapon !== "melee"))
      return false;
    const kind =
      actor.id === 0
        ? "warrior"
        : role === "flanker" || role === "ranged"
          ? "runner"
          : "raider";
    this.observe(actor, tick);
    const pose = classicActorFrame(
      actor,
      tick,
      deathAt,
      this.memory.get(actor.id)!,
      kind,
      cast,
    );
    const frame = this.frames.get(pose.name);
    if (!frame) throw Error(`Classic pose unavailable: ${pose.name}`);
    sprite
      .setTexture(`classic-${kind}`, pose.name)
      .setOrigin(
        actors.root[0]! / actors.cell.width,
        actors.root[1]! / actors.cell.height,
      )
      .setPosition(position.x, position.y)
      .setScale(1)
      .setAngle(0)
      .setAlpha(1)
      .clearTint()
      .setDepth(position.y + (actor.id === 0 ? 0.01 : 0));
    const fallen = pose.clip === "death" && pose.frame >= 9;
    const [left, , right, bottom] = frame.alphaBounds;
    shadow
      ?.setTexture("classic-contact")
      .setPosition(
        position.x + (fallen ? (left! + right!) / 2 - frame.root[0]! : 0),
        position.y + (fallen ? bottom! - frame.root[1]! - 4 : 2),
      )
      .setDisplaySize(
        fallen ? Math.max(38, (right! - left!) * 0.8) : 38,
        fallen ? 24 : 16,
      )
      .setDepth(position.y - 1)
      .setAlpha(fallen ? 0.7 : 1);
    return true;
  }
}
