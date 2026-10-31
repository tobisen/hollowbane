import {
  InventoryStorage,
  type InventoryCheckpoint,
} from "./inventory-storage";
import type { Navigation } from "../world/navigation";
import type { ClassId } from "../simulation/character-classes";
import { newCharacter } from "../simulation/new-character";
import { WorldSession } from "../simulation/world-session";
import { classicCampaignLayout } from "../simulation/classic-act1-layout";

/** Separate database per candidate class. Never receives a production owner ID. */
export function classicCheckpoint(
  nav: Navigation,
  classId: ClassId,
): InventoryCheckpoint {
  const storage = new InventoryStorage(
    nav,
    `hollowbane-classic-act1-v1-${classId}`,
  );
  return {
    async load() {
      const result = await storage.load();
      if (result.kind !== "empty") return result;
      const session = newCharacter(classId);
      const world = new WorldSession(
        undefined,
        42,
        2,
        "haunted-forest",
        classicCampaignLayout,
      );
      session.exploration = world.capture(
        world.travel.state.position,
        session.loot,
      );
      return { kind: "valid", session, revision: result.revision };
    },
    save: (session) => storage.save(session),
    recover: () => storage.recover(),
    accepted: async () => {},
    lock: () => storage.lock(),
    close: () => storage.close(),
  };
}
