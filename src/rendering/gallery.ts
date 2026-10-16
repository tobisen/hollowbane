export async function startGallery(): Promise<void> {
  document.title = "Hollowbane · Asset atelier";
  const root = document.querySelector("main")!;
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / ART ATELIER</p><h1>The Cloister Wanderer</h1><p>Eight directions. Two idle frames and six walking frames per direction. Original reference kit for G1 review.</p></header><nav><a href="./">Return to the cloister</a><button id="gallery-motion" aria-pressed="false">Play walk cycle</button></nav><section id="direction-gallery" class="direction-gallery" aria-label="Eight direction animation review"></section><p class="gallery-note">Foot pivot: 64,112 · 128px cells · fixed scale · transparent alpha · generated sources preserved</p>`;
  const atlas = new Image();
  atlas.src = `${import.meta.env.BASE_URL}assets/wanderer.webp`;
  await atlas.decode();
  const directions = [
    "SOUTH",
    "SOUTHWEST",
    "WEST",
    "NORTHWEST",
    "NORTH",
    "NORTHEAST",
    "EAST",
    "SOUTHEAST",
  ];
  const canvases = directions.map((name) => {
    const figure = document.createElement("figure"),
      canvas = document.createElement("canvas"),
      caption = document.createElement("figcaption");
    canvas.width = 128;
    canvas.height = 128;
    canvas.setAttribute("aria-label", `${name} character animation`);
    caption.textContent = name;
    figure.append(canvas, caption);
    document.querySelector("#direction-gallery")!.append(figure);
    return canvas;
  });
  let moving = false;
  const button = document.querySelector<HTMLButtonElement>("#gallery-motion")!;
  button.onclick = () => {
    moving = !moving;
    button.setAttribute("aria-pressed", String(moving));
    button.textContent = moving ? "Pause walk cycle" : "Play walk cycle";
  };
  const render = (time: number) => {
    const col = moving ? 2 + (Math.floor(time / 125) % 6) : 0;
    canvases.forEach((canvas, row) => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 128, 128);
      ctx.drawImage(atlas, col * 128, row * 128, 128, 128, 0, 0, 128, 128);
      ctx.strokeStyle = "rgba(205,176,122,.22)";
      ctx.beginPath();
      ctx.moveTo(56, 112);
      ctx.lineTo(72, 112);
      ctx.stroke();
    });
    requestAnimationFrame(render);
  };
  render(0);
  document.documentElement.dataset.galleryReady = "true";
}
