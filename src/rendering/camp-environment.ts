import Phaser from "phaser";
import type { AreaLayout } from "../simulation/area-anchors";
import { onGround } from "../world/navigation";
import { footDepth } from "../world/depth";
import { campProps } from "../world/camp-view";
/** Static scenery rebuilt only on area changes. No full-screen lighting or fog passes. */
export class CampEnvironment {
  private objects: Phaser.GameObjects.GameObject[] = [];
  constructor(private scene: Phaser.Scene) {}
  clear(): void {
    for (const object of this.objects) object.destroy();
    this.objects = [];
  }
  draw(layout: AreaLayout): void {
    this.clear();
    if (layout.map.area !== "ashen-refuge") return;
    this.createFloorTexture();
    const ground = this.scene.add.graphics().setDepth(-998);
    this.objects.push(ground);
    const t = layout.map.terrain;
    // A dim textured apron seats peripheral scenery in the landscape. It is presentation
    // outside the raised navigable paving, not an extension of the collision map.
    for (let y = -3; y < t.height + 3; y++)
      for (let x = -3; x < t.width + 3; x++) {
        if (x >= 0 && y >= 0 && x < t.width && y < t.height) continue;
        const distance = Math.max(-x, -y, x - t.width + 1, y - t.height + 1);
        const p = onGround({
          x: t.origin.x + (x + 0.5) * t.cellSize,
          y: t.origin.y + (y + 0.5) * t.cellSize,
        });
        this.objects.push(
          this.scene.add
            .image(p.x, p.y, "world-camp-stone")
            .setDisplaySize(128 * t.cellSize, 64 * t.cellSize)
            .setTint(0x56604b)
            .setAlpha((4 - distance) * 0.2)
            .setDepth(-999.5),
        );
      }

    for (let y = 0; y < t.height; y++)
      for (let x = 0; x < t.width; x++) {
        if (t.cells[y * t.width + x] !== "ground") continue;
        const p = onGround({
          x: t.origin.x + (x + 0.5) * t.cellSize,
          y: t.origin.y + (y + 0.5) * t.cellSize,
        });
        this.objects.push(
          this.scene.add
            .image(p.x, p.y, "world-camp-stone")
            .setDisplaySize(128 * t.cellSize, 64 * t.cellSize)
            .setDepth(-998),
        );
      }
    for (const [index, prop] of campProps(layout).entries()) {
      const p = onGround(prop);
      // Contact shadows sit on the floor; feet use the same screen-y depth as actors.
      ground
        .fillStyle(0x020509, 0.4)
        .fillEllipse(p.x, p.y, prop.width * 0.65, prop.width * 0.16);
      const image = this.scene.add
        .image(p.x, p.y, prop.texture, prop.frame)
        .setOrigin(0.5, prop.texture === "world-props" ? 496 / 512 : 984 / 1024)
        .setDisplaySize(prop.width, prop.width)
        .setDepth(footDepth(p.y, 100 + index));
      this.objects.push(image);
      if (
        prop.texture === "world-camp-fire" ||
        (prop.texture === "world-props" && prop.frame === 3)
      ) {
        // Three small static amber pools, no per-frame transparent overdraw.
        for (let ring = 3; ring > 0; ring--)
          ground
            .fillStyle(0xe5a34f, 0.055)
            .fillEllipse(p.x, p.y, ring * 90, ring * 45);
      }
    }
    for (const exit of layout.exits) {
      const p = onGround(exit.trigger);
      ground.lineStyle(2, 0xd7bc80, 0.8).strokeEllipse(p.x, p.y, 64, 32);
      const sign = this.scene.add
        .text(p.x, p.y + 38, "HAUNTED FOREST", {
          fontFamily: "Georgia",
          fontSize: "12px",
          color: "#e4ce9e",
          backgroundColor: "#141c20",
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5, 1)
        .setDepth(1900);
      this.objects.push(sign);
    }
  }
  private createFloorTexture(): void {
    if (this.scene.textures.exists("world-camp-stone")) return;
    const texture = this.scene.textures.createCanvas(
      "world-camp-stone",
      128,
      64,
    );
    if (!texture) throw Error("Cannot create camp floor texture");
    const ctx = texture.context;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(128, 32);
    ctx.lineTo(64, 64);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.clip();
    // Reuse only an unobstructed flagstone patch, never the fixed environment map.
    ctx.drawImage(
      this.scene.textures
        .get("arena-plate")
        .getSourceImage() as HTMLImageElement,
      650,
      365,
      128,
      64,
      0,
      0,
      128,
      64,
    );
    ctx.fillStyle = "rgba(25,35,38,0.18)";
    ctx.fillRect(0, 0, 128, 64);
    texture.refresh();
  }
}
