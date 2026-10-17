import { describe, it, expect } from "vitest";
import { actionFrame, keyActions } from "./actions";
describe("semantic actions", () => {
  it("separates press, hold and release without repeating edges", () => {
    const h = new Set(["primary"] as const);
    expect(actionFrame("gamepad", h, new Set()).actions.primary).toEqual({
      held: true,
      pressed: true,
      released: false,
    });
    expect(actionFrame("keyboard", h, h).actions.primary.pressed).toBe(false);
    expect(actionFrame("mouse", new Set(), h).actions.primary.released).toBe(
      true,
    );
  });
  it("maps keyboard to device-independent actions and copies vectors", () => {
    const move = { x: 0.4, y: 0.3 },
      f = actionFrame(
        "keyboard",
        keyActions(new Set(["KeyX", "Enter"])),
        new Set(),
        move,
      );
    move.x = 9;
    expect(f.move.x).toBe(0.4);
    expect(f.actions.primary.held).toBe(true);
    expect(f.actions.interact.held).toBe(true);
    expect(f.actions.pickup.held).toBe(false);
  });
});
