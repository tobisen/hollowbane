import Phaser from "phaser";
import assets from "./warrior-equipment-assets.json";
import type { WarriorPose } from "./warrior-pose";
import { warriorEquipmentFrame } from "./warrior-equipment-frame";

const shieldKey = "warrior-production-shield";
const bodyKey = "warrior-production-shield-body";
const entries = [
  [shieldKey, assets.textures.shield],
  [bodyKey, assets.textures.body],
] as const;
interface Lease {
  owners: Set<WarriorEquipment>;
  ready: Promise<boolean>;
}
const leases = new WeakMap<Phaser.Game, Lease>();

/** Optional two-texture presentation lease; never reads or writes game rules. */
export class WarriorEquipment {
  private lease: Lease | null = null;
  private overlay: Phaser.GameObjects.Sprite | null = null;
  private state: "absent" | "loading" | "ready" | "failed" = "absent";
  private disposed = false;
  private bodyVariant = false;
  loadMs = 0;
  get ready(): boolean {
    return this.state === "ready";
  }
  get loading(): boolean {
    return this.state === "loading";
  }
  get failed(): boolean {
    return this.state === "failed";
  }
  constructor(private scene: Phaser.Scene) {}
  private restore(body: Phaser.GameObjects.Sprite | undefined): void {
    this.bodyVariant = false;
    this.overlay?.setVisible(false).setTexture("arena-wanderer", 0);
    if (body?.texture.key === bodyKey)
      body
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
      for (const [key] of entries)
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      leases.delete(this.scene.game);
    });
  }
  /** Called only after the standard Warrior lease finishes, so queue settings
   * and loading barriers have one owner at a time. */
  sync(wanted: boolean, body: Phaser.GameObjects.Sprite | undefined): void {
    if (!wanted) {
      this.restore(body);
      this.release();
      this.state = "absent";
      return;
    }
    if (this.disposed || this.lease || this.failed) return;
    this.state = "loading";
    const begin = performance.now();
    let lease = leases.get(this.scene.game);
    if (!lease) {
      const owners = new Set<WarriorEquipment>();
      const ready = new Promise<boolean>((resolve) => {
        const previous = this.scene.load.maxParallelDownloads;
        this.scene.load.maxParallelDownloads = 2;
        for (const [key, entry] of entries)
          if (!this.scene.textures.exists(key))
            this.scene.load.atlas(
              key,
              import.meta.env.BASE_URL + entry.image,
              import.meta.env.BASE_URL + entry.atlas,
            );
        const finish = () => {
          this.scene.load.maxParallelDownloads = previous;
          resolve(entries.every(([key]) => this.scene.textures.exists(key)));
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
      this.state = ready ? "ready" : "failed";
      this.loadMs = performance.now() - begin;
      if (!ready) {
        this.restore(body);
        this.release();
      }
    });
  }
  draw(
    body: Phaser.GameObjects.Sprite,
    pose: WarriorPose,
    direction: string,
    root: readonly number[],
    position: { x: number; y: number },
    tint: number,
  ): boolean {
    const frame = warriorEquipmentFrame(pose, direction);
    if (!this.ready || frame === null) {
      this.restore(body);
      return false;
    }
    if (!this.overlay) {
      this.overlay = this.scene.add.sprite(0, 0, shieldKey, frame);
      this.scene.children.moveAbove(this.overlay, body);
    }
    if (pose.set === "death" && pose.frame >= assets.bodyFromDeathFrame)
      body
        .setTexture(bodyKey, frame)
        .setOrigin(root[0]! / body.width, root[1]! / body.height);
    this.bodyVariant = body.texture.key === bodyKey;
    this.overlay
      .setTexture(shieldKey, frame)
      .setOrigin(root[0]! / this.overlay.width, root[1]! / this.overlay.height)
      .setPosition(position.x, position.y)
      .setDepth(position.y)
      .setTint(tint)
      .setScale(0.5)
      .setVisible(true);
    return true;
  }
  get resources(): {
    textures: number;
    decodedBytes: number;
    visible: boolean;
    bodyVariant: boolean;
  } {
    const loaded = entries.filter(([key]) => this.scene.textures.exists(key));
    return {
      textures: loaded.length,
      decodedBytes: loaded.reduce((n, [, entry]) => n + entry.decodedBytes, 0),
      visible: this.overlay?.visible ?? false,
      bodyVariant: this.bodyVariant,
    };
  }
  dispose(body: Phaser.GameObjects.Sprite | undefined): void {
    this.restore(body);
    this.disposed = true;
    this.release();
    this.overlay?.destroy();
    this.overlay = null;
  }
}
