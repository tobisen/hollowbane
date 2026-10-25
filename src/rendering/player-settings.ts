import { installControllerSettings } from "./controller-settings";
import { controllerInput as hub } from "./controller-input";
import { loadMovementPreferences, MOVEMENT_STORAGE } from "./movement-controls";
import { defaultPreferences, type InputAction } from "../simulation/input";
import {
  loadPresentation,
  savePresentation,
  readPresentation,
  MOVEMENT_LABELS,
  validatePlayerBindings,
  safePlayerBindings,
} from "./player-preferences";
import "./player-settings.css";
import { installBeginnerSettings } from "./beginner-guide";

/** Shared menu/pause adapter over existing graphics, sound and input systems. */
export function installPlayerSettings(host: HTMLElement) {
  host.classList.add("player-settings");
  const codes = Array.from(
    { length: 26 },
    (_, i) => `Key${String.fromCharCode(65 + i)}`,
  ).concat("Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight");
  host.innerHTML = `<form id="player-presentation-form"><fieldset><legend>Graphics &amp; sound</legend><label>Graphics detail<select id="player-quality"><option value="auto">Automatic</option><option value="balanced">Balanced</option><option value="full">Full</option></select></label><p>Balanced favours performance. Full favours sharpness.</p><label>Sound effects volume (%)<input id="player-volume" type="number" min="0" max="100" step="5" required></label><label><input id="player-muted" type="checkbox">Mute sound effects</label><p>Sound starts after a gameplay gesture. Music is not available in this build.</p><div class="settings-actions"><button type="submit" id="player-presentation-save">Save graphics &amp; sound</button><button type="button" id="player-presentation-defaults">Restore defaults</button><button type="button" id="player-fullscreen">Fullscreen</button></div><p id="player-fullscreen-note"></p><p id="player-presentation-status" role="status"></p></fieldset></form><form id="player-keyboard-form"><fieldset><legend>Keyboard movement</legend><p>Choose a key for each action. Arrow keys remain available. Combat, inventory, quest and menu shortcuts stay reserved.</p><div class="settings-grid">${MOVEMENT_LABELS.map(([a, label]) => `<label>${label}<select id="player-key-${a}" data-movement-action="${a}">${codes.map((c) => `<option value="${c}">${c.replace("Key", "")}</option>`).join("")}</select></label>`).join("")}</div><div class="settings-actions"><button type="submit" id="player-keyboard-save">Save keyboard controls</button><button type="button" id="player-keyboard-defaults">Restore default keys</button><button type="button" id="player-keyboard-revert">Revert unsaved keys</button></div><p id="player-keyboard-status" role="status"></p></fieldset></form><section id="controller-settings-host"></section>`;
  const select = (id: string) =>
    host.querySelector<HTMLSelectElement>(`#${id}`)!;
  const input = (id: string) => host.querySelector<HTMLInputElement>(`#${id}`)!;
  const status = (id: string, text: string) => {
    host.querySelector(`#${id}`)!.textContent = text;
  };
  const presentation = (p = loadPresentation()) => {
    select("player-quality").value = p.quality;
    input("player-volume").value = String(Math.round(p.volume * 100));
    input("player-muted").checked = p.muted;
  };
  const keyboard = (
    b = safePlayerBindings(loadMovementPreferences().bindings),
  ) => {
    for (const [a] of MOVEMENT_LABELS)
      select(`player-key-${a}`).value = b[a][0]!;
  };
  host.querySelector<HTMLFormElement>("#player-presentation-form")!.onsubmit = (
    event,
  ) => {
    event.preventDefault();
    try {
      const stored = savePresentation({
        version: 1,
        quality: select("player-quality").value as ReturnType<
          typeof loadPresentation
        >["quality"],
        volume: Number(input("player-volume").value) / 100,
        muted: input("player-muted").checked,
      });
      status(
        "player-presentation-status",
        stored
          ? "Graphics and sound settings saved."
          : "Settings applied for this page; browser storage is unavailable.",
      );
    } catch (error) {
      status("player-presentation-status", String(error));
    }
  };
  host.querySelector<HTMLButtonElement>(
    "#player-presentation-defaults",
  )!.onclick = () => presentation(readPresentation(null));
  host.querySelector<HTMLFormElement>("#player-keyboard-form")!.onsubmit = (
    event,
  ) => {
    event.preventDefault();
    try {
      const p = loadMovementPreferences();
      p.bindings = safePlayerBindings(p.bindings);
      for (const [a, , arrow] of MOVEMENT_LABELS) {
        const code = select(`player-key-${a}`).value;
        p.bindings[a as InputAction] =
          arrow && code !== arrow ? [code, arrow] : [code];
      }
      p.bindings = validatePlayerBindings(p.bindings);
      localStorage.setItem(MOVEMENT_STORAGE, JSON.stringify(p));
      hub.clear();
      window.dispatchEvent(new Event("hollowbane-keyboard-change"));
      status(
        "player-keyboard-status",
        "Keyboard controls saved. Movement speeds are unchanged.",
      );
    } catch (error) {
      status(
        "player-keyboard-status",
        `${String(error)}. Existing controls retained.`,
      );
    }
  };
  host.querySelector<HTMLButtonElement>("#player-keyboard-defaults")!.onclick =
    () => keyboard(defaultPreferences().bindings);
  host.querySelector<HTMLButtonElement>("#player-keyboard-revert")!.onclick =
    () => keyboard();
  const abort = new AbortController();
  const fullscreen = () => {
    const publicControl =
      document.querySelector<HTMLButtonElement>("#game-fullscreen");
    const button = host.querySelector<HTMLButtonElement>("#player-fullscreen")!;
    button.disabled = !publicControl || publicControl.disabled;
    button.textContent =
      publicControl?.getAttribute("aria-label") ?? "Fullscreen";
    status(
      "player-fullscreen-note",
      !publicControl
        ? "Fullscreen is available during gameplay."
        : publicControl.disabled
          ? "Fullscreen is unavailable in this browser."
          : "",
    );
  };
  host.querySelector<HTMLButtonElement>("#player-fullscreen")!.onclick = () => {
    document.querySelector<HTMLButtonElement>("#game-fullscreen")?.click();
  };
  const fullscreenObserver = new MutationObserver(fullscreen);
  const connectFullscreen = () => {
    fullscreenObserver.disconnect();
    const publicControl = document.querySelector("#game-fullscreen");
    if (publicControl)
      fullscreenObserver.observe(publicControl, {
        attributes: true,
        attributeFilter: ["disabled", "aria-label"],
      });
    fullscreen();
  };
  window.addEventListener(
    "pagehide",
    (event) => {
      fullscreenObserver.disconnect();
      if (!event.persisted) abort.abort();
    },
    { signal: abort.signal },
  );
  window.addEventListener(
    "pageshow",
    (event) => {
      if (event.persisted) connectFullscreen();
    },
    { signal: abort.signal },
  );
  installControllerSettings();
  const refreshBeginner = installBeginnerSettings(host);
  const refresh = () => {
    refreshBeginner?.();
    presentation();
    keyboard();
    connectFullscreen();
  };
  refresh();
  return {
    refresh,
    dispose: () => {
      abort.abort();
      fullscreenObserver.disconnect();
    },
  };
}
