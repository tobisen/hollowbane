import { controllerPage, installControllerUI } from "./rendering/controller-ui";
import { controllerInput } from "./rendering/controller-input";
controllerInput.start();
import "./style.css";
const query = new URLSearchParams(location.search);
// Slot play accepts only the normal world route. Developer modifiers can never
// operate on a real character, even when appended to a copied URL.
const invalidCharacterRoute =
  query.has("character") &&
  (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    query.get("character") ?? "",
  ) ||
    query.get("world") !== "1" ||
    query.getAll("character").length !== 1 ||
    query.getAll("world").length !== 1 ||
    [...query.keys()].some((key) => key !== "character" && key !== "world"));
if (invalidCharacterRoute) {
  const { startMainMenu } = await import("./rendering/main-menu");
  await startMainMenu(
    "This character link includes unsupported options. Choose a character from the menu; no save was loaded.",
  );
} else if (query.has("controller")) {
  controllerPage();
} else if (
  query.has("world") ||
  query.has("combat") ||
  query.has("monsters") ||
  query.has("skills") ||
  query.has("polish") ||
  query.has("loot") ||
  query.has("inventory") ||
  (query.get("developer") === "1" && query.has("classLab"))
) {
  await import("./rendering/combat.css");
  const { startCombatArena } = await import("./rendering/combat-arena");
  startCombatArena(
    query.has("monsters") ||
      ((query.has("loot") || query.has("inventory")) &&
        !query.has("training")) ||
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
} else if (
  ["cloister", "metrics", "quality", "noMist"].some((key) => query.has(key))
) {
  await import("./prototype.css");
  const { startPrototype } = await import("./rendering/prototype");
  startPrototype();
} else {
  const { startMainMenu } = await import("./rendering/main-menu");
  await startMainMenu();
}

if (!document.querySelector("main.main-menu")) installControllerUI();
