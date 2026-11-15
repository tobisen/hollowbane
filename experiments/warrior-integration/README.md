# Warrior integration review

DBL-035/375/379 · 2026-11-15 · isolated `?visualPlayable=1` candidate.
Human character-art acceptance remains pending.

Build with `npm run build`, serve with `npm run preview -- --host 127.0.0.1`,
then open <http://127.0.0.1:4173/hollowbane/experiments/warrior-integration/>.
Use browser zoom100% for the1280×800 matched comparison; narrow windows scroll.
The playable route links this comparison. The continuous native M4 recording
shows actual keyboard movement in all eight directions; it is not a sprite demo.

`review/baseline.png` is actual deployed-baseline source `aefe578` presentation.
`review/improved.png` is the candidate. Both use1280×800 canvas, zero camera offset,
root(620,495), South idle0 and display scale0.5. The approved empty image is linked
directly from `../visual-foundation/review/actual-1280x800.png`; no copy or edit.

## Provenance and reproducibility

The original eight Warrior atlases remain in `public/dev/warrior-directions/`.
They are project-authored Blender assets; their source rig, camera and original
provenance remain authoritative. No third-party character or reference pixels
were used. The environment retains its separate original-generation record.

Run `node scripts/package-visual-warrior.mjs --proof` for the single South idle
material proof, then `node scripts/package-visual-warrior.mjs` for the bounded
runtime derivative. Each input is checked against its original SHA256. The
manifests record source/output hashes, exact tonal curve and bytes.

The derivative only treats existing RGB values and drops unused run rows. It
reuses192 existing idle/walk cells; zero new poses, resampling, random grain,
alpha/pivot edits or production-atlas replacements. All alpha bytes are tested
against the original source. Highlights compress while dark mids rise; cool
chroma is reduced. This cannot alter physical roughness, geometry or baked light
direction. The single-proof inspection supported this bounded improvement rather
than a replacement character pipeline; that decision is provisional pending art
review. No runtime full-frame filter is used.

Scale remains0.5, source256×264 cells/root(128,210), approximately95px body,
30° authored camera. Prototype-only1.2cycles/s follows the original1.04172-unit
stride; phase stays travel-driven. Keyboard diagonals follow the source2:1
projection. Shared pathfinding/collision and production movement/stats remain.
Arbitrary mouse paths approximate facing with the nearest of eight existing views.

A100ms previous-pose fade softens starts/stops/turns over the opaque current body.
Both roots/depths move together. This is a short presentation blend, not skeletal
interpolation or new transition animation; brief silhouette overlap is possible.
The soft contact texture approximates environmental contact, not directional
shadow reconstruction. Eight conservative exact-source masks preserve the finite
background; hidden geometry and finely segmented leaves are unavailable.

See [diagnosis and verification](../../docs/art/warrior-integration-phase2.md).
No enemies, combat, campaign conversion, expanded map, save migration or engine
change is included. Stop for human visual review after hosted verification.
