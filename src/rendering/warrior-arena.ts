import Phaser from "phaser";
import movement from "../../public/dev/warrior-directions/warrior.json";
import attacks from "../../public/dev/warrior-attack-directions/warrior.json";
import abilities from "../../public/dev/warrior-abilities/warrior.json";
import hit from "../../public/dev/warrior-reactions/warrior.json";
import death from "../../public/dev/warrior-death/warrior.json";
import { commandCombat, hoverTarget } from "../simulation/combat-targeting";
import { movementFrame } from "../simulation/locomotion";
import { worldToScreen, screenToWorld } from "../world/isometric";
import { ORIGIN } from "../world/navigation";
import { controllerInput } from "./controller-input";
import { combatPose } from "./combat-motion";
import {
  createWarriorArena,
  stepWarriorArena,
  warriorArenaAttack,
  warriorArenaAbility,
  warriorArenaPose,
  warriorArenaTarget,
  WARRIOR_ARENA_NAV,
  WARRIOR_DIRECTIONS,
  type WarriorSet,
} from "./warrior-arena-state";
import "./warrior-pilot.css";
import "./warrior-arena.css";

const manifests = { movement, attacks, abilities, hit, death };
const folders: Record<WarriorSet, string> = {
  movement: "warrior-directions",
  attacks: "warrior-attack-directions",
  abilities: "warrior-abilities",
  hit: "warrior-reactions",
  death: "warrior-death",
};
const sets = Object.keys(manifests) as WarriorSet[];
const cellSize = (set: WarriorSet) =>
  set === "movement"
    ? ([movement.cellWidth, movement.cellHeight] as const)
    : ([manifests[set].cell, manifests[set].cell] as const);
const textureKey = (set: WarriorSet, direction: string) =>
  `arena-${set}-${direction}`;
const candidateKeys = sets.flatMap((set) =>
  WARRIOR_DIRECTIONS.map((d) => textureKey(set, d)),
);

function arenaSample(arena: ReturnType<typeof createWarriorArena>) {
  const actor = arena.world.actors[0]!,
    walker = actor.controller.walker;
  return {
    tick: arena.world.tick,
    phase: actor.controller.timeline.phase,
    remaining: actor.controller.timeline.remaining,
    sequence: actor.controller.timeline.sequence,
    pose: warriorArenaPose(arena),
    direction: walker.direction,
    position: { ...walker.position },
    distance: walker.distance,
    gait: walker.gait,
    hp: actor.hp,
    mana: arena.skills.users[0]!.mana,
    effects: arena.skills.events.filter(
      (e) => e.actor === 0 && e.kind === "effect",
    ).length,
    abilityEvents: arena.skills.events.filter(
      (e) => e.actor === 0 && e.tick === arena.world.tick,
    ),
    strikes: arena.world.events.filter(
      (e) => e.actor === 0 && e.kind === "phase" && e.phase === "active",
    ).length,
    target: actor.controller.selected,
    actors: arena.world.actors.map((a) => ({
      id: a.id,
      hp: a.hp,
      position: { ...a.controller.walker.position },
      phase: a.controller.timeline.phase,
    })),
    events: arena.world.events.filter((e) => e.tick === arena.world.tick),
  };
}
type ArenaSample = ReturnType<typeof arenaSample>;
declare global {
  interface Window {
    hollowbaneWarriorArena?: {
      sample: ArenaSample;
      history: ArenaSample[];
      source: string;
      playing: boolean;
      textures: number;
      candidateTextures: number;
      decodedBytes: number;
      maxTextureSize: number;
      renderFrames: number;
      cameraRelative: { x: number; y: number };
      root: { x: number; y: number };
      readyMs: number;
    };
  }
}

