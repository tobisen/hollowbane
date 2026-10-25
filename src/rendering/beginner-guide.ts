import { controllerInput as hub } from "./controller-input";
import { actionPrompt } from "../simulation/prompts";
import { SKILL_ACTIONS } from "../simulation/skill-input";
import {
  newBeginnerProgress,
  readBeginnerProgress,
  observeBeginnerProgress,
  beginnerHint,
  dismissBeginnerHint,
  type BeginnerProgress,
  type BeginnerObservation,
} from "./beginner-guide-state";
import "./beginner-guide.css";

export const BEGINNER_STORAGE = "hollowbane.guidance.v1:";
const memory = new Map<string, BeginnerProgress>();
export function beginnerOwner(): string | null {
  const query = new URLSearchParams(location.search);
  if (
    query.getAll("character").length !== 1 ||
    !document.querySelector("main.combat-arena")
  )
    return null;
  const id = query.get("character");
  return id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      id,
    )
    ? id
    : null;
}
function load(owner: string): BeginnerProgress {
  const cached = memory.get(owner);
  if (cached) return cached;
  try {
    return readBeginnerProgress(localStorage.getItem(BEGINNER_STORAGE + owner));
  } catch {
    return newBeginnerProgress();
  }
}
function save(owner: string, value: BeginnerProgress): boolean {
  memory.set(owner, value);
  let stored = true;
  try {
    localStorage.setItem(BEGINNER_STORAGE + owner, JSON.stringify(value));
  } catch {
    stored = false;
  }
  window.dispatchEvent(
    new CustomEvent("hollowbane-guidance-change", { detail: owner }),
  );
  return stored;
}
/** Small controls inside the existing pause settings; normal controller navigation applies. */
export function installBeginnerSettings(
  host: HTMLElement,
): (() => void) | null {
  const owner = beginnerOwner();
  if (!owner) return null;
  const section = document.createElement("fieldset");
  section.innerHTML =
    '<legend>Beginner guidance</legend><label><input id="beginner-enabled" type="checkbox">Show hints for this character</label><div class="settings-actions"><button id="beginner-settings-dismiss" type="button">Dismiss current hint</button><button id="beginner-replay" type="button">Replay beginner hints</button></div><p id="beginner-settings-status" role="status"></p>';
  host.prepend(section);
  const enabled = section.querySelector<HTMLInputElement>("#beginner-enabled")!;
  const status = section.querySelector<HTMLElement>(
    "#beginner-settings-status",
  )!;
  const refresh = () => {
    enabled.checked = load(owner).enabled;
  };
  enabled.onchange = () => {
    const stored = save(owner, { ...load(owner), enabled: enabled.checked });
    status.textContent = stored
      ? enabled.checked
        ? "Hints enabled for this character."
        : "Hints disabled for this character."
      : "Applied for this page; browser storage is unavailable.";
  };
  section.querySelector<HTMLButtonElement>(
    "#beginner-settings-dismiss",
  )!.onclick = () => {
    const handled = !window.dispatchEvent(
      new Event("hollowbane-guidance-dismiss", { cancelable: true }),
    );
    status.textContent = handled
      ? "Current hint dismissed."
      : "No current hint to dismiss.";
  };
  section.querySelector<HTMLButtonElement>("#beginner-replay")!.onclick =
    () => {
      const stored = save(owner, newBeginnerProgress());
      window.dispatchEvent(new Event("hollowbane-guidance-replay"));
      refresh();
      status.textContent = stored
        ? "Hints restarted for this character."
        : "Hints restarted for this page; browser storage is unavailable.";
    };
  refresh();
  return refresh;
}
export interface BeginnerView extends BeginnerObservation {
  readonly ready: boolean;
  readonly modal: boolean;
  readonly skillName: string | null;
  readonly skillMana: number;
  readonly skillSlot: number;
  readonly movementKeys: string;
}
export class BeginnerGuide {
  private panel = document.createElement("aside");
  private title: HTMLElement;
  private message: HTMLElement;
  private notice: HTMLElement;
  private dismissButton: HTMLButtonElement;
  private context: BeginnerView | null = null;
  private progress: BeginnerProgress;
  private abort = new AbortController();
  private ignorePreviousActions = false;
  constructor(
    root: HTMLElement,
    private owner: string,
  ) {
    this.progress = load(owner);
    this.panel.id = "beginner-hint";
    this.panel.hidden = true;
    this.panel.setAttribute("aria-label", "Beginner guidance");
    this.panel.innerHTML =
      '<strong id="beginner-hint-title"></strong><p id="beginner-hint-message"></p><button id="beginner-hint-dismiss" type="button">Dismiss hint</button><small id="beginner-hint-notice" role="status"></small>';
    root.append(this.panel);
    this.title = this.panel.querySelector("strong")!;
    this.message = this.panel.querySelector("p")!;
    this.notice = this.panel.querySelector("small")!;
    this.dismissButton = this.panel.querySelector("button")!;
    const dismiss = () => {
      if (!this.context) return false;
      const id = beginnerHint(this.progress, this.context);
      if (!id) return false;
      this.persist(dismissBeginnerHint(this.progress, id));
      this.render();
      return true;
    };
    this.dismissButton.onclick = () => {
      dismiss();
      hub.clear();
      root.querySelector<HTMLElement>("#combat-world")?.focus();
    };
    window.addEventListener(
      "hollowbane-guidance-dismiss",
      (event) => {
        if (dismiss()) event.preventDefault();
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      "hollowbane-guidance-change",
      (event) => {
        if ((event as CustomEvent<string>).detail === owner) {
          this.progress = load(owner);
          this.render();
        }
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      "hollowbane-guidance-replay",
      () => {
        this.ignorePreviousActions = true;
      },
      { signal: this.abort.signal },
    );
  }
  private persist(next: BeginnerProgress): void {
    if (next === this.progress) return;
    this.progress = next;
    if (!save(this.owner, next))
      this.notice.textContent =
        "Progress lasts for this page; browser storage is unavailable.";
  }
  update(context: BeginnerView): void {
    this.context = context;
    if (context.ready) {
      if (!this.ignorePreviousActions)
        this.persist(observeBeginnerProgress(this.progress, context));
      this.ignorePreviousActions = false;
    }
    this.render();
  }
  private render(): void {
    const c = this.context;
    const id = c?.ready ? beginnerHint(this.progress, c) : null;
    const hidden = !id || !c || c.modal;
    if (this.panel.hidden !== hidden) this.panel.hidden = hidden;
    if (!id || !c) return;
    if (this.panel.dataset.hint !== id) this.panel.dataset.hint = id;
    const pad = hub.frame.device === "gamepad";
    const key = (action: Parameters<typeof actionPrompt>[0]) =>
      actionPrompt(action, hub.family, hub.settings.bindings);
    const messages = {
      movement: pad
        ? "Use the left stick to move. Use the right stick to face your target."
        : `Click clear ground or use ${c.movementKeys} / arrow keys to move.`,
      attack: pad
        ? `Right stick: aim. ${key("primary")}: equipped skill. Basic weapon attacks use left-click on an enemy and cost no mana.`
        : "Left-click an enemy to approach and attack. Hold to repeat.",
      skill: c.skillName
        ? `${c.skillName} costs ${c.skillMana} mana. ${pad ? `${key(SKILL_ACTIONS[c.skillSlot] ?? "primary")}: cast; right stick: aim.` : `${["X", "Q", "1", "2", "3", "4"][c.skillSlot]}: cast, or select the slot and right-click.`} Melee skills need a target in range.`
        : "Assign a learned ability in Inventory → Skills before casting.",
      resources:
        "Watch the health and mana bars. Rest away from enemies in camp or forest to recover; skills spend mana.",
      loot: pad
        ? `${key("interact")}: pick up selected nearby loot. D-pad up/down: choose a drop. Make room in Inventory if needed.`
        : "F picks up nearby loot. Open Inventory to inspect and equip it.",
      inventory: pad
        ? `${key("pause")} → Inventory: inspect your gear and equip useful finds.`
        : "V opens Inventory. Inspect your gear and equip useful finds.",
      quests: pad
        ? `${key("pause")} → Quest journal: accept and track a task. ${key("map")}: toggle minimap; ◆ marks your position.`
        : "J opens the quest journal: accept and track a task. Tab toggles the minimap; ◆ marks your position.",
      return:
        "Follow the path back to the Ashen Refuge exit. Return to camp to recover and speak to the quest giver.",
    };
    const title = `Trail guidance · ${id === "return" ? "Returning to camp" : id[0]!.toUpperCase() + id.slice(1)}`;
    const message = messages[id];
    if (this.title.textContent !== title) this.title.textContent = title;
    if (this.message.textContent !== message)
      this.message.textContent = message;
    const dismissLabel = pad
      ? "Dismiss · Pause → Settings also available"
      : "Dismiss hint";
    if (this.dismissButton.textContent !== dismissLabel)
      this.dismissButton.textContent = dismissLabel;
  }
  dispose(): void {
    this.abort.abort();
    this.panel.remove();
  }
}
