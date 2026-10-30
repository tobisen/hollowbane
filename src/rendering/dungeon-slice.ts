import Phaser from "phaser";
import {
  dungeonSliceMap,
  SLICE_ROOMS,
  SLICE_START,
} from "../simulation/dungeon-slice";
import {
  createWalker,
  moveTick,
  movementFrame,
  retarget,
  stopWalker,
} from "../simulation/locomotion";
import { areaNavigation, fromGround, onGround } from "../world/navigation";
import type { Point } from "../world/isometric";
import { appearanceHash } from "../world/environment-view";
import { controllerInput } from "./controller-input";
import "./dungeon-slice.css";

declare global {
  interface Window {
    hollowbaneSlice?: {
      position: Point;
      tick: number;
      room: string;
      camera: Point;
      moving: boolean;
    };
  }
}

/** Original coarse vector environment; no sampled environment textures or animated overlays. */
export function startDungeonSlice(): Phaser.Game {
  const root = document.querySelector("main")!;
  root.className = "dungeon-slice";
  root.innerHTML = `<div id="world" tabindex="0" role="application" aria-label="Dungeon direction slice"></div><div class="slice-caption"><p>HOLLOWBANE · ENVIRONMENT STUDY</p><h1 id="slice-room">Gate of Ash</h1><p>Four chambers · loop · side chapel</p></div><div class="slice-controls"><span>WASD / arrows / left stick · Click to walk · R to run</span><button id="slice-reset">Return to gate</button><a href="?world=1&amp;developer=1&amp;worldPeaceful=1&amp;worldArea=ancient-crypt">Previous crypt</a><a href="?">Menu</a></div>`;
  document.title = "Hollowbane · Dungeon direction study";
  const map = dungeonSliceMap(),
    nav = areaNavigation(map);
  class Slice extends Phaser.Scene {
    private walker = createWalker(SLICE_START);
    private actor!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Ellipse;
    private held = new Set<string>();
    private residual = 0;
    private room = "Gate of Ash";
    preload(): void {
      this.load.spritesheet(
        "slice-wanderer",
        import.meta.env.BASE_URL + "assets/wanderer.webp",
        { frameWidth: 128, frameHeight: 128 },
      );
    }
    create(): void {
      const ink = this.add.graphics().setDepth(-1000);
      const polygon = (points: Point[], color: number) =>
        ink.fillStyle(color).fillPoints(
          points.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
          true,
        );
      const diamond = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
        lift = 0,
      ) =>
        polygon(
          [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
          ].map((p) => {
            const s = onGround(p);
            return { x: s.x, y: s.y - lift };
          }),
          color,
        );
      const t = map.terrain;
      const ground = (x: number, y: number) =>
        x >= 0 &&
        y >= 0 &&
        x < t.width &&
        y < t.height &&
        t.cells[y * t.width + x] === "ground";
      // Continuous dark underlay closes joints; broad, low-contrast slabs have no bright outlines.
      for (let y = 0; y < t.height; y++)
        for (let x = 0; x < t.width; x++) {
          if (!ground(x, y)) continue;
          diamond(x, y, 1, 1, 0x292822);
          const h = appearanceHash(0, x, y);
          const shade = [0x302e28, 0x323027, 0x2d2c27, 0x353128][h % 4]!;
          // Broad chipped corners break the perfect repeated grid without fine texture noise.
          const inset = 0.018,
            chip = 0.06 + (h % 3) * 0.025;
          polygon(
            [
              { x: x + inset + chip, y: y + inset },
              { x: x + 1 - inset, y: y + inset },
              { x: x + 1 - inset, y: y + 1 - inset - chip },
              { x: x + 1 - inset - chip, y: y + 1 - inset },
              { x: x + inset, y: y + 1 - inset },
              { x: x + inset, y: y + inset + chip },
            ].map(onGround),
            shade,
          );
          if (h % 5 === 0) diamond(x + 0.16, y + 0.2, 0.5, 0.36, 0x2b2a24);
        }
      // Only exposed perimeter edges: rear walls are tall, near walls cut down for readability.
      for (let y = 0; y < t.height; y++)
        for (let x = 0; x < t.width; x++) {
          if (!ground(x, y)) continue;
          for (const [dx, dy] of [
            [0, -1],
            [-1, 0],
            [1, 0],
            [0, 1],
          ] as const) {
            if (ground(x + dx, y + dy)) continue;
            const rear = dx < 0 || dy < 0,
              height = rear ? 48 : 14;
            const a = onGround({
              x: x + (dx === 1 ? 1 : 0),
              y: y + (dy === 1 ? 1 : 0),
            });
            const b = onGround({
              x: x + (dx !== 0 ? (dx === 1 ? 1 : 0) : 1),
              y: y + (dy !== 0 ? (dy === 1 ? 1 : 0) : 1),
            });
            const wall = this.add
              .graphics()
              .setDepth(rear ? -900 : (a.y + b.y) / 2);
            wall.fillStyle(dx !== 0 ? 0x292820 : 0x363329).fillPoints(
              [
                a,
                b,
                { x: b.x, y: b.y - height },
                { x: a.x, y: a.y - height },
              ].map((p) => new Phaser.Math.Vector2(p.x, p.y)),
              true,
            );
            const offset = { x: (dx - dy) * 10, y: (dx + dy) * 5 };
            wall.fillStyle((x + y) % 3 === 0 ? 0x474235 : 0x403c31).fillPoints(
              [
                { x: a.x, y: a.y - height },
                { x: b.x, y: b.y - height },
                { x: b.x + offset.x, y: b.y - height + offset.y },
                { x: a.x + offset.x, y: a.y - height + offset.y },
              ].map((p) => new Phaser.Math.Vector2(p.x, p.y)),
              true,
            );
            if (rear && (x + y) % 2 === 0)
              wall
                .lineStyle(3, 0x23231e)
                .lineBetween(a.x, a.y - 3, a.x, a.y - height);
            if (rear) {
              // Two broad masonry courses, with staggered vertical joints.
              wall
                .lineStyle(3, 0x24241f)
                .lineBetween(a.x, a.y - 24, b.x, b.y - 24);
              if ((x + y) % 2 !== 0)
                wall.lineBetween(
                  (a.x + b.x) / 2,
                  (a.y + b.y) / 2 - 24,
                  (a.x + b.x) / 2,
                  (a.y + b.y) / 2 - height,
                );
            }
          }
        }
      for (const o of map.objects) {
        const p = onGround(o.position),
          r = o.radius;
        const prop = this.add.graphics().setDepth(p.y);
        const width = r * 128 * Math.SQRT2,
          depth = r * 64 * Math.SQRT2;
        prop
          .fillStyle(0x151510)
          .fillEllipse(p.x, p.y + 2, width + 12, depth + 8);
        if (o.appearance === "slice-stone-pier") {
          prop
            .fillStyle(0x38362c)
            .fillRect(p.x - width / 2, p.y - 90, width, 90);
          prop.fillStyle(0x454032).fillEllipse(p.x, p.y - 90, width, depth);
          prop.fillStyle(0x38362c).fillEllipse(p.x, p.y, width, depth);
          prop.fillStyle(0x494334).fillEllipse(p.x, p.y - 12, width + 8, depth);
        } else {
          const q = r / Math.SQRT2;
          const corners = [
            { x: o.position.x - q, y: o.position.y - q },
            { x: o.position.x + q, y: o.position.y - q },
            { x: o.position.x + q, y: o.position.y + q },
            { x: o.position.x - q, y: o.position.y + q },
          ].map(onGround);
          const face = (points: Point[], color: number) =>
            prop.fillStyle(color).fillPoints(
              points.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
              true,
            );
          for (const [a, b, color] of [
            [corners[1]!, corners[2]!, 0x36342a],
            [corners[2]!, corners[3]!, 0x464031],
          ] as const)
            face(
              [a, b, { x: b.x, y: b.y - 36 }, { x: a.x, y: a.y - 36 }],
              color,
            );
          face(
            corners.map((p) => ({ x: p.x, y: p.y - 36 })),
            0x5b503b,
          );
          prop
            .lineStyle(6, 0x3f392d)
            .lineBetween(
              corners[0]!.x,
              corners[0]!.y - 34,
              corners[2]!.x,
              corners[2]!.y - 34,
            );
        }
      }
      // Static amber pools; no pulsing alpha, fog or thin decorative particles.
      for (const position of [
        { x: 4, y: 4 },
        { x: 21, y: 4 },
        { x: 21, y: 21 },
        { x: 4, y: 23 },
        { x: 14, y: 15 },
      ]) {
        const p = onGround(position);
        ink.fillStyle(0x9d7437, 0.1).fillEllipse(p.x, p.y, 240, 120);
        this.add.rectangle(p.x, p.y - 18, 10, 24, 0x78613b).setDepth(p.y);
        this.add.ellipse(p.x, p.y - 34, 12, 18, 0xc69a50).setDepth(p.y + 1);
      }
      this.shadow = this.add.ellipse(0, 0, 30, 12, 0x080807, 0.65);
      this.actor = this.add
        .sprite(0, 0, "slice-wanderer")
        .setOrigin(0.5, 112 / 128)
        .setScale(0.93);
      const field = document.querySelector<HTMLElement>("#world")!;
      const down = (e: KeyboardEvent) => {
        if (document.activeElement !== field) return;
        if (
          [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
          ].includes(e.code)
        ) {
          e.preventDefault();
          this.held.add(e.code);
        }
        if (e.code === "KeyR" && !e.repeat)
          this.walker.gait = this.walker.gait === "run" ? "walk" : "run";
      };
      const up = (e: KeyboardEvent) => this.held.delete(e.code);
      const clear = () => {
        this.held.clear();
        this.walker = stopWalker(this.walker);
        this.residual = 0;
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", clear);
      field.addEventListener("blur", clear);
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        field.focus();
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.walker = retarget(this.walker, nav, fromGround(p));
      });
      document.querySelector<HTMLButtonElement>("#slice-reset")!.onclick =
        () => {
          clear();
          this.walker = createWalker(SLICE_START);
          field.focus();
        };
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
        field.removeEventListener("blur", clear);
        delete window.hollowbaneSlice;
      });
      field.focus();
    }
    update(): void {
      const field = document.querySelector("#world");
      const focused = document.activeElement === field && !document.hidden;
      const has = (...keys: string[]) => keys.some((key) => this.held.has(key));
      const input = controllerInput.movement({
        x: Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft")),
        y: Number(has("KeyS", "ArrowDown")) - Number(has("KeyW", "ArrowUp")),
      });
      if (focused) {
        this.residual += Math.min(100, this.game.loop.rawDelta);
        while (this.residual >= 1000 / 120) {
          this.walker = moveTick(
            this.walker,
            nav,
            input.vector,
            undefined,
            input.scale,
          );
          this.residual -= 1000 / 60;
        }
      } else {
        this.walker = stopWalker(this.walker);
        this.residual = 0;
      }
      const p = onGround(this.walker.position);
      // One render pixel per CSS pixel, unit zoom, integer camera: no FIT resampling.
      this.cameras.main.centerOn(Math.round(p.x), Math.round(p.y));
      this.actor
        .setPosition(p.x, p.y)
        .setFrame(movementFrame(this.walker, false))
        .setDepth(p.y);
      this.shadow.setPosition(p.x, p.y + 2).setDepth(p.y - 1);
      const r = SLICE_ROOMS.find(
        (r) =>
          this.walker.position.x >= r.x &&
          this.walker.position.x < r.x + r.width &&
          this.walker.position.y >= r.y &&
          this.walker.position.y < r.y + r.height,
      );
      this.room = r?.name ?? "Processional passages";
      document.querySelector("#slice-room")!.textContent = this.room;
      window.hollowbaneSlice = {
        position: { ...this.walker.position },
        tick: this.walker.tick,
        room: this.room,
        camera: { x: Math.round(p.x), y: Math.round(p.y) },
        moving: this.walker.walking,
      };
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    width: innerWidth,
    height: innerHeight,
    backgroundColor: "#080807",
    scene: Slice,
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE },
    render: { antialias: true, antialiasGL: true, roundPixels: true },
  });
}
