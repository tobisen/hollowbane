import { canTradeAtCamp } from "./camp-merchant";
import { newCampStash, validateCampStash } from "./camp-stash-state";
import { addGrid, removeGrid, type InventoryResult } from "./inventory-grid";
import {
  reserveOwned,
  validateSession,
  type InventorySession,
} from "./inventory-world";

export interface StashIntent {
  kind: "store" | "retrieve";
  id: string;
  expectedRevision: number;
  expectedStashRevision: number;
  position?: { x: number; y: number };
}
/** Prepare both grids and the ownership reservation before committing either side. */
export function transferCampStash(
  session: InventorySession,
  intent: StashIntent,
  alive = true,
  idle = true,
): InventoryResult<InventorySession> {
  const w = session.exploration;
  // Orren keeps both camp services; proximity/life/idle requirements are identical.
  if (!w || w.version !== 6 || !canTradeAtCamp(w.area, w.position, alive, idle))
    return {
      ok: false,
      reason: "Return safely to Orren Thale to use your camp stash.",
    };
  try {
    validateSession(session);
    const stash = validateCampStash(w.stash ?? newCampStash());
    if (
      intent.expectedRevision !== session.character.revision ||
      intent.expectedStashRevision !== stash.revision
    )
      return { ok: false, reason: "Storage changed; select the item again." };
    if (
      session.character.revision >= Number.MAX_SAFE_INTEGER ||
      stash.revision >= Number.MAX_SAFE_INTEGER
    )
      return {
        ok: false,
        reason: "Storage revision limit reached; item retained.",
      };
    if (intent.kind !== "store" && intent.kind !== "retrieve")
      return { ok: false, reason: "Unknown storage intent." };
    const store = intent.kind === "store";
    const source = store ? session.character.grid : stash.grid;
    const destination = store ? stash.grid : session.character.grid;
    const removed = removeGrid(source, intent.id);
    if (!removed.ok)
      return {
        ok: false,
        reason: store
          ? "Choose a backpack item; unequip gear before storing."
          : "That item is not in your camp stash.",
      };
    const added = addGrid(
      destination,
      removed.value.entry.item,
      intent.position,
    );
    if (!added.ok)
      return {
        ok: false,
        reason: "Destination full or invalid placement; both grids unchanged.",
      };
    const candidate = reserveOwned({
      ...session,
      character: {
        ...session.character,
        revision: session.character.revision + 1,
        grid: store ? removed.value.grid : added.value,
      },
      exploration: {
        ...w,
        stash: {
          version: 1,
          revision: stash.revision + 1,
          grid: store ? added.value : removed.value.grid,
        },
      },
    });
    validateSession(candidate);
    return { ok: true, value: candidate };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Transfer rejected; both grids unchanged.",
    };
  }
}
