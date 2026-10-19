import { SkillTreePanel } from "./skill-tree-panel";
import { CharacterPanel } from "./character-panel";
import { insertSocket, extractSockets } from "../simulation/item-sockets";
import { SOCKET_CONTENT } from "../simulation/socket-content";
import { RUNE_CONTENT } from "../simulation/rune-content";
import {
  describeAdvancedItem,
  describeRuneRecipes,
  compareItemModifiers,
} from "../simulation/item-description";
import {
  inventoryNeighbor,
  type GridDirection,
} from "../simulation/inventory-navigation";
import type { InventoryRuntime } from "./inventory-runtime";
import { InventoryStorage } from "./inventory-storage";
import { controllerInput as hub } from "./controller-input";
import { actionPrompt } from "../simulation/prompts";
import {
  EQUIP_SLOTS,
  equipmentDefinition,
  type EquipSlot,
} from "../simulation/equipment-content";
import { ownedItem, ownedItems, equipItem } from "../simulation/equipment";
import {
  moveOwned,
  identifyOwned,
  dropOwned,
  pickupDrop,
} from "../simulation/inventory-world";
import { inspectItem } from "../simulation/item-save";
import {
  serializeCharacter,
  deserializeCharacter,
} from "../simulation/inventory-save";
import { compareEquipment } from "../simulation/equipment-stats";
import { LOOT_COLORS, type LootView } from "./loot-view";
import type { Navigation } from "../world/navigation";
import type { Point } from "../world/isometric";
import type { GeneratedItem } from "../simulation/loot";
import "./inventory.css";
function icon(item: GeneratedItem): string {
  const base = item.base;
  const gem = SOCKET_CONTENT.gems.find((g) => g.id === base),
    rune = RUNE_CONTENT.components.findIndex((r) => r.id === base);
  if (gem) {
    const color = {
      fire: "#f3a078",
      cold: "#a6e8f3",
      lightning: "#d5bfff",
      poison: "#a8d98e",
    }[gem.element];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="${color}" stroke-width="2.2"><path d="m32 5 22 24-22 29L10 29Zm0 0-9 24 9 29 9-29ZM10 29h44"/><text x="32" y="37" text-anchor="middle" fill="${color}" stroke="none" font-size="11">${["I", "II", "III"][gem.grade - 1]}</text></svg>`;
  }
  if (rune >= 0)
    return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="#decaa5" stroke-width="2.2"><path d="m18 8 28 2 7 22-9 23-28-2-6-23ZM32 17v29m-10-17 10-8 10 8${rune & 1 ? "m-20 9 10 8 10-8" : "m-20-1h20"}${rune & 2 ? "m-25-12 5 4" : ""}${rune & 4 ? "m20 8-5 4" : ""}${rune & 8 ? "m-11-19 5-4" : ""}"/></svg>`;

  const shape = base.includes("blade")
    ? '<path d="M14 45 39 10l5-2-1 6-25 35m-9-10 18 12M9 53l5-7"/>'
    : base.includes("bow")
      ? '<path d="M19 8q34 24 0 48l8-24Zm0 0 8 24-8 24M8 32h43m-8-6 8 6-8 6"/>'
      : base.includes("staff")
        ? '<path d="m18 55 23-40m-5 1c-13-18 18-14 7-3m-8 8 11 6"/>'
        : base.includes("band") || base.includes("pendant")
          ? '<circle cx="32" cy="34" r="16"/><path d="m25 18 7-10 7 10-7 7Z"/>'
          : base.includes("cap")
            ? '<path d="M13 43v-9C8 4 56 4 51 34v9l-15 8v-18h-8v18Zm2-12h34"/>'
            : base.includes("guard")
              ? '<path d="m13 14 19-6 19 6-3 26-16 16-16-16Zm19-6v48M14 29h36"/>'
              : base.includes("boot")
                ? '<path d="M19 10h19v27l14 9v8H13V39l6-4ZM19 22h19"/>'
                : base.includes("sash")
                  ? '<path d="M8 23h48v19H8Zm17-4h15v27H25Z"/>'
                  : base.includes("glove")
                    ? '<path d="M17 34V17q4-6 7 0v12-19q4-5 7 0v18-20q4-5 7 0v21-16q5-4 7 2v23l-8 17H21L10 37q0-7 7-3Z"/>'
                    : '<path d="m20 9 12 6 12-6 13 16-11 9-5-9v30H23V25l-5 9-11-9ZM32 15v40"/>';
  return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round">${shape}</svg>`;
}
export class InventoryView {
  readonly dialog: HTMLDialogElement;
  private storage: InventoryStorage;
  private characterPanel: CharacterPanel;
  private skillPanel: SkillTreePanel;
  private selected: string | null = null;
  private held: string | null = null;
  private socketHost: string | null = null;
  private componentChoice: string | null = null;
  private ready = false;
  private saving = false;
  private dirty = false;
  private timer = 0;
  private disposed = false;
  private drag: {
    id: string;
    pointer: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    active: boolean;
  } | null = null;
  private ghost: HTMLElement | null = null;
  private suppressClick = false;
  private promptTimer = 0;
  private lastDevice = "";
  private status = "Loading character checkpoint…";
  private listen = (reason: string) => {
    this.render();
    if (reason !== "load") this.changed();
  };
  constructor(
    private root: HTMLElement,
    private runtime: InventoryRuntime,
    private loot: LootView,
    private nav: Navigation,
    private player: () => { position: Point; alive: boolean; tick: number },
    laboratory = false,
  ) {
    this.storage = new InventoryStorage(
      nav,
      laboratory ? "hollowbane-l3-item-laboratory" : undefined,
    );
    root.insertAdjacentHTML(
      "beforeend",
      '<button id="inventory-open" class="inventory-open">Inventory · V / View</button>',
    );
    root
      .querySelector(".polish-navigation")
      ?.append(root.querySelector("#inventory-open")!);
    this.dialog = document.createElement("dialog");
    this.dialog.id = "inventory-dialog";
    this.dialog.setAttribute("aria-labelledby", "inventory-title");
    this.dialog.innerHTML = `<header><p>HOLLOWBANE / L2</p><h2 id="inventory-title">The Wayfarer’s Kit</h2><button id="inventory-close" aria-label="Close inventory">Close ×</button></header><p id="inventory-prompts"></p><div class="inventory-layout"><section aria-label="Equipment"><h3>Equipment</h3><div id="inventory-gear"></div><output id="inventory-stats"></output></section><section aria-label="Backpack"><h3>Backpack <small>10 × 4 · fixed footprints</small></h3><div id="inventory-grid"></div><p id="inventory-held">Select an item to inspect or move.</p></section><section class="inventory-inspector" aria-label="Item inspection"><h3 id="inventory-name">No item selected</h3><pre id="inventory-details"></pre><pre id="inventory-compare"></pre><div class="inventory-actions"><button id="inventory-take">Select / carry</button><button id="inventory-equip">Equip</button><button id="inventory-identify">Identify</button><button id="inventory-drop">Drop nearby</button><button id="inventory-cancel">Cancel selection</button></div></section></div><footer><p id="inventory-status" role="status"></p><button id="inventory-save">Save now</button><button id="inventory-recover" hidden>Recover previous checkpoint</button><button id="inventory-export">Export snapshot</button><label>Import character snapshot <input id="inventory-import" type="file" accept="application/json,.json"></label><p>Progression, attributes, items and loot stream are saved. Combat, position and current resources restart. An L1 item archive is not a character save.</p></footer>`;
    if (nav.logicalMap)
      this.dialog.querySelector("footer p:last-child")!.textContent =
        "World checkpoints restore area, position, progression, items and loot together. Combat and current resources restart.";
    if (loot.contentVersion >= 4)
      this.dialog.querySelector("header p")!.textContent = "HOLLOWBANE / L3";
    this.dialog
      .querySelector(".inventory-actions")!
      .insertAdjacentHTML(
        "beforeend",
        '<button id="inventory-socket" hidden>Sockets…</button><button id="inventory-extract" hidden>Extract all contents</button>',
      );
    this.dialog
      .querySelector(".inventory-actions")!
      .insertAdjacentHTML(
        "afterend",
        '<p id="inventory-socket-message" role="status" hidden></p><section id="inventory-socket-controls" class="inventory-socket-controls" aria-label="Socket insertion" hidden><h4>Append a component</h4><p>Insertion preserves order. Extraction returns every component intact only when all fit.</p><label>Bag component <select id="inventory-component"></select></label><pre id="inventory-socket-preview" tabindex="0" data-controller-read aria-live="polite"></pre><button id="inventory-insert">Insert component</button><button id="inventory-socket-cancel">Back without inserting</button></section>',
      );
    if (loot.contentVersion >= 4) {
      const book = document.createElement("details");
      book.id = "inventory-recipes";
      book.innerHTML =
        '<summary id="inventory-recipes-toggle">Ordered sigil patterns · 8 recipes</summary><pre id="inventory-recipe-text" tabindex="0" data-controller-read></pre>';
      book.querySelector("pre")!.textContent = describeRuneRecipes();
      this.dialog.querySelector("footer")!.prepend(book);
      const notice = document.createElement("p");
      notice.id = "inventory-laboratory-notice";
      notice.textContent = laboratory
        ? "Developer item laboratory · starts at level 40 · separate progression and item save."
        : "Normal character save · item requirements apply. The separate developer laboratory can test all high-level patterns.";
      const link = document.createElement("a");
      link.href = laboratory
        ? "?inventory=1&advanced=1"
        : "?inventory=1&advanced=1&itemLab=1";
      link.textContent = laboratory
        ? "Return to normal character"
        : "Open separate item laboratory";
      this.dialog.querySelector("footer")!.append(notice, link);
    }
    this.characterPanel = new CharacterPanel(runtime, () => this.ready);
    this.dialog
      .querySelector(".inventory-layout")!
      .before(this.characterPanel.element);
    this.skillPanel = new SkillTreePanel(
      runtime,
      () => this.ready,
      () => {
        if (this.lastDevice !== hub.frame.device) {
          this.resetSelection();
          this.lastDevice = hub.frame.device;
        }
      },
    );
    this.characterPanel.element.after(this.skillPanel.element);
    root.append(this.dialog);
    const button = (id: string, fn: () => void) => {
      this.dialog.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = fn;
    };
    root.querySelector<HTMLButtonElement>("#inventory-open")!.onclick = () =>
      this.toggle();
    button("inventory-close", () => this.close());
    button("inventory-socket", () => this.openSockets());
    button("inventory-socket-cancel", () => this.closeSockets());
    button("inventory-insert", () => this.insertComponent());
    button("inventory-extract", () => this.extractComponents());
    this.dialog.querySelector<HTMLSelectElement>(
      "#inventory-component",
    )!.onchange = (e) => {
      this.componentChoice = (e.target as HTMLSelectElement).value;
      this.renderSockets();
    };
    button("inventory-take", () => {
      this.held = this.selected;
      this.render();
    });
    button("inventory-cancel", () => {
      this.held = null;
      this.render();
    });
    button("inventory-identify", () => {
      if (this.selected)
        this.perform(identifyOwned(this.runtime.session(), this.selected));
    });
    button("inventory-equip", () => this.equip());
    button("inventory-drop", () => {
      if (this.selected) {
        const p = this.player();
        this.perform(
          dropOwned(
            this.runtime.session(),
            this.selected,
            p.position,
            nav,
            p.tick,
            p.alive,
          ),
        );
      }
    });
    button("inventory-save", () => {
      this.dirty = true;
      void this.flush();
    });
    button("inventory-recover", () => {
      void this.recover();
    });
    button("inventory-export", () => {
      try {
        const url = URL.createObjectURL(
          new Blob([serializeCharacter(runtime.session(), nav)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "hollowbane-character.json";
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        this.message(String(e));
      }
    });
    this.dialog.querySelector<HTMLInputElement>("#inventory-import")!.onchange =
      (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) void this.importFile(file);
      };
    window.addEventListener("hollowbane-inventory-toggle", this.mapToggle);
    window.addEventListener("blur", this.cancelDrag);
    this.dialog.addEventListener(
      "hollowbane-inventory-action",
      this.controllerAction,
    );
    this.dialog.addEventListener("focusin", (e) => {
      if (!this.held) return;
      for (const el of Array.from(
        this.dialog.querySelectorAll<HTMLElement>("[data-placement]"),
      ))
        delete el.dataset.placement;
      const target = this.destination(e.target as Element);
      if (target)
        target.element.dataset.placement = moveOwned(
          this.runtime.session(),
          this.held,
          target.destination,
        ).ok
          ? "valid"
          : "invalid";
    });
    this.dialog.addEventListener("pointerdown", this.pointerDown);
    this.dialog.addEventListener("pointermove", this.pointerMove);
    this.dialog.addEventListener("pointerup", this.pointerUp);
    this.dialog.addEventListener("pointercancel", this.cancelDrag);
    this.dialog.addEventListener(
      "click",
      (e) => {
        if (this.suppressClick) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.suppressClick = false;
        }
      },
      true,
    );
    this.dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      if (
        this.skillPanel.action("cancel") ||
        this.characterPanel.action("cancel")
      )
        return;
      if (this.socketHost) this.closeSockets();
      else if (this.held) {
        this.held = null;
        this.render();
      } else this.close();
    });
    this.dialog.addEventListener("close", () => {
      this.held = null;
      this.socketHost = null;
      this.componentChoice = null;
      this.cancelDrag();
      hub.blockGameplay = false;
      root.querySelector<HTMLElement>("#combat-world")?.focus();
    });
    window.addEventListener("keydown", this.keydown);
    runtime.listeners.add(this.listen);
    loot.onPickup = (id) => {
      if (!this.ready)
        return "Character storage is still loading or requires recovery.";
      const p = this.player();
      return this.perform(
        pickupDrop(runtime.session(), id, p.position, nav, undefined, p.alive),
      );
    };
    loot.onChange = () => this.changed();
    this.render();
    this.dialog.showModal();
    hub.blockGameplay = true;
    this.promptTimer = window.setInterval(() => this.updatePrompts(), 100);
    window.addEventListener("hollowbane-input-reset", this.resetSelection);
    void this.load();
  }
  private keydown = (e: KeyboardEvent) => {
    if (
      e.code === "KeyV" &&
      !e.repeat &&
      !(e.target instanceof HTMLInputElement)
    ) {
      e.preventDefault();
      this.toggle();
    }
  };
  private async load() {
    try {
      const result = await this.storage.load();
      if (this.disposed) {
        this.storage.close();
        return;
      }
      if (result.kind === "valid") this.runtime.restore(result.session);
      if (result.kind === "invalid" || result.kind === "recoverable") {
        this.ready = true;
        this.message(
          `${result.error}. Original retained. ${result.kind === "recoverable" ? "Recovering the previous checkpoint may omit later changes; use the explicit recovery button." : "No valid backup. Export current session; stored original is retained."}`,
        );
        this.dialog.querySelector<HTMLButtonElement>(
          "#inventory-recover",
        )!.hidden = result.kind !== "recoverable";
      } else {
        this.ready = true;
        this.message(
          result.kind === "valid"
            ? "Character checkpoint restored."
            : "Ready · no character checkpoint yet.",
        );
        this.close();
      }
    } catch (e) {
      this.storage.lock();
      this.ready = true;
      this.message(`${String(e)}. Session usable; export to retain items.`);
    }
    this.render();
  }
  private async recover() {
    try {
      const s = await this.storage.recover();
      if (this.disposed) return;
      this.runtime.restore(s);
      this.ready = true;
      this.dialog.querySelector<HTMLButtonElement>(
        "#inventory-recover",
      )!.hidden = true;
      this.message(
        "Previous checkpoint restored; damaged current retained in quarantine.",
      );
      this.render();
    } catch (e) {
      this.storage.lock();
      this.message(String(e));
    }
  }
  private async importFile(file: File) {
    try {
      if (file.size > 1048576) throw Error("Snapshot too large");
      const s = deserializeCharacter(await file.text(), this.nav);
      if (!this.ready)
        throw Error("Resolve existing stored data before import");
      this.runtime.restore(s);
      this.changed();
      this.message("Validated snapshot imported; saving checkpoint…");
    } catch (e) {
      this.message(`${String(e)}. Existing session retained.`);
    }
  }
  changed(): void {
    if (!this.ready || this.disposed) return;
    this.dirty = true;
    this.message("Unsaved changes · saving checkpoint…");
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      void this.flush();
    }, 250);
  }
  private async flush() {
    if (!this.dirty || this.saving || !this.ready || this.disposed) return;
    this.dirty = false;
    this.saving = true;
    this.message("Saving character checkpoint…");
    let saved = false;
    try {
      await this.storage.save(this.runtime.session());
      saved = true;
      this.message("Character checkpoint saved locally.");
    } catch (e) {
      this.dirty = true;
      this.message(
        `${String(e)}. Local items retained; export or retry Save now.`,
      );
    } finally {
      this.saving = false;
      if (saved && this.dirty) void this.flush();
    }
  }
  private message(text: string) {
    this.status = text;
    this.dialog.querySelector("#inventory-status")!.textContent = text;
  }
  toggle(): void {
    if (this.dialog.open) this.close();
    else {
      this.render();
      hub.clear();
      this.dialog.showModal();
      this.dialog.querySelector<HTMLButtonElement>("#inventory-close")!.focus();
      hub.blockGameplay = true;
    }
  }
  close(): void {
    if (!this.ready) return;
    hub.clear();
    hub.blockGameplay = false;
    this.skillPanel.cancelPending();
    this.dialog.close();
  }
  private perform(result: Parameters<InventoryRuntime["commit"]>[0]): string {
    if (!this.ready) return "Character storage is not ready.";
    if (result.ok) {
      this.held = null;
      this.socketHost = null;
      this.componentChoice = null;
    }
    const message = this.runtime.commit(result);
    this.message(message);
    if (!result.ok) this.render();
    return message;
  }
  private slotFor(item: GeneratedItem) {
    const slots = equipmentDefinition(item).slots;
    return slots.find((s) => !this.runtime.character.equipment[s]) ?? slots[0];
  }
  private equip() {
    const item =
      this.selected && ownedItem(this.runtime.character, this.selected);
    if (!item) return;
    const slot = this.slotFor(item);
    if (slot)
      this.perform(
        moveOwned(this.runtime.session(), item.id, { kind: "equipment", slot }),
      );
  }
  private choose(
    id: string | null,
    destination:
      | { kind: "grid"; x: number; y: number }
      | { kind: "equipment"; slot: EquipSlot },
  ) {
    this.socketHost = null;
    this.componentChoice = null;
    this.socketMessage();
    if (this.held)
      this.perform(moveOwned(this.runtime.session(), this.held, destination));
    else {
      if (id && this.selected === id) this.held = id;
      this.selected = id;
      this.render();
    }
  }
  render(): void {
    if (!this.dialog) return;
    this.characterPanel.render();
    this.skillPanel.render();
    if (this.held && !ownedItem(this.runtime.character, this.held))
      this.held = null;
    const c = this.runtime.character,
      gear = this.dialog.querySelector("#inventory-gear")!,
      grid = this.dialog.querySelector<HTMLElement>("#inventory-grid")!;
    const focus = (document.activeElement as HTMLElement | null)?.dataset.focus;
    this.dialog.querySelector(
      "section[aria-label=Backpack] h3 small",
    )!.textContent = `${c.grid.columns} × ${c.grid.rows} · fixed footprints`;
    gear.replaceChildren();
    grid.replaceChildren();
    grid.style.setProperty("--columns", String(c.grid.columns));
    for (const slot of EQUIP_SLOTS) {
      const item = c.equipment[slot],
        b = document.createElement("button");
      b.dataset.focus = `gear-${slot}`;
      b.dataset.slot = slot;
      b.className = "inventory-slot";
      b.textContent = slot;
      b.onclick = () =>
        this.choose(item?.id ?? null, { kind: "equipment", slot });
      if (item) this.decorate(b, item);
      gear.append(b);
    }
    for (let y = 0; y < c.grid.rows; y++)
      for (let x = 0; x < c.grid.columns; x++) {
        const entry = c.grid.items.find((e) => {
          const d = equipmentDefinition(e.item);
          return (
            x >= e.x && x < e.x + d.width && y >= e.y && y < e.y + d.height
          );
        });
        const b = document.createElement("button");
        b.className = "inventory-cell";
        b.dataset.x = String(x);
        b.dataset.y = String(y);
        b.dataset.focus = `cell-${x}-${y}`;
        b.style.gridColumn = String(x + 1);
        b.style.gridRow = String(y + 1);
        b.setAttribute(
          "aria-label",
          `Column ${x + 1}, row ${y + 1}${entry ? `: ${inspectItem(entry.item).name}` : ": empty"}`,
        );
        if (entry) {
          b.dataset.item = entry.item.id;
          b.style.setProperty("--quality", LOOT_COLORS[entry.item.quality]);
          b.dataset.selected = String(entry.item.id === this.selected);
        }
        b.onclick = () =>
          this.choose(entry?.item.id ?? null, { kind: "grid", x, y });
        grid.append(b);
      }
    for (const e of c.grid.items) {
      const d = equipmentDefinition(e.item),
        tile = document.createElement("div");
      tile.className = "inventory-item";
      tile.style.gridColumn = `${e.x + 1} / span ${d.width}`;
      tile.style.gridRow = `${e.y + 1} / span ${d.height}`;
      this.decorate(tile, e.item);
      grid.append(tile);
    }
    const item = this.selected ? ownedItem(c, this.selected) : undefined,
      info = item ? inspectItem(item) : null;
    this.dialog.querySelector("#inventory-name")!.textContent =
      info?.name ?? "No item selected";
    this.dialog.querySelector("#inventory-details")!.textContent = info
      ? `${info.quality.toUpperCase()} · item level ${info.level}\nRequires level ${info.requirement}\n${
          info.stats
            ? Object.entries(info.stats)
                .filter(([, v]) => v !== 0)
                .map(([k, v]) => `${k}: +${v}`)
                .join("\n")
            : "Unidentified — rolled attributes concealed."
        }`
      : "Select a grid item or equipment slot. Carrying is a selection only; invalid moves never remove an item.";
    (this.dialog.querySelector("#inventory-name") as HTMLElement).style.color =
      "";
    if (item) {
      const advanced = describeAdvancedItem(item, Object.values(c.equipment));
      if (advanced)
        this.dialog.querySelector("#inventory-details")!.textContent += `
${advanced}`;
      (
        this.dialog.querySelector("#inventory-name") as HTMLElement
      ).style.color = LOOT_COLORS[item.quality];
    }
    let comparison = "";
    if (item?.identified) {
      const slot = this.slotFor(item);
      const result =
        slot && equipItem(c, item.id, slot, this.runtime.requirements());
      comparison =
        result && result.ok
          ? `Compared in ${slot}\n` +
            Object.entries(compareEquipment(c, this.runtime.base, result.value))
              .map(([k, v]) => `${k}: ${v >= 0 ? "+" : ""}${v.toFixed(2)}`)
              .join("\n")
          : SOCKET_CONTENT.gems.some((g) => g.id === item.base) ||
              RUNE_CONTENT.components.some((r) => r.id === item.base)
            ? "Socket component · compare host effects above."
            : "Cannot equip: requirement or space restriction.";
      if (result?.ok) {
        const difference = compareItemModifiers(c, result.value);
        const lines = [
          ...difference.removed.map((s) => `Removed: ${s}`),
          ...difference.added.map((s) => `Added: ${s}`),
        ];
        if (lines.length)
          comparison += `
${lines.join("\n")}`;
      }
    }
    this.dialog.querySelector("#inventory-compare")!.textContent = comparison;
    const d = this.runtime.derived;
    this.dialog.querySelector("#inventory-stats")!.textContent =
      `Damage ${d.offense.damage} · Defense ${d.defense.defense}\nLife ${d.maxHp} · Mana ${d.maxMana}\nAttack speed +${d.attackSpeed} · ${d.weapon}`;
    this.dialog.querySelector("#inventory-held")!.textContent = this.held
      ? `Carrying selection: ${inspectItem(ownedItem(c, this.held)!).name}. Choose destination; cancel leaves items unchanged.`
      : "Select an item, then carry or equip. No rotation.";
    for (const id of [
      "inventory-take",
      "inventory-equip",
      "inventory-identify",
      "inventory-drop",
    ])
      this.dialog.querySelector<HTMLButtonElement>(`#${id}`)!.disabled =
        !this.ready ||
        !item ||
        (id === "inventory-identify" && !!item.identified) ||
        (id === "inventory-equip" && !this.slotFor(item));
    this.renderSockets();
    const advanced =
      this.loot.contentVersion >= 4 ||
      ownedItems(c).some((i) => i.contentVersion >= 4);
    for (const id of ["inventory-details", "inventory-compare"]) {
      const el = this.dialog.querySelector<HTMLElement>(`#${id}`)!;
      el.tabIndex = advanced ? 0 : -1;
      el.toggleAttribute("data-controller-read", advanced);
    }
    this.dialog.querySelector("#inventory-prompts")!.textContent =
      this.promptText();
    if (d.advanced) {
      this.dialog.querySelector("#inventory-stats")!.textContent += `
Cast speed ${d.castSpeed >= 0 ? "+" : ""}${d.castSpeed}% · Hit recovery ${d.recoveryBonus >= 0 ? "+" : ""}${d.recoveryBonus}%`;
      if (d.advanced.patterns.length)
        this.dialog.querySelector("#inventory-stats")!.textContent += `
Active patterns: ${d.advanced.patterns.map((p) => p.name).join(", ")}`;
    }
    if (d.advanced?.active.length)
      this.dialog.querySelector("#inventory-stats")!.textContent += `
Active set bonuses: ${d.advanced.active.map((s) => `${s.set} ${s.required}-piece`).join(", ")}`;
    this.message(this.status);
    if (focus)
      Array.from(this.dialog.querySelectorAll<HTMLElement>("[data-focus]"))
        .find((e) => e.dataset.focus === focus)
        ?.focus();
  }
  private promptText(): string {
    if (this.skillPanel.containsFocus()) {
      return hub.frame.device === "gamepad"
        ? `${actionPrompt("interact", hub.family, hub.settings.bindings)} choose / confirm · ${actionPrompt("cancel", hub.family, hub.settings.bindings)} cancel · D-pad / LS navigate · Learning costs 1 point`
        : "Enter / click: inspect or confirm · Tab: navigate · Escape: cancel · No respec";
    }
    if (this.characterPanel.containsFocus()) {
      if (hub.frame.device !== "gamepad")
        return "Enter / click: choose or allocate · Tab: navigate · Escape: back · Points cannot be refunded";
      const key = (action: "interact" | "primary" | "cancel" | "secondary") =>
        actionPrompt(action, hub.family, hub.settings.bindings);
      return `${key("interact")}: choose / allocate 1 · ${key("primary")}: confirm · ${key("secondary")}: read statistics · ${key("cancel")}: back · D-pad / LS: navigate`;
    }
    if (
      this.socketHost &&
      (document.activeElement as HTMLElement | null)?.hasAttribute(
        "data-controller-read",
      )
    )
      return `${actionPrompt("primary", hub.family, hub.settings.bindings)}: insert · D-pad ↑↓: read · ←: component · →: insert button · Cancel: back`;
    if (this.socketHost)
      return hub.frame.device === "gamepad"
        ? `${actionPrompt("primary", hub.family, hub.settings.bindings)}: insert chosen component · ${actionPrompt("secondary", hub.family, hub.settings.bindings)}: read preview · ${actionPrompt("cancel", hub.family, hub.settings.bindings)}: back · D-pad ←→: choose`
        : "Choose a bag component, then Insert explicitly · Escape: back without inserting";
    if (
      (document.activeElement as HTMLElement | null)?.hasAttribute(
        "data-controller-read",
      )
    )
      return "D-pad ↑↓: read · ←: inspect/grid · →: actions · Cancel: close";
    return hub.frame.device === "gamepad"
      ? `${actionPrompt("interact", hub.family, hub.settings.bindings)}: select/carry/place · ${actionPrompt("primary", hub.family, hub.settings.bindings)}: equip · ${actionPrompt("secondary", hub.family, hub.settings.bindings)}: read comparison · ${actionPrompt("cancel", hub.family, hub.settings.bindings)}: cancel · D-pad: navigate`
      : "Click / Enter: select · select again to carry · drag: move · V: inventory · Escape: cancel";
  }
  private openSockets(): void {
    const item = this.selected
      ? ownedItem(this.runtime.character, this.selected)
      : undefined;
    if (!this.ready || !item?.identified || !item.socketCapacity) return;
    this.socketMessage();
    this.held = null;
    this.cancelDrag();
    this.socketHost = item.id;
    this.componentChoice = null;
    this.render();
    const select = this.dialog.querySelector<HTMLSelectElement>(
      "#inventory-component",
    )!;
    select.focus();
    select.scrollIntoView({ block: "nearest" });
  }
  private closeSockets(): void {
    this.socketHost = null;
    this.componentChoice = null;
    this.dialog.querySelector<HTMLElement>(
      "#inventory-socket-controls",
    )!.hidden = true;
    this.dialog.querySelector<HTMLButtonElement>("#inventory-socket")!.focus();
  }
  private renderSockets(): void {
    const c = this.runtime.character,
      item = this.selected ? ownedItem(c, this.selected) : undefined;
    const socket =
        this.dialog.querySelector<HTMLButtonElement>("#inventory-socket")!,
      extract =
        this.dialog.querySelector<HTMLButtonElement>("#inventory-extract")!,
      panel = this.dialog.querySelector<HTMLElement>(
        "#inventory-socket-controls",
      )!;
    socket.hidden = !item?.identified || !item.socketCapacity;
    socket.disabled =
      !this.ready ||
      !item ||
      !item.socketCapacity ||
      (item.embedded?.length ?? 0) >= item.socketCapacity;
    extract.hidden = !item?.identified || !item.embedded?.length;
    extract.disabled = !this.ready || !item?.embedded?.length;
    if (!this.socketHost || item?.id !== this.socketHost) {
      this.socketHost = null;
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const components = c.grid.items
      .map((e) => e.item)
      .filter(
        (i) =>
          i.identified &&
          i.id !== item.id &&
          (SOCKET_CONTENT.gems.some((g) => g.id === i.base) ||
            RUNE_CONTENT.components.some((r) => r.id === i.base)),
      );
    const select = this.dialog.querySelector<HTMLSelectElement>(
        "#inventory-component",
      )!,
      key = components.map((i) => i.id).join(",");
    if (select.dataset.options !== key) {
      select.replaceChildren();
      for (const component of components)
        select.add(
          new Option(
            `${component.name} · requires ${component.requirement}`,
            component.id,
          ),
        );
      if (!components.length) select.add(new Option("No bag components", ""));
      select.dataset.options = key;
    }
    if (!components.some((i) => i.id === this.componentChoice))
      this.componentChoice = components[0]?.id ?? null;
    select.value = this.componentChoice ?? "";
    const candidate = this.componentChoice
      ? insertSocket(c, item.id, this.componentChoice)
      : null;
    const insert =
      this.dialog.querySelector<HTMLButtonElement>("#inventory-insert")!;
    insert.disabled = !this.ready || !candidate?.ok;
    insert.textContent = `Insert into socket ${(item.embedded?.length ?? 0) + 1}`;
    let text = candidate?.ok
      ? "After insertion:\n" +
        describeAdvancedItem(
          ownedItem(candidate.value, item.id)!,
          Object.values(candidate.value.equipment),
        )
      : candidate
        ? candidate.reason
        : "Collect a gem or sigil in the backpack first.";
    if (candidate?.ok) {
      const changes = Object.entries(
        compareEquipment(c, this.runtime.base, candidate.value),
      )
        .filter(([, v]) => Math.abs(v) > 1e-8)
        .map(([key, v]) => `${key}: ${v >= 0 ? "+" : ""}${v.toFixed(2)}`);
      if (changes.length) text += "\nDerived changes:\n" + changes.join("\n");
      const diff = compareItemModifiers(c, candidate.value);
      if (diff.added.length)
        text += "\nEquipped effects added:\n" + diff.added.join("\n");
    }
    this.dialog.querySelector("#inventory-socket-preview")!.textContent = text;
  }
  private socketMessage(text = ""): void {
    const el = this.dialog.querySelector<HTMLElement>(
      "#inventory-socket-message",
    )!;
    el.textContent = text;
    el.hidden = !text;
  }
  private insertComponent(): void {
    if (!this.socketHost || !this.componentChoice) return;
    const s = this.runtime.session(),
      result = insertSocket(s.character, this.socketHost, this.componentChoice);
    this.perform(
      result.ok
        ? { ok: true, value: { ...s, character: result.value } }
        : result,
    );
    this.socketMessage(result.ok ? "" : result.reason);
    if (result.ok)
      this.dialog
        .querySelector<HTMLButtonElement>("#inventory-cancel")!
        .focus();
  }
  private extractComponents(): void {
    if (!this.selected) return;
    const s = this.runtime.session(),
      result = extractSockets(s.character, this.selected);
    this.perform(
      result.ok
        ? { ok: true, value: { ...s, character: result.value } }
        : result,
    );
    this.socketMessage(result.ok ? "" : result.reason);
    if (result.ok)
      this.dialog
        .querySelector<HTMLButtonElement>("#inventory-cancel")!
        .focus();
  }
  private resetSelection = () => {
    this.skillPanel.cancelPending();
    this.cancelDrag();
    if (this.held) {
      this.held = null;
      this.render();
    }
  };
  private updatePrompts() {
    this.characterPanel.element.dataset.device = hub.frame.device;
    this.skillPanel.element.dataset.device = hub.frame.device;
    if (
      hub.frame.device === "gamepad" &&
      window.hollowbaneInput?.armed === false
    )
      this.skillPanel.cancelPending();
    if (this.dialog.open) this.skillPanel.render();
    if (this.dialog.open) this.characterPanel.render();
    const device = hub.frame.device;
    if (
      this.lastDevice &&
      this.lastDevice !== device &&
      (this.lastDevice === "gamepad" || device === "gamepad")
    )
      this.resetSelection();
    this.lastDevice = device;
    const text = this.promptText();
    const el = this.dialog.querySelector("#inventory-prompts")!;
    if (el.textContent !== text) el.textContent = text;
  }
  private mapToggle = (e: Event) => {
    e.preventDefault();
    this.toggle();
  };
  private controllerAction = (e: Event) => {
    const action = (e as CustomEvent<string>).detail;
    const focusId = (document.activeElement as HTMLElement | null)?.id;
    if (focusId === "character-stats" && action === "right") {
      this.skillPanel.element.querySelector<HTMLElement>("summary")!.focus();
      e.preventDefault();
      return;
    }
    if (
      focusId === "skill-tree-toggle" &&
      (action === "up" || action === "left")
    ) {
      this.characterPanel.element.open = true;
      this.characterPanel.element
        .querySelector<HTMLElement>("#character-stats")!
        .focus();
      e.preventDefault();
      return;
    }
    if (this.skillPanel.action(action) || this.characterPanel.action(action)) {
      e.preventDefault();
      return;
    }
    if (action === "cancel") {
      e.preventDefault();
      if (this.socketHost) this.closeSockets();
      else if (this.held) {
        this.held = null;
        this.render();
      } else this.close();
      return;
    }
    if (action === "primary") {
      e.preventDefault();
      if (this.socketHost) this.insertComponent();
      else this.equip();
      return;
    }
    if (action === "secondary") {
      e.preventDefault();
      const target = this.dialog.querySelector<HTMLElement>(
        this.socketHost ? "#inventory-socket-preview" : "#inventory-compare",
      )!;
      target.focus();
      target.scrollIntoView({ block: "nearest" });
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    if (!active || !["up", "down", "left", "right"].includes(action)) return;
    // Preserve the equipment route; down from Close reaches Character.
    if (active.id === "inventory-close" && action === "right") {
      this.dialog
        .querySelector<HTMLElement>('[data-focus="gear-main"]')
        ?.focus();
      e.preventDefault();
      return;
    }
    if (active.hasAttribute("data-controller-read")) {
      e.preventDefault();
      if (action === "up" || action === "down")
        this.dialog.scrollBy({
          top:
            (action === "down" ? 1 : -1) *
            Math.max(80, this.dialog.clientHeight * 0.4),
        });
      else {
        const selector =
          active.id === "inventory-recipe-text"
            ? action === "left"
              ? "#inventory-recipes-toggle"
              : "#inventory-save"
            : active.id === "inventory-socket-preview"
              ? action === "left"
                ? "#inventory-component"
                : this.dialog.querySelector<HTMLButtonElement>(
                      "#inventory-insert",
                    )!.disabled
                  ? "#inventory-socket-cancel"
                  : "#inventory-insert"
              : active.id === "inventory-compare"
                ? action === "left"
                  ? "#inventory-details"
                  : "#inventory-take"
                : action === "right"
                  ? "#inventory-compare"
                  : '[data-focus="cell-0-0"]';
        this.dialog.querySelector<HTMLElement>(selector)?.focus();
      }
      return;
    }
    if (active.dataset.x !== undefined) {
      const c = this.runtime.character.grid;
      const next = inventoryNeighbor(
        Number(active.dataset.x),
        Number(active.dataset.y),
        action as GridDirection,
        c.columns,
        c.rows,
      );
      const target = next
        ? this.dialog.querySelector<HTMLElement>(
            `[data-focus="cell-${next.x}-${next.y}"]`,
          )
        : this.dialog.querySelector<HTMLElement>(
            action === "left"
              ? '[data-focus="gear-main"]'
              : action === "up"
                ? "#inventory-close"
                : "#inventory-take",
          );
      target?.focus();
      e.preventDefault();
    } else if (active.dataset.slot && action === "right") {
      this.dialog
        .querySelector<HTMLElement>('[data-focus="cell-0-0"]')
        ?.focus();
      e.preventDefault();
    }
  };
  private destination(target: Element | null) {
    const el = target?.closest<HTMLElement>("button[data-x],button[data-slot]");
    if (!el || !this.dialog.contains(el)) return null;
    if (el.dataset.slot)
      return {
        element: el,
        destination: {
          kind: "equipment" as const,
          slot: el.dataset.slot as EquipSlot,
        },
      };
    return {
      element: el,
      destination: {
        kind: "grid" as const,
        x: Number(el.dataset.x) - (this.drag?.dx ?? 0),
        y: Number(el.dataset.y) - (this.drag?.dy ?? 0),
      },
    };
  }
  private pointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || !this.ready) return;
    // Complete device handoff before starting the new mouse gesture.
    if (this.lastDevice === "gamepad") this.resetSelection();
    this.lastDevice = "mouse";
    const el = (e.target as Element).closest<HTMLElement>("button[data-item]");
    const id = el?.dataset.item;
    if (!id) return;
    const source = this.runtime.character.grid.items.find(
      (v) => v.item.id === id,
    );
    this.drag = {
      id,
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      dx: source && el?.dataset.x ? Number(el.dataset.x) - source.x : 0,
      dy: source && el?.dataset.y ? Number(el.dataset.y) - source.y : 0,
      active: false,
    };
  };
  private pointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (
      !d ||
      e.pointerId !== d.pointer ||
      (!d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5)
    )
      return;
    e.preventDefault();
    if (!d.active) {
      d.active = true;
      this.dialog.setPointerCapture(e.pointerId);
      this.ghost = document.createElement("div");
      this.ghost.className = "inventory-drag-ghost";
      const item = ownedItem(this.runtime.character, d.id)!;
      this.decorate(this.ghost, item);
      this.dialog.append(this.ghost);
    }
    this.ghost!.style.left = `${e.clientX + 12}px`;
    this.ghost!.style.top = `${e.clientY + 12}px`;
    for (const el of Array.from(
      this.dialog.querySelectorAll<HTMLElement>("[data-placement]"),
    ))
      delete el.dataset.placement;
    const target = this.destination(
      document.elementFromPoint(e.clientX, e.clientY),
    );
    if (target)
      target.element.dataset.placement = moveOwned(
        this.runtime.session(),
        d.id,
        target.destination,
      ).ok
        ? "valid"
        : "invalid";
  };
  private pointerUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    if (d.active) {
      const target = this.destination(
        document.elementFromPoint(e.clientX, e.clientY),
      );
      this.suppressClick = true;
      if (target)
        this.perform(
          moveOwned(this.runtime.session(), d.id, target.destination),
        );
    }
    this.cancelDrag();
  };
  private cancelDrag = () => {
    if (this.drag && this.dialog.hasPointerCapture(this.drag.pointer))
      this.dialog.releasePointerCapture(this.drag.pointer);
    this.drag = null;
    this.ghost?.remove();
    this.ghost = null;
    for (const el of Array.from(
      this.dialog.querySelectorAll<HTMLElement>("[data-placement]"),
    ))
      delete el.dataset.placement;
  };
  private decorate(element: HTMLElement, item: GeneratedItem) {
    element.style.setProperty("--quality", LOOT_COLORS[item.quality]);
    element.dataset.item = item.id;
    element.title = [
      inspectItem(item).name,
      describeAdvancedItem(
        item,
        Object.values(this.runtime.character.equipment),
      ),
    ]
      .filter(Boolean)
      .join("\n");
    element.dataset.quality = item.quality;
    element.insertAdjacentHTML("beforeend", icon(item));
  }
  dispose(): void {
    this.disposed = true;
    window.clearTimeout(this.timer);
    window.clearInterval(this.promptTimer);
    window.removeEventListener("hollowbane-input-reset", this.resetSelection);
    this.storage.close();
    this.runtime.listeners.delete(this.listen);
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("hollowbane-inventory-toggle", this.mapToggle);
    window.removeEventListener("blur", this.cancelDrag);
    this.cancelDrag();
    this.dialog.remove();
    this.root.querySelector("#inventory-open")?.remove();
  }
}
