import { controllerPage, installControllerUI } from "./rendering/controller-ui";
import { controllerInput } from "./rendering/controller-input";
controllerInput.start();
import "./style.css";
const query = new URLSearchParams(location.search);
if (query.has("controller")) {
  controllerPage();
} else if (
  query.has("combat") ||
  query.has("monsters") ||
  query.has("skills") ||
  query.has("polish") ||
  query.has("loot")
) {
  await import("./rendering/combat.css");
  const { startCombatArena } = await import("./rendering/combat-arena");
  startCombatArena(
    query.has("monsters") ||
      (query.has("loot") && !query.has("training")) ||
      (query.has("polish") && !query.has("training") && !query.has("showcase")),
  );
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

installControllerUI();
