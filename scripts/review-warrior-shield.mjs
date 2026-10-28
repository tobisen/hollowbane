// Assemble offline shield proofs with the exact approved body pixels. Never
// writes public assets; the supplied directory contains unapproved probes only.
import sharp from "sharp";
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

const directory = process.argv[2];
if (!directory) throw Error("Pass a completed shield probe directory");
const proof = JSON.parse(
  await readFile(join(directory, "shield.json"), "utf8"),
);
const folders = {
  movement: "warrior-directions",
  attacks: "warrior-attack-directions",
  abilities: "warrior-abilities",
  hit: "warrior-reactions",
  death: "warrior-death",
};
const manifests = Object.fromEntries(
  await Promise.all(
    Object.entries(folders).map(async ([key, folder]) => [
      key,
      JSON.parse(await readFile(`public/dev/${folder}/warrior.json`, "utf8")),
    ]),
  ),
);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const rendered = [];
const byName = new Map(proof.poses.map((pose) => [pose.name, pose]));
for (const pose of proof.poses) {
  if (pose.renderRequested === false) continue;
  const rasterPose = byName.get(pose.rasterAlias) ?? pose;
  const path = join(directory, `${rasterPose.name}-overlay.png`);
  try {
    await access(path);
  } catch {
    continue;
  }
  const manifest = manifests[pose.set];
  const view = manifest.views[pose.direction];
  const frame = view.frames[pose.ordinal];
  let body = await sharp(`public/dev/${folders[pose.set]}/${view.atlas}`)
    .extract({
      left: frame.x,
      top: frame.y,
      width: frame.width,
      height: frame.height,
    })
    .raw()
    .toBuffer();
  if (hash(body) !== frame.pixelSha256)
    throw Error(`Approved body hash mismatch: ${pose.name}`);
  await sharp(body, {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
    .png()
    .toFile(join(directory, `${pose.name}-original.png`));
  const cell = pose.set === "movement" ? 256 : manifest.cell;
  if (pose.bodyOverride)
    body = await sharp(join(directory, `${rasterPose.name}-body.png`))
      .resize(cell, cell)
      .raw()
      .toBuffer();
  const sourceCell =
    rasterPose.set === "movement" ? 256 : manifests[rasterPose.set].cell;
  const left = Math.round(pose.root[0] - rasterPose.root[0]);
  const top = Math.round(pose.root[1] - rasterPose.root[1]);
  const raster = async (input) =>
    sharp(input)
      .resize(sourceCell, sourceCell)
      .extend({
        left,
        top,
        right: frame.width - sourceCell - left,
        bottom: frame.height - sourceCell - top,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  const overlay = await raster(path);
  let mixedOcclusion = null;
  const bare = join(directory, `${rasterPose.name}-bare.png`);
  try {
    await access(bare);
    const barePixels = await sharp(await raster(bare))
      .raw()
      .toBuffer();
    const visible = await sharp(overlay).raw().toBuffer();
    let front = 0,
      hidden = 0;
    for (let at = 3; at < body.length; at += 4) {
      if (body[at] < 200 || barePixels[at] < 200) continue;
      if (visible[at] > 200) front++;
      if (visible[at] < 20) hidden++;
    }
    mixedOcclusion = { frontOverBodyPixels: front, behindBodyPixels: hidden };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const assembled = await sharp(body, {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
    .composite([{ input: overlay }])
    .png()
    .toBuffer();
  await writeFile(join(directory, `${pose.name}-proof.png`), assembled);
  const gameplay = await sharp(assembled)
    .resize(frame.width / 2, frame.height / 2)
    .png()
    .toBuffer();
  rendered.push({
    ...pose,
    gameplay,
    pngBytes: overlay.length,
    mixedOcclusion,
  });
}
const tileWidth = 248,
  tileHeight = 272,
  columns = 4;
for (const [name, background, ink] of [
  ["light", "#bec2b2", "#18201e"],
  ["dark", "#101918", "#e4dbc3"],
]) {
  const tiles = [];
  // Keep contact sheets bounded; full clips remain available for motion review.
  const selected = rendered.filter(
    (pose) =>
      (pose.action === "idle" && pose.index === 0) ||
      (["walk", "run"].includes(pose.action) && pose.index === 8) ||
      (["primary", "secondary", "iron-fan", "oath-echo"].includes(
        pose.action,
      ) &&
        pose.index === 5) ||
      (pose.action === "hit" && pose.index === 1) ||
      (pose.action === "death" && [8, 10, 13].includes(pose.index)),
  );
  for (const [i, pose] of selected.entries()) {
    const x = (i % columns) * tileWidth,
      y = Math.floor(i / columns) * tileHeight;
    const { width, height } = await sharp(pose.gameplay).metadata();
    const label = Buffer.from(
      `<svg width="248" height="40"><text x="12" y="23" font-family="sans-serif" font-size="13" fill="${ink}">${pose.name} · 1× gameplay</text></svg>`,
    );
    tiles.push(
      { input: label, left: x, top: y },
      {
        input: pose.gameplay,
        left: x + Math.floor((tileWidth - width) / 2),
        top: y + 40 + Math.floor((tileHeight - 40 - height) / 2),
      },
    );
  }
  if (tiles.length)
    await sharp({
      create: {
        width: tileWidth * columns,
        height: Math.ceil(selected.length / columns) * tileHeight,
        channels: 4,
        background,
      },
    })
      .composite(tiles)
      .png()
      .toFile(join(directory, `review-${name}.png`));
}
const report = {
  productionApproved: false,
  rendered: rendered.map((pose) => {
    const metadata = { ...pose };
    delete metadata.gameplay;
    return metadata;
  }),
  overlayPngBytes: rendered.reduce((n, p) => n + p.pngBytes, 0),
};
await writeFile(
  join(directory, "review.json"),
  JSON.stringify(report, null, 2),
);
// A local inspection artifact, isolated from the game and real save storage.
const clips = Object.fromEntries(
  [...new Set(rendered.map((p) => p.action))].map((action) => [
    action,
    rendered
      .filter((p) => p.direction === "se" && p.action === action)
      .sort((a, b) => a.index - b.index)
      .map((p) => ({ name: p.name, index: p.index, root: p.root })),
  ]),
);
await writeFile(
  join(directory, "motion.html"),
  `<!doctype html><meta charset="utf-8"><title>Warrior shield study</title>
<style>body{background:#101918;color:#e4dbc3;font:16px system-ui}button,select{font:inherit;margin:8px}canvas{display:block}main{max-width:900px;margin:auto}</style>
<main><h1>Warrior shield study — unapproved</h1>
<p>Offline authored motion. Original body at left, shield candidate at right. No campaign, input, save or performance validation.</p>
<label>Clip <select id="clip">${Object.keys(clips)
    .map((c) => `<option>${c}</option>`)
    .join("")}</select></label>
<label>Speed <select id="speed"><option value="1">Preview cadence</option><option value="0.25">Quarter speed</option></select></label>
<button id="play">Pause</button><button id="reset">Reset</button><button id="step">Step</button><button id="background">Light / dark</button>
<canvas width="700" height="350"></canvas><p id="diagnostic"></p></main>
<script>
const clips=${JSON.stringify(clips)}, images=new Map();
const canvas=document.querySelector('canvas'), context=canvas.getContext('2d');
const clip=document.querySelector('#clip'), speed=document.querySelector('#speed'), status=document.querySelector('#diagnostic');
for(const frames of Object.values(clips)) for(const frame of frames) for(const kind of ['original','proof']) {
 const image=new Image(); image.src=frame.name+'-'+kind+'.png'; images.set(frame.name+'-'+kind,image);
}
let elapsed=0,previous=0,playing=true,light=false,manual=null;
const fps={idle:2.5,walk:${manifests.movement.clips.walk.fps},run:${manifests.movement.clips.run.fps},primary:24,secondary:24,'iron-fan':24,'oath-echo':24,hit:30,death:32};
function reset(){elapsed=0;manual=null;}
clip.onchange=reset; speed.onchange=reset;
document.querySelector('#play').onclick=()=>{playing=!playing;manual=null;document.querySelector('#play').textContent=playing?'Pause':'Play';};
document.querySelector('#reset').onclick=reset;
document.querySelector('#background').onclick=()=>{light=!light;};
document.querySelector('#step').onclick=()=>{playing=false;document.querySelector('#play').textContent='Play';manual=((manual??0)+1)%clips[clip.value].length;};
function draw(now){
 if(previous&&playing)elapsed+=(now-previous)/1000*Number(speed.value); previous=now;
 const frames=clips[clip.value], count=frames.length;
 const at=manual??(clip.value==='death'?Math.min(count-1,Math.floor(elapsed*fps.death)):Math.floor(elapsed*fps[clip.value])%count);
 const frame=frames[at]; context.fillStyle=light?'#bec2b2':'#101918'; context.fillRect(0,0,700,350);
 if(frame){for(const [side,kind] of ['original','proof'].entries()){
  const image=images.get(frame.name+'-'+kind); if(image.complete&&image.naturalWidth)context.drawImage(image,175+side*350-frame.root[0]/2,260-frame.root[1]/2,image.width/2,image.height/2);
 }status.textContent=frame.name+' · gameplay scale 0.5 · '+(at+1)+'/'+count+' poses · preview only';}
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script>`,
);
console.log(
  `${rendered.length} composite proofs (${rendered.filter((p) => p.bodyOverride).length} targeted body variants); ${report.overlayPngBytes} overlay PNG bytes; no production assets written`,
);
