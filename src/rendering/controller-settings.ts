import { ACTIONS } from "../simulation/actions";
import {
  CONTROLLER_STORAGE,
  defaultControllerSettings,
  validateControllerSettings,
  type ControllerSettings,
} from "../simulation/controller-settings";
import { buttonGlyph } from "../simulation/gamepad-profile";
import { controllerInput as hub } from "./controller-input";
export function installControllerSettings(): void {
  const host = document.querySelector("#controller-settings-host");
  if (!host) return;
  const options = Array.from(
    { length: 32 },
    (_, i) =>
      `<option value="${i}">${i + 1}: ${buttonGlyph(i, "xbox")} / ${buttonGlyph(i, "playstation")}</option>`,
  ).join("");
  host.innerHTML = `<form id="controller-settings-form"><h2>Input settings</h2><p>D-pad / LS: navigate · Left/right: adjust · A/Cross: choose · B/Circle: back. Unknown nonstandard layouts need an explicit standard override and axis calibration.</p><div class="settings-grid"><fieldset><legend>Device and layout</legend><label>Active controller<select id="pad-selected"><option value="auto">Automatic</option></select></label><label>Layout / glyphs<select id="pad-profile"><option value="auto">Auto standard</option><option value="xbox">Xbox standard override</option><option value="playstation">PlayStation standard override</option><option value="generic">Generic standard override</option></select></label><label>Optional vibration<input type="checkbox" id="pad-vibration"></label>${["Move X", "Move Y", "Aim X", "Aim Y"].map((name, i) => `<label>${name} axis<select id="pad-axis-${i}">${Array.from({ length: 16 }, (_, i) => `<option value="${i}">Axis ${i}</option>`).join("")}</select></label>`).join("")}</fieldset>${[
    "move",
    "aim",
  ]
    .map(
      (stick) =>
        `<fieldset><legend>${stick === "move" ? "Left stick movement" : "Right stick aim"}</legend>${[
          ["deadzone", 0.05, 0.5, 0.01],
          ["outer", 0.6, 1, 0.01],
          ["sensitivity", 0.25, 2, 0.05],
          ["curve", 0.5, 3, 0.1],
        ]
          .map(
            ([key, min, max, step]) =>
              `<label>${stick} ${key}<input id="pad-${stick}-${key}" type="number" min="${min}" max="${max}" step="${step}" required></label>`,
          )
          .join("")}</fieldset>`,
    )
    .join(
      "",
    )}</div><h2>Button bindings</h2><p>Duplicates are rejected. Free a button by selecting Unbound first. Interact, cancel and pause must remain assigned; each can be remapped. Unfinished actions stay reserved.</p><div class="settings-grid">${ACTIONS.map((a) => `<label>${a}<select id="pad-bind-${a}"><option value="-1">Unbound</option>${options}</select></label>`).join("")}</div><button type="submit" id="pad-save">Save controller settings</button><button type="button" id="pad-defaults">Restore defaults</button><button type="button" id="pad-revert">Revert unsaved edits</button><p id="pad-error" role="status"></p></form>`;
  const form = host.querySelector<HTMLFormElement>("form")!,
    select = (id: string) => form.querySelector<HTMLSelectElement>(`#${id}`)!,
    input = (id: string) => form.querySelector<HTMLInputElement>(`#${id}`)!;
  const devices = () => {
    const chosen = select("pad-selected").value;
    const saved = hub.settings.selected;
    select("pad-selected").innerHTML =
      '<option value="auto">Automatic</option>';
    for (const p of hub.pads) {
      const o = new Option(`#${p.index}: ${p.id}`, String(p.index));
      select("pad-selected").add(o);
    }
    if (saved !== null && !hub.pads.some((p) => p.index === saved))
      select("pad-selected").add(
        new Option(`#${saved}: not connected`, String(saved)),
      );
    select("pad-selected").value = chosen || String(saved ?? "auto");
  };
  const render = (s: ControllerSettings) => {
    devices();
    select("pad-selected").value = String(s.selected ?? "auto");
    select("pad-profile").value = s.profile;
    input("pad-vibration").checked = s.vibration;
    s.axes.forEach((v, i) => (select(`pad-axis-${i}`).value = String(v)));
    for (const stick of ["move", "aim"] as const)
      for (const key of ["deadzone", "outer", "sensitivity", "curve"] as const)
        input(`pad-${stick}-${key}`).value = String(s[stick][key]);
    for (const a of ACTIONS)
      select(`pad-bind-${a}`).value = String(s.bindings[a][0] ?? -1);
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      const draft = defaultControllerSettings();
      draft.selected =
        select("pad-selected").value === "auto"
          ? null
          : Number(select("pad-selected").value);
      draft.profile = select("pad-profile")
        .value as ControllerSettings["profile"];
      draft.vibration = input("pad-vibration").checked;
      draft.centers = [...hub.settings.centers];
      draft.axes = [0, 1, 2, 3].map((i) =>
        Number(select(`pad-axis-${i}`).value),
      ) as ControllerSettings["axes"];
      for (const stick of ["move", "aim"] as const)
        for (const key of [
          "deadzone",
          "outer",
          "sensitivity",
          "curve",
        ] as const)
          draft[stick][key] = Number(input(`pad-${stick}-${key}`).value);
      for (const a of ACTIONS) {
        const b = Number(select(`pad-bind-${a}`).value);
        draft.bindings[a] = b < 0 ? [] : [b];
      }
      hub.settings = validateControllerSettings(draft);
      hub.clear();
      try {
        localStorage.setItem(CONTROLLER_STORAGE, JSON.stringify(hub.settings));
        form.querySelector("#pad-error")!.textContent =
          "Controller settings saved.";
      } catch {
        form.querySelector("#pad-error")!.textContent =
          "Settings applied for this session; storage is unavailable.";
      }
    } catch (error) {
      form.querySelector("#pad-error")!.textContent =
        error instanceof Error ? error.message : "Invalid settings";
    }
  };
  form.querySelector<HTMLButtonElement>("#pad-defaults")!.onclick = () =>
    render(defaultControllerSettings());
  form.querySelector<HTMLButtonElement>("#pad-revert")!.onclick = () =>
    render(hub.settings);
  render(hub.settings);
  let signature = "";
  const update = () => {
    const next = hub.pads.map((p) => `${p.index}:${p.id}`).join("|");
    if (signature !== next) {
      signature = next;
      devices();
    }
  };
  window.setInterval(update, 500);
}
