import type { Device } from "./actions";
export interface PadSnapshot {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  axes: readonly number[];
  buttons: readonly number[];
}
export interface DeviceState {
  source: Device;
  selected: number | null;
  armed: boolean;
  previous: PadSnapshot[];
}
export function createDeviceState(): DeviceState {
  return { source: "keyboard", selected: null, armed: false, previous: [] };
}
export function neutral(pad: PadSnapshot): boolean {
  return (
    pad.axes.every((v) => Number.isFinite(v) && Math.abs(v) < 0.18) &&
    pad.buttons.every((v) => Number.isFinite(v) && v < 0.4)
  );
}
export function stepDevices(
  state: DeviceState,
  snapshots: readonly PadSnapshot[],
  preferred: number | null = null,
  focused = true,
  activity: Device | null = null,
): { state: DeviceState; pad: PadSnapshot | null; disconnected: boolean } {
  const pads = snapshots.filter((p) => p.connected),
    disconnected =
      state.selected !== null && !pads.some((p) => p.index === state.selected);
  let selected =
    preferred !== null
      ? (pads.find((p) => p.index === preferred)?.index ?? null)
      : (pads.find((p) => p.index === state.selected)?.index ??
        pads[0]?.index ??
        null);
  let source = activity ?? state.source;
  if (preferred === null && focused) {
    for (const p of pads) {
      const old = state.previous.find(
        (o) => o.index === p.index && o.id === p.id,
      );
      if (
        old &&
        (p.buttons.some((v, i) => v >= 0.5 && (old.buttons[i] ?? 0) < 0.5) ||
          p.axes.some(
            (v, i) =>
              Math.abs(v) > 0.2 && Math.abs(v - (old.axes[i] ?? 0)) > 0.04,
          ))
      ) {
        selected = p.index;
        source = "gamepad";
      }
    }
  }
  const pad = pads.find((p) => p.index === selected) ?? null;
  const same =
    selected === state.selected &&
    pad?.id === state.previous.find((p) => p.index === selected)?.id;
  const armed =
    focused && pad !== null && ((same && state.armed) || neutral(pad));
  if (!focused || disconnected) source = "keyboard";
  if (preferred !== null && focused && !activity && pad && same && armed) {
    const old = state.previous.find((p) => p.index === selected);
    if (
      old &&
      (pad.buttons.some((v, i) => v >= 0.5 && (old.buttons[i] ?? 0) < 0.5) ||
        pad.axes.some(
          (v, i) =>
            Math.abs(v) > 0.2 && Math.abs(v - (old.axes[i] ?? 0)) > 0.04,
        ))
    )
      source = "gamepad";
  }
  return {
    state: {
      source,
      selected,
      armed,
      previous: pads.map((p) => ({
        ...p,
        axes: [...p.axes],
        buttons: [...p.buttons],
      })),
    },
    pad: armed && source === "gamepad" ? pad : null,
    disconnected,
  };
}
