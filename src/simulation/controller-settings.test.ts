import { describe, it, expect } from "vitest";
import {
  defaultControllerSettings,
  readControllerSettings,
  validateControllerSettings,
} from "./controller-settings";
describe("controller persistence", () => {
  it("round trips custom axes, sticks, profile, selected device and remapping", () => {
    const s = defaultControllerSettings();
    s.profile = "playstation";
    s.selected = 1;
    s.bindings.primary = [16];
    s.axes = [2, 3, 0, 1];
    s.move.deadzone = 0.3;
    expect(readControllerSettings(JSON.stringify(s))).toEqual(s);
  });
  it("rejects conflicts atomically and survives malformed or missing storage", () => {
    const s = defaultControllerSettings();
    s.bindings.primary = [0];
    expect(() => validateControllerSettings(s)).toThrow(/conflict/);
    for (const text of [null, "{", "null", JSON.stringify(s)])
      expect(readControllerSettings(text)).toEqual(defaultControllerSettings());
  });
  it("validates axes, calibration offsets and stick settings", () => {
    const s = defaultControllerSettings();
    s.axes = [0, 0, 2, 3];
    expect(() => validateControllerSettings(s)).toThrow();
    s.axes = [0, 1, 2, 3];
    s.centers = [0.4, 0, 0, 0];
    expect(() => validateControllerSettings(s)).toThrow();
    s.centers = [0, 0, 0, 0];
    s.aim.deadzone = 9;
    expect(() => validateControllerSettings(s)).toThrow();
  });
  it("preserves a remappable recovery route to menus", () => {
    const s = defaultControllerSettings();
    s.bindings.pause = [];
    expect(() => validateControllerSettings(s)).toThrow(/menu access/);
    s.bindings.pause = [16];
    expect(validateControllerSettings(s).bindings.pause).toEqual([16]);
  });
});
