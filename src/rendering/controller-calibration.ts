import { calibrateCenters } from "../simulation/analog";
import {
  CONTROLLER_STORAGE,
  validateControllerSettings,
} from "../simulation/controller-settings";
import { controllerInput as hub } from "./controller-input";
export function installCalibration(): void {
  const live = document.querySelector("#controller-live");
  if (!live) return;
  const section = document.createElement("section");
  section.id = "controller-calibration";
  section.innerHTML = `<h2>Stick diagnostics & calibration</h2><p>Left: movement · Right: aim. Gold dots show processed vectors; muted dots show raw axes. Keep sticks centered and release buttons for twenty sampled frames.</p><div class="controller-sticks">${["move", "aim"].map((name) => `<svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="${name} stick input"><circle cx="90" cy="90" r="75" fill="#10191f" stroke="#6d7a78"/><path d="M15 90H165M90 15V165" stroke="#38494f"/><circle id="${name}-raw" cx="90" cy="90" r="4" fill="#7f999f"/><circle id="${name}-processed" cx="90" cy="90" r="6" fill="#e4c58a"/></svg>`).join("")}</div><output id="calibration-values">Centers: 0, 0, 0, 0</output><p><button id="pad-calibrate" type="button">Calibrate centered sticks</button><button id="pad-clear-calibration" type="button">Clear center calibration</button></p><p id="calibration-state" role="status">Ready. Physical controller verification has not been performed.</p>`;
  live.closest("section")!.before(section);
  let capturing = false,
    waiting = false,
    samples: number[][] = [],
    selected: number | null = null,
    refreshedAt = 0;
  const state = section.querySelector("#calibration-state")!,
    values = section.querySelector("#calibration-values")!;
  const save = (centers: number[]) => {
    hub.settings = validateControllerSettings({ ...hub.settings, centers });
    hub.clear();
    try {
      localStorage.setItem(CONTROLLER_STORAGE, JSON.stringify(hub.settings));
      state.textContent = "Center calibration saved.";
    } catch {
      state.textContent = "Center calibration applied; storage unavailable.";
    }
  };
  section.querySelector<HTMLButtonElement>("#pad-calibrate")!.onclick = () => {
    selected = hub.state.selected;
    if (selected === null || !hub.supported) {
      state.textContent = "Connect and select a supported controller first.";
      return;
    }
    capturing = true;
    waiting = true;
    samples = [];
    state.textContent = "Release all buttons, keep sticks centered…";
  };
  section.querySelector<HTMLButtonElement>("#pad-clear-calibration")!.onclick =
    () => {
      capturing = false;
      save([0, 0, 0, 0]);
    };
  const loop = (now: number) => {
    const pad = hub.pads.find((p) => p.index === hub.state.selected),
      raw = hub.settings.axes.map((i) => pad?.axes[i] ?? 0);
    if (capturing) {
      if (!pad || pad.index !== selected) {
        capturing = false;
        state.textContent =
          "Calibration cancelled: controller changed or disconnected.";
      } else if (waiting && pad.buttons.some((b) => b >= 0.4)) {
        /* Wait for the actual activation button to release. */
      } else {
        waiting = false;
        samples.push(raw);
        state.textContent = `Sampling centered sticks: ${samples.length} / 20`;
        if (samples.length >= 20) {
          capturing = false;
          try {
            save(calibrateCenters(samples));
          } catch (error) {
            state.textContent =
              error instanceof Error ? error.message : "Calibration failed";
          }
        }
      }
    }
    if (now - refreshedAt > 100) {
      refreshedAt = now;
      for (const [name, offset] of [
        ["move", 0],
        ["aim", 2],
      ] as const) {
        const normalized = hub.frame[name];
        for (const [type, x, y] of [
          ["raw", raw[offset]!, raw[offset + 1]!],
          ["processed", normalized.x, normalized.y],
        ] as const) {
          const dot = section.querySelector(`#${name}-${type}`)!;
          dot.setAttribute("cx", String(90 + x * 75));
          dot.setAttribute("cy", String(90 + y * 75));
        }
      }
      values.textContent = `Centers: ${hub.settings.centers.map((v) => v.toFixed(3)).join(", ")} · Raw: ${raw.map((v) => v.toFixed(2)).join(", ")} · ${hub.state.armed ? "Armed" : "Release inputs to rearm"}`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
