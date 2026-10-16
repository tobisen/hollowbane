# Performance budget — provisional

Target desktop reference: integrated GPU laptop, 1920×1080, current Chromium/Firefox/Safari, 8 GB RAM; exact CPU/GPU/browser must be recorded before performance acceptance. These are proposed budgets, not achieved measurements.

60 FPS median; p95 frame <=20 ms during 50 active entities; input feedback <=50 ms p95; initial compressed payload <=5 MB; resident JS heap <=128 MB; GPU textures <=256 MB; initial ready <=3 seconds on 20 Mbps/50 ms RTT. Avoid unbounded catch-up after tab suspension. Record 60 seconds after 10 seconds warmup on a named device. FPS/p95, readiness timing, optional GL draw submission counts and supported JS heap diagnostics are implemented. Long-duration reference-hardware measurements remain pending. Phaser comparison adds a development-only engine chunk; production engine approval will remove it.
