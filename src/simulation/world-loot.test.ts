import { it, expect } from "vitest";
import { createCombat, ARENA_NAV, type CombatEvent } from "./combat";
import {
  createLootWorld,
  consumeLootDeaths,
  placeLoot,
  canInspectDrop,
  identifyWorldDrop,
  selectLoot,
} from "./world-loot";
import { generateLoot } from "./loot";
import { fromGround, onGround, canWalk } from "../world/navigation";
function item() {
  for (let sequence = 0; sequence < 1000; sequence++) {
    const i = generateLoot({
      seed: 42,
      sequence,
      monsterLevel: 12,
      areaLevel: 12,
      table: "court",
    });
    if (i) return i;
  }
  throw Error();
}
it("consumes dead non-player events once in stable order without combat RNG mutation", () => {
  const c = createCombat(),
    l = createLootWorld();
  c.actors.slice(1).forEach((a) => (a.hp = 0));
  const events: CombatEvent[] = c.actors.map((a) => ({
    kind: "death",
    actor: 0,
    target: a.id,
    tick: 1,
  }));
  const seed = c.seed;
  consumeLootDeaths(l, c, ARENA_NAV, events.reverse());
  const copy = structuredClone(l);
  consumeLootDeaths(l, c, ARENA_NAV, events);
  expect(l).toEqual(copy);
  expect(l.attempts).toBe(c.actors.length - 1);
  expect(c.seed).toBe(seed);
  const other = createLootWorld();
  consumeLootDeaths(other, c, ARENA_NAV, [...events].reverse());
  expect(other).toEqual(l);
});
it("spaces drops on walkable ground and bounds saturation safely", () => {
  const l = createLootWorld(),
    i = item(),
    p = fromGround({ x: 750, y: 560 });
  for (let n = 0; n < 30; n++)
    placeLoot(l, { ...i, id: `test-${n}` }, p, 1, n, ARENA_NAV);
  expect(l.drops).toHaveLength(30);
  for (const a of l.drops) {
    expect(canWalk(ARENA_NAV, a.position)).toBe(true);
    for (const b of l.drops.filter((b) => b !== a)) {
      const p = onGround(a.position),
        q = onGround(b.position);
      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(26);
    }
  }
  l.capacity = 30;
  expect(placeLoot(l, i, p, 1, 99, ARENA_NAV)).toBeNull();
  expect(l.blocked).toBe(1);
});
it("inspection and identification require reachable proximity; selection wraps", () => {
  const l = createLootWorld(),
    p = fromGround({ x: 750, y: 560 });
  const d = placeLoot(l, item(), p, 1, 1, ARENA_NAV)!;
  expect(canInspectDrop(d, p, ARENA_NAV)).toBe(true);
  expect(identifyWorldDrop(d, fromGround({ x: 250, y: 280 }), ARENA_NAV)).toBe(
    false,
  );
  expect(identifyWorldDrop(d, p, ARENA_NAV)).toBe(true);
  expect(selectLoot(l, null, 1)).toBe(d.item.id);
  expect(selectLoot(l, d.item.id, -1)).toBe(d.item.id);
  expect(
    canInspectDrop(d, p, {
      ...ARENA_NAV,
      obstacles: [{ x: 750, y: 560, rx: 20, ry: 20 }],
    }),
  ).toBe(false);
});
