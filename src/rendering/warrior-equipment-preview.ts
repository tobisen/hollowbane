import type Phaser from "phaser";
import equipment from "../../public/dev/warrior-equipment/equipment.json";
import type { WarriorPose } from "./warrior-pose";
import { itemContentForVersion } from "../simulation/item-content";
import {
  warriorRendererSelection,
  type WarriorEquipmentAppearance,
} from "./warrior-renderer-selection";

const baseName = (id: string): string =>
  itemContentForVersion(3).bases.find((base) => base.id === id)!.name;
const selections = {
  "ash-blade+bark-guard": `${baseName("ash-blade")} + ${baseName("bark-guard")}`,
  "ash-blade": `${baseName("ash-blade")} + empty offhand`,
  "reed-bow": `${baseName("reed-bow")} · legacy fallback`,
  "cinder-staff": `${baseName("cinder-staff")} · legacy fallback`,
  empty: "Empty hands · legacy fallback",
  "empty+bark-guard": `Empty main + ${baseName("bark-guard")} · legacy fallback`,
} as const;
type Selection = keyof typeof selections;
const appearances: Record<Selection, WarriorEquipmentAppearance> = {
  "ash-blade+bark-guard": {
    main: { base: "ash-blade" },
    off: { base: "bark-guard" },
  },
  "ash-blade": { main: { base: "ash-blade" } },
  "reed-bow": { main: { base: "reed-bow" } },
  "cinder-staff": { main: { base: "cinder-staff" } },
  empty: {},
  "empty+bark-guard": { off: { base: "bark-guard" } },
};
const limitations: Record<Selection, string> = {
  "ash-blade+bark-guard":
    "Supported: approved sword body, original shield overlay and limited late-death arm variant.",
  "ash-blade": "Supported: approved sword body with empty offhand.",
  "reed-bow":
    "Legacy fallback: sword-free body, bow draw/release and both-hand grips are not authored.",
  "cinder-staff":
    "Legacy fallback: sword-free body and reviewed two-hand staff attacks are not authored.",
  empty:
    "Legacy fallback: sword-free body and unarmed attacks are not authored.",
  "empty+bark-guard":
    "Legacy fallback: shield poses alone do not supply a sword-free body or unarmed attacks.",
};
const frames = equipment.framesByPose as Record<
  WarriorPose["set"],
  Record<string, string[]>
>;
const grips = equipment.gripsByPose as Record<string, number[]>;

/** Disposable developer presentation only. No character or inventory owner. */
export class WarriorEquipmentPreview {
  readonly keys = ["arena-shield", "arena-shield-body"] as const;
  readonly decodedBytes = equipment.resources.reduce(
    (sum, resource) => sum + resource.decodedBytes,
    0,
  );
  selection: Selection = "ash-blade+bark-guard";
  private shield: Phaser.GameObjects.Sprite | null = null;
  constructor() {
    const label = document.createElement("label");
    label.textContent = "Visual configuration ";
    const select = document.createElement("select");
    select.id = "arena-equipment";
    const note = document.createElement("p");
    note.id = "arena-equipment-note";
    note.className = "pilot-note";
    const updateNote = () => {
      note.textContent = `${limitations[this.selection]} Appearance study on a disposable melee fixture; selection changes graphics only. No real items, statistics or character saves are edited. Campaign secondary retains its assigned skill; this arena also exposes the alternate melee clip.`;
    };
    for (const [value, name] of Object.entries(selections)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      select.append(option);
    }
    select.onchange = () => {
      if (Object.hasOwn(selections, select.value))
        this.selection = select.value as Selection;
      updateNote();
    };
    label.append(select);
    document.querySelector(".pilot-controls")!.append(label);
    updateNote();
    document.querySelector(".pilot-controls")!.after(note);
  }
  get fallback(): string {
    const reason = warriorRendererSelection(
      "warrior",
      appearances[this.selection],
    );
    return reason === "supported" || reason === "supported-shield"
      ? "supported-developer-candidate"
      : reason;
  }
  queue(scene: Phaser.Scene): void {
    for (const [key, name] of [
      [this.keys[0], "shield"],
      [this.keys[1], "shield-death-body"],
    ])
      scene.load.atlas(
        key!,
        `${import.meta.env.BASE_URL}dev/warrior-equipment/${name}.png`,
        `${import.meta.env.BASE_URL}dev/warrior-equipment/${name}.json`,
      );
  }
  create(scene: Phaser.Scene): void {
    // Called immediately after the player body, preserving stable actor-depth
    // ordering even when two actors have exactly the same projected ground y.
    this.shield = scene.add.sprite(0, 0, this.keys[0]).setVisible(false);
  }
  hide(): void {
    this.shield?.setVisible(false);
  }
  release(): void {
    this.shield?.setVisible(false).setTexture("arena-shipped", 0);
  }
  get visible(): boolean {
    return this.shield?.visible ?? false;
  }
  draw(
    body: Phaser.GameObjects.Sprite,
    pose: WarriorPose,
    direction: string,
    position: { x: number; y: number },
    enabled: boolean,
  ): void {
    const name = frames[pose.set][direction]?.[pose.frame];
    if (!enabled || this.selection !== "ash-blade+bark-guard" || !name) {
      this.hide();
      return;
    }
    const root = equipment.rootsBySet[pose.set];
    if (
      pose.set === "death" &&
      pose.frame >= equipment.bodyVariantFromDeathFrame
    )
      body
        .setTexture(this.keys[1], name)
        .setOrigin(root[0]! / body.width, root[1]! / body.height);
    this.shield!.setTexture(this.keys[0], name)
      .setOrigin(root[0]! / this.shield!.width, root[1]! / this.shield!.height)
      .setScale(0.5)
      .setPosition(position.x, position.y)
      .setDepth(position.y)
      .setVisible(true);
  }
  grip(pose: WarriorPose, direction: string): { x: number; y: number } | null {
    const name = frames[pose.set][direction]?.[pose.frame];
    const point = name ? grips[name] : undefined;
    if (!point) return null;
    const root = equipment.rootsBySet[pose.set];
    return { x: (point[0]! - root[0]!) * 0.5, y: (point[1]! - root[1]!) * 0.5 };
  }
}
