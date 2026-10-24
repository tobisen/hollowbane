import { controllerInput as hub } from "./controller-input";
import { installControllerSettings } from "./controller-settings";
import "./player-menu.css";

/** Player-session UI only. Simulation advancement remains owned by the scene. */
export class PlayerMenu {
  readonly dialog = document.createElement("dialog");
  private button = document.createElement("button");
  private abort = new AbortController();
  private settingsInstalled = false;
  private busy = false;
  private exited = false;
  private home: HTMLElement;
  private settings: HTMLElement;
  constructor(
    root: HTMLElement,
    private ready: () => boolean,
    private paused: (value: boolean) => void,
    private save: () => Promise<void>,
  ) {
    this.button.id = "player-pause-open";
    this.button.textContent = "Pause game";
    this.button.type = "button";
    (root.querySelector(".polish-navigation") ?? root).append(this.button);
    this.dialog.id = "player-pause-dialog";
    this.dialog.className = "player-menu";
    this.dialog.setAttribute("aria-labelledby", "player-pause-title");
    this.dialog.innerHTML = `<section data-pause-home><p class="eyebrow">HOLLOWBANE</p><h2 id="player-pause-title">A moment by the fire</h2><p>Gameplay is paused.</p><nav aria-label="Pause menu"><button id="player-resume">Resume Game</button><button id="player-settings">Settings</button><button id="player-save-exit">Save &amp; Exit</button></nav><p id="player-save-status" role="status" aria-live="polite"></p><p id="player-pause-prompts" class="pause-help">Enter: Choose · Escape: Back · Tab: Navigate</p></section><section data-pause-settings hidden><h2>Settings</h2><button id="player-settings-back">Back to Pause Menu</button><div id="controller-settings-host"></div></section>`;
    root.append(this.dialog);
    this.home = this.dialog.querySelector("[data-pause-home]")!;
    this.settings = this.dialog.querySelector("[data-pause-settings]")!;
    this.button.onclick = () => this.toggle();
    this.dialog.querySelector<HTMLButtonElement>("#player-save-exit")!.onclick =
      () => void this.saveAndExit();
    window.addEventListener(
      "pageshow",
      (event) => {
        if (event.persisted && this.exited) location.replace("./");
      },
      { signal: this.abort.signal },
    );
    this.dialog.querySelector<HTMLButtonElement>("#player-resume")!.onclick =
      () => this.close();
    this.dialog.querySelector<HTMLButtonElement>("#player-settings")!.onclick =
      () => {
        this.home.hidden = true;
        this.settings.hidden = false;
        if (!this.settingsInstalled) {
          installControllerSettings();
          this.settingsInstalled = true;
        }
        this.dialog
          .querySelector<HTMLButtonElement>("#player-settings-back")!
          .focus();
      };
    this.dialog.querySelector<HTMLButtonElement>(
      "#player-settings-back",
    )!.onclick = () => this.back();
    this.dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.back();
    });
    this.dialog.addEventListener("close", () => {
      this.paused(false);
      hub.clear();
      hub.blockGameplay = Boolean(root.querySelector("dialog[open]"));
      root.querySelector<HTMLElement>("#combat-world")?.focus();
    });
    window.addEventListener(
      "hollowbane-player-menu",
      (event) => {
        event.preventDefault();
        this.toggle();
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key !== "Escape" ||
          event.repeat ||
          event.defaultPrevented ||
          document.fullscreenElement ||
          document.querySelector("dialog[open]")
        )
          return;
        if (this.ready()) {
          event.preventDefault();
          this.toggle();
        }
      },
      { signal: this.abort.signal },
    );
    this.dialog.addEventListener("keydown", (event) => {
      if ((event.target as HTMLElement).matches("input,select,textarea"))
        return;
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const controls = Array.from(
        this.dialog.querySelectorAll<HTMLElement>(
          "button,input,select,a[href]",
        ),
      ).filter(
        (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
      );
      const current = controls.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? controls.length - 1
            : (current + (event.key === "ArrowUp" ? -1 : 1) + controls.length) %
              controls.length;
      controls[next]?.focus();
    });
  }
  toggle(): void {
    if (this.busy) return;
    if (this.dialog.open) {
      this.back();
      return;
    }
    // Respect inventory/recovery and other existing modal ownership.
    if (!this.ready() || document.querySelector("dialog[open]")) return;
    this.home.hidden = false;
    this.settings.hidden = true;
    this.paused(true);
    hub.clear();
    hub.blockGameplay = true;
    this.dialog.showModal();
    this.dialog.querySelector<HTMLButtonElement>("#player-resume")!.focus();
  }
  private back(): void {
    if (this.busy) return;
    hub.clear();
    if (!this.settings.hidden) {
      this.settings.hidden = true;
      this.home.hidden = false;
      this.dialog.querySelector<HTMLButtonElement>("#player-settings")!.focus();
    } else this.close();
  }
  private close(): void {
    if (!this.busy) this.dialog.close();
  }
  private async saveAndExit(): Promise<void> {
    if (this.busy || !this.ready()) return;
    this.busy = true;
    const buttons = Array.from(
      this.dialog.querySelectorAll<HTMLButtonElement>("button"),
    );
    const disabled = buttons.map((button) => button.disabled);
    for (const button of buttons) button.disabled = true;
    this.home.querySelector("nav")!.setAttribute("aria-busy", "true");
    const status = this.dialog.querySelector<HTMLElement>(
      "#player-save-status",
    )!;
    status.textContent = "Saving your adventure…";
    hub.clear();
    try {
      await this.save();
      if (this.abort.signal.aborted) return;
      status.textContent = "Adventure saved. Returning to the main menu…";
      this.exited = true;
      location.assign("./");
    } catch (error) {
      this.exited = false;
      this.busy = false;
      buttons.forEach((button, index) => (button.disabled = disabled[index]!));
      this.home.querySelector("nav")!.setAttribute("aria-busy", "false");
      status.textContent = `Saving failed: ${error instanceof Error ? error.message : "Storage unavailable"}. Your live progress is still here. Retry Save & Exit or resume and export from inventory.`;
      this.dialog
        .querySelector<HTMLButtonElement>("#player-save-exit")!
        .focus();
    }
  }
  dispose(): void {
    this.abort.abort();
    this.button.remove();
    this.dialog.remove();
  }
}
