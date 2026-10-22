import Phaser from "phaser";
import {
  CAMP_NPCS,
  nearbyCampNpc,
  dialogueNode,
  advanceCampDialogue,
  type DialogueCursor,
} from "../simulation/camp-dialogue";
import type { AreaId, WorldPoint } from "../simulation/world";
import { onGround } from "../world/navigation";
import { footDepth } from "../world/depth";
import { controllerInput as hub } from "./controller-input";
import { contextPrompt, actionPrompt } from "../simulation/prompts";
import "./camp-dialogue.css";

/** Presentation only: NPCs never join combat actors or modify collision/layouts. */
export class CampDialogueView {
  private sprites: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
  private dialog: HTMLDialogElement;
  private button: HTMLButtonElement;
  private help: HTMLElement;
  private cursor: DialogueCursor | null = null;
  constructor(
    scene: Phaser.Scene,
    root: HTMLElement,
    interact: (id?: string) => boolean,
    browseMerchant?: () => void,
  ) {
    for (const [index, npc] of CAMP_NPCS.entries()) {
      const p = onGround(npc.position);
      this.sprites.push(
        scene.add
          .image(p.x, p.y, "arena-wanderer", index ? 32 : 0)
          .setOrigin(0.5, 112 / 128)
          .setScale(0.93)
          .setTint(npc.tint)
          .setDepth(footDepth(p.y, 8000 + index))
          .setVisible(false),
      );
      this.sprites.push(
        scene.add
          .text(p.x, p.y - 116, `${npc.name}\n${npc.title}`, {
            fontFamily: "Georgia",
            fontSize: "16px",
            color: "#ead8ad",
            align: "center",
            backgroundColor: "#10191bd9",
            padding: { x: 5, y: 3 },
          })
          .setOrigin(0.5, 1)
          .setDepth(1900)
          .setVisible(false),
      );
    }
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.id = "camp-talk";
    this.button.hidden = true;
    this.button.onclick = () => {
      interact(this.button.dataset.npc);
    };
    root.append(this.button);
    this.dialog = document.createElement("dialog");
    this.dialog.id = "camp-dialogue";
    this.dialog.setAttribute("aria-labelledby", "camp-speaker");
    this.dialog.innerHTML =
      '<p id="camp-speaker-role"></p><h2 id="camp-speaker"></h2><p id="camp-speech"></p><div id="camp-choices"></div><button id="camp-quest-journal" type="button">Quest journal</button><button id="camp-dialogue-close" type="button">End conversation</button><p class="camp-dialogue-help">Choose a reply · Esc / Back: leave</p>';
    root.append(this.dialog);
    if (browseMerchant) {
      const browse = document.createElement("button");
      browse.id = "camp-merchant-open";
      browse.type = "button";
      browse.textContent = "Browse road supplies";
      browse.hidden = true;
      browse.onclick = () => {
        if (this.cursor?.npc !== "orren-thale") return;
        this.close();
        browseMerchant();
      };
      this.dialog.querySelector("#camp-dialogue-close")!.before(browse);
    }
    this.help = this.dialog.querySelector<HTMLElement>(".camp-dialogue-help")!;
    this.dialog.querySelector<HTMLButtonElement>(
      "#camp-quest-journal",
    )!.onclick = () => {
      this.close();
      window.dispatchEvent(new Event("hollowbane-journal-toggle"));
    };
    this.dialog.querySelector<HTMLButtonElement>(
      "#camp-dialogue-close",
    )!.onclick = () => this.close();
    this.dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close();
    });
    this.dialog.addEventListener("close", () => {
      this.cursor = null;
      hub.clear();
      hub.blockGameplay = Boolean(document.querySelector("dialog[open]"));
      if (!hub.blockGameplay)
        root.querySelector<HTMLElement>("#combat-world")?.focus();
    });
    this.dialog.addEventListener("keydown", (e) => {
      if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const list = Array.from(
        this.dialog.querySelectorAll<HTMLButtonElement>(
          "button:not([hidden]):not(:disabled)",
        ),
      );
      const i = list.indexOf(document.activeElement as HTMLButtonElement);
      list[
        (i + (e.key === "ArrowUp" ? -1 : 1) + list.length) % list.length
      ]?.focus();
    });
  }
  update(area: AreaId, player: WorldPoint, enabled: boolean): void {
    const visible = area === "ashen-refuge";
    for (const sprite of this.sprites) sprite.setVisible(visible);
    const npc = nearbyCampNpc(area, player);
    this.button.hidden = !npc;
    this.button.disabled = !enabled;
    if (npc) {
      this.button.dataset.npc = npc.id;
      const key =
        hub.frame.device === "gamepad"
          ? actionPrompt("interact", hub.family, hub.settings.bindings)
          : "E / Enter";
      const text = `Talk to ${npc.name} · ${key}`;
      if (this.button.textContent !== text) this.button.textContent = text;
    }
    const prompt =
      hub.frame.device === "gamepad"
        ? contextPrompt("menu", hub.family, hub.settings.bindings)
        : "Click / Enter: choose · Esc: leave · Arrow keys / Tab: navigate";
    if (this.help.textContent !== prompt) this.help.textContent = prompt;
  }
  open(cursor: DialogueCursor): void {
    this.cursor = cursor;
    hub.clear();
    hub.blockGameplay = true;
    this.render();
    this.dialog.showModal();
    this.dialog
      .querySelector<HTMLButtonElement>("#camp-choices button")
      ?.focus();
  }
  close(): void {
    if (this.dialog.open) this.dialog.close();
  }
  private render(): void {
    if (!this.cursor) return;
    const npc = CAMP_NPCS.find((n) => n.id === this.cursor!.npc),
      node = dialogueNode(this.cursor);
    if (!npc || !node) {
      this.close();
      return;
    }
    this.dialog.querySelector("#camp-speaker")!.textContent = npc.name;
    this.dialog.querySelector("#camp-speaker-role")!.textContent = npc.title;
    this.dialog.querySelector("#camp-speech")!.textContent = node.text;
    const browse = this.dialog.querySelector<HTMLButtonElement>(
      "#camp-merchant-open",
    );
    if (browse) browse.hidden = this.cursor.npc !== "orren-thale";
    const list = this.dialog.querySelector("#camp-choices")!;
    list.replaceChildren();
    node.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.onclick = () => {
        if (!this.cursor) return;
        this.cursor = advanceCampDialogue(this.cursor, index);
        if (!this.cursor) this.close();
        else {
          this.render();
          this.dialog
            .querySelector<HTMLButtonElement>("#camp-choices button")
            ?.focus();
        }
      };
      list.append(button);
    });
  }
  destroy(): void {
    this.close();
    this.button.remove();
    this.dialog.remove();
    for (const sprite of this.sprites) sprite.destroy();
  }
}
