/** Native Phaser4.2.1 round-trip of bounded body patches; no campaign integration. */
/* global window, document, performance, requestAnimationFrame */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

const directory = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !relative(process.cwd(), directory).startsWith(".."))
  throw Error("Pass a diagnostic directory outside the repository");
const review = JSON.parse(
    await readFile(resolve(directory, "review.json"), "utf8"),
  ),
  body = JSON.parse(await readFile(resolve(directory, "body.json"), "utf8"));
if (review.reports.length !== body.rasterPairs || body.rasterPairs > 12)
  throw Error("Expected bounded body review");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (
  hash(await readFile(resolve(directory, "body.json"))) !== review.proofSha256
)
  throw Error("Body proof changed after review");
const width = 512,
  frames = [];
let x = 2,
  y = 2,
  rowHeight = 0;
for (const report of review.reports) {
  const p = report.patch;
  if (p.width + 4 > width) throw Error("Unexpected pilot patch width");
  if (x + p.width + 2 > width) {
    x = 2;
    y += rowHeight + 4;
    rowHeight = 0;
  }
  frames.push({
    ...report,
    atlasX: x,
    atlasY: y,
    sample: body.samples.find((s) => s.name === report.name),
  });
  x += p.width + 4;
  rowHeight = Math.max(rowHeight, p.height);
}
const height = 2 ** Math.ceil(Math.log2(y + rowHeight + 2)),
  pixels = Buffer.alloc(width * height * 4);
for (const frame of frames) {
  const p = frame.patch,
    crop = await sharp(resolve(directory, `${frame.name}-clean-packed.png`))
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .raw()
      .toBuffer();
  for (let row = 0; row < p.height; row++)
    crop.copy(
      pixels,
      ((frame.atlasY + row) * width + frame.atlasX) * 4,
      row * p.width * 4,
      (row + 1) * p.width * 4,
    );
}
const patchPng = await sharp(pixels, { raw: { width, height, channels: 4 } })
  .png()
  .toBuffer();
await writeFile(resolve(directory, "runtime-patches.png"), patchPng);
const html = `<!doctype html><html><body style="margin:0;background:#252c30"><script src="/phaser.js"></script><script>
const frames=${JSON.stringify(frames)};window.proofFrames=frames;
class Proof extends Phaser.Scene {
 preload() {
  this.load.image('patches','/runtime-patches.png');
  for(const frame of frames) for(const type of ['approved','patch'])
   this.load.image(frame.name+'-'+type,'/'+frame.name+'-'+type+'-packed.png');
 }
 create() {
  if(Phaser.VERSION!=='4.2.1') throw Error('Expected Phaser4.2.1');
  for(const f of frames)this.textures.get('patches').add(f.name,0,f.atlasX,f.atlasY,f.patch.width,f.patch.height);
  this.left=this.add.image(224,180,'__DEFAULT').setScale(.5).setVisible(false);
  this.right=this.add.image(672,180,'__DEFAULT').setScale(.5).setVisible(false);
  this.label=this.add.text(8,8,'',{fontSize:'14px'});
  const guides=this.add.graphics({lineStyle:{width:1,color:0xf6c268}});
  for(const x of [224,672]){guides.lineBetween(x-8,180,x+8,180);guides.lineBetween(x,172,x,188);}
  window.proofScene=this;window.proofReady=true;
 }
 compose(f,control=false){
  const texture=control?this.control:this.scratch;
  texture.clear().stamp(f.name+(control?'-patch':'-approved'),undefined,0,0,{originX:0,originY:0});
  if(!control){const p=f.patch;texture.clear(p.left,p.top,p.width,p.height).stamp('patches',f.name,p.left,p.top,{originX:0,originY:0});}
  texture.render();
  const image=control?this.right:this.left;
  image.setTexture(texture).setOrigin(f.root[0]/448,f.root[1]/448).setVisible(true);
  this.label.setText(f.name+'    local clear/stamp               offline control');
 }
 allocate(){this.scratch=this.textures.addDynamicTexture('body-scratch',448,448);this.control=this.textures.addDynamicTexture('body-control',448,448);}
 release(){this.left.setVisible(false).setTexture('__DEFAULT');this.right.setVisible(false).setTexture('__DEFAULT');this.textures.remove('body-scratch');this.textures.remove('body-control');}
 async snapshot(texture,f){return new Promise(resolve=>texture.snapshotArea(0,0,f.sample.frame.width,f.sample.frame.height,image=>resolve(image.src)));}
}
new Phaser.Game({type:Phaser.WEBGL,width:896,height:300,backgroundColor:'#252c30',banner:false,scene:Proof});
</script></body></html>`;
const allow = new Map([
  ["/", [Buffer.from(html), "text/html"]],
  [
    "/phaser.js",
    [await readFile("node_modules/phaser/dist/phaser.js"), "text/javascript"],
  ],
  ["/runtime-patches.png", [patchPng, "image/png"]],
]);
for (const f of frames)
  for (const type of ["approved", "patch"])
    allow.set(`/${f.name}-${type}-packed.png`, [
      await readFile(resolve(directory, `${f.name}-${type}-packed.png`)),
      "image/png",
    ]);
