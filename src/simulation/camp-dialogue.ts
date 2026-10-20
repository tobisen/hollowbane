import data from "../content/camp-npcs.json" with { type: "json" };
import type { AreaId, WorldPoint } from "./world";
export const CAMP_NPC_IDS = ["edda-vey", "orren-thale"] as const;
export type CampNpcId = (typeof CAMP_NPC_IDS)[number];
export interface DialogueNode {
  readonly text: string;
  readonly choices: readonly {
    readonly label: string;
    readonly next: string | null;
  }[];
}
export interface CampNpc {
  readonly id: CampNpcId;
  readonly name: string;
  readonly title: string;
  readonly position: WorldPoint;
  readonly tint: number;
  readonly nodes: Readonly<Record<string, DialogueNode>>;
}
export interface CampConversationState {
  version: 1;
  met: CampNpcId[];
}
export interface DialogueCursor {
  npc: CampNpcId;
  node: string;
}
function record(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== [...fields].sort().join()
  )
    throw Error("Invalid camp dialogue fields");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error("Invalid camp dialogue text");
  return value;
}
export function validateCampNpcs(value: unknown): readonly CampNpc[] {
  if (!Array.isArray(value) || value.length !== CAMP_NPC_IDS.length)
    throw Error("Expected two camp NPCs");
  const result = value.map((entry) => {
    const n = record(entry, [
        "id",
        "name",
        "title",
        "position",
        "tint",
        "nodes",
      ]),
      p = record(n.position, ["x", "y"]);
    if (
      !CAMP_NPC_IDS.includes(n.id as CampNpcId) ||
      typeof p.x !== "number" ||
      typeof p.y !== "number" ||
      ![p.x, p.y].every((v) => Number.isFinite(v) && Math.abs(v) <= 3) ||
      !Number.isSafeInteger(n.tint) ||
      (n.tint as number) < 0 ||
      (n.tint as number) > 0xffffff ||
      !n.nodes ||
      typeof n.nodes !== "object" ||
      Array.isArray(n.nodes)
    )
      throw Error("Invalid camp NPC");
    const nodes: Record<string, DialogueNode> = {};
    const entries = Object.entries(n.nodes);
    if (entries.length < 2 || entries.length > 12)
      throw Error("Invalid dialogue node count");
    for (const [id, value] of entries) {
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(id))
        throw Error("Invalid dialogue node identity");
      const node = record(value, ["text", "choices"]);
      if (
        !Array.isArray(node.choices) ||
        node.choices.length < 1 ||
        node.choices.length > 4
      )
        throw Error("Invalid dialogue choices");
      nodes[id] = {
        text: text(node.text, 1200),
        choices: node.choices.map((value) => {
          const c = record(value, ["label", "next"]);
          if (c.next !== null && typeof c.next !== "string")
            throw Error("Invalid dialogue destination");
          return { label: text(c.label, 100), next: c.next };
        }),
      };
    }
    if (
      !nodes.welcome ||
      !nodes.return ||
      Object.values(nodes).some((n) =>
        n.choices.some((c) => c.next !== null && !Object.hasOwn(nodes, c.next)),
      )
    )
      throw Error("Unknown dialogue destination");
    return {
      id: n.id as CampNpcId,
      name: text(n.name, 64),
      title: text(n.title, 64),
      position: { x: p.x, y: p.y },
      tint: n.tint as number,
      nodes,
    };
  });
  if (new Set(result.map((n) => n.id)).size !== CAMP_NPC_IDS.length)
    throw Error("Duplicate camp NPC identity");
  return result;
}
export const CAMP_NPCS = validateCampNpcs(data);
export function newCampConversations(): CampConversationState {
  return { version: 1, met: [] };
}
export function validateCampConversations(
  value: unknown,
): CampConversationState {
  const s = record(value, ["version", "met"]);
  if (
    s.version !== 1 ||
    !Array.isArray(s.met) ||
    s.met.length > CAMP_NPC_IDS.length ||
    s.met.some((id) => !CAMP_NPC_IDS.includes(id)) ||
    new Set(s.met).size !== s.met.length
  )
    throw Error("Invalid camp conversation state");
  return { version: 1, met: [...s.met] as CampNpcId[] };
}
export function nearbyCampNpc(
  area: AreaId,
  player: WorldPoint,
): CampNpc | undefined {
  return area === "ashen-refuge"
    ? [...CAMP_NPCS]
        .filter(
          (n) =>
            Math.hypot(n.position.x - player.x, n.position.y - player.y) <= 1.2,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.position.x - player.x, a.position.y - player.y) -
              Math.hypot(b.position.x - player.x, b.position.y - player.y) ||
            (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        )[0]
    : undefined;
}
export function beginCampDialogue(
  state: CampConversationState,
  id: string,
  area: AreaId,
  player: WorldPoint,
  alive: boolean,
  idle: boolean,
): {
  state: CampConversationState;
  cursor: DialogueCursor;
  changed: boolean;
} | null {
  const npc = CAMP_NPCS.find((n) => n.id === id);
  if (
    !npc ||
    area !== "ashen-refuge" ||
    !alive ||
    !idle ||
    Math.hypot(npc.position.x - player.x, npc.position.y - player.y) > 1.2 ||
    ![player.x, player.y].every(Number.isFinite)
  )
    return null;
  const met = state.met.includes(npc.id);
  return {
    state: met ? state : { version: 1, met: [...state.met, npc.id] },
    cursor: { npc: npc.id, node: met ? "return" : "welcome" },
    changed: !met,
  };
}
export function dialogueNode(cursor: DialogueCursor): DialogueNode | undefined {
  return CAMP_NPCS.find((n) => n.id === cursor.npc)?.nodes[cursor.node];
}
export function advanceCampDialogue(
  cursor: DialogueCursor,
  choice: number,
): DialogueCursor | null {
  const option = dialogueNode(cursor)?.choices[choice];
  return option?.next ? { ...cursor, node: option.next } : null;
}
