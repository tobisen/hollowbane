import { RUNE_CONTENT } from "./rune-content";
import {
  ownedItem,
  validateCharacter,
  type CharacterInventory,
} from "./equipment";
import { addGrid, type InventoryResult } from "./inventory-grid";
import { validateGeneratedItem } from "./item-save";
import { SOCKET_CONTENT } from "./socket-content";
import type { GeneratedItem } from "./loot";
function replace(
  c: CharacterInventory,
  item: GeneratedItem,
): CharacterInventory {
  const next = {
    ...c,
    grid: {
      ...c.grid,
      items: c.grid.items.map((e) =>
        e.item.id === item.id ? { ...e, item } : e,
      ),
    },
    equipment: { ...c.equipment },
    revision: c.revision + 1,
  };
  for (const slot of Object.keys(
    next.equipment,
  ) as (keyof typeof next.equipment)[])
    if (next.equipment[slot]?.id === item.id) next.equipment[slot] = item;
  return next;
}
function finish(c: CharacterInventory): InventoryResult<CharacterInventory> {
  try {
    validateCharacter(c);
    return { ok: true, value: c };
  } catch {
    return {
      ok: false,
      reason: "Socket operation violates ownership, level or revision limits",
    };
  }
}
/** Append only; bag source removed exactly once on a validated candidate. No random rolls. */
export function insertSocket(
  c: CharacterInventory,
  hostId: string,
  componentId: string,
): InventoryResult<CharacterInventory> {
  validateCharacter(c);
  const host = ownedItem(c, hostId),
    component = c.grid.items.find((e) => e.item.id === componentId)?.item;
  if (
    !host ||
    !component ||
    hostId === componentId ||
    !host.identified ||
    !component.identified ||
    !(
      SOCKET_CONTENT.gems.some((g) => g.id === component.base) ||
      RUNE_CONTENT.components.some((r) => r.id === component.base)
    ) ||
    !(host.socketCapacity! > (host.embedded?.length ?? 0))
  )
    return {
      ok: false,
      reason:
        "Choose an identified socketed host and a compatible bag component",
    };
  const next = { ...host, embedded: [...(host.embedded ?? []), component] };
  try {
    validateGeneratedItem(next);
  } catch {
    return { ok: false, reason: "Component is incompatible with this host" };
  }
  const candidate = replace(
    {
      ...c,
      grid: {
        ...c.grid,
        items: c.grid.items.filter((e) => e.item.id !== componentId),
      },
    },
    next,
  );
  return finish(candidate);
}
/** Extract ALL components intact, in original order; fail unchanged unless every one fits. */
export function extractSockets(
  c: CharacterInventory,
  hostId: string,
): InventoryResult<CharacterInventory> {
  validateCharacter(c);
  const host = ownedItem(c, hostId);
  if (!host?.embedded?.length)
    return { ok: false, reason: "No embedded components" };
  let grid = c.grid;
  for (const component of host.embedded) {
    const result = addGrid(grid, component);
    if (!result.ok)
      return {
        ok: false,
        reason: "Make room for all socket contents before extraction",
      };
    grid = result.value;
  }
  return finish(replace({ ...c, grid }, { ...host, embedded: [] }));
}
