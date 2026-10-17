import { SKILL_ACTIONS, SKILL_SLOTS } from "../simulation/skill-input";
import { activeSkill, type SkillRuntime } from "../simulation/skills";
import { actionPrompt } from "../simulation/prompts";
import type { ControllerSettings } from "../simulation/controller-settings";
import type { GlyphFamily } from "../simulation/gamepad-profile";
const ICONS = [
  "M5 27L22 3L28 12Z M12 21L23 9",
  "M16 3V29 M3 16H29 M6 6L26 26 M6 26L26 6",
  "M20 2L7 17H17L12 30L27 12H17Z",
  "M4 27L10 5Q28 7 28 24Z M4 27L22 10",
  "M16 3L27 16L16 29L5 16Z M10 16H22 M16 10V22",
  "M7 29L23 3 M12 22L5 16 M17 15L26 18 M20 10L13 6",
];
function text(node: Element, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}
function attr(node: Element, key: string, value: string): void {
  if (node.getAttribute(key) !== value) node.setAttribute(key, value);
}
export class PolishHUD {
  private root: HTMLElement;
  private buttons: HTMLButtonElement[];
  private lastFill = [-1, -1];
  constructor(main: HTMLElement) {
    this.root = main.querySelector<HTMLElement>(".skill-bar")!;
    this.root.innerHTML = `<div class="vitals"><div id="polish-health" class="vital health" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="300" aria-valuenow="300"><span class="vital-fill"></span><span class="vital-label">HEALTH <b>300 / 300</b></span></div><div id="polish-mana" class="vital mana" role="meter" aria-label="Mana" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span class="vital-fill"></span><span class="vital-label">MANA <b>100 / 100</b></span></div><p id="polish-target">No target selected</p></div><div class="ability-slots">${SKILL_SLOTS.map((id, i) => `<button type="button" data-skill="${i}" aria-pressed="${i === 0}"><span class="cooldown-wipe"></span><svg aria-hidden="true" viewBox="0 0 32 32"><path d="${ICONS[i]}"/></svg><span class="slot-name"></span><span class="slot-meta"></span><kbd class="slot-key"></kbd></button>`).join("")}</div><p id="skill-resource" class="hud-phase">Ready</p><p id="skill-prompts"></p><p id="skill-status" role="status">Select a skill. Aim with mouse or right stick.</p>`;
    this.buttons = Array.from(
      this.root.querySelectorAll<HTMLButtonElement>("[data-skill]"),
    );
    const log = main.querySelector("#combat-log")!;
    log.classList.add("hud-event");
    this.root.append(log);
    const panel = main.querySelector<HTMLElement>(".arena-panel")!,
      details = document.createElement("details"),
      summary = document.createElement("summary");
    summary.textContent = "Developer diagnostics";
    details.append(summary);
    while (panel.firstChild) details.append(panel.firstChild);
    panel.append(details);
    main
      .querySelector(".arena-header")!
      .insertAdjacentHTML(
        "beforeend",
        '<nav class="polish-navigation"><a href="?polish=1">Encounters</a><a href="?polish=1&training=1">Training</a><a href="?polish=1&showcase=1">Skill showcase</a></nav>',
      );
  }
  update(
    r: SkillRuntime,
    selected: number,
    hovered: number | null,
    family: GlyphFamily,
    settings: ControllerSettings,
    pad: boolean,
  ): void {
    const a = r.combat.actors[0]!,
      u = r.users[0]!,
      tick = r.combat.tick;
    for (const [i, [selector, value, max]] of (
      [
        ["#polish-health", a.hp, a.maxHp],
        ["#polish-mana", u.mana, u.maxMana],
      ] as const
    ).entries()) {
      const meter = this.root.querySelector(selector)!,
        rounded = Math.ceil(value),
        fraction = Math.round(Math.max(0, value / max) * 100) / 100;
      attr(meter, "aria-valuenow", String(rounded));
      attr(meter, "aria-valuemax", String(max));
      text(meter.querySelector("b")!, `${rounded} / ${max}`);
      if (this.lastFill[i] !== fraction) {
        (meter.querySelector(".vital-fill") as HTMLElement).style.transform =
          `scaleX(${fraction})`;
        this.lastFill[i] = fraction;
      }
    }
    const target = r.combat.actors.find(
      (t) => t.id === (a.controller.selected ?? hovered) && t.hp > 0,
    );
    text(
      this.root.querySelector("#polish-target")!,
      target
        ? `${target.name} · ${target.hp} / ${target.maxHp}`
        : "No target · aim freely or lock a target",
    );
    for (const [i, b] of this.buttons.entries()) {
      const s = activeSkill(r, SKILL_SLOTS[i]!)!,
        remaining = Math.max(0, (u.cooldowns[s.id] ?? 0) - tick),
        label = `${s.mana} MP${remaining ? ` · ${(remaining / 60).toFixed(1)}s` : " · ready"}`,
        key = pad
          ? actionPrompt(SKILL_ACTIONS[i]!, family, settings.bindings)
          : ["X", "Q", "1", "2", "3", "4"][i]!;
      text(b.querySelector(".slot-name")!, s.name);
      text(b.querySelector(".slot-meta")!, label);
      text(b.querySelector(".slot-key")!, key);
      attr(b, "aria-pressed", String(i === selected));
      attr(b, "aria-label", `${s.name}, ${label}, ${key}`);
      attr(b, "data-unavailable", String(u.mana < s.mana || remaining > 0));
      const fraction = s.cooldown
          ? Math.round((remaining / s.cooldown) * 20) / 20
          : 0,
        node = b.querySelector<HTMLElement>(".cooldown-wipe")!,
        value = `scaleY(${fraction})`;
      if (node.style.transform !== value) node.style.transform = value;
    }
    const t = a.controller.timeline;
    text(
      this.root.querySelector("#skill-resource")!,
      `${u.cast ? activeSkill(r, u.cast.skill)!.name : "Ready"} · ${t.phase}${t.remaining ? ` · ${t.remaining} frames` : ""}`,
    );
    text(
      this.root.querySelector("#skill-prompts")!,
      pad
        ? `${actionPrompt("interact", family, settings.bindings)} cast selected · D-pad select · RS aim · ${actionPrompt("targetLock", family, settings.bindings)} target · ${actionPrompt("pause", family, settings.bindings)} menu`
        : "Click slot to select · right click casts · X / Q / 1–4 cast directly · T locks target · WASD moves",
    );
  }
}
