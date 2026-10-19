# W3 environment review candidate — DBL-379

Technical scope DBL-374–379 complete; user visual quality approval remains pending. Stop here: no W4 exploration or W5 expedition work is started or approved by this checkpoint. Original IDs/dependencies and broader partial parents remain unchanged.

## CI timeout investigation

[Failed run39290173775](https://github.com/tobisen/hollowbane/actions/runs/39290173775) tested533740e005ec6cbde970fd60990a222bd2f2c645. Its first world-layout.test.ts case ended with `});`, inheriting Vitest's5000ms default; the second case alone supplied15_000. Documentation had overgeneralized that limit. Existing minimal correction6bccd6f adds15_000 to the first case without changing global unit settings or assertions. No duplicate fix was needed. The affected file was rerun2/2, with camp/appearance tests making4 focused local cases. No broad local regression or loot simulation was run.

Later runtime7b268e87f5d7985de3d27f65f682cf6580fc760d includes that correction plus the already verified camera-frame and keyboard-confirmation repairs. [CI39302518214](https://github.com/tobisen/hollowbane/actions/runs/39302518214) completed success: verify job118231098481 and deploy job118236540439. This complete CI evidence is reused.

## Public runtime and original assets

GitHub Pages deployment7181832950 reports success for exact runtime7b268e87f5d7985de3d27f65f682cf6580fc760d at https://tobisen.github.io/hollowbane/. Its public entry is index-DjRiEKMB.js, matching the locally verified build. All seven public runtime files match the SHA256/byte counts in docs/art/w3-inventory.json, including the latest camp-shelter, camp-fire, forest-oak and crypt-arch exports. Total transferred bitmap bytes:4216476. No assets were regenerated. DBL-378/379 audit changes add validation/documentation only; their later commit/deployment outcome is recorded separately in STATUS.md rather than misattributed to this runtime deployment.

One hosted Chromium invocation ran only tests/e2e/world-environments.spec.ts:4/4 pass in48.9s. Camp/forest use real mouse travel; graveyard/crypt use virtual-controller input. Current-frame camera centering and exact saved layout fingerprints are asserted. Existing pure world-layout roundtrip covers the complete camp→forest→graveyard→crypt→graveyard→forest→camp chain, parked ownership, character/progression identity and loot sequence. Appearance/camp tests cover four seeds and legacy/current rules, off-path scenery, pillar counts and unchanged fingerprints. Existing collision/anchor/swept-path validation and successful CI are reused.

## Four representative screenshots reviewed

All four1280×800 hosted screenshots were visually inspected on2026-10-19. Local copies are in /private/tmp/hollowbane-w3-final-review/; these verification images are not committed as source assets.

| Area                | Visual/navigation review                                                                                                                                                                                                              | Screenshot SHA256                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Ashen Refuge        | Cloth shelters,140px fire and reused monuments share cool stone/warm amber direction.196 ground/apron sprites and9 props; safe spawn and clearly labelled forest ring; camp→forest→camp passes.                                       | 835a7975d45f147dad1ac903d6448ffbd4a50e6eee88a6616ab7dae5802f2b40 |
| Haunted Forest      | Full-sized oak canopies and dead trees, mossy path variation and local fading retain a clear travel corridor; roots stay on existing blocked cells. Forest→camp return passes.                                                        | 1ddb6ecedec6bd4cde518d9d04a8905d422b8867191ae8701fd87234ebe489ff |
| Forgotten Graveyard | Consistent cenotaph/dead-tree scale, fallen stone/fence details and dim mist; crypt portal remains on blocked terrain beside the labelled live trigger. Graveyard→forest controller travel passes.                                    | 52e43c726260d6e60570742b1b4159c714116bd36a8567649b953cdfb6fd06cb |
| Ancient Crypt       | Repeated textured stone walls follow actual room/corridor boundaries; original-footprint pillars, torch-bearing arches and warm pools retain readable passages with local occlusion fading. Crypt→graveyard controller travel passes. | f105e146cc9a6a098c4182e690a1aeac41884b3db117c731671190d88fbab8ed |

Projection remains the existing2:1 ground transform, with consistent foot anchors and screen-y depth. No seed, terrain, collision, save layout version, fingerprint, item ownership or character-state rules changed in378/379. Public asset alpha/feet/budget validation passes. This is a representative technical review, not exhaustive aesthetic approval across every seed/display.

## Limits and gate

Static scene counts, shared textures and bounded local fog/light envelopes are audited in docs/art/w3.md; no full-screen fog or dynamic lighting pass was added. No new native-GPU/frame-time benchmark or physical-controller verification is claimed. Dense foliage contrast and overall darkness remain matters for user visual approval; dedicated art-rights release review and existing hardware/performance follow-ups remain open. New audit commits may still be awaiting their own CI/Pages run; only the exact successful runtime above is claimed as publicly deployed. Do not enter W4/W5 without the user's next authorization.