/** Developer entry only. Assets are loaded once by Phaser, never decoded into duplicate canvas images. */
export async function startWarriorArena(): Promise<void> {
  const begin = performance.now();
  const root = document.querySelector("main")!;
  root.className = "warrior-pilot warrior-arena";
  document.title = "Hollowbane · playable Warrior review";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / RELEASE C / DEVELOPER CANDIDATE</p><h1>Warrior · playable arena</h1><p>WASD / arrows · R walk/run · X primary · Q secondary · 1 Sundering Fan · 2 Oath Echo · T target · P pause</p><p>Click enemy to approach/attack; click ground to move; right click for secondary. Controller: left stick, X/Y, RB/RT, L3 gait, R3 target, Menu pause.</p></header>
  <section class="pilot-controls" aria-label="Arena diagnostics">
  <label>Graphics <select id="arena-source"><option value="candidate">Candidate</option><option value="shipped">Original</option></select></label>
  <button id="arena-primary">Primary</button><button id="arena-secondary">Secondary</button><button id="arena-fan">Sundering Fan</button><button id="arena-oath">Oath Echo</button>
  <button id="arena-reset">Reset arena</button><button id="arena-pause">Pause</button><button id="arena-step">One tick</button>
  <label>Playback <select id="arena-rate"><option value="1">1×</option><option value="0.25">0.25× inspection</option></select></label>
  <label><input type="checkbox" id="arena-guides" checked> Root / feet</label><button id="arena-resources">Release candidate textures</button>
  </section><p id="arena-loading" role="status">Loading developer assets…</p>
  <div id="pilot-stage" tabindex="0" role="application" aria-label="Playable Warrior arena"></div>
  <output id="arena-status" aria-label="Animation diagnostics"></output>
  <p class="pilot-note">Seeded disposable training encounter. Both sword variants use existing melee rules. Candidate is not active in normal play. No character save is opened. Gold cross: authoritative ground root; green/purple: authored feet. Graphics switching preserves gameplay. <a href="./">Return to Hollowbane</a></p>`;
  const el = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const stage = el("pilot-stage"),
    keys = new Set<string>();
  let arena = createWarriorArena(),
    source = "candidate",
    playing = true,
    guides = true,
    rate = 1;
  let accumulator = 0,
    stepping = false,
    history: ArenaSample[] = [],
    readyMs = 0;
  let resourceState: "ready" | "released" | "loading" = "loading";
  const record = () => {
    history.push(arenaSample(arena));
    if (history.length > 600) history.shift();
  };
  const pause = (value: boolean) => {
    playing = value;
    accumulator = 0;
    el("arena-pause").textContent = playing ? "Pause" : "Play";
  };
  const reset = () => {
    arena = createWarriorArena();
    history = [];
    accumulator = 0;
    keys.clear();
    controllerInput.clear();
    stage.focus();
  };
  el("arena-reset").onclick = reset;
  el("arena-primary").onclick = () => {
    warriorArenaAttack(arena, "primary");
    stage.focus();
  };
  el("arena-secondary").onclick = () => {
    warriorArenaAttack(arena, "secondary");
    stage.focus();
  };
  el("arena-fan").onclick = () => {
    warriorArenaAbility(arena, "iron-fan");
    stage.focus();
  };
  el("arena-oath").onclick = () => {
    warriorArenaAbility(arena, "oath-echo");
    stage.focus();
  };
  el("arena-pause").onclick = () => pause(!playing);
  el("arena-step").onclick = () => {
    pause(false);
    stepping = true;
  };
  el<HTMLInputElement>("arena-guides").onchange = (e) => {
    guides = (e.target as HTMLInputElement).checked;
  };
  el<HTMLSelectElement>("arena-source").onchange = (e) => {
    source =
      resourceState === "ready"
        ? (e.target as HTMLSelectElement).value
        : "shipped";
    el<HTMLSelectElement>("arena-source").value = source;
  };
  el<HTMLSelectElement>("arena-rate").onchange = (e) => {
    rate = Number((e.target as HTMLSelectElement).value);
    accumulator = 0;
  };
  window.addEventListener("keydown", (e) => {
    if (document.activeElement !== stage || e.metaKey || e.ctrlKey || e.altKey)
      return;
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code,
      )
    )
      e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("hollowbane-input-reset", () => keys.clear());
  stage.addEventListener("blur", () => {
    keys.clear();
  });
  stage.addEventListener("contextmenu", (e) => e.preventDefault());
  controllerInput.movementKeys = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
  ]);

  class Arena extends Phaser.Scene {
    private sprites: Phaser.GameObjects.Sprite[] = [];
    private shadows: Phaser.GameObjects.Ellipse[] = [];
    private graphics!: Phaser.GameObjects.Graphics;
    private frames = 0;
    private maxTextureSize = 0;
    private queueCandidate(): void {
      for (const set of sets)
        for (const direction of WARRIOR_DIRECTIONS) {
          const manifest = manifests[set];
          this.load.spritesheet(
            textureKey(set, direction),
            `${import.meta.env.BASE_URL}dev/${folders[set]}/${manifest.views[direction].atlas}`,
            {
              frameWidth: cellSize(set)[0],
              frameHeight: cellSize(set)[1],
            },
          );
        }
    }
    preload(): void {
      this.queueCandidate();
      this.load.spritesheet(
        "arena-shipped",
        `${import.meta.env.BASE_URL}assets/wanderer.webp`,
        { frameWidth: 128, frameHeight: 128 },
      );
      this.load.on("progress", (progress: number) => {
        el("arena-loading").textContent =
          `Loading developer atlases · ${Math.round(progress * 100)}%`;
      });
    }
    create(): void {
      const missing = candidateKeys.filter((key) => !this.textures.exists(key));
      if (missing.length) {
        el("arena-loading").textContent =
          `Asset loading failed: ${missing.join(", ")}`;
        return;
      }
      resourceState = "ready";
      readyMs = performance.now() - begin;
      const gl = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl;
      this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      el("arena-loading").textContent =
        "Developer assets ready · gameplay scale 1×";
      const grid = this.add
        .graphics()
        .lineStyle(1, 0x424a4d, 0.7)
        .setDepth(-10000);
      for (let i = -15; i <= 15; i++)
        for (const across of [true, false]) {
          const a = worldToScreen(across ? { x: i, y: -15 } : { x: -15, y: i });
          const b = worldToScreen(across ? { x: i, y: 15 } : { x: 15, y: i });
          grid.lineBetween(a.x, a.y, b.x, b.y);
        }
      const boundary = WARRIOR_ARENA_NAV.boundary.map((p) => ({
        x: p.x - ORIGIN.x,
        y: p.y - ORIGIN.y,
      }));
      grid.lineStyle(3, 0xb38e5b);
      for (const [i, a] of boundary.entries()) {
        const b = boundary[(i + 1) % boundary.length]!;
        grid.lineBetween(a.x, a.y, b.x, b.y);
      }
      for (const wall of WARRIOR_ARENA_NAV.obstacles) {
        const x = wall.x - ORIGIN.x,
          y = wall.y - ORIGIN.y;
        this.add.ellipse(x, y, wall.rx * 2, wall.ry * 2, 0x685844).setDepth(y);
      }
      for (const actor of arena.world.actors) {
        this.shadows.push(this.add.ellipse(0, 0, 28, 12, 0, 0.35));
        this.sprites.push(
          this.add
            .sprite(0, 0, "arena-shipped", 0)
            .setTint(
              actor.id === 0
                ? 0xffffff
                : actor.kind === "hostile"
                  ? 0xd97861
                  : 0x9caaa0,
            ),
        );
      }
      this.graphics = this.add.graphics();
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        stage.focus();
        if (!playing || resourceState === "loading") return;
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const player = arena.world.actors[0]!;
        const target = hoverTarget(
          p,
          arena.world.actors
            .filter((a) => a.id !== 0)
            .map((a) => ({
              id: a.id,
              position: a.controller.walker.position,
              alive: a.hp > 0,
            })),
          worldToScreen,
        );
        if (target !== null) player.controller.selected = target;
        if (pointer.rightButtonDown()) warriorArenaAttack(arena, "secondary");
        else if (target !== null) warriorArenaAttack(arena, "primary");
        else
          player.controller = commandCombat(player.controller, {
            kind: "move",
            target: screenToWorld(p),
          });
      });
      el("arena-resources").onclick = () => {
        if (resourceState === "loading") return;
        if (resourceState === "ready") {
          source = "shipped";
          el<HTMLSelectElement>("arena-source").value = source;
          this.sprites[0]!.setTexture("arena-shipped", 0);
          for (const key of candidateKeys) this.textures.remove(key);
          resourceState = "released";
          el("arena-resources").textContent = "Reload candidate textures";
          el("arena-loading").textContent =
            "Candidate textures released; original graphics remain playable";
        } else {
          resourceState = "loading";
          this.queueCandidate();
          this.load.once("complete", () => {
            resourceState = candidateKeys.every((key) =>
              this.textures.exists(key),
            )
              ? "ready"
              : "released";
            el("arena-resources").textContent =
              resourceState === "ready"
                ? "Release candidate textures"
                : "Reload candidate textures";
            el("arena-loading").textContent =
              resourceState === "ready"
                ? "Candidate textures reloaded"
                : "Reload failed; original remains playable";
          });
          this.load.start();
        }
      };
      document.documentElement.dataset.warriorArenaReady = "true";
    }
    update(_time: number, delta: number): void {
      if (!this.graphics) return;
      const player = arena.world.actors[0]!;
      const focused = document.activeElement === stage;
      if (focused && controllerInput.frame.device !== "mouse") {
        if (controllerInput.take("pause")) pause(!playing);
        if (playing) {
          if (controllerInput.take("toggleRun"))
            player.controller.walker.gait =
              player.controller.walker.gait === "walk" ? "run" : "walk";
          if (controllerInput.take("targetLock")) {
            const choices = arena.world.actors.filter(
              (a) => a.id !== 0 && a.hp > 0,
            );
            const i = choices.findIndex(
              (a) => a.id === player.controller.selected,
            );
            player.controller.selected =
              choices[(i + 1) % choices.length]?.id ?? null;
          }
          if (controllerInput.take("primary"))
            warriorArenaAttack(arena, "primary");
          if (controllerInput.take("secondary"))
            warriorArenaAttack(arena, "secondary");
          if (controllerInput.take("skill1"))
            warriorArenaAbility(arena, "iron-fan");
          if (controllerInput.take("skill2"))
            warriorArenaAbility(arena, "oath-echo");
          if (controllerInput.take("cancel"))
            player.controller = commandCombat(player.controller, {
              kind: "stop",
            });
        } else
          for (const action of [
            "toggleRun",
            "targetLock",
            "primary",
            "secondary",
            "skill1",
            "skill2",
            "cancel",
          ] as const)
            controllerInput.take(action);
      } else
        for (const action of [
          "pause",
          "toggleRun",
          "targetLock",
          "primary",
          "secondary",
          "skill1",
          "skill2",
          "cancel",
        ] as const)
          controllerInput.take(action);
      const direct = controllerInput.movement(
        focused
          ? {
              x:
                Number(keys.has("KeyD") || keys.has("ArrowRight")) -
                Number(keys.has("KeyA") || keys.has("ArrowLeft")),
              y:
                Number(keys.has("KeyS") || keys.has("ArrowDown")) -
                Number(keys.has("KeyW") || keys.has("ArrowUp")),
            }
          : { x: 0, y: 0 },
      );
      if (playing && resourceState !== "loading")
        accumulator += Math.min(delta / 1000, 0.1) * rate;
      while (accumulator >= 1 / 60) {
        stepWarriorArena(
          arena,
          focused ? direct.vector : { x: 0, y: 0 },
          direct.scale,
        );
        record();
        accumulator -= 1 / 60;
      }
      if (stepping) {
        stepWarriorArena(arena);
        record();
        stepping = false;
      }
      const sample = arenaSample(arena),
        pose = sample.pose;
      const direction = WARRIOR_DIRECTIONS[sample.direction]!;
      const candidate = source === "candidate" && resourceState === "ready";
      const p = worldToScreen(player.controller.walker.position);
      this.cameras.main.centerOn(p.x, p.y - 30);
      this.graphics.clear().setDepth(10000);
      for (const [i, actor] of arena.world.actors.entries()) {
        const sprite = this.sprites[i]!,
          q = worldToScreen(actor.controller.walker.position);
        const motion = combatPose(
          actor,
          arena.cues[actor.id],
          arena.world.tick,
        );
        const useCandidate = i === 0 && candidate;
        const manifest = manifests[pose.set];
        sprite
          .setTexture(
            useCandidate ? textureKey(pose.set, direction) : "arena-shipped",
            useCandidate
              ? pose.frame
              : movementFrame(actor.controller.walker, false),
          )
          .setOrigin(
            0.5,
            useCandidate
              ? manifest.root[1]! / cellSize(pose.set)[1]
              : 112 / 128,
          )
          .setScale(
            useCandidate ? 0.5 : 0.93,
            useCandidate ? 0.5 : 0.93 * motion.scaleY,
          )
          .setPosition(
            q.x + (useCandidate ? 0 : motion.x),
            q.y + (useCandidate ? 0 : motion.y),
          )
          .setAngle(useCandidate ? 0 : motion.angle)
          .setAlpha(useCandidate ? 1 : motion.alpha)
          .setDepth(q.y);
        this.shadows[i]!.setPosition(q.x, q.y).setDepth(q.y - 1);
        if (actor.id !== 0 && actor.hp > 0) {
          this.graphics
            .fillStyle(0x181818)
            .fillRect(q.x - 20, q.y - 108, 40, 4)
            .fillStyle(
              actor.id === warriorArenaTarget(arena) ? 0xe7bd69 : 0x8aa19b,
            )
            .fillRect(q.x - 20, q.y - 108, (40 * actor.hp) / actor.maxHp, 4);
        }
      }
      if (guides) {
        this.graphics
          .lineStyle(1, 0xe7bd69)
          .lineBetween(p.x - 8, p.y, p.x + 8, p.y)
          .lineBetween(p.x, p.y - 8, p.x, p.y + 8);
        if (candidate) {
          const frame =
            manifests[pose.set].views[direction].frames[pose.frame]!;
          const feet =
            "contacts" in frame
              ? frame.contacts.map((c) => c.pixel)
              : "footPixels" in frame
                ? frame.footPixels
                : movement.views[direction].frames[0]!.contacts.map((c) => [
                    c.pixel[0]! + 32,
                    c.pixel[1]! + 64,
                  ]);
          for (const foot of feet)
            this.graphics
              .lineStyle(1, 0x7ee9c3)
              .strokeCircle(
                p.x + (foot[0]! - manifests[pose.set].root[0]!) * 0.5,
                p.y + (foot[1]! - manifests[pose.set].root[1]!) * 0.5,
                2,
              );
        }
      }
      const count = candidateKeys.filter((key) =>
        this.textures.exists(key),
      ).length;
      el("arena-status").textContent =
        `HP ${sample.hp}/${player.maxHp} · mana ${sample.mana.toFixed(1)} · ${sample.gait} · ${direction.toUpperCase()}\nTick ${sample.tick} · ${sample.phase} (${sample.remaining}) · ${pose.clip} frame ${pose.frame} · sequence ${sample.sequence} · ${rate}×\nActive entries ${sample.strikes} · ability effects ${sample.effects} · root ${p.x.toFixed(2)}, ${p.y.toFixed(2)} · textures ${count}/40 · ${source}`;
      window.hollowbaneWarriorArena = {
        sample,
        history,
        source,
        playing,
        textures: this.textures.getTextureKeys().length,
        candidateTextures: count,
        decodedBytes: sets.reduce(
          (sum, set) =>
            sum +
            WARRIOR_DIRECTIONS.reduce(
              (subtotal, d) =>
                subtotal +
                (this.textures.exists(textureKey(set, d))
                  ? manifests[set].views[d].decodedBytes
                  : 0),
              0,
            ),
          0,
        ),
        maxTextureSize: this.maxTextureSize,
        renderFrames: ++this.frames,
        cameraRelative: {
          x: p.x - this.cameras.main.scrollX,
          y: p.y - this.cameras.main.scrollY,
        },
        root: { x: p.x, y: p.y },
        readyMs,
      };
    }
  }
  new Phaser.Game({
    type: Phaser.WEBGL,
    parent: stage,
    width: 960,
    height: 480,
    backgroundColor: "#20262a",
    scene: Arena,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    // Cold profiling found ~100ms loading bursts with the default parallel queue.
    // Bound this developer-only loader; preserve every approved source pixel.
    loader: { maxParallelDownloads: 2 },
  });
}
