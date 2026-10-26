export function validateWarriorDirections(directory?: string): Promise<
  Record<
    string,
    {
      frames: number;
      bytes: number;
      decodedBytes: number;
      minimumMargin: number;
    }
  >
>;
