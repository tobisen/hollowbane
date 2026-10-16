import type Phaser from "phaser";
/** Procedural render textures are effects, not substitutes for environment artwork. */
export function createAtmosphereTextures(scene: Phaser.Scene): void {
  for (const [key, size, inner] of [
    ["mist", 256, "rgba(156,180,187,.16)"],
    ["warm-glow", 128, "rgba(255,166,66,.22)"],
  ] as const) {
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, size, size)!;
    const context = texture.context;
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    texture.refresh();
  }
}
export function addLanternGlow(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Image {
  return scene.add
    .image(x, y, "warm-glow")
    .setBlendMode(1)
    .setDepth(10000)
    .setAlpha(0.75);
}
