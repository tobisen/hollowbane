import Phaser from "phaser";
import approvedMetadata from "../../public/dev/warrior-pilot/warrior.json";
import refinedMetadata from "../../public/dev/warrior-refined/warrior.json";
import { createWalker, moveTick, MOVEMENT } from "../simulation/locomotion";
import { worldToScreen } from "../world/isometric";
import type { Navigation } from "../world/navigation";
import "./warrior-pilot.css";

type Clip = "idle" | "walk";
interface PilotObservation {
  clip: Clip;
  frame: number;
  playing: boolean;
  speed: number;
  zoom: number;
  distance: number;
  position: { x: number; y: number };
  moving: boolean;
  source: string;
  root: number[];
  renderFrames: number;
  stageFrame: number;
}
declare global {
  interface Window {
    hollowbaneWarriorPilot?: PilotObservation;
  }
}

export async function startWarriorPilot(): Promise<void> {
  const refined =
    new URLSearchParams(location.search).get("warriorRefined") === "1";
  const metadata = refined ? refinedMetadata : approvedMetadata;
  const directory = refined ? "warrior-refined" : "warrior-pilot";
  const root = document.querySelector("main")!;
  root.className = "warrior-pilot";
  document.title = "Hollowbane · Warrior animation pilot";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / Q3-A / DEVELOPER REVIEW</p><h1>Warrior · ${refined ? "art refinement" : "approved motion study"}</h1><p>One direction. One model. Idle and walk. Live characters remain unchanged.</p><a href="?developer=1&warriorPilot=1${refined ? "" : "&warriorRefined=1"}">${refined ? "Compare approved pilot" : "Review refined candidate"}</a> · <a href="./">Return to Hollowbane</a></header>
  <section class="pilot-controls" aria-label="Animation controls">
    <label>Clip <select id="pilot-clip"><option value="idle">Idle</option><option value="walk">Walk</option></select></label>
    <button id="pilot-play" aria-pressed="true">Pause</button><button id="pilot-back">Previous frame</button><button id="pilot-next">Next frame</button>
    <label>Playback <input id="pilot-speed" type="range" min="0.25" max="2" step="0.25" value="1"><output id="pilot-speed-label">1×</output></label>
    <label><input id="pilot-overlays" type="checkbox" checked> Root / contact / collision guides</label>
    <label>Background <select id="pilot-background"><option value="checker">Checker</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
  </section>
  <section class="pilot-comparison" aria-label="Sprite comparison">
    <figure><canvas id="pilot-candidate" width="256" height="256" aria-label="Rigged Warrior animation"></canvas><figcaption>${refined ? "Refined candidate" : "Approved pilot"} · 2× gameplay display scale</figcaption></figure>
    <figure><canvas id="pilot-shipped" width="256" height="256" aria-label="Shipped southeast sprite animation"></canvas><figcaption>Shipped wanderer · same ground root</figcaption></figure>
    <figure class="pilot-reference"><img src="${import.meta.env.BASE_URL}assets/menu-warrior-thumb-v1.webp" alt="Original Warrior costume reference"><figcaption>Original identity reference</figcaption></figure>
  </section><output id="pilot-frame" aria-live="off"></output>
  <section class="pilot-runtime"><h2>Isometric placement · Phaser 4.2.1</h2>
    <p>Focus the stage and hold D or Space to travel southeast. Frames follow distance traveled. Release to idle.</p>
    <div class="pilot-controls"><label>Camera <select id="pilot-zoom"><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
    <label>Travel speed <input id="pilot-travel-speed" type="range" min="0.32" max="3" step="0.01" value="0.64"><output id="pilot-travel-label">0.64 world/s</output></label>
    <label>Stage sprite <select id="pilot-source"><option value="pilot">Pilot</option><option value="shipped">Shipped baseline</option></select></label><button id="pilot-reset">Reset position</button></div>
    <div id="pilot-stage" tabindex="0" role="application" aria-label="Warrior movement preview"></div>
    <p class="pilot-note">Travel speed is a preview control. 0.64 world/s matches the authored walking cadence; 3 world/s exposes the existing gameplay speed. No gameplay settings or saves are written. Cyan circle: 12 ground-pixel collision clearance. Gold cross: world root.</p>
  </section><p class="pilot-note">24 poses · transparent 256px cells · locked root 128,210 · source rig and export recipe retained. Art refinement and live-speed cadence require review before adoption.</p>`;
  const element = <T extends HTMLElement>(id: string): T =>
    document.getElementById(id) as T;
  const state = {
    clip: "idle" as Clip,
    playing: true,
    speed: 1,
    frame: 0,
    elapsed: 0,
    overlays: true,
    background: "checker",
    zoom: 1,
    held: false,
    travelSpeed: 0.64,
    source: "pilot",
    reset: false,
  };
  const pilotImage = new Image(),
    shippedImage = new Image();
  pilotImage.src = `${import.meta.env.BASE_URL}dev/${directory}/warrior.png`;
  shippedImage.src = `${import.meta.env.BASE_URL}assets/wanderer.webp`;
  await Promise.all([pilotImage.decode(), shippedImage.decode()]);
  const canvases = [
    element<HTMLCanvasElement>("pilot-candidate"),
    element<HTMLCanvasElement>("pilot-shipped"),
  ];
  const togglePlay = (play: boolean) => {
    state.playing = play;
    const button = element<HTMLButtonElement>("pilot-play");
    button.textContent = play ? "Pause" : "Play";
    button.setAttribute("aria-pressed", String(play));
  };
  element<HTMLSelectElement>("pilot-clip").onchange = (event) => {
    state.clip =
      (event.target as HTMLSelectElement).value === "walk" ? "walk" : "idle";
    state.frame = 0;
    state.elapsed = 0;
  };
  element("pilot-play").onclick = () => togglePlay(!state.playing);
  const step = (direction: number) => {
    togglePlay(false);
    const clip = metadata.clips[state.clip];
    state.frame = (state.frame + direction + clip.count) % clip.count;
    state.elapsed = state.frame / clip.fps;
  };
  element("pilot-back").onclick = () => step(-1);
  element("pilot-next").onclick = () => step(1);
  element<HTMLInputElement>("pilot-speed").oninput = (event) => {
    state.speed = Number((event.target as HTMLInputElement).value);
    element("pilot-speed-label").textContent = `${state.speed}×`;
  };
  element<HTMLInputElement>("pilot-overlays").onchange = (event) => {
    state.overlays = (event.target as HTMLInputElement).checked;
  };
  element<HTMLSelectElement>("pilot-background").onchange = (event) => {
    state.background = (event.target as HTMLSelectElement).value;
  };
  element<HTMLSelectElement>("pilot-zoom").onchange = (event) => {
    state.zoom = Number((event.target as HTMLSelectElement).value);
  };
  element<HTMLInputElement>("pilot-travel-speed").oninput = (event) => {
    state.travelSpeed = Number((event.target as HTMLInputElement).value);
    element("pilot-travel-label").textContent =
      `${state.travelSpeed.toFixed(2)} world/s`;
  };
  element<HTMLSelectElement>("pilot-source").onchange = (event) => {
    state.source = (event.target as HTMLSelectElement).value;
  };
  element("pilot-reset").onclick = () => {
    state.reset = true;
  };
  const stage = element("pilot-stage");
  stage.onkeydown = (event: KeyboardEvent) => {
    if (event.code === "KeyD" || event.code === "Space") {
      event.preventDefault();
      state.held = true;
    }
  };
  stage.onkeyup = () => {
    state.held = false;
  };
  stage.onblur = () => {
    state.held = false;
  };
  window.addEventListener("blur", () => {
    state.held = false;
  });

  let comparisonSignature = "";
  const drawComparison = () => {
    const signature = `${state.clip}/${state.frame}/${state.background}/${state.overlays}/${state.speed}`;
    if (signature === comparisonSignature) return;
    comparisonSignature = signature;
    const clip = metadata.clips[state.clip],
      frame = clip.start + state.frame;
    canvases.forEach((canvas, index) => {
      const c = canvas.getContext("2d")!;
      c.fillStyle = state.background === "light" ? "#e4e0d8" : "#171c22";
      c.fillRect(0, 0, 256, 256);
      if (state.background === "checker")
        for (let y = 0; y < 16; y++)
          for (let x = 0; x < 16; x++)
            if ((x + y) % 2) {
              c.fillStyle = "#252b32";
              c.fillRect(x * 16, y * 16, 16, 16);
            }
      if (!index)
        c.drawImage(
          pilotImage,
          (frame % 6) * 256,
          Math.floor(frame / 6) * 256,
          256,
          256,
          0,
          0,
          256,
          256,
        );
      else {
        const col =
          state.clip === "walk"
            ? 2 + Math.floor((state.frame / clip.count) * 6)
            : Math.floor((state.frame / clip.count) * 2);
        c.drawImage(
          shippedImage,
          col * 128,
          7 * 128,
          128,
          128,
          0,
          metadata.root[1]! - 224,
          256,
          256,
        );
      }
      if (state.overlays) {
        const [x, y] = metadata.root as [number, number];
        c.strokeStyle = "#e7bd69";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - 10, y);
        c.lineTo(x + 10, y);
        c.moveTo(x, y - 10);
        c.lineTo(x, y + 10);
        c.stroke();
        if (!index)
          for (const contact of metadata.frames[frame]!.contacts) {
            c.strokeStyle = contact.planted ? "#7ee9c3" : "#d795ef";
            c.beginPath();
            c.arc(contact.pixel[0]!, contact.pixel[1]!, 4, 0, Math.PI * 2);
            c.stroke();
          }
      }
    });
    element("pilot-frame").textContent =
      `${state.clip.toUpperCase()} · ${state.frame + 1} / ${clip.count} · ${clip.fps} fps × ${state.speed}`;
  };
  const navigation: Navigation = {
    boundary: [
      { x: -4000, y: -4000 },
      { x: 8000, y: -4000 },
      { x: 8000, y: 8000 },
      { x: -4000, y: 8000 },
    ],
    obstacles: [],
    clearance: 12,
  };
  const pilotScale = 0.5;
  const stride =
    (((metadata.strideMeters * Math.SQRT1_2 * 256) / metadata.orthoScale) *
      pilotScale) /
    64;
  class Preview extends Phaser.Scene {
    private walker = createWalker({ x: 0, y: 0 });
    private sprite!: Phaser.GameObjects.Sprite;
    private overlay!: Phaser.GameObjects.Graphics;
    private shadow!: Phaser.GameObjects.Ellipse;
    private accumulator = 0;
    private frames = 0;
    preload(): void {
      this.load.spritesheet("pilot", pilotImage.src, {
        frameWidth: 256,
        frameHeight: 256,
      });
      this.load.spritesheet("shipped", shippedImage.src, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
    create(): void {
      const grid = this.add.graphics().lineStyle(1, 0x424a4d, 0.65);
      for (let i = -40; i <= 80; i++)
        for (const across of [true, false]) {
          const a = worldToScreen(across ? { x: i, y: -40 } : { x: -40, y: i });
          const b = worldToScreen(across ? { x: i, y: 80 } : { x: 80, y: i });
          grid.lineBetween(a.x, a.y, b.x, b.y);
        }
      this.shadow = this.add.ellipse(0, 0, 28, 12, 0x000000, 0.35);
      this.sprite = this.add.sprite(0, 0, "pilot", 0);
      this.overlay = this.add.graphics();
      document.documentElement.dataset.warriorPilotReady = "true";
    }
    update(_time: number, delta: number): void {
      const elapsed = Math.min(delta / 1000, 0.1);
      if (state.playing) {
        state.elapsed += elapsed * state.speed;
        state.frame =
          Math.floor(state.elapsed * metadata.clips[state.clip].fps) %
          metadata.clips[state.clip].count;
      }
      if (state.reset) {
        this.walker = createWalker({ x: 0, y: 0 });
        state.reset = false;
      }
      this.accumulator += elapsed;
      while (this.accumulator >= 1 / 60) {
        this.walker = moveTick(
          this.walker,
          navigation,
          state.held ? { x: 1, y: 0.5 } : { x: 0, y: 0 },
          { ...MOVEMENT, walkSpeed: state.travelSpeed },
        );
        this.accumulator -= 1 / 60;
      }
      const p = worldToScreen(this.walker.position),
        moving = this.walker.walking;
      const phase = (this.walker.distance / stride) % 1;
      const pilotFrame = moving
        ? 8 + Math.floor(phase * 16)
        : Math.floor(this.walker.tick / 10) % 8;
      const oldFrame =
        56 +
        (moving
          ? 2 + Math.floor(phase * 6)
          : Math.floor(this.walker.tick / 60) % 2);
      this.sprite
        .setTexture(
          state.source,
          state.source === "pilot" ? pilotFrame : oldFrame,
        )
        .setOrigin(
          0.5,
          state.source === "pilot" ? metadata.root[1]! / 256 : 112 / 128,
        )
        .setScale(state.source === "pilot" ? pilotScale : 0.93)
        .setPosition(p.x, p.y)
        .setDepth(p.y);
      this.shadow.setPosition(p.x, p.y).setDepth(p.y - 1);
      this.cameras.main.setZoom(state.zoom).centerOn(p.x, p.y - 30);
      this.overlay.clear().setDepth(p.y + 1);
      if (state.overlays)
        this.overlay
          .lineStyle(1, 0x65d5df)
          .strokeCircle(p.x, p.y, 12)
          .lineStyle(1, 0xe7bd69)
          .lineBetween(p.x - 7, p.y, p.x + 7, p.y)
          .lineBetween(p.x, p.y - 7, p.x, p.y + 7);
      drawComparison();
      window.hollowbaneWarriorPilot = {
        clip: state.clip,
        frame: state.frame,
        playing: state.playing,
        speed: state.speed,
        zoom: state.zoom,
        distance: this.walker.distance,
        position: { ...this.walker.position },
        moving,
        source: state.source,
        root: metadata.root,
        renderFrames: ++this.frames,
        stageFrame: state.source === "pilot" ? pilotFrame : oldFrame,
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
