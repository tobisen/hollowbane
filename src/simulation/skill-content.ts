/** Validated serializable ability content. No renderer or runtime state. */
export const ELEMENTS = [
  "physical",
  "fire",
  "cold",
  "lightning",
  "poison",
  "arcane",
] as const;
export type Element = (typeof ELEMENTS)[number];
export type SkillShape =
  "projectile" | "radial" | "chain" | "cone" | "line" | "melee" | "self";
export interface SkillStatus {
  kind: "slow" | "poison" | "power";
  duration: number;
  interval: number;
  magnitude: number;
  stacking: "refresh" | "strongest";
}
export interface ActiveSkill {
  /** Derived class mechanics; legacy definitions omit these fields. */
  stagger?: boolean;
  precise?: boolean;
  piercing?: number;
  kind: "active";
  id: string;
  name: string;
  shape: SkillShape;
  element: Element;
  damage: number;
  mana: number;
  cooldown: number;
  windup: number;
  recovery: number;
  range: number;
  radius: number;
  maxTargets: number;
  status: SkillStatus | null;
}
export interface PassiveSkill {
  kind: "passive";
  id: string;
  name: string;
  manaPerSecond: number;
}
export type SkillDefinition = ActiveSkill | PassiveSkill;
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const positive = (v: unknown, zero = false): v is number =>
  typeof v === "number" && Number.isFinite(v) && (zero ? v >= 0 : v > 0);
const integer = (v: unknown, zero = false): v is number =>
  positive(v, zero) && Number.isSafeInteger(v);
/** Parse unknown content atomically; reject duplicate IDs and all unsafe numbers. */
export function validateSkills(data: unknown): readonly SkillDefinition[] {
  if (!Array.isArray(data) || data.length === 0 || data.length > 128)
    throw new Error("Invalid skill registry");
  const ids = new Set<string>();
  for (const s of data as unknown[]) {
    if (
      !object(s) ||
      typeof s.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,47}$/.test(s.id) ||
      ids.has(s.id) ||
      typeof s.name !== "string" ||
      !s.name.trim() ||
      s.name.length > 80
    )
      throw new Error("Invalid skill identity");
    ids.add(s.id);
    if (s.kind === "passive") {
      if (!positive(s.manaPerSecond, true) || s.manaPerSecond > 100)
        throw new Error("Invalid passive skill");
    } else if (s.kind === "active") {
      if (
        ![
          "projectile",
          "radial",
          "chain",
          "cone",
          "line",
          "melee",
          "self",
        ].includes(String(s.shape)) ||
        !ELEMENTS.includes(s.element as Element) ||
        !positive(s.damage, true) ||
        !positive(s.mana, true) ||
        !integer(s.cooldown, true) ||
        !integer(s.windup) ||
        !integer(s.recovery) ||
        !positive(s.range) ||
        !positive(s.radius) ||
        !integer(s.maxTargets) ||
        s.maxTargets > 50 ||
        s.windup > 600 ||
        s.recovery > 600 ||
        (s.cooldown as number) > 36000 ||
        s.damage > 100000 ||
        s.mana > 100000 ||
        s.range > 100 ||
        s.radius > 100
      )
        throw new Error("Invalid active skill");
      if (
        (s.stagger !== undefined && typeof s.stagger !== "boolean") ||
        (s.precise !== undefined && typeof s.precise !== "boolean") ||
        (s.piercing !== undefined && (!integer(s.piercing) || s.piercing > 8))
      )
        throw new Error("Invalid class mechanics");
      if (s.status !== null) {
        const t = s.status;
        if (
          !object(t) ||
          !["slow", "poison", "power"].includes(String(t.kind)) ||
          !integer(t.duration) ||
          t.duration > 36000 ||
          !integer(t.interval) ||
          t.interval > t.duration ||
          !positive(t.magnitude) ||
          t.magnitude > 100 ||
          !["refresh", "strongest"].includes(String(t.stacking)) ||
          (t.kind === "slow" && t.magnitude >= 1)
        )
          throw new Error("Invalid skill status");
      }
    } else throw new Error("Unknown skill kind");
  }
  // JSON-compatible values are owned by the registry, not by the caller.
  return JSON.parse(JSON.stringify(data)) as SkillDefinition[];
}
