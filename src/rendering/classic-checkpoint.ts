import {
  InventoryStorage,
  type InventoryCheckpoint,
} from "./inventory-storage";
import type { Navigation } from "../world/navigation";
import type { ClassId } from "../simulation/character-classes";
import { newCharacter } from "../simulation/new-character";
import { WorldSession } from "../simulation/world-session";
import { classicCampaignLayout } from "../simulation/classic-act1-layout";
import { CharacterStorage } from "./character-storage";
import { characterId } from "../simulation/character-registry";
import { CLASS_IDS } from "../simulation/character-classes";
import {
  reserveOwned,
  type InventorySession,
} from "../simulation/inventory-world";

/** Owner IDs select isolated copies; production records are read-only here. */
export function classicCheckpoint(
  nav: Navigation,
  classId: ClassId,
  owner?: string,
): InventoryCheckpoint {
  if (owner) characterId(owner);
  const storage = new InventoryStorage(
    nav,
    owner
      ? `hollowbane-classic-act1-owner-v1-${owner}`
      : `hollowbane-classic-act1-v1-${classId}`,
  );
  return {
    async load() {
      let session: InventorySession | undefined;
      if (owner) {
        const characters = new CharacterStorage();
        try {
          const original = await characters.load(owner);
          if (original.kind !== "valid")
            throw Error(
              "Selected character requires explicit recovery in the normal menu",
            );
          if (!CLASS_IDS.includes(original.metadata.classId as ClassId))
            throw Error(
              "Choose a Warrior, Sorcerer or Ranger for Classic Act 1",
            );
          session = original.session;
        } finally {
          characters.close();
        }
      }
      const result = await storage.load();
      if (result.kind !== "empty") return result;
      session ??= newCharacter(classId);
      const stash = session.exploration?.stash;
      // World facts belong to the new map. Keep actual equipment/progression,
      // stash and the loot stream, never normal-area drops or death identities.
      session.loot = { ...session.loot, drops: [], deaths: new Set() };
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
      if (stash) session.exploration.stash = stash;
      return {
        kind: "valid",
        session: reserveOwned(session),
        revision: result.revision,
      };
    },
    save: (session) => storage.save(session),
    recover: () => storage.recover(),
    accepted: async () => {
      if (owner) localStorage.setItem("hollowbane.classic-act1.recent", owner);
    },
    lock: () => storage.lock(),
    close: () => storage.close(),
  };
}
