import sharp from "sharp";
import { readFile } from "node:fs/promises";
const directory = process.argv[2];
if (!directory) throw Error("Pass a Blender --sample render directory");
const meta = JSON.parse(
  await readFile("public/dev/warrior-pilot/warrior.json", "utf8"),
);
const rig = JSON.parse(await readFile(`${directory}/rig.json`, "utf8"));
const reports = [];
for (const name of [
  "idle-se-00",
  "walk-se-00",
  "walk-se-04",
  "walk-se-08",
  "walk-se-12",
]) {
  const frame = meta.frames.find((f) => f.name === name),
    repeated = rig.frames.find((f) => f.name === name);
  for (const key of ["root", "contacts", "boneLengths", "weaponBounds"])
    if (JSON.stringify(frame[key]) !== JSON.stringify(repeated[key]))
      throw Error(`Rig reproduction drift: ${name}:${key}`);
  const actual = await sharp(`${directory}/${name}.png`)
    .resize(256, 256)
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < actual.length; i += 4)
    if (actual[i + 3] <= 4) actual.fill(0, i, i + 4);
  const expected = await sharp("public/dev/warrior-pilot/warrior.png")
    .extract({ left: frame.x, top: frame.y, width: 256, height: 256 })
    .raw()
    .toBuffer();
  let changedChannels = 0,
    maxRgbDelta = 0,
    maxAlphaDelta = 0;
  for (let i = 0; i < actual.length; i++) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta) changedChannels++;
    if (i % 4 === 3) maxAlphaDelta = Math.max(maxAlphaDelta, delta);
    else maxRgbDelta = Math.max(maxRgbDelta, delta);
  }
  // Cycles/OIDN floating-point scheduling can move a few RGB quantization values.
  // Geometry and alpha must reproduce exactly; never fit, align or rescale to pass.
  if (
    maxAlphaDelta !== 0 ||
    maxRgbDelta > 2 ||
    changedChannels > actual.length * 0.001
  )
    throw Error(
      `Pixel reproduction drift: ${name}: ${JSON.stringify({ changedChannels, maxRgbDelta, maxAlphaDelta })}`,
    );
  reports.push({
    name,
    changedChannels,
    maxRgbDelta,
    maxAlphaDelta,
    geometryExact: true,
  });
}
console.log(JSON.stringify(reports, null, 2));
