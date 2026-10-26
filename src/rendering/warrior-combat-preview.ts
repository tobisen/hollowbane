import Phaser from "phaser";
import attacks from "../../public/dev/warrior-combat/warrior.json";
import movement from "../../public/dev/warrior-movement/warrior.json";
import {
  createCombat,
  applyCombatHit,
  ARENA_NAV,
  stepCombat,
  type CombatWorld,
} from "../simulation/combat";
import { commandCombat } from "../simulation/combat-targeting";
import { movementFrame } from "../simulation/locomotion";
import { screenToWorld, worldToScreen } from "../world/isometric";
import { warriorAttackFrame, type WarriorAttack } from "./warrior-attack-frame";
import {
  warriorAbilityFrame,
  type WarriorAbility,
} from "./warrior-ability-frame";
import {
  observeWarriorHit,
  warriorHitFrame,
  type WarriorHitCue,
} from "./warrior-hit-frame";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
  type SkillRuntime,
} from "../simulation/skills";
import { createMonsterExperience } from "../simulation/monster-experience";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
import {
  allocateSkillRanks,
  createSkillProgression,
} from "../simulation/skill-progression";
import { combatPose, recordMotion, type MotionCues } from "./combat-motion";
import "./warrior-pilot.css";
import "./warrior-cadence.css";

interface AttackSample {
  tick: number;
  phase: string;
  frame: number | null;
  sequence: number;
  strike: boolean;
  hp: number;
  ability: WarriorAbility | null;
  mana: number | null;
  effects: number;
  playerHp: number;
  hitFrame: number | null;
  remaining: number;
}
declare global {
  interface Window {
    hollowbaneWarriorCombat?: {
      attack: WarriorAttack;
      source: string;
      sample: AttackSample;
      history: AttackSample[];
      direction: number;
      playing: boolean;
      rate: number;
      cameraRelative: { x: number; y: number };
      renderFrames: number;
    };
  }
}

