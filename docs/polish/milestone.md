# Gameplay & Visual Polish

Skills DBL-291 through 298 technically approved. This intermediate milestone refines presentation and measured performance only. Original 36 phases and all original IDs/dependencies remain unchanged. No loot, inventory, crafting, classes, campaign or new mechanics. Broad parents, hardware verification and production-asset follow-ups stay partial/open.

Sequence: DBL-299 HUD performance isolation; DBL-300 event-synchronized combat motion; DBL-301 six skill presentations; DBL-302 readable resource/ability HUD; DBL-303 bounded original audio; DBL-304 monster/contact/lighting consistency; DBL-305 repeated performance, regression and publication gate.

## DBL-299

The prior 10-enemy SwiftShader skills HUD p95 was about 33.3 ms with simulation ~0.1 ms. Hiding panels restored 16.7 ms; opacity changes and duplicate text-write avoidance did not fix it. A targeted production-build A/B kept the full HUD and update cadence, but isolated panel/footer layout/paint/style and compositor surfaces. At the same 10-enemy workload, full HUD p95 became 16.8 ms, virtual injected-start p95 16.8 ms, 15/15 samples, zero errors/drift. Simulation remained ~0.1 ms. This is software WebGL evidence, not native GPU verification.

A separate five-second CDP trace records script/layout/style/paint event aggregates. It lacks the repeated player casts of the timing benchmark and is diagnostic evidence, not a matched frame-time claim. Paint aggregate ~4.3 ms/5s in both variants; layout ~6 ms/5s. Main-thread paint duration alone does not explain a 16 ms presentation threshold. The evidence supports layer/invalidation isolation as a practical fix; it does not prove GPU/compositor completion cost. Raw traces remain local, summary retained. Full repeated 5/10/20/30 profiling follows at DBL-305.

Reference-native/full-detail and broader Firefox hardware acceptance remains in existing DBL-245/246/074, rather than falsely completing those parents from SwiftShader. DBL-299 closes its scoped software HUD threshold solution only after targeted regression. The isolation does not reduce refresh cadence, hide panels or alter damage/timing/input.

## DBL-300

The Sable Court (`?polish=1`, training via `&training=1`) is an opt-in presentation of existing encounters/skills, not a new game mode/mechanic. Pure motion reads ticks and phase-active/damage/death events: anticipation, strike lunge, recoil away from the damage source and a 30-frame eased directional fall. Original timelines/breakpoints/collisions remain authoritative. Six unit tests cover all attack breakpoints, interruption/no fabricated strike and no simulation mutation. Full check 167 tests; browser strike/death/collider scenario passes, capture reviewed. Original sprite transforms remain a documented provisional animation technique.

## DBL-301

Ember Lance has a tapered flame tail/hot core and impact rays; Rime Ring uses actual world-radius projected rings and twelve ice shards; Storm Thread draws segmented branching tethers; Iron Fan projects its actual world-space cone plus blade sweep; Oath Echo uses expanding runes/ally halos; Briar Edge uses thorn strikes and poison drift. Ground previews use real range, cone angles and conservative wall clipping. Casting/recovery emitters follow existing timeline states, release and impact follow deterministic events; no particles/shaders/dynamic lights or texture uploads. Cosmetic limits: 96 bolts, 48 recent events, 64 status markers; logic is never capped by rendering.

Live showcase `?polish=1&showcase=1` is an explicit durable training fixture: clustered original targets, idle AI, existing six skills every 180 ticks, real mana regeneration/costs/cooldowns. Pause freezes the actual timeline; input remains semantic. It adds no ability/mechanic. Two visual model unit tests, full check 169; two browser cases verify motion and all six real effect releases, bounded visuals, screenshot reviewed. Geometry provenance recorded; actor art remains provisional. Final showcase captures/visual regressions follow after HUD/audio/contact work.
