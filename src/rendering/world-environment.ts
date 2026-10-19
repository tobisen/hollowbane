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
    const dungeon = layout.map.area === "ancient-crypt";
    if (layout.map.area !== "haunted-forest" && !graveyard && !dungeon) return;
    this.floorTexture();
    if (dungeon) this.wallTexture();
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
              dungeon
                ? ground
                  ? [0xaba7a8, 0x969aab, 0x9c9aa1][h % 3]!
                  : 0x252930
                : ground
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
        frame =
          prop.kind === "tree"
            ? 1
            : prop.kind === "monument" || prop.kind === "pillar"
              ? 0
              : prop.kind === "lamp"
                ? 3
                : 2;
      detail
        .fillStyle(0x040b08, 0.35)
        .fillEllipse(p.x, p.y, prop.width * 0.65, prop.width * 0.18);
      const image = this.scene.add
        .image(
          p.x,
          p.y,
          prop.kind === "wall"
            ? "world-wall"
            : oak
              ? prop.kind === "arch"
                ? "world-arch"
                : "world-oak"
              : "world-props",
          oak || prop.kind === "wall" ? 0 : frame,
        )
        .setOrigin(
          0.5,
          prop.kind === "wall" ? 120 / 128 : oak ? 984 / 1024 : 496 / 512,
        )
        .setDisplaySize(
          prop.width,
          prop.kind === "pillar" ? prop.width * 1.7 : prop.width,
        )
        .setDepth(footDepth(p.y, index));
      if (prop.kind === "rock")
        image.setTint(0x969c8c).setScale(image.scaleX, image.scaleY * 0.55);
      this.objects.push(image);
      this.props.push({
        image,
        x: p.x,
        y: p.y,
        width: prop.width,
        height: prop.kind === "pillar" ? prop.width * 1.7 : prop.width,
      });
      if (dungeon && (prop.kind === "lamp" || prop.kind === "arch")) {
        for (let ring = 2; ring > 0; ring--)
          detail
            .fillStyle(0xe3a257, 0.065)
            .fillEllipse(p.x, p.y + 4, ring * 100, ring * 50);
      }
      // Fine rooted vegetation and sparse ground mist; static and locally bounded.
      detail.lineStyle(1, 0x5c7050, 0.7);
      for (let stem = 0; stem < (dungeon ? 0 : 5); stem++)
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
      if (index % (dungeon ? 60 : 18) === 0)
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
            dungeon
              ? "FORGOTTEN GRAVEYARD"
              : graveyard
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
  private wallTexture(): void {
    if (this.scene.textures.exists("world-wall")) return;
    const texture = this.scene.textures.createCanvas("world-wall", 128, 128);
    if (!texture) throw Error("Cannot create stone wall texture");
    const ctx = texture.context,
      source = this.scene.textures
        .get("arena-plate")
        .getSourceImage() as HTMLImageElement;
    const face = (points: number[][], shade: string) => {
      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], i) =>
        i ? ctx.lineTo(x!, y!) : ctx.moveTo(x!, y!),
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(source, 650, 365, 128, 64, 0, 0, 128, 128);
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "rgba(15,20,27,0.6)";
      ctx.lineWidth = 2;
      for (let y = 45; y < 128; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(128, y);
        ctx.stroke();
      }
      ctx.restore();
    };
    face(
      [
        [0, 40],
        [64, 72],
        [64, 120],
        [0, 88],
      ],
      "rgba(12,20,29,0.32)",
    );
    face(
      [
        [64, 72],
        [128, 40],
        [128, 88],
        [64, 120],
      ],
      "rgba(6,12,20,0.58)",
    );
    face(
      [
        [0, 40],
        [64, 8],
        [128, 40],
        [64, 72],
      ],
      "rgba(69,75,87,0.15)",
    );
    texture.refresh();
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
