import { queueMonsterSkills } from "../simulation/monster-skills";
import { actionPrompt } from "../simulation/prompts";
import {
  createSkills,
  requestSkill,
  skillHooks,
  SKILLS,
  worldAim,
  groundAim,
} from "../simulation/skills";
import {
  SKILL_ACTIONS,
  SKILL_SLOTS,
  cycleSkill,
} from "../simulation/skill-input";
import {
  createEncounter,
  ENCOUNTER_NAV,
  finishEncounter,
  type Encounter,
} from "../simulation/encounter";
import { stepMonsterAI } from "../simulation/monster-ai";
import { MONSTER_PROFILES, type MonsterRole } from "../simulation/monsters";
import { controllerInput } from "./controller-input";
import { directionFor } from "../simulation/locomotion";
import { renderSize, shouldBalanceDetail } from "../world/render-size";
import Phaser from "phaser";
import {
  ARENA_NAV,
  createCombat,
  stepCombat,
  type CombatActor,
  type CombatEvent,
  type Weapon,
} from "../simulation/combat";
import { commandCombat, hoverTarget } from "../simulation/combat-targeting";
import { movementFrame } from "../simulation/locomotion";
import { fromGround, onGround } from "../world/navigation";
import { clientToGround } from "../world/view";
import type { Point } from "../world/isometric";
const percentile = (values: readonly number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0
  );
};
export interface CombatPresentation {
  tick: number;
  paused: boolean;
  hovered: number | null;
  actors: {
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    phase: string;
    remaining: number;
    sequence: number;
    direction: number;
    selected: number | null;
    locked: number | null;
    walking: boolean;
    windup: number;
    recovery: number;
  }[];
  projectiles: { x: number; y: number }[];
  events: CombatEvent[];
  view: { x: number; y: number; width: number; height: number };
  metrics: {
    frameP50: number;
    frameP95: number;
    simulationP95: number;
    renderP95: number;
    updateP95: number;
    attackLatencyP95: number;
    attackSamples: number;
    activeEntities: number;
    droppedTicks: number;
    renderWidth: number;
    renderHeight: number;
  };
}
declare global {
  interface Window {
    hollowbaneSkills?: {
      tick: number;
      users: import("../simulation/skills").SkillUser[];
      events: import("../simulation/skills").SkillEvent[];
      effects: import("../simulation/skill-effects").EffectEvent[];
      statuses: import("../simulation/skill-effects").Status[];
      bolts: number;
      selected: number;
      metrics: {
        skillCombatP95: number;
        inputP95: number;
        inputSamples: number;
      };
    };
    hollowbaneCombat?: CombatPresentation;
    hollowbaneAI?: {
      tick: number;
      enemies: (import("../simulation/monsters").MonsterBrain & {
        position: Point;
      })[];
      metrics: {
        aiP95: number;
        alive: number;
        corpses: number;
        pathRequests: number;
        decisions: number;
        spawned: number;
        despawned: number;
      };
    };
  }
}
export function startCombatArena(monsters = false): Phaser.Game {
  const query = new URLSearchParams(location.search);
  const skills = query.has("skills");
  const requested = Number(query.get("count") ?? 5);
  const initialCount = [5, 10, 20, 30].includes(requested) ? requested : 5;
  const nav = monsters ? ENCOUNTER_NAV : ARENA_NAV;
  const root = document.querySelector("main")!;
  root.className = "combat-arena";
  root.innerHTML = `<div id="combat-world" tabindex="0" role="application" aria-label="Combat arena. Click targets to attack, hold to repeat. Click ground or WASD to move. Space stops queued actions."></div><header class="arena-header"><p>HOLLOWBANE / PHASE III</p><h1>The Ashwood Trial</h1><a href="./">Return to the cloister</a></header><aside class="arena-panel"><h2>Combat laboratory</h2><label>Weapon <select id="combat-weapon"><option value="melee">Melee blade</option><option value="projectile">Training bolt</option></select></label><label>Attack speed <select id="combat-speed"><option value="0">+0</option><option value="20">+20</option><option value="50">+50</option><option value="90">+90</option></select></label><label>Hit recovery <select id="combat-recovery"><option value="0">+0</option><option value="25">+25</option><option value="60">+60</option></select></label><label>Hostile sentinel <input id="combat-hostile" type="checkbox" checked></label><label>Impact sound <input id="combat-sound" type="checkbox" checked></label><button id="combat-reset">Reset trial</button><button id="combat-pause" aria-pressed="false">Pause</button><output id="combat-diagnostics" aria-live="off">Preparing trial…</output></aside><footer class="arena-footer"><strong>CLICK TARGET · HOLD TO REPEAT</strong> / CLICK GROUND OR WASD TO MOVE / SPACE TO STOP<br>Movement waits for attack recovery. Bolts can miss moving targets. Reset restores the same seed.<div id="combat-log" role="status">Select a target to begin.</div></footer>`;
  document.title = "Hollowbane · The Ashwood Trial";
  if (monsters) {
    root.classList.add("monster-arena");
    document.title = "Hollowbane · The Cinder Watch";
    root.querySelector(".arena-header p")!.textContent =
      "HOLLOWBANE / PHASE IV";
    root.querySelector("h1")!.textContent = "The Cinder Watch";
    root.querySelector(".arena-panel h2")!.textContent = "Monster encounters";
    root.querySelector("label:has(#combat-hostile)")!.firstChild!.textContent =
      "Monster AI ";
    root
      .querySelector(".arena-panel h2")!
      .insertAdjacentHTML(
        "afterend",
        `<label>Enemies <select id="ai-count">${[5, 10, 20, 30].map((n) => `<option ${n === initialCount ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>AI navigation overlay <input id="ai-debug" type="checkbox"></label><label>Immortal test player <input id="ai-practice" type="checkbox"></label>`,
      );
  }
  if (skills) {
    root.classList.add("skill-arena");
    root.querySelector(".arena-header p")!.textContent = "HOLLOWBANE / SKILLS";
    root.querySelector("h1")!.textContent = "The Kindled Circle";
    document.title = "Hollowbane · The Kindled Circle";
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="skill-bar" aria-label="Abilities"><p id="skill-resource">Mana 100 / 100</p><div>${SKILL_SLOTS.map((id, i) => `<button type="button" data-skill="${i}" aria-pressed="${i === 0}">${SKILLS.find((s) => s.id === id)!.name}</button>`).join("")}</div><p id="skill-prompts">X / Q / 1–4: cast · Right click: selected skill · Left click: attack / move</p><p id="skill-status" role="status">Select a skill. Aim with mouse or right stick.</p></section>`,
    );
  }
  const field = document.querySelector<HTMLElement>("#combat-world")!;
  const weapon = document.querySelector<HTMLSelectElement>("#combat-weapon")!;
  const speed = document.querySelector<HTMLSelectElement>("#combat-speed")!;
  const recovery =
    document.querySelector<HTMLSelectElement>("#combat-recovery")!;
  const hostile = document.querySelector<HTMLInputElement>("#combat-hostile")!;
  const sound = document.querySelector<HTMLInputElement>("#combat-sound")!;
  class Arena extends Phaser.Scene {
    private encounter: Encounter | null = monsters
      ? createEncounter(initialCount)
      : null;
    private world = this.encounter?.combat ?? createCombat();
    private abilities = skills ? createSkills(this.world) : null;
    private selectedSkill = 0;
    private mouseGround: Point = { x: 790, y: 560 };
    private skillCosts: number[] = [];
    private skillLatencies: number[] = [];
    private skillInputAt: number | null = null;
    private aiCosts: number[] = [];
    private accumulator = 0;
    private paused = monsters && query.has("paused");
    private sprites = new Map<number, Phaser.GameObjects.Sprite>();
    private labels = new Map<number, Phaser.GameObjects.Text>();
    private ink!: Phaser.GameObjects.Graphics;
    private effect!: Phaser.GameObjects.Graphics;
    private keys = new Set<string>();
    private hovered: number | null = null;
    private frames: number[] = [];
    private simulations: number[] = [];
    private renders: number[] = [];
    private updates: number[] = [];
    private latencies: number[] = [];
    private previousFrame = 0;
    private balancedDetail = false;
    private startedAt = 0;
    private syncResolution = (): void => {
      const size = renderSize(
        { x: innerWidth, y: innerHeight },
        this.balancedDetail,
      );
      this.scale.resize(size.x, size.y);
      this.cameras.main.setZoom(
        Math.min(innerWidth / 1280, innerHeight / 800) * size.ratio,
      );
      this.cameras.main.centerOn(768, 512);
    };
    private renderAt = 0;
    private inputAt: number | null = null;
    private padAttack = false;
    private droppedTicks = 0;
    private audio: AudioContext | null = null;
    private impactUntil = new Map<number, number>();
    private deathAt = new Map<number, number>();
    private numberUntil = new Map<
      number,
      { until: number; text: string; color: string }
    >();
    private record(values: number[], value: number): void {
      values.push(value);
      if (values.length > 300) values.shift();
    }
    preload(): void {
      const base = import.meta.env.BASE_URL + "assets/";
      this.load.image("arena-plate", base + "cloister.webp");
      this.load.spritesheet("arena-wanderer", base + "wanderer.webp", {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
    create(): void {
      controllerInput.movementKeys = new Set([
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);
      this.add
        .image(0, 0, "arena-plate")
        .setOrigin(0)
        .setAlpha(0.38)
        .setDepth(-1000);
      const floor = this.add.graphics().setDepth(-999);
      floor.fillStyle(0x18252c, 0.9).fillRect(230, 260, 1070, 570);
      floor.lineStyle(1, 0x617579, 0.14);
      for (let x = 230; x < 1300; x += 64) floor.lineBetween(x, 260, x, 830);
      for (let y = 260; y < 830; y += 32) floor.lineBetween(230, y, 1300, y);
      floor.lineStyle(2, 0xb19a62, 0.6).strokeRect(230, 260, 1070, 570);
      this.ink = this.add.graphics().setDepth(2000);
      this.effect = this.add.graphics().setDepth(2001);
      this.prepareBenchmark();
      this.syncActors();
      this.startedAt = performance.now();
      if (this.game.renderer.type === Phaser.WEBGL) {
        const gl = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer)
          .gl;
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        this.balancedDetail = debug
          ? /swiftshader|llvmpipe|software/i.test(
              String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)),
            )
          : false;
      } else this.balancedDetail = true;
      const resize = this.syncResolution;
      resize();
      window.addEventListener("resize", resize);
      const point = (event: PointerEvent): Point =>
        clientToGround(
          { x: event.clientX, y: event.clientY },
          this.game.canvas.getBoundingClientRect(),
          this.cameras.main.worldView,
        );
      const pick = (p: Point) =>
        hoverTarget(
          p,
          this.world.actors
            .filter((a) => a.id !== 0)
            .map((a) => ({
              id: a.id,
              position: a.controller.walker.position,
              alive: a.hp > 0,
            })),
          onGround,
        );
      const down = (event: PointerEvent) => {
        if (skills && event.button === 2 && !this.paused) {
          event.preventDefault();
          field.focus();
          this.mouseGround = point(event);
          this.hovered = pick(this.mouseGround);
          this.castSkill(this.selectedSkill);
          return;
        }
        if (event.button !== 0 || this.paused) return;
        event.preventDefault();
        field.focus();
        this.padAttack = false;
        const p = point(event),
          target = pick(p);
        this.inputAt = performance.now();
        const player = this.world.actors[0]!;
        player.controller = commandCombat(
          player.controller,
          target === null
            ? { kind: "move", target: fromGround(p) }
            : { kind: "attack", target, repeat: true },
        );
        field.setPointerCapture(event.pointerId);
        if (sound.checked) {
          this.audio ??= new AudioContext();
          void this.audio.resume();
        }
      };
      const move = (event: PointerEvent) => {
        this.mouseGround = point(event);
        this.hovered = pick(this.mouseGround);
        field.style.cursor = this.hovered === null ? "crosshair" : "pointer";
      };
      const release = () => {
        const p = this.world.actors[0]!;
        p.controller = commandCombat(p.controller, { kind: "release" });
      };
      const stop = () => {
        release();
        this.keys.clear();
        this.inputAt = null;
        this.skillInputAt = null;
        if (this.abilities) this.abilities.pending = [];
        const p = this.world.actors[0]!;
        p.controller = commandCombat(p.controller, { kind: "stop" });
        this.accumulator = 0;
      };
      const keydown = (event: KeyboardEvent) => {
        if (event.target !== field) return;
        if (
          [
            "w",
            "a",
            "s",
            "d",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            " ",
          ].includes(event.key)
        ) {
          event.preventDefault();
          if (event.key === " ") stop();
          else {
            this.keys.add(event.key.toLowerCase());
            release();
          }
        }
      };
      const keyup = (event: KeyboardEvent) =>
        this.keys.delete(event.key.toLowerCase());
      const context = (e: Event) => {
        if (skills) e.preventDefault();
      };
      field.addEventListener("contextmenu", context);
      field.addEventListener("pointerdown", down);
      if (skills)
        for (const button of Array.from(
          root.querySelectorAll<HTMLButtonElement>("[data-skill]"),
        ))
          button.onclick = () => {
            this.selectedSkill = Number(button.dataset.skill);
            field.focus();
          };
      field.addEventListener("pointermove", move);
      field.addEventListener("pointerup", release);
      field.addEventListener("pointercancel", release);
      field.addEventListener("lostpointercapture", release);
      field.addEventListener("blur", stop);
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      window.addEventListener("blur", stop);
      window.addEventListener("hollowbane-input-reset", stop);
      const visibility = () => {
        if (document.hidden) stop();
      };
      document.addEventListener("visibilitychange", visibility);
      document.querySelector<HTMLButtonElement>("#combat-reset")!.onclick =
        () => {
          stop();
          this.encounter = monsters
            ? createEncounter(
                Number(
                  document.querySelector<HTMLSelectElement>("#ai-count")!.value,
                ),
              )
            : null;
          this.world = this.encounter?.combat ?? createCombat();
          this.prepareBenchmark();
          this.abilities = skills ? createSkills(this.world) : null;
          this.skillCosts = [];
          this.skillLatencies = [];
          this.impactUntil.clear();
          this.numberUntil.clear();
          this.deathAt.clear();
          this.hovered = null;
          document.querySelector("#combat-log")!.textContent =
            "Select a target to begin.";
        };
      const count = document.querySelector<HTMLSelectElement>("#ai-count");
      if (count)
        count.onchange = () =>
          document.querySelector<HTMLButtonElement>("#combat-reset")!.click();
      const pause = document.querySelector<HTMLButtonElement>("#combat-pause")!;
      pause.textContent = this.paused ? "Resume" : "Pause";
      pause.setAttribute("aria-pressed", String(this.paused));
      pause.onclick = () => {
        stop();
        this.paused = !this.paused;
        pause.textContent = this.paused ? "Resume" : "Pause";
        pause.setAttribute("aria-pressed", String(this.paused));
      };
      hostile.onchange = () => {
        this.world.hostilesActive = !monsters && hostile.checked;
        if (!hostile.checked)
          for (const a of this.world.actors.filter((a) => a.kind === "hostile"))
            a.controller = commandCombat(a.controller, { kind: "stop" });
      };
      const preRender = () => {
        this.renderAt = performance.now();
      };
      const postRender = () => {
        this.record(this.renders, performance.now() - this.renderAt);
      };
      this.game.events.on(Phaser.Core.Events.PRE_RENDER, preRender);
      this.game.events.on(Phaser.Core.Events.POST_RENDER, postRender);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
        window.removeEventListener("blur", stop);
        window.removeEventListener("hollowbane-input-reset", stop);
        document.removeEventListener("visibilitychange", visibility);
        this.game.events.off(Phaser.Core.Events.PRE_RENDER, preRender);
        this.game.events.off(Phaser.Core.Events.POST_RENDER, postRender);
        field.removeEventListener("contextmenu", context);
        field.removeEventListener("pointerdown", down);
        field.removeEventListener("pointermove", move);
        field.removeEventListener("pointerup", release);
        field.removeEventListener("pointercancel", release);
        field.removeEventListener("lostpointercapture", release);
        field.removeEventListener("blur", stop);
        void this.audio?.close();
      });
      document.documentElement.dataset.combatReady = "true";
    }
    private prepareBenchmark(): void {
      if (!query.has("durable")) return;
      for (const a of this.world.actors)
        if (a.kind !== "player") a.hp = a.maxHp = 100000;
      document.querySelector(".arena-header p")!.textContent =
        "HOLLOWBANE / DURABLE TARGET BENCHMARK";
    }
    private castSkill(slot: number): void {
      if (!this.abilities || this.paused || controllerInput.blockGameplay)
        return;
      const a = this.world.actors[0]!,
        candidates = this.world.actors.filter((t) => t.hp > 0 && t.id !== 0),
        aim = controllerInput.frame.aim;
      const isMouse = controllerInput.frame.device === "mouse";
      const selected = candidates.find(
        (t) => t.id === (isMouse ? this.hovered : a.controller.selected),
      );
      const direction =
        Math.hypot(aim.x, aim.y) > 0.01
          ? worldAim(aim)
          : isMouse
            ? groundAim(
                a.controller.walker.position,
                selected?.controller.walker.position ??
                  fromGround(this.mouseGround),
              )
            : selected
              ? groundAim(
                  a.controller.walker.position,
                  selected.controller.walker.position,
                )
              : worldAim({
                  x: Math.cos(
                    ((a.controller.walker.direction + 2) * Math.PI) / 4,
                  ),
                  y: Math.sin(
                    ((a.controller.walker.direction + 2) * Math.PI) / 4,
                  ),
                });
      const d = Math.hypot(direction.x, direction.y);
      const target =
        selected ??
        [...candidates].sort((x, y) => {
          const score = (t: CombatActor) => {
            const p = t.controller.walker.position,
              o = a.controller.walker.position,
              dx = p.x - o.x,
              dy = p.y - o.y,
              n = Math.hypot(dx, dy);
            return (
              n +
              5 *
                (1 -
                  (dx * direction.x + dy * direction.y) / Math.max(1e-9, n * d))
            );
          };
          return score(x) - score(y) || x.id - y.id;
        })[0];
      requestSkill(this.abilities, {
        actor: 0,
        skill: SKILL_SLOTS[slot]!,
        target: target?.id ?? null,
        direction,
      });
      this.selectedSkill = slot;
      this.skillInputAt = performance.now();
    }
    private syncActors(): void {
      const ids = new Set(this.world.actors.map((a) => a.id));
      for (const [id, sprite] of this.sprites)
        if (!ids.has(id)) {
          sprite.destroy();
          this.sprites.delete(id);
          this.labels.get(id)?.destroy();
          this.labels.delete(id);
          this.impactUntil.delete(id);
          this.numberUntil.delete(id);
          this.deathAt.delete(id);
        }
      for (const actor of this.world.actors) {
        if (this.sprites.has(actor.id)) continue;
        const sprite = this.add
          .sprite(0, 0, "arena-wanderer", 0)
          .setOrigin(0.5, 112 / 128)
          .setScale(0.93);
        if (actor.kind === "hostile") sprite.setTint(0xd9a484);
        if (actor.kind === "dummy" || actor.kind === "moving")
          sprite.setVisible(false);
        this.sprites.set(actor.id, sprite);
        this.labels.set(
          actor.id,
          this.add
            .text(0, 0, "", {
              fontFamily: "Georgia",
              fontSize: "12px",
              color: "#d3c7ac",
              align: "center",
            })
            .setOrigin(0.5, 0)
            .setDepth(2002),
        );
      }
    }
    private feedback(event: CombatEvent): void {
      if (event.kind === "damage") {
        const text =
          event.result.outcome === "miss"
            ? "MISS"
            : `${event.result.critical ? "✦ " : ""}${event.result.amount}`;
        this.numberUntil.set(event.target, {
          until: this.world.tick + 35,
          text,
          color: event.result.critical ? "#ffe2a0" : "#e8c5ab",
        });
        if (event.result.amount > 0) {
          this.impactUntil.set(event.target, this.world.tick + 6);
          this.tone();
        }
        document.querySelector("#combat-log")!.textContent =
          `${this.world.actors.find((a) => a.id === event.actor)?.name ?? "Departed actor"} → ${this.world.actors.find((a) => a.id === event.target)?.name ?? "Departed target"}: ${text}`;
      } else if (event.kind === "death") {
        this.deathAt.set(event.target, this.world.tick);
        document.querySelector("#combat-log")!.textContent =
          `${this.world.actors.find((a) => a.id === event.target)?.name ?? "Departed target"} has fallen. Reset the trial to restore all targets.`;
      }
    }
    private tone(): void {
      if (!sound.checked || !this.audio || this.audio.state !== "running")
        return;
      const osc = this.audio.createOscillator(),
        gain = this.audio.createGain(),
        now = this.audio.currentTime;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audio.destination);
      osc.start();
      osc.stop(now + 0.09);
    }
    private drawActor(a: CombatActor): void {
      const p = onGround(a.controller.walker.position),
        phase = a.controller.timeline.phase,
        dead = a.hp <= 0;
      const sprite = this.sprites.get(a.id)!,
        label = this.labels.get(a.id)!;
      const fall = dead
        ? Math.min(
            1,
            (this.world.tick - (this.deathAt.get(a.id) ?? this.world.tick)) /
              20,
          )
        : 0;
      const flash = (this.impactUntil.get(a.id) ?? 0) > this.world.tick;
      sprite
        .setPosition(p.x, p.y)
        .setDepth(p.y)
        .setFrame(movementFrame(a.controller.walker, false))
        .setAlpha(dead ? 1 - fall * 0.65 : 1);
      const time = a.controller.timeline;
      const progress =
        phase === "windup"
          ? 1 - time.remaining / time.timing.windup
          : phase === "recovery"
            ? time.remaining / time.timing.recovery
            : 0;
      sprite
        .setAngle(
          dead
            ? 82 * fall
            : phase === "hitstun"
              ? -12
              : phase === "active"
                ? 14
                : -progress * 9,
        )
        .setScale(0.93, dead ? 0.93 - fall * 0.43 : 0.93);
      const brain = this.encounter?.brains.find((b) => b.id === a.id);
      if (brain && !flash)
        sprite.setTint(
          brain.champion
            ? 0xf3cd73
            : (
                {
                  melee: 0xd9a484,
                  ranged: 0xa8bf9c,
                  caster: 0xb1a1d1,
                  support: 0x83b9c1,
                  flanker: 0xcc9ab5,
                  tank: 0xa9adb5,
                } satisfies Record<MonsterRole, number>
              )[brain.role],
        );
      if (flash) sprite.setTint(0xffd7a0);
      else {
        sprite.clearTint();
        if (a.kind === "hostile" && !brain) sprite.setTint(0xd9a484);
        if (brain)
          sprite.setTint(
            brain.champion
              ? 0xf3cd73
              : (
                  {
                    melee: 0xd9a484,
                    ranged: 0xa8bf9c,
                    caster: 0xb1a1d1,
                    support: 0x83b9c1,
                    flanker: 0xcc9ab5,
                    tank: 0xa9adb5,
                  } satisfies Record<MonsterRole, number>
                )[brain.role],
          );
      }
      this.ink.fillStyle(0x03070a, 0.5).fillEllipse(p.x, p.y + 3, 34, 12);
      const selected = this.world.actors[0]!.controller.selected === a.id;
      if (selected || this.hovered === a.id)
        this.ink
          .lineStyle(selected ? 2 : 1, selected ? 0xe6be6e : 0xdce9e8, 0.9)
          .strokeEllipse(p.x, p.y, 44, 22);
      if (a.kind === "dummy" || a.kind === "moving") {
        const lean = dead ? 35 * fall : phase === "hitstun" ? -8 : 0;
        this.ink
          .lineStyle(7, flash ? 0xffdfae : 0x9e8057, dead ? 0.4 : 1)
          .lineBetween(p.x, p.y, p.x + lean, p.y - (dead ? 8 : 52));
        this.ink
          .lineStyle(6, 0x9e8057, dead ? 0.4 : 1)
          .lineBetween(
            p.x - 16,
            p.y - 33 + (dead ? 25 : 0),
            p.x + 16,
            p.y - 33 + (dead ? 25 : 0),
          );
        this.ink
          .fillStyle(flash ? 0xffe5b0 : 0xb39c74, dead ? 0.3 : 1)
          .fillCircle(p.x + lean, p.y - (dead ? 10 : 53), 10);
      }
      if (!dead) {
        this.ink.fillStyle(0x060a0d, 1).fillRect(p.x - 24, p.y - 80, 48, 5);
        this.ink
          .fillStyle(a.id === 0 ? 0x99bb9b : 0xbf785e, 1)
          .fillRect(p.x - 24, p.y - 80, (48 * a.hp) / a.maxHp, 5);
      }
      const debug = Boolean(
        document.querySelector<HTMLInputElement>("#ai-debug")?.checked,
      );
      if (brain && debug && !dead) {
        const home = onGround(brain.home);
        this.ink
          .lineStyle(1, 0x8bb9ba, 0.22)
          .lineBetween(p.x, p.y, home.x, home.y)
          .strokeCircle(home.x, home.y, 4);
        let previous = p;
        for (const point of a.controller.walker.route) {
          const q = onGround(point);
          this.ink
            .lineStyle(1, 0xe8bc73, 0.6)
            .lineBetween(previous.x, previous.y, q.x, q.y);
          previous = q;
        }
        if (this.hovered === a.id || selected) {
          const radius = MONSTER_PROFILES[brain.role].detection;
          this.ink
            .lineStyle(1, 0x8bd0bf, 0.5)
            .strokeEllipse(p.x, p.y, 181 * radius, 90.5 * radius);
          if (brain.lastSeen) {
            const q = onGround(brain.lastSeen);
            this.ink
              .lineStyle(2, 0xd6a37b, 0.7)
              .lineBetween(p.x, p.y, q.x, q.y);
          }
        }
      }
      const number = this.numberUntil.get(a.id),
        numberText =
          number && number.until > this.world.tick ? `\n${number.text}` : "";
      label
        .setPosition(p.x, p.y + (a.id === 0 ? 34 : 14))
        .setText(
          `${brain ? `${brain.champion ? "★ " : ""}${brain.role}${debug && !dead ? `\n${brain.state}` : ""}` : a.name}${dead ? " · fallen" : ""}${numberText}`,
        )
        .setColor(numberText ? number!.color : "#c7bc9e");
      if (["windup", "active", "recovery"].includes(phase) && !dead) {
        const target = this.world.actors.find(
          (t) => t.id === a.controller.locked,
        );
        if (target) {
          const angle =
            Math.PI / 2 +
            ((a.controller.walker.direction + 2) * Math.PI) / 4 +
            (phase === "windup"
              ? -0.7 * progress
              : phase === "active"
                ? 0.4
                : -0.2);
          this.effect
            .lineStyle(
              phase === "active" ? 4 : 2,
              phase === "active" ? 0xffe3a2 : 0xb8bdc3,
              0.9,
            )
            .lineBetween(
              p.x + Math.cos(angle) * 12,
              p.y - 30 + Math.sin(angle) * 12,
              p.x + Math.cos(angle) * 44,
              p.y - 30 + Math.sin(angle) * 44,
            );
        }
      }
      if (flash)
        this.effect
          .lineStyle(2, 0xf3cf92, 0.8)
          .strokeCircle(
            p.x,
            p.y - 28,
            14 +
              (6 - ((this.impactUntil.get(a.id) ?? 0) - this.world.tick)) * 2,
          );
    }
    update(): void {
      const start = performance.now(),
        delta = this.previousFrame ? start - this.previousFrame : 1000 / 60;
      this.previousFrame = start;
      this.record(this.frames, delta);
      if (
        !this.balancedDetail &&
        this.game.loop.frame % 60 === 0 &&
        shouldBalanceDetail(this.frames, start - this.startedAt, false)
      ) {
        this.balancedDetail = true;
        this.syncResolution();
      }
      const player = this.world.actors[0]!;
      if (player.controller.timeline.phase === "idle") {
        player.weapon = weapon.value as Weapon;
        player.range = player.weapon === "melee" ? 1.05 : 6;
        player.attackSpeed = Number(speed.value);
        player.recoveryBonus = Number(recovery.value);
      }
      this.world.hostilesActive = !monsters && hostile.checked;
      const keys = {
        x:
          Number(this.keys.has("d") || this.keys.has("arrowright")) -
          Number(this.keys.has("a") || this.keys.has("arrowleft")),
        y:
          Number(this.keys.has("s") || this.keys.has("arrowdown")) -
          Number(this.keys.has("w") || this.keys.has("arrowup")),
      };
      const direct = controllerInput.movement(keys);
      if (controllerInput.frame.device !== "gamepad" && this.padAttack) {
        player.controller = commandCombat(player.controller, { kind: "stop" });
        this.padAttack = false;
      }
      if (
        controllerInput.frame.device !== "mouse" &&
        !controllerInput.blockGameplay
      ) {
        const candidates = this.world.actors.filter(
          (a) => a.id !== 0 && a.hp > 0,
        );
        if (controllerInput.take("targetLock")) {
          const i = candidates.findIndex(
            (a) => a.id === player.controller.selected,
          );
          player.controller = {
            ...player.controller,
            selected:
              candidates[(i + 1) % Math.max(1, candidates.length)]?.id ?? null,
          };
        }
        if (controllerInput.take("toggleRun"))
          player.controller.walker.gait =
            player.controller.walker.gait === "walk" ? "run" : "walk";
        if (!skills && controllerInput.take("primary")) {
          void controllerInput.vibrate();
          const aim = controllerInput.frame.aim,
            p = onGround(player.controller.walker.position);
          const chosen =
            candidates.find((a) => a.id === player.controller.selected) ??
            [...candidates].sort((a, b) => {
              const score = (a: CombatActor) => {
                const q = onGround(a.controller.walker.position),
                  dx = q.x - p.x,
                  dy = q.y - p.y,
                  d = Math.hypot(dx, dy);
                return (
                  d +
                  (Math.hypot(aim.x, aim.y) > 0.01
                    ? 200 *
                      (1 -
                        (dx * aim.x + dy * aim.y) /
                          Math.max(1, d * Math.hypot(aim.x, aim.y)))
                    : 0)
                );
              };
              return score(a) - score(b) || a.id - b.id;
            })[0];
          if (chosen) {
            this.padAttack = controllerInput.frame.device === "gamepad";
            player.controller = commandCombat(player.controller, {
              kind: "attack",
              target: chosen.id,
              repeat: true,
            });
            this.inputAt = performance.now();
          }
        }
        if (controllerInput.released("primary"))
          player.controller = commandCombat(player.controller, {
            kind: "release",
          });
        if (controllerInput.take("cancel"))
          player.controller = commandCombat(player.controller, {
            kind: "stop",
          });
        if (skills) {
          if (controllerInput.take("left"))
            this.selectedSkill = cycleSkill(this.selectedSkill, -1);
          if (controllerInput.take("right"))
            this.selectedSkill = cycleSkill(this.selectedSkill, 1);
          if (controllerInput.take("interact"))
            this.castSkill(this.selectedSkill);
          for (const [i, action] of SKILL_ACTIONS.entries())
            if (controllerInput.take(action)) this.castSkill(i);
        }
        for (const a of [
          "secondary",
          "skill1",
          "skill2",
          "skill3",
          "skill4",
          "interact",
          "pickup",
        ] as const)
          if (!skills && controllerInput.take(a))
            document.querySelector("#combat-log")!.textContent =
              `${a} is reserved; no new system is active.`;
      }
      if (controllerInput.blockGameplay) {
        this.accumulator = 0;
        player.controller = commandCombat(player.controller, { kind: "stop" });
      }
      if (!this.paused && !controllerInput.blockGameplay) {
        const capped = Math.min(delta, 100);
        this.droppedTicks += Math.max(
          0,
          Math.floor((delta - capped) / (1000 / 60)),
        );
        this.accumulator += capped;
        while (this.accumulator >= 1000 / 60) {
          const tickStart = performance.now(),
            oldSequence = player.controller.timeline.sequence;
          if (this.encounter) {
            const aiStart = performance.now();
            this.encounter.work = {
              ...(hostile.checked
                ? stepMonsterAI(this.world, this.encounter.brains, nav)
                : { decisions: 0, pathRequests: 0 }),
              separationCorrections: 0,
            };
            this.record(this.aiCosts, performance.now() - aiStart);
            if (
              document.querySelector<HTMLInputElement>("#ai-practice")!.checked
            )
              player.invulnerableUntil = this.world.tick + 2;
          }
          if (this.abilities && this.encounter && hostile.checked)
            queueMonsterSkills(this.abilities, this.encounter.brains, nav);
          const skillStart = performance.now();
          stepCombat(
            this.world,
            nav,
            direct.vector,
            direct.scale,
            this.abilities ? skillHooks(this.abilities, nav) : {},
          );
          if (this.abilities) {
            this.record(this.skillCosts, performance.now() - skillStart);
            const recent = this.abilities.events.filter(
              (e) => e.tick === this.world.tick && e.actor === 0,
            );
            for (const event of recent) {
              if (event.kind === "start" && this.skillInputAt !== null) {
                this.record(
                  this.skillLatencies,
                  performance.now() - this.skillInputAt,
                );
                this.skillInputAt = null;
              }
              if (event.kind === "rejected") this.skillInputAt = null;
              document.querySelector("#skill-status")!.textContent =
                `${SKILLS.find((s) => s.id === event.skill)?.name}: ${event.reason ?? event.kind}`;
            }
          }
          if (this.encounter) finishEncounter(this.encounter, nav);
          const aim = controllerInput.frame.aim;
          if (
            player.controller.timeline.phase === "idle" &&
            Math.hypot(aim.x, aim.y) > 0.01
          )
            player.controller.walker.direction = directionFor(aim);
          this.record(this.simulations, performance.now() - tickStart);
          if (
            player.controller.timeline.sequence > oldSequence &&
            this.inputAt !== null
          ) {
            this.record(this.latencies, performance.now() - this.inputAt);
            this.inputAt = null;
          }
          for (const event of this.world.events)
            if (event.tick === this.world.tick) this.feedback(event);
          this.accumulator -= 1000 / 60;
        }
      }
      const updateAt = performance.now();
      this.ink.clear();
      this.effect.clear();
      this.syncActors();
      if (monsters)
        for (const obstacle of nav.obstacles) {
          this.ink
            .fillStyle(0x19252d, 1)
            .fillEllipse(
              obstacle.x,
              obstacle.y,
              obstacle.rx * 2,
              obstacle.ry * 2,
            );
          this.ink
            .lineStyle(2, 0x7a8176, 0.8)
            .strokeEllipse(
              obstacle.x,
              obstacle.y,
              obstacle.rx * 2,
              obstacle.ry * 2,
            );
        }
      for (const actor of this.world.actors) this.drawActor(actor);
      for (const projectile of this.world.projectiles) {
        const p = onGround(projectile.position);
        this.effect.fillStyle(0xf2ce85, 1).fillCircle(p.x, p.y - 28, 4);
      }
      if (this.abilities) {
        const colors = {
          physical: 0xe6c48a,
          fire: 0xff9c55,
          cold: 0x8fdde5,
          lightning: 0xc7b6ff,
          poison: 0x9fcd71,
          arcane: 0xe3ca89,
        };
        for (const bolt of this.abilities.effects.bolts) {
          const p = onGround(bolt.position);
          this.effect
            .fillStyle(colors[bolt.element], 1)
            .fillCircle(p.x, p.y - 24, 5);
        }
        for (const e of this.abilities.effects.events) {
          const age = this.world.tick - e.tick;
          if (age > 18 || e.kind !== "release") continue;
          const p = onGround(e.from),
            q = onGround(e.to);
          this.effect.lineStyle(2, colors[e.element], (1 - age / 19) * 0.8);
          if (e.shape === "radial" || e.shape === "self")
            this.effect.strokeEllipse(p.x, p.y, 60 + age * 7, 30 + age * 3.5);
          else if (e.shape === "chain")
            this.effect.lineBetween(p.x, p.y - 24, q.x, q.y - 24);
          else this.effect.strokeEllipse(p.x, p.y - 20, 25 + age * 2, 18 + age);
        }
        const u = this.abilities.users[0]!;
        if (this.game.loop.frame % 6 === 0) {
          document.querySelector("#skill-resource")!.textContent =
            `MANA ${u.mana.toFixed(0)} / ${u.maxMana} · ${u.cast?.skill ?? "READY"} · skill+combat p95 ${percentile(this.skillCosts, 0.95).toFixed(2)} ms · request p95 ${percentile(this.skillLatencies, 0.95).toFixed(1)} ms`;
          const buttons = Array.from(
            root.querySelectorAll<HTMLButtonElement>("[data-skill]"),
          );
          for (const [i, b] of buttons.entries()) {
            const s = SKILLS.find((s) => s.id === SKILL_SLOTS[i])!;
            if (s.kind !== "active") continue;
            const cd = Math.max(0, (u.cooldowns[s.id] ?? 0) - this.world.tick);
            b.textContent = `${s.name} · ${s.mana} MP${cd ? ` · ${(cd / 60).toFixed(1)}s` : ""}`;
            b.setAttribute("aria-pressed", String(i === this.selectedSkill));
          }
          const prompts =
            controllerInput.frame.device === "gamepad"
              ? SKILL_ACTIONS.map((a) =>
                  actionPrompt(
                    a,
                    controllerInput.family,
                    controllerInput.settings.bindings,
                  ),
                ).join(" / ")
              : "X / Q / 1 / 2 / 3 / 4";
          document.querySelector("#skill-prompts")!.textContent =
            `${prompts}: cast slots · D-pad ←/→: select · A/Cross/Enter: cast selected · R3/T: target · Right stick: aim · Right click: cast selected`;
        }
        window.hollowbaneSkills = {
          tick: this.world.tick,
          users: structuredClone(this.abilities.users),
          events: structuredClone(this.abilities.events),
          effects: structuredClone(this.abilities.effects.events),
          statuses: structuredClone(this.abilities.effects.statuses),
          bolts: this.abilities.effects.bolts.length,
          selected: this.selectedSkill,
          metrics: {
            skillCombatP95: percentile(this.skillCosts, 0.95),
            inputP95: percentile(this.skillLatencies, 0.95),
            inputSamples: this.skillLatencies.length,
          },
        };
      }
      this.record(this.updates, performance.now() - updateAt);
      const camera = this.cameras.main.worldView;
      const metrics = {
        frameP50: percentile(this.frames, 0.5),
        frameP95: percentile(this.frames, 0.95),
        simulationP95: percentile(this.simulations, 0.95),
        renderP95: percentile(this.renders, 0.95),
        updateP95: percentile(this.updates, 0.95),
        attackLatencyP95: percentile(this.latencies, 0.95),
        attackSamples: this.latencies.length,
        activeEntities:
          this.world.actors.filter((a) => a.hp > 0).length +
          this.world.projectiles.length,
        droppedTicks: this.droppedTicks,
        renderWidth: this.scale.width,
        renderHeight: this.scale.height,
      };
      window.hollowbaneCombat = {
        tick: this.world.tick,
        paused: this.paused,
        hovered: this.hovered,
        actors: this.world.actors.map((a) => {
          const p = onGround(a.controller.walker.position);
          return {
            id: a.id,
            name: a.name,
            hp: a.hp,
            maxHp: a.maxHp,
            x: p.x,
            y: p.y,
            phase: a.controller.timeline.phase,
            remaining: a.controller.timeline.remaining,
            sequence: a.controller.timeline.sequence,
            direction: a.controller.walker.direction,
            selected: a.controller.selected,
            locked: a.controller.locked,
            walking: a.controller.walker.walking,
            windup: a.controller.timeline.timing.windup,
            recovery: a.controller.timeline.timing.recovery,
          };
        }),
        projectiles: this.world.projectiles.map((p) => onGround(p.position)),
        events: [...this.world.events],
        view: {
          x: camera.x,
          y: camera.y,
          width: camera.width,
          height: camera.height,
        },
        metrics,
      };
      if (this.encounter) {
        window.hollowbaneAI = {
          tick: this.world.tick,
          enemies: this.encounter.brains.map((b) => ({
            ...b,
            position: {
              ...this.world.actors.find((a) => a.id === b.id)!.controller.walker
                .position,
            },
          })),
          metrics: {
            aiP95: percentile(this.aiCosts, 0.95),
            alive: this.encounter.brains.filter((b) => b.state !== "dead")
              .length,
            corpses: this.encounter.brains.filter((b) => b.state === "dead")
              .length,
            pathRequests: this.encounter.work.pathRequests,
            decisions: this.encounter.work.decisions,
            spawned: this.encounter.spawned,
            despawned: this.encounter.despawned,
          },
        };
      }
      if (this.game.loop.frame % 6 === 0) {
        const t = player.controller.timeline;
        document.querySelector("#combat-diagnostics")!.textContent =
          `${this.paused ? "PAUSED · " : ""}TICK ${this.world.tick} · ${metrics.activeEntities} ACTIVE\n${t.phase.toUpperCase()} · ${t.remaining} frames left\nWindup ${t.timing.windup} / active ${t.timing.active}\nRecovery ${t.timing.recovery} / hit ${player.recoveryBonus >= 60 ? 6 : player.recoveryBonus >= 25 ? 9 : 12}\nHP ${player.hp} / ${player.maxHp}\nFrame p50/p95 ${metrics.frameP50.toFixed(1)} / ${metrics.frameP95.toFixed(1)} ms\nSimulation p95 ${metrics.simulationP95.toFixed(2)} ms\nRender CPU p95 ${metrics.renderP95.toFixed(2)} ms\nView update p95 ${metrics.updateP95.toFixed(2)} ms\nAttack latency p95 ${metrics.attackLatencyP95.toFixed(1)} ms (${metrics.attackSamples})\nDropped ticks ${metrics.droppedTicks}${this.encounter ? `\nAI p95 ${percentile(this.aiCosts, 0.95).toFixed(2)} ms · ${this.encounter.brains.filter((b) => b.state !== "dead").length} enemies\nPaths/tick ${this.encounter.work.pathRequests} / 2 · ${this.encounter.despawned} despawned` : ""}`;
      }
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "combat-world",
    width: innerWidth,
    height: innerHeight,
    backgroundColor: "#0b1218",
    scene: Arena,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    render: { antialias: true, roundPixels: false },
  });
}
