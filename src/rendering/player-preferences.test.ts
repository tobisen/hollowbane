import { expect, it } from "vitest";
import { defaultPreferences } from "../simulation/input";
import {
  readPresentation,
  safePlayerBindings,
  validatePlayerBindings,
} from "./player-preferences";

it("accepts bounded presentation preferences and rejects corrupt or unsupported data atomically", () => {
  const good = { version: 1, quality: "balanced", volume: 0.35, muted: true };
  expect(readPresentation(JSON.stringify(good))).toEqual(good);
  for (const value of [
    null,
    "{",
    "[]",
    JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, volume: 1.01 }),
    JSON.stringify({ ...good, muted: "yes" }),
    JSON.stringify({ ...good, quality: "ultra" }),
  ])
    expect(readPresentation(value)).toEqual(readPresentation(null));
});
it("reuses movement binding validation while reserving gameplay actions and retaining arrow aliases", () => {
  const b = defaultPreferences().bindings;
  b.north = ["KeyZ", "ArrowUp"];
  b.toggleRun = ["KeyG"];
  b.stop = ["KeyB"];
  expect(validatePlayerBindings(b)).toEqual(b);
  for (const code of [
    "KeyE",
    "KeyJ",
    "KeyN",
    "KeyQ",
    "KeyX",
    "KeyP",
    "KeyM",
    "KeyT",
    "KeyF",
    "KeyV",
    "Escape",
  ]) {
    const invalid = { ...b, north: [code, "ArrowUp"] };
    expect(() => validatePlayerBindings(invalid)).toThrow();
    expect(safePlayerBindings(invalid)).toEqual(defaultPreferences().bindings);
  }
  expect(() => validatePlayerBindings({ ...b, north: ["KeyA"] })).toThrow();
});
