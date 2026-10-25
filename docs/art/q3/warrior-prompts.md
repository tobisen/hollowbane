# Q3-A Warrior prompts and provenance

Method: built-in imagegen,2026-10-25, three calls, transparent-background requested.
Original project reference only: `assets/source/menu-warrior-v1.png` for v1;
v1 generated source for v2. No CLI/API fallback or third-party imagery.

Original built-in outputs retained in
`/Users/tobiasbertilsson/.codex/generated_images/01a1744f-38ba-7db2-9aa1-434ccfaa52b3/`:
v1 `exec-3833d8c0-1f8e-4001-96e4-3670e91f53a9.png`,
v2 `exec-480be162-700f-4b29-a6ac-b2b5f2d7274a.png`,
v3 `exec-c8bae63c-26a2-4ebd-b4da-9d4560e1d57d.png` (original menu Warrior reference).
Independent copies and fingerprints are retained in the repository. All sources
are rejected for production. Release provenance review remains pending.

## Initial generation specification

Original Hollowbane gameplay animation pilot, not a portrait: one consistent
adult male Warrior, short dark hair, worn steel plate, charcoal leather, small
crimson shoulder cloth, bronze clasp, practical straight sword in right hand.
Grounded painterly dark fantasy, readable at100px, orthographic2:1 elevated
camera facing southeast in every frame, cold upper-left light and restrained
warm edge. Transparent, no floor, shadow, VFX, text or grid lines. Six columns
by eight rows,1536×2048 target,256px cells, standing body176px, foot root128,224,
16px clear margins, invariant identity, anatomy, materials, weapon and scale.
Six chronological frames per row: idle breathing; grounded alternating walk;
longer-stride forward-lean run; melee ready/backswing/anticipation/contact/follow
through/recover; cast with empty left hand and attached right sword; sword block;
hit recoil/recovery; stagger/kneel/fall/contact/collapse/prone death. No resizing
death to standing height; corpse and sword must fit the cell. Natural anatomy,
crisp alpha, no franchise content, skulls, shields, trails or extra characters.

## Exact alignment correction prompt

Use case: precise-object-edit. This is the original Hollowbane Warrior gameplay sprite atlas. Preserve the SAME Warrior identity, armor, crimson cloth, sword, lighting, southeast direction, eight action rows and six chronological frames per row. Correct ONLY sprite-sheet production layout/alignment.
Output exact six-column eight-row regular grid with generous transparent padding per cell. True transparent background. Target 1536x2048, square 256px cells. Standing character head-to-foot is 148px, root at cell (128,208), leave at least24px transparent on ALL FOUR edges of EVERY cell including sword tips. Same global figure scale across all48 frames, no per-frame scaling. Feet/root consistent for idle/walk/run/melee/cast/block/hit. Preserve natural lowered height in the six-frame death row; final prone corpse must fit FULLY inside its own cell with24px clear margins. Melee sword and raised block swords cannot enter the preceding row. Keep one character completely inside each cell with no foreign pixels, no labels/grid lines/floor/shadow. Rows idle/walk/run/melee/cast/block/hit/death unchanged; chronological motion and alternating strides retained. Shorten sword reach by bending arm/pose, not shrinking the figure. Crisp clean alpha, no colored fringe. DO NOT crop limbs, weapons, heads or death pose.

## Exact smaller-strip prompt

Use case: stylized-concept. Make a NEW ORIGINAL Hollowbane Warrior gameplay WALK animation sprite sheet, NOT a portrait. Reference is original project costume/material/face only. Exactly SIX full-body isometric Warrior figures in a strict TWO columns THREE rows regular grid,1024x1536 image with square512x512 cells. ONE character per cell. Every figure faces screen southeast/down-right under orthographic elevated 2:1 dimetric camera. Same adult human short-dark-haired Warrior, worn steel plate, charcoal leather, small crimson shoulder cloth and bronze clasp. One straight sword stays in right hand at lowered ready carry; same hand/grip and sword length throughout. Grounded realistic painterly game sprites, cold upper-left key, readable broad silhouette. NO floor/shadow/scenery/VFX/grid/labels. True transparent background. CRITICAL: character only occupies central300px height of each512px cell, stationary root at cell coordinate256,400. At least70px totally transparent on all four edges of EVERY cell, sword included. Never fill cell. Same figure size throughout, entire body and sword always inside cell. SIX chronological WALK-cycle frames read left-right then top-bottom:1 left heel contact right toe behind,2 left leg supporting body right leg passing,3 right leg swinging forward left toe pushing,4 right heel contact left toe behind,5 right leg supporting left leg passing,6 left leg swinging forward right toe pushing. Grounded walk, no running, no big leap. Gentle alternating gait, consistent head height and physical volume, modest cloth swing. Each pose is a new in-place animation frame, not a duplicated portrait. Preserve constant camera, costume, body scale and light. Six total figures, no other characters, clean alpha edges, generous safety padding, no franchise designs or watermark.
