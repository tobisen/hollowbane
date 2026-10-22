import { newCampStash } from "../simulation/camp-stash-state";
import type { StashIntent } from "../simulation/camp-stash";
import type { InventorySession } from "../simulation/inventory-world";
import type { InventoryGrid } from "../simulation/inventory-grid";
import { equipmentDefinition } from "../simulation/equipment-content";
import { inspectItem } from "../simulation/item-save";
import { describeAdvancedItem } from "../simulation/item-description";
import { controllerInput as hub } from "./controller-input";
import { contextPrompt } from "../simulation/prompts";
import "./camp-stash.css";

/** Character-local presentation; transfers are immutable domain intents. */
export class CampStashView {
  private dialog = document.createElement("dialog");
  private selected: StashIntent | null = null;
  constructor(
    private root: HTMLElement,
    private session: () => InventorySession,
    private enabled: () => boolean,
    private transfer: (intent: StashIntent) => string,
  ) {
    this.dialog.id = "camp-stash";
    this.dialog.setAttribute("aria-labelledby", "stash-title");
    this.dialog.innerHTML =
      '<h2 id="stash-title">Your camp stash</h2><p>Storage for this character only. Transfers use the next free space and keep embedded components intact.</p><div class="stash-columns"><section><h3 id="stash-bag-label"></h3><div id="stash-bag" class="stash-grid" role="group" aria-labelledby="stash-bag-label"></div></section><section><h3 id="stash-grid-label"></h3><div id="stash-grid" class="stash-grid" role="group" aria-labelledby="stash-grid-label"></div></section></div><h3 id="stash-item">Choose an item to inspect</h3><pre id="stash-details"></pre><button id="stash-confirm" hidden>Confirm transfer</button><button id="stash-cancel" hidden>Cancel selection</button><p id="stash-feedback" role="status"></p><button id="stash-close">Leave stash</button><p id="stash-save-status"></p><p id="stash-help"></p>';
    root.append(this.dialog);
    this.button("stash-close").onclick = () => this.dialog.close();
    this.button("stash-cancel").onclick = () => this.cancel();
    this.button("stash-confirm").onclick = () => {
      if (!this.selected) return;
      const message = this.transfer(this.selected);
      this.selected = null;
      this.render();
      this.text("stash-feedback", message);
      this.firstItem()?.focus();
    };
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
      );
      const index = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const delta = ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1;
      buttons[(index + delta + buttons.length) % buttons.length]?.focus();
    });
  }
  private button(id: string): HTMLButtonElement {
    return this.dialog.querySelector<HTMLButtonElement>(`#${id}`)!;
  }
  private text(id: string, value: string): void {
    const element = this.dialog.querySelector(`#${id}`)!;
    if (element.textContent !== value) element.textContent = value;
  }
  private firstItem(): HTMLButtonElement | null {
    return this.dialog.querySelector<HTMLButtonElement>(
      "#stash-bag button, #stash-grid button, #stash-close",
    );
  }
  open(): void {
    if (!this.enabled() || document.querySelector("dialog[open]")) return;
    this.selected = null;
    this.text("stash-feedback", "");
    hub.clear();
    hub.blockGameplay = true;
    this.render();
    this.dialog.showModal();
    this.update();
    this.firstItem()?.focus();
  }
  update(): void {
    if (!this.dialog.open) return;
    if (!this.enabled()) {
      this.dialog.close();
      return;
    }
    this.text(
      "stash-save-status",
      this.root.querySelector("#inventory-status")?.textContent ?? "",
    );
    this.text(
      "stash-help",
      hub.frame.device === "gamepad"
        ? contextPrompt("menu", hub.family, hub.settings.bindings)
        : "Enter: inspect / confirm · Esc: cancel / leave · Arrows / Tab: navigate",
    );
  }
  private cancel(): void {
    this.selected = null;
    this.render();
    this.text("stash-feedback", "Selection cancelled; both grids unchanged.");
    this.firstItem()?.focus();
  }
  private drawGrid(
    id: string,
    grid: InventoryGrid,
    kind: "store" | "retrieve",
    s: InventorySession,
  ): void {
    const element = this.dialog.querySelector<HTMLElement>(`#${id}`)!;
    element.replaceChildren();
    element.style.gridTemplateColumns = `repeat(${grid.columns}, minmax(0, 1fr))`;
    element.style.gridTemplateRows = `repeat(${grid.rows}, minmax(0, 1fr))`;
    element.style.aspectRatio = `${grid.columns} / ${grid.rows}`;
    element.style.backgroundSize = `${100 / grid.columns}% ${100 / grid.rows}%`;
    for (const entry of [...grid.items].sort(
      (a, b) => a.y - b.y || a.x - b.x,
    )) {
      const item = entry.item,
        detail = inspectItem(item),
        d = equipmentDefinition(item);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.stashAction = kind;
      button.dataset.item = item.id;
      button.textContent = detail.name;
      button.title = detail.name;
      button.setAttribute(
        "aria-label",
        `${kind === "store" ? "Store" : "Retrieve"} ${detail.name}, ${d.width} by ${d.height}, column ${entry.x + 1}, row ${entry.y + 1}`,
      );
      button.style.gridColumn = `${entry.x + 1} / span ${d.width}`;
      button.style.gridRow = `${entry.y + 1} / span ${d.height}`;
      button.onclick = () => {
        this.selected = {
          kind,
          id: item.id,
          expectedRevision: s.character.revision,
          expectedStashRevision: s.exploration?.stash?.revision ?? 0,
        };
        const embedded = item.identified ? (item.embedded?.length ?? 0) : 0;
        this.text("stash-item", detail.name);
        this.text(
          "stash-details",
          `${detail.quality} · Requires level ${detail.requirement} · ${d.width} × ${d.height}\n${
            detail.stats
              ? Object.entries(detail.stats)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join("\n")
              : "Unidentified item; properties remain hidden."
          }\n${describeAdvancedItem(item)}${embedded ? `\n${embedded} embedded ${embedded === 1 ? "component travels" : "components travel"} with this item.` : ""}`,
        );
        this.text(
          "stash-feedback",
          kind === "store"
            ? "Store this item in your camp stash?"
            : "Retrieve this item into your backpack?",
        );
        this.button("stash-confirm").textContent =
          kind === "store" ? "Confirm store" : "Confirm retrieve";
        this.button("stash-confirm").hidden = this.button(
          "stash-cancel",
        ).hidden = false;
        this.button("stash-confirm").focus();
      };
      element.append(button);
    }
  }
  private render(): void {
    const s = this.session(),
      stash = s.exploration?.stash ?? newCampStash(),
      bag = s.character.grid;
    this.text("stash-bag-label", `Backpack · ${bag.columns} × ${bag.rows}`);
    this.text(
      "stash-grid-label",
      `Character stash · ${stash.grid.columns} × ${stash.grid.rows}`,
    );
    this.drawGrid("stash-bag", bag, "store", s);
    this.drawGrid("stash-grid", stash.grid, "retrieve", s);
    this.button("stash-confirm").hidden = this.button("stash-cancel").hidden =
      true;
    this.text("stash-item", "Choose an item to inspect");
    this.text("stash-details", "");
  }
  destroy(): void {
    this.dialog.close();
    this.dialog.remove();
  }
}
