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
