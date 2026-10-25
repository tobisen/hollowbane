# Q3-A pipeline recovery — DBL-023/024/025/026

2026-10-25. Scope: one Warrior, southeast, idle and walk. No live replacement,
other classes, additional directions, monsters, bosses, environment or audio.
The three rejected imagegen sources remain quarantined in `assets/source/q3`.
The prerequisite is exact-commit release acceptance of
`f852ad103663623a613e656500bf3223874b0814`, CI40221857287. Production must wait
until its mandatory CI, Pages and hosted acceptance succeed.

## Pipeline evaluation

| Approach                           | Consistency / quality                                                                                                                                     | Automation / repeatability                                                                                                         | Eight directions later                                                     | Cost / tools                                                                                    | Phaser integration                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A. Rigged 3D → fixed-camera frames | Fixed geometry, articulated joints, attached weapon, consistent lights. Foot contacts can be constrained. Modeling and motion still need artistic review. | Highest: versioned geometry, rig, poses, camera and export; no per-frame generation or fitting.                                    | Re-render the same model; inspect silhouettes and occlusion at each angle. | Blender is free; initial model/rig authoring is the main cost. No existing local Blender found. | Offline RGBA frames/atlas; ordinary sprites; no runtime 3D dependency. |
| B. Layered 2D parts/transforms     | Stable painted parts and proportions. Joint seams, foreshortening and depth-order changes need care.                                                      | High within a view; fixed pivots, transforms and layer order can be scripted.                                                      | Requires separately authored views or substantial redraws.                 | Existing SVG/Sharp/browser tools suffice; commercial animation tools are optional.              | Bake frames to the same atlas contract; no skeletal runtime needed.    |
| C. Controlled individual poses     | Allows detailed painting, but identity, scale and anatomy may still vary. Alignment cannot fix anatomy or temporal discontinuity.                         | Medium/low: artist-approved keys plus manual correction; reproducible postprocessing does not make source generation reproducible. | Each view multiplies source-pose review.                                   | Existing image tools available; recurrent generation/retouching cost.                           | Same atlas path, after all poses pass review.                          |

**Selected direction: A**, subject to a working local renderer and an acceptable
pilot. Use an original articulated armor model, fixed orthographic camera,
fixed lighting, an immutable ground root and explicit alternating planted feet.
Keep the sword attached to its hand. Render each pose independently into the
same frame window; pack afterwards without trimming or rescaling individual
frames. Do not use more dense generated pose sheets.

The reference is the project's `public/assets/menu-warrior-v1.webp`: dark hair
and beard, worn dark steel armor, layered shoulders, burgundy scarf/tabard,
leather belt and boots, and a straight sword. The shipped runtime comparison
is `wanderer.webp`, southeast row7; the portrait supplies identity, not animation
poses. A procedural model may have a more sculptural finish than the painted
reference. If that is visibly unsuitable, refine the model/materials before
expanding production; passing geometry checks is not art approval.

## Verified tool availability

Initial inspection: Apple Silicon (`arm64`); no `blender`, `inkscape`, `convert`
or `ffmpeg` on PATH; no Blender app in system/user Applications or Homebrew
locations; Python has no `bpy`. Node, project Sharp, Playwright and Phaser4.2.1
are installed. A pinned official Blender4.5.3 Apple Silicon portable application
was verified in `/private/tmp/hollowbane-q3-recovery`, not installed system-wide.
Official DMG SHA256:
`73ea841053b55404bb3a71a9a22366f1f8821787fe5c899f8b55a7fff929d01b`.
Blender reports4.5.3 LTS / build67807e1800cc. A64×64 orthographic Cycles
RGBA diagnostic render succeeds with native access. Sandboxed startup crashes
in Metal device detection before running Python; keep this tool limitation
separate from animation quality. The diagnostic contains only Blender's default
cube and is not a character asset or production evidence.
Two diagnostic exports had identical decoded RGBA SHA256
`c595e036d12489bc27d43706314f46cdc199e0ad719150d052dd803e1e432bd4`.
PNG metadata includes render timestamps, so reproducibility must compare decoded
pixels or normalized exports, not unprocessed Blender PNG container bytes.

