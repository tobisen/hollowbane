# Asset manifest

| ID              | Source                                 | Rights                             | Type     | Status / replacement     |
| --------------- | -------------------------------------- | ---------------------------------- | -------- | ------------------------ |
| courtyard-tiles | observatory.ts procedural polygons     | original project code              | geometry | placeholder; DBL-026     |
| sentinel        | observatory.ts generated 16×32 texture | original project code              | texture  | placeholder; DBL-023/025 |
| torches         | observatory.ts circles/rectangles      | original project code              | geometry | placeholder; DBL-026     |
| typography      | installed system Georgia/system-ui     | system font, no font redistributed | font     | provisional UI           |

Machine-readable asset records live in docs/assets.json. No external production art/audio is included. Vendor dependencies keep their licenses; game distribution licensing remains a release decision.

## G1 visual reference assets

| ID             | Source                     | Runtime                     | Provenance / status                                                         |
| -------------- | -------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| cloister       | assets/source/cloister.png | public/assets/cloister.webp | Original built-in imagegen; detailed fixed background plate; G1 approved    |
| wanderer       | assets/source/wanderer.png | public/assets/wanderer.webp | 8 directions × 2 idle + 6 walk frames, normalized foot anchors; G1 approved |
| cloister-props | assets/source/props.png    | public/assets/props.webp    | cenotaph, tree, sarcophagus, lantern; 4 atlas frames; G1 approved           |

Final prompts/method and extraction details: docs/art/prompts.md. Regenerate runtime assets with `npm run assets:export`, then `npm run validate:assets`. Original sources are retained for provenance and future art revision. AI generation does not replace release rights review. Placeholder geometry remains only in the optional G0 observatory.

## Phase 2 movement reuse

The existing original wanderer atlas remains unchanged (eight directions, two idle and six walk frames). Running provisionally reuses the walk artwork with distance-driven run cadence; no independent run cycle is claimed. Replacement/consistency work is tracked by DBL-250. Baked lighting/contact shadows and procedural mist/glow remain prototype effects, tracked separately in DBL-247–251. No new generated or third-party assets were added for movement.

## Phase 3 combat training assets

`src/rendering/combat-arena.ts` contains original procedural floor/grid, practice posts, sword gestures, bolt dots, hit rings, health bars and synthesized triangle-wave impact tones. Attack windup/strike/recovery, hit recoil and a 20-frame death fall animate the original wanderer via transforms; the tinted training sentinel reuses that atlas. These are explicitly provisional animation/art/audio proxies for the combat gate, not independent hand-authored attack/death sprite sheets. No third-party assets were added. Records: `combat-training-geometry`, `combat-motion-proxies`, `combat-impact-tone` in docs/assets.json. Dedicated animation artwork and audio polish remain a documented limitation after mechanical validation.

## Phase 2.5 input diagnostics

Controller prompts use original text labels for standard button names, with generic numbered fallbacks; no vendor icon artwork or font assets are copied. Stick diagnostics are original SVG circles/axes/dots in src/rendering/controller-calibration.ts. These are utility UI geometry, not production character art. No external image, audio or font assets were added.

Phase 4 AI arena uses the existing original wanderer atlas as explicitly provisional monster silhouettes, with role/champion tints, existing attack/hit/death transforms, original geometry for obstacles and optional navigation lines. These are developer behavior proxies, not final monster-family art or new vendor assets. No copied creature names, sprites, audio or protected content. Production family silhouettes/animation/audio remain in original DBL-063/190 scope; corpse gameplay remains outside this phase.

## Skills & Spell Systems prototypes

Ember Lance, Rime Ring, Storm Thread, Iron Fan, Oath Echo and Briar Edge are original Hollowbane prototype names. Spell feedback is original procedural Graphics geometry: tinted bolt circles, expanding rings, connecting line segments and short impact ellipses in combat-arena.ts. It consumes deterministic skill effect events; no new raster, vendor glyph, shader, font or audio assets were imported. Casting provisionally reuses the original wanderer timeline transforms. Existing monster and spell production-art/audio follow-ups remain open; these mechanical proxies do not complete DBL-057 production polish.

## Gameplay and Visual Polish

The Sable Court uses original bounded procedural vector spell designs in src/rendering/skill-visuals.ts: fire lance/core/tail, cold shards/range ring, segmented lightning, swept blade cone, oath runes/halo and poison thorns/bubbles. Each has a separate silhouette and authored palette; no third-party particles, textures, sprites, shaders or glyph artwork. Combat motion remains enhanced transforms of the existing original wanderer atlas, not newly painted attack/death sheets. Showcase uses the real simulation with explicit durable training targets, real costs/cooldowns and ordinary cast timing; no production balance claim. Provenance: docs/polish/milestone.md.

The polish HUD ability icons are original inline SVG paths in polish-hud.ts. CombatAudio uses original oscillator, pitch-envelope and low-pass noise recipes: six distinct spell timbres plus swing, impact and death cues. Noise is deterministically generated into one 8192-sample in-memory buffer; no recorded samples, vendor packs, music or new network assets. Eight sound voices maximum, user activation required, immediate mute and unsupported-API fallback. These procedural effects do not claim recorded foley, music or dedicated character vocal performances.

Polish ground/contact artwork is original code in polish-ground.ts: stone seams, court inlay, restrained baked light pools, depth-sorted obstacle caps and a 64x32 contact-shadow texture. The 1070x570 floor is generated once per scene (~2.4 MB RGBA), shadows ~8 KB, with no added download. Backdrop crops reuse the approved cloister only outside the opaque court; no per-frame mist/lighting shader is added. Existing actor atlas remains unchanged; role/champion proportions and event-driven poses share fixed foot anchors. These refinements do not complete original character/monster sprite-sheet art requirements.
