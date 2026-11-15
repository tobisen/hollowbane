import Phaser from "phaser";
import approvedImage from "../../experiments/visual-foundation/review/actual-1280x800.png?url";
import movementAssets from "../../experiments/warrior-integration/manifest.json";
import { visualWarriorImages } from "./visual-warrior-assets";
import {
  visualMovement,
  visualSteering,
  VISUAL_TRANSITION_SECONDS,
  VISUAL_WALK_CYCLES,
  visualFacingIndex,
} from "../world/visual-warrior-motion";
import { WARRIOR_DIRECTIONS } from "./warrior-pose";
import {
  createWalker,
  moveTick,
  retarget,
  stopWalker,
} from "../simulation/locomotion";
import { followPosition } from "../world/camera";
import {
  VISUAL_SCALE,
  VISUAL_SIZE,
  VISUAL_SPAWN,
  visualNavigation,
  visualOccluders,
  visualReviewStops,
  visualCamera,
  visualActorFrame,
  visualFromGround,
  visualOnGround,
} from "../world/visual-foundation";
import "./visual-playable.css";

declare global {
  interface Window {
    hollowbaneVisualPlayable?: {
      tick: number;
      position: { x: number; y: number };
      root: { x: number; y: number };
      camera: { x: number; y: number };
      viewport: { x: number; y: number };
      walking: boolean;
      direction: string;
      frame: number;
      scale: number;
      depth: number;
      hidden: boolean;
      paused: boolean;
      layers: { id: string; depth: number }[];
      textures: number;
      pngBytes: number;
      decodedRgbaBytes: number;
      readyMs: number;
      frames: number[];
      renderer: string;
      movementSpeed: number;
      walkCycles: number;
      transition: number;
      actorAlpha: number;
      previousRoot: { x: number; y: number; depth: number } | null;
      shadow: { x: number; y: number; depth: number };
    };
  }
}

