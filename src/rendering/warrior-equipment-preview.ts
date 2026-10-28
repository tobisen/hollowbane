import type Phaser from "phaser";
import equipment from "../../public/dev/warrior-equipment/equipment.json";
import type { WarriorPose } from "./warrior-pose";

const selections = {
  "ash-blade+bark-guard": "Ash blade + Bark guard",
  "ash-blade": "Ash blade + empty offhand",
  "reed-bow": "Reed bow · legacy fallback",
  "cinder-staff": "Cinder staff · legacy fallback",
  empty: "Empty hands · legacy fallback",
} as const;
type Selection = keyof typeof selections;
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
    for (const [value, name] of Object.entries(selections)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      select.append(option);
    }
    select.onchange = () => {
      if (Object.hasOwn(selections, select.value))
        this.selection = select.value as Selection;
    };
    label.append(select);
    document.querySelector(".pilot-controls")!.append(label);
    const note = document.createElement("p");
    note.className = "pilot-note";
    note.textContent =
      "Equipment appearance study: original base definitions, disposable melee fixture. Selection changes graphics only; no real items, statistics or character saves are edited. Shields remain unapproved for campaign use.";
    document.querySelector(".pilot-controls")!.after(note);
  }
  get fallback(): string {
    if (this.selection === "empty") return "empty-main-hand";
    if (["reed-bow", "cinder-staff"].includes(this.selection))
      return `unsupported-weapon:${this.selection}`;
    return "supported-developer-candidate";
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
