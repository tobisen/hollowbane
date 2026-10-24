# M1-D original menu art — DBL-023/026/028

Method: built-in imagegen, October24,2026. Four final generation calls; no CLI/API
key or third-party input imagery. Sorcerer/Ranger reference only the new original
Warrior source for rendering, lighting, framing and setting. The common face,
shared sanctuary, moonlit key and amber rim intentionally read as one character
archetype set; heavy steel, long blue/violet robes and hood/leather/bow distinguish
classes. These are menu illustrations, not new gameplay sprites, equipment grants
or combat animation. Existing dedicated gameplay-art follow-ups remain open.

Native files are retained in `assets/source/menu-*-v1.png`. Background output was
1672×941 rather than the approximate1920×1080 prompt target; portraits are1024×1536.
`npm run assets:menu` exports a1600×900 WebP background, three512×768 portraits and
three160×200 upper-body thumbnails with an identical reviewed crop. Total runtime
payload379234bytes (~370KiB), under512KiB. Root loads only the background; card
thumbnails are lazy and full portraits are requested on class preview. No external
font or runtime animation system is added. Nominal decoded full set10862592bytes,
not a measured GPU allocation. No native-GPU or performance-hardware claim.

Export fingerprints/dimensions/bytes: [menu-inventory.json](menu-inventory.json).
Validation preserves all existing G1/W3 checks and adds explicit menu-type format,
dimension, per-file/total-budget and source/export fingerprint checks. Re-export
through `assets:export` also includes this menu set. Future intentional changes
need a reviewed new source/export diff and provenance update.

Original built-in outputs are retained under the Codex generated-images directory
`01a16e2a-2ebc-7a33-a7b9-640a21e6654b`: background `exec-f1102b09-93ac-4d04-a282-dafc4d03eb6c.png`,
Warrior `exec-8eb49176-e2b1-4c5b-9227-d5af7c29a33a.png`, Sorcerer
`exec-a8dfcce5-eb81-4dad-aa89-83b72de55d54.png`, Ranger
`exec-b057daa8-34ec-4bba-8752-c0a82b2baa76.png`. Workspace sources are independent copies.
No original source or older approved asset was replaced. Generic unknown-class
legacy metadata keeps its neutral diamond; no class is invented from its appearance.

## Final background prompt

Use case: stylized-concept. Asset type: original menu background for Hollowbane, a dark fantasy action RPG. Create one cinematic landscape image, 16:9 composition, approximately 1920x1080 source target. Ancient ruined gothic sanctuary deep within dense shadowy woodland, worn rain-dark basalt arches and crumbling stone vaults, black ivy, pale bone stone details and tarnished bronze lanterns. Cold desaturated moonlight from upper left, atmospheric mist, tiny distant embers and restrained warm torchlight. A sense of danger, mystery and a last refuge. Rich grounded painterly realism and natural materials, controlled fine detail, readable shadows rather than pure black. Composition supports an existing left-aligned title and navigation: keep the left 40 percent quiet, dark and low contrast, architectural focal point and distant warm sanctuary doorway to the right of center. Safe outer margins for ultrawide and narrow cropping. Scene fills the image. No text, lettering, logo, HUD, border, characters or watermark. Entirely original architecture and setting; no recognizable franchise content.

## Final Warrior prompt

Use case: stylized-concept. Asset type: original Warrior class portrait for the Hollowbane dark fantasy action RPG menu, first of a coherent three-portrait set. Vertical 2:3 composition, approximately 1024x1536. One original adult human adventurer, front-facing with a subtle three-quarter turn, framed from head to below the knees, centered, figure fills 80 percent of image height with safe margins. Battle-worn heavy steel armor over dark leather and charcoal cloth, restrained deep crimson cloth accent, practical sword held down beside body, powerful defensive silhouette. Grounded functional armor and natural anatomy; weathered human expression, no extravagant spikes. Rich realistic hand-painted concept illustration, fine tangible material detail, soft cold moonlit key from upper left and a restrained amber edge light from right, matching an ashbound gothic frontier of basalt, pale bone and tarnished bronze. Background: atmospheric dark blue-grey sanctuary wall and faint mist, subdued with no bright detail, feathered darkness near lower edge, same treatment intended for all three classes. Clear face and hands, readable shape, no pitch-black silhouette. No text, logos, labels, UI, frames, watermarks, extra characters or recognizable existing franchise costume.

## Final Sorcerer prompt

Reference: `assets/source/menu-warrior-v1.png` (original project art).

Use case: stylized-concept. Asset type: a NEW original Sorcerer class portrait for Hollowbane, matching this Warrior portrait as a coherent menu set. Input image role: style, background, lighting and framing reference only. Create a different original adult human elemental spellcaster, not the same character in armor. Preserve the reference's realistic hand-painted rendering, cold moonlit key from upper left and restrained amber rim from right, misty blue-grey gothic sanctuary backdrop, vertical 2:3 framing, camera height, centered full-body head-to-boots proportions and safe margins. Elegant practical charcoal/blue/violet layered robes, useful leather belt and modest bronze clasps, clear long robed silhouette distinct from heavy armor. One hand holds a compact blue-violet elemental light with a restrained warm flame accent, the other rests naturally; magic readable but does not hide the face or anatomy. Calm alert expression, natural anatomy and hands, weathered cloth and convincing materials. Same visual quality, focal hierarchy and grounded ashbound fantasy world as reference. No sword or heavy plate armor, no exposed-fantasy costume, no text, lettering, logo, UI, frame, watermark, extra characters or recognizable franchise content.

## Final Ranger prompt

Reference: `assets/source/menu-warrior-v1.png` (original project art).

Use case: stylized-concept. Asset type: a NEW original Ranger class portrait for Hollowbane, third member of a coherent menu set. Input image role: painting style, moonlit sanctuary background, camera framing and light reference only. Create a distinct adult human hunter/archer with a lean agile build and an original face. Preserve reference's vertical 2:3 centered full-body head-to-boots composition, figure scale, camera height, safe margins, realistic hand-painted material rendering, cold moonlight from upper left and subtle amber rim from right, atmospheric dark blue-grey ruined sanctuary and mist. Practical worn dark forest-green hood and short cloak, supple brown leather/light armor, simple bronze fittings, bow held naturally at the side in one hand, quiver and modest practical outdoor equipment. Clear agile precise silhouette with lighter shoulders than a Warrior; natural anatomy, believable bow, hands and equipment. No heavy steel plate or sword, no spell effects. Match the reference's quality, restrained palette and background treatment; the hooded hunter's silhouette and forest-colored clothing must be readily distinct from a heavy armored warrior and a long-robed spellcaster. No text, lettering, logos, UI, frames, watermarks, extra people or recognizable existing franchise costume.
