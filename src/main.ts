import "./style.css";
const query = new URLSearchParams(location.search);
if (query.has("gallery")) {
  const { startGallery } = await import("./rendering/gallery");
  await startGallery();
} else {
  const engine = query.get("engine") === "3" ? "3" : "4";
  const Phaser =
    engine === "3"
      ? (await import("phaser3")).default
      : (await import("phaser")).default;
  const { startObservatory } = await import("./rendering/observatory");
  startObservatory(Phaser, engine);
}