const server = createServer((req, res) => {
  const found = allow.get(req.url);
  if (!found) {
    res.writeHead(req.url === "/favicon.ico" ? 204 : 404);
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": found[1] });
  res.end(found[0]);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    headless: false,
    args: ["--use-angle=metal", "--enable-precise-memory-info"],
  });
  const page = await browser.newPage({
      viewport: { width: 896, height: 300 },
      deviceScaleFactor: 1,
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.proofReady);
  const renderer = await page.evaluate(() => {
    const canvas = document.querySelector("canvas"),
      gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) throw Error("Native WebGL unavailable");
    return gl.getParameter(
      gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
    );
  });
  if (!/Metal Renderer: Apple M4/.test(renderer)) throw Error(renderer);
  const results = await page.evaluate(async () => {
    const s = window.proofScene,
      frames = window.proofFrames,
      rows = [],
      inventory = [],
      base = s.textures.getTextureKeys().length;
    for (let cycle = 0; cycle < 3; cycle++) {
      s.allocate();
      inventory.push({
        cycle,
        stage: "allocated",
        textures: s.textures.getTextureKeys().length,
      });
      for (const f of frames) {
        s.compose(f);
        s.compose(f, true);
        if (cycle === 0)
          rows.push({
            name: f.name,
            actual: await s.snapshot(s.scratch, f),
            control: await s.snapshot(s.control, f),
          });
      }
      s.release();
      inventory.push({
        cycle,
        stage: "released",
        textures: s.textures.getTextureKeys().length,
      });
      if (s.textures.getTextureKeys().length !== base)
        throw Error("Texture leak");
    }
    s.allocate();
    const intervals = [],
      cpu = [];
    let last = null;
    await new Promise((resolve) => {
      const frame = (at) => {
        if (last !== null) intervals.push(at - last);
        last = at;
        const start = performance.now();
        s.compose(frames[intervals.length % frames.length]);
        cpu.push(performance.now() - start);
        if (intervals.length === 600) resolve();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    return { rows, inventory, base, intervals, cpu };
  });
  const compare = (a, b) => {
    let different = 0,
      max = 0;
    for (let at = 0; at < a.length; at++) {
      const d = Math.abs(a[at] - b[at]);
      if (d) different++;
      max = Math.max(max, d);
    }
    return { differentChannels: different, maxChannelDelta: max };
  };
  const pixelResults = [];
  for (const row of results.rows) {
    const buffers = [];
    for (const kind of ["actual", "control"]) {
      const png = Buffer.from(row[kind].split(",")[1], "base64");
      await writeFile(
        resolve(directory, row.name + "-runtime-" + kind + ".png"),
        png,
      );
      buffers.push(await sharp(png).ensureAlpha().raw().toBuffer());
    }
    pixelResults.push({ name: row.name, ...compare(...buffers) });
  }
  await page.evaluate(async () => {
    const scene = window.proofScene,
      frame = window.proofFrames[7];
    scene.compose(frame);
    scene.compose(frame, true);
    await new Promise((resolve) =>
      scene.game.events.once("postrender", resolve),
    );
  });
  await page.screenshot({ path: resolve(directory, "runtime-native.png") });
  const stats = (values) => {
    const a = [...values].sort((a, b) => a - b),
      q = (p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
    return {
      count: a.length,
      p50: q(0.5),
      p95: q(0.95),
      p99: q(0.99),
      max: a.at(-1),
      over25: a.filter((x) => x > 25).length,
    };
  };
  const report = {
    renderer,
    phaser: "4.2.1",
    productionApproved: false,
    probeSha256: hash(await readFile(new URL(import.meta.url))),
    reviewSha256: hash(await readFile(resolve(directory, "review.json"))),
    patchAtlas: {
      width,
      height,
      pngBytes: patchPng.length,
      decodedBaseBytes: pixels.length,
    },
    proposedSingleScratchBaseBytes: 448 * 448 * 4,
    controlScratchOnlyForComparison: true,
    pixelResults,
    inventory: results.inventory,
    frames: stats(results.intervals),
    submissionCpuMs: stats(results.cpu),
    errors,
  };
  await writeFile(
    resolve(directory, "runtime.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || pixelResults.some((r) => r.maxChannelDelta !== 0))
    throw Error("Runtime composition differs from offline control");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
