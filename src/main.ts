import { controllerInput } from "./rendering/controller-input";
controllerInput.start();
import "./style.css";
const query = new URLSearchParams(location.search);
if (query.has("combat")) {
  await import("./rendering/combat.css");
  const { startCombatArena } = await import("./rendering/combat-arena");
  startCombatArena();
} else if (query.has("gallery")) {
  const { startGallery } = await import("./rendering/gallery");
  await startGallery();
} else if (query.has("engine")) {
  const engine = query.get("engine") === "3" ? "3" : "4";
  const Phaser =
    engine === "3"
      ? (await import("phaser3")).default
      : (await import("phaser")).default;
  const { startObservatory } = await import("./rendering/observatory");
  startObservatory(Phaser, engine);
} else {
  await import("./prototype.css");
  const { startPrototype } = await import("./rendering/prototype");
  startPrototype();
}
