/** Disposable native SE motion review driven by the actual pure combat selector. */
/* global window, document, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  cropEquipmentRgba,
  packEquipmentRasters,
  equipmentFrame,
} from "./warrior-equipment-packing.mjs";

const directory = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !relative(process.cwd(), directory).startsWith(".."))
  throw Error("Pass an external rendered Southeast motion directory");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  proof = JSON.parse(await readFile(resolve(directory, "staff.json"), "utf8")),
  review = JSON.parse(
    await readFile(resolve(directory, "review.json"), "utf8"),
  );
if (
  !proof.motionSha256 ||
  proof.samples.length !== 12 ||
  !review.sampledGeometryPassed ||
  proof.samples.some(
    (s) => s.direction !== "se" || s.index !== Math.floor(s.index),
  )
)
  throw Error("Expected a complete, unapproved Southeast primary pilot");
const rasters = [];
for (const sample of proof.samples) {
  const pixels = await sharp(resolve(directory, `${sample.name}-packed.png`))
    .raw()
    .toBuffer();
  if (
    hash(pixels) !==
    review.reports.find((r) => r.name === sample.name)?.pixelSha256
  )
    throw Error("Changed reviewed pixels");
  rasters.push({
    name: String(sample.index),
    ...cropEquipmentRgba(pixels, 512, 512),
  });
}
const packed = packEquipmentRasters(rasters),
  atlasPng = await sharp(packed.pixels, {
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
      image: "motion.png",
      size: { w: packed.width, h: packed.height },
      scale: "1",
    },
  };
await writeFile(resolve(directory, "motion.png"), atlasPng);
await writeFile(resolve(directory, "motion-atlas.json"), JSON.stringify(atlas));
const entry = `
import { createTimeline, stepTimeline, breakpointFrames } from './src/simulation/combat-timing';
import { ATTACK_BREAKPOINTS, createCombat } from './src/simulation/combat';
import { warriorAttackFrame } from './src/rendering/warrior-attack-frame';
import { createCharacterInventory } from './src/simulation/equipment';
import { inventoryItem } from './src/simulation/inventory-test-helper';
import { deriveEquipment, captureEquipmentBase } from './src/simulation/equipment-stats';
import { equipmentDefinition } from './src/simulation/equipment-content';
export function plan(modifier=0) {
 const windup=breakpointFrames(modifier,ATTACK_BREAKPOINTS),timing={windup,active:2,recovery:windup+6};
 let state=createTimeline(timing);const rows=[];
 do {const result=stepTimeline(state,rows.length===0?'attack':'wait');state=result.state;
 rows.push({tick:rows.length,phase:state.phase,remaining:state.remaining,frame:warriorAttackFrame(state,'primary'),strike:result.events.some(e=>e.kind==='strike')});
 }while(state.phase!=='idle');return {modifier,timing,rows};
}
export function interruptions(){const rows=[];for(const command of ['hit','kill']){
 let state=createTimeline({windup:12,active:2,recovery:18});state=stepTimeline(state,'attack').state;
 const result=stepTimeline(state,command);rows.push({command,frame:warriorAttackFrame(result.state,'primary'),strike:result.events.some(e=>e.kind==='strike')});}return rows;}
const actor=createCombat().actors[0],inventory=createCharacterInventory();inventory.equipment.main=inventoryItem('cinder-staff');
export const rules={weapon:deriveEquipment(inventory,captureEquipmentBase(actor)).weapon,range:deriveEquipment(inventory,captureEquipmentBase(actor)).range,hands:equipmentDefinition(inventory.equipment.main).hands};
`;
const bundle = resolve(directory, "timing.mjs");
await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: bundle,
  logLevel: "silent",
});
const timing = await import(pathToFileURL(bundle)),
  plans = [0, 20, 50, 90].map(timing.plan),
  interruptions = timing.interruptions();
if (
  timing.rules.weapon !== "melee" ||
  timing.rules.range !== 1.05 ||
  timing.rules.hands !== 2
)
  throw Error(
    "Staff gameplay rules changed; inspect before adapting choreography",
  );
for (const p of plans) {
  const strikes = p.rows.filter((r) => r.strike);
  if (
    strikes.length !== 1 ||
    strikes[0].frame !== 5 ||
    strikes[0].tick !== p.timing.windup - 1 ||
    p.rows.some((r) => r.phase === "active" && r.frame !== 5)
  )
    throw Error("Impact contract changed");
}
if (interruptions.some((r) => r.frame !== null || r.strike))
  throw Error("Interrupted attack did not yield");
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#252c30;color:white;font:14px monospace"><button id="pause">Pause</button><label>Playback <select id="rate"><option value="1">1× real timing</option><option value=".25">0.25× inspection</option></select></label><span>Unapproved SE staff primary · no campaign/save opened</span><div id="stage"></div><script src="/phaser.js"></script><script type="module">
import {plan} from '/timing.mjs';
class Review extends Phaser.Scene {
 preload(){this.load.atlas('staff','/motion.png','/motion-atlas.json');}
 create(){if(Phaser.VERSION!=='4.2.1')throw Error('Phaser version');
 this.actor=this.add.sprite(256,280,'staff','0').setOrigin(.5,338/512).setScale(.5);
 this.inspection=this.add.sprite(700,330,'staff','0').setOrigin(.5,338/512);
 const g=this.add.graphics();g.lineStyle(1,0xeac36a);for(const [x,y,scale] of [[256,280,1],[700,330,2]]){
 g.lineBetween(x-7,y,x+7,y);g.lineBetween(x,y-7,x,y+7);
 const tx=x+64*1.05*scale,ty=y+32*1.05*scale;
 g.lineStyle(1,0x829092);g.strokeEllipse(tx,ty,22*scale,9*scale);g.lineBetween(tx,ty,tx,ty-54*scale);g.strokeCircle(tx,ty-54*scale,5*scale);}
 this.status=this.add.text(8,370,'',{fontSize:'13px'});this.add.text(125,8,'Gameplay 1×',{fontSize:'14px'});this.add.text(620,8,'Inspection 2×',{fontSize:'14px'});
 this.p=plan(0);this.at=0;this.acc=0;this.playing=true;this.rate=1;this.cycles=0;this.trace=[];this.ticks=0;
 document.querySelector('#pause').onclick=()=>{this.playing=!this.playing;document.querySelector('#pause').textContent=this.playing?'Pause':'Play';};
 document.querySelector('#rate').onchange=e=>this.rate=Number(e.target.value);
 window.staffMotionScene=this;window.staffMotionReady=true;
 }
 update(time,delta){if(this.playing){this.acc+=delta*this.rate;while(this.acc>=1000/60){this.acc-=1000/60;
 const row=this.p.rows[this.at];this.actor.setFrame(String(row.frame??0));this.inspection.setFrame(String(row.frame??0));
 this.trace.push({...row,cycle:this.cycles,sampledAt:time});this.ticks++;this.at++;if(this.at===this.p.rows.length){this.at=0;this.cycles++;}
 }}this.status.setText(['tick '+this.ticks+' · '+this.p.rows[(this.at+this.p.rows.length-1)%this.p.rows.length].phase+' · '+this.cycles+' attacks · range marker1.05','Presentation consumes the existing combat timeline; callbacks create no damage/effects.']);}
}
new Phaser.Game({type:Phaser.WEBGL,width:960,height:440,parent:'stage',backgroundColor:'#252c30',banner:false,scene:Review});
</script></body></html>`;
await writeFile(resolve(directory, "motion-review.html"), html);
const routes = new Map([
  ["/", [Buffer.from(html), "text/html"]],
  ["/timing.mjs", [await readFile(bundle), "text/javascript"]],
  [
    "/phaser.js",
    [await readFile("node_modules/phaser/dist/phaser.js"), "text/javascript"],
  ],
  ["/motion.png", [atlasPng, "image/png"]],
  [
    "/motion-atlas.json",
    [Buffer.from(JSON.stringify(atlas)), "application/json"],
  ],
]);
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
      viewport: { width: 960, height: 480 },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: resolve(directory, "video"),
        size: { width: 960, height: 480 },
      },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await Promise.race([
    page.waitForFunction(() => window.staffMotionReady),
    new Promise((_, reject) => page.once("pageerror", reject)),
  ]);
  await page.locator("#pause").click();
  if (await page.evaluate(() => window.staffMotionScene.playing))
    throw Error("Pause failed");
  const captures = [];
  for (const frame of [0, 2, 3, 4, 5, 6, 8, 11]) {
    await page.evaluate(async (frame) => {
      const s = window.staffMotionScene;
      s.playing = true;
      await new Promise((resolve) => {
        const observe = () => {
          if (s.actor.frame.name !== String(frame)) return;
          s.playing = false;
          s.events.off("postupdate", observe);
          s.game.events.once("postrender", resolve);
        };
        s.events.on("postupdate", observe);
      });
    }, frame);
    const path = resolve(directory, "native-pose-" + frame + ".png");
    await page.screenshot({ path });
    captures.push(path);
  }
  await page.locator("#pause").click();
  const measured = await page.evaluate(async () => {
    const s = window.staffMotionScene,
      canvas = document.querySelector("canvas"),
      gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
      renderer = gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
      ),
      frames = [];
    s.trace = [];
    s.at = 0;
    s.cycles = 0;
    s.acc = 0;
    s.ticks = 0;
    let last = null;
    await new Promise((resolve) => {
      const frame = (at) => {
        if (last !== null) frames.push(at - last);
        last = at;
        if (frames.length === 600) resolve();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    return {
      renderer,
      frames,
      trace: s.trace,
      textures: s.textures.getTextureKeys().length,
    };
  });
  if (!/Metal Renderer: Apple M4/.test(measured.renderer))
    throw Error(measured.renderer);
  const completedCycles = new Set(
    measured.trace.filter((r) => r.phase === "idle").map((r) => r.cycle),
  );
  for (const cycle of completedCycles) {
    const rows = measured.trace.filter((r) => r.cycle === cycle);
    if (
      rows.filter((r) => r.strike).length !== 1 ||
      rows.find((r) => r.strike).frame !== 5
    )
      throw Error("Playback impact mismatch");
  }
  const values = [...measured.frames].sort((a, b) => a - b),
    q = (p) =>
      values[Math.min(values.length - 1, Math.floor(values.length * p))],
    report = {
      productionApproved: false,
      choreographyAccepted: false,
      producerSha256: hash(await readFile(new URL(import.meta.url))),
      proofSha256: hash(await readFile(resolve(directory, "staff.json"))),
      reviewSha256: hash(await readFile(resolve(directory, "review.json"))),
      timingBundleSha256: hash(await readFile(bundle)),
      rules: timing.rules,
      plans,
      interruptions,
      renderer: measured.renderer,
      textures: measured.textures,
      completedCycles: completedCycles.size,
      frameStats: {
        count: values.length,
        p50: q(0.5),
        p95: q(0.95),
        p99: q(0.99),
        max: values.at(-1),
        over25: values.filter((v) => v > 25).length,
      },
      atlas: {
        width: packed.width,
        height: packed.height,
        pngBytes: atlasPng.length,
        decodedBaseBytes: packed.pixels.length,
      },
      errors,
    };
  await writeFile(
    resolve(directory, "motion-runtime.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  await writeFile(
    resolve(directory, "motion-trace.json"),
    JSON.stringify(measured.trace, null, 2) + "\n",
  );
  await context.close();
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw Error("Motion playback error");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
