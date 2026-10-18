import { classMechanicsDescription } from "../simulation/class-abilities";
import { attributeValues } from "../simulation/attributes";
import {
  CHARACTER_CLASSES,
  type ClassId,
} from "../simulation/character-classes";
import {
  CLASS_TREES,
  type SkillProgression,
} from "../simulation/skill-progression";
import { skillNodeState } from "../simulation/skill-tree-state";
import { SKILL_SLOTS } from "../simulation/skill-input";
import { SKILL_ICONS } from "./skill-icons";
import type { InventoryRuntime } from "./inventory-runtime";
import "./skill-tree-panel.css";
export class SkillTreePanel {
  readonly element = document.createElement("details");
  private classId: ClassId = "warrior";
  private branch = 0;
  private selected = "";
  private signature = "";
  private shownClass: ClassId | null | undefined = undefined;
  private feedback = "";
  private pending: {
    state: SkillProgression;
    kind: "rank" | "class";
    node: string;
    classId: ClassId;
  } | null = null;
  constructor(
    private runtime: InventoryRuntime,
    private ready: () => boolean,
    private handoff: () => void = () => {},
  ) {
    this.element.id = "skill-tree-panel";
    this.element.innerHTML =
      '<summary id="skill-tree-toggle">Skills · Disciplines &amp; mastery</summary><section id="skill-tree-content"></section>';
    this.element.addEventListener("keydown", (e) => {
      if (e.repeat && ["Enter", " "].includes(e.key)) e.preventDefault();
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.action("cancel");
      }
      if (this.pending && e.key === "Tab") {
        e.preventDefault();
        const id = (document.activeElement as HTMLElement)?.id;
        this.element
          .querySelector<HTMLElement>(
            id === "skill-confirm" ? "#skill-back" : "#skill-confirm",
          )
          ?.focus();
      }
    });
    this.element.addEventListener("click", (e) => {
      if (!(e.target instanceof Element) || (e as MouseEvent).detail > 1)
        return;
      const button = e.target.closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      this.handoff();
      if (button.dataset.class) {
        this.classId = button.dataset.class as ClassId;
        this.branch = 0;
        this.selected = "";
        this.pending = null;
      } else if (button.dataset.branch) {
        this.branch = Number(button.dataset.branch) - 1;
        this.selected = "";
        this.pending = null;
      } else if (button.dataset.node) this.selected = button.dataset.node;
      else if (button.id === "skill-back") this.pending = null;
      else if (button.id === "skill-confirm") {
        const pending = this.pending;
        this.pending = null;
        if (pending && this.ready())
          this.feedback =
            pending.kind === "class"
              ? runtime.changeSkills(pending.state, {
                  classId: pending.classId,
                })
              : runtime.allocateSkills({ [pending.node]: 1 }, pending.state);
      } else if (
        button.id === "skill-learn" ||
        button.id === "skill-choose-class"
      ) {
        const state = runtime.progression()?.skills;
        if (state && this.ready())
          this.pending = {
            state,
            kind: button.id === "skill-learn" ? "rank" : "class",
            node: this.selected,
            classId: this.classId,
          };
      } else if (button.dataset.assign) {
        const state = runtime.progression()?.skills;
        const node = CLASS_TREES.trees
          .find((t) => t.classId === this.classId)!
          .branches[this.branch]!.nodes.find((n) => n.id === this.selected)!;
        if (state && this.ready())
          this.feedback = runtime.changeSkills(state, {
            slot: Number(button.dataset.assign) - 1,
            skill: node.ability.id,
          });
      }
      this.signature = "";
      this.render();
      if (this.pending)
        this.element.querySelector<HTMLElement>("#skill-back")?.focus();
    });
    this.element.addEventListener("focusin", (e) => {
      const node = (e.target as HTMLElement).dataset.node;
      if (node && node !== this.selected) {
        this.selected = node;
        this.render();
      }
    });
  }
  containsFocus(): boolean {
    return this.element.contains(document.activeElement);
  }
  cancelPending = (): void => {
    if (this.pending) {
      this.pending = null;
      this.signature = "";
      this.render();
      this.element.querySelector<HTMLElement>("#skill-learn")?.focus();
    }
  };
  action(action: string): boolean {
    if (!this.containsFocus()) return false;
    if (action === "cancel") {
      if (this.pending) this.cancelPending();
      else if (this.element.open) {
        this.element.open = false;
        this.element.querySelector<HTMLElement>("summary")!.focus();
      } else return false;
      return true;
    }
    const active = document.activeElement as HTMLElement;
    if (action === "primary" || action === "interact") {
      active.click();
      return true;
    }
    if (!["up", "down", "left", "right"].includes(action)) return false;
    const controls = this.pending
      ? Array.from(
          this.element.querySelectorAll<HTMLElement>(
            "#skill-confirm,#skill-back",
          ),
        )
      : Array.from(
          this.element.querySelectorAll<HTMLElement>(
            "summary,button:not(:disabled)",
          ),
        );
    const index = controls.indexOf(active),
      delta = ["down", "right"].includes(action) ? 1 : -1;
    if (index === 0 && delta < 0 && !this.pending) return false;
    this.element.open = true;
    const target =
      controls[(index + delta + controls.length) % controls.length]!;
    target.focus();
    target.scrollIntoView({ block: "nearest" });
    return true;
  }
  render(): void {
    const xp = this.runtime.progression();
    if (!xp) {
      this.element.hidden = true;
      return;
    }
    if (this.shownClass !== xp.skills.classId) {
      this.classId = xp.skills.classId ?? "warrior";
      this.branch = 0;
      this.selected = "";
      this.shownClass = xp.skills.classId;
    }
    if (this.pending && this.pending.state !== xp.skills) this.pending = null;
    const tree = CLASS_TREES.trees.find((t) => t.classId === this.classId)!;
    const branch = tree.branches[this.branch]!;
    if (!branch.nodes.some((n) => n.id === this.selected))
      this.selected = branch.nodes[0]!.id;
    const key = JSON.stringify([
      xp.skills,
      xp.attributes,
      xp.character.level,
      this.classId,
      this.branch,
      this.selected,
      this.pending?.kind,
      this.feedback,
      this.ready(),
    ]);
    if (this.signature === key) return;
    this.signature = key;
    const focused = this.containsFocus()
      ? (document.activeElement as HTMLElement).id
      : "";
    const selected = branch.nodes.find((n) => n.id === this.selected)!;
    const view = skillNodeState(
      xp.skills,
      this.classId,
      xp.character.level,
      selected,
      attributeValues(xp.attributes),
    );
    const effect = (s: typeof view.current) =>
      s
        ? `${s.damage.toFixed(1)} damage${s.stagger ? " · Staggers on hit (reaction guard applies)" : ""}${s.precise ? " · Precise: cannot miss" : ""}${s.piercing ? ` · Pierces ${s.piercing} targets once each` : ""}${s.status ? ` · ${s.status.kind} ${s.status.magnitude.toFixed(2)} for ${(s.status.duration / 60).toFixed(1)}s` : ""} · ${s.mana} mana · ${(s.cooldown / 60).toFixed(1)}s cooldown`
        : "Not learned";
    const label = (id: string) =>
      tree.branches.flatMap((b) => b.nodes).find((n) => n.id === id);
    const requirement = (id: string) => {
      const node = label(id)!;
      return skillNodeState(xp.skills, this.classId, xp.character.level, node)
        .name;
    };
    const esc = (s: string) =>
      s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll('"', "&quot;");
    this.element.querySelector("section")!.innerHTML =
      `<div class="skill-tree-heading"><div><p class="character-eyebrow">THE PATH OF MASTERY</p><h3>${CHARACTER_CLASSES.find((c) => c.id === this.classId)!.name}</h3></div><p>Skill points <strong id="skill-points">${xp.skills.available}</strong></p></div><div class="skill-class-tabs" aria-label="Browse class disciplines">${CHARACTER_CLASSES.map((c) => `<button id="skill-class-${c.id}" data-class="${c.id}" aria-pressed="${this.classId === c.id}">${c.name}</button>`).join("")}</div><p class="skill-identity">${CHARACTER_CLASSES.find((c) => c.id === this.classId)!.identity} · ${xp.skills.classId ? `Committed: ${xp.skills.classId}` : "Legacy access preserved until a discipline is chosen."}</p><div class="skill-branches" role="tablist" aria-label="Specializations">${tree.branches.map((b, i) => `<button id="skill-branch-${i}" role="tab" data-branch="${i + 1}" aria-controls="skill-nodes" aria-selected="${this.branch === i}">${b.name}</button>`).join("")}</div><div class="skill-tree-layout"><div id="skill-nodes" role="tabpanel" aria-labelledby="skill-branch-${this.branch}">${branch.nodes
        .map((n) => {
          const v = skillNodeState(
              xp.skills,
              this.classId,
              xp.character.level,
              n,
            ),
            i = SKILL_SLOTS.indexOf(
              n.ability.id as (typeof SKILL_SLOTS)[number],
            );
          return `${n.prerequisites.length ? `<div class="skill-connection" aria-label="Prerequisites">↓ ${n.prerequisites.map((p) => `${esc(requirement(p.node))} rank ${p.rank}`).join(" + ")}</div>` : ""}<button id="node-${n.id}" class="skill-node" data-node="${n.id}" data-state="${v.status}" aria-pressed="${n.id === this.selected}" aria-describedby="skill-inspector"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="${SKILL_ICONS[i] ?? "M16 3L29 16L16 29L3 16ZM16 10V18M16 22V24"}"/></svg><span><b>${esc(v.name)}</b><small>${v.planned ? "Planned · unavailable" : v.status} · Level ${n.level}</small></span><strong>${v.rank} / ${n.maxRank}</strong></button>`;
        })
        .join(
          "",
        )}</div><aside id="skill-inspector" aria-live="polite"><p class="character-eyebrow">${view.status.toUpperCase()}</p><h4>${esc(view.name)}</h4><p>Rank ${view.rank} / ${selected.maxRank} · Requires level ${selected.level}</p><p>${selected.prerequisites.map((p) => `Requires ${esc(requirement(p.node))} rank ${p.rank}`).join("<br>") || "No prerequisites"}</p><p>Base effects before gear and mitigation.</p><p>Current: ${esc(effect(view.current))}</p><p>Next rank: ${view.planned ? "Ability not implemented" : esc(effect(view.next))}</p><p>${esc(classMechanicsDescription(xp.skills))}</p><p>${esc(view.reason)}</p><button id="skill-learn" ${!view.canAllocate || !this.ready() ? "disabled" : ""}>Learn rank ${view.rank + 1} · 1 point</button>${xp.skills.classId === null ? '<button id="skill-choose-class">Choose this discipline…</button><p>Changes skill access only. Existing attributes and items remain.</p>' : ""}<div class="skill-assign" aria-label="Assign learned ability">${Array.from({ length: 6 }, (_, i) => `<button id="skill-assign-${i}" data-assign="${i + 1}" ${!view.current || view.planned || !this.ready() ? "disabled" : ""}>Assign ${i + 1}</button>`).join("")}</div></aside></div><p id="skill-feedback" role="status">${esc(this.feedback || "Select a node to inspect. Learning requires confirmation; no respec.")}</p>${this.pending ? `<div class="skill-confirmation" role="alertdialog" aria-labelledby="skill-confirm-title" aria-describedby="skill-confirm-description"><h4 id="skill-confirm-title">${this.pending.kind === "rank" ? "Spend 1 skill point?" : `Commit to ${this.classId}?`}</h4><p id="skill-confirm-description">${this.pending.kind === "rank" ? `${esc(view.name)}: rank ${view.rank} → ${view.rank + 1}. This cannot be refunded.` : "Permanent skill discipline. Only learned class abilities will remain assignable and usable. Legacy six-skill access ends. Attributes and items are retained."}</p><button id="skill-back">Cancel</button><button id="skill-confirm">Confirm ${this.pending.kind === "rank" ? "1 point" : "discipline"}</button></div>` : ""}`;
    if (this.pending)
      for (const button of Array.from(
        this.element.querySelectorAll<HTMLButtonElement>(
          "button:not(#skill-confirm):not(#skill-back)",
        ),
      ))
        button.disabled = true;
    if (focused)
      (
        this.element.querySelector<HTMLElement>(`#${focused}`) ??
        this.element.querySelector<HTMLElement>(`#node-${this.selected}`)
      )?.focus();
  }
}
