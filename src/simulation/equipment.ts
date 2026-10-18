import { itemTree } from "./item-ownership";
import {
  meetsEquipmentRequirements,
  type EquipmentRequirementContext,
} from "./equipment-requirements";
import {
  equipmentDefinition,
  EQUIP_SLOTS,
  type EquipSlot,
} from "./equipment-content";
import {
  createGrid,
  addGrid,
  canPlaceGrid,
  overlap,
  validateGrid,
  type InventoryGrid,
  type InventoryResult,
} from "./inventory-grid";
import { validateGeneratedItem } from "./item-save";
import type { GeneratedItem } from "./loot";
export interface CharacterInventory {
  grid: InventoryGrid;
  equipment: Partial<Record<EquipSlot, GeneratedItem>>;
  level: number;
  revision: number;
}
export function createCharacterInventory(
  level = 12,
  columns = 10,
  rows = 4,
): CharacterInventory {
  if (!Number.isInteger(level) || level < 1 || level > 99)
    throw Error("Invalid character level");
  return { grid: createGrid(columns, rows), equipment: {}, level, revision: 0 };
}
export function ownedItems(c: CharacterInventory): GeneratedItem[] {
  return [...c.grid.items.map((e) => e.item), ...Object.values(c.equipment)];
}
export function ownedItem(
  c: CharacterInventory,
  id: string,
): GeneratedItem | undefined {
  return ownedItems(c).find((i) => i.id === id);
}
export function compatible(
  item: GeneratedItem,
  slot: EquipSlot,
  level: number,
  requirements?: EquipmentRequirementContext,
): boolean {
  try {
    return (
      item.identified &&
      meetsEquipmentRequirements(item, level, requirements) &&
      equipmentDefinition(item).slots.includes(slot)
    );
  } catch {
    return false;
  }
}
export function validateCharacter(
  c: CharacterInventory,
  requirements?: EquipmentRequirementContext,
): void {
  if (
    !Number.isInteger(c.level) ||
    c.level < 1 ||
    c.level > 99 ||
    !Number.isSafeInteger(c.revision) ||
    c.revision < 0
  )
    throw Error("Invalid character");
  validateGrid(c.grid);
  const items = ownedItems(c);
  const tree = itemTree(items);
  if (new Set(tree.map((i) => i.id)).size !== tree.length)
    throw Error("Duplicate owned identity");
  items.forEach((i) => validateGeneratedItem(i));
  for (const [slot, item] of Object.entries(c.equipment))
    if (
      !EQUIP_SLOTS.includes(slot as EquipSlot) ||
      !compatible(item, slot as EquipSlot, c.level, requirements)
    )
      throw Error("Incompatible equipment");
  if (
    c.equipment.main &&
    equipmentDefinition(c.equipment.main).hands === 2 &&
    c.equipment.off
  )
    throw Error("Two-handed off-hand conflict");
}
function next(c: CharacterInventory): CharacterInventory {
  return {
    ...c,
    revision: c.revision + 1,
    grid: { ...c.grid, items: [...c.grid.items] },
    equipment: { ...c.equipment },
  };
}
export function equipItem(
  c: CharacterInventory,
  id: string,
  slot: EquipSlot,
  requirements?: EquipmentRequirementContext,
): InventoryResult<CharacterInventory> {
  const item = ownedItem(c, id);
  if (!item || !compatible(item, slot, c.level, requirements))
    return {
      ok: false,
      reason: "Unidentified, unmet requirement or incompatible slot",
    };
  if (c.equipment[slot] === item) return { ok: true, value: c };
  if (c.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  const candidate = next(c),
    source = c.grid.items.find((e) => e.item === item),
    sourceSlot = EQUIP_SLOTS.find((s) => c.equipment[s] === item);
  candidate.grid.items = candidate.grid.items.filter((e) => e.item !== item);
  if (sourceSlot) delete candidate.equipment[sourceSlot];
  const displaced: GeneratedItem[] = [];
  const stow = (s: EquipSlot) => {
    const old = candidate.equipment[s];
    if (old) {
      displaced.push(old);
      delete candidate.equipment[s];
    }
  };
  stow(slot);
  if (slot === "main" && equipmentDefinition(item).hands === 2) stow("off");
  if (
    slot === "off" &&
    candidate.equipment.main &&
    equipmentDefinition(candidate.equipment.main).hands === 2
  )
    stow("main");
  candidate.equipment[slot] = item;
  for (const old of displaced) {
    if (
      sourceSlot &&
      !candidate.equipment[sourceSlot] &&
      compatible(old, sourceSlot, c.level, requirements)
    ) {
      candidate.equipment[sourceSlot] = old;
      continue;
    }
    const atSource =
      source && canPlaceGrid(candidate.grid, old, source.x, source.y)
        ? { x: source.x, y: source.y }
        : undefined;
    const placed = atSource
      ? addGrid(candidate.grid, old, atSource)
      : addGrid(candidate.grid, old);
    if (!placed.ok)
      return { ok: false, reason: "Inventory full; equipment unchanged" };
    candidate.grid = placed.value;
  }
  try {
    validateCharacter(candidate, requirements);
  } catch {
    return { ok: false, reason: "Equipment conflict" };
  }
  return { ok: true, value: candidate };
}
export function unequipItem(
  c: CharacterInventory,
  slot: EquipSlot,
  point?: { x: number; y: number },
  requirements?: EquipmentRequirementContext,
): InventoryResult<CharacterInventory> {
  const item = c.equipment[slot];
  if (c.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  if (!item) return { ok: false, reason: "Empty equipment slot" };
  if (point) {
    const targets = c.grid.items.filter((e) => overlap({ item, ...point }, e));
    if (targets.length === 1) {
      const swapped = equipItem(c, targets[0]!.item.id, slot, requirements);
      if (!swapped.ok) return swapped;
      const moved = swapped.value.grid.items.find((e) => e.item === item);
      if (moved?.x === point.x && moved.y === point.y) return swapped;
      return { ok: false, reason: "Swap does not fit requested cells" };
    }
    if (targets.length > 1)
      return { ok: false, reason: "Cannot swap multiple items" };
  }
  const placed = point ? addGrid(c.grid, item, point) : addGrid(c.grid, item);
  if (!placed.ok)
    return {
      ok: false,
      reason: "Inventory full or invalid destination; equipment unchanged",
    };
  const candidate = next(c);
  candidate.grid = placed.value;
  delete candidate.equipment[slot];
  return { ok: true, value: candidate };
}

/** Reconcile level/stat reductions atomically. If every invalid item cannot fit,
 * reject the whole stat change; never delete, drop, or partially move equipment.
 */
export function reconcileEquipmentRequirements(
  c: CharacterInventory,
  level: number,
  requirements?: EquipmentRequirementContext,
): InventoryResult<CharacterInventory> {
  if (!Number.isSafeInteger(level) || level < 1 || level > 99)
    return { ok: false, reason: "Invalid character level" };
  if (c.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  const candidate = next(c);
  candidate.level = level;
  try {
    for (const slot of EQUIP_SLOTS) {
      const item = candidate.equipment[slot];
      if (!item || compatible(item, slot, level, requirements)) continue;
      const placed = addGrid(candidate.grid, item);
      if (!placed.ok)
        return {
          ok: false,
          reason: "Inventory full; stat change and equipment unchanged",
        };
      candidate.grid = placed.value;
      delete candidate.equipment[slot];
    }
    validateCharacter(candidate, requirements);
    return { ok: true, value: candidate };
  } catch {
    return {
      ok: false,
      reason: "Invalid equipment requirements; state unchanged",
    };
  }
}
