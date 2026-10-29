/** Native SE carry/primary handoff, driven by actual simulation and pose selector. */
/* global window, document, requestAnimationFrame */
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import {
  cropEquipmentRgba,
  packEquipmentRasters,
  equipmentFrame,
} from "./warrior-equipment-packing.mjs";

const [carry, primary, output] = process.argv.slice(2).map((p) => resolve(p));
if (
  !carry ||
  !primary ||
  !output ||
  [carry, primary, output].some(
    (p) => !relative(process.cwd(), p).startsWith(".."),
  )
)
  throw Error(
    "Pass external carry, accepted SE primary and output directories",
  );
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex"),
  rasters = [],
  inputs = [];
for (const [set, directory, count] of [
  ["movement", carry, 40],
  ["attacks", primary, 12],
]) {
  const bytes = await readFile(resolve(directory, "staff.json")),
    proof = JSON.parse(bytes),
    reviewedBytes = await readFile(resolve(directory, "review.json")),
    review = JSON.parse(reviewedBytes);
  if (
    !review.sampledGeometryPassed ||
    review.proofSha256 !== hash(bytes) ||
    proof.productionApproved ||
    proof.samples.length !== count ||
    proof.samples.some((s) => s.direction !== "se")
  )
    throw Error("Unreviewed Southeast input");
  inputs.push({
    set,
    proofSha256: hash(bytes),
    reviewSha256: hash(reviewedBytes),
  });
  for (const sample of proof.samples) {
    const pixels = await sharp(resolve(directory, sample.name + "-packed.png"))
      .ensureAlpha()
      .raw()
      .toBuffer();
    if (
      hash(pixels) !==
      review.reports.find((r) => r.name === sample.name)?.pixelSha256
    )
      throw Error("Changed reviewed pixels");
    rasters.push({
      name: set + "-" + (sample.ordinal ?? sample.index),
      ...cropEquipmentRgba(pixels, 512, 512),
    });
  }
}
const packed = packEquipmentRasters(rasters),
  png = await sharp(packed.pixels, {
    raw: { width: packed.width, height: packed.height, channels: 4 },
  })
    .png()
    .toBuffer(),
  atlas = {
    frames: Object.fromEntries(
      rasters.map((r) => [
        r.name,
        equipmentFrame(r, packed.placements[r.name], [512, 512]),
      ]),
    ),
    meta: {
      image: "carry.png",
      size: { w: packed.width, h: packed.height },
      scale: "1",
    },
  };
await writeFile(resolve(output, "carry.png"), png);
await writeFile(resolve(output, "carry.json"), JSON.stringify(atlas));
const entry = `
import { createCombat, stepCombat } from './src/simulation/combat';
import { commandCombat } from './src/simulation/combat-targeting';
import { createWalker } from './src/simulation/locomotion';
import { WarriorMotion, warriorPose } from './src/rendering/warrior-pose';
import { createCharacterInventory } from './src/simulation/equipment';
import { inventoryItem } from './src/simulation/inventory-test-helper';
import { deriveEquipment, captureEquipmentBase, applyEquipment } from './src/simulation/equipment-stats';
export function plan(){
 const w=createCombat();w.actors=w.actors.slice(0,2);const a=w.actors[0],b=w.actors[1];
 a.controller.walker={...createWalker({x:0,y:0}),direction:7};b.kind='dummy';b.controller.walker=createWalker({x:1000,y:0});
 const c=createCharacterInventory();c.equipment.main=inventoryItem('cinder-staff');applyEquipment(deriveEquipment(c,captureEquipmentBase(a)),a);
 const nav={boundary:[{x:-10000,y:-10000},{x:10000,y:-10000},{x:10000,y:10000},{x:-10000,y:10000}],obstacles:[]};
 const m=new WarriorMotion(),rows=[];m.observe(a,0);
 for(let tick=0;tick<600;tick++){
  if(tick===312)a.controller.walker.gait='run';
  if(tick===432){b.controller.walker.position={x:a.controller.walker.position.x+.8,y:a.controller.walker.position.y};a.controller=commandCombat(a.controller,{kind:'attack',target:b.id,repeat:false});}
  stepCombat(w,nav,tick>=192&&tick<432?{x:1,y:.5}:{x:0,y:0});m.observe(a,w.tick);
  const pose=warriorPose(a,w.tick,null,null,m),walker=a.controller.walker;
  rows.push({tick:w.tick,pose,frame:pose.set+'-'+pose.frame,direction:walker.direction,position:{...walker.position},distance:walker.distance,speed:walker.speed,
   phase:a.controller.timeline.phase,strike:w.events.filter(e=>e.tick===w.tick&&e.actor===a.id&&e.kind==='damage').length});
 }
 return {rows,rules:{weapon:a.weapon,range:a.range},events:w.events};
}`;
const bundle = resolve(output, "timing.mjs");
await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: bundle,
  logLevel: "silent",
});
const plan = (await import(pathToFileURL(bundle))).plan();
if (
  plan.rules.weapon !== "melee" ||
  plan.rules.range !== 1.05 ||
  plan.rows.some((r) => !atlas.frames[r.frame] || r.direction !== 7) ||
  plan.rows.reduce((n, r) => n + r.strike, 0) !== 1
)
  throw Error("Real staff motion/timing contract changed");
