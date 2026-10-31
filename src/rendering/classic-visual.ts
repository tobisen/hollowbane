import Phaser from "phaser";
import {
  ACT1_CLEARINGS,
  act1ReadabilityMap,
  createAct1Encounter,
  stepAct1Encounter,
} from "../simulation/act1-readability";
import { commandCombat } from "../simulation/combat-targeting";
import actorAssets from "../../public/dev/classic-visual/actors.json";
import { WarriorMotion } from "./warrior-pose";
import {
  classicActorFrame,
  observeClassicMotion,
  type ClassicActorKind,
} from "./classic-actor-frame";
import { areaNavigation } from "../world/navigation";
import type { Point } from "../world/isometric";
import {
  act1Project,
  act1Unproject,
  type Act1Variant,
} from "../world/act1-view";
import { drawClassicEnvironment } from "./classic-environment";
import { recordMotion, type MotionCues } from "./combat-motion";
import { controllerInput } from "./controller-input";
import "./act1-readability.css";

declare global {
  interface Window {
    hollowbaneClassic?: {
      position: Point;
      tick: number;
      variant: Act1Variant;
      camera: Point;
      moving: boolean;
      hp: number;
      actors: {
        id: number;
        position: Point;
        hp: number;
        phase: string;
        clip: string;
        frame: number;
        view: string;
        kind: string;
      }[];
      seenFrames: string[];
      environment: ReturnType<typeof drawClassicEnvironment>;
      textures: number;
    };
  }
}

