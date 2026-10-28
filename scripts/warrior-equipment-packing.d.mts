import type { Buffer } from "node:buffer";
export interface EquipmentRaster {
  pixels: Buffer;
  width: number;
  height: number;
  left: number;
  top: number;
  sourceWidth: number;
  sourceHeight: number;
}
export function cropEquipmentRgba(
  pixels: Buffer,
  width: number,
  height: number,
): EquipmentRaster;
export function packEquipmentRasters(
  rasters: (EquipmentRaster & { name: string })[],
  maximum?: number,
): {
  pixels: Buffer;
  width: number;
  height: number;
  placements: Record<string, { x: number; y: number }>;
};
export function equipmentFrame(
  raster: EquipmentRaster,
  placement: { x: number; y: number },
  sourceSize: [number, number],
  offset?: [number, number],
): {
  frame: { x: number; y: number; w: number; h: number };
  rotated: false;
  trimmed: true;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
};