for (const [clip, count] of [
  ["idle", 8],
  ["walk", 16],
  ["run", 16],
])
  if (
    new Set(plan.rows.filter((r) => r.pose.clip === clip).map((r) => r.frame))
      .size !== count
  )
    throw Error("Incomplete actual gait coverage " + clip);
await writeFile(
  resolve(output, "plan.json"),
  JSON.stringify(plan, null, 2) + "\n",
);
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><script src="/phaser.js"></script><script type="module">
const rows=${JSON.stringify(plan.rows)};
class Review extends Phaser.Scene{
 preload(){this.load.atlas('staff','/carry.png','/carry.json');}
 create(){if(Phaser.VERSION!=='4.2.1')throw Error('Phaser version');this.small=this.add.sprite(240,280,'staff',rows[0].frame).setOrigin(.5,338/512).setScale(.5);this.large=this.add.sprite(680,330,'staff',rows[0].frame).setOrigin(.5,338/512);this.grid=this.add.graphics();this.label=this.add.text(8,8,'',{fontSize:'14px'});this.i=0;this.acc=0;this.playing=false;this.seen=[];window.carryScene=this;window.carryReady=true;}
 update(time,delta){if(!this.playing)return;this.acc+=delta;while(this.acc>=1000/60){this.acc-=1000/60;const r=rows[this.i];this.current=r;this.small.setFrame(r.frame);this.large.setFrame(r.frame);this.label.setText('Unapproved SE staff '+r.pose.clip+' · tick '+r.tick+' · gameplay1× / inspection2×');this.grid.clear();this.grid.lineStyle(1,0x536269,.6);for(const [cx,cy,s]of[[240,280,1],[680,330,2]]){const offset=(r.position.x%1)*64*s;for(let n=-5;n<=5;n++){const x=cx+n*64*s-offset,y=cy+n*32*s-offset*.5;this.grid.lineBetween(x-220*s,y+110*s,x+220*s,y-110*s);}}this.grid.setDepth(-1);this.seen.push(r.tick);this.i=(this.i+1)%rows.length;}}
}
new Phaser.Game({type:Phaser.WEBGL,width:960,height:440,backgroundColor:'#252c30',banner:false,scene:Review});
</script></body></html>`;
const routes = new Map([
  ["/", [Buffer.from(html), "text/html"]],
  [
    "/phaser.js",
    [await readFile("node_modules/phaser/dist/phaser.js"), "text/javascript"],
  ],
  ["/carry.png", [png, "image/png"]],
  ["/carry.json", [Buffer.from(JSON.stringify(atlas)), "application/json"]],
]);
await writeFile(resolve(output, "review.html"), html);
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
  const context = await browser.newContext({
      viewport: { width: 960, height: 440 },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: resolve(output, "video"),
        size: { width: 960, height: 440 },
      },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await Promise.race([
    page.waitForFunction(() => window.carryReady),
    new Promise((_, reject) => page.once("pageerror", reject)),
  ]);
  // Pause only after the requested frame was selected by actual simulation.
  for (const target of [
    1, 96, 192, 198, 204, 216, 312, 318, 324, 336, 431, 432, 433, 437, 444, 463,
    480,
  ]) {
    await page.evaluate(async (target) => {
      const s = window.carryScene;
      s.playing = true;
      await new Promise((resolve) => {
        const observe = () => {
          if (s.current?.tick !== target) return;
          s.playing = false;
          s.events.off("postupdate", observe);
          s.game.events.once("postrender", resolve);
        };
        s.events.on("postupdate", observe);
      });
    }, target);
    await page.screenshot({
      path: resolve(output, "native-tick-" + target + ".png"),
    });
  }
  const native = await page.evaluate(async () => {
    const s = window.carryScene,
      gl =
        document.querySelector("canvas").getContext("webgl2") ??
        document.querySelector("canvas").getContext("webgl"),
      frames = [];
    s.i = 0;
    s.acc = 0;
    s.seen = [];
    s.playing = true;
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
    return {
      renderer: gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
      ),
      frames,
      seen: s.seen,
      textures: s.textures.getTextureKeys().length,
    };
  });
  if (!/Metal Renderer: Apple M4/.test(native.renderer))
    throw Error(native.renderer);
  if (new Set(native.seen).size !== 600)
    throw Error("Native playback did not complete actual 600-tick plan");
  const sorted = native.frames.toSorted((a, b) => a - b),
    q = (p) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const report = {
    productionApproved: false,
    completeStaffConfiguration: false,
    producerSha256: hash(await readFile(new URL(import.meta.url))),
    inputs,
    timingBundleSha256: hash(await readFile(bundle)),
    rules: plan.rules,
    actualPlanTicks: plan.rows.length,
    actualPrimaryDamageEvents: plan.rows.reduce((n, r) => n + r.strike, 0),
    renderer: native.renderer,
    textures: native.textures,
    atlas: {
      width: packed.width,
      height: packed.height,
      pngBytes: png.length,
      decodedBaseBytes: packed.pixels.length,
    },
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
  await context.close();
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw Error("Native carry error");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
