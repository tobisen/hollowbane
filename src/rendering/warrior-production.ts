import Phaser from "phaser";
import assets from "./warrior-assets.json";
import { WarriorEquipment } from "./warrior-equipment";
import type { CombatActor } from "../simulation/combat";
import type { Cast } from "../simulation/skills";
import {
  warriorPose,
  WARRIOR_DIRECTIONS,
  type WarriorMotion,
  type WarriorSet,
} from "./warrior-pose";

const sets = Object.keys(assets) as WarriorSet[];
const key = (set: WarriorSet, direction: string) =>
  `warrior-production-${set}-${direction}`;
const keys = sets.flatMap((set) => WARRIOR_DIRECTIONS.map((d) => key(set, d)));
const decodedBytes = Object.values(assets)
  .flatMap((s) => Object.values(s.views))
  .reduce((n, v) => n + v.decodedBytes, 0);
interface Lease {
  owners: Set<WarriorProduction>;
  ready: Promise<boolean>;
}
const leases = new WeakMap<Phaser.Game, Lease>();

declare global {
  interface Window {
    hollowbaneWarriorProduction?: {
      mode: "legacy" | "loading" | "warrior";
      reason: string;
      textures: number;
      decodedBytes: number;
      loadMs: number;
      pose: ReturnType<typeof warriorPose> | null;
      equipment: {
        textures: number;
        decodedBytes: number;
        visible: boolean;
        bodyVariant: boolean;
      };
      equipmentLoadMs: number;
      setLegacy(enabled: boolean): void;
    };
  }
}

/** Presentation-only owner. All directions/states preload together at a safe
 * loading barrier, so the first attack/hit/death cannot wait for an atlas.
 * Leases protect shared textures; no canvas/Image copies or callbacks into combat.
 */