References: [Blender downloads](https://www.blender.org/download/),
[portable use and platform requirements](https://www.blender.org/download/requirements/),
[Phaser frame animation](https://docs.phaser.io/phaser/concepts/animations).
The selected method is a project engineering judgment, not a claim that these
tools automatically produce production-quality art. Local Phaser4.2.1 types
and actual preview playback remain the integration authority.

## Acceptance contract

Require uniform RGBA dimensions, nonempty alpha, clear cell margins, fixed root,
constant model scale, complete sword bounds, bounded edge alpha, valid unique
ordered sequences, atlas/source identity and file budgets. Inspect contact and
passing poses, loop seam, planted-foot motion, sword/body clearance, silhouette,
lighting and halos over both dark and light backgrounds. Compare at shipped
display scale as well as magnification. Record measurable checks separately from
visual judgments and user approval.

The isolated developer showcase must expose idle/walk, speed, stepping, ground
root/collision overlays and shipped comparison, plus Phaser placement, movement
and zoom. Keep saves and production simulation untouched. No full character-set
claim follows from this pilot.

## Delivered pilot and release prerequisite

The prerequisite **f852ad103663623a613e656500bf3223874b0814** passed exact
[CI40221857287](https://github.com/tobisen/hollowbane/actions/runs/40221857287),
all mandatory jobs, Pages, hosted checks and Release acceptance. An independent
hosted comparison matched all41 sealed files and the previously tested P2 bytes.
No prerequisite repair was necessary. Pipeline evaluation was checkpointed in
0021119 before production began.

The original articulated Warrior now has **8 idle and16 walk poses, southeast
only**. Source: `assets/source/q3/warrior-rig-v1/warrior.py` and `warrior.blend`.
The Blender file contains the mesh parts, materials, lights, actual armature,
keyframes1–24 and separate clip range markers. The script is the authoritative
regeneration recipe. No purchased/downloaded meshes, textures, mocap or new
image-generation calls were used. The original menu illustration supplied only
identity reference. Meshes, rig, procedural materials, motion and export scripts
are original project work. All assets are inventoried in `docs/assets.json`;
the isolated pilot is user-approved; full production adoption remains a placeholder.

Preview: `?developer=1&warriorPilot=1`. This is an explicit, lazy developer route;
normal entry neither imports it nor fetches its atlas. The showcase has separate
idle/walk clips,0.25–2× playback, exact forward/backward stepping, light/dark/checker
backgrounds, planted/swing contacts, root and collision guides, shipped sprite
and portrait comparisons, and a Phaser4.2.1 stage with1–2× camera zoom. Focus the
stage and hold D/Space to move southeast. Release to idle. No character owner,
world save, equipment, combat or live art is changed. Existing pure `moveTick`
and isometric projection are reused without edits.

The atlas is lossless PNG,1536×1024,24 fixed256px cells, root128,210. One shared
512→256 reduction is used for every pose. No individual fitting, translation,
trimming or scale normalization occurs. The final camera is orthographic2.24,
30° elevation (2:1 ground projection). One fixed Cycles seed24 and48 samples,
AgX and fixed lighting apply to all poses. The sword is rigidly bound to its hand;
legs use constant-length segments and explicit alternating ground contacts.

Early attempts and corrections:

- `blockout-v1.py` retains the first rig blockout: rejected for rounded/bright
  armor and an overly crouched resting stance. It is a source reference, not a
  runtime asset. Fitted plates, darker material variation, narrower shoulders,
  revised stance and finer hair/face details replaced that presentation.
- The first camera window allowed a forward boot to reach the cell edge. The
  validator caught it. A single wider camera window and root210 corrected every
  frame together; no frame-specific repairs were used.
- Alpha compositing changes edge RGB through rounding. Packing now copies raw
  pixels directly. WebP also rewrote RGB under fully transparent pixels; PNG was
  selected to preserve exact decoded RGBA. The delivered PNG remains within its768KiB download and6MiB decoded budgets. Resize ringing at alpha≤4/255
  is cleared uniformly; antialiased edges above that remain.

## Reproduce and verify

Use the checksum-verified Blender4.5.3 executable described above. On this Mac it
is `/private/tmp/hollowbane-q3-recovery/blender-mount/Blender.app/Contents/MacOS/Blender`.
The read-only mounted app is temporary; it is not a project dependency or system
installation. Native access is required here because sandboxed Metal detection
crashes. Keep render output outside the repository:

```sh
"$BLENDER_BIN" --background --factory-startup --python-exit-code 1 \
  --python assets/source/q3/warrior-rig-v1/warrior.py -- /private/tmp/warrior-render
node scripts/package-warrior-pilot.mjs /private/tmp/warrior-render
node scripts/validate-warrior-pilot.mjs
```

Set `BLENDER_BIN` to the verified application executable. Packaging copies the
source `.blend`, records source/rig/reference fingerprints and writes only the
isolated pilot atlas and metadata. Renderer version, atlas dimensions, ordered
unique sequences, fixed root, bone lengths, planted contacts/stance velocity,
complete projected weapon bounds, alpha margins/fringes, per-frame decoded hashes,
file hash and768KiB/6MiB budgets are checked. `validate:assets` includes this audit.
The final PNG is670868bytes; all24 cells have at least10px clear margin. A single
frame has one isolated very-low-alpha pixel; no distracting halo was observed.
The five negative asset cases reject corrupted roots, sequences, weapon bounds,
bone scale and clipped pixels even with recomputed hashes.

For an independent five-pose rerender:

```sh
"$BLENDER_BIN" --background --factory-startup --python-exit-code 1 \
  --python assets/source/q3/warrior-rig-v1/warrior.py -- /private/tmp/warrior-repeat --sample
node scripts/compare-warrior-renders.mjs /private/tmp/warrior-repeat
```

Actual repeat results: all rig metadata and alpha match exactly; normalized RGB
changes are at most2/255 across at most21 of262144 channels in any reviewed frame.
This is consistent with floating-point rendering/denoising precision, not pose
variation. The comparison rejects larger differences and permits changes in at
most0.1% of channels; it never aligns/resizes to match. **Do not claim byte-identical
Blender rerenders or cross-platform determinism.** Packing the same source renders
is exact; PNG timestamps are stripped and the delivered atlas/frame hashes are
strict. The earlier cube probe happened to reproduce exactly.

## Visual and movement quality review

All16 walk poses were inspected at gameplay scale, with browser light/dark,
comparison and native Metal captures. Alternating contact, passing and lifted-foot
poses are distinct; armor proportions, grip, sword silhouette, lighting and root
remain coherent. No cell/weapon clipping or distracting edge halo was observed.
The pilot is deliberately **not** a portrait crop or eight-direction character set.

The fixed body geometry is a clear consistency improvement over the rejected
image-generated strips. Its material/face finish is more sculptural and less
painted than the identity reference. The user explicitly accepted this isolated pilot after reviewing the stated style
and cadence limitations (2026-10-25: “Accept the isolated pilot”). Automated checks
did not supply that approval; live replacement is still outside this acceptance.

The stage selects walk frames from actual distance, so input release stops gait
progress and camera zoom does not change stride. Its physical stride projects to
approximately0.568world units/cycle at the pilot's display scale. Authored18fps
matches about0.64world/s. The unchanged gameplay walking speed is3world/s, which
requires about5.28cycles/s to keep planted feet from sliding. The speed slider
exposes this tension; the pilot does **not** silently change production speed or
claim that natural walking at3world/s is artistically approved. Review that cadence
before live adoption. No locomotion, wall sliding, camera pacing or combat code
was modified. Full production adaptation is not implied by this isolated preview.

## Tests and performance

Six focused asset tests, three Chromium preview/stepping/movement/zoom/save-isolation
and lazy-entry cases, TypeScript, affected ESLint, formatting, asset validation and
production build pass. Screenshots and the16-frame contact sheet were reviewed.
One initial browser driver failure was an unpassed host closure value; the driver
was corrected without changing application behavior or deadlines. No local campaign,
loot, inventory or full regression suite was run for this pilot. The existing CI
classifier still decides the mandatory release tier; tooling/assets are Full inputs.

Three alternating baseline/pilot pairs on a visible Apple M4 / native Metal /
Chromium156.0.8078.4 window, zoom2, moving at0.64world/s, comparison paused, one-second
frame warm-up then240 measured RAF intervals each: baseline p9517.2/17.4/17.6ms;
pilot17.4/17.4/17.6ms. Both p5016.7ms, longest≤17.7ms; zero intervals>25/33/50ms.
No meaningful regression was observed in this **empty developer stage**. This is
not full combat/forest performance, physical-controller evidence or a universal
pacing guarantee. Raw data and captures remain outside git under
`/private/tmp/hollowbane-q3-recovery`; concise results are in [pilot-review.json](pilot-review.json).

```sh
node scripts/profile-warrior-pilot.mjs \
  'http://127.0.0.1:4173/hollowbane/?developer=1&warriorPilot=1' \
  /private/tmp/warrior-performance.json
```

The user approved this isolated Warrior pilot and pipeline. Stop after its release
verification. Do not produce other classes, directions, monsters, bosses or Q3
environment/audio. The shipped Warrior presentation remains unchanged. Appearance
refinement and production-speed cadence for live adoption remain separate work;
a complete production character set is not claimed.
