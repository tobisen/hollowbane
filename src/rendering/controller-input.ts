import {
  actuatorFor,
  pulseHaptics,
  stopHaptics,
  type HapticResult,
} from "./haptics";
import {
  actionFrame,
  keyActions,
  type Action,
  type ActionFrame,
  type Device,
} from "../simulation/actions";
import {
  createDeviceState,
  stepDevices,
  type PadSnapshot,
} from "../simulation/devices";
import {
  standardProfile,
  padActions,
  type GlyphFamily,
} from "../simulation/gamepad-profile";
import { processStick } from "../simulation/analog";
import type { Point } from "../world/isometric";
import {
  CONTROLLER_STORAGE,
  readControllerSettings,
} from "../simulation/controller-settings";
function loadSettings() {
  try {
    return readControllerSettings(localStorage.getItem(CONTROLLER_STORAGE));
  } catch {
    return readControllerSettings(null);
  }
}
export class ControllerInput {
  settings = loadSettings();
  state = createDeviceState();
  pads: PadSnapshot[] = [];
  frame: ActionFrame = actionFrame("keyboard", new Set(), new Set());
  family: GlyphFamily = "generic";
  supported = false;
  suspended = false;
  blockGameplay = false;
  sequence = 0;
  activityAt = 0;
  pollTimes: number[] = [];
  samples = 0;
  private keys = new Set<string>();
  private mouse = new Set<Action>();
  private pointer: Point | null = null;
  private actuator: unknown = null;
  private previous = new Set<Action>();
  private presses = new Set<Action>();
  private releases = new Set<Action>();
  private activity: Device | null = null;
  private focused = true;
  start(): void {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.activity = "keyboard";
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("pointerdown", (e) => {
      this.activity = "mouse";
      if (e.button === 0) this.mouse.add("primary");
      if (e.button === 2) this.mouse.add("secondary");
    });
    window.addEventListener("pointerup", (e) =>
      this.mouse.delete(e.button === 0 ? "primary" : "secondary"),
    );
    window.addEventListener("pointermove", (e) => {
      if (
        !this.pointer ||
        Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) > 0.5
      )
        this.activity = "mouse";
      this.pointer = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("blur", () => {
      this.focused = false;
      this.clear();
    });
    window.addEventListener("focus", () => {
      this.focused = true;
      this.clear();
    });
    document.addEventListener("visibilitychange", () => {
      this.focused = !document.hidden;
      this.clear();
    });
    const poll = () => {
      this.poll();
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }
  vibrate(): Promise<HapticResult> {
    return pulseHaptics(
      this.actuator,
      this.settings.vibration && this.focused && !this.suspended,
    );
  }
  clear(): void {
    stopHaptics(this.actuator);
    window.dispatchEvent(new Event("hollowbane-input-reset"));
    this.keys.clear();
    this.mouse.clear();
    this.previous.clear();
    this.presses.clear();
    this.releases.clear();
    this.state = { ...this.state, armed: false };
    this.frame = actionFrame(this.state.source, new Set(), new Set());
  }
  suspend(value: boolean): void {
    if (this.suspended !== value) {
      this.suspended = value;
      this.clear();
    }
  }
  take(action: Action): boolean {
    const found = this.presses.has(action);
    this.presses.delete(action);
    return found;
  }
  released(action: Action): boolean {
    const found = this.releases.has(action);
    this.releases.delete(action);
    return found;
  }
  movement(keyboard: Point): { vector: Point; scale: number } {
    if (this.suspended || this.blockGameplay || !this.focused)
      return { vector: { x: 0, y: 0 }, scale: 1 };
    return this.frame.device === "gamepad"
      ? {
          vector: this.frame.move,
          scale: Math.hypot(this.frame.move.x, this.frame.move.y),
        }
      : { vector: keyboard, scale: 1 };
  }
  poll(): void {
    const start = performance.now();
    let native: readonly (Gamepad | null)[] = [];
    try {
      native = navigator.getGamepads?.() ?? [];
    } catch {
      /* Secure-context/privacy fallback. */
    }
    this.pads = Array.from(native).flatMap((p) =>
      p
        ? [
            {
              index: p.index,
              id: p.id,
              mapping: p.mapping,
              connected: p.connected,
              axes: Array.from(p.axes),
              buttons: Array.from(p.buttons, (b) => (b.pressed ? 1 : b.value)),
            },
          ]
        : [],
    );
    const oldId = this.state.previous.find(
      (p) => p.index === this.state.selected,
    )?.id;
    const oldSource = this.state.source,
      oldPad = this.state.selected;
    const result = stepDevices(
      this.state,
      this.pads,
      this.settings.selected,
      this.focused && !this.suspended,
      this.activity,
    );
    this.state = result.state;
    this.activity = null;
    const changed =
      oldPad !== null &&
      (oldPad !== this.state.selected ||
        oldId !== this.pads.find((p) => p.index === this.state.selected)?.id);
    if (result.disconnected || changed) this.clear();
    if (oldSource === "gamepad" && this.state.source !== "gamepad") {
      stopHaptics(this.actuator);
      this.state = { ...this.state, armed: false };
    }
    this.actuator = actuatorFor(
      native.find((p) => p?.index === this.state.selected),
    );
    const snapshot = this.pads.find((p) => p.index === this.state.selected),
      profile = snapshot
        ? standardProfile(snapshot, this.settings.profile)
        : null;
    this.supported = profile !== null;
    this.family = profile?.family ?? "generic";
    const p = result.pad,
      held =
        p && profile
          ? padActions(p, this.settings.bindings)
          : this.state.source === "keyboard" && !this.suspended && this.focused
            ? keyActions(this.keys)
            : this.state.source === "mouse" && !this.suspended && this.focused
              ? new Set(this.mouse)
              : new Set<Action>();
    const axes =
      p && profile
        ? this.settings.axes.map(
            (axis, i) => (p.axes[axis] ?? 0) - (this.settings.centers[i] ?? 0),
          )
        : [0, 0, 0, 0];
    const move = processStick(axes[0]!, axes[1]!, this.settings.move),
      aim = processStick(axes[2]!, axes[3]!, this.settings.aim);
    if (oldSource !== this.state.source || oldPad !== this.state.selected) {
      this.previous.clear();
      this.presses.clear();
      this.releases.clear();
    }
    const next = actionFrame(this.state.source, held, this.previous, move, aim);
    for (const a of Object.keys(next.actions) as Action[]) {
      if (next.actions[a].pressed) this.presses.add(a);
      if (next.actions[a].released) this.releases.add(a);
    }
    if (
      p &&
      (Math.hypot(move.x - this.frame.move.x, move.y - this.frame.move.y) >
        0.04 ||
        Object.values(next.actions).some((a) => a.pressed))
    ) {
      this.sequence++;
      this.activityAt = start;
    }
    this.previous = held;
    this.frame = next;
    this.samples++;
    this.pollTimes.push(performance.now() - start);
    if (this.pollTimes.length > 300) this.pollTimes.shift();
    window.hollowbaneInput = {
      device: this.state.source,
      selected: this.state.selected,
      armed: this.state.armed,
      supported: this.supported,
      family: this.family,
      move: next.move,
      aim: next.aim,
      actions: next.actions,
      pads: this.pads,
      samples: this.samples,
      pollP95:
        [...this.pollTimes].sort((a, b) => a - b)[
          Math.floor(this.pollTimes.length * 0.95)
        ] ?? 0,
    };
  }
}
export const controllerInput = new ControllerInput();
declare global {
  interface Window {
    hollowbaneInput?: {
      device: Device;
      selected: number | null;
      armed: boolean;
      supported: boolean;
      family: GlyphFamily;
      move: Point;
      aim: Point;
      actions: ActionFrame["actions"];
      pads: PadSnapshot[];
      samples: number;
      pollP95: number;
    };
  }
}
