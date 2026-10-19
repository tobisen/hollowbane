import { expect, it, vi } from "vitest";
import {
  GENERATION_ATTEMPTS,
  generateValidated,
  generationAttemptSeed,
} from "./generation-retry";
import * as validation from "./generation-validation";
import { generateDungeon, validDungeon } from "./dungeon-layout";
import { generateWilderness } from "./wilderness-layout";

it("bounds work and refuses an invalid fallback without swallowing input errors", () => {
  const candidate = vi.fn((attempt: number) => attempt);
  const fallback = vi.fn(() => -1);
  expect(() => generateValidated(candidate, () => false, fallback)).toThrow(
    "Invalid authored generation fallback",
  );
  expect(candidate.mock.calls).toEqual([[0], [1], [2]]);
  expect(fallback).toHaveBeenCalledTimes(1);
  candidate.mockImplementation(() => {
    throw Error("bad input");
  });
  expect(() => generateValidated(candidate, () => true, fallback)).toThrow(
    "bad input",
  );
  expect(fallback).toHaveBeenCalledTimes(1);
  for (const seed of [0, 42, 0xffffffff]) {
    expect(generationAttemptSeed(seed, 0)).toBe(seed);
    expect(
      new Set(
        Array.from({ length: GENERATION_ATTEMPTS }, (_, i) =>
          generationAttemptSeed(seed, i),
        ),
      ).size,
    ).toBe(GENERATION_ATTEMPTS);
  }
  expect(() => generationAttemptSeed(-1, 0)).toThrow();
  expect(() => generationAttemptSeed(0, GENERATION_ATTEMPTS)).toThrow();
});

it.each(["forest", "crypt"])(
  "retries %s reproducibly while retaining the registered area seed",
  (kind) => {
    const generate = () =>
      kind === "forest"
        ? generateWilderness("haunted-forest", 42)
        : generateDungeon(42);
    const original = generate();
    const validate = vi.spyOn(validation, "validGeneratedPlacement");
    try {
      validate.mockReturnValueOnce(false);
      const retried = generate();
      expect(retried.fallback).toBe(false);
      expect(retried.layout.map.seed).toBe(original.layout.map.seed);
      expect(retried.layout).not.toEqual(original.layout);
      expect(validation.validGeneratedPlacement(retried.layout)).toBe(true);
      if ("rooms" in retried) expect(validDungeon(retried)).toBe(true);
      validate.mockReturnValueOnce(false);
      expect(generate()).toEqual(retried);
    } finally {
      validate.mockRestore();
    }
  },
);
