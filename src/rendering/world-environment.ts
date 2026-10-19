import Phaser from "phaser";
import type { AreaLayout } from "../simulation/area-anchors";
import { appearanceHash, environmentProps } from "../world/environment-view";
import { onGround } from "../world/navigation";
import { footDepth, isOccluding } from "../world/depth";
import type { Point } from "../world/isometric";
/** Static layout decoration with bounded near-player canopy fading. */
export class WorldEnvironment {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private props: {
    image: Phaser.GameObjects.Image;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  constructor(private scene: Phaser.Scene) {}
  draw(layout: AreaLayout): void {
    for (const object of this.objects) object.destroy();
    this.objects = [];
    this.props = [];
    const graveyard = layout.map.area === "forgotten-graveyard";
    if (layout.map.area !== "haunted-forest" && !graveyard) return;
    this.floorTexture();
    const t = layout.map.terrain;
    for (let y = 0; y < t.height; y++)
      for (let x = 0; x < t.width; x++) {
        const ground = t.cells[y * t.width + x] === "ground",
          h = appearanceHash(layout.map.seed, x, y);
        const p = onGround({
          x: t.origin.x + (x + 0.5) * t.cellSize,
          y: t.origin.y + (y + 0.5) * t.cellSize,
        });
        const edge =
          ground &&
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].some(
            ([dx, dy]) => t.cells[(y + dy!) * t.width + x + dx!] === "solid",
          );
        this.objects.push(
          this.scene.add
            .image(p.x, p.y, "world-earth")
            .setDisplaySize(128 * t.cellSize, 64 * t.cellSize)
            .setTint(
              ground
                ? edge
                  ? 0x788567
                  : [0x9e9779, 0x8d8b6c, 0xa2997c][h % 3]!
                : 0x384f37,
            )
            .setDepth(-998),
        );
      }
    const detail = this.scene.add.graphics().setDepth(-997);
    this.objects.push(detail);
    for (const [index, prop] of environmentProps(layout).entries()) {
      const p = onGround(prop),
        oak = prop.kind === "oak" || prop.kind === "arch",
        frame = prop.kind === "tree" ? 1 : prop.kind === "monument" ? 0 : 2;
      detail
        .fillStyle(0x040b08, 0.35)
        .fillEllipse(p.x, p.y, prop.width * 0.65, prop.width * 0.18);
      const image = this.scene.add
        .image(
          p.x,
          p.y,
          oak
            ? prop.kind === "arch"
              ? "world-arch"
              : "world-oak"
            : "world-props",
          oak ? 0 : frame,
        )
        .setOrigin(0.5, oak ? 984 / 1024 : 496 / 512)
        .setDisplaySize(prop.width, prop.width)
        .setDepth(footDepth(p.y, index));
      if (prop.kind === "rock")
        image.setTint(0x969c8c).setScale(image.scaleX, image.scaleY * 0.55);
      this.objects.push(image);
      this.props.push({
        image,
        x: p.x,
        y: p.y,
        width: prop.width,
        height: prop.width,
      });
      // Fine rooted vegetation and sparse ground mist; static and locally bounded.
      detail.lineStyle(1, 0x5c7050, 0.7);
      for (let stem = 0; stem < 5; stem++)
        detail.lineBetween(
          p.x + (stem - 2) * 5,
          p.y,
          p.x + (stem - 2) * 8,
          p.y - 5 - ((index + stem) % 7),
        );
      if (graveyard && prop.kind === "monument" && index % 4 === 0) {
        detail.lineStyle(2, 0x6c7374, 0.85);
        for (let rail = 0; rail < 5; rail++)
          detail.lineBetween(
            p.x - 24 + rail * 12,
            p.y - 3,
            p.x - 24 + rail * 12,
            p.y - 27,
          );
        detail.lineBetween(p.x - 24, p.y - 19, p.x + 24, p.y - 19);
      }
      if (index % 18 === 0)
        detail
          .fillStyle(0xa7b8ad, 0.035)
          .fillEllipse(p.x + 45, p.y + 15, 180, 35);
    }
    for (const exit of layout.exits) {
      const p = onGround(exit.trigger);
      this.objects.push(
        this.scene.add
          .text(
            p.x,
            p.y + 38,
            graveyard
              ? exit.id === "crypt"
                ? "ANCIENT CRYPT"
                : "HAUNTED FOREST"
              : exit.id === "camp"
                ? "ASHEN REFUGE"
                : "GRAVEYARD",
            {
              fontFamily: "Georgia",
              fontSize: "12px",
              color: "#d5cfb0",
              backgroundColor: "#17201a",
              padding: { x: 5, y: 3 },
            },
          )
          .setOrigin(0.5, 1)
          .setDepth(1900),
      );
    }
  }
  update(position: Point): void {
    const actor = onGround(position);
    for (const prop of this.props)
      prop.image.setAlpha(isOccluding(actor, prop) ? 0.32 : 1);
  }
  private floorTexture(): void {
    if (this.scene.textures.exists("world-earth")) return;
    const texture = this.scene.textures.createCanvas("world-earth", 128, 64);
    if (!texture) throw Error("Cannot create earth texture");
    const ctx = texture.context;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(128, 32);
    ctx.lineTo(64, 64);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      this.scene.textures
        .get("arena-plate")
        .getSourceImage() as HTMLImageElement,
      475,
      388,
      128,
      64,
      0,
      0,
      128,
      64,
    );
    texture.refresh();
  }
}
