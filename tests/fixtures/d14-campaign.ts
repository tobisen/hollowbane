import { createD12Fixture } from "./d12-balance";
import type { ClassId } from "../../src/simulation/character-classes";
/** Earned D06/D08/D12 domain provenance; normal travel attunes two visited anchors.
 * This constructs a pre-game save, never a live browser teleport/completion hook. */
export function createD14Fixture(classId: ClassId) {
  const f = createD12Fixture(classId),
    approach = { ...f.world.actors[0]!.controller.walker.position };
  const attune = () => {
    f.idleAt(f.session.travel.layout.spawn);
    if (
      !f.session
        .attuneWaypoint(f.session.travel.layout.spawn, true, true, true)
        .includes("attuned")
    )
      throw Error("D14 attunement");
  };
  attune();
  for (const exit of ["graveyard", "forest", "camp"]) f.travel(exit);
  attune();
  for (const exit of ["forest", "graveyard", "crypt"]) f.travel(exit);
  f.idleAt(approach);
  return f;
}
