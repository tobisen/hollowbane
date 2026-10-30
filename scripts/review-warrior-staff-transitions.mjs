/** Actual simulation transition matrix and native playback of unchanged staff art. */
/* global window, document */
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { Buffer } from "node:buffer";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
const args = process.argv.slice(2),
  auditOnly = args.at(-1) === "--audit";
if (auditOnly) args.pop();
const [root, output] = args.map((p) => resolve(p));
if (
  !root ||
  !output ||
  root === output ||
  [root, output].some((p) => !relative(process.cwd(), p).startsWith(".."))
)
  throw Error("Pass external candidate and output directories");
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
await build({
  entryPoints: ["tests/helpers/warrior-staff-transitions.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: resolve(output, "matrix.mjs"),
});
const { staffTransitionMatrix, STAFF_TRANSITION_STEP_LIMIT } = await import(
  pathToFileURL(resolve(output, "matrix.mjs")).href
);
const cases = staffTransitionMatrix();
await writeFile(resolve(output, "matrix.json"), JSON.stringify(cases));
const reachable = cases.filter((c) => c.appliedAt !== null);
const failures = reachable.filter(
  (c) =>
    Math.max(...c.rows.map((r) => r.step)) >
    STAFF_TRANSITION_STEP_LIMIT + 1e-12,
);
const summary = {
  authoredMaximumStep: STAFF_TRANSITION_STEP_LIMIT,
  cases: cases.length,
  reachable: reachable.length,
  oldMaximumStep: Math.max(
    ...reachable.flatMap((c) => c.rows.map((r) => r.oldStep)),
  ),
  maximumStep: Math.max(...reachable.flatMap((c) => c.rows.map((r) => r.step))),
  failures: failures.map(({ rows, ...c }) => ({
    ...c,
    maximumStep: Math.max(...rows.map((r) => r.step)),
  })),
  productionApproved: false,
  completeStaffConfiguration: false,
  deathBridgeProbe: true,
  deathBodyVisualAccepted: false,
};
await writeFile(
  resolve(output, "matrix-summary.json"),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary));
if (failures.length)
  throw Error(
    "Attachment transition exceeds the unchanged authored stroke envelope",
  );
const catalog = JSON.parse(
    await readFile("tests/fixtures/warrior-staff-attachments.json"),
  ),
  routes = new Map(),
  textures = {},
  resources = [];
