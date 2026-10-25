export function validateWarriorMovement(directory?: string): Promise<{
  bytes: number;
  decodedBytes: number;
  frames: number;
  minimumMargin: number;
  flightFrames: number;
  walkCyclesPerSecond: number;
  runCyclesPerSecond: number;
}>;
