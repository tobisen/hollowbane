# Architecture

Vite compiles strict TypeScript to static ESM under /hollowbane/. Phaser sits behind src/rendering/observatory.ts; src/simulation imports no renderer. main.ts selects the comparison engine by query parameter. This initialization intentionally bundles the comparison engine separately; remove the Phaser 3 chunk after engine approval.

Simulation contract: seeded PRNG and integer ticks; tick-stamped input intents validate ordering; replay feeds the identical intent stream. Current skeleton only implements wait, not movement/combat or real-time accumulation. Future input adapter samples DOM input into intents, renderer interpolates snapshots, and simulation owns mechanics. Fixed-timestep catch-up limits and tab suspension are future implementation.

Planned boundaries: validated JSON content registry; transactional IndexedDB persistence with schema migrations; data-only events; explicit entity ownership. None are claimed implemented. Add modules when the corresponding approved issues are ready. Keep world collision separate from projection and use deterministic stable update ordering. No backend or account required.

Risks: Phaser 4 renderer migration; GPU compatibility; dual-engine download size; premature simulation abstractions; asset throughput; save migrations. Address using engine spikes, browser tests, scoped adapters, budget evidence and staged gates. See docs/adr/0001-engine.md.
