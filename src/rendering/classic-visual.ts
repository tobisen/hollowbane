import Phaser from "phaser";
import {
  ACT1_CLEARINGS,
  act1ReadabilityMap,
  createAct1Encounter,
  stepAct1Encounter,
} from "../simulation/act1-readability";
import { commandCombat } from "../simulation/combat-targeting";
import { movementFrame } from "../simulation/locomotion";
import { areaNavigation } from "../world/navigation";
import type { Point } from "../world/isometric";
import {
  act1Project,
  act1Unproject,
  type Act1Variant,
} from "../world/act1-view";
import { drawClassicEnvironment } from "./classic-environment";
import { combatPose, recordMotion, type MotionCues } from "./combat-motion";
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
      actors: { id: number; position: Point; hp: number; phase: string }[];
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
    <header class="act1-caption"><p>HOLLOWBANE · CLASSIC ENVIRONMENT · ACTOR PILOTS PENDING</p><h1 id="act1-place">Ashen March</h1><p id="act1-status"></p></header>
    <nav class="act1-compare" aria-label="Viewpoint comparison"><a href="?act1readability=1&amp;view=b">Variant B</a><span id="act1-view-label"></span></nav>
    <footer class="act1-controls"><span>WASD / arrows / left stick · Click to walk or attack · X / pad primary to attack · R to run · P to pause</span><div><button id="act1-reset">Return to march</button><button id="act1-meadow">Walk to clearing</button><button id="act1-shrine">Walk to shrine</button><button id="classic-edge">Woodland edge</button><a href="?world=1&amp;developer=1&amp;worldPeaceful=1&amp;worldArea=haunted-forest&amp;worldSeed=42&amp;quality=full">Current forest</a><a href="?d2slice=1">Dungeon study</a><a href="?">Menu</a></div></footer>`;
  document.title = "Hollowbane · Classic visual pilot";
  const variant: Act1Variant = "b";
  const map = act1ReadabilityMap(),
    nav = areaNavigation(map);
  let encounter = createAct1Encounter();
  let motion: MotionCues = {};
  class Act1 extends Phaser.Scene {
    private views = new Map<
      number,
      {
        sprite: Phaser.GameObjects.Sprite;
        shadow: Phaser.GameObjects.Ellipse;
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
      if (!this.textures.exists("act1-wanderer"))
        this.load.spritesheet(
          "act1-wanderer",
          import.meta.env.BASE_URL + "assets/wanderer.webp",
          { frameWidth: 128, frameHeight: 128 },
        );
    }
    create(): void {
      this.views.clear();
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
        "Environment checkpoint · G1 actors provisional";
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
              .sprite(0, 0, "act1-wanderer")
              .setOrigin(0.5, 112 / 128),
            shadow: this.add.ellipse(0, 0, 32, 12, 0x080a08, 0.65),
            bar: this.add.graphics(),
          };
          this.views.set(actor.id, view);
        }
        const at = act1Project(actor.controller.walker.position, variant),
          pose = combatPose(actor, motion[actor.id], encounter.combat.tick);
        view.sprite
          .setPosition(at.x + pose.x, at.y + pose.y)
          .setFrame(movementFrame(actor.controller.walker, false))
          .setScale(0.93, 0.93 * pose.scaleY)
          .setAngle(pose.angle)
          .setAlpha(pose.alpha)
          .setDepth(at.y + (actor.id === 0 ? 0.01 : 0));
        view.sprite.setTint(actor.id === 0 ? 0xffffff : 0xb28468);
        view.shadow
          .setPosition(at.x, at.y + 2)
          .setDepth(at.y - 1)
          .setAlpha(actor.hp > 0 ? 0.65 : 0.35);
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
        })),
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
