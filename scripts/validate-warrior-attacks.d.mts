export function validateWarriorAttacks(directory?: string): Promise<{
  frames: number;
  clips: number;
  bytes: number;
  decodedBytes: number;
  minimumMargin: number;
}>;
