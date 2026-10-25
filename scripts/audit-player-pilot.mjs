import sharp from "sharp";
import { format } from "prettier";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

// Offline source review only. Never trims/rescales individual poses or publishes.
const actions = [
  "idle",
  "walk",
  "run",
  "melee",
  "cast",
  "block",
  "hit",
  "death",
];
const sources = process.argv.slice(2);
if (!sources.length) throw Error("Pass one or more source PNG paths");
const reports = [];
for (const path of sources) {
  const walkOnly = path.endsWith("/warrior-walk-se-v3.png");
  const rows = walkOnly ? 3 : 8;
  const columns = walkOnly ? 2 : 6;
  const bytes = await readFile(path);
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const frames = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x0 = Math.round((col * info.width) / columns);
      const x1 = Math.round(((col + 1) * info.width) / columns);
      const y0 = Math.round((row * info.height) / rows);
      const y1 = Math.round(((row + 1) * info.height) / rows);
      let left = x1,
        right = -1,
        top = y1,
        bottom = -1,
        opaque = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 24) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
            opaque++;
          }
        }
      }
      // Minimum 8 logical pixels on a 128px cell, including weapon tips.
      const required = Math.ceil(Math.min(x1 - x0, y1 - y0) / 16);
      const margin = opaque
        ? Math.min(left - x0, x1 - 1 - right, top - y0, y1 - 1 - bottom)
        : -1;
      frames.push({
        action: walkOnly ? "walk" : actions[row],
        column: col,
        opaque,
        margin,
        required,
        bounds: opaque
          ? {
              x: left - x0,
              y: top - y0,
              width: right - left + 1,
              height: bottom - top + 1,
            }
          : null,
        clearCell: opaque > 200 && margin >= required,
      });
    }
  }
  reports.push({
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    width: info.width,
    height: info.height,
    directions: ["southeast"],
    rows,
    columns,
    decodedBytes: info.width * info.height * 4,
    gridAccepted: frames.every((frame) => frame.clearCell),
    productionAccepted: false,
    manualReviewRequired: [
      "foot roots",
      "constant body scale",
      "weapon grip",
      "temporal continuity",
      "alpha fringe",
      "rights review",
    ],
    frames,
  });
}
await writeFile(
  "docs/art/q3/warrior-audit.json",
  await format(JSON.stringify(reports), { parser: "json" }),
);
for (const report of reports)
  console.log(
    `${report.path}: ${report.width}x${report.height}, ${report.bytes} bytes; ${report.frames.filter((f) => !f.clearCell).length}/${report.frames.length} cells fail margin/occupancy; production blocked`,
  );
