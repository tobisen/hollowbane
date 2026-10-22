import {
  MERCHANT_OFFERS,
  MERCHANT_PRICES,
  merchantItem,
  merchantSalePrice,
} from "../simulation/camp-merchant-state";
import type { MerchantIntent } from "../simulation/camp-merchant";
import type { InventorySession } from "../simulation/inventory-world";
import { inspectItem } from "../simulation/item-save";
import { describeAdvancedItem } from "../simulation/item-description";
import { equipmentDefinition } from "../simulation/equipment-content";
import { controllerInput as hub } from "./controller-input";
import { contextPrompt } from "../simulation/prompts";
import "./camp-merchant.css";

/** Presentation emits a quoted intent; all prices/ownership are checked again by the domain. */
export class CampMerchantView {
  private dialog = document.createElement("dialog");
  private selected: MerchantIntent | null = null;
  constructor(
    private root: HTMLElement,
    private session: () => InventorySession,
    private enabled: () => boolean,
    private trade: (intent: MerchantIntent) => string,
  ) {
    this.dialog.id = "camp-merchant";
    this.dialog.setAttribute("aria-labelledby", "merchant-title");
    this.dialog.innerHTML =
      '<h2 id="merchant-title">Orren’s road supplies</h2><p id="merchant-gold"></p><p>One of each offer · no restock or buyback. Unequip and identify items before selling.</p><div class="merchant-columns"><section><h3>Buy supplies</h3><div id="merchant-offers"></div></section><section><h3>Sell from backpack</h3><div id="merchant-backpack"></div></section></div><section aria-label="Trade inspection"><h3 id="merchant-item">Choose an item to inspect</h3><pre id="merchant-details"></pre><p id="merchant-quote"></p><button id="merchant-confirm" hidden>Confirm trade</button><button id="merchant-cancel" hidden>Cancel selection</button></section><p id="merchant-feedback" role="status"></p><button id="merchant-close">Leave merchant</button><p id="merchant-help"></p>';
    root.append(this.dialog);
    const saveStatus = document.createElement("p");
    saveStatus.id = "merchant-save-status";
    this.dialog.querySelector("#merchant-help")!.before(saveStatus);
    this.button("merchant-close").onclick = () => this.dialog.close();
    this.button("merchant-cancel").onclick = () => this.cancel();
    this.button("merchant-confirm").onclick = () => {
      if (!this.selected) return;
      const message = this.trade(this.selected);
      this.selected = null;
      this.render();
      this.text("merchant-feedback", message);
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
      const delta =
        event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
      buttons[(index + delta + buttons.length) % buttons.length]?.focus();
    });
  }
  private button(id: string): HTMLButtonElement {
    return this.dialog.querySelector<HTMLButtonElement>(`#${id}`)!;
  }
  private text(id: string, text: string) {
    const element = this.dialog.querySelector(`#${id}`)!;
    if (element.textContent !== text) element.textContent = text;
  }
  private firstItem(): HTMLButtonElement | null {
    return this.dialog.querySelector<HTMLButtonElement>(
      "#merchant-offers button:not(:disabled), #merchant-backpack button, #merchant-close",
    );
  }
  open(): void {
    if (!this.enabled() || document.querySelector("dialog[open]")) return;
    this.selected = null;
    this.text("merchant-feedback", "");
    hub.clear();
    hub.blockGameplay = true;
    this.render();
    this.update();
    this.dialog.showModal();
    this.firstItem()?.focus();
  }
  update(): void {
    if (this.dialog.open && !this.enabled()) this.dialog.close();
    if (this.dialog.open)
      this.text(
        "merchant-help",
        hub.frame.device === "gamepad"
          ? contextPrompt("menu", hub.family, hub.settings.bindings)
          : "Enter: inspect / confirm · Esc: cancel / leave · Arrows / Tab: navigate",
      );
    if (this.dialog.open) {
      const status =
        this.root.querySelector("#inventory-status")?.textContent ?? "";
      const output = this.dialog.querySelector("#merchant-save-status")!;
      if (output.textContent !== status) output.textContent = status;
    }
  }
  private cancel(): void {
    this.selected = null;
    this.render();
    this.text(
      "merchant-feedback",
      "Selection cancelled; gold and items unchanged.",
    );
    this.firstItem()?.focus();
  }
  private render(): void {
    const s = this.session();
    this.text("merchant-gold", `Gold: ${s.exploration?.containers?.gold ?? 0}`);
    for (const kind of ["buy", "sell"] as const) {
      const list = this.dialog.querySelector(
        kind === "buy" ? "#merchant-offers" : "#merchant-backpack",
      )!;
      list.replaceChildren();
      const items =
        kind === "buy"
          ? MERCHANT_OFFERS.map(merchantItem)
          : s.character.grid.items.map((e) => e.item);
      if (!items.length) list.textContent = "Your backpack is empty.";
      for (const item of items) {
        const id = kind === "buy" ? item.base : item.id;
        const price =
          kind === "buy" ? MERCHANT_PRICES[id]! : merchantSalePrice(item);
        const soldOut =
          kind === "buy" && !!s.exploration?.merchant?.purchased.includes(id);
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.tradeKind = kind;
        button.dataset.item = id;
        button.textContent = `${inspectItem(item).name} · ${soldOut ? "Sold out" : `${price} gold`}`;
        button.disabled = soldOut;
        button.onclick = () => {
          this.selected = {
            kind,
            id,
            expectedRevision: s.character.revision,
            expectedMerchantRevision: s.exploration?.merchant?.revision ?? 0,
          };
          const detail = inspectItem(item),
            footprint = equipmentDefinition(item);
          this.text("merchant-item", detail.name);
          this.text(
            "merchant-details",
            `Level ${detail.level} · Requires level ${detail.requirement} · ${footprint.width} × ${footprint.height}\n${
              detail.stats
                ? Object.entries(detail.stats)
                    .map(([name, value]) => `${name}: ${value}`)
                    .join("\n")
                : "Identify this item in your inventory before selling."
            }${item.identified ? `\n${describeAdvancedItem(item)}` : ""}${item.embedded?.length ? `\nSelling also removes all ${item.embedded.length} embedded components permanently.` : ""}`,
          );
          this.text(
            "merchant-quote",
            `${kind === "buy" ? "Buy for" : "Sell permanently for"} ${price} gold?`,
          );
          this.text(
            "merchant-feedback",
            "Review the item, then confirm or cancel.",
          );
          this.button("merchant-confirm").hidden = false;
          this.button("merchant-cancel").hidden = false;
          this.button("merchant-confirm").textContent =
            `Confirm ${kind} · ${price} gold`;
          this.button("merchant-confirm").focus();
        };
        list.append(button);
      }
    }
    this.button("merchant-confirm").hidden = true;
    this.button("merchant-cancel").hidden = true;
    this.text("merchant-item", "Choose an item to inspect");
    this.text("merchant-details", "");
    this.text("merchant-quote", "");
  }
  destroy(): void {
    this.dialog.close();
    this.dialog.remove();
  }
}
