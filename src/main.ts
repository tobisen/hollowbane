import "./style.css";
import { startObservatory } from "./rendering/observatory";
const engine =
  new URLSearchParams(location.search).get("engine") === "3" ? "3" : "4";
const Phaser =
  engine === "3"
    ? (await import("phaser3")).default
    : (await import("phaser")).default;
startObservatory(Phaser, engine);