let verifiedFrames = 0;
for (const [clip, folder, files] of [
  [
    "movement",
    "carry-eight-native",
    ["carry-0", "carry-1", "carry-2", "carry-3"],
  ],
  ["primary", "eight-primary", ["primary"]],
  ["iron-fan", "ability-iron-fan-eight-native", ["iron-fan"]],
  ["oath-echo", "ability-oath-echo-eight-native", ["oath-echo"]],
  ["hit", "hit-eight-native", ["hit"]],
  ["hit-extended", "hit-extended-eight-native", ["hit-extended"]],
  ["death", "death-eight-native", ["death"]],
]) {
  const directory = resolve(root, folder),
    prior = JSON.parse(await readFile(resolve(directory, "review.json"))),
    expected = new Map();
  if (prior.errors.length || prior.cpuRoundTrips !== prior.gpuRoundTrips)
    throw Error("Unverified prior atlas");
  for (const input of prior.inputs) {
    const proofBytes = await readFile(resolve(input.directory, "staff.json")),
      proof = JSON.parse(proofBytes),
      review = JSON.parse(
        await readFile(resolve(input.directory, "review.json")),
      );
    if (
      hash(proofBytes) !== input.proofSha256 ||
      review.proofSha256 !== input.proofSha256 ||
      !review.sampledGeometryPassed
    )
      throw Error("Changed source proof");
    if (
      proof.samples[0].direction === "se" &&
      input.proofSha256 !==
        catalog.inputs.find((i) => i.clip === clip)?.proofSha256
    )
      throw Error("Changed attachment proof");
    if (proof.samples[0].direction === "se")
      for (const sample of proof.samples) {
        const f = catalog.frames[clip + ":" + (sample.ordinal ?? sample.index)],
          n = Math.hypot(...sample.axis),
          axis = sample.axis.map((v) => v / n);
        const guides = {
          palm: sample.palmR,
          left: sample.palmR.map((v, i) => v + 0.24 * axis[i]),
          tip: sample.palmR.map((v, i) => v + 1.4 * axis[i]),
        };
        for (const key of ["palm", "left", "tip"])
          if (
            !f ||
            f[key].length !== 3 ||
            f[key].some(
              (v, i) =>
                !Number.isFinite(v) || Math.abs(v - guides[key][i]) > 1e-12,
            )
          )
            throw Error("Changed attachment vectors");
      }
    for (const sample of proof.samples)
      expected.set(
        sample.direction + "-" + (sample.ordinal ?? sample.index),
        review.reports.find((r) => r.name === sample.name).pixelSha256,
      );
  }
  for (const file of files) {
    const png = await readFile(resolve(directory, file + ".png")),
      metadata = await readFile(resolve(directory, file + ".json")),
      atlas = JSON.parse(metadata),
      pixels = await sharp(png).ensureAlpha().raw().toBuffer();
    const key = clip + "-" + file;
    for (const [name, f] of Object.entries(atlas.frames)) {
      const restored = Buffer.alloc(512 * 512 * 4);
      if (f.rotated || f.sourceSize.w !== 512 || f.sourceSize.h !== 512)
        throw Error("Changed source trim");
      for (let y = 0; y < f.frame.h; y++)
        pixels.copy(
          restored,
          ((f.spriteSourceSize.y + y) * 512 + f.spriteSourceSize.x) * 4,
          ((f.frame.y + y) * atlas.meta.size.w + f.frame.x) * 4,
          ((f.frame.y + y) * atlas.meta.size.w + f.frame.x + f.frame.w) * 4,
        );
      if (hash(restored) !== expected.get(name))
        throw Error("Changed source pixels");
      textures[clip + ":" + name] = { key, frame: name };
      verifiedFrames++;
    }
    routes.set("/" + key + ".png", [png, "image/png"]);
    routes.set("/" + key + ".json", [metadata, "application/json"]);
    resources.push({
      key,
      pngBytes: png.length,
      decodedBaseBytes: atlas.meta.size.w * atlas.meta.size.h * 4,
      pngSha256: hash(png),
      metadataSha256: hash(metadata),
    });
  }
}
if (verifiedFrames !== 832) throw Error("Incomplete staff states");
if (auditOnly) {
  await writeFile(
    resolve(output, "audit.json"),
    JSON.stringify(
      {
        producerSha256: hash(await readFile(new URL(import.meta.url))),
        matrix: summary,
        verifiedFrames,
        resources,
        productionApproved: false,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const selected = reachable.filter(
    (c) =>
      c.speed === 0 &&
      c.recovery === 0 &&
      (c.killFrame === null || (c.action === "primary" && c.targetFrame === 4)),
  ),
  names = ["s", "sw", "w", "nw", "n", "ne", "e", "se"];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden}canvas{display:block}</style></head><body><script src="/phaser.js"></script><script>
const plans=${JSON.stringify(selected)},textures=${JSON.stringify(textures)},resources=${JSON.stringify(resources)},names=${JSON.stringify(names)};
class Review extends Phaser.Scene{
preload(){for(const a of resources)this.load.atlas(a.key,'/'+a.key+'.png','/'+a.key+'.json');}
create(){if(Phaser.VERSION!=='4.2.1'||resources.some(a=>!this.textures.exists(a.key)))throw Error('Missing candidate texture');this.views=names.map((d,i)=>{this.add.text(80+i%4*320,35+Math.floor(i/4)*280,d);return this.add.sprite(160+i%4*320,230+Math.floor(i/4)*280).setOrigin(.5,338/512).setScale(.5);});this.label=this.add.text(8,8,'',{fontSize:'14px'});this.case=0;this.i=0;this.acc=0;this.playing=false;this.old=false;window.staffReview=this;window.staffReady=true;}
draw(r){for(let j=0;j<8;j++){const f=this.old?r.oldFrame:r.frame,t=textures[f.clip+':'+names[j]+'-'+f.frame];if(!t)throw Error('Missing pose');this.views[j].setTexture(t.key,t.frame);}const c=plans[this.case];this.label.setText(c.action+' '+c.targetFrame+' → '+c.effect+' · tick '+r.tick+' · '+(this.old?'previous selector':'body-unaccepted probe')+' · gameplay1×');this.current=r;}
update(t,delta){if(!this.playing)return;this.acc+=delta;while(this.acc>=1000/60){this.acc-=1000/60;const c=plans[this.case];this.draw(c.rows[this.i]);this.i++;if(this.captureTick===this.current.tick){this.playing=false;break;}if(this.i===c.rows.length){this.i=c.rows.length-1;this.playing=false;window.staffFinished=true;}}}
}
new Phaser.Game({type:Phaser.WEBGL,width:1280,height:640,backgroundColor:'#252c30',banner:false,scene:Review});
</script></body></html>`;
await writeFile(resolve(output, "review.html"), html);
routes.set("/", [Buffer.from(html), "text/html"]);
routes.set("/phaser.js", [
  await readFile("node_modules/phaser/dist/phaser.js"),
  "text/javascript",
]);
const server = createServer((req, res) => {
  const r = routes.get(req.url);
  res.writeHead(
    r ? 200 : req.url === "/favicon.ico" ? 204 : 404,
    r ? { "Content-Type": r[1] } : {},
  );
  res.end(r?.[0]);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    headless: false,
    args: ["--use-angle=metal"],
  });
  const page = await browser.newPage({
      viewport: { width: 1280, height: 640 },
      deviceScaleFactor: 1,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.waitForFunction(() => window.staffReady);
  const native = await page.evaluate(() => {
    const canvas = document.querySelector("canvas"),
      gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return gl.getParameter(
      gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
    );
  });
  if (!/Metal Renderer: Apple M4/.test(native)) throw Error(native);
  for (let index = 0; index < selected.length; index++) {
    await page.evaluate((index) => {
      const s = window.staffReview;
      s.case = index;
      s.i = 0;
      s.acc = 0;
      s.playing = true;
      window.staffFinished = false;
    }, index);
    await page.waitForFunction(() => window.staffFinished);
  }
  // Captures replay real sequences around the demonstrated entry and landing.
  for (const [action, targetFrame, effect] of [
    ["primary", 4, "death"],
    ["primary", 3, "hit"],
    ["iron-fan", 4, "death"],
    ["oath-echo", 5, "hit"],
  ]) {
    const index = selected.findIndex(
        (c) =>
          c.action === action &&
          c.targetFrame === targetFrame &&
          c.effect === effect,
      ),
      c = selected[index];
    for (const old of [true, false])
      for (const background of ["dark", "light"]) {
        await page.evaluate(
          ({ index, old, background }) => {
            const s = window.staffReview;
            s.case = index;
            s.i = 0;
            s.acc = 0;
            s.old = old;
            s.cameras.main.setBackgroundColor(
              background === "dark" ? "#252c30" : "#d9d6cd",
            );
            s.label.setColor(background === "dark" ? "#fff" : "#111");
          },
          { index, old, background },
        );
        for (const target of [
          c.appliedAt,
          c.appliedAt + 1,
          c.appliedAt + 5,
          c.appliedAt + 10,
          c.appliedAt + 30,
        ]) {
          await page.evaluate((target) => {
            const s = window.staffReview;
            s.captureTick = target;
            s.playing = true;
          }, target);
          await page.waitForFunction(
            (target) =>
              window.staffReview.current?.tick === target &&
              !window.staffReview.playing,
            target,
          );
          await page.screenshot({
            path: resolve(
              output,
              `${action}-${targetFrame}-${effect}-${old ? "old" : "new"}-${background}-${target}.png`,
            ),
          });
        }
      }
  }
  const inventory = await page.evaluate(async (resources) => {
    const s = window.staffReview,
      cycles = [];
    for (const view of s.views) view.setVisible(false).setTexture("__DEFAULT");
    for (let cycle = 0; cycle < 3; cycle++) {
      const before = s.textures.getTextureKeys().length;
      for (const a of resources) s.textures.remove(a.key);
      const released = s.textures.getTextureKeys().length;
      await new Promise((resolve) => {
        s.load.once("complete", resolve);
        for (const a of resources)
          s.load.atlas(a.key, "/" + a.key + ".png", "/" + a.key + ".json");
        s.load.start();
      });
      if (resources.some((a) => !s.textures.exists(a.key)))
        throw Error("Missing reloaded staff texture");
      cycles.push({
        before,
        released,
        reloaded: s.textures.getTextureKeys().length,
      });
    }
    return cycles;
  }, resources);
  if (
    inventory.some(
      (c) =>
        c.before !== c.reloaded || c.before - c.released !== resources.length,
    )
  )
    throw Error("Staff resource leak");
  await writeFile(
    resolve(output, "review.json"),
    JSON.stringify(
      {
        producerSha256: hash(await readFile(new URL(import.meta.url))),
        matrix: summary,
        verifiedFrames,
        resources,
        native,
        playedCases: selected.length,
        inventory,
        actualSimulationTicks: cases.reduce((n, c) => n + c.rows.length, 0),
        errors,
        productionApproved: false,
        completeStaffConfiguration: false,
        deathBridgeProbe: true,
        deathBodyVisualAccepted: false,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error("Native errors");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
