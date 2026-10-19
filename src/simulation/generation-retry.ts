/** Fixed work budget, independent of wall time and the character/loot random stream. */
export const GENERATION_ATTEMPTS = 3;

/** Attempt zero preserves the original generator stream; later streams wrap uint32. */
export function generationAttemptSeed(seed: number, attempt: number): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Error("Invalid generation seed");
  if (
    !Number.isInteger(attempt) ||
    attempt < 0 ||
    attempt >= GENERATION_ATTEMPTS
  )
    throw Error("Invalid generation attempt");
  return (seed + Math.imul(attempt, 0x9e3779b9)) >>> 0;
}

/** Programming/input errors propagate; only rejected geometry is retried. */
export function generateValidated<T>(
  candidate: (attempt: number) => T,
  valid: (value: T) => boolean,
  fallback: () => T,
): T {
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
    const value = candidate(attempt);
    if (valid(value)) return value;
  }
  const value = fallback();
  if (!valid(value)) throw Error("Invalid authored generation fallback");
  return value;
}
