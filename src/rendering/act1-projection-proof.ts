import Phaser from "phaser";
import proof from "../../public/dev/act1-projection-proof/proof.json";
import { applyCombatHit } from "../simulation/combat";
import { commandCombat, hoverTarget } from "../simulation/combat-targeting";
import { movementFrame } from "../simulation/locomotion";
import { act1Project, act1Unproject } from "../world/act1-view";
import { fromGround } from "../world/navigation";
import { controllerInput } from "./controller-input";
import { recordMotion } from "./combat-motion";
import {
  createWarriorArena,
  stepWarriorArena,
  warriorArenaAttack,
  warriorArenaAbility,
  warriorArenaPose,
  WARRIOR_ARENA_NAV,
} from "./warrior-arena-state";
import "./act1-readability.css";

interface ProofSample {
  generation: number;
  tick: number;
  clip: string;
  frame: number;
  phase: string;
  hp: number;
  direction: number;
  deaths: number;
  effects: number;
  position: { x: number; y: number };
}
declare global {
  interface Window {
    hollowbaneProjectionProof?: ProofSample & {
      history: ProofSample[];
      camera: { x: number; y: number };
      textures: number;
      view: "se";
    };
  }
}

/** Disposable actual combat fixture; the bounded art deliberately shows only SE.
 * It never binds a character, reads a save, or changes campaign presentation.
 */
