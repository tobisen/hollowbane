import type Phaser from "phaser";
import type { Navigation } from "../world/navigation";
/** Once-per-scene original floor/light artwork; no per-frame mist or lighting pass. */
export function createPolishGround(
  scene: Phaser.Scene,
  nav: Navigation,
  flat = false,
  noBackdrop = false,
): void {
  const source = scene.textures
      .get("arena-plate")
      .getSourceImage() as HTMLImageElement,
    w = source.width,
    h = source.height;
  if (!noBackdrop)
    for (const [x, y, width, height] of [
      [0, 0, w, 260],
      [0, 830, w, h - 830],
      [0, 260, 230, 570],
      [1300, 260, w - 1300, 570],
    ])
      if (width! > 0 && height! > 0)
        scene.add
          .image(0, 0, "arena-plate")
          .setOrigin(0)
          .setCrop(x!, y!, width!, height!)
          .setAlpha(0.46)
          .setDepth(-1000);
  const floor = scene.add.graphics();
  floor.fillStyle(0x1b292d, 1).fillRect(0, 0, 1070, 570);
  if (!flat) {
    for (let row = 0; row < 15; row++)
      for (let col = 0; col < 14; col++) {
        const x = col * 84 - (row % 2) * 42,
          y = row * 40,
          tone = (row * 7 + col * 13) % 4;
        floor
          .fillStyle([0x223238, 0x263439, 0x1e2d33, 0x29363a][tone]!, 1)
          .fillRect(
            Math.max(3, x + 2),
            y + 2,
            Math.min(80, 1067 - Math.max(3, x + 2)),
            36,
          )
          .lineStyle(1, 0x8b9790, 0.12)
          .lineBetween(
            Math.max(3, x + 3),
            y + 3,
            Math.min(1066, x + 80),
            y + 3,
          );
      }
    floor
      .lineStyle(2, 0xa18d60, 0.6)
      .strokeRect(9, 9, 1052, 552)
      .lineStyle(1, 0xa18d60, 0.25)
      .strokeRect(16, 16, 1038, 538);
    for (const [x, y] of [
      [60, 55],
      [1010, 55],
      [60, 515],
      [1010, 515],
    ]) {
      for (let i = 3; i > 0; i--)
        floor.fillStyle(0xc6ae73, 0.018).fillEllipse(x!, y!, i * 48, i * 25);
      floor
        .lineStyle(1, 0xb59a62, 0.5)
        .strokeEllipse(x!, y!, 22, 11)
        .lineBetween(x! - 16, y!, x! + 16, y!);
    }
    floor
      .lineStyle(1, 0x91a49c, 0.13)
      .strokeEllipse(535, 285, 330, 165)
      .strokeEllipse(535, 285, 350, 175);
  }
  floor.generateTexture("sable-ground", 1070, 570);
  floor.destroy();
  scene.add.image(230, 260, "sable-ground").setOrigin(0).setDepth(-999);
  const shadow = scene.add.graphics();
  shadow
    .fillStyle(0x03080b, 0.1)
    .fillEllipse(32, 16, 62, 28)
    .fillStyle(0x03080b, 0.17)
    .fillEllipse(32, 16, 45, 19)
    .fillStyle(0x03080b, 0.3)
    .fillEllipse(32, 16, 29, 10);
  shadow.generateTexture("sable-contact-shadow", 64, 32);
  shadow.destroy();
  for (const o of nav.obstacles) {
    const g = scene.add.graphics().setDepth(o.y + o.ry);
    g.fillStyle(0x090f13, 0.5).fillEllipse(
      o.x,
      o.y + 5,
      o.rx * 2.3,
      o.ry * 1.9,
    );
    g.fillStyle(0x354247, 1).fillRoundedRect(
      o.x - o.rx,
      o.y - o.ry - 12,
      o.rx * 2,
      o.ry * 2,
      7,
    );
    g.fillStyle(0x596164, 1)
      .fillEllipse(o.x, o.y - o.ry - 11, o.rx * 2, 13)
      .lineStyle(1, 0x9c9a84, 0.7)
      .strokeEllipse(o.x, o.y - o.ry - 11, o.rx * 2, 13);
    g.lineStyle(1, 0x161e23, 0.8)
      .lineBetween(
        o.x - o.rx + 3,
        o.y - o.ry + 9,
        o.x + o.rx - 3,
        o.y - o.ry + 9,
      )
      .lineBetween(o.x + 3, o.y - o.ry + 9, o.x + 3, o.y + o.ry - 13);
  }
}
