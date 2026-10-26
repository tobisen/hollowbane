export function validateWarriorAbilities(directory?: string): Promise<
  Record<
    string,
    {
      frames: number;
      clips: number;
      bytes: number;
      decodedBytes: number;
      minimumMargin: number;
    }
  >
>;