/** Disposable combat fixture: no inventory, storage, normal scene or input owner. */
export async function startWarriorCombatPreview(
  multiDirection = false,
  abilities = false,
  reactions = false,
): Promise<void> {
  if (abilities && !multiDirection)
    throw Error("Ability review requires the directional preview");
  const abilityManifest = abilities
    ? (await import("../../public/dev/warrior-abilities/warrior.json")).default
    : null;
  const reactionManifest = reactions
    ? (await import("../../public/dev/warrior-reactions/warrior.json")).default
    : null;
  const directional = multiDirection
    ? (await import("../../public/dev/warrior-attack-directions/warrior.json"))
        .default
    : null;
  const directionalMovement = multiDirection
    ? (await import("../../public/dev/warrior-directions/warrior.json")).default
    : null;
  const directionRows = ["s", "sw", "w", "nw", "n", "ne", "e", "se"] as const;
  type Direction = (typeof directionRows)[number];
  const cell = multiDirection ? 320 : 256;
  const pivot = multiDirection ? [160, 274] : [128, 210];
  const root = document.querySelector("main")!;
  root.className = "warrior-pilot warrior-cadence";
  document.title = "Hollowbane · Southeast Warrior attack review";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / CHECKPOINT A / SOUTHEAST</p><h1>Warrior · sword attacks</h1><p>One original rig. Two attacks. Real combat ticks and strike events.</p><a href="?developer=1&warriorPilot=1&warriorDirections=1">Movement showcase</a> · <a href="./">Return to Hollowbane</a></header>
  <section class="pilot-controls" aria-label="Attack controls">
  <label>Attack <select id="attack-clip"><option>primary</option><option>secondary</option></select></label>
  <button id="attack-start">Attack once</button><button id="attack-reset">Reset encounter</button>
  <button id="attack-pause" aria-pressed="false">Pause</button><button id="attack-step">Next combat tick</button>
  <label>Playback <select id="attack-rate"><option value="1">1× real time</option><option value="0.25">0.25× inspection</option></select></label>
  <label><input id="attack-repeat" type="checkbox"> Replay after recovery</label>
  <label>Background <select id="attack-background"><option>dark</option><option>light</option></select></label>
  <label><input id="attack-guides" type="checkbox" checked> Root / feet</label></section>
  <section class="pilot-comparison cadence-clips"><figure><canvas id="attack-gameplay" width="256" height="256"></canvas><figcaption>Candidate · 1× gameplay scale</figcaption></figure>
  <figure><canvas id="attack-shipped" width="256" height="256"></canvas><figcaption>Shipped · same combat state</figcaption></figure></section>
  <section class="cadence-inspection"><canvas id="cadence-inspector" width="256" height="256" aria-label="Enlarged attack inspection"></canvas><output id="attack-status"></output></section>
  <section class="pilot-runtime"><h2>Phaser 4.2.1 · disposable encounter</h2><div class="pilot-controls"><label>Sprite <select id="attack-source"><option value="candidate">Candidate</option><option value="shipped">Shipped baseline</option></select></label><label>Camera <select id="attack-zoom"><option>1</option><option>2</option></select></label></div><div id="pilot-stage" tabindex="0" role="application" aria-label="Southeast attack preview"></div></section>
  <p class="pilot-note">Primary / secondary choose visual variants of the existing melee action. Damage, 12/2/18 tick timing and recovery rules are unchanged. Playback rate slows this isolated inspection clock only. Replay resets the disposable encounter; no saves are opened. Southeast only; no mirroring or live activation.</p>`;
  const el = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const state = {
    attack: "primary" as WarriorAttack,
    ability: "iron-fan" as WarriorAbility,
    direction: "se" as Direction,
    playing: true,
    rate: 1,
    repeat: false,
    light: false,
    guides: true,
    source: "candidate",
    zoom: 1,
  };
  if (multiDirection) {
    root.classList.add("warrior-attack-directions");
    document.title = "Hollowbane · eight-direction Warrior attack review";
    root.querySelector(".eyebrow")!.textContent =
      "HOLLOWBANE / RELEASE A CANDIDATE / EIGHT DIRECTIONS";
    root.querySelector(".pilot-note")!.textContent =
      "Eight original rig views; no mirroring. Primary / secondary are visual variants of the same real melee action. Timing, damage and saves are unchanged. Fixed overscan preserves model scale; approved Southeast and idle endpoint pixels are reused. Developer candidate; review pending.";
    const label = document.createElement("label");
    label.innerHTML = `Direction <select id="attack-direction">${directionRows.map((d) => `<option value="${d}" ${d === "se" ? "selected" : ""}>${d.toUpperCase()}</option>`).join("")}</select>`;
    root.querySelector(".pilot-controls")!.prepend(label);
    el("pilot-stage").setAttribute(
      "aria-label",
      "Eight-direction attack preview",
    );
    for (const id of [
      "attack-gameplay",
      "attack-shipped",
      "cadence-inspector",
    ]) {
      const canvas = el<HTMLCanvasElement>(id);
      canvas.width = canvas.height = cell;
    }
  }
  if (abilities) {
    document.title = "Hollowbane · Warrior ability review";
    root.querySelector(".eyebrow")!.textContent =
      "HOLLOWBANE / RELEASE B CANDIDATE / EXISTING WARRIOR ABILITIES";
    root.querySelector("h1")!.textContent =
      "Warrior · Sundering Fan / Oath Echo";
    el<HTMLSelectElement>("attack-clip").innerHTML =
      '<option value="iron-fan">Sundering Fan</option><option value="oath-echo">Oath Echo</option>';
    el("attack-start").textContent = "Activate once";
    el("attack-clip").parentElement!.firstChild!.textContent = "Ability ";
    root.querySelector("header p:not(.eyebrow)")!.textContent =
      "Two existing abilities. Real activation, resource and cooldown rules.";
    root.querySelector(".pilot-note")!.textContent =
      "Existing Warrior abilities run on a seeded disposable class fixture. Sundering Fan uses the real melee strike; Oath Echo uses the real power effect and resource/cooldown rules. Animations only read these timelines. No saves or live graphics are changed. Hit/death and playable arena integration remain pending.";
  }
  if (reactions) {
    const controls = root.querySelector(".pilot-controls")!;
    for (const [id, label] of [
      ["hit-receive", "Receive stagger hit"],
      ["hit-small", "Receive small hit"],
    ] as const) {
      const button = document.createElement("button");
      button.id = id;
      button.textContent = label;
      controls.append(button);
    }
    root.querySelector(".pilot-note")!.textContent +=
      " Diagnostic hits use real damage/guard rules on this disposable fixture. One six-pose hitstun reaction; no new heavy-stun mechanic. Death animation remains pending.";
  }
  const images = {
    attacks: new Image(),
    idle: new Image(),
    shipped: new Image(),
  };
  images.attacks.src = `${import.meta.env.BASE_URL}dev/${abilities ? "warrior-abilities/se.png" : multiDirection ? "warrior-attack-directions/se.png" : "warrior-combat/warrior.png"}`;
  images.idle.src = `${import.meta.env.BASE_URL}dev/${multiDirection ? "warrior-directions/se.png" : "warrior-movement/warrior.png"}`;
  images.shipped.src = `${import.meta.env.BASE_URL}assets/wanderer.webp`;
  await Promise.all(Object.values(images).map((i) => i.decode()));
  const attackImages: Partial<Record<Direction, HTMLImageElement>> = {};
  const idleImages: Partial<Record<Direction, HTMLImageElement>> = {};
  const hitImages: Partial<Record<Direction, HTMLImageElement>> = {};
  if (directional && directionalMovement)
    await Promise.all(
      directionRows.map(async (direction) => {
        const attackImage = direction === "se" ? images.attacks : new Image(),
          idleImage = direction === "se" ? images.idle : new Image();
        attackImage.src = `${import.meta.env.BASE_URL}dev/${abilities ? "warrior-abilities" : "warrior-attack-directions"}/${(abilityManifest ?? directional).views[direction].atlas}`;
        idleImage.src = `${import.meta.env.BASE_URL}dev/warrior-directions/${directionalMovement.views[direction].atlas}`;
        await Promise.all([attackImage.decode(), idleImage.decode()]);
        attackImages[direction] = attackImage;
        idleImages[direction] = idleImage;
      }),
    );
  if (reactionManifest)
    await Promise.all(
      directionRows.map(async (direction) => {
        const image = new Image();
        image.src = `${import.meta.env.BASE_URL}dev/warrior-reactions/${reactionManifest.views[direction].atlas}`;
        await image.decode();
        hitImages[direction] = image;
      }),
    );
  let skills: SkillRuntime | null = null;
  const encounter = (): CombatWorld => {
    const world = createCombat(42);
    world.hostilesActive = false;
    world.actors = world.actors.slice(0, 2);
    const player = world.actors[0]!,
      target = world.actors[1]!;
    const facing = directional?.views[state.direction].facing ?? [2, 1];
    const offset = screenToWorld({ x: facing[0]!, y: facing[1]! });
    const length = Math.hypot(offset.x, offset.y);
    target.controller.walker.position = {
      x: player.controller.walker.position.x + (0.8 * offset.x) / length,
      y: player.controller.walker.position.y + (0.8 * offset.y) / length,
    };
    player.controller.walker.direction = directionRows.indexOf(state.direction);
    if (abilities) {
      world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
      world.experience.skills = allocateSkillRanks(
        createSkillProgression("warrior", 12),
        12,
        { "warrior-arms-foundation": 1, "warrior-resolve-foundation": 1 },
      );
      skills = createSkills(world);
    }
    return world;
  };
  let world = encounter(),
    cues: MotionCues = {},
    history: AttackSample[] = [],
    hitCue: WarriorHitCue | null = null,
    incoming: "hit" | "small" | null = null;
  let idleTicks = 0,
    accumulator = 0,
    stepping = false;
  const sample = (): AttackSample => {
    const actor = world.actors[0]!,
      timeline = actor.controller.timeline;
    return {
      tick: world.tick,
      phase: timeline.phase,
      frame: skills
        ? (() => {
            const pose = warriorAbilityFrame(timeline, skills.users[0]!.cast);
            return pose
              ? abilityManifest!.clips[pose.ability].start + pose.frame
              : null;
          })()
        : warriorAttackFrame(timeline, state.attack),
      sequence: timeline.sequence,
      strike: world.events.some(
        (e) =>
          e.tick === world.tick &&
          e.kind === "phase" &&
          e.actor === 0 &&
          e.phase === "active",
      ),
      hp: world.actors[1]!.hp,
      ability: skills ? state.ability : null,
      mana: skills?.users[0]!.mana ?? null,
      effects:
        skills?.events.filter((e) => e.kind === "effect" && e.actor === 0)
          .length ?? 0,
      playerHp: actor.hp,
      hitFrame: reactions ? warriorHitFrame(timeline, hitCue) : null,
      remaining: timeline.remaining,
    };
  };
  const reset = () => {
    world = encounter();
    cues = {};
    history = [];
    idleTicks = 0;
    accumulator = 0;
    hitCue = null;
    incoming = null;
  };
  const attack = () => {
    const player = world.actors[0]!;
    if (
      player.controller.timeline.phase !== "idle" ||
      player.controller.queuedAttack ||
      skills?.pending.some((p) => p.actor === 0) ||
      world.actors[1]!.hp <= 0
    )
      return;
    if (skills) {
      const p = player.controller.walker.position,
        target = world.actors[1]!.controller.walker.position;
      requestSkill(skills, {
        actor: 0,
        skill: state.ability,
        target: state.ability === "iron-fan" ? 1 : null,
        direction: { x: target.x - p.x, y: target.y - p.y },
      });
      return;
    }
    player.controller = commandCombat(player.controller, {
      kind: "attack",
      target: 1,
      repeat: false,
    });
  };
  const tick = () => {
    if (
      state.repeat &&
      world.actors[0]!.controller.timeline.phase === "idle" &&
      ++idleTicks >= 30
    ) {
      reset();
      attack();
    }
    if (incoming) {
      applyCombatHit(world, world.actors[1]!, world.actors[0]!, ARENA_NAV, {
        damage: incoming === "hit" ? 10 : 1,
        element: "physical",
        guaranteed: true,
        stagger: incoming === "hit",
      });
      incoming = null;
    }
    if (skills) stepSkillCombat(skills);
    else stepCombat(world);
    hitCue = observeWarriorHit(hitCue, world.actors[0]!.controller.timeline);
    recordMotion(cues, world.actors, world.events, world.tick);
    if (world.actors[0]!.controller.timeline.phase !== "idle") idleTicks = 0;
    history.push(sample());
    if (history.length > 256) history.shift();
  };
  if (reactions) {
    el("hit-receive").onclick = () => {
      incoming = "hit";
    };
    el("hit-small").onclick = () => {
      incoming = "small";
    };
  }
  if (multiDirection)
    el<HTMLSelectElement>("attack-direction").onchange = (e) => {
      state.direction = (e.target as HTMLSelectElement).value as Direction;
      reset();
    };
  el<HTMLSelectElement>("attack-clip").onchange = (e) => {
    if (abilities)
      state.ability = (e.target as HTMLSelectElement).value as WarriorAbility;
    else state.attack = (e.target as HTMLSelectElement).value as WarriorAttack;
    reset();
  };
  el("attack-start").onclick = attack;
  el("attack-reset").onclick = reset;
  const pause = (playing: boolean) => {
    state.playing = playing;
    accumulator = 0;
    el("attack-pause").textContent = playing ? "Pause" : "Play";
    el("attack-pause").setAttribute("aria-pressed", String(!playing));
  };
  el("attack-pause").onclick = () => pause(!state.playing);
  el("attack-step").onclick = () => {
    pause(false);
    stepping = true;
  };
  el<HTMLSelectElement>("attack-rate").onchange = (e) => {
    state.rate = Number((e.target as HTMLSelectElement).value);
  };
  el<HTMLInputElement>("attack-repeat").onchange = (e) => {
    state.repeat = (e.target as HTMLInputElement).checked;
  };
  el<HTMLSelectElement>("attack-background").onchange = (e) => {
    state.light = (e.target as HTMLSelectElement).value === "light";
  };
  el<HTMLInputElement>("attack-guides").onchange = (e) => {
    state.guides = (e.target as HTMLInputElement).checked;
  };
  el<HTMLSelectElement>("attack-source").onchange = (e) => {
    state.source = (e.target as HTMLSelectElement).value;
  };
  el<HTMLSelectElement>("attack-zoom").onchange = (e) => {
    state.zoom = Number((e.target as HTMLSelectElement).value);
  };
  const paint = (id: string, shipped = false) => {
    const canvas = el<HTMLCanvasElement>(id),
      c = canvas.getContext("2d")!;
    const actor = world.actors[0]!,
      current = sample(),
      frame = current.frame;
    c.fillStyle = state.light ? "#e4e0d8" : "#171c22";
    c.fillRect(0, 0, cell, cell);
    if (shipped) {
      const pose = combatPose(actor, cues[0], world.tick),
        f = movementFrame(actor.controller.walker, false);
      c.save();
      c.translate(pivot[0]! + pose.x * 2, pivot[1]! + pose.y * 2);
      c.rotate((pose.angle * Math.PI) / 180);
      c.drawImage(
        images.shipped,
        (f % 8) * 128,
        Math.floor(f / 8) * 128,
        128,
        128,
        -119,
        -208,
        238,
        238 * pose.scaleY,
      );
      c.restore();
    } else {
      const hitFrame = current.hitFrame;
      const f =
        hitFrame !== null
          ? reactionManifest!.views[state.direction].frames[hitFrame]!
          : frame === null
            ? (directionalMovement?.views[state.direction].frames ??
                movement.frames)[Math.floor(world.tick / 24) % 8]!
            : ((abilityManifest ?? directional)?.views[state.direction]
                .frames ?? attacks.frames)[frame]!;
      const idle = frame === null && hitFrame === null;
      c.drawImage(
        hitFrame !== null
          ? hitImages[state.direction]!
          : multiDirection
            ? idle
              ? idleImages[state.direction]!
              : attackImages[state.direction]!
            : idle
              ? images.idle
              : images.attacks,
        f.x,
        f.y,
        f.width,
        f.height,
        multiDirection && idle ? 32 : 0,
        multiDirection && idle ? 64 : 0,
        f.width,
        f.height,
      );
    }
    if (state.guides) {
      c.strokeStyle = "#e7bd69";
      c.beginPath();
      c.moveTo(pivot[0]! - 10, pivot[1]!);
      c.lineTo(pivot[0]! + 10, pivot[1]!);
      c.moveTo(pivot[0]!, pivot[1]! - 10);
      c.lineTo(pivot[0]!, pivot[1]! + 10);
      c.stroke();
      if (!shipped)
        for (const foot of (directionalMovement?.views[state.direction]
          .frames[0] ?? movement.frames[0])!.contacts) {
          c.strokeStyle = "#7ee9c3";
          c.beginPath();
          c.arc(
            foot.pixel[0]! + (multiDirection ? 32 : 0),
            foot.pixel[1]! + (multiDirection ? 64 : 0),
            3,
            0,
            Math.PI * 2,
          );
          c.stroke();
        }
    }
  };
  class Preview extends Phaser.Scene {
    private sprite!: Phaser.GameObjects.Sprite;
    private graphics!: Phaser.GameObjects.Graphics;
    private frames = 0;
    preload(): void {
      if (multiDirection)
        for (const direction of directionRows) {
          this.load.spritesheet(
            `attacks-${direction}`,
            attackImages[direction]!.src,
            { frameWidth: 320, frameHeight: 320 },
          );
          this.load.spritesheet(
            `idle-${direction}`,
            idleImages[direction]!.src,
            { frameWidth: 256, frameHeight: 264 },
          );
        }
      if (reactionManifest)
        for (const direction of directionRows)
          this.load.spritesheet(`hit-${direction}`, hitImages[direction]!.src, {
            frameWidth: 320,
            frameHeight: 320,
          });
      if (!multiDirection) {
        this.load.spritesheet("attacks", images.attacks.src, {
          frameWidth: 256,
          frameHeight: 256,
        });
        this.load.spritesheet("idle", images.idle.src, {
          frameWidth: 256,
          frameHeight: 256,
        });
      }
      this.load.spritesheet("shipped", images.shipped.src, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
    create(): void {
      const p = worldToScreen(world.actors[0]!.controller.walker.position);
      this.add.ellipse(p.x, p.y, 28, 12, 0x000000, 0.35);
      this.sprite = this.add.sprite(0, 0, "idle", 0);
      this.graphics = this.add.graphics();
      document.documentElement.dataset.warriorCombatReady = "true";
    }
    update(_time: number, delta: number): void {
      if (state.playing)
        accumulator += Math.min(delta / 1000, 0.1) * state.rate;
      while (accumulator >= 1 / 60) {
        tick();
        accumulator -= 1 / 60;
      }
      if (stepping) {
        tick();
        stepping = false;
      }
      const actor = world.actors[0]!,
        current = sample(),
        candidate = state.source === "candidate";
      const pose = combatPose(actor, cues[0], world.tick);
      const p = worldToScreen(actor.controller.walker.position);
      const hit = current.hitFrame !== null;
      const f = current.hitFrame ?? current.frame;
      this.sprite
        .setTexture(
          candidate
            ? `${hit ? "hit" : f === null ? "idle" : "attacks"}${multiDirection ? `-${state.direction}` : ""}`
            : "shipped",
          candidate
            ? (f ?? Math.floor(world.tick / 24) % 8)
            : movementFrame(actor.controller.walker, false),
        )
        .setOrigin(
          0.5,
          candidate
            ? multiDirection
              ? f === null
                ? 210 / 264
                : 274 / 320
              : 210 / 256
            : 112 / 128,
        )
        .setScale(candidate ? 0.5 : 0.93)
        .setPosition(
          p.x + (candidate ? 0 : pose.x),
          p.y + (candidate ? 0 : pose.y),
        )
        .setAngle(candidate ? 0 : pose.angle);
      this.cameras.main.setZoom(state.zoom).centerOn(p.x, p.y - 30);
      this.graphics.clear().lineStyle(1, 0xe7bd69);
      if (state.guides)
        this.graphics
          .lineBetween(p.x - 8, p.y, p.x + 8, p.y)
          .lineBetween(p.x, p.y - 8, p.x, p.y + 8);
      paint("attack-gameplay");
      paint("cadence-inspector");
      paint("attack-shipped", true);
      el("attack-status").textContent =
        `${(abilities ? state.ability : state.attack).toUpperCase()} · ${state.direction.toUpperCase()}\nTick ${world.tick} · ${current.phase} · pose ${f ?? "idle"}\nSequence ${current.sequence} · target HP ${current.hp}\n${abilities ? `Mana ${current.mana?.toFixed(1)} · effects ${current.effects}` : `Impact pose ${state.attack === "primary" ? 5 : 17}`} · ${state.rate}×`;
      if (reactions)
        el("attack-status").textContent +=
          ` · player HP ${current.playerHp} · recovery ${current.remaining}`;
      el<HTMLButtonElement>("attack-start").disabled =
        actor.controller.timeline.phase !== "idle" ||
        actor.controller.queuedAttack ||
        !!skills?.pending.some((p) => p.actor === 0) ||
        world.actors[1]!.hp <= 0;
      window.hollowbaneWarriorCombat = {
        attack: state.attack,
        source: state.source,
        sample: current,
        history: [...history],
        direction: actor.controller.walker.direction,
        playing: state.playing,
        rate: state.rate,
        cameraRelative: {
          x: p.x - this.cameras.main.scrollX,
          y: p.y - this.cameras.main.scrollY,
        },
        renderFrames: ++this.frames,
      };
    }
  }
  new Phaser.Game({
    type: Phaser.WEBGL,
    parent: el("pilot-stage"),
    width: 960,
    height: 320,
    backgroundColor: "#20262a",
    scene: Preview,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
  });
}
