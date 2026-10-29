/** Pack/round-trip eight-direction primary or --carry; reuse reviewed SE pixels. */
/* global window, document, requestAnimationFrame */
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createServer } from "node:http";
import {
  cropEquipmentRgba,
  packEquipmentRasters,
  equipmentFrame,
} from "./warrior-equipment-packing.mjs";

const args = process.argv.slice(2),
  carryMode = args.at(-1) === "--carry";
if (carryMode) args.pop();
const [se, seven, output] = args.map((p) => resolve(p));
if (
  !se ||
  !seven ||
  !output ||
  args.length !== 3 ||
  output === se ||
  output === seven ||
  [se, seven, output].some((p) => !relative(process.cwd(), p).startsWith(".."))
)
  throw Error("Pass external SE, seven-direction and output directories");
await mkdir(output, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  source = await readFile("assets/source/q3/warrior-staff-se/motion.json"),
  carrySource = carryMode
    ? await readFile("assets/source/q3/warrior-staff-se/carry.json")
    : null,
  motion = JSON.parse(source),
  names = ["s", "sw", "w", "nw", "n", "ne", "e", "se"],
  frames = [],
  rasters = [],
  aliases = {},
  originals = new Map(),
  inputs = [];
for (const directory of [se, seven]) {
  const bytes = await readFile(resolve(directory, "staff.json")),
    proof = JSON.parse(bytes),
    review = JSON.parse(
      await readFile(resolve(directory, "review.json"), "utf8"),
    );
  if (
    !review.sampledGeometryPassed ||
    review.proofSha256 !== hash(bytes) ||
    !proof.motionSha256 ||
    proof.productionApproved ||
    (carryMode &&
      (!proof.carrySourceSha256 ||
        proof.carryControlsSha256 !== hash(carrySource)))
  )
    throw Error("Unreviewed directional inputs");
  if (proof.motionSha256 !== hash(source)) {
    const consumed = await readFile(
      resolve(directory, "../motion-consumed.json"),
    );
    if (
      hash(consumed) !== proof.motionSha256 ||
      JSON.stringify(JSON.parse(consumed)) !== JSON.stringify(motion)
    )
      throw Error("Directional motion inputs differ");
  }
  inputs.push({
    directory,
    proofSha256: hash(bytes),
    producerSha256: proof.producerSha256,
    motionSha256: proof.motionSha256,
  });
  for (const sample of proof.samples) {
    const index = carryMode ? sample.ordinal : sample.index,
      name = `${sample.direction}-${index}`,
      path = resolve(directory, `${sample.name}-packed.png`),
      png = await readFile(path),
      pixels = await sharp(png).ensureAlpha().raw().toBuffer();
    if (
      originals.has(name) ||
      !names.includes(sample.direction) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= (carryMode ? 40 : 12)
    )
      throw Error("Duplicate/invalid directional pose");
    if (
      hash(pixels) !==
      review.reports.find((r) => r.name === sample.name)?.pixelSha256
    )
      throw Error("Changed reviewed pixels");
    originals.set(name, { png, pixels });
    frames.push({ name, direction: sample.direction, index });
    const guard = originals.get(`${sample.direction}-0`);
    if (!carryMode && index === 11 && guard?.pixels.equals(pixels))
      aliases[name] = `${sample.direction}-0`;
    else rasters.push({ name, ...cropEquipmentRgba(pixels, 512, 512) });
  }
}
if (
  frames.length !== (carryMode ? 320 : 96) ||
  names.some(
    (d) =>
      frames.filter((f) => f.direction === d).length !== (carryMode ? 40 : 12),
  )
)
  throw Error("Expected every pose in all eight directions");
const byName = new Map(rasters.map((r) => [r.name, r])),
  textureByFrame = {},
  atlases = [];
// Explicit category split keeps each texture within the existing2048px cap.
for (const group of carryMode
  ? [
      ["s", "sw"],
      ["w", "nw"],
      ["n", "ne"],
      ["e", "se"],
    ]
  : [names]) {
  const selected = rasters.filter((r) =>
      group.some((d) => r.name.startsWith(d + "-")),
    ),
    packed = packEquipmentRasters(selected),
    png = await sharp(packed.pixels, {
      raw: { width: packed.width, height: packed.height, channels: 4 },
    })
      .png()
      .toBuffer(),
    atlas = {
      frames: {},
      meta: {
        image: carryMode ? `carry-${atlases.length}.png` : "primary.png",
        size: { w: packed.width, h: packed.height },
        scale: "1",
      },
    };
  for (const frame of frames.filter((f) => group.includes(f.direction))) {
    const name = aliases[frame.name] ?? frame.name,
      raster = byName.get(name),
      place = packed.placements[name],
      unpacked = Buffer.alloc(512 * 512 * 4);
    for (let row = 0; row < raster.height; row++)
      packed.pixels.copy(
        unpacked,
        ((raster.top + row) * 512 + raster.left) * 4,
        ((place.y + row) * packed.width + place.x) * 4,
        ((place.y + row) * packed.width + place.x + raster.width) * 4,
      );
    if (!unpacked.equals(originals.get(frame.name).pixels))
      throw Error(`Trim round trip failed: ${frame.name}`);
    atlas.frames[frame.name] = equipmentFrame(raster, place, [512, 512]);
    textureByFrame[frame.name] = carryMode
      ? `carry-${atlases.length}`
      : "staff";
  }
  const key = carryMode ? `carry-${atlases.length}` : "primary";
  await writeFile(resolve(output, key + ".png"), png);
  await writeFile(resolve(output, key + ".json"), JSON.stringify(atlas));
  atlases.push({
    key,
    texture: carryMode ? key : "staff",
    png,
    atlas,
    width: packed.width,
    height: packed.height,
    pngBytes: png.length,
    decodedBaseBytes: packed.pixels.length,
  });
}
const primaryBytes = carryMode
    ? await readFile(resolve(se, "../eight-primary/primary.png"))
    : null,
  primaryMetadata = carryMode
    ? await readFile(resolve(se, "../eight-primary/primary.json"))
    : null,
  planBytes = carryMode
    ? await readFile(resolve(se, "../carry-native/plan.json"))
    : null,
  nativePrimary = carryMode ? JSON.parse(primaryMetadata) : null,
  actualPlan = carryMode ? JSON.parse(planBytes) : null;
if (carryMode) {
  const previousReview = JSON.parse(
    await readFile(resolve(se, "../eight-primary/review.json")),
  );
  if (
    previousReview.gpuRoundTrips !== 96 ||
    previousReview.errors.length ||
    previousReview.atlas.pngBytes !== primaryBytes.length ||
    actualPlan.rows.length !== 600 ||
    actualPlan.rows.reduce((n, r) => n + r.strike, 0) !== 1
  )
    throw Error("Missing accepted primary/timed carry evidence");
  // Verify the reused primary pixels against the original reviewed sources,
  // including trim/guard aliases; byte length alone is not an integrity check.
  const pixels = await sharp(primaryBytes).ensureAlpha().raw().toBuffer();
  let verified = 0;
  for (const input of previousReview.inputs) {
    const proofBytes = await readFile(resolve(input.directory, "staff.json")),
      proof = JSON.parse(proofBytes),
      review = JSON.parse(
        await readFile(resolve(input.directory, "review.json")),
      );
    if (
      hash(proofBytes) !== input.proofSha256 ||
      review.proofSha256 !== input.proofSha256
    )
      throw Error("Changed primary proof");
    for (const sample of proof.samples) {
      const f = nativePrimary.frames[sample.direction + "-" + sample.index],
        restored = Buffer.alloc(512 * 512 * 4);
      if (!f || f.sourceSize.w !== 512 || f.sourceSize.h !== 512 || f.rotated)
        throw Error("Invalid primary trim");
      for (let y = 0; y < f.frame.h; y++)
        pixels.copy(
          restored,
          ((f.spriteSourceSize.y + y) * 512 + f.spriteSourceSize.x) * 4,
          ((f.frame.y + y) * nativePrimary.meta.size.w + f.frame.x) * 4,
          ((f.frame.y + y) * nativePrimary.meta.size.w +
            f.frame.x +
            f.frame.w) *
            4,
        );
      if (
        hash(restored) !==
        review.reports.find((r) => r.name === sample.name)?.pixelSha256
      )
        throw Error("Changed reused primary pixels");
      verified++;
    }
  }
  if (verified !== 96) throw Error("Incomplete reused primary");
}
const loadAtlases = atlases.map((a) => ({ key: a.texture, file: a.key }));
if (carryMode)
  loadAtlases.push({ key: "accepted-primary", file: "accepted-primary" });
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#252c30"><script src="/phaser.js"></script><script type="module">
${carryMode ? "" : "import {plan}from'/timing.mjs';"}
const names=${JSON.stringify(names)},loadAtlases=${JSON.stringify(loadAtlases)},textureByFrame=${JSON.stringify(textureByFrame)};
class Review extends Phaser.Scene{
preload(){for(const a of loadAtlases)this.load.atlas(a.key,'/'+a.file+'.png','/'+a.file+'.json');}
create(){if(Phaser.VERSION!=='4.2.1')throw Error('Phaser version');for(const a of loadAtlases)if(!this.textures.exists(a.key))throw Error('Missing atlas '+a.key);
${carryMode ? `this.views=names.map((name,i)=>{this.add.text(80+(i%4)*240,32+Math.floor(i/4)*210,name,{fontSize:'14px'});return this.add.sprite(120+(i%4)*240,205+Math.floor(i/4)*210,textureByFrame[name+'-0'],name+'-0').setOrigin(.5,338/512).setScale(.5);});this.p=${JSON.stringify(actualPlan.rows)};` : `this.sprite=this.add.sprite(240,280,'staff','s-0').setOrigin(.5,338/512).setScale(.5);this.large=this.add.sprite(680,330,'staff','s-0').setOrigin(.5,338/512);this.views=[this.sprite,this.large];this.p=plan(0).rows;`}
this.rt=this.textures.addDynamicTexture('roundtrip',512,512);this.label=this.add.text(8,8,'',{fontSize:'14px'});this.i=0;this.d=0;this.playing=false;this.acc=0;this.visited=new Set();window.directionScene=this;window.directionReady=true;}
draw(name){for(const v of this.views)v.setTexture(textureByFrame[name],name);this.label.setText('Staff primary '+name+' · gameplay1× / inspection2× · unapproved category');}
update(time,delta){if(!this.playing)return;this.acc+=delta;while(this.acc>=1000/60){this.acc-=1000/60;const r=this.p[this.i];
${carryMode ? `for(let j=0;j<8;j++){const frame=names[j]+'-'+r.pose.frame;this.views[j].setTexture(r.pose.set==='movement'?textureByFrame[frame]:'accepted-primary',frame);}this.current=r;this.label.setText('Staff '+r.pose.clip+' · actual tick '+r.tick+' · gameplay1× · unapproved category');` : `this.draw(names[this.d]+'-'+(r.frame??0));this.current={direction:names[this.d],...r};`}
this.visited.add(this.i);this.i++;if(this.i===this.p.length){this.i=0;this.d=(this.d+1)%8;}}}
async snap(key,frame){this.rt.clear().stamp(key,frame,0,0,{originX:0,originY:0}).render();return new Promise(resolve=>this.rt.snapshotArea(0,0,512,512,image=>resolve(image.src)));}
}
new Phaser.Game({type:Phaser.WEBGL,width:960,height:440,backgroundColor:'#252c30',banner:false,scene:Review});
</script></body></html>`;
const routes = new Map([
  ["/", [Buffer.from(html), "text/html"]],
  [
    "/phaser.js",
    [await readFile("node_modules/phaser/dist/phaser.js"), "text/javascript"],
  ],
]);
if (!carryMode)
  routes.set("/timing.mjs", [
    await readFile(resolve(se, "timing.mjs")),
    "text/javascript",
  ]);
for (const a of atlases) {
  routes.set("/" + a.key + ".png", [a.png, "image/png"]);
  routes.set("/" + a.key + ".json", [
    Buffer.from(JSON.stringify(a.atlas)),
    "application/json",
  ]);
}
if (carryMode) {
  routes.set("/accepted-primary.png", [primaryBytes, "image/png"]);
  routes.set("/accepted-primary.json", [
    Buffer.from(JSON.stringify(nativePrimary)),
    "application/json",
  ]);
}
await writeFile(resolve(output, "review.html"), html);
for (const [name, image] of originals)
  routes.set(`/control/${name}.png`, [image.png, "image/png"]);
const server = createServer((req, res) => {
  const r = routes.get(req.url);
  if (!r) {
    res.writeHead(req.url === "/favicon.ico" ? 204 : 404);
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": r[1] });
  res.end(r[0]);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    headless: false,
    args: ["--use-angle=metal"],
  });
  const page = await browser.newPage({
      viewport: { width: 960, height: 440 },
      deviceScaleFactor: 1,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await Promise.race([
    page.waitForFunction(() => window.directionReady),
    new Promise((_, reject) => page.once("pageerror", reject)),
  ]);
  const results = [];
  for (const frame of frames) {
    const pair = await page.evaluate(
      async ({ name, key }) => {
        const s = window.directionScene;
        await new Promise((resolve) => {
          s.load.once("complete", resolve);
          s.load.image("control", "/control/" + name + ".png");
          s.load.start();
        });
        if (!s.textures.exists("control")) throw Error("Missing control");
        const actual = await s.snap(key, name),
          control = await s.snap("control");
        s.textures.remove("control");
        return { actual, control };
      },
      { name: frame.name, key: textureByFrame[frame.name] },
    );
    const buffers = [];
    for (const kind of ["actual", "control"])
      buffers.push(
        await sharp(Buffer.from(pair[kind].split(",")[1], "base64"))
          .raw()
          .toBuffer(),
      );
    if (!buffers[0].equals(buffers[1]))
      throw Error("GPU trim mismatch " + frame.name);
    results.push(frame.name);
  }
  for (const direction of carryMode
    ? [1, 192, 198, 204, 312, 318, 324, 336, 432, 433, 437, 444, 463, 480]
    : names) {
    await page.evaluate(
      async ({ direction, carryMode }) => {
        const s = window.directionScene;
        s.playing = true;
        await new Promise((resolve) => {
          const observe = () => {
            if (
              carryMode
                ? s.current?.tick !== direction
                : s.current?.direction !== direction || s.current.frame !== 5
            )
              return;
            s.playing = false;
            s.events.off("postupdate", observe);
            s.game.events.once("postrender", resolve);
          };
          s.events.on("postupdate", observe);
        });
      },
      { direction, carryMode },
    );
    await page.screenshot({
      path: resolve(
        output,
        carryMode
          ? "native-tick-" + direction + ".png"
          : "native-" + direction + "-impact.png",
      ),
    });
  }
  const native = await page.evaluate(async (loadAtlases) => {
    const s = window.directionScene,
      gl =
        document.querySelector("canvas").getContext("webgl2") ??
        document.querySelector("canvas").getContext("webgl"),
      renderer = gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
      ),
      inventory = [];
    for (const view of s.views) view.setVisible(false).setTexture("__DEFAULT");
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const a of loadAtlases) s.textures.remove(a.key);
      inventory.push({
        cycle,
        stage: "released",
        textures: s.textures.getTextureKeys().length,
      });
      await new Promise((resolve) => {
        s.load.once("complete", resolve);
        for (const a of loadAtlases)
          s.load.atlas(a.key, "/" + a.file + ".png", "/" + a.file + ".json");
        s.load.start();
      });
      if (loadAtlases.some((a) => !s.textures.exists(a.key)))
        throw Error("Atlas reload failed");
      inventory.push({
        cycle,
        stage: "reloaded",
        textures: s.textures.getTextureKeys().length,
      });
    }
    for (const view of s.views) view.setVisible(true);
    s.i = 0;
    s.acc = 0;
    s.visited.clear();
    s.playing = true;
    const frames = [];
    let last = null;
    await new Promise((resolve) => {
      const measure = (at) => {
        if (last !== null) frames.push(at - last);
        last = at;
        if (frames.length === 600) resolve();
        else requestAnimationFrame(measure);
      };
      requestAnimationFrame(measure);
    });
    return { renderer, inventory, frames, visited: [...s.visited] };
  }, loadAtlases);
  if (!/Metal Renderer: Apple M4/.test(native.renderer))
    throw Error(native.renderer);
  if (carryMode && native.visited.length !== 600)
    throw Error("Incomplete actual carry/primary plan playback");
  if (
    new Set(
      native.inventory
        .filter((x) => x.stage === "reloaded")
        .map((x) => x.textures),
    ).size !== 1 ||
    new Set(
      native.inventory
        .filter((x) => x.stage === "released")
        .map((x) => x.textures),
    ).size !== 1
  )
    throw Error("Texture inventory grew");
  const sorted = native.frames.sort((a, b) => a - b),
    q = (p) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))],
    report = {
      productionApproved: false,
      completeStaffConfiguration: false,
      producerSha256: hash(await readFile(new URL(import.meta.url))),
      inputs,
      kind: carryMode ? "carry" : "primary",
      logicalFrames: frames.length,
      uniqueRasters: rasters.length,
      guardAliases: Object.keys(aliases).length,
      cpuRoundTrips: frames.length,
      gpuRoundTrips: results.length,
      atlas: carryMode
        ? null
        : {
            width: atlases[0].width,
            height: atlases[0].height,
            pngBytes: atlases[0].pngBytes,
            decodedBaseBytes: atlases[0].decodedBaseBytes,
          },
      atlases: atlases.map(
        ({ key, width, height, pngBytes, decodedBaseBytes }) => ({
          key,
          width,
          height,
          pngBytes,
          decodedBaseBytes,
        }),
      ),
      carryPlayback: carryMode
        ? {
            actualPlanTicks: actualPlan.rows.length,
            nativeVisitedPlanTicks: native.visited.length,
            actualPlanSha256: hash(planBytes),
            acceptedPrimaryPngSha256: hash(primaryBytes),
            acceptedPrimaryMetadataSha256: hash(primaryMetadata),
            acceptedPrimaryAtlasReused: true,
            primaryAtlasAdditionalPngBytes: 0,
            fixtureLoadedAtlases: loadAtlases.length,
            actualDamageEvents: actualPlan.rows.reduce(
              (n, r) => n + r.strike,
              0,
            ),
          }
        : null,
      renderer: native.renderer,
      inventory: native.inventory,
      frameStats: {
        count: sorted.length,
        p50: q(0.5),
        p95: q(0.95),
        p99: q(0.99),
        max: sorted.at(-1),
        over25: sorted.filter((x) => x > 25).length,
      },
      errors,
    };
  await writeFile(
    resolve(output, "review.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw Error("Native errors");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
