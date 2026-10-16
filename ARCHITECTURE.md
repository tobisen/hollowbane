# Architecture

Vite compiles strict TypeScript to static ESM under /hollowbane/. Phaser 4.2.1 renders the default visual prototype in src/rendering/prototype.ts; src/simulation imports no renderer. Query-selected observatory scenes retain the engine comparison. This initialization intentionally bundles the comparison engine separately; remove the Phaser 3 chunk after engine approval.

Simulation contract: seeded PRNG and integer ticks; tick-stamped input intents validate ordering; replay feeds the identical intent stream. The foundation wait skeleton is retained; locomotion.ts implements deterministic 60 Hz walking, click routes and keyboard override. Prototype rendering accumulates bounded frame delta and advances integer ticks; browser blur clears traversal and held keys. Combat remains unimplemented. Future input adapter samples DOM input into intents, renderer interpolates snapshots, and simulation owns mechanics. Movement catch-up is bounded to six ticks per presented frame; broader save/tab-resume policies remain future work.

Planned boundaries: validated JSON content registry; transactional IndexedDB persistence with schema migrations; data-only events; explicit entity ownership. None are claimed implemented. Add modules when the corresponding approved issues are ready. Keep world collision separate from projection and use deterministic stable update ordering. No backend or account required.

Risks: Phaser 4 renderer migration; GPU compatibility; dual-engine download size; premature simulation abstractions; asset throughput; save migrations. Address using engine spikes, browser tests, scoped adapters, budget evidence and staged gates. See docs/adr/0001-engine.md.

## Visual prototype boundaries

World projection, foot-depth order, camera policy and polygon/ellipse navigation live in src/world. A deterministic static A* router uses half-tile nodes with diagonal corner and segment checks. The painted plate has a separate authored walkable boundary and prop footprints; runtime uses actual camera coordinates for input. Background is drawn first, actors/props sort by feet, contact shadows follow anchors, and mist/glow render above. Actor art comes from normalized eight-direction idle/walk frames. Imagegen sources/prompts are retained; Sharp tooling normalizes and validates atlases. Asset loading is scene-scoped, not general region streaming.

Rendering budget: opaque full-screen canvas, no unused MSAA/stencil buffers, five point lights and dynamic shading on the moving actor only; static props use their baked art lighting. Native GPUs start at full resolution, software GPUs use a 960×600 cap, and sustained slow frames after warmup select balanced detail unless the player manually chose full. The quality switch preserves camera scale in CSS coordinates and input alignment. This reduces fill cost but does not certify the remaining full-detail/tail-latency budgets.
