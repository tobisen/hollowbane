/** Pack/round-trip all eight primary pilots; reuse the already reviewed SE pixels. */
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

const [se, seven, output] = process.argv.slice(2).map((p) => resolve(p));
if (
  !se ||
  !seven ||
  !output ||
  [se, seven, output].some((p) => !relative(process.cwd(), p).startsWith(".."))
)
  throw Error("Pass external SE, seven-direction and output directories");
await mkdir(output, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  source = await readFile("assets/source/q3/warrior-staff-se/motion.json"),
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
    proof.productionApproved
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
    const name = `${sample.direction}-${sample.index}`,
      path = resolve(directory, `${sample.name}-packed.png`),
      png = await readFile(path),
      pixels = await sharp(png).ensureAlpha().raw().toBuffer();
    if (
      originals.has(name) ||
      !names.includes(sample.direction) ||
      !Number.isInteger(sample.index) ||
      sample.index < 0 ||
      sample.index > 11
    )
      throw Error("Duplicate/invalid directional pose");
    if (
      hash(pixels) !==
      review.reports.find((r) => r.name === sample.name)?.pixelSha256
    )
      throw Error("Changed reviewed pixels");
    originals.set(name, { png, pixels });
    frames.push({ name, direction: sample.direction, index: sample.index });
    const guard = originals.get(`${sample.direction}-0`);
    if (sample.index === 11 && guard?.pixels.equals(pixels))
      aliases[name] = `${sample.direction}-0`;
    else rasters.push({ name, ...cropEquipmentRgba(pixels, 512, 512) });
  }
}
if (
  frames.length !== 96 ||
  names.some((d) => frames.filter((f) => f.direction === d).length !== 12)
)
  throw Error("Expected every primary pose in all eight directions");
const packed = packEquipmentRasters(rasters),
  png = await sharp(packed.pixels, {
    raw: { width: packed.width, height: packed.height, channels: 4 },
  })
    .png()
    .toBuffer(),
  byName = new Map(rasters.map((r) => [r.name, r])),
  atlas = {
    frames: {},
    meta: {
      image: "primary.png",
      size: { w: packed.width, h: packed.height },
      scale: "1",
    },
  };
for (const frame of frames) {
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
}
await writeFile(resolve(output, "primary.png"), png);
await writeFile(resolve(output, "primary.json"), JSON.stringify(atlas));
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#252c30"><script src="/phaser.js"></script><script type="module">
import {plan}from'/timing.mjs';const names=${JSON.stringify(names)};
class Review extends Phaser.Scene{
preload(){this.load.atlas('staff','/primary.png','/primary.json');}
create(){if(Phaser.VERSION!=='4.2.1')throw Error('Phaser version');this.sprite=this.add.sprite(240,280,'staff','s-0').setOrigin(.5,338/512).setScale(.5);this.large=this.add.sprite(680,330,'staff','s-0').setOrigin(.5,338/512);this.rt=this.textures.addDynamicTexture('roundtrip',512,512);this.label=this.add.text(8,8,'',{fontSize:'14px'});this.p=plan(0).rows;this.i=0;this.d=0;this.playing=false;this.acc=0;window.directionScene=this;window.directionReady=true;}
draw(name){this.sprite.setFrame(name);this.large.setFrame(name);this.label.setText('Staff primary '+name+' · gameplay1× / inspection2× · unapproved category');}
update(time,delta){if(!this.playing)return;this.acc+=delta;while(this.acc>=1000/60){this.acc-=1000/60;const r=this.p[this.i];this.draw(names[this.d]+'-'+(r.frame??0));this.current={direction:names[this.d],...r};this.i++;if(this.i===this.p.length){this.i=0;this.d=(this.d+1)%8;}}}
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
  [
    "/timing.mjs",
    [await readFile(resolve(se, "timing.mjs")), "text/javascript"],
  ],
  ["/primary.png", [png, "image/png"]],
  ["/primary.json", [Buffer.from(JSON.stringify(atlas)), "application/json"]],
]);
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
    const pair = await page.evaluate(async (name) => {
      const s = window.directionScene;
      await new Promise((resolve) => {
        s.load.once("complete", resolve);
        s.load.image("control", "/control/" + name + ".png");
        s.load.start();
      });
      if (!s.textures.exists("control")) throw Error("Missing control");
      const actual = await s.snap("staff", name),
        control = await s.snap("control");
      s.textures.remove("control");
      return { actual, control };
    }, frame.name);
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
  for (const direction of names) {
    await page.evaluate(async (direction) => {
      const s = window.directionScene;
      s.playing = true;
      await new Promise((resolve) => {
        const observe = () => {
          if (s.current?.direction !== direction || s.current.frame !== 5)
            return;
          s.playing = false;
          s.events.off("postupdate", observe);
          s.game.events.once("postrender", resolve);
        };
        s.events.on("postupdate", observe);
      });
    }, direction);
    await page.screenshot({
      path: resolve(output, "native-" + direction + "-impact.png"),
    });
  }
  const native = await page.evaluate(async () => {
    const s = window.directionScene,
      gl =
        document.querySelector("canvas").getContext("webgl2") ??
        document.querySelector("canvas").getContext("webgl"),
      renderer = gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
      ),
      inventory = [];
    s.sprite.setVisible(false).setTexture("__DEFAULT");
    s.large.setVisible(false).setTexture("__DEFAULT");
    for (let cycle = 0; cycle < 3; cycle++) {
      s.textures.remove("staff");
      inventory.push({
        cycle,
        stage: "released",
        textures: s.textures.getTextureKeys().length,
      });
      await new Promise((resolve) => {
        s.load.once("complete", resolve);
        s.load.atlas("staff", "/primary.png", "/primary.json");
        s.load.start();
      });
      inventory.push({
        cycle,
        stage: "reloaded",
        textures: s.textures.getTextureKeys().length,
      });
    }
    s.sprite.setTexture("staff", "s-0").setVisible(true);
    s.large.setTexture("staff", "s-0").setVisible(true);
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
    return { renderer, inventory, frames };
  });
  if (!/Metal Renderer: Apple M4/.test(native.renderer))
    throw Error(native.renderer);
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
      logicalFrames: 96,
      uniqueRasters: rasters.length,
      guardAliases: Object.keys(aliases).length,
      cpuRoundTrips: 96,
      gpuRoundTrips: results.length,
      atlas: {
        width: packed.width,
        height: packed.height,
        pngBytes: png.length,
        decodedBaseBytes: packed.pixels.length,
      },
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
