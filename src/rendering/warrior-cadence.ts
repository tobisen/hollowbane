import Phaser from "phaser";
import metadata from "../../public/dev/warrior-movement/warrior.json";
import {
  createWalker,
  moveTick,
  MOVEMENT,
  movementFrame,
} from "../simulation/locomotion";
import { worldToScreen } from "../world/isometric";
import type { Navigation } from "../world/navigation";
import "./warrior-pilot.css";
import "./warrior-cadence.css";

type Clip = "idle" | "walk" | "run";
const clips: Clip[] = ["idle", "walk", "run"];
declare global {
  interface Window {
    hollowbaneWarriorCadence?: {
      clip: Clip;
      frame: number;
      phase: number;
      stageClip: Clip;
      stageFrame: number;
      distance: number;
      position: { x: number; y: number };
      direction: number;
      gait: "walk" | "run";
      speed: number;
      zoom: number;
      transition: number;
      playing: boolean;
      frames: Record<Clip, number>;
      source: string;
    };
  }
}

export async function startWarriorCadence(): Promise<void> {
  const root = document.querySelector("main")!;
  root.className = "warrior-pilot warrior-cadence";
  document.title = "Hollowbane · Warrior cadence and run";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / Q3-A / SOUTHEAST MOTION REVIEW</p><h1>Warrior · cadence & run</h1><p>Original rig, three authored clips. Live characters remain unchanged.</p><a href="?developer=1&warriorPilot=1&warriorRefined=1">Previous refined walk</a> · <a href="./">Return to Hollowbane</a></header>
  <section class="pilot-controls" aria-label="Animation controls">
  <label>Inspect <select id="cadence-clip"><option>idle</option><option>walk</option><option>run</option></select></label>
  <button id="cadence-play" aria-pressed="true">Pause</button><button id="cadence-back">Previous frame</button><button id="cadence-next">Next frame</button>
  <label>Playback <input id="cadence-rate" type="range" min="0.25" max="2" step="0.25" value="1"></label>
  <label><input id="cadence-guides" type="checkbox" checked> Root / feet</label>
  <label>Background <select id="cadence-background"><option>dark</option><option>light</option></select></label></section>
  <section class="pilot-comparison cadence-clips" aria-label="Gameplay-scale clips">${clips.map((c) => `<figure><canvas id="cadence-${c}" width="256" height="256" aria-label="${c} at gameplay scale"></canvas><figcaption>${c.toUpperCase()} · ${metadata.clips[c].count} frames · 1× game scale</figcaption></figure>`).join("")}
  <figure><canvas id="cadence-old" width="256" height="256" aria-label="Shipped movement comparison"></canvas><figcaption>SHIPPED · selected gait</figcaption></figure></section>
  <section class="cadence-inspection"><canvas id="cadence-inspector" width="256" height="256" aria-label="Enlarged selected animation"></canvas><output id="cadence-frame"></output></section>
  <section class="pilot-runtime"><h2>Displacement-synchronized preview · Phaser 4.2.1</h2>
  <p>Focus the stage. D or Space: southeast. WASD/arrows: input direction changes. R: walk/run. Release to idle. Standard virtual-controller axes also work. Artwork remains southeast throughout this pilot.</p>
  <div class="pilot-controls"><label>Gait <select id="cadence-gait"><option>walk</option><option>run</option></select></label><label>Camera <select id="cadence-zoom"><option>1</option><option>1.5</option><option>2</option></select></label><label>Sprite <select id="cadence-source"><option value="candidate">New movement</option><option value="shipped">Shipped baseline</option></select></label><button id="cadence-reset">Reset position</button></div>
  <div id="pilot-stage" tabindex="0" role="application" aria-label="Warrior cadence movement preview"></div>
  <p class="pilot-note">Walk ${MOVEMENT.walkSpeed} / run ${MOVEMENT.runSpeed} world/s; existing acceleration, deceleration, collision and 60Hz simulation. Gait phase follows actual displacement, including wall sliding. Gold: root; green: planted; purple: swing. A short visual crossfade bridges posture changes.</p></section>
  <p class="pilot-note">40 poses · fixed 256px cells / root 128,210 · ${metadata.bytes.toLocaleString()} bytes / 10MiB decoded. Run has its own flight, lean and arm poses. One direction only; quality approval pending.</p>`;
  const element = <T extends HTMLElement>(id: string): T =>
    document.getElementById(id) as T;
  const stage = element("pilot-stage");
  const image = new Image(),
    shipped = new Image();
  image.src = `${import.meta.env.BASE_URL}dev/warrior-movement/warrior.png`;
  shipped.src = `${import.meta.env.BASE_URL}assets/wanderer.webp`;
  await Promise.all([image.decode(), shipped.decode()]);
  const state = {
    clip: "idle" as Clip,
    playing: true,
    rate: 1,
    elapsed: 0,
    frames: { idle: 0, walk: 0, run: 0 },
    guides: true,
    light: false,
    gait: "walk" as "walk" | "run",
    zoom: 1,
    source: "candidate",
    reset: false,
  };
  const keys = new Set<string>();
  const setGait = (gait: "walk" | "run") => {
    state.gait = gait;
    element<HTMLSelectElement>("cadence-gait").value = gait;
  };
  const toggle = () => {
    state.playing = !state.playing;
    const b = element("cadence-play");
    b.textContent = state.playing ? "Pause" : "Play";
    b.setAttribute("aria-pressed", String(state.playing));
  };
  element<HTMLSelectElement>("cadence-clip").onchange = (e) => {
    state.clip = (e.target as HTMLSelectElement).value as Clip;
    state.frames[state.clip] = 0;
    if (!state.playing) state.elapsed = 0;
  };
  element("cadence-play").onclick = toggle;
  const step = (offset: number) => {
    if (state.playing) toggle();
    const c = state.clip;
    state.frames[c] =
      (state.frames[c] + offset + metadata.clips[c].count) %
      metadata.clips[c].count;
    state.elapsed = state.frames[c] / metadata.clips[c].fps;
  };
  element("cadence-next").onclick = () => step(1);
  element("cadence-back").onclick = () => step(-1);
  element<HTMLInputElement>("cadence-rate").oninput = (e) => {
    state.rate = Number((e.target as HTMLInputElement).value);
  };
  element<HTMLInputElement>("cadence-guides").onchange = (e) => {
    state.guides = (e.target as HTMLInputElement).checked;
  };
  element<HTMLSelectElement>("cadence-background").onchange = (e) => {
    state.light = (e.target as HTMLSelectElement).value === "light";
  };
  element<HTMLSelectElement>("cadence-gait").onchange = (e) =>
    setGait((e.target as HTMLSelectElement).value as "walk" | "run");
  element<HTMLSelectElement>("cadence-zoom").onchange = (e) => {
    state.zoom = Number((e.target as HTMLSelectElement).value);
  };
  element<HTMLSelectElement>("cadence-source").onchange = (e) => {
    state.source = (e.target as HTMLSelectElement).value;
  };
  element("cadence-reset").onclick = () => {
    state.reset = true;
  };
  stage.onkeydown = (e) => {
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
        "Space",
        "KeyR",
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys.add(e.code);
      if (e.code === "KeyR" && !e.repeat)
        setGait(state.gait === "walk" ? "run" : "walk");
    }
  };
  stage.onkeyup = (e) => {
    keys.delete(e.code);
  };
  stage.onblur = () => keys.clear();
  window.addEventListener("blur", () => keys.clear());
  const paint = (
    canvas: HTMLCanvasElement,
    action: Clip,
    index: number,
    old = false,
  ) => {
    const c = canvas.getContext("2d")!;
    c.fillStyle = state.light ? "#e4e0d8" : "#171c22";
    c.fillRect(0, 0, 256, 256);
    const frame = metadata.frames[metadata.clips[action].start + index]!;
    if (old) {
      const col = state.playing
        ? action === "idle"
          ? Math.floor(state.elapsed) % 2
          : 2 +
            (Math.floor(
              state.elapsed *
                (action === "run"
                  ? MOVEMENT.runSpeed / MOVEMENT.runStride
                  : MOVEMENT.walkSpeed / MOVEMENT.walkStride) *
                6,
            ) %
              6)
        : action === "idle"
          ? Math.floor(index / 4) % 2
          : 2 + Math.floor((index / 16) * 6);
      c.drawImage(shipped, col * 128, 7 * 128, 128, 128, 0, -14, 256, 256);
    } else c.drawImage(image, frame.x, frame.y, 256, 256, 0, 0, 256, 256);
    if (state.guides) {
      c.strokeStyle = "#e7bd69";
      c.beginPath();
      c.moveTo(118, 210);
      c.lineTo(138, 210);
      c.moveTo(128, 200);
      c.lineTo(128, 220);
      c.stroke();
      if (!old)
        for (const foot of frame.contacts) {
          c.strokeStyle = foot.planted ? "#7ee9c3" : "#d795ef";
          c.beginPath();
          c.arc(foot.pixel[0]!, foot.pixel[1]!, 4, 0, Math.PI * 2);
          c.stroke();
        }
    }
  };
  const nav: Navigation = {
    boundary: [
      { x: -4000, y: -4000 },
      { x: 8000, y: -4000 },
      { x: 8000, y: 8000 },
      { x: -4000, y: 8000 },
    ],
    obstacles: [{ x: 1043, y: 512, rx: 15, ry: 400 }],
    clearance: 12,
  };
  class Preview extends Phaser.Scene {
    private walker = createWalker({ x: 0, y: 0 });
    private sprite!: Phaser.GameObjects.Sprite;
    private previous!: Phaser.GameObjects.Sprite;
    private graphics!: Phaser.GameObjects.Graphics;
    private shadow!: Phaser.GameObjects.Ellipse;
    private paintSignature = "";
    private accumulator = 0;
    private phase = 0;
    private idleTime = 0;
    private action: Clip = "idle";
    private fade = 0;
    preload(): void {
      this.load.spritesheet("candidate", image.src, {
        frameWidth: 256,
        frameHeight: 256,
      });
      this.load.spritesheet("shipped", shipped.src, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
    create(): void {
      const grid = this.add.graphics().lineStyle(1, 0x424a4d, 0.65);
      for (let i = -40; i < 80; i++)
        for (const across of [true, false]) {
          const a = worldToScreen(across ? { x: i, y: -40 } : { x: -40, y: i }),
            b = worldToScreen(across ? { x: i, y: 80 } : { x: 80, y: i });
          grid.lineBetween(a.x, a.y, b.x, b.y);
        }
      this.add.rectangle(275, 0, 30, 800, 0x654e3c, 0.8);
      this.shadow = this.add.ellipse(0, 0, 28, 12, 0, 0.35);
      this.previous = this.add.sprite(0, 0, "candidate", 0).setVisible(false);
      this.sprite = this.add.sprite(0, 0, "candidate", 0);
      this.graphics = this.add.graphics();
      document.documentElement.dataset.warriorCadenceReady = "true";
    }
    update(_time: number, delta: number): void {
      const dt = Math.min(delta / 1000, 0.1);
      this.idleTime += dt;
      if (state.playing) {
        state.elapsed += dt * state.rate;
        for (const action of clips)
          state.frames[action] =
            Math.floor(state.elapsed * metadata.clips[action].fps) %
            metadata.clips[action].count;
      }
      if (state.reset) {
        this.walker = createWalker({ x: 0, y: 0 });
        this.phase = 0;
        state.reset = false;
      }
      let x =
        Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft"));
      let y =
        Number(keys.has("KeyS") || keys.has("ArrowDown")) -
        Number(keys.has("KeyW") || keys.has("ArrowUp"));
      if (keys.has("KeyD") || keys.has("Space")) {
        x = 1;
        if (!y) y = 0.5;
      }
      if (document.activeElement === stage) {
        const pad = Array.from(navigator.getGamepads?.() ?? []).find(
          (p) => p?.connected && p.mapping === "standard",
        );
        if (pad) {
          const ax = pad.axes[0] ?? 0,
            ay = pad.axes[1] ?? 0;
          if (Math.hypot(ax, ay) > 0.2) {
            x = ax;
            y = ay;
          }
        }
      }
      const before = this.walker.distance;
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        this.walker = moveTick({ ...this.walker, gait: state.gait }, nav, {
          x,
          y,
        });
        this.accumulator -= 1 / 60;
      }
      const moving = this.walker.walking,
        next: Clip = moving ? state.gait : "idle";
      if (moving)
        this.phase =
          (this.phase +
            (this.walker.distance - before) /
              metadata.clips[state.gait].worldStride) %
          1;
      if (next !== this.action) {
        this.previous
          .setTexture(this.sprite.texture.key, this.sprite.frame.name)
          .setVisible(true);
        this.fade = 0.12;
        this.action = next;
      }
      this.fade = Math.max(0, this.fade - dt);
      const frame =
        next === "idle"
          ? Math.floor(this.idleTime * metadata.clips.idle.fps) % 8
          : metadata.clips[next].start + Math.floor(this.phase * 16);
      const selectedFrame =
        state.source === "candidate"
          ? frame
          : movementFrame(this.walker, false);
      const p = worldToScreen(this.walker.position),
        candidate = state.source === "candidate";
      this.shadow.setPosition(p.x, p.y).setDepth(p.y - 1);
      for (const sprite of [this.sprite, this.previous])
        sprite
          .setPosition(p.x, p.y)
          .setDepth(p.y)
          .setOrigin(0.5, candidate ? 210 / 256 : 112 / 128)
          .setScale(candidate ? 0.5 : 0.93);
      this.sprite
        .setTexture(candidate ? "candidate" : "shipped", selectedFrame)
        .setAlpha(1 - this.fade / 0.12);
      this.previous.setAlpha(this.fade / 0.12).setVisible(this.fade > 0);
      this.cameras.main.setZoom(state.zoom).centerOn(p.x, p.y - 30);
      this.graphics.clear().setDepth(p.y + 1);
      if (state.guides)
        this.graphics
          .lineStyle(1, 0xe7bd69)
          .lineBetween(p.x - 8, p.y, p.x + 8, p.y)
          .lineBetween(p.x, p.y - 8, p.x, p.y + 8)
          .lineStyle(1, 0x65d5df)
          .strokeCircle(p.x, p.y, 12);
      const signature = `${state.frames.idle}/${state.frames.walk}/${state.frames.run}/${state.clip}/${state.rate}/${state.light}/${state.guides}`;
      if (signature !== this.paintSignature) {
        this.paintSignature = signature;
        for (const action of clips)
          paint(
            element<HTMLCanvasElement>(`cadence-${action}`),
            action,
            state.frames[action],
          );
        paint(
          element<HTMLCanvasElement>("cadence-inspector"),
          state.clip,
          state.frames[state.clip],
        );
        paint(
          element<HTMLCanvasElement>("cadence-old"),
          state.clip,
          state.frames[state.clip],
          true,
        );
        element("cadence-frame").textContent =
          `${state.clip.toUpperCase()} ${state.frames[state.clip] + 1}/${metadata.clips[state.clip].count} · ${metadata.clips[state.clip].fps.toFixed(2)}fps ×${state.rate} · walk ${metadata.clips.walk.worldStride.toFixed(3)} / run ${metadata.clips.run.worldStride.toFixed(3)} world/cycle`;
      }
      window.hollowbaneWarriorCadence = {
        clip: state.clip,
        frame: state.frames[state.clip],
        phase: this.phase,
        stageClip: next,
        stageFrame: frame,
        distance: this.walker.distance,
        position: { ...this.walker.position },
        direction: this.walker.direction,
        gait: state.gait,
        speed: this.walker.speed,
        zoom: state.zoom,
        transition: this.fade,
        playing: state.playing,
        frames: { ...state.frames },
        source: state.source,
      };
    }
  }
  new Phaser.Game({
    type: Phaser.WEBGL,
    parent: stage,
    width: 960,
    height: 320,
    backgroundColor: "#20262a",
    scene: Preview,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
    audio: { noAudio: true },
  });
}
