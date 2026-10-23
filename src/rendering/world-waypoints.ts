import { AREA_IDS, areaDefinition } from "../simulation/world";
import {
  nearWaypoint,
  waypointAreaAvailable,
} from "../simulation/world-waypoint-state";
import type { WorldSession } from "../simulation/world-session";
import type {
  WaypointContext,
  WaypointIntent,
} from "../simulation/world-waypoints";
import { controllerInput as hub } from "./controller-input";
import { contextPrompt } from "../simulation/prompts";
import "./world-waypoints.css";
export class WaypointView {
  private dialog = document.createElement("dialog");
  private selected: WaypointIntent | null = null;
  constructor(
    private root: HTMLElement,
    private world: () => WorldSession,
    private context: () => WaypointContext,
    private enabled: () => boolean,
    private stop: () => void,
    private attune: () => string,
    private travel: (intent: WaypointIntent) => {
      ok: boolean;
      message: string;
    },
  ) {
    this.dialog.id = "world-waypoints";
    this.dialog.setAttribute("aria-labelledby", "waypoint-title");
    this.dialog.innerHTML =
      '<h2 id="waypoint-title">Waypoints</h2><p id="waypoint-current"></p><p>Approach the ◈ waypoint shown on your map to attune it. Travel requires attuned endpoints and a quiet departure.</p><button id="waypoint-attune">Attune current waypoint</button><nav id="waypoint-destinations" aria-label="Waypoint destinations"></nav><p id="waypoint-condition"></p><button id="waypoint-confirm" hidden>Confirm travel</button><button id="waypoint-cancel" hidden>Cancel selection</button><p id="waypoint-feedback" role="status"></p><button id="waypoint-close">Close waypoints</button><p id="waypoint-save-status"></p><p id="waypoint-help"></p>';
    root.append(this.dialog);
    this.button("waypoint-close").onclick = () => this.dialog.close();
    this.button("waypoint-attune").onclick = () => {
      const message = this.attune();
      this.render();
      this.text("waypoint-feedback", message);
      this.focusFirst();
    };
    this.button("waypoint-confirm").onclick = () => {
      if (!this.selected) return;
      const result = this.travel(this.selected);
      this.selected = null;
      this.render();
      this.text("waypoint-feedback", result.message);
      this.focusFirst();
    };
    this.button("waypoint-cancel").onclick = () => this.cancel();
    this.dialog.addEventListener("cancel", (event) => {
      if (this.selected) {
        event.preventDefault();
        this.cancel();
      }
    });
    this.dialog.addEventListener("close", () => {
      this.selected = null;
      hub.clear();
      hub.blockGameplay = Boolean(document.querySelector("dialog[open]"));
      if (!hub.blockGameplay)
        root.querySelector<HTMLElement>("#combat-world")?.focus();
    });
    this.dialog.addEventListener("keydown", (event) => {
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      event.preventDefault();
      const buttons = Array.from(
          this.dialog.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled):not([hidden])",
          ),
        ),
        i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[
        (i +
          (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1) +
          buttons.length) %
          buttons.length
      ]?.focus();
    });
    window.addEventListener("hollowbane-waypoints-toggle", this.toggle);
    window.addEventListener("keydown", this.keydown);
  }
  private button(id: string): HTMLButtonElement {
    return this.dialog.querySelector<HTMLButtonElement>(`#${id}`)!;
  }
  private text(id: string, value: string): void {
    const e = this.dialog.querySelector(`#${id}`)!;
    if (e.textContent !== value) e.textContent = value;
  }
  private focusFirst(): void {
    this.dialog
      .querySelector<HTMLButtonElement>("button:not(:disabled):not([hidden])")
      ?.focus();
  }
  private keydown = (event: KeyboardEvent) => {
    if (
      event.code !== "KeyN" ||
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      (event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)))
    )
      return;
    event.preventDefault();
    this.toggle();
  };
  private toggle = () => {
    if (this.dialog.open) this.dialog.close();
    else this.open();
  };
  open(): void {
    if (!this.enabled() || document.querySelector("dialog[open]")) return;
    this.stop();
    this.selected = null;
    hub.clear();
    hub.blockGameplay = true;
    this.text("waypoint-feedback", "");
    this.render();
    this.dialog.showModal();
    this.focusFirst();
    this.update();
  }
  update(): void {
    if (!this.dialog.open) return;
    if (!this.enabled()) {
      this.dialog.close();
      return;
    }
    this.text(
      "waypoint-help",
      hub.frame.device === "gamepad"
        ? contextPrompt("menu", hub.family, hub.settings.bindings)
        : "Enter: choose / confirm · Esc: cancel / close · Arrows / Tab: navigate · N: close",
    );
    this.text(
      "waypoint-save-status",
      this.root.querySelector("#inventory-status")?.textContent ?? "",
    );
  }
  private cancel(): void {
    this.selected = null;
    this.render();
    this.text("waypoint-feedback", "Travel cancelled; world unchanged.");
    this.focusFirst();
  }
  private render(): void {
    const w = this.world(),
      area = w.travel.state.area,
      state = w.waypoints;
    const near = nearWaypoint(w.travel.layout, w.travel.state.position),
      ready = near && this.context().safe;
    this.text("waypoint-current", `Current area: ${areaDefinition(area).name}`);
    this.text(
      "waypoint-condition",
      !near
        ? "Approach the ◈ waypoint before attuning or traveling."
        : !this.context().safe
          ? "Clear nearby enemies and projectiles before traveling."
          : "Waypoint within reach. Choose an attuned destination.",
    );
    this.button("waypoint-attune").disabled =
      !ready || state.unlocked.includes(area);
    this.button("waypoint-attune").textContent = state.unlocked.includes(area)
      ? "Current waypoint attuned"
      : "Attune current waypoint";
    const list = this.dialog.querySelector("#waypoint-destinations")!;
    list.replaceChildren();
    for (const destination of AREA_IDS) {
      const unlocked =
          state.unlocked.includes(destination) &&
          waypointAreaAvailable(destination, w.contentVersion),
        current = destination === area;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.destination = destination;
      button.textContent = `${areaDefinition(destination).name} · ${current ? "Current" : unlocked ? "Attuned" : "Locked"}`;
      button.disabled =
        current || !unlocked || !ready || !state.unlocked.includes(area);
      button.onclick = () => {
        this.selected = {
          destination,
          expectedArea: area,
          expectedRevision: state.revision,
        };
        this.text(
          "waypoint-feedback",
          `Travel to ${areaDefinition(destination).name}?`,
        );
        this.button("waypoint-confirm").hidden = this.button(
          "waypoint-cancel",
        ).hidden = false;
        this.button("waypoint-confirm").focus();
      };
      list.append(button);
    }
    this.button("waypoint-confirm").hidden = this.button(
      "waypoint-cancel",
    ).hidden = true;
  }
  destroy(): void {
    this.dialog.close();
    this.dialog.remove();
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("hollowbane-waypoints-toggle", this.toggle);
  }
}
