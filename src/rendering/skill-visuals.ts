import type Phaser from "phaser";
import type { SkillRuntime } from "../simulation/skills";
import { activeSkill } from "../simulation/skills";
import {
  onGround,
  type Navigation,
  segmentWalkable,
} from "../world/navigation";
import { worldToScreen, type Point } from "../world/isometric";
export const SPELL_STYLE: Readonly<
  Record<string, { color: number; core: number; life: number }>
> = {
  "ember-lance": { color: 0xf79545, core: 0xffedaf, life: 14 },
  "rime-ring": { color: 0x78cdda, core: 0xe3ffff, life: 24 },
  "storm-thread": { color: 0xa9a2f2, core: 0xf3eeff, life: 15 },
  "iron-fan": { color: 0xc9ab75, core: 0xffe6ba, life: 13 },
  "oath-echo": { color: 0xd7b868, core: 0xffedb2, life: 28 },
  "briar-edge": { color: 0x8eb853, core: 0xd8efa2, life: 18 },
};
export function conePoints(
  origin: Point,
  direction: Point,
  range: number,
  cosine: number,
): Point[] {
  const angle = Math.atan2(direction.y, direction.x),
    half = Math.acos(cosine);
  return [
    onGround(origin),
    ...Array.from({ length: 13 }, (_, i) =>
      onGround({
        x: origin.x + Math.cos(angle - half + (i / 12) * 2 * half) * range,
        y: origin.y + Math.sin(angle - half + (i / 12) * 2 * half) * range,
      }),
    ),
  ];
}
function polygon(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  color: number,
  alpha: number,
): void {
  if (!points[0]) return;
  g.lineStyle(1, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) g.lineTo(p.x, p.y);
  g.closePath().strokePath();
}
const ellipse = (
  g: Phaser.GameObjects.Graphics,
  p: Point,
  r: number,
  color: number,
  alpha: number,
) =>
  g.lineStyle(1.5, color, alpha).strokeEllipse(p.x, p.y, r * 181.02, r * 90.51);
