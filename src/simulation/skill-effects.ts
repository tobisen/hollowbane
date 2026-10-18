import { itemPowerStatus } from "./item-hit-rules";
import { applyCombatHit, type CombatActor } from "./combat";
import {
  projectileContact,
  launchProjectile,
  type Projectile,
} from "./projectiles";
import { MOVEMENT, type MovementConfig } from "./locomotion";
import { segmentWalkable, type Navigation } from "../world/navigation";
import type { Point } from "../world/isometric";
import type { ActiveSkill, SkillStatus } from "./skill-content";
import type { SkillRuntime, Cast } from "./skills";
export interface Status extends SkillStatus {
  actor: number;
  source: number;
  skill: string;
  expires: number;
  next: number;
  triggered?: boolean;
}
export interface SkillBolt extends Projectile {
  definition?: ActiveSkill;
  hitActors?: number[];
  skill: string;
  damage: number;
  element: ActiveSkill["element"];
  radius: number;
}
export interface EffectEvent {
  tick: number;
  kind: "release" | "hit" | "status" | "expire";
  actor: number;
  target: number | null;
  skill: string;
  from: Point;
  to: Point;
  shape: ActiveSkill["shape"];
  element: ActiveSkill["element"];
}
export interface Effects {
  statuses: Status[];
  bolts: SkillBolt[];
  nextBolt: number;
  events: EffectEvent[];
  bases: Record<number, MovementConfig>;
}
export const createEffects = (): Effects => ({
  statuses: [],
  bolts: [],
  nextBolt: 0,
  events: [],
  bases: {},
});
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const enemies = (a: CombatActor, b: CombatActor) =>
  a.kind === "player" ? b.kind !== "player" : b.kind === "player";
