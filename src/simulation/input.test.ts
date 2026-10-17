import { expect, it } from "vitest";
import {
  defaultPreferences,
  movementVector,
  readPreferences,
  validateBindings,
} from "./input";
it("maps configurable physical codes and normalizes aliases/opposed inputs", () => {
  const b = defaultPreferences().bindings;
  expect(movementVector(new Set(["KeyW", "ArrowUp", "KeyD"]), b)).toEqual({
    x: 1,
    y: -1,
  });
  expect(movementVector(new Set(["KeyW", "KeyS"]), b)).toEqual({ x: 0, y: 0 });
  b.north = ["KeyZ"];
  expect(movementVector(new Set(["KeyZ"]), validateBindings(b)).y).toBe(-1);
});
it("round trips preferences without transient commands and rejects corrupted or stale storage", () => {
  const p = defaultPreferences();
  p.gait = "run";
  p.config.runSpeed = 7;
  expect(readPreferences(JSON.stringify(p))).toEqual(p);
  for (const text of [
    null,
    "{",
    "null",
    JSON.stringify({ ...p, version: 2 }),
    JSON.stringify({ ...p, config: { ...p.config, walkSpeed: -1 } }),
    JSON.stringify({ ...p, bindings: { ...p.bindings, north: ["Space"] } }),
  ])
    expect(readPreferences(text)).toEqual(defaultPreferences());
});
it("rejects duplicate, unsupported or missing actions, including future ability reservations", () => {
  const p = defaultPreferences();
  p.bindings.ability1 = ["KeyW"];
  expect(() => validateBindings(p.bindings)).toThrow();
  p.bindings.ability1 = ["F5"];
  expect(() => validateBindings(p.bindings)).toThrow();
});
