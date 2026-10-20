import { QUESTS, questStatus } from "../simulation/quests";
import type { WorldSession } from "../simulation/world-session";
import { controllerInput as hub } from "./controller-input";
import { contextPrompt } from "../simulation/prompts";
import { CAMP_NPCS } from "../simulation/camp-dialogue";
import "./quest-journal.css";
/** Journal consumes domain state and emits explicit accept/track/claim intents. */
export class QuestJournal {
  private dialog = document.createElement("dialog");
  private button = document.createElement("button");
  private category: "act1" | "practice" = "act1";
  private selected = QUESTS.findIndex((q) => q.chapter === "act1");
  private feedback = "";
  constructor(
    private root: HTMLElement,
    private world: () => WorldSession,
    private enabled: () => boolean,
    private change: (
      action: "accept" | "track" | "claim",
      id: string,
    ) => string,
    private stop: () => void,
  ) {
    this.button.id = "quest-journal-open";
    this.button.textContent = "Quest journal · J";
    this.button.onclick = () => this.open();
    this.dialog.id = "quest-journal";
    this.dialog.setAttribute("aria-labelledby", "quest-journal-title");
    this.dialog.innerHTML =
      '<h2 id="quest-journal-title">Quest journal</h2><p id="quest-tracked"></p><nav aria-label="Quest category and selection"><button id="quest-act1">Act 1</button><button id="quest-practice">Camp tasks</button><button id="quest-previous">Previous quest</button><button id="quest-next">Next quest</button></nav><h3 id="quest-title"></h3><p id="quest-description"></p><p id="quest-status"></p><ul id="quest-objectives"></ul><p id="quest-reward"></p><p id="quest-requires"></p><div id="quest-actions"></div><p id="quest-feedback" role="status"></p><button id="quest-journal-close">Close journal</button><p id="quest-help"></p>';
    root.append(this.button, this.dialog);
    for (const category of ["act1", "practice"] as const)
      this.dialog.querySelector<HTMLButtonElement>(
        `#quest-${category}`,
      )!.onclick = () => {
        this.category = category;
        const list = this.visibleQuests();
        this.selected = QUESTS.indexOf(
          list.find(
            (q) => questStatus(this.world().quests, q) === "available",
          ) ?? list[0]!,
        );
        this.feedback = "";
        this.render();
      };
    this.dialog.querySelector<HTMLButtonElement>(
      "#quest-journal-close",
    )!.onclick = () => this.dialog.close();
    for (const [name, delta] of [
      ["previous", -1],
      ["next", 1],
    ] as const)
      this.dialog.querySelector<HTMLButtonElement>(`#quest-${name}`)!.onclick =
        () => {
          const list = this.visibleQuests(),
            index = list.indexOf(QUESTS[this.selected]!);
          this.selected = QUESTS.indexOf(
            list[(index + delta + list.length) % list.length]!,
          );
          this.feedback = "";
          this.render();
        };
    this.dialog.addEventListener("close", () => {
      hub.clear();
      hub.blockGameplay = Boolean(document.querySelector("dialog[open]"));
      if (!hub.blockGameplay)
        root.querySelector<HTMLElement>("#combat-world")?.focus();
    });
    this.dialog.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const buttons = Array.from(
          this.dialog.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        ),
        i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[
        (i + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) %
          buttons.length
      ]?.focus();
    });
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("hollowbane-journal-toggle", this.toggle);
  }
  private keydown = (event: KeyboardEvent) => {
    if (
      event.code !== "KeyJ" ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)))
    )
      return;
    event.preventDefault();
    this.toggle();
  };
  private toggle = () => {
    if (this.dialog.open) this.dialog.close();
    else this.open();
  };
  private open(): void {
    if (!this.enabled() || document.querySelector("dialog[open]")) return;
    const tracked = this.world().quests.tracked;
    const index = QUESTS.findIndex((q) => q.id === tracked);
    if (index >= 0) {
      this.selected = index;
      this.category = QUESTS[index]!.chapter === "act1" ? "act1" : "practice";
    }
    this.feedback = "";
    this.stop();
    hub.clear();
    hub.blockGameplay = true;
    this.render();
    this.dialog.showModal();
    (
      this.dialog.querySelector<HTMLButtonElement>(
        "#quest-actions button:not(:disabled)",
      ) ?? this.dialog.querySelector<HTMLButtonElement>("#quest-next")
    )?.focus();
  }
  private visibleQuests() {
    return QUESTS.filter((q) =>
      this.category === "act1" ? q.chapter === "act1" : !q.chapter,
    );
  }
  private render(): void {
    const q = QUESTS[this.selected]!,
      state = this.world().quests,
      entry = state.entries.find((e) => e.id === q.id),
      status = questStatus(state, q),
      legacy = q.chapter === "act1" && this.world().contentVersion !== 2;
    for (const category of ["act1", "practice"] as const)
      this.dialog
        .querySelector(`#quest-${category}`)!
        .setAttribute("aria-pressed", String(category === this.category));
    const text = (id: string, value: string) => {
      this.dialog.querySelector(`#${id}`)!.textContent = value;
    };
    text(
      "quest-tracked",
      `Tracked: ${QUESTS.find((q) => q.id === state.tracked)?.title ?? "None"}`,
    );
    text("quest-title", q.title);
    text("quest-description", q.description);
    text(
      "quest-status",
      legacy ? "Status: unavailable on this route" : `Status: ${status}`,
    );
    text(
      "quest-requires",
      q.requires.length
        ? `Requires: ${q.requires.map((id) => QUESTS.find((q) => q.id === id)!.title).join(", ")}`
        : "Available without prerequisites.",
    );
    if (q.chapter === "act1")
      text(
        "quest-requires",
        `${this.dialog.querySelector("#quest-requires")!.textContent} Map: ◇ exits · □ treasure · ◉ crypt beacon.`,
      );
    text(
      "quest-reward",
      `Reward: ${q.reward.xp} XP · ${q.reward.gold} gold${q.reward.itemSeed === null ? "" : " · one item placed nearby"} · ${q.returnTo ? `Return to ${CAMP_NPCS.find((npc) => npc.id === q.returnTo)!.name} in Ashen Refuge` : "Claim at camp"}`,
    );
    const objectives = this.dialog.querySelector("#quest-objectives")!;
    objectives.replaceChildren(
      ...q.objectives.map((o, i) => {
        const li = document.createElement("li");
        li.textContent = `${o.label}: ${entry?.seen[i]?.length ?? 0} / ${o.count}`;
        return li;
      }),
    );
    const actions = this.dialog.querySelector("#quest-actions")!;
    actions.replaceChildren();
    const add = (action: "accept" | "track" | "claim", label: string) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.questAction = action;
      button.textContent = label;
      button.onclick = () => {
        this.feedback = this.change(action, q.id);
        this.render();
        this.dialog
          .querySelector<HTMLButtonElement>(
            "#quest-actions button, #quest-journal-close",
          )
          ?.focus();
      };
      actions.append(button);
    };
    if (status === "available" && !legacy) add("accept", "Accept quest");
    if ((status === "active" || status === "ready") && state.tracked !== q.id)
      add("track", "Track quest");
    if (status === "ready") add("claim", "Claim reward");
    text(
      "quest-feedback",
      legacy
        ? "Act 1 needs a four-area expedition. This older two-area checkpoint is preserved."
        : this.feedback,
    );
    this.update();
  }
  update(): void {
    this.button.disabled = !this.enabled();
    const help = this.dialog.querySelector("#quest-help")!;
    const prompt =
      hub.frame.device === "gamepad"
        ? contextPrompt("menu", hub.family, hub.settings.bindings)
        : "Enter: choose · Arrow keys / Tab: navigate · Esc / J: leave";
    if (help.textContent !== prompt) help.textContent = prompt;
  }
  destroy(): void {
    if (this.dialog.open) this.dialog.close();
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("hollowbane-journal-toggle", this.toggle);
    this.button.remove();
    this.dialog.remove();
  }
}
