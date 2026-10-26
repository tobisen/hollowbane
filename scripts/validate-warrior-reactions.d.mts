export function validateWarriorReactions(directory?: string): Promise<
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
