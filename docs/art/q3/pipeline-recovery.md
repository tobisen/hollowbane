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
