import { registeredContentForTable } from "../simulation/item-registry";
import { ADVANCED_EXAMPLES } from "../simulation/advanced-item-examples";
import { ADVANCED_ITEMS } from "../simulation/advanced-item-content";
import { describeAdvancedItem } from "../simulation/item-description";
import { ITEM_CONTENT, type ItemContent } from "../simulation/item-content";
import { inspectDropTable } from "../simulation/loot-diagnostics";
import {
  consumeLootDeaths,
  createLootWorld,
  placeLoot,
  canInspectDrop,
  identifyWorldDrop,
  selectLoot,
  type LootWorld,
} from "../simulation/world-loot";
import { generateLoot } from "../simulation/loot";
import {
  inspectItem,
  serializeItems,
  deserializeItems,
} from "../simulation/item-save";
import { onGround, type Navigation } from "../world/navigation";
import type { CombatWorld } from "../simulation/combat";
import type { Point } from "../world/isometric";
import type { ItemQuality as Quality } from "../simulation/item-registry";
export const LOOT_COLORS: Record<Quality, string> = {
  normal: "#eee8d9",
  magic: "#97c7ff",
  rare: "#ffe080",
  unique: "#edb98a",
  set: "#91e3a4",
};
declare global {
  interface Window {
    hollowbaneLoot?: {
      seed: number;
      sequence: number;
      attempts: number;
      noDrop: number;
      blocked: number;
      selected: string | null;
      drops: {
        id: string;
        x: number;
        y: number;
        quality: Quality;
        name: string;
        identified: boolean;
        source: number;
      }[];
      simulationP95: number;
      viewP95: number;
    };
  }
}
export class LootView {
  world: LootWorld;
  selected: string | null = null;
  onPickup?: (id: string) => string;
  onChange?: () => void;
  private inspected = false;
  private labels = new Map<string, HTMLButtonElement>();
  private panel: HTMLElement;
  private layer: HTMLElement;
  private player: Point = { x: 0, y: 0 };
  private alive = true;
  private lastInfo = "";
  private tableKey = "";
  private costs: number[] = [];
  private viewCosts: number[] = [];
  constructor(
    private root: HTMLElement,
    private nav: Navigation,
    seed: number,
    private cue: (quality: Quality) => void,
    private content: ItemContent = ITEM_CONTENT,
  ) {
    this.world = createLootWorld(seed);
    if (content.version >= 3)
      this.world.table = content.version >= 4 ? "sanctum" : "reliquary";
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="loot-panel" aria-label="Loot inspection"><h2>World loot · L1</h2><p id="loot-help">D-pad ↑↓: select · Enter / Interact: inspect · F: inspect nearest. Items remain on the ground.</p><p id="loot-message" role="status">Defeat monsters to discover items.</p><output id="loot-info">No item selected.</output><button id="loot-identify" disabled>Identify selected</button><details><summary>Loot diagnostics & item archive</summary><label>Seed <input id="loot-seed" type="number" min="0" max="4294967295" value="${seed}"></label><label>Roll sequence <input id="loot-sequence" type="number" min="0" max="4294967295" value="0"></label><label>Example roll <select id="loot-example"><option value="">Custom seed / sequence</option><option value="3">Normal · 3</option><option value="30">Magic · 30</option><option value="47">Rare · 47</option><option value="5634">Unique · 5634</option></select></label><button id="loot-test">Replay test drop near player</button><button id="loot-save">Save item archive locally</button><button id="loot-load">Load item archive near player</button><output id="loot-diagnostics"></output><details><summary>Drop table at level 12</summary><pre id="loot-table"></pre></details></details></section><div class="loot-labels" aria-label="Ground item labels"></div>`,
    );
    this.panel = root.querySelector(".loot-panel")!;
    this.layer = root.querySelector(".loot-labels")!;
    if (content.version === 3)
      this.panel.querySelector<HTMLElement>(
        "#loot-example",
      )!.parentElement!.hidden = true;
    if (content.version >= 4) {
      const select =
        this.panel.querySelector<HTMLSelectElement>("#loot-example")!;
      select.replaceChildren(new Option("Custom seed / sequence", ""));
      for (const [id, sequence] of Object.entries(ADVANCED_EXAMPLES)) {
        const name =
          ADVANCED_ITEMS.uniques.find((u) => u.id === id)?.name ??
          ADVANCED_ITEMS.sets.flatMap((s) => s.pieces).find((p) => p.id === id)!
            .name;
        select.add(new Option(name, String(sequence)));
      }
    }
    this.panel.querySelector("#loot-table")!.textContent = JSON.stringify(
      inspectDropTable(12, this.world.table, this.content),
      null,
      2,
    );
    for (const id of ["loot-seed", "loot-sequence"])
      this.panel.querySelector<HTMLInputElement>(`#${id}`)!.oninput = () => {
        this.panel.querySelector<HTMLSelectElement>("#loot-example")!.value =
          "";
      };
    this.panel.querySelector<HTMLSelectElement>("#loot-example")!.onchange = (
      e,
    ) => {
      if (!(e.target as HTMLSelectElement).value) return;
      this.panel.querySelector<HTMLInputElement>("#loot-seed")!.value = "42";
      this.panel.querySelector<HTMLInputElement>("#loot-sequence")!.value = (
        e.target as HTMLSelectElement
      ).value;
    };
    this.panel.querySelector<HTMLButtonElement>("#loot-identify")!.onclick =
      () => {
        const d = this.world.drops.find((d) => d.item.id === this.selected);
        if (this.alive && d && identifyWorldDrop(d, this.player, nav)) {
          this.inspected = true;
          this.message("Identified. Attributes preserved.");
          this.onChange?.();
        } else this.message("Move closer on reachable ground.");
        this.focus();
      };
    this.panel.querySelector<HTMLButtonElement>("#loot-test")!.onclick = () => {
      try {
        const seed = Number(
            this.panel.querySelector<HTMLInputElement>("#loot-seed")!.value,
          ),
          sequence = Number(
            this.panel.querySelector<HTMLInputElement>("#loot-sequence")!.value,
          );
        const item = generateLoot(
          {
            seed,
            sequence,
            areaLevel: 12,
            monsterLevel: 12,
            table: this.world.table,
          },
          this.dropContent(),
        );
        if (!item) {
          this.message("This roll produces no item.");
          return;
        }
        const d = placeLoot(this.world, item, this.player, 0, -1, nav);
        if (d) {
          this.selected = d.item.id;
          this.inspected = true;
          this.cue(item.quality);
          this.onChange?.();
          this.message(
            "Explicit developer drop; natural death odds unchanged.",
          );
        } else this.message("Duplicate item or placement/capacity limit.");
      } catch {
        this.message("Invalid seed or sequence.");
      }
      this.focus();
    };
    if (content.version >= 3) {
      this.panel.querySelector("h2")!.textContent =
        content.version >= 4 ? "World loot · L3" : "World loot · L2";
      for (const id of ["loot-save", "loot-load"])
        this.panel.querySelector<HTMLButtonElement>(`#${id}`)!.hidden = true;
    }
    this.panel.querySelector<HTMLButtonElement>("#loot-save")!.onclick = () => {
      if (this.content.version >= 3) return;
      try {
        localStorage.setItem(
          "hollowbane.l1.items",
          serializeItems(this.world.drops.map((d) => d.item)),
        );
        this.message(
          "Versioned item archive saved. World/combat are not saved.",
        );
      } catch {
        this.message("Archive unavailable or full. Existing data retained.");
      }
    };
    this.panel.querySelector<HTMLButtonElement>("#loot-load")!.onclick = () => {
      if (this.content.version >= 3) return;
      try {
        const items = deserializeItems(
          localStorage.getItem("hollowbane.l1.items") ?? "",
        );
        const next: LootWorld = {
          ...this.world,
          drops: [],
          deaths: new Set(this.world.deaths),
        };
        next.sequence = Math.max(
          next.sequence,
          ...items
            .filter((i) => i.origin.seed === next.seed)
            .map((i) => i.origin.sequence + 1),
        );
        for (const item of items)
          if (!placeLoot(next, item, this.player, 0, -2, nav)) throw Error();
        this.world = next;
        this.selected = next.drops[0]?.item.id ?? null;
        this.inspected = false;
        this.message("Item archive loaded near player; combat is unchanged.");
      } catch {
        this.message(
          "Malformed, unsupported or unavailable archive; world retained.",
        );
      }
      this.focus();
    };
  }
  private focus() {
    this.root.querySelector<HTMLElement>("#combat-world")!.focus();
  }
  private message(text: string) {
    this.panel.querySelector("#loot-message")!.textContent = text;
  }
  private dropContent(): ItemContent {
    return registeredContentForTable(this.world.table, this.content.version);
  }
  get contentVersion(): number {
    return this.content.version;
  }
  setPlayer(position: Point, alive: boolean) {
    this.player = position;
    this.alive = alive;
  }
  reset() {
    this.world =
      this.content.version >= 3
        ? { ...this.world, deaths: new Set() }
        : createLootWorld(this.world.seed);
    this.selected = null;
    this.inspected = false;
  }
  advance(combat: CombatWorld) {
    const start = performance.now();
    const added = consumeLootDeaths(
      this.world,
      combat,
      this.nav,
      combat.events,
      this.dropContent(),
    );
    this.costs.push(performance.now() - start);
    if (this.costs.length > 300) this.costs.shift();
    if (added.length || combat.events.some((e) => e.kind === "death"))
      this.onChange?.();
    for (const d of added) this.cue(d.item.quality);
    if (!this.selected && added.length) this.selected = added[0]!.item.id;
  }
  cycle(delta: number) {
    this.selected = selectLoot(this.world, this.selected, delta);
    this.inspected = false;
  }
  interact(nearest = false): boolean {
    if (!this.alive) {
      this.message("Cannot inspect while dead.");
      return true;
    }
    if (nearest) {
      this.selected =
        [...this.world.drops].sort((a, b) => {
          const p = onGround(this.player),
            x = onGround(a.position),
            y = onGround(b.position);
          return (
            Math.hypot(x.x - p.x, x.y - p.y) -
              Math.hypot(y.x - p.x, y.y - p.y) ||
            a.item.id.localeCompare(b.item.id)
          );
        })[0]?.item.id ?? null;
    }
    const d = this.world.drops.find((d) => d.item.id === this.selected);
    if (!d) return false;
    if (!canInspectDrop(d, this.player, this.nav)) {
      this.inspected = false;
      this.message("Move closer on reachable ground to inspect.");
      return true;
    }
    if (this.onPickup) {
      this.message(this.onPickup(d.item.id));
      return true;
    }
    this.inspected = true;
    this.message(
      "Inspecting ground item. Identify reveals existing attributes.",
    );
    return true;
  }
  update(
    player: Point,
    view: { x: number; y: number; width: number; height: number },
    alive: boolean,
    prompt: string,
  ) {
    const start = performance.now();
    this.player = player;
    this.alive = alive;
    const rect = this.root.querySelector("canvas")!.getBoundingClientRect();
    const bottom = this.root
      .querySelector(".skill-bar")!
      .getBoundingClientRect().top;
    const panelTop =
      Math.ceil(
        this.root.querySelector(".polish-navigation")!.getBoundingClientRect()
          .bottom,
      ) + 16;
    const topStyle = `${panelTop}px`,
      heightStyle = `${Math.max(40, Math.min(innerHeight * 0.45, bottom - panelTop - 12))}px`;
    if (this.panel.style.top !== topStyle) this.panel.style.top = topStyle;
    if (this.panel.style.maxHeight !== heightStyle)
      this.panel.style.maxHeight = heightStyle;
    const visible = new Set<string>(),
      boxes: { x: number; y: number; w: number }[] = [];
    // Selected item has priority; at most 32 labels, all 128 selectable through D-pad.
    const drops = [...this.world.drops].sort(
      (a, b) =>
        Number(b.item.id === this.selected) -
        Number(a.item.id === this.selected),
    );
    for (const d of drops.slice(0, 32)) {
      const p = onGround(d.position);
      let x = rect.x + ((p.x - view.x) / view.width) * rect.width,
        y = rect.y + ((p.y - view.y) / view.height) * rect.height - 24;
      if (x < rect.left || x > rect.right || y < 80 || y > bottom) continue;
      const info = inspectItem(d.item),
        text = `${d.item.quality.toUpperCase()} · ${info.name}`,
        w = Math.min(240, 40 + text.length * 6);
      x = Math.max(w / 2 + 8, Math.min(innerWidth - w / 2 - 8, x));
      for (
        let i = 0;
        i < 32 &&
        boxes.some(
          (b) =>
            Math.abs(b.x - x) < (w + b.w) / 2 + 4 && Math.abs(b.y - y) < 25,
        );
        i++
      )
        y -= 26;
      if (y < 90) continue;
      boxes.push({ x, y, w });
      visible.add(d.item.id);
      let label = this.labels.get(d.item.id);
      if (!label) {
        label = document.createElement("button");
        label.className = "loot-label";
        label.dataset.item = d.item.id;
        label.onclick = () => {
          this.selected = d.item.id;
          this.interact();
          this.focus();
        };
        this.layer.append(label);
        this.labels.set(d.item.id, label);
      }
      if (label.textContent !== text) label.textContent = text;
      const layout = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w}px;color:${LOOT_COLORS[d.item.quality]}`;
      if (label.dataset.layout !== layout) {
        label.style.cssText = layout;
        label.dataset.layout = layout;
      }
      label.dataset.quality = d.item.quality;
      const selected = String(d.item.id === this.selected);
      if (label.getAttribute("aria-pressed") !== selected)
        label.setAttribute("aria-pressed", selected);
      label.hidden = false;
    }
    for (const [id, label] of this.labels)
      if (!visible.has(id)) {
        label.remove();
        this.labels.delete(id);
      }
    const d = this.world.drops.find((d) => d.item.id === this.selected),
      known = d ? inspectItem(d.item) : null,
      inRange = d && alive && canInspectDrop(d, player, this.nav);
    const text = known
      ? `${known.quality.toUpperCase()} · ${known.name}\nItem level ${known.level} · Requires level ${known.requirement}\n${
          this.inspected && inRange
            ? known.stats
              ? Object.entries(known.stats)
                  .filter(([, v]) => v !== 0)
                  .map(([k, v]) => `${k}: +${v}`)
                  .join(" · ")
              : "Unidentified — rolled attributes concealed."
            : "Select then interact nearby to inspect."
        }`
      : "No item selected.";
    const advanced =
      d && this.inspected && inRange ? describeAdvancedItem(d.item) : "";
    const detail = text + (advanced ? `\n${advanced}` : "");
    if (detail !== this.lastInfo) {
      this.panel.querySelector("#loot-info")!.textContent = detail;
      this.lastInfo = detail;
    }
    this.panel.querySelector<HTMLButtonElement>("#loot-identify")!.disabled = !(
      d &&
      this.inspected &&
      inRange &&
      !d.item.identified
    );
    const help =
      this.content.version >= 3
        ? `D-pad ↑↓: select · ${prompt}: pick up · F: nearest · V / View: inventory.`
        : `D-pad ↑↓: select · ${prompt}: inspect · F: nearest. No inventory; items stay on ground.`;
    const h = this.panel.querySelector("#loot-help")!;
    if (h.textContent !== help) h.textContent = help;
    this.viewCosts.push(performance.now() - start);
    if (this.viewCosts.length > 300) this.viewCosts.shift();
    const p95 = (v: number[]) =>
      [...v].sort((a, b) => a - b)[Math.floor(v.length * 0.95)] ?? 0;
    const content = this.dropContent(),
      table = content.tables.find((t) => t.id === this.world.table)!;
    const level = Math.max(
      1,
      Math.min(
        99,
        Math.max(this.world.areaLevel, this.world.monsterLevel) +
          table.levelModifier,
      ),
    );
    const key = `${content.version}/${table.id}/${level}`;
    if (key !== this.tableKey) {
      this.panel.querySelector("#loot-table")!.textContent = JSON.stringify(
        inspectDropTable(level, table.id, content),
        null,
        2,
      );
      if (this.content.version >= 3)
        this.panel
          .querySelector("#loot-table")!
          .parentElement!.querySelector("summary")!.textContent =
          `Drop table at level ${level} · content ${content.version}`;
      this.tableKey = key;
    }
    this.panel.querySelector("#loot-diagnostics")!.textContent =
      `seed ${this.world.seed}, next ${this.world.sequence}; deaths ${this.world.attempts}, empty ${this.world.noDrop}, blocked ${this.world.blocked}; ${this.world.drops.length}/128 drops; table ${this.world.table}: ${table.chance / 100}% drop; quality weights ${Object.values(table.quality).join("/")}; loot CPU ${p95(this.costs).toFixed(3)}ms, view ${p95(this.viewCosts).toFixed(3)}ms p95`;
    window.hollowbaneLoot = {
      seed: this.world.seed,
      sequence: this.world.sequence,
      attempts: this.world.attempts,
      noDrop: this.world.noDrop,
      blocked: this.world.blocked,
      selected: this.selected,
      drops: this.world.drops.map((d) => ({
        ...onGround(d.position),
        id: d.item.id,
        quality: d.item.quality,
        name: inspectItem(d.item).name,
        identified: d.item.identified,
        source: d.source,
      })),
      simulationP95: p95(this.costs),
      viewP95: p95(this.viewCosts),
    };
  }
  dispose() {
    this.panel.remove();
    this.layer.remove();
    delete window.hollowbaneLoot;
  }
}