export class WarriorProduction {
  private lease: Lease | null = null;
  private state: "legacy" | "loading" | "warrior" = "legacy";
  private reason = "other-class";
  private failed = false;
  private disposed = false;
  private loadMs = 0;
  private pose: ReturnType<typeof warriorPose> | null = null;
  private equipment: WarriorEquipment;
  private overlay: HTMLElement;
  legacy = false;
  constructor(
    private scene: Phaser.Scene,
    root: HTMLElement,
  ) {
    this.equipment = new WarriorEquipment(scene);
    try {
      this.legacy = sessionStorage.getItem("hollowbane-warrior-legacy") === "1";
    } catch {
      /* Storage may be unavailable; default remains supported Warrior. */
    }
    this.overlay = document.createElement("div");
    this.overlay.setAttribute("role", "status");
    this.overlay.style.cssText =
      "position:fixed;inset:0;z-index:1000;display:none;place-items:center;background:#101714ed;color:#eadcba;font:20px Georgia";
    this.overlay.textContent = "Preparing Warrior…";
    root.append(this.overlay);
  }
  get loading(): boolean {
    return this.state === "loading" || this.equipment.loading;
  }
  private restore(sprite: Phaser.GameObjects.Sprite | undefined): void {
    if (sprite?.texture.key.startsWith("warrior-production-"))
      sprite
        .setTexture("arena-wanderer", 0)
        .setOrigin(0.5, 112 / 128)
        .setScale(0.93)
        .setAngle(0)
        .setAlpha(1);
  }
  private release(): void {
    const lease = this.lease;
    this.lease = null;
    if (!lease) return;
    lease.owners.delete(this);
    void lease.ready.then(() => {
      if (lease.owners.size || leases.get(this.scene.game) !== lease) return;
      for (const name of keys)
        if (this.scene.textures.exists(name)) this.scene.textures.remove(name);
      leases.delete(this.scene.game);
    });
  }
  sync(reason: string, sprite: Phaser.GameObjects.Sprite | undefined): void {
    if (reason !== this.reason) this.failed = false;
    this.reason = reason;
    const wantsEquipment = reason === "supported-shield";
    if (reason !== "supported" && !wantsEquipment) {
      this.restore(sprite);
      this.equipment.sync(false, sprite);
      this.release();
      this.state = "legacy";
      this.failed = false;
      this.pose = null;
    } else {
      if (!wantsEquipment) this.equipment.sync(false, sprite);
      if (!this.lease && !this.failed) {
        this.state = "loading";
        const begin = performance.now();
        let lease = leases.get(this.scene.game);
        if (!lease) {
          const owners = new Set<WarriorProduction>();
          const ready = new Promise<boolean>((resolve) => {
            const previousParallel = this.scene.load.maxParallelDownloads;
            this.scene.load.maxParallelDownloads = 2;
            for (const set of sets)
              for (const direction of WARRIOR_DIRECTIONS) {
                const manifest = assets[set];
                if (!this.scene.textures.exists(key(set, direction)))
                  this.scene.load.spritesheet(
                    key(set, direction),
                    import.meta.env.BASE_URL + manifest.views[direction].file,
                    {
                      frameWidth: manifest.width,
                      frameHeight: manifest.height,
                    },
                  );
              }
            const finish = () => {
              this.scene.load.maxParallelDownloads = previousParallel;
              resolve(keys.every((name) => this.scene.textures.exists(name)));
              this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, finish);
            };
            this.scene.load.once("complete", finish);
            this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);
            this.scene.load.start();
          });
          lease = { owners, ready };
          leases.set(this.scene.game, lease);
        }
        lease.owners.add(this);
        this.lease = lease;
        const acquired = lease;
        void lease.ready.then((ready) => {
          if (this.disposed || this.lease !== acquired) return;
          this.loadMs = performance.now() - begin;
          this.state = ready ? "warrior" : "legacy";
          this.failed = !ready;
          if (!ready) this.release();
          else this.equipment.sync(this.reason === "supported-shield", sprite);
        });
      }
      if (this.state === "warrior") this.equipment.sync(wantsEquipment, sprite);
      if (wantsEquipment && this.equipment.failed) {
        this.restore(sprite);
        this.equipment.sync(false, sprite);
        this.release();
        this.failed = true;
        this.state = "legacy";
        this.pose = null;
      }
    }
    this.overlay.style.display = this.loading ? "grid" : "none";
    this.publish();
  }
  draw(
    sprite: Phaser.GameObjects.Sprite,
    actor: CombatActor,
    tick: number,
    deathAt: number | null,
    cast: Cast | null,
    motion: WarriorMotion,
    position: { x: number; y: number },
    tint = 0xffffff,
  ): boolean {
    if (
      this.state !== "warrior" ||
      (this.reason === "supported-shield" && !this.equipment.ready)
    )
      return false;
    const pose = warriorPose(actor, tick, deathAt, cast, motion);
    const manifest = assets[pose.set];
    sprite
      .setTexture(
        key(pose.set, WARRIOR_DIRECTIONS[actor.controller.walker.direction]!),
        pose.frame,
      )
      .setOrigin(0.5, manifest.root[1]! / manifest.height)
      .setScale(0.5)
      .setAngle(0)
      .setAlpha(1)
      .setPosition(position.x, position.y)
      .setDepth(position.y);
    if (
      this.reason === "supported-shield" &&
      !this.equipment.draw(
        sprite,
        pose,
        WARRIOR_DIRECTIONS[actor.controller.walker.direction]!,
        manifest.root,
        position,
        tint,
      )
    )
      return false;
    this.pose = pose;
    this.publish();
    return true;
  }
  private publish(): void {
    if (this.disposed) return;
    const baseTextures = keys.filter((name) =>
      this.scene.textures.exists(name),
    ).length;
    const equipment = this.equipment.resources;
    const mode = this.loading ? "loading" : this.state;
    window.hollowbaneWarriorProduction = {
      mode,
      reason: this.failed ? "asset-load-failed" : this.reason,
      textures: baseTextures + equipment.textures,
      decodedBytes:
        (baseTextures === keys.length ? decodedBytes : 0) +
        equipment.decodedBytes,
      loadMs: this.loadMs,
      pose: this.pose,
      equipment,
      equipmentLoadMs: this.equipment.loadMs,
      setLegacy: (enabled) => {
        this.legacy = enabled;
        try {
          sessionStorage.setItem(
            "hollowbane-warrior-legacy",
            enabled ? "1" : "0",
          );
        } catch {
          /* Debug override works for this scene without storage. */
        }
      },
    };
    document.documentElement.dataset.warriorRenderer = mode;
  }
  dispose(sprite: Phaser.GameObjects.Sprite | undefined): void {
    this.restore(sprite);
    this.equipment.dispose(sprite);
    this.disposed = true;
    this.release();
    this.overlay.remove();
    delete window.hollowbaneWarriorProduction;
    delete document.documentElement.dataset.warriorRenderer;
  }
}
