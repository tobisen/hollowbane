import { Buffer } from "node:buffer";

/** Crop only alpha; retain RGB/alpha exactly above the approved cutoff. */
export function cropEquipmentRgba(pixels, width, height) {
  if (pixels.length !== width * height * 4 || width < 1 || height < 1)
    throw Error("Invalid RGBA dimensions");
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (pixels[(y * width + x) * 4 + 3] > 4) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right < 0)
    return {
      pixels: Buffer.alloc(4),
      width: 1,
      height: 1,
      left: 0,
      top: 0,
      sourceWidth: width,
      sourceHeight: height,
    };
  const w = right - left + 1,
    h = bottom - top + 1,
    cropped = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const from = ((top + y) * width + left + x) * 4;
      if (pixels[from + 3] > 4)
        pixels.copy(cropped, (y * w + x) * 4, from, from + 4);
    }
  return {
    pixels: cropped,
    width: w,
    height: h,
    left,
    top,
    sourceWidth: width,
    sourceHeight: height,
  };
}

/** Stable offline shelf packing. Two transparent pixels separate each crop. */
export function packEquipmentRasters(rasters, maximum = 2048) {
  if (!rasters.length || maximum < 8 || (maximum & (maximum - 1)) !== 0)
    throw Error("Expected nonempty rasters and power-of-two atlas limit");
  const padding = 2,
    placements = {},
    names = new Set();
  let x = padding,
    y = padding,
    row = 0,
    usedWidth = 0;
  const ordered = [...rasters].sort(
    (a, b) =>
      b.height - a.height ||
      b.width - a.width ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  for (const raster of ordered) {
    if (names.has(raster.name)) throw Error(`Duplicate raster ${raster.name}`);
    names.add(raster.name);
    if (raster.width + padding * 2 > maximum)
      throw Error(`Raster exceeds atlas width: ${raster.name}`);
    if (x + raster.width + padding > maximum) {
      x = padding;
      y += row + padding * 2;
      row = 0;
    }
    if (y + raster.height + padding > maximum)
      throw Error("Equipment exceeds bounded atlas; split explicitly");
    placements[raster.name] = { x, y };
    x += raster.width + padding * 2;
    row = Math.max(row, raster.height);
    usedWidth = Math.max(usedWidth, x);
  }
  const power = (v) => 2 ** Math.ceil(Math.log2(v));
  const width = power(usedWidth - padding),
    height = power(y + row + padding),
    pixels = Buffer.alloc(width * height * 4);
  for (const raster of ordered) {
    const placement = placements[raster.name];
    for (let line = 0; line < raster.height; line++)
      raster.pixels.copy(
        pixels,
        ((placement.y + line) * width + placement.x) * 4,
        line * raster.width * 4,
        (line + 1) * raster.width * 4,
      );
  }
  return { pixels, width, height, placements };
}

/** Phaser trim metadata preserves the original body root across shared aliases. */
export function equipmentFrame(raster, placement, sourceSize, offset = [0, 0]) {
  const x = raster.left + offset[0],
    y = raster.top + offset[1];
  if (
    x < 0 ||
    y < 0 ||
    x + raster.width > sourceSize[0] ||
    y + raster.height > sourceSize[1]
  )
    throw Error("Trimmed attachment outside original source frame");
  return {
    frame: {
      x: placement.x,
      y: placement.y,
      w: raster.width,
      h: raster.height,
    },
    rotated: false,
    trimmed: true,
    spriteSourceSize: { x, y, w: raster.width, h: raster.height },
    sourceSize: { w: sourceSize[0], h: sourceSize[1] },
  };
}
