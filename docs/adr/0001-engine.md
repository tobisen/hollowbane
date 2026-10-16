# ADR 0001 — Phaser 4 behind a renderer adapter

Date: 2026-10-16. Status: Phaser 4.2.1 selected for the published G0 candidate; further phase approval pending.

## Context

Desktop browser static delivery, isometric geometry, dynamic light and fifty active sprites must work without binding the deterministic core to the renderer. Compare actual installed releases: Phaser 3.90.0 and 4.2.1. Phaser lists 4.2.1 as the current stable release: https://phaser.io/download/phaser4 . Renderer migration details: https://phaser.io/news/2026/05/phaser-3-vs-phaser-4 . Consulted 2026-10-16; npm registry versions independently verified.

## Experiment

Both bundled engines run the same seeded 12×12 courtyard with 50 images, two point lights and 2:1 projection. Query `?engine=3` or `?engine=4`; runtime selection loads only that engine. Chromium checks confirm scene readiness, no page exceptions, reduced-motion pause, resume and screenshot regression. Captured both images and visually inspected projection, sprite positions and warm/cool lighting. Procedural sentinel textures have no production normal maps; this does not prove production material quality. Version 3 uses Light2D pipeline, version 4 uses setLighting(true); the adapter isolates this API difference.

## Decision

Prefer Phaser 4.2.1 for the supported current renderer and long-term maintenance. Keep 3.90.0 as an evaluation-only dev dependency through G0 review; removal is deferred until further work is approved. Retain a pure TypeScript simulation and explicit version-specific rendering calls. No engine advantage in measured speed is claimed from this small, short software/CI-compatible test. FPS, p95, readiness, optional GL calls and browser-supported heap are diagnostic samples, not reference-hardware certification.

## Consequences and risks

Dual-engine build has large chunks (roughly 332 KB and 372 KB gzip); only one is requested at runtime. Remove comparison code/dependency after approval. Safari/Firefox, GPU normals, large maps, atlas pressure and performance on named reference hardware remain unverified. Canvas fallback is unlit and clearly indicated; WebGL is the visual acceptance target. Browser memory API may be absent; null indicates unsupported, never zero. Optional GL instrumentation counts drawArrays/drawElements submissions and incurs measurement overhead; instanced extension calls are outside this spike's scope.

## Alternatives

Phaser 3 is working and is the fallback if required GPU/browser compatibility fails. A custom renderer would enlarge initialization and asset-tooling risk without current evidence of need.
