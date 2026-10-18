import {
  type CharacterAttributes,
  ATTRIBUTE_NAMES,
} from "../simulation/attributes";
import type { InventoryRuntime } from "./inventory-runtime";
import { characterPanelState } from "./character-panel-state";
import "./character-panel.css";
export class CharacterPanel {
  readonly element = document.createElement("details");
  private shown: CharacterAttributes | undefined;
  constructor(
    private runtime: InventoryRuntime,
    private canAllocate: () => boolean = () => false,
  ) {
    this.element.id = "character-panel";
    this.element.innerHTML = `<summary id="character-toggle">Character · The Wayfarer</summary><section aria-label="Character progression"><div class="character-heading"><div><p class="character-eyebrow">THE WAYFARER</p><h3>Level <span id="character-level"></span></h3></div><p>Unspent points <strong id="character-points"></strong></p></div><label class="character-xp-label">Experience <span id="character-xp"></span><progress id="character-progress" max="1" value="0"></progress></label><div class="character-columns"><div><h4>Attributes</h4>${ATTRIBUTE_NAMES.map((key) => `<div class="character-attribute"><span>${key[0]!.toUpperCase() + key.slice(1)}</span><strong id="character-${key}"></strong><span data-allocation="${key}"></span></div>`).join("")}</div><div><h4>Combat totals</h4><dl id="character-stats" tabindex="0" aria-label="Derived combat statistics"></dl><h4>Resistances</h4><dl id="character-resistances"></dl></div></div><p id="character-feedback" role="status">Maximum changes retain current HP and mana; decreases clamp them. No respec.</p></section>`;
    for (const key of ATTRIBUTE_NAMES) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = `allocate-${key}`;
      button.textContent = "+1";
      button.setAttribute("aria-label", `Allocate 1 ${key}`);
      button.onkeydown = (event) => {
        if (event.repeat) event.preventDefault();
      };
      button.onclick = (event) => {
        if (event.detail > 1 || !this.canAllocate() || !this.shown) return;
        const feedback = this.runtime.allocate(key, this.shown);
        this.render();
        this.element.querySelector("#character-feedback")!.textContent =
          feedback;
      };
      this.element.querySelector(`[data-allocation="${key}"]`)!.append(button);
    }
  }
  containsFocus(): boolean {
    return this.element.contains(document.activeElement);
  }
  /** Semantic actions only; existing hub owns mappings, edge detection and disconnect. */
  action(action: string): boolean {
    if (!this.containsFocus()) return false;
    const active = document.activeElement as HTMLElement;
    const summary = this.element.querySelector<HTMLElement>("summary")!;
    const stats = this.element.querySelector<HTMLElement>("#character-stats")!;
    const buttons = Array.from(
      this.element.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
    );
    const focus = (target: HTMLElement) => {
      target.focus();
      target.scrollIntoView({ block: "nearest" });
    };
    if (action === "cancel") {
      if (!this.element.open) return false;
      this.element.open = false;
      focus(summary);
      return true;
    }
    if (action === "primary") {
      if (active === summary || active instanceof HTMLButtonElement)
        active.click();
      return true;
    }
    if (action === "secondary") {
      this.element.open = true;
      focus(stats);
      return true;
    }
    if (!["up", "down", "left", "right"].includes(action)) return false;
    if (active === summary) {
      if (action === "up" || action === "left") return false;
      this.element.open = true;
      focus(buttons[0] ?? stats);
      return true;
    }
    if (active === stats) {
      if (action === "right") return false;
      if (action === "left") focus(buttons[0] ?? summary);
      else
        this.element
          .closest("dialog")!
          .scrollBy({ top: action === "down" ? 100 : -100 });
      return true;
    }
    const index = buttons.indexOf(active as HTMLButtonElement);
    if (action === "left") focus(summary);
    else if (action === "right") focus(stats);
    else if (action === "up") focus(buttons[index - 1] ?? summary);
    else focus(buttons[index + 1] ?? stats);
    return true;
  }
  render(): void {
    const xp = this.runtime.progression();
    if (!xp) {
      this.element.hidden = true;
      return;
    }
    this.element.hidden = false;
    this.shown = xp.attributes;
    const focused = document.activeElement;
    for (const key of ATTRIBUTE_NAMES)
      this.element.querySelector<HTMLButtonElement>(
        `#allocate-${key}`,
      )!.disabled = !this.canAllocate() || xp.attributes.available < 1;
    if (
      focused instanceof HTMLButtonElement &&
      this.element.contains(focused) &&
      focused.disabled
    )
      this.element.querySelector<HTMLElement>("#character-stats")!.focus();
    const view = characterPanelState(xp, this.runtime.derived);
    const text = (id: string, value: string | number) => {
      const el = this.element.querySelector(`#character-${id}`)!;
      if (el.textContent !== String(value)) el.textContent = String(value);
    };
    text("level", view.level);
    text("points", view.available);
    text(
      "xp",
      view.nextLevelXp === null
        ? `${view.totalXp} · Level cap reached`
        : `${view.totalXp} / ${view.nextLevelXp} XP`,
    );
    this.element.querySelector<HTMLProgressElement>("progress")!.value =
      view.progress;
    for (const key of ATTRIBUTE_NAMES) text(key, view.attributes[key]);
    const list = (
      id: string,
      entries: Record<string, number>,
      percent = false,
    ) => {
      const html = Object.entries(entries)
        .map(
          ([key, value]) =>
            `<dt>${key[0]!.toUpperCase() + key.slice(1)}</dt><dd>${percent ? `${Math.round(value * 100)}%` : Number(value.toFixed(2))}</dd>`,
        )
        .join("");
      const el = this.element.querySelector(`#character-${id}`)!;
      if (el.innerHTML !== html) el.innerHTML = html;
    };
    list("stats", view.stats);
    list("resistances", view.resistances, true);
  }
}
