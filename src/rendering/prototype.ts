import Phaser from "phaser";
import { createDiagnostics, instrumentDrawCalls } from "./diagnostics";
import { createAtmosphereTextures, addLanternGlow } from "./atmosphere";
import { clampZoom, followAlpha, minimumZoom } from "../world/camera";
import { footDepth, isOccluding } from "../world/depth";
import { canWalk, fromGround, onGround } from "../world/navigation";
import {
  createWalker,
  moveTick,
  retarget,
  type Walker,
} from "../simulation/locomotion";
import { CLOISTER_NAV, CLOISTER_PROPS, LANTERNS } from "../content/cloister";
import type { Point } from "../world/isometric";
import { renderSize, shouldBalanceDetail } from "../world/render-size";
export interface PrototypeState {
  x: number;
  y: number;
  direction: number;
  walking: boolean;
  frame: number;
  zoom: number;
  tick: number;
  routeLength: number;
  destination: Point | null;
  occluded: number;
  decorationPaused: boolean;
  inputFeedbackMs: number | null;
  inputSamples: number;
  renderWidth: number;
  renderHeight: number;
  balancedDetail: boolean;
  view: { x: number; y: number; width: number; height: number };
}
declare global {
  interface Window {
    hollowbanePrototype?: PrototypeState;
  }
}
export function startPrototype(): Phaser.Game {
  const root = document.querySelector("main")!;
  root.className = "prototype";
  root.innerHTML = `<div id="world" role="application" aria-label="The Veiled Cloister. Click to walk, WASD or arrow keys to move, scroll to zoom." tabindex="0"></div><div class="vignette" aria-hidden="true"></div><header class="world-header"><div class="world-brand"><span class="sigil" aria-hidden="true">H</span><div><span class="world-wordmark">HOLLOWBANE</span><span class="world-tagline">A WORLD BENEATH THE ASH</span></div></div><div class="chapter-mark"><span>CHAPTER ZERO</span><span>THE VEILED CLOISTER</span></div><a class="atelier-link" href="?gallery=1">Art atelier <span aria-hidden="true">↗</span></a></header><aside class="location-card"><span class="eyebrow">THE OLD SANCTUARY</span><h1>The Veiled Cloister</h1><p>Only the lanterns remember.</p><span class="location-rule"></span><span class="region-status">EXPLORATION PROTOTYPE · G1 REVIEW</span></aside><div class="world-controls"><button id="zoom-out" aria-label="Zoom out">−</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="world-motion" aria-pressed="false">Still the mist</button><button id="world-detail">Full detail</button><button id="reset-view">Return to gate</button></div><div class="travel-hint">CLICK TO WALK <span>·</span> WASD / ARROWS <span>·</span> SCROLL TO ZOOM</div><output id="world-metrics" aria-live="off">Entering the cloister…</output><div id="world-status" role="status" class="sr-only"></div>`;
  document.title = "Hollowbane · The Veiled Cloister";
  const query = new URLSearchParams(location.search);
  class Cloister extends Phaser.Scene {
    private walker: Walker = createWalker(fromGround({ x: 780, y: 500 }));
    private actor!: Phaser.GameObjects.Sprite;
    private shadow!: Phaser.GameObjects.Ellipse;
    private marker!: Phaser.GameObjects.Ellipse;
    private props: {
      image: Phaser.GameObjects.Image;
      config: (typeof CLOISTER_PROPS)[number];
    }[] = [];
    private fog: Phaser.GameObjects.Image[] = [];
    private glows: Phaser.GameObjects.Image[] = [];
    private diagnostics!: ReturnType<typeof createDiagnostics>;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private accumulator = 0;
    private clock = 0;
    private paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
    private desiredZoom = 1.12;
    private loaded = false;
    private inputAt: number | null = null;
    private lastInputMs: number | null = null;
    private inputSamples = 0;
    private resolutionRatio = 1;
    private balancedDetail = false;
    private manualDetail = query.get("quality") === "full";
    private presentationAt = 0;
    private presentationStart = 0;
    private presentationFrames: number[] = [];
    preload(): void {
      const base = import.meta.env.BASE_URL + "assets/";
      this.load.image("cloister", base + "cloister.webp");
      this.load.spritesheet("wanderer", base + "wanderer.webp", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("cloister-props", base + "props.webp", {
        frameWidth: 512,
        frameHeight: 512,
      });
    }
    private syncResolution = (): void => {
      const size = renderSize(
        { x: window.innerWidth, y: window.innerHeight },
        this.balancedDetail,
      );
      const previousRatio = this.resolutionRatio;
      this.resolutionRatio = size.ratio;
      this.scale.resize(size.x, size.y);
      if (this.cameras?.main)
        this.cameras.main.setZoom(
          (this.cameras.main.zoom * this.resolutionRatio) / previousRatio,
        );
    };
    create(): void {
      if (this.game.renderer.type === Phaser.WEBGL) {
        const gl = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer)
          .gl;
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        const name = debug
          ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
          : "";
        this.balancedDetail = /swiftshader|llvmpipe|software/i.test(name);
      } else this.balancedDetail = true;
      if (query.get("quality") === "full") this.balancedDetail = false;
      this.syncResolution();
      window.addEventListener("resize", this.syncResolution);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
        window.removeEventListener("resize", this.syncResolution),
      );
      this.add.image(0, 0, "cloister").setOrigin(0).setDepth(-1000);
      createAtmosphereTextures(this);
      for (const config of CLOISTER_PROPS) {
        this.add
          .ellipse(
            config.x,
            config.y + 2,
            config.width * 0.58,
            14,
            0x04080b,
            0.32,
          )
          .setDepth(footDepth(config.y - 1, config.id));
        const image = this.add
          .image(config.x, config.y, "cloister-props", config.frame)
          .setOrigin(0.5, 496 / 512)
          .setDisplaySize(config.width, config.height)
          .setDepth(footDepth(config.y, config.id));
        this.props.push({ image, config });
      }
      this.marker = this.add
        .ellipse(780, 500, 26, 13)
        .setStrokeStyle(1, 0xe2c98e, 0.7)
        .setDepth(-5)
        .setVisible(false);
      this.shadow = this.add
        .ellipse(780, 502, 29, 10, 0x030609, 0.5)
        .setDepth(499);
      this.actor = this.add
        .sprite(780, 500, "wanderer", 0)
        .setOrigin(0.5, 112 / 128)
        .setDepth(footDepth(500, 500))
        .setScale(0.93);
      if (this.game.renderer.type === Phaser.WEBGL) {
        this.lights.enable().setAmbientColor(0xc0ccd3);
        this.actor.setLighting(true);
        // Static props retain their painted light; only the moving actor needs dynamic shading.
        for (const l of LANTERNS)
          this.lights.addLight(l.x, l.y, l.radius, 0xffb267, 1.1);
        this.lights.addLight(780, 470, 110, 0x9ebed8, 0.3);
      }
      for (const light of LANTERNS)
        this.glows.push(addLanternGlow(this, light.x, light.y).setScale(1.2));
      for (let i = 0; i < 12; i++)
        this.fog.push(
          this.add
            .image(150 + i * 115, 700 + (i % 3) * 70, "mist")
            .setScale(2.7, 1.2)
            .setDepth(9000)
            .setAlpha(0.22),
        );
      this.cameras.main
        .setBounds(0, 0, 1536, 1024)
        .setZoom(this.desiredZoom * this.resolutionRatio)
        .centerOn(780, 500);
      this.keys = this.input.keyboard!.addKeys(
        "W,A,S,D,UP,DOWN,LEFT,RIGHT",
      ) as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
      const world = document.querySelector<HTMLElement>("#world")!;
      world.addEventListener("pointerdown", () => {
        this.inputAt = performance.now();
      });
      world.addEventListener("keydown", (event) => {
        if (
          !event.repeat &&
          [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
          ].includes(event.key.toLowerCase())
        )
          this.inputAt = performance.now();
      });
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.button !== 0) return;
        world.focus({ preventScroll: true });
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y),
          target = fromGround(p);
        if (canWalk(CLOISTER_NAV, target)) {
          const changed = retarget(this.walker, CLOISTER_NAV, target);
          if (changed.route.length) {
            this.walker = changed;
            this.marker.setPosition(p.x, p.y).setVisible(true);
            document.querySelector("#world-status")!.textContent =
              "Walking to selected position.";
          }
        } else
          document.querySelector("#world-status")!.textContent =
            "The ruins block that path.";
      });
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        world.style.cursor = canWalk(CLOISTER_NAV, fromGround(p))
          ? "crosshair"
          : "default";
      });
      this.input.on(
        "wheel",
        (_p: unknown, _o: unknown, _dx: number, dy: number) => {
          this.desiredZoom = clampZoom(this.desiredZoom - dy * 0.001, {
            x: this.scale.width,
            y: this.scale.height,
          });
        },
      );
      document.querySelector<HTMLButtonElement>("#zoom-in")!.onclick = () => {
        this.desiredZoom = clampZoom(this.desiredZoom + 0.12, {
          x: window.innerWidth,
          y: window.innerHeight,
        });
      };
      document.querySelector<HTMLButtonElement>("#zoom-out")!.onclick = () => {
        this.desiredZoom = clampZoom(this.desiredZoom - 0.12, {
          x: window.innerWidth,
          y: window.innerHeight,
        });
      };
      const motion =
        document.querySelector<HTMLButtonElement>("#world-motion")!;
      const syncMotion = () => {
        motion.setAttribute("aria-pressed", String(this.paused));
        motion.textContent = this.paused ? "Wake the mist" : "Still the mist";
      };
      syncMotion();
      motion.onclick = () => {
        this.paused = !this.paused;
        syncMotion();
      };
      const detail =
        document.querySelector<HTMLButtonElement>("#world-detail")!;
      const syncDetail = () => {
        detail.textContent = this.balancedDetail
          ? "Full detail"
          : "Balanced detail";
      };
      syncDetail();
      detail.onclick = () => {
        this.manualDetail = true;
        this.balancedDetail = !this.balancedDetail;
        this.syncResolution();
        syncDetail();
      };
      document.querySelector<HTMLButtonElement>("#reset-view")!.onclick =
        () => {
          this.walker = createWalker(fromGround({ x: 780, y: 500 }));
          this.desiredZoom = 1.12;
          this.marker.setVisible(false);
          this.cameras.main.centerOn(780, 500);
        };
      this.game.events.on(Phaser.Core.Events.BLUR, () => {
        this.input.keyboard!.resetKeys();
        this.walker = { ...this.walker, route: [] };
        this.accumulator = 0;
      });
      this.diagnostics = createDiagnostics(
        Phaser.VERSION,
        this.game.renderer.type === Phaser.WEBGL ? "WebGL" : "Canvas",
      );
      if (query.has("metrics") && this.game.renderer.type === Phaser.WEBGL) {
        const counter = instrumentDrawCalls(
          (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl,
        );
        this.game.events.on(Phaser.Core.Events.PRE_RENDER, counter.reset);
        this.game.events.on(Phaser.Core.Events.POST_RENDER, () => {
          this.diagnostics.state.drawCalls = counter.count();
        });
      }
      this.loaded = true;
      this.publishState(0);
      document.documentElement.dataset.prototypeReady = "true";
    }
    private keyboardVector(): Point {
      // UI focus never moves the actor; click the world to resume keyboard traversal.
      if (document.activeElement?.id !== "world") return { x: 0, y: 0 };
      const down = (name: string) => (this.keys[name]?.isDown ? 1 : 0);
      return {
        x: down("D") + down("RIGHT") - down("A") - down("LEFT"),
        y: down("S") + down("DOWN") - down("W") - down("UP"),
      };
    }
    private publishState(occluded: number): void {
      const p = onGround(this.walker.position);
      window.hollowbanePrototype = {
        x: p.x,
        y: p.y,
        direction: this.walker.direction,
        walking: this.walker.walking,
        frame: Number(this.actor.frame.name),
        zoom: this.cameras.main.zoom / this.resolutionRatio,
        tick: this.walker.tick,
        routeLength: this.walker.route.length,
        destination: this.walker.route.length
          ? onGround(this.walker.route[this.walker.route.length - 1]!)
          : null,
        occluded,
        decorationPaused: this.paused,
        inputFeedbackMs: this.lastInputMs,
        inputSamples: this.inputSamples,
        renderWidth: this.scale.width,
        renderHeight: this.scale.height,
        balancedDetail: this.balancedDetail,
        view: {
          x: this.cameras.main.worldView.x,
          y: this.cameras.main.worldView.y,
          width: this.cameras.main.worldView.width,
          height: this.cameras.main.worldView.height,
        },
      };
    }
    update(_time: number, delta: number): void {
      if (!this.loaded) return;
      const presented = performance.now();
      if (this.presentationAt) {
        this.presentationFrames.push(presented - this.presentationAt);
        if (this.presentationFrames.length > 180)
          this.presentationFrames.shift();
      } else this.presentationStart = presented;
      this.presentationAt = presented;
      if (
        !this.balancedDetail &&
        this.game.loop.frame % 60 === 0 &&
        shouldBalanceDetail(
          this.presentationFrames,
          presented - this.presentationStart,
          this.manualDetail,
        )
      ) {
        this.balancedDetail = true;
        this.syncResolution();
        document.querySelector<HTMLButtonElement>(
          "#world-detail",
        )!.textContent = "Full detail";
      }
      const dt = Math.min(delta, 100);
      this.accumulator += dt;
      while (this.accumulator >= 1000 / 60) {
        this.walker = moveTick(
          this.walker,
          CLOISTER_NAV,
          this.keyboardVector(),
        );
        this.accumulator -= 1000 / 60;
      }
      if (this.walker.walking && this.inputAt !== null) {
        this.lastInputMs = performance.now() - this.inputAt;
        this.inputSamples++;
        this.inputAt = null;
      }
      const p = onGround(this.walker.position);
      this.actor.setPosition(p.x, p.y).setDepth(footDepth(p.y, 500));
      const col = this.walker.walking
        ? 2 + (Math.floor(this.walker.tick / 7) % 6)
        : this.paused
          ? 0
          : Math.floor(this.walker.tick / 60) % 2;
      this.actor.setFrame(this.walker.direction * 8 + col);
      this.shadow.setPosition(p.x, p.y + 2).setDepth(p.y - 0.1);
      if (!this.walker.route.length) this.marker.setVisible(false);
      let occluded = 0;
      for (const { image, config } of this.props) {
        const behind = isOccluding(p, {
          x: config.x,
          y: config.y,
          width: config.occlusionWidth,
          height: config.height,
        });
        image.setAlpha(behind ? 0.55 : 1);
        if (behind) occluded++;
      }
      const camera = this.cameras.main,
        alpha = followAlpha(dt);
      const viewport = { x: window.innerWidth, y: window.innerHeight };
      this.desiredZoom = clampZoom(this.desiredZoom, viewport);
      if (camera.zoom < minimumZoom(viewport) * this.resolutionRatio)
        camera.setZoom(minimumZoom(viewport) * this.resolutionRatio);
      camera.setZoom(
        camera.zoom +
          (this.desiredZoom * this.resolutionRatio - camera.zoom) * alpha,
      );
      // Centered smoothing is clamped by Phaser's authored world bounds.
      const cx = camera.scrollX + camera.width / 2,
        cy = camera.scrollY + camera.height / 2;
      camera.centerOn(cx + (p.x - cx) * alpha, cy + (p.y - cy) * alpha);
      if (!this.paused) {
        this.clock += dt;
        for (const [i, fog] of this.fog.entries()) {
          fog.x = 150 + i * 115 + Math.sin(this.clock / 14000 + i) * 60;
          fog.y = 700 + (i % 3) * 70 + Math.sin(this.clock / 22000 + i) * 25;
        }
        for (const [i, glow] of this.glows.entries())
          glow.setAlpha(0.65 + Math.sin(this.clock / 650 + i) * 0.08);
      }
      this.diagnostics.sample(delta, this.game.loop.actualFps);
      this.publishState(occluded);
      if (this.game.loop.frame % 30 === 0) {
        const d = this.diagnostics.state;
        document.querySelector("#world-metrics")!.textContent =
          `PHASER ${Phaser.VERSION} · ${d.renderer.toUpperCase()} · ${d.fps.toFixed(0)} FPS · P95 ${d.p95FrameMs.toFixed(1)} MS`;
      }
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#0a1015",
    scene: Cloister,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    render: {
      antialias: true,
      antialiasGL: false,
      stencil: false,
      maxLights: 5,
      selfShadow: false,
      roundPixels: false,
    },
    input: { mouse: { preventDefaultWheel: true } },
  });
}