/** Isolated presentation pilot: no character owner, storage, saved map or campaign dispatch. */
export function startClassicVisual(): Phaser.Game {
  const root = document.querySelector("main")!;
  root.className = "act1-readability";
  root.innerHTML = `<div id="world" tabindex="0" role="application" aria-label="Act 1 classic environment pilot"></div>
    <header class="act1-caption"><p>HOLLOWBANE · CLASSIC VISUAL PILOT</p><h1 id="act1-place">Ashen March</h1><p id="act1-status"></p></header>
    <nav class="act1-compare" aria-label="Viewpoint comparison"><a href="?act1readability=1&amp;view=b">Variant B</a><span id="act1-view-label"></span></nav>
    <footer class="act1-controls"><span>WASD / arrows / left stick · Click to walk or attack · X / pad primary to attack · R to run · P to pause</span><div><button id="act1-reset">Return to march</button><button id="act1-meadow">Walk to clearing</button><button id="act1-shrine">Walk to shrine</button><button id="classic-edge">Woodland edge</button><a href="?world=1&amp;developer=1&amp;worldPeaceful=1&amp;worldArea=haunted-forest&amp;worldSeed=42&amp;quality=full">Current forest</a><a href="?d2slice=1">Dungeon study</a><a href="?">Menu</a></div></footer>`;
  document.title = "Hollowbane · Classic visual pilot";
  const variant: Act1Variant = "b";
  const map = act1ReadabilityMap(),
    nav = areaNavigation(map);
  let encounter = createAct1Encounter();
  let motion: MotionCues = {};
  const animationMemory = new Map<number, WarriorMotion>();
  const seenFrames = new Set<string>();
  const frames = new Map(
    actorAssets.frames.map((frame) => [frame.name, frame]),
  );
  const kindOf = (id: number): ClassicActorKind =>
    id === 0
      ? "warrior"
      : encounter.brains.find((brain) => brain.id === id)?.role === "flanker"
        ? "runner"
        : "raider";
  const animation = (actor: (typeof encounter.combat.actors)[number]) => {
    let memory = animationMemory.get(actor.id);
    if (!memory) {
      memory = new WarriorMotion();
      animationMemory.set(actor.id, memory);
    }
    return classicActorFrame(
      actor,
      encounter.combat.tick,
      motion[actor.id]?.deathAt ?? null,
      memory,
      kindOf(actor.id),
    );
  };
  class Act1 extends Phaser.Scene {
    private views = new Map<
      number,
      {
        sprite: Phaser.GameObjects.Sprite;
        shadow: Phaser.GameObjects.Image;
        bar: Phaser.GameObjects.Graphics;
      }
    >();
    private held = new Set<string>();
    private residual = 0;
    private environment!: ReturnType<typeof drawClassicEnvironment>;
    preload(): void {
      for (const key of ["oak", "bell", "earth", "rocks", "undergrowth"])
        this.load.image(
          `classic-${key}`,
          import.meta.env.BASE_URL + `dev/classic-visual/${key}.png`,
        );
      for (const atlas of actorAssets.atlases)
        this.load.image(
          `classic-${atlas.kind}`,
          import.meta.env.BASE_URL + `dev/classic-visual/${atlas.file}`,
        );
    }
    create(): void {
      this.views.clear();
      for (const frame of actorAssets.frames) {
        const texture = this.textures.get(`classic-${frame.kind}`);
        if (!texture.has(frame.name))
          texture.add(
            frame.name,
            0,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
          );
      }
      this.environment = drawClassicEnvironment(this, map);
      const field = document.querySelector<HTMLElement>("#world")!;
      const player = () => encounter.combat.actors[0]!;
      const clear = () => {
        this.held.clear();
        player().controller = commandCombat(player().controller, {
          kind: "stop",
        });
        this.residual = 0;
      };
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
      };
      const up = (e: KeyboardEvent) => this.held.delete(e.code);
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", clear);
      field.addEventListener("blur", clear);
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        field.focus();
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // The inherited training target was only 68px tall above its foot.
        // This pilot's unit-zoom opaque actor is up to93px: include head and cloak.
        const target =
          encounter.combat.actors
            .filter((a) => a.id !== 0 && a.hp > 0)
            .map((a) => {
              const at = act1Project(a.controller.walker.position, variant);
              return {
                id: a.id,
                distance:
                  ((p.x - at.x) / 28) ** 2 + ((p.y - at.y + 46) / 54) ** 2,
              };
            })
            .filter((a) => a.distance <= 1)
            .sort((a, b) => a.distance - b.distance || a.id - b.id)[0]?.id ??
          null;
        player().controller = commandCombat(
          player().controller,
          target === null
            ? { kind: "move", target: act1Unproject(p, variant) }
            : { kind: "attack", target, repeat: true },
        );
      });
      document.querySelector<HTMLButtonElement>("#act1-reset")!.onclick =
        () => {
          clear();
          encounter = createAct1Encounter();
          motion = {};
          animationMemory.clear();
          seenFrames.clear();
          field.focus();
        };
      for (const [id, target] of [
        ["act1-meadow", { x: 29, y: 29 }],
        ["act1-shrine", { x: 42, y: 14 }],
        ["classic-edge", { x: 4, y: 29 }],
      ] as const) {
        document.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => {
          player().controller = commandCombat(player().controller, {
            kind: "move",
            target,
          });
          field.focus();
        };
      }
      document.querySelector("#act1-view-label")!.textContent =
        "Four facing pilot · original Warrior and two enemy roles";
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
        field.removeEventListener("blur", clear);
        delete window.hollowbaneClassic;
      });
      field.focus();
    }
    private attackNearest(): void {
      const player = encounter.combat.actors[0]!;
      const p = player.controller.walker.position;
      const targets = encounter.combat.actors
        .filter((a) => a.id !== 0 && a.hp > 0)
        .map((a) => ({
          id: a.id,
          distance: Math.hypot(
            a.controller.walker.position.x - p.x,
            a.controller.walker.position.y - p.y,
          ),
        }))
        .sort((a, b) => a.distance - b.distance || a.id - b.id);
      const target = targets[0];
      if (target && target.distance < 8)
        player.controller = commandCombat(player.controller, {
          kind: "attack",
          target: target.id,
          repeat: true,
        });
    }
    update(): void {
      const field = document.querySelector("#world");
      const focused = document.activeElement === field && !document.hidden;
      const has = (...keys: string[]) => keys.some((key) => this.held.has(key));
      const input = controllerInput.movement({
        x: Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft")),
        y: Number(has("KeyS", "ArrowDown")) - Number(has("KeyW", "ArrowUp")),
      });
      // Legacy simulation accepts screen vectors in the 128×64 basis. Adapt input only;
      // both presentations retain the same world units/second and collision geometry.
      const vector = {
        x: input.vector.x,
        y: input.vector.y * (variant === "b" ? 32 / 44 : 1),
      };
      const primary = controllerInput.take("primary"),
        run = controllerInput.take("toggleRun");
      const player = encounter.combat.actors[0]!;
      if (focused) {
        if (primary && controllerInput.frame.device !== "mouse")
          this.attackNearest();
        if (run)
          player.controller.walker.gait =
            player.controller.walker.gait === "run" ? "walk" : "run";
        this.residual += Math.min(100, this.game.loop.rawDelta);
        while (this.residual >= 1000 / 120) {
          stepAct1Encounter(encounter, nav, vector, input.scale);
          recordMotion(
            motion,
            encounter.combat.actors,
            encounter.combat.events,
            encounter.combat.tick,
          );
          for (const actor of encounter.combat.actors) {
            let memory = animationMemory.get(actor.id);
            if (!memory) {
              memory = new WarriorMotion();
              animationMemory.set(actor.id, memory);
            }
            observeClassicMotion(memory, actor, encounter.combat.tick);
            seenFrames.add(animation(actor).name);
          }
          this.residual -= 1000 / 60;
        }
      } else {
        this.residual = 0;
      }
      const p = act1Project(player.controller.walker.position, variant);
      const camera = { x: Math.round(p.x), y: Math.round(p.y) };
      this.cameras.main.centerOn(camera.x, camera.y);
      const ids = new Set(encounter.combat.actors.map((a) => a.id));
      for (const [id, view] of this.views)
        if (!ids.has(id)) {
          view.sprite.destroy();
          view.shadow.destroy();
          view.bar.destroy();
          this.views.delete(id);
        }
      for (const actor of encounter.combat.actors) {
        let view = this.views.get(actor.id);
        if (!view) {
          view = {
            sprite: this.add
              .sprite(0, 0, `classic-${kindOf(actor.id)}`)
              .setOrigin(
                actorAssets.root[0]! / actorAssets.cell.width,
                actorAssets.root[1]! / actorAssets.cell.height,
              ),
            shadow: this.add
              .image(0, 0, "classic-contact")
              .setDisplaySize(38, 16),
            bar: this.add.graphics(),
          };
          this.views.set(actor.id, view);
        }
        const at = act1Project(actor.controller.walker.position, variant),
          pose = animation(actor),
          frame = frames.get(pose.name);
        if (!frame) throw Error(`Missing classic actor frame ${pose.name}`);
        view.sprite
          .setTexture(`classic-${pose.kind}`, pose.name)
          .setPosition(at.x, at.y)
          .setDepth(at.y + (actor.id === 0 ? 0.01 : 0));
        const fallen = pose.clip === "death" && pose.frame >= 9;
        const [minX, , maxX, maxY] = frame.alphaBounds;
        view.shadow
          .setPosition(
            at.x + (fallen ? (minX! + maxX!) / 2 - frame.root[0]! : 0),
            at.y + (fallen ? maxY! - frame.root[1]! - 4 : 2),
          )
          .setDisplaySize(
            fallen ? Math.max(38, (maxX! - minX!) * 0.8) : 38,
            fallen ? 24 : 16,
          )
          .setDepth(at.y - 1)
          .setAlpha(fallen ? 0.7 : 1);
        view.bar.clear().setDepth(at.y + 1);
        if (actor.id !== 0 && actor.hp > 0)
          view.bar
            .fillStyle(0x171610)
            .fillRect(at.x - 18, at.y - 98, 36, 4)
            .fillStyle(0xb6825b)
            .fillRect(at.x - 18, at.y - 98, (36 * actor.hp) / actor.maxHp, 3);
      }
      const clearing = ACT1_CLEARINGS.find(
        (c) =>
          ((player.controller.walker.position.x - c.x) / c.rx) ** 2 +
            ((player.controller.walker.position.y - c.y) / c.ry) ** 2 <
          1,
      );
      document.querySelector("#act1-place")!.textContent =
        clearing?.name ?? "The old pilgrim road";
      document.querySelector("#act1-status")!.textContent =
        player.hp <= 0
          ? "Fallen · Return to march to restart"
          : `Health ${Math.ceil(player.hp)} / ${player.maxHp} · ${player.controller.walker.gait === "run" ? "Running" : "Walking"} · ${encounter.combat.actors.filter((a) => a.id !== 0 && a.hp > 0).length} foes in the eastern clearing`;
      window.hollowbaneClassic = {
        position: { ...player.controller.walker.position },
        tick: encounter.combat.tick,
        variant,
        camera,
        moving: player.controller.walker.walking,
        hp: player.hp,
        actors: encounter.combat.actors.map((a) => ({
          id: a.id,
          position: { ...a.controller.walker.position },
          hp: a.hp,
          phase: a.controller.timeline.phase,
          ...animation(a),
        })),
        seenFrames: [...seenFrames],
        environment: this.environment,
        textures: this.textures.getTextureKeys().length,
      };
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    width: innerWidth,
    height: innerHeight,
    backgroundColor: "#131a16",
    scene: Act1,
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE },
    render: { antialias: true, antialiasGL: true, roundPixels: true },
  });
}