export function startAct1ProjectionProof(): Phaser.Game {
  const root = document.querySelector("main")!;
  root.className = "act1-readability";
  root.innerHTML = `<div id="world" tabindex="0" role="application" aria-label="Southeast projection proof"></div>
    <header class="act1-caption"><p>HOLLOWBANE · VARIANT B PROJECTION PROOF</p><h1>Southeast animation study</h1><p>Fixed SE artwork · live movement and combat · other directions remain unrendered</p><p id="projection-status">Loading measured animation set…</p></header>
    <footer class="act1-controls"><span>WASD / left stick · Click ground or target · R run · X attack · 1 Sundering Fan · P pause</span><div><button id="projection-attack">Primary</button><button id="projection-fan">Sundering Fan</button><button id="projection-hit">Receive hit</button><button id="projection-death">Receive lethal hit</button><button id="projection-pause">Pause</button><button id="projection-reset">Reset</button><a href="?act1readability=1&amp;view=b">Approved B environment</a><a href="?">Menu</a></div></footer>`;
  document.title = "Hollowbane · B projection proof";
  const stage = root.querySelector<HTMLElement>("#world")!;
  const status = root.querySelector<HTMLElement>("#projection-status")!;
  const keys = new Set<string>();
  controllerInput.movementKeys = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
  ]);
  let arena = createWarriorArena();
  let generation = 0;
  let residual = 0,
    paused = false,
    incoming: "hit" | "death" | null = null;
  let history: ProofSample[] = [];
  const project = (point: { x: number; y: number }) => act1Project(point, "b");
  const pause = () => {
    paused = !paused;
    residual = 0;
    root.querySelector("#projection-pause")!.textContent = paused
      ? "Resume"
      : "Pause";
  };
  const action = (name: string) => {
    if (name === "reset") {
      arena = createWarriorArena();
      generation++;
      history = [];
      residual = 0;
      incoming = null;
      keys.clear();
      controllerInput.clear();
    } else if (name === "pause") pause();
    else if (!paused) {
      if (name === "attack") warriorArenaAttack(arena, "primary");
      if (name === "fan") warriorArenaAbility(arena, "iron-fan");
      if (name === "stop") {
        const player = arena.world.actors[0]!;
        player.controller = commandCombat(player.controller, { kind: "stop" });
      }
      if (name === "hit" || name === "death") incoming = name;
      if (name === "run") {
        const walker = arena.world.actors[0]!.controller.walker;
        walker.gait = walker.gait === "walk" ? "run" : "walk";
      }
    }
  };
  for (const name of ["attack", "fan", "hit", "death", "pause", "reset"])
    root.querySelector<HTMLButtonElement>(`#projection-${name}`)!.onclick =
      () => {
        action(name);
        stage.focus();
      };
  const keydown = (event: KeyboardEvent) => {
    if (
      document.activeElement !== stage ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        event.code,
      )
    )
      event.preventDefault();
    keys.add(event.code);
  };
  const keyup = (event: KeyboardEvent) => keys.delete(event.code);
  const clear = () => {
    keys.clear();
    residual = 0;
  };
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("hollowbane-input-reset", clear);
  stage.addEventListener("blur", clear);

  class ProjectionProof extends Phaser.Scene {
    private sprites: Phaser.GameObjects.Sprite[] = [];
    private shadows: Phaser.GameObjects.Ellipse[] = [];
    preload(): void {
      this.load.spritesheet(
        "b-proof",
        `${import.meta.env.BASE_URL}dev/act1-projection-proof/proof.png`,
        {
          frameWidth: proof.window.width,
          frameHeight: proof.window.height,
        },
      );
      this.load.spritesheet(
        "b-proof-placeholder",
        `${import.meta.env.BASE_URL}assets/wanderer.webp`,
        { frameWidth: 128, frameHeight: 128 },
      );
    }
    create(): void {
      if (
        !this.textures.exists("b-proof") ||
        !this.textures.exists("b-proof-placeholder")
      ) {
        status.textContent =
          "Projection assets failed to load. Reload to retry.";
        this.scene.pause();
        return;
      }
      const ink = this.add.graphics().setDepth(-10000);
      const polygon = WARRIOR_ARENA_NAV.boundary.map((p) =>
        project(fromGround(p)),
      );
      ink.fillStyle(0x3b3e2b).fillPoints(
        polygon.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
        true,
      );
      ink.lineStyle(10, 0x293322).strokePoints(
        polygon.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
        true,
      );
      for (const wall of WARRIOR_ARENA_NAV.obstacles) {
        const p = project(fromGround(wall));
        this.add
          .ellipse(p.x, p.y, wall.rx * 2, (wall.ry * 2 * 44) / 32, 0x515140)
          .setDepth(p.y);
      }
      for (const actor of arena.world.actors) {
        this.shadows.push(
          this.add.ellipse(0, 0, 28, (28 * 44) / 64, 0x10160f, 0.45),
        );
        this.sprites.push(
          this.add
            .sprite(0, 0, "b-proof-placeholder")
            .setTint(actor.id ? 0xb28468 : 0xffffff),
        );
      }
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        stage.focus();
        if (paused) return;
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
          project,
        );
        if (target !== null) {
          player.controller.selected = target;
          action("attack");
        } else
          player.controller = commandCombat(player.controller, {
            kind: "move",
            target: act1Unproject(p, "b"),
          });
      });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
        window.removeEventListener("hollowbane-input-reset", clear);
        stage.removeEventListener("blur", clear);
        delete window.hollowbaneProjectionProof;
      });
      stage.focus();
    }
    update(_time: number, delta: number): void {
      const focused = document.activeElement === stage && !document.hidden;
      for (const [input, name] of [
        ["primary", "attack"],
        ["skill1", "fan"],
        ["toggleRun", "run"],
        ["cancel", "stop"],
      ] as const)
        if (
          controllerInput.take(input) &&
          focused &&
          controllerInput.frame.device !== "mouse"
        )
          action(name);
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
      if (!paused && focused) residual += Math.min(delta / 1000, 0.1);
      else residual = 0;
      while (residual >= 1 / 60) {
        if (incoming) {
          const enemy = arena.world.actors.find((a) => a.id && a.hp > 0);
          if (enemy)
            applyCombatHit(
              arena.world,
              enemy,
              arena.world.actors[0]!,
              WARRIOR_ARENA_NAV,
              {
                damage: incoming === "death" ? 10000 : 10,
                element: "physical",
                guaranteed: true,
                stagger: incoming === "hit",
              },
            );
          recordMotion(
            arena.cues,
            arena.world.actors,
            arena.world.events,
            arena.world.tick,
          );
          incoming = null;
        }
        stepWarriorArena(
          arena,
          focused
            ? { x: direct.vector.x, y: (direct.vector.y * 32) / 44 }
            : { x: 0, y: 0 },
          direct.scale,
        );
        residual -= 1 / 60;
        history.push(this.sample());
        if (history.length > 600) history.shift();
      }
      const pose = warriorArenaPose(arena);
      const frame = proof.frames.findIndex(
        (f) => f.set === pose.set && f.frame === pose.frame,
      );
      const sample = this.sample();
      const focus = project(sample.position);
      const camera = { x: Math.round(focus.x), y: Math.round(focus.y) };
      this.cameras.main.centerOn(camera.x, camera.y);
      for (const [i, actor] of arena.world.actors.entries()) {
        const p = project(actor.controller.walker.position),
          sprite = this.sprites[i]!;
        if (i === 0 && frame >= 0)
          sprite
            .setTexture("b-proof", frame)
            .setOrigin(
              proof.window.root[0]! / proof.window.width,
              proof.window.root[1]! / proof.window.height,
            )
            .setScale(0.5);
        else
          sprite
            .setTexture(
              "b-proof-placeholder",
              movementFrame(actor.controller.walker, false),
            )
            .setOrigin(0.5, 112 / 128)
            .setScale(0.93);
        sprite.setPosition(p.x, p.y).setDepth(p.y + (i === 0 ? 0.01 : 0));
        this.shadows[i]!.setPosition(p.x, p.y).setDepth(p.y - 1);
      }
      status.textContent = `${paused ? "Paused · " : ""}${sample.clip} ${pose.frame} · health ${Math.ceil(sample.hp)} · simulation facing ${sample.direction} · SE art`;
      window.hollowbaneProjectionProof = {
        ...sample,
        history: [...history],
        camera,
        textures: this.textures.getTextureKeys().length,
        view: "se",
      };
    }
    private sample(): ProofSample {
      const actor = arena.world.actors[0]!,
        pose = warriorArenaPose(arena);
      return {
        generation,
        tick: arena.world.tick,
        clip: pose.clip,
        frame: pose.frame,
        phase: actor.controller.timeline.phase,
        hp: actor.hp,
        direction: actor.controller.walker.direction,
        deaths: arena.world.events.filter(
          (e) => e.kind === "death" && e.target === 0,
        ).length,
        effects: arena.skills.events.filter(
          (e) => e.kind === "effect" && e.actor === 0,
        ).length,
        position: { ...actor.controller.walker.position },
      };
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: stage,
    width: innerWidth,
    height: innerHeight,
    backgroundColor: "#1d251d",
    scene: ProjectionProof,
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE },
    render: { antialias: true, roundPixels: true },
  });
}
