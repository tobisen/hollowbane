import { ATTRIBUTE_NAMES } from "../simulation/attributes";
import type { InventoryRuntime } from "./inventory-runtime";
import { characterPanelState } from "./character-panel-state";
import "./character-panel.css";
export class CharacterPanel {
  readonly element = document.createElement("details");
  constructor(private runtime: InventoryRuntime) {
    this.element.id = "character-panel";
    this.element.innerHTML = `<summary id="character-toggle">Character · The Wayfarer</summary><section aria-label="Character progression"><div class="character-heading"><div><p class="character-eyebrow">THE WAYFARER</p><h3>Level <span id="character-level"></span></h3></div><p>Unspent points <strong id="character-points"></strong></p></div><label class="character-xp-label">Experience <span id="character-xp"></span><progress id="character-progress" max="1" value="0"></progress></label><div class="character-columns"><div><h4>Attributes</h4>${ATTRIBUTE_NAMES.map((key) => `<div class="character-attribute"><span>${key[0]!.toUpperCase() + key.slice(1)}</span><strong id="character-${key}"></strong><span data-allocation="${key}"></span></div>`).join("")}</div><div><h4>Combat totals</h4><dl id="character-stats"></dl><h4>Resistances</h4><dl id="character-resistances"></dl></div></div><p id="character-feedback" role="status">Maximum changes retain current HP and mana; decreases clamp them. No respec.</p></section>`;
  }
  render(): void {
    const xp = this.runtime.progression();
    if (!xp) {
      this.element.hidden = true;
      return;
    }
    this.element.hidden = false;
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
