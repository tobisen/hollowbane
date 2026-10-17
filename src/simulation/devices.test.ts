import { describe, it, expect } from "vitest";
import { createDeviceState, stepDevices, type PadSnapshot } from "./devices";
const pad = (index = 0): PadSnapshot => ({
  index,
  id: `pad ${index}`,
  mapping: "standard",
  connected: true,
  axes: [0, 0, 0, 0],
  buttons: Array<number>(17).fill(0),
});
describe("device lifecycle", () => {
  it("idle pads never steal keyboard ownership; meaningful input switches", () => {
    let s = stepDevices(createDeviceState(), [pad()]).state;
    expect(s.source).toBe("keyboard");
    s = stepDevices(s, [{ ...pad(), axes: [0.7, 0, 0, 0] }]).state;
    expect(s.source).toBe("gamepad");
    expect(
      stepDevices(s, [{ ...pad(), axes: [0.7, 0, 0, 0] }], null, true, "mouse")
        .state.source,
    ).toBe("mouse");
  });
  it("selects one controller and excludes others when explicitly selected", () => {
    let s = stepDevices(createDeviceState(), [pad(), pad(1)], 1).state;
    const active = { ...pad(), axes: [1, 0, 0, 0] };
    s = stepDevices(s, [active, pad(1)], 1).state;
    expect(s.selected).toBe(1);
    expect(s.source).toBe("keyboard");
    s = stepDevices(s, [active, { ...pad(1), axes: [0.6, 0, 0, 0] }], 1).state;
    expect(s.source).toBe("gamepad");
  });
  it("clears disconnects and requires neutral after focus loss/reconnection", () => {
    let s = stepDevices(createDeviceState(), [pad()]).state;
    const held = { ...pad(), axes: [1, 0, 0, 0] };
    s = stepDevices(s, [held]).state;
    expect(stepDevices(s, []).disconnected).toBe(true);
    s = stepDevices(s, [held], null, false).state;
    expect(s.armed).toBe(false);
    expect(stepDevices(s, [held]).pad).toBeNull();
    s = stepDevices(s, [pad()]).state;
    expect(stepDevices(s, [held]).pad).not.toBeNull();
  });
  it("does not lose a newly sampled button edge to an earlier queued DOM event", () => {
    const s = stepDevices(createDeviceState(), [pad()]).state;
    const p = { ...pad(), buttons: [0, 0, 1, ...Array<number>(14).fill(0)] };
    expect(stepDevices(s, [p], null, true, "mouse").state.source).toBe(
      "gamepad",
    );
  });
});
it("supports neutral/ownership thresholds on already calibrated axes", () => {
  const options = { neutral: 0.001, active: 0.001, delta: 0.001 };
  let s = stepDevices(
    createDeviceState(),
    [pad()],
    null,
    true,
    null,
    options,
  ).state;
  s = stepDevices(
    s,
    [{ ...pad(), axes: [0.01, 0, 0, 0] }],
    null,
    true,
    null,
    options,
  ).state;
  expect(s.source).toBe("gamepad");
});

it("follows a saved controller ID across indexes and ignores an unrelated index replacement", () => {
  const original = { ...pad(), id: "My Xbox" };
  let s = stepDevices(
    createDeviceState(),
    [original],
    0,
    true,
    null,
    undefined,
    "My Xbox",
  ).state;
  const other = { ...pad(), id: "Other controller" },
    moved = { ...original, index: 2 };
  s = stepDevices(s, [other, moved], 0, true, null, undefined, "My Xbox").state;
  expect(s.selected).toBe(2);
  const waiting = stepDevices(s, [other], 0, true, null, undefined, "My Xbox");
  expect(waiting.state.selected).toBeNull();
  expect(waiting.pad).toBeNull();
  s = stepDevices(
    waiting.state,
    [other, moved],
    0,
    true,
    null,
    undefined,
    "My Xbox",
  ).state;
  expect(s.selected).toBe(2);
  expect(s.armed).toBe(true);
  expect(
    stepDevices(
      s,
      [other, { ...moved, axes: [0.8, 0, 0, 0] }],
      0,
      true,
      null,
      undefined,
      "My Xbox",
    ).pad?.id,
  ).toBe("My Xbox");
});
