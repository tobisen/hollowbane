# ADR 0002 — Simulation and platform boundaries

Date: 2026-10-16. Status: accepted technical boundary, G0 review pending.

Pure TypeScript modules own tick order, seeded RNG and replayable intents. Phaser rendering and wall-clock diagnostics remain separate. Fixed 60 Hz integer tick is the initial timing unit; speed breakpoints will be data-driven and tested before combat approval. The current wait-intent skeleton demonstrates ordering only, not a complete game loop.

JSON content registry and versioned IndexedDB saves will be introduced with their owning issues. Do not introduce a backend, networking or framework-wide event bus for the foundation. Add persistence migrations before saving player progress. Browser focus loss must suspend intents and cap catch-up; that behavior is not implemented yet.
