# Asset manifest

| ID              | Source                                 | Rights                             | Type     | Status / replacement     |
| --------------- | -------------------------------------- | ---------------------------------- | -------- | ------------------------ |
| courtyard-tiles | observatory.ts procedural polygons     | original project code              | geometry | placeholder; DBL-026     |
| sentinel        | observatory.ts generated 16×32 texture | original project code              | texture  | placeholder; DBL-023/025 |
| torches         | observatory.ts circles/rectangles      | original project code              | geometry | placeholder; DBL-026     |
| typography      | installed system Georgia/system-ui     | system font, no font redistributed | font     | provisional UI           |

Machine-readable asset records live in docs/assets.json. No external production art/audio is included. Vendor dependencies keep their licenses; game distribution licensing remains a release decision.

## G1 visual reference assets

| ID             | Source                     | Runtime                     | Provenance / status                                                               |
| -------------- | -------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| cloister       | assets/source/cloister.png | public/assets/cloister.webp | Original built-in imagegen; detailed fixed background plate; G1 review pending    |
| wanderer       | assets/source/wanderer.png | public/assets/wanderer.webp | 8 directions × 2 idle + 6 walk frames, normalized foot anchors; G1 review pending |
| cloister-props | assets/source/props.png    | public/assets/props.webp    | cenotaph, tree, sarcophagus, lantern; 4 atlas frames; G1 review pending           |

Final prompts/method and extraction details: docs/art/prompts.md. Regenerate runtime assets with `npm run assets:export`, then `npm run validate:assets`. Original sources are retained for provenance and future art revision. AI generation does not replace release rights review. Placeholder geometry remains only in the optional G0 observatory.
