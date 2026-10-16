# Performance budget — provisional

Target desktop reference: integrated GPU laptop, 1920×1080, current Chromium/Firefox/Safari, 8 GB RAM; exact CPU/GPU/browser must be recorded before performance acceptance. These are proposed budgets, not achieved measurements.

60 FPS median; p95 frame <=20 ms during 50 active entities; input feedback <=50 ms p95; initial compressed payload <=5 MB; resident JS heap <=128 MB; GPU textures <=256 MB; initial ready <=3 seconds on 20 Mbps/50 ms RTT. Avoid unbounded catch-up after tab suspension. Record 60 seconds after 10 seconds warmup on a named device. FPS/p95, readiness timing, optional GL draw submission counts and supported JS heap diagnostics are implemented. Long-duration reference-hardware measurements remain pending. Phaser comparison adds a development-only engine chunk; production engine approval will remove it.

## G1 rendering policy

Default native GPU mode begins at the full desktop viewport and adapts after sustained slow presentation, unless Full detail was manually selected. Software graphics (SwiftShader/llvmpipe) use an aspect-preserving buffer capped at 960×600, with HTML UI at native resolution and a Full/Balanced detail toggle. Input/camera coordinates are transformed consistently with the buffer scale. Antialias texture filtering remains enabled; unused multisample/stencil buffers are disabled and the lighting budget is the actual five lights. Full-resolution software rendering missed the target; reduced fill is an explicit fallback, not a native GPU performance claim. Sustained measurement evidence is linked from docs/g1-review.md.

G1 measurements at 1920×1080 (Apple M4): Chromium SwiftShader balanced median 59.9 FPS / p95 33.4 ms / input p95 35.1 ms; Firefox full median 30.5 FPS / p95 34.1 ms / input p95 33 ms. Both 60-second samples follow ten-second warmup. The provisional tail-frame/full-detail budgets remain open; see docs/performance and docs/g1-review.md.