function visual(
  r: SkillRuntime,
  s: ActiveSkill,
  actor: CombatActor,
  target: CombatActor | null,
  kind: EffectEvent["kind"],
  to?: Point,
): void {
  const from = actor.controller.walker.position;
  r.effects.events.push({
    tick: r.combat.tick,
    kind,
    actor: actor.id,
    target: target?.id ?? null,
    skill: s.id,
    from: { ...from },
    to: { ...(to ?? target?.controller.walker.position ?? from) },
    shape: s.shape,
    element: s.element,
  });
  if (r.effects.events.length > 256) r.effects.events.shift();
}
export function applyStatus(
  r: SkillRuntime,
  s: ActiveSkill,
  source: CombatActor,
  target: CombatActor,
  triggered = false,
): boolean {
  if (!s.status || target.hp <= 0) return false;
  const t =
      source.itemRules && !triggered
        ? itemPowerStatus(source.itemRules, s, s.status, {
            healthFraction: Math.max(0, Math.min(1, source.hp / source.maxHp)),
            targetStatuses: target.effectStatuses ?? [],
            element: s.element,
            weapon: source.weapon,
          })
        : s.status,
    old = r.effects.statuses.find(
      (x) => x.actor === target.id && x.kind === t.kind,
    );
  if (old) {
    // A weaker strongest effect cannot prolong or replace a stronger effect.
    if (t.stacking === "strongest" && old.magnitude > t.magnitude) return false;
    const stronger = t.magnitude > old.magnitude;
    Object.assign(old, t, {
      source: source.id,
      skill: s.id,
      expires: r.combat.tick + t.duration,
    });
    if (triggered) old.triggered = true;
    else delete old.triggered;
    if (stronger) old.next = r.combat.tick + t.interval;
  } else
    r.effects.statuses.push({
      ...t,
      actor: target.id,
      source: source.id,
      skill: s.id,
      expires: r.combat.tick + t.duration,
      next: r.combat.tick + t.interval,
      ...(triggered ? { triggered: true } : {}),
    });
  if (
    r.combat.experience.skills.classId !== null ||
    r.combat.hitTrace ||
    r.combat.actors.some((a) => a.itemRules)
  )
    target.effectStatuses = r.effects.statuses
      .filter((t) => t.actor === target.id)
      .map((t) => t.kind);
  visual(r, s, source, target, "status");
  return true;
}
function hit(
  r: SkillRuntime,
  s: ActiveSkill,
  a: CombatActor,
  t: CombatActor,
  nav: Navigation,
  damage = s.damage,
  poison = false,
  triggered = false,
): void {
  const prior = t.hp;
  applyCombatHit(r.combat, a, t, nav, {
    damage,
    element: poison ? "poison" : s.element,
    guaranteed: poison || s.precise === true || s.element !== "physical",
    ...(s.stagger && !poison && !triggered ? { stagger: true } : {}),
    origin: triggered ? "proc" : poison ? "dot" : "skill",
    ...(triggered ? { scalePower: false } : {}),
    skill: s.id,
  });
  if (t.hp < prior) {
    visual(r, s, a, t, "hit");
    if (!poison) applyStatus(r, s, a, t);
  }
}
/** Stable geometry, ID tie breaks, LOS and faction filtering for all area shapes. */
export function skillTargets(
  r: SkillRuntime,
  s: ActiveSkill,
  a: CombatActor,
  c: Cast,
  nav: Navigation,
): CombatActor[] {
  const origin = a.controller.walker.position;
  const eligible = r.combat.actors
    .filter(
      (t) =>
        t.hp > 0 &&
        t.id !== a.id &&
        enemies(a, t) &&
        segmentWalkable(nav, origin, t.controller.walker.position),
    )
    .sort(
      (x, y) =>
        dist(origin, x.controller.walker.position) -
          dist(origin, y.controller.walker.position) || x.id - y.id,
    );
  if (s.shape === "chain") {
    let current = eligible.find(
      (t) =>
        t.id === c.target &&
        dist(origin, t.controller.walker.position) <= s.range,
    );
    const out: CombatActor[] = [];
    while (current && out.length < s.maxTargets) {
      out.push(current);
      const point = current.controller.walker.position;
      current = eligible
        .filter(
          (t) =>
            !out.includes(t) &&
            dist(point, t.controller.walker.position) <= s.radius &&
            segmentWalkable(nav, point, t.controller.walker.position),
        )
        .sort(
          (x, y) =>
            dist(point, x.controller.walker.position) -
              dist(point, y.controller.walker.position) || x.id - y.id,
        )[0];
    }
    return out;
  }
  const length = Math.hypot(c.direction.x, c.direction.y),
    dx = c.direction.x / Math.max(length, 1e-9),
    dy = c.direction.y / Math.max(length, 1e-9);
  return eligible
    .filter((t) => {
      const p = t.controller.walker.position,
        x = p.x - origin.x,
        y = p.y - origin.y,
        d = Math.hypot(x, y),
        along = x * dx + y * dy,
        cross = Math.abs(x * dy - y * dx);
      if (s.shape === "melee") return t.id === c.target && d <= s.range;
      if (s.shape === "radial") return d <= s.radius;
      if (s.shape === "cone")
        return d <= s.range && along / Math.max(d, 1e-9) >= s.radius;
      if (s.shape === "line")
        return along >= 0 && along <= s.range && cross <= s.radius;
      return false;
    })
    .slice(0, s.maxTargets);
}
export function releaseSkill(
  r: SkillRuntime,
  s: ActiveSkill,
  a: CombatActor,
  c: Cast,
  nav: Navigation,
): void {
  visual(r, s, a, null, "release", {
    x: a.controller.walker.position.x + c.direction.x,
    y: a.controller.walker.position.y + c.direction.y,
  });
  if (s.shape === "projectile") {
    const start = a.controller.walker.position,
      d = Math.hypot(c.direction.x, c.direction.y),
      end = {
        x: start.x + (c.direction.x / d) * s.range,
        y: start.y + (c.direction.y / d) * s.range,
      };
    const bolt = launchProjectile(r.effects.nextBolt++, a.id, start, end, 12);
    bolt.remaining = Math.ceil((s.range / 12) * 60);
    r.effects.bolts.push({
      ...bolt,
      definition: s,
      ...(s.piercing ? { hitActors: [] } : {}),
      skill: s.id,
      damage: s.damage,
      element: s.element,
      radius: s.radius,
    });
  } else if (s.shape === "self") {
    const allies = r.combat.actors
      .filter(
        (t) =>
          t.hp > 0 &&
          !enemies(a, t) &&
          dist(a.controller.walker.position, t.controller.walker.position) <=
            s.radius &&
          segmentWalkable(
            nav,
            a.controller.walker.position,
            t.controller.walker.position,
          ),
      )
      .sort((x, y) => x.id - y.id)
      .slice(0, s.maxTargets);
    for (const t of allies) applyStatus(r, s, a, t);
  } else {
    let previous = a;
    for (const t of skillTargets(r, s, a, c, nav)) {
      hit(r, s, a, t, nav);
      if (s.shape === "chain") visual(r, s, previous, t, "release");
      previous = t;
    }
  }
}
export function stepStatuses(r: SkillRuntime, nav: Navigation): void {
  const tick = r.combat.tick;
  r.effects.statuses = r.effects.statuses.filter((t) => {
    const a = r.combat.actors.find((a) => a.id === t.actor),
      source = r.combat.actors.find((a) => a.id === t.source),
      s = r.definitions.find((s) => s.id === t.skill);
    if (!a || a.hp <= 0 || !s || s.kind !== "active") return false;
    if (tick > t.expires) {
      visual(r, s, a, a, "expire");
      return false;
    }
    if (t.kind === "poison" && tick >= t.next && source && source.hp > 0) {
      hit(r, s, source, a, nav, t.magnitude, true, t.triggered ?? false);
      t.next += t.interval;
    }
    if (tick === t.expires) visual(r, s, a, a, "expire");
    return tick < t.expires;
  });
  const trackContext =
    r.combat.experience.skills.classId !== null ||
    !!r.combat.hitTrace ||
    r.combat.actors.some((a) => a.itemRules);
  for (const a of r.combat.actors) {
    r.effects.bases[a.id] ??= { ...(a.movement ?? MOVEMENT) };
    const base = r.effects.bases[a.id]!,
      statuses = r.effects.statuses.filter((t) => t.actor === a.id),
      slow = statuses.find((t) => t.kind === "slow")?.magnitude ?? 0;
    if (trackContext) a.effectStatuses = statuses.map((t) => t.kind);
    a.movement = {
      ...base,
      walkSpeed: base.walkSpeed * (1 - slow),
      runSpeed: base.runSpeed * (1 - slow),
    };
    a.powerMultiplier =
      1 + (statuses.find((t) => t.kind === "power")?.magnitude ?? 0);
  }
}
export function stepSkillBolts(r: SkillRuntime, nav: Navigation): void {
  r.effects.bolts = r.effects.bolts.filter((p) => {
    const source = r.combat.actors.find((a) => a.id === p.source),
      s = p.definition ?? r.definitions.find((s) => s.id === p.skill);
    if (
      !source ||
      source.hp <= 0 ||
      !s ||
      s.kind !== "active" ||
      --p.remaining < 0
    )
      return false;
    const end = {
      x: p.position.x + p.velocity.x,
      y: p.position.y + p.velocity.y,
    };
    if (!segmentWalkable(nav, p.position, end)) return false;
    const candidates = r.combat.actors
      .filter(
        (a) => a.hp > 0 && enemies(source, a) && !p.hitActors?.includes(a.id),
      )
      .map((a) => ({
        a,
        t: projectileContact(
          p.position,
          end,
          a.controller.walker.position,
          p.radius,
        ),
      }))
      .filter((x): x is { a: CombatActor; t: number } => x.t !== null)
      .sort((x, y) => x.t - y.t || x.a.id - y.a.id);
    for (const candidate of candidates) {
      hit(r, s, source, candidate.a, nav, p.damage);
      if (!s.piercing) return false;
      p.hitActors!.push(candidate.a.id);
      if (p.hitActors!.length >= s.piercing) return false;
    }
    p.position = end;
    return true;
  });
}
