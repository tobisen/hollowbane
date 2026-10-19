import type { WorldSession } from "../simulation/world-session";
import { areaDefinition, type WorldPoint } from "../simulation/world";
import { discoveryCell } from "../simulation/world-discovery";
/** Small cached automap. Only the player marker moves between discovery revisions. */
export class WorldMinimap {
  private panel = document.createElement("section");
  private button = document.createElement("button");
  private body = document.createElement("div");
  private canvas = document.createElement("canvas");
  private marker = document.createElement("span");
  private label = document.createElement("output");
  private key = "";
  private lastCell = -1;
  private visible = true;
  private layout: WorldSession["travel"]["layout"] | undefined;
  private mapEvent = (event: Event) => {
    event.preventDefault();
    if (!document.querySelector("dialog[open]")) this.toggle();
  };
  private keyEvent = (event: KeyboardEvent) => {
    if (
      event.key !== "Tab" ||
      event.repeat ||
      document.querySelector("dialog[open]") ||
      !(event.target instanceof HTMLElement) ||
      !["combat-world", ""].includes(event.target.id) ||
      !["BODY", "DIV"].includes(event.target.tagName)
    )
      return;
    event.preventDefault();
    this.toggle();
  };
  constructor(private root: HTMLElement) {
    this.panel.className = "world-minimap";
    this.panel.setAttribute("aria-label", "Exploration map");
    this.panel.style.cssText =
      "position:absolute;right:18px;top:225px;width:260px;max-width:32vw;z-index:11;background:#101711e8;color:#d5c493;border:1px solid #685839;pointer-events:none;padding:6px";
    this.button.style.pointerEvents = "auto";
    this.button.onclick = () => {
      this.toggle();
      root.querySelector<HTMLElement>("#combat-world")!.focus();
    };
    this.canvas.width = 248;
    this.canvas.height = 164;
    this.canvas.style.cssText = "display:block;width:100%;height:auto";
    this.canvas.setAttribute("role", "img");
    this.body.style.position = "relative";
    this.marker.textContent = "◆";
    this.marker.style.cssText =
      "position:absolute;font-size:10px;color:#ffe3a1;transform:translate(-50%,-50%);line-height:1";
    this.label.style.cssText = "font-size:11px;display:block";
    const viewport = document.createElement("div");
    viewport.style.position = "relative";
    viewport.append(this.canvas, this.marker);
    this.body.append(viewport, this.label);
    this.panel.append(this.button, this.body);
    root.append(this.panel);
    window.addEventListener("hollowbane-map-toggle", this.mapEvent);
    window.addEventListener("keydown", this.keyEvent);
    this.syncVisibility();
  }
  destroy(): void {
    this.panel.remove();
    window.removeEventListener("hollowbane-map-toggle", this.mapEvent);
    window.removeEventListener("keydown", this.keyEvent);
  }
  private toggle(): void {
    this.visible = !this.visible;
    this.syncVisibility();
  }
  private syncVisibility(): void {
    this.body.hidden = !this.visible;
    this.button.textContent = `${this.visible ? "Hide" : "Show"} map · Tab / Map`;
    this.button.setAttribute("aria-expanded", String(this.visible));
  }
  update(world: WorldSession, player: WorldPoint): void {
    const layout = world.travel.layout,
      t = layout.map.terrain;
    const changed = this.layout !== layout;
    if (changed) {
      this.layout = layout;
      this.lastCell = -1;
    }
    const key = `${layout.map.area}:${world.discoveryRevision}:${world.containerState.opened.length}`;
    const scale = Math.min(
      232 / (t.width + t.height),
      288 / (t.width + t.height),
    );
    const project = (p: WorldPoint) => {
      const x = (p.x - t.origin.x) / t.cellSize,
        y = (p.y - t.origin.y) / t.cellSize;
      return {
        x: 8 + (x - y + t.height) * scale,
        y: 8 + ((x + y) * scale) / 2,
      };
    };
    if (changed || key !== this.key) {
      this.key = key;
      const ctx = this.canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 248, 164);
      const known = new Set(world.discovery.cells);
      for (const cell of known) {
        const x = cell % t.width,
          y = Math.floor(cell / t.width),
          p = project({
            x: t.origin.x + (x + 0.5) * t.cellSize,
            y: t.origin.y + (y + 0.5) * t.cellSize,
          });
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - scale / 2);
        ctx.lineTo(p.x + scale, p.y);
        ctx.lineTo(p.x, p.y + scale / 2);
        ctx.lineTo(p.x - scale, p.y);
        ctx.closePath();
        ctx.fillStyle = t.cells[cell] === "ground" ? "#776e50" : "#343f3b";
        ctx.fill();
        ctx.strokeStyle = "#141c17";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      const mark = (p: WorldPoint, text: string, color: string) => {
        if (!known.has(discoveryCell(t, p))) return;
        const q = project(p);
        ctx.fillStyle = color;
        ctx.font = "10px serif";
        ctx.textAlign = "center";
        ctx.fillText(text, q.x, q.y);
      };
      mark(layout.spawn, "⌂", "#b6ceb9");
      for (const e of layout.exits) mark(e.trigger, `◇ ${e.id}`, "#9ccfbd");
      for (const c of world.containers)
        mark(
          c.position,
          world.containerState.opened.includes(c.id) ? "·" : "□",
          c.rare ? "#ecd48c" : "#bdb294",
        );
      const name = areaDefinition(layout.map.area).name;
      this.label.textContent = `${name} · ${known.size}/${t.cells.length} explored · ◆ you · ◇ exit · □ treasure`;
      this.canvas.setAttribute("aria-label", this.label.textContent);
      this.canvas.dataset.explored = String(known.size);
      this.canvas.dataset.fingerprint = world.discovery.fingerprint;
    }
    const cell = discoveryCell(t, player);
    if (cell !== this.lastCell) {
      this.lastCell = cell;
      const p = project(player);
      this.marker.style.left = `${(p.x / 248) * 100}%`;
      this.marker.style.top = `${(p.y / 164) * 100}%`;
    }
  }
}
