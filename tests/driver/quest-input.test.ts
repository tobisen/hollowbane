import { afterEach, expect, it, vi } from "vitest";
import { ControllerInput } from "../../src/rendering/controller-input";

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const pad = {
    id: "Xbox 360 Controller",
    index: 0,
    mapping: "standard",
    connected: true,
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    })),
  };
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal(
    "document",
    Object.assign(new EventTarget(), {
      hidden: false,
      activeElement: { matches: () => true },
    }),
  );
  vi.stubGlobal("navigator", { getGamepads: () => [pad] });
  vi.stubGlobal("requestAnimationFrame", () => 0);
  const input = new ControllerInput();
  input.start();
  input.poll();
  expect(input.state.armed).toBe(true);
  return { input, pad };
}

it("reproduces the held-stick deadlock after mouse takes controller ownership", () => {
  const { input, pad } = fixture();
  pad.axes = [0.5614823680863442, 0.8274887010274831, 0, 0];
  input.poll();
  expect(input.state.source).toBe("gamepad");
  expect(Math.hypot(input.frame.move.x, input.frame.move.y)).toBeGreaterThan(0);

  window.dispatchEvent(Object.assign(new Event("pointerdown"), { button: 0 }));
  input.poll();
  window.dispatchEvent(Object.assign(new Event("pointerup"), { button: 0 }));
  expect(input.state.source).toBe("mouse");
  expect(input.state.armed).toBe(false);
  // A later stick direction can win ownership, but still cannot rearm.
  pad.axes = [0.6, 0.8, 0, 0];
  for (let frame = 0; frame < 60; frame++) input.poll();
  expect(input.state.source).toBe("gamepad");
  expect(input.state.armed).toBe(false);
  expect(input.frame.move).toEqual({ x: 0, y: 0 });

  pad.axes = [0, 0, 0, 0];
  input.poll();
  expect(input.state.armed).toBe(true);
  pad.axes = [0.5614823680863442, 0.8274887010274831, 0, 0];
  input.poll();
  expect(input.state.source).toBe("gamepad");
  expect(Math.hypot(input.frame.move.x, input.frame.move.y)).toBeGreaterThan(0);
});

it("requires release after focus interruption and resumes from fresh neutral samples", () => {
  const { input, pad } = fixture();
  pad.axes = [1, 0, 0, 0];
  input.poll();
  window.dispatchEvent(new Event("blur"));
  input.poll();
  window.dispatchEvent(new Event("focus"));
  input.poll();
  expect(input.state.armed).toBe(false);
  expect(input.frame.move).toEqual({ x: 0, y: 0 });
  pad.axes = [0, 0, 0, 0];
  for (let frame = 0; frame < 3; frame++) input.poll();
  expect(input.state.armed).toBe(true);
  pad.axes = [1, 0, 0, 0];
  input.poll();
  expect(input.frame.move).toEqual({ x: 1, y: 0 });
});