export interface SpellVisualStats {
  bolts: number;
  events: number;
  statuses: number;
  phase: string;
  skill: string;
}
/** Bounded original procedural geometry. No emitters, shaders, lights or texture uploads. */
export function drawSkillVisuals(
  g: Phaser.GameObjects.Graphics,
  r: SkillRuntime,
  selected: string,
  direction: Point,
  nav: Navigation,
): SpellVisualStats {
  const tick = r.combat.tick,
    player = r.combat.actors[0]!,
    s = activeSkill(r, selected)!,
    style = SPELL_STYLE[selected]!,
    origin = player.controller.walker.position,
    p = onGround(origin),
    d = Math.hypot(direction.x, direction.y),
    unit = {
      x: direction.x / Math.max(d, 1e-9),
      y: direction.y / Math.max(d, 1e-9),
    };
  if (player.hp > 0 && s && style) {
    if (s.shape === "radial" || s.shape === "self")
      ellipse(g, p, s.radius, style.color, 0.25);
    else if (s.shape === "cone")
      polygon(
        g,
        conePoints(origin, unit, s.range, s.radius),
        style.color,
        0.45,
      );
    else {
      let last = origin;
      for (let i = 1; i <= 12; i++) {
        const end = {
          x: origin.x + (unit.x * s.range * i) / 12,
          y: origin.y + (unit.y * s.range * i) / 12,
        };
        if (!segmentWalkable(nav, last, end)) break;
        const a = onGround(last),
          b = onGround(end);
        if (i % 2)
          g.lineStyle(1, style.color, 0.5).lineBetween(a.x, a.y, b.x, b.y);
        last = end;
      }
      const end = onGround(last);
      g.lineStyle(1, style.color, 0.7).strokeEllipse(end.x, end.y, 14, 7);
    }
  }
  for (const u of r.users) {
    if (!u.cast) continue;
    const a = r.combat.actors.find((a) => a.id === u.actor);
    if (!a || a.hp <= 0) continue;
    const palette = SPELL_STYLE[u.cast.skill]!,
      q = onGround(a.controller.walker.position),
      t = a.controller.timeline;
    const progress =
      t.phase === "windup"
        ? 1 - t.remaining / t.timing.windup
        : t.phase === "recovery"
          ? t.remaining / t.timing.recovery
          : 1;
    g.lineStyle(1.5, palette.color, 0.2 + 0.5 * progress).strokeEllipse(
      q.x,
      q.y,
      20 + 18 * progress,
      10 + 9 * progress,
    );
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + tick * 0.025,
        x = q.x + Math.cos(angle) * (17 + progress * 7),
        y = q.y + Math.sin(angle) * 10;
      g.lineStyle(1, palette.core, 0.4 * progress).lineBetween(
        x,
        y - 4,
        x,
        y + 2,
      );
    }
  }
  const bolts = r.effects.bolts.slice(0, 96);
  for (const b of bolts) {
    const q = onGround(b.position),
      v = worldToScreen(b.velocity),
      n = Math.hypot(v.x, v.y),
      dx = v.x / n,
      dy = v.y / n,
      px = -dy,
      py = dx;
    g.fillStyle(0xb64d24, 0.45).fillTriangle(
      q.x - dx * 30 + px * 5,
      q.y - 24 - dy * 30 + py * 5,
      q.x + dx * 7,
      q.y - 24 + dy * 7,
      q.x - dx * 30 - px * 5,
      q.y - 24 - dy * 30 - py * 5,
    );
    g.fillStyle(0xf7a650, 0.9)
      .fillTriangle(
        q.x - dx * 19 + px * 4,
        q.y - 24 - dy * 19 + py * 4,
        q.x + dx * 10,
        q.y - 24 + dy * 10,
        q.x - dx * 19 - px * 4,
        q.y - 24 - dy * 19 - py * 4,
      )
      .fillStyle(0xffeab2, 1)
      .fillCircle(q.x, q.y - 24, 3);
  }
  const events = r.effects.events
    .filter(
      (e) =>
        tick - e.tick < SPELL_STYLE[e.skill]!.life &&
        e.kind !== "expire" &&
        e.kind !== "status",
    )
    .slice(-48);
  for (const e of events) {
    const palette = SPELL_STYLE[e.skill]!,
      age = tick - e.tick,
      fade = 1 - age / palette.life,
      q = onGround(e.kind === "hit" ? e.to : e.from),
      end = onGround(e.to),
      release = e.kind === "release";
    if (e.skill === "rime-ring" && release) {
      const radius = activeSkill(r, e.skill)!.radius;
      ellipse(
        g,
        q,
        radius * (0.72 + (0.28 * age) / palette.life),
        palette.color,
        fade,
      );
      ellipse(g, q, radius, palette.core, fade * 0.65);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6,
          x = q.x + Math.cos(a) * radius * 86,
          y = q.y + Math.sin(a) * radius * 43;
        g.fillStyle(palette.color, fade * 0.9).fillTriangle(
          x - 3,
          y + 4,
          x + 3,
          y + 4,
          x,
          y - 12 * fade - 3,
        );
      }
    } else if (e.skill === "storm-thread" && release && e.target !== null) {
      const dx = end.x - q.x,
        dy = end.y - q.y,
        n = Math.hypot(dx, dy);
      let last = { x: q.x, y: q.y - 28 };
      for (let i = 1; i <= 7; i++) {
        const offset = i === 7 ? 0 : (i % 2 ? 1 : -1) * 9 * fade,
          next = {
            x: q.x + (dx * i) / 7 - (dy / Math.max(1, n)) * offset,
            y: q.y - 28 + (dy * i) / 7 + (dx / Math.max(1, n)) * offset,
          };
        g.lineStyle(4, palette.color, fade * 0.3)
          .lineBetween(last.x, last.y, next.x, next.y)
          .lineStyle(1.5, palette.core, fade)
          .lineBetween(last.x, last.y, next.x, next.y);
        last = next;
      }
    } else if (e.skill === "iron-fan" && release) {
      const def = activeSkill(r, e.skill)!;
      polygon(
        g,
        conePoints(
          e.from,
          { x: e.to.x - e.from.x, y: e.to.y - e.from.y },
          def.range,
          def.radius,
        ),
        palette.color,
        fade * 0.9,
      );
      const v = worldToScreen({ x: e.to.x - e.from.x, y: e.to.y - e.from.y }),
        angle = Math.atan2(v.y, v.x);
      g.lineStyle(3, palette.core, fade)
        .beginPath()
        .arc(q.x, q.y - 26, 30 + age * 2, angle - 0.8, angle + 0.8)
        .strokePath();
    } else if (e.skill === "oath-echo" && release) {
      ellipse(g, q, Math.min(3, 0.5 + age * 0.15), palette.color, fade);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
          x = q.x + Math.cos(a) * 43,
          y = q.y + Math.sin(a) * 21;
        g.lineStyle(2, palette.core, fade).lineBetween(
          x,
          y - 8 * fade,
          x,
          y + 2,
        );
      }
    } else if (e.kind === "hit") {
      g.lineStyle(2, palette.core, fade).strokeEllipse(
        q.x,
        q.y - 26,
        8 + age * 2,
        8 + age * 1.5,
      );
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5,
          x = q.x + Math.cos(a) * (7 + age),
          y = q.y - 25 + Math.sin(a) * (7 + age);
        g.lineStyle(2, palette.color, fade).lineBetween(
          x,
          y,
          x + Math.cos(a) * 6,
          y + Math.sin(a) * 6,
        );
      }
    } else if (e.skill === "briar-edge") {
      const v = worldToScreen({ x: e.to.x - e.from.x, y: e.to.y - e.from.y }),
        n = Math.hypot(v.x, v.y);
      g.lineStyle(3, palette.color, fade).lineBetween(
        q.x,
        q.y - 25,
        q.x + (v.x / Math.max(1, n)) * 31,
        q.y - 25 + (v.y / Math.max(1, n)) * 20,
      );
    }
  }
  const statuses = r.effects.statuses.slice(0, 64);
  for (const st of statuses) {
    const a = r.combat.actors.find((a) => a.id === st.actor);
    if (!a || a.hp <= 0) continue;
    const q = onGround(a.controller.walker.position),
      color = SPELL_STYLE[st.skill]!.color;
    if (st.kind === "power") {
      g.lineStyle(1.5, color, 0.7)
        .strokeEllipse(q.x, q.y - 64, 18, 6)
        .lineBetween(q.x - 9, q.y - 64, q.x - 13, q.y - 69)
        .lineBetween(q.x + 9, q.y - 64, q.x + 13, q.y - 69);
    } else if (st.kind === "poison")
      for (let i = 0; i < 3; i++) {
        const phase = (tick + st.actor * 7 + i * 17) % 45;
        g.fillStyle(color, 0.65 * (1 - phase / 45)).fillCircle(
          q.x - 7 + i * 7,
          q.y - 9 - phase * 0.5,
          2,
        );
      }
    else
      g.lineStyle(1, color, 0.6)
        .lineBetween(q.x - 11, q.y, q.x - 6, q.y - 7)
        .lineBetween(q.x, q.y + 2, q.x + 3, q.y - 6)
        .lineBetween(q.x + 10, q.y, q.x + 14, q.y - 7);
  }
  return {
    bolts: bolts.length,
    events: events.length,
    statuses: statuses.length,
    phase: player.controller.timeline.phase,
    skill: r.users[0]?.cast?.skill ?? selected,
  };
}
