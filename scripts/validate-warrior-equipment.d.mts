export function validateWarriorEquipment(directory?: string): Promise<{
  pngBytes: number;
  decodedBytes: number;
  atlases: number;
  frames: number;
  bodyFrames: number;
}>;