/** Memory-only visual review. No combat actor, world session or storage adapter. */
export function startVisualPlayable(): Phaser.Game {
  const root = document.querySelector("main")!;
  root.className = "visual-playable";
  root.innerHTML = `<header><span>HOLLOWBANE · VISUAL FOUNDATION · ISOLATED</span>
    <button id="visual-full" aria-pressed="false">Full composition</button>
    <button id="visual-hide" aria-pressed="false">Hide Warrior</button>
    <button id="visual-pause" aria-pressed="false">Pause</button>
    <button id="visual-reset">Reset</button>
    <a href="${import.meta.env.BASE_URL}experiments/warrior-integration/">Before / after</a>
    <a href="${approvedImage}" target="_blank" rel="noopener">Approved still</a><a href="./">Normal Hollowbane</a></header>
    <div class="visual-scroll"><div id="visual-stage" tabindex="0" role="application" aria-label="Playable woodland visual foundation"></div></div>
    <footer>WASD / arrows · Click ground to walk · Fixed artwork scale, bounded camera · No saves
    <div>${Object.keys(visualReviewStops)
      .map((id) => `<button data-visual-stop="${id}">Walk: ${id}</button>`)
      .join("")}</div>
    <output id="visual-status" aria-live="polite">Preparing approved artwork and Warrior…</output></footer>`;
  document.title = "Hollowbane · Playable visual foundation";
  const stage = root.querySelector<HTMLElement>("#visual-stage")!;
  const started = performance.now();
  let full = false,
    hidden = false,
    paused = false;
  const viewport = () =>
    full
      ? { ...VISUAL_SIZE }
      : {
          x: Math.min(960, Math.max(320, innerWidth - 24)),
          y: Math.min(600, Math.max(240, innerHeight - 150)),
        };
  const error = (message: string) => {
    delete window.hollowbaneVisualPlayable;
    document.documentElement.dataset.visualPlayable = "error";
    const status = root.querySelector("#visual-status")!;
    status.setAttribute("role", "alert");
    status.textContent = message;
  };
  class VisualScene extends Phaser.Scene {
    private walker = createWalker(visualFromGround(VISUAL_SPAWN));
    private actor!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Image;
    private previousActor!: Phaser.GameObjects.Sprite;
    private actorState = "idle-s";
    private facing = 0;
    private transition = 0;
    private held = new Set<string>();
    private residual = 0;
    private idleStart = 0;
    private center = { ...VISUAL_SPAWN };
    private samples: number[] = [];
    private readyMs = 0;
    private failed = false;
    preload(): void {
      this.load.on("loaderror", (file: { key: string }) => {
        this.failed = true;
        error(
          `Visual prototype unavailable: asset ${file.key}. No campaign was started.`,
        );
      });
      this.load.image("visual-approved", approvedImage);
      for (const direction of WARRIOR_DIRECTIONS)
        this.load.spritesheet(
          `visual-warrior-${direction}`,
          visualWarriorImages[direction],
          { frameWidth: 256, frameHeight: 264 },
        );
    }
    create(): void {
      if (this.failed) return;
      this.add.image(0, 0, "visual-approved").setOrigin(0).setDepth(-1000);
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = 1280;
      sourceCanvas.height = 800;
      const sourceContext = sourceCanvas.getContext("2d")!;
      sourceContext.drawImage(
        this.textures
          .get("visual-approved")
          .getSourceImage() as HTMLImageElement,
        0,
        0,
      );
      const sourcePixels = sourceContext.getImageData(0, 0, 1280, 800).data;
      for (const layer of visualOccluders) {
        const xs = layer.polygon.map((p) => p.x),
          ys = layer.polygon.map((p) => p.y);
        const x = Math.min(...xs),
          y = Math.min(...ys);
        const texture = this.textures.createCanvas(
          `visual-layer-${layer.id}`,
          Math.max(...xs) - x,
          Math.max(...ys) - y,
        )!;
        const context = texture.context;
        context.beginPath();
        layer.polygon.forEach((p, i) =>
          i
            ? context.lineTo(p.x - x, p.y - y)
            : context.moveTo(p.x - x, p.y - y),
        );
        context.closePath();
        context.fillStyle = "white";
        context.fill();
        // Binary conservative matte: retain the exact source RGB, avoiding
        // semi-transparent edge unpremultiplication/rounding against the plate.
        const pixels = context.getImageData(
          0,
          0,
          texture.width,
          texture.height,
        );
        for (let row = 0; row < texture.height; row++)
          for (let col = 0; col < texture.width; col++) {
            const local = (row * texture.width + col) * 4;
            const source = ((row + y) * 1280 + col + x) * 4;
            pixels.data[local] = sourcePixels[source]!;
            pixels.data[local + 1] = sourcePixels[source + 1]!;
            pixels.data[local + 2] = sourcePixels[source + 2]!;
            pixels.data[local + 3] = pixels.data[local + 3]! >= 128 ? 255 : 0;
          }
        context.putImageData(pixels, 0, 0);
        texture.refresh();
        this.add.image(x, y, texture.key).setOrigin(0).setDepth(layer.anchor.y);
      }
      const contact = this.textures.createCanvas("visual-contact", 64, 32)!;
      const c = contact.context;
      c.scale(1, 0.5);
      const gradient = c.createRadialGradient(32, 32, 0, 32, 32, 30);
      gradient.addColorStop(0, "rgba(18,23,13,0.32)");
      gradient.addColorStop(0.45, "rgba(18,23,13,0.18)");
      gradient.addColorStop(1, "rgba(18,23,13,0)");
      c.fillStyle = gradient;
      c.fillRect(0, 0, 64, 64);
      contact.refresh();
      this.shadow = this.add.image(0, 0, contact.key).setDisplaySize(34, 14);
      this.actor = this.add
        .sprite(0, 0, "visual-warrior-s", 0)
        .setOrigin(128 / 256, 210 / 264)
        .setScale(VISUAL_SCALE);
      this.previousActor = this.add
        .sprite(0, 0, "visual-warrior-s", 0)
        .setOrigin(128 / 256, 210 / 264)
        .setScale(VISUAL_SCALE)
        .setVisible(false);
      const clear = () => {
        this.held.clear();
        this.walker = stopWalker(this.walker);
        this.residual = 0;
      };
      const down = (e: KeyboardEvent) => {
        if (document.activeElement !== stage) return;
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
      };
      const up = (e: KeyboardEvent) => this.held.delete(e.code);
      stage.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      stage.addEventListener("blur", clear);
      window.addEventListener("blur", clear);
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (paused) return;
        stage.focus({ preventScroll: true });
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.walker = retarget(
          this.walker,
          visualNavigation,
          visualFromGround(p),
        );
      });
      const resize = () => {
        const size = viewport();
        stage.style.width = `${size.x}px`;
        stage.style.height = `${size.y}px`;
        this.scale.resize(size.x, size.y);
        this.draw(0);
      };
      window.addEventListener("resize", resize);
      root.querySelector<HTMLButtonElement>("#visual-full")!.onclick = (e) => {
        full = !full;
        (e.currentTarget as HTMLElement).setAttribute(
          "aria-pressed",
          String(full),
        );
        resize();
      };
      root.querySelector<HTMLButtonElement>("#visual-hide")!.onclick = (e) => {
        hidden = !hidden;
        (e.currentTarget as HTMLElement).setAttribute(
          "aria-pressed",
          String(hidden),
        );
        this.draw(0);
      };
      root.querySelector<HTMLButtonElement>("#visual-pause")!.onclick = (e) => {
        paused = !paused;
        clear();
        (e.currentTarget as HTMLElement).setAttribute(
          "aria-pressed",
          String(paused),
        );
      };
      root.querySelector<HTMLButtonElement>("#visual-reset")!.onclick = () => {
        clear();
        this.walker = createWalker(visualFromGround(VISUAL_SPAWN));
        this.center = { ...VISUAL_SPAWN };
        this.idleStart = 0;
        this.actorState = "idle-s";
        this.facing = 0;
        this.transition = 0;
        this.draw(0);
      };
      root
        .querySelectorAll<HTMLButtonElement>("[data-visual-stop]")
        .forEach((button) => {
          button.onclick = () => {
            const p =
              visualReviewStops[
                button.dataset.visualStop as keyof typeof visualReviewStops
              ];
            this.walker = retarget(
              this.walker,
              visualNavigation,
              visualFromGround(p),
            );
            stage.focus({ preventScroll: true });
          };
        });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        stage.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        stage.removeEventListener("blur", clear);
        window.removeEventListener("blur", clear);
        window.removeEventListener("resize", resize);
        delete window.hollowbaneVisualPlayable;
        delete document.documentElement.dataset.visualPlayable;
      });
      this.readyMs = performance.now() - started;
      document.documentElement.dataset.visualPlayable = "ready";
      root.querySelector("#visual-status")!.textContent =
        "Approved plate preserved · Conservative occlusion slices · Movement-only Warrior";
      resize();
      stage.focus({ preventScroll: true });
    }
    update(_time: number, delta: number): void {
      if (!this.actor) return;
      if (!paused && document.visibilityState === "visible") {
        this.residual += Math.min(100, delta);
        while (this.residual >= 1000 / 60) {
          const wasWalking = this.walker.walking;
          this.walker = moveTick(
            this.walker,
            visualNavigation,
            visualSteering({
              x:
                Number(this.held.has("KeyD") || this.held.has("ArrowRight")) -
                Number(this.held.has("KeyA") || this.held.has("ArrowLeft")),
              y:
                Number(this.held.has("KeyS") || this.held.has("ArrowDown")) -
                Number(this.held.has("KeyW") || this.held.has("ArrowUp")),
            }),
            visualMovement,
          );
          if (wasWalking && !this.walker.walking)
            this.idleStart = this.walker.tick;
          this.residual -= 1000 / 60;
        }
      }
      if (this.samples.length < 3000) this.samples.push(delta);
      this.draw(paused ? 0 : delta);
    }
    private draw(delta: number): void {
      if (!this.actor) return;
      const p = visualOnGround(this.walker.position);
      const frame = visualActorFrame(this.walker, this.idleStart);
      this.facing = visualFacingIndex(this.walker.velocity, this.facing);
      const direction = WARRIOR_DIRECTIONS[this.facing]!;
      const state = `${this.walker.walking ? "walk" : "idle"}-${direction}`;
      if (state !== this.actorState) {
        this.previousActor.setTexture(
          this.actor.texture.key,
          this.actor.frame.name,
        );
        this.transition = VISUAL_TRANSITION_SECONDS;
        this.actorState = state;
      }
      this.transition = Math.max(0, this.transition - delta / 1000);
      // Opaque current body remains underneath the fading previous pose; the
      // actor does not fade through the terrain during a start/stop/turn.
      this.previousActor
        .setPosition(p.x, p.y)
        .setDepth(p.y + 0.002)
        .setAlpha(this.transition / VISUAL_TRANSITION_SECONDS)
        .setVisible(!hidden && this.transition > 0);
      this.actor
        .setPosition(p.x, p.y)
        .setTexture(`visual-warrior-${direction}`, frame)
        .setDepth(p.y + 0.001)
        .setVisible(!hidden);
      this.shadow
        .setPosition(p.x + 4, p.y + 2)
        .setDepth(p.y - 0.001)
        .setVisible(!hidden);
      this.center = followPosition(this.center, p, delta);
      const size = viewport(),
        camera = visualCamera(this.center, size);
      this.cameras.main.setScroll(camera.x, camera.y);
      window.hollowbaneVisualPlayable = {
        tick: this.walker.tick,
        position: { ...this.walker.position },
        root: p,
        camera,
        viewport: size,
        walking: this.walker.walking,
        direction,
        frame,
        scale: VISUAL_SCALE,
        depth: this.actor.depth,
        hidden,
        paused,
        layers: visualOccluders.map((l) => ({ id: l.id, depth: l.anchor.y })),
        textures: this.textures.getTextureKeys().length,
        pngBytes:
          1888475 + movementAssets.records.reduce((n, a) => n + a.bytes, 0),
        decodedRgbaBytes:
          visualOccluders.reduce(
            (n, layer) => {
              const xs = layer.polygon.map((p) => p.x),
                ys = layer.polygon.map((p) => p.y);
              return (
                n +
                (Math.max(...xs) - Math.min(...xs)) *
                  (Math.max(...ys) - Math.min(...ys)) *
                  4
              );
            },
            1280 * 800 * 4 + 64 * 32 * 4,
          ) +
          movementAssets.records.reduce((n, a) => n + a.decodedRgbaBytes, 0),
        readyMs: this.readyMs,
        frames: this.samples,
        movementSpeed: visualMovement.walkSpeed,
        walkCycles: VISUAL_WALK_CYCLES,
        transition: this.transition,
        actorAlpha: this.actor.alpha,
        previousRoot: this.previousActor.visible
          ? {
              x: this.previousActor.x,
              y: this.previousActor.y,
              depth: this.previousActor.depth,
            }
          : null,
        shadow: {
          x: this.shadow.x,
          y: this.shadow.y,
          depth: this.shadow.depth,
        },
        renderer: this.game.renderer.type === Phaser.WEBGL ? "WebGL" : "Canvas",
      };
    }
  }
  const size = viewport();
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent: stage,
    width: size.x,
    height: size.y,
    antialias: true,
    roundPixels: true,
    backgroundColor: "#101310",
    scene: VisualScene,
    audio: { noAudio: true },
    banner: false,
  });
}
