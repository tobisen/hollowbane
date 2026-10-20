import { expect, it } from "vitest";
import { WorldSession } from "./world-session";
import { discoveryCell } from "./world-discovery";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { validateExploration } from "./world-save";
import { layoutFingerprint } from "./world-layout";
it.each(["haunted-forest", "forgotten-graveyard", "ancient-crypt"] as const)(
  "reveals bounded cells in %s and keeps saves/layout identity intact",
  (area) => {
    const world = new WorldSession(undefined, 42, 2, area),
      s = createInventorySession();
    const p = world.travel.layout.spawn,
      t = world.travel.layout.map.terrain;
    expect(world.discovery.cells).toEqual([]);
    expect(world.reveal(p)).toBe(true);
    const initial = [...world.discovery.cells];
    expect(initial).toContain(discoveryCell(t, p));
    expect(initial.length).toBeLessThanOrEqual(49);
    expect(initial.length).toBeLessThan(t.cells.length);
    expect(world.reveal(p)).toBe(false);
    expect(world.discoveryRevision).toBe(1);
    const c = world.containers[0]!;
    expect(world.reveal(c.position)).toBe(true);
    expect(world.discovery.cells.length).toBeGreaterThan(initial.length);
    s.exploration = world.capture(c.position, s.loot);
    expect(
      s.exploration.areas
        .filter((a) => a.id !== area)
        .every((a) => a.discovery!.cells.length === 0),
    ).toBe(true);
    const restored = new WorldSession(
      deserializeCharacter(serializeCharacter(s)).exploration,
    );
    expect(restored.discovery).toEqual(world.discovery);
    expect(restored.reveal(c.position)).toBe(false);
    expect(restored.discovery.fingerprint).toBe(
      layoutFingerprint(world.travel.layout),
    );
    const other = new WorldSession(undefined, 43, 2, area);
    expect(other.discovery.cells).toEqual([]);
    expect(other.discovery.fingerprint).not.toBe(world.discovery.fingerprint);
    for (const change of [
      (v: typeof s.exploration) => {
        v!.areas.find((a) => a.id === area)!.discovery!.fingerprint = "old";
      },
      (v: typeof s.exploration) => {
        v!.areas.find((a) => a.id === area)!.discovery!.cells.push(initial[0]!);
      },
      (v: typeof s.exploration) => {
        v!.areas.find((a) => a.id === area)!.discovery!.cells = [
          t.cells.length,
        ];
      },
      (v: typeof s.exploration) => {
        v!.contentVersion = 1;
      },
      (v: typeof s.exploration) => {
        v!.seed = 43;
      },
    ]) {
      const v = structuredClone(s.exploration);
      change(v);
      expect(() => validateExploration(v)).toThrow();
    }
  },
);
it("explicitly migrates pre-discovery versions without revealing unrelated cells", () => {
  const w = new WorldSession(),
    s = createInventorySession();
  w.reveal(w.travel.layout.spawn);
  const snapshot = w.capture(w.travel.layout.spawn, s.loot);
  for (const version of [1, 2] as const) {
    const legacy = structuredClone(snapshot);
    legacy.version = version;
    delete legacy.expedition;
    delete legacy.dialogue;
    delete legacy.quests;
    for (const a of legacy.areas) delete a.discovery;
    if (version === 1) delete legacy.containers;
    const restored = new WorldSession(validateExploration(legacy));
    expect(restored.discovery.cells).toEqual([]);
    expect(layoutFingerprint(restored.travel.layout)).toBe(
      layoutFingerprint(w.travel.layout),
    );
  }
});
