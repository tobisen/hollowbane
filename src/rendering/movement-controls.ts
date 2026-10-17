import {
  actionHeld,
  defaultPreferences,
  INPUT_ACTIONS,
  movementVector,
  readPreferences,
  validateBindings,
  type InputAction,
  type MovementPreferences,
} from "../simulation/input";
import { movementConfig } from "../simulation/locomotion";
import type { MovementCommand } from "../simulation/commands";
export const MOVEMENT_STORAGE = "hollowbane.movement.v1";
export function loadMovementPreferences(): MovementPreferences {
  try {
    return readPreferences(localStorage.getItem(MOVEMENT_STORAGE));
  } catch {
    return defaultPreferences();
  }
}
export interface ControlCallbacks {
  command(command: MovementCommand): void;
  change(preferences: MovementPreferences): void;
  interrupt(): void;
  intent(): void;
}
/** DOM adapter only: simulation receives normalized directions and typed intents. */
export function movementControls(
  world: HTMLElement,
  initial: MovementPreferences,
  callbacks: ControlCallbacks,
) {
  let preferences = initial;
  const held = new Set<string>();
  const actions: { action: InputAction; label: string }[] = [
    { action: "north", label: "Move up" },
    { action: "south", label: "Move down" },
    { action: "west", label: "Move left" },
    { action: "east", label: "Move right" },
    { action: "toggleRun", label: "Toggle run" },
    { action: "stop", label: "Stop" },
  ];
  document
    .querySelector(".world-controls")!
    .insertAdjacentHTML(
      "afterbegin",
      `<button id="movement-gait" aria-pressed="false">Run · R</button><button id="movement-stop">Stop</button><button id="movement-settings">Controls</button>`,
    );
  const dialog = document.createElement("dialog");
  dialog.className = "movement-dialog";
  dialog.setAttribute("aria-labelledby", "movement-title");
  dialog.innerHTML = `<form><h2 id="movement-title">Movement controls</h2><p>Choose a key, then press its replacement. Arrow keys remain available.</p><div class="movement-bindings">${actions.map(({ action, label }) => `<label>${label}<input data-action="${action}" aria-label="${label} key" readonly></label>`).join("")}</div><div class="movement-speeds"><label>Walk speed<input id="walk-speed" aria-label="Walk speed" type="number" min="0.5" max="12" step="0.1" required></label><label>Run speed<input id="run-speed" aria-label="Run speed" type="number" min="0.5" max="12" step="0.1" required></label></div><p class="movement-note">Shift-click queues a destination. Right-click faces a point. Run currently uses the original walk artwork at a faster cadence.</p><button type="button" id="movement-controller">Gamepad settings</button><p id="movement-error" role="status"></p><div class="movement-dialog-actions"><button type="button" id="movement-defaults">Defaults</button><button type="button" id="movement-cancel">Cancel</button><button type="submit">Save controls</button></div></form>`;
  document.querySelector("main")!.append(dialog);
  const gait = document.querySelector<HTMLButtonElement>("#movement-gait")!;
  const sync = () => {
    gait.textContent =
      (preferences.gait === "run" ? "Walk" : "Run") +
      " · " +
      preferences.bindings.toggleRun[0]!.replace("Key", "");
    gait.setAttribute("aria-pressed", String(preferences.gait === "run"));
  };
  const persist = () => {
    try {
      localStorage.setItem(MOVEMENT_STORAGE, JSON.stringify(preferences));
    } catch {
      /* Movement remains usable without storage. */
    }
    callbacks.change(preferences);
    sync();
  };
  const toggle = () => {
    preferences = {
      ...preferences,
      gait: preferences.gait === "run" ? "walk" : "run",
    };
    callbacks.command({ type: "gait", gait: preferences.gait });
    persist();
  };
  const stop = () => {
    held.clear();
    callbacks.interrupt();
  };
  gait.onclick = toggle;
  document.querySelector<HTMLButtonElement>("#movement-stop")!.onclick = stop;
  let draft = defaultPreferences();
  const renderDraft = () => {
    for (const input of Array.from(
      dialog.querySelectorAll<HTMLInputElement>("[data-action]"),
    ))
      input.value = draft.bindings[input.dataset.action as InputAction][0]!;
    dialog.querySelector<HTMLInputElement>("#walk-speed")!.value = String(
      draft.config.walkSpeed,
    );
    dialog.querySelector<HTMLInputElement>("#run-speed")!.value = String(
      draft.config.runSpeed,
    );
    dialog.querySelector("#movement-error")!.textContent = "";
  };
  document.querySelector<HTMLButtonElement>("#movement-settings")!.onclick =
    () => {
      stop();
      draft = readPreferences(JSON.stringify(preferences));
      renderDraft();
      dialog.showModal();
    };
  for (const input of Array.from(
    dialog.querySelectorAll<HTMLInputElement>("[data-action]"),
  ))
    input.onkeydown = (event) => {
      if (event.code === "Tab" || event.code === "Escape") return;
      event.preventDefault();
      const action = input.dataset.action as InputAction;
      const fallback =
        action === "north"
          ? "ArrowUp"
          : action === "south"
            ? "ArrowDown"
            : action === "west"
              ? "ArrowLeft"
              : action === "east"
                ? "ArrowRight"
                : null;
      draft.bindings[action] =
        fallback && fallback !== event.code
          ? [event.code, fallback]
          : [event.code];
      input.value = event.code;
    };
  dialog.querySelector<HTMLButtonElement>("#movement-controller")!.onclick =
    () => window.dispatchEvent(new Event("hollowbane-controller-menu"));
  const close = () => {
    window.dispatchEvent(new Event("hollowbane-ui-dismiss"));
    dialog.close();
    world.focus();
  };
  dialog.querySelector<HTMLButtonElement>("#movement-cancel")!.onclick = close;
  dialog.addEventListener("cancel", () =>
    window.dispatchEvent(new Event("hollowbane-ui-dismiss")),
  );
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) world.focus();
  });
  dialog.querySelector<HTMLButtonElement>("#movement-defaults")!.onclick =
    () => {
      draft = defaultPreferences();
      renderDraft();
    };
  dialog.querySelector("form")!.onsubmit = (event) => {
    event.preventDefault();
    try {
      preferences = {
        version: 1,
        gait: preferences.gait,
        bindings: validateBindings(draft.bindings),
        config: movementConfig({
          ...draft.config,
          walkSpeed: Number(
            dialog.querySelector<HTMLInputElement>("#walk-speed")!.value,
          ),
          runSpeed: Number(
            dialog.querySelector<HTMLInputElement>("#run-speed")!.value,
          ),
        }),
      };
      persist();
      close();
    } catch (error) {
      dialog.querySelector("#movement-error")!.textContent =
        error instanceof Error ? error.message : "Invalid controls";
    }
  };
  const down = (event: KeyboardEvent) => {
    if (document.activeElement !== world) return;
    if (
      !INPUT_ACTIONS.some((action) =>
        preferences.bindings[action].includes(event.code),
      )
    )
      return;
    event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    if (preferences.bindings.stop.includes(event.code)) {
      stop();
      return;
    }
    if (preferences.bindings.toggleRun.includes(event.code)) {
      toggle();
      return;
    }
    if (
      movementVector(held, preferences.bindings).x ||
      movementVector(held, preferences.bindings).y
    )
      callbacks.intent();
  };
  const up = (event: KeyboardEvent) => held.delete(event.code);
  const blur = () => {
    held.clear();
  };
  world.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  world.addEventListener("blur", blur);
  sync();
  return {
    toggleRun: toggle,
    vector: () =>
      document.activeElement === world
        ? movementVector(held, preferences.bindings)
        : { x: 0, y: 0 },
    queueHeld: () => actionHeld(held, preferences.bindings, "queue"),
    clear: () => held.clear(),
    dispose: () => {
      world.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      world.removeEventListener("blur", blur);
      dialog.remove();
    },
  };
}
