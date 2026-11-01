# Classic Act 1 — public startup recovery

2026-11-01 · DBL-035/375/379 · opt-in only

[Classic Act 1](https://tobisen.github.io/hollowbane/?classicAct1=1) is intended
to open the normal title/character-selection UI. Select an existing character or
create a Warrior, Sorcerer or Ranger. Normal campaign remains the default.
Startup-recovery candidate is locally implemented; release verification is pending.
Last verified deployment before recovery: `9ce92f1d9d946b1d5b7ff96eb9ca8f8f97646e1b`.

## Startup failure and repair

The user-reported production-binding error is authoritative failure evidence.
The exact bare public URL was checked first in a fresh Chromium context. At this
observation the literal error did **not** reproduce: HTTP200 launched an anonymous
Warrior developer checkpoint, with no selection/menu and no production owner.
That result still violates the required public flow; it does not disprove the
user's report. Raw capture: `/private/tmp/hollowbane-startup-recovery/public-before.json`
and `public-before.png`. The original readiness wait for that error timed out;
a second fresh run captured actual error-or-game readiness without fixed sleeps.

Root cause in the previous implementation: `main.ts` dispatched every valid
Classic flag directly to `startCombatArena`; route validation rejected every
Classic `character` binding. `classicCheckpoint` supported only class-wide
anonymous slots. The optional class default was already Warrior; requiring a
manual class URL would not repair the lifecycle. Title and Save & Exit also
removed the opt-in, and prior tests treated owner rejection as correct behavior.
No evidence identifies the exact browser/query state behind the reported message.

The bare flag now opens the existing awaited character menu. Genuine creation,
selection and Continue navigate to `?classicAct1=1&character={uuid}`. The scene's
existing inventory-readiness barrier waits for the real CharacterStorage load,
then restores that character's equipment, progression and stash into a distinct
Classic campaign. Missing/corrupt owners stop readiness and saving and offer
character selection. Invalid modifiers still fail closed. Class validation,
normal routes, Classic Visual and Phaser4.2.1 are preserved.

Each owner has its own `hollowbane-classic-act1-owner-v1-{uuid}` InventoryStorage
checkpoint. First entry copies real character state into a fresh four-clearing
campaign; normal world drops/deaths/quests/position do not enter a different map.
The stash, equipment, backpack, progression and loot stream are retained. Normal
records are read only during Classic entry/play/save; normal recent-owner metadata
is untouched. Fresh creation creates its normal level-1 starter checkpoint once,
then Classic writes exclusively to its separate copy. Existing anonymous class
databases remain accessible through explicit `&class=warrior|sorcerer|ranger`
developer shortcuts and are never adopted as an owner's save. No codec/schema
migration. Normal-codec candidate-fingerprint rejection remains unchanged.

Save & Exit, recovery links and Return to title retain `?classicAct1=1`.
Classic's recent-owner pointer is separate from the normal registry. An explicit
Normal campaign link leaves the opt-in. The active indicator still requires actual
layout/presentation/storage readiness and exposes the bound owner read only.

Browser acceptance now starts at the exact bare URL for all three real creation
flows and for existing-owner selection. It checks fresh refresh, bound reload,
Save & Exit/Continue, owner/class/1083-cell/fingerprint agreement, real movement,
actual combat and the complete quest/clearing/container/loot/next-area journey.
Additional cases compare every raw normal registry/character/previous/archive
record, protect same-class owner separation and retain existing equipment,
progression and stash. Missing-owner and missing-asset failures remain explicit.
Local check:722 units, TypeScript/lint/assets/backlog/build and30 focused units
pass. The expanded browser run passes all13 Classic cases,3 Classic Visual and14
normal menu cases; one unchanged normal Ranger route-arrival assertion failed
once at its original5s deadline. That unmodified case then passes on both the prior
public deployment (13.9s) and a local isolated replay (8.6s). The initial failure
trace/report is retained, not counted as a passing broad run. The additional
real-IndexedDB readiness case passes separately (6.3s): it holds the actual open
completion, checks inactive indicator/disabled saves, then releases without sleeps.
Thus all14 current Classic acceptance cases have local passing evidence.
Release coverage346 cases has no gaps/overlap. Selection/gameplay/clearing captures
were reviewed. Exact-commit CI/Pages/hosted/published-byte verification is pending.

## Historical release evidence

| Release evidence                                                                                         | Result                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Runtime Full baseline3d54dc6 / CI41259279768                                                             | 722 units,343 Chromium,15 compatibility; Pages/hosted/release accepted                         |
| Final test-only9ce92f1 / [CI41261598409](https://github.com/tobisen/hollowbane/actions/runs/41261598409) | Policy-selected Integration11, static/contracts, Fast2, Pages, hosted2, final release accepted |
| Public integrity                                                                                         | Exact sealed manifest/SHA and all191 files independently byte-verified                         |
| Additional final hosted native Metal acceptance                                                          | 11/11 in127.141s; quest journey55.0s; zero skipped/failed/flaky                                |
| Final hosted M4 comparison                                                                               | 1/1 in66.406s; images, video and timed frames inspected                                        |

The final191 payload files are byte-identical to the accepted Full baseline and
the local native-profile build. The final follow-up changes test input strategy
and documentation only; it did not lower the existing risk policy.

## Runtime and isolation

The candidate uses `startCombatArena`, `WorldSession`, `WorldTravel`, encounters,
skills, loot, inventory, quests, dialogue, containers, waypoints and progression.
An explicit layout provider adapts only version-2 Haunted Forest to the approved
four clearings/1083 ground cells, broad connectors and five original blockers.
Camp, graveyard, crypt and both normal map versions retain their original layouts.
The same encounter/container planners retain five packs/15 enemies, all three
forest roles, six containers and original identity namespaces. No damage, speed,
cooldown, AI or balancing change. Phaser4.2.1 and save schemas are unchanged.

The provider is an out-of-band trusted argument to session/travel/validation and
waypoint operations, carried by candidate navigation for the existing character
codec. It is never inferred from save data. Normal validation rejects candidate
fingerprints even when the candidate is parked at camp. `InventoryStorage` keeps
its existing atomic current/previous, CAS, quarantine and recovery behavior in
separate `hollowbane-classic-act1-v1-{class}` databases. Fresh class slots use the
real level-1 starter factory. They never receive a production owner ID or update
the normal recent-character registry. Global player control/display/audio
preferences use the existing player-session adapters.

The indicator appears only after the drawn layout matches the candidate provider,
Classic presentation exists and storage initialization is ready. Invalid options,
production-owner binding and missing scenery cannot silently start normal play.
Missing scenery stops the scene and names the failed asset. Leaving/destroying the
candidate removes its indicator/observations. The inventory labels its checkpoint
as isolated; Save & Exit uses the normal awaited checkpoint drain.

## Presentation

The approved painted environment and 312 original poses are reused unchanged.
Warrior and the two enemy pilots use the shared 43.43253656° projection, fixed
root, unit scale, rounded camera and soft contact. Loot labels, containers,
projectiles, effects, pointer picking and movement destinations share the active
projection. Pointer selection covers the taller Classic head envelope; legacy
hover bounds stay unchanged. Body selection observes actual casts and tick/death
state and emits no gameplay events. Run shares distance-driven walk poses.

Sorcerer/Ranger and unsupported Warrior weapons keep legacy presentation. Other
areas keep legacy presentation. Ranged enemies retain their actual attacks and
projectiles using runner body art. Static idle, four-facing turns, shared ability
body motion, repeated ground and approximate corpse contact remain limitations;
no class/monster/equipment art production or additional raster payload.

Final three-class screenshot review caught an invalid legacy shadow texture under
Sorcerer/Ranger. Candidate actors now initialize and use the existing shared
Classic contact texture before actor creation, including legacy fallback states
and other candidate areas. Original pilot generation is reused unchanged; default
campaign behavior and raster payload are untouched. Read-only observations expose
the actual shadow key, and all three class browser cases require valid contact
textures. Nine targeted units, TypeScript/build/scoped lint, five browser checks
(three movement/save, missing-asset, original pilot combat) pass39.9s. Corrected
Sorcerer/Ranger screenshots were inspected. This visual fix superseded de99c30/CI41256403152; the subsequent runtime Full
gate passed on3d54dc6.

## Local acceptance

Full units:722 pass in exact-commit CI; final targeting/candidate subset:11
pass, including the new pointer-envelope case. TypeScript, lint, asset/backlog
validation, build, scoped formatting and release-coverage planning pass. The
existing risk policy must run Full for these public/map/save contracts.

The focused browser suite covers eleven cases: three actual class abilities,
primary combat and authoritative death (one player effect per cast); three
movement/inventory/save/reload/Save & Exit cases, including eight Warrior logical
directions/four art facings; invalid route and missing-asset failures; saved key
remapping; exact production registry/checkpoint protection and normal geometry;
and the full actual-input journey below. All eleven cases pass in one software
Chromium run (2.5m). No assertions, timeouts or mandatory CI tier were waived.

The controller/mouse journey reaches camp/Edda, accepts Embers on the Road,
re-enters the candidate forest, fights two hostiles, releases Sundering Fan,
visits all four clearings, opens a container and picks an item into the backpack,
returns for Edda's reward, reaches the graveyard, saves/exits and re-enters with
the claimed quest and owned item retained. It never writes live actor state.
Unit coverage additionally checks all routes/props at actor radius across four
seeds, saved maps, waypoint travel and default-codec rejection for all classes.

Initial browser-driver defects are retained in raw evidence: stale imported API
across navigation, counting hostile Ranger casts and previous interrupts, treating
keyboard-facing casting as mouse targeting, and counting occupied grid cells as
separate items. Drivers now import the actual API after navigation, identify
player/tick, use explicit pointer casts and count the item tile. Real game rules
were preserved. Valid interruptions may be retried through actual input.

## Release-gate navigation repair

Integration1652eb39105653748e68b8b551ffd99652797fd0/CI41254452130 passed
722 units,342/343 Chromium cases,15 compatibility cases and static/tooling gates.
Pages was correctly blocked by one real-input journey failure: a compressed
straight return-to-camp leg exceeded the shared driver's ten-second per-point
arrival deadline while the live player was still walking toward it. The same
failure reproduced locally from x34.9 to the camp exit at x4 with default walk
speed3; the route alone takes more than ten seconds.

The test-only driver repair subdivides long segments into at-most-six-unit
checkpoints. Every original turn, arrival assertion, ten-second deadline, real
controller input and full journey objective is retained. No gameplay, speed,
health, map or balance change. Reproduced return now passes27.1s; full Classic
quest/loot/save journey passes twice3.1m; existing normal forest/rearm/return
checks pass2/2 in37.2s. TypeScript/scoped lint/format pass. Failure logs/traces and
replays remain under `/private/tmp/hollowbane-classic-act1-ci-failure/` and
`/private/tmp/hollowbane-classic-long-leg/`. The rejected run was replaced by the accepted3d54dc6 Full baseline; the blocked
run is not publication acceptance.

## Release-gate merchant synchronization repair

Runtime4607c102cb367157474c13d410caf4d66c2fc058/CI41257333413 passed all11
Classic cases,722 units,15 compatibility cases and static/tooling gates. Shard3
blocked publication on an existing D09 merchant check: the trade UI showed its
new gold/stock while the mirrored save status still represented the preceding
checkpoint. Reading IndexedDB then returned the pre-purchase bag. The same
failure reproduced locally once in three unchanged replays.

The test-only helper now waits on authoritative `inventory-status` before the
merchant's render-frame mirror, matching the earlier stash synchronization
repair. All item identities, atomic gold/stock/ownership, buy/sell/reload and
deadline assertions remain unchanged. All four merchant cases pass twice:
8/8 in41.5s, including controller/cancel/rejection flows. TypeScript/scoped lint/
format pass. Runtime and artwork are byte-identical; the repaired3d54dc6 release subsequently
passed Full, Pages, hosted and complete-public-byte gates. Evidence:
`/private/tmp/hollowbane-classic-merchant-repair/`, before/after logs alongside it
and `/private/tmp/hollowbane-classic-act1-final-ci-failure/`.

## Native hosted traversal strategy

The initial native hosted replay passed10 cases but its fresh Warrior died while
slow-walking all four clearings past the remaining hostiles after two required
kills. That is retained as real gameplay evidence, not hidden by changed health,
AI, speed, damage or timeouts. The journey now uses the existing standard L3 run
control after those fights. Every combat, survival, clearing, loot, quest, reward,
next-area and persistence assertion remains intact. The complete public native
suite passes11/11 in2.1m; the actual quest journey passes54.4s. TypeScript/scoped
lint/format pass. Before/after reports and screenshots remain in
`/private/tmp/hollowbane-classic-act1-hosted/`, including
`hosted-browser-walking-failure.json` and `browser-results-walking-failure/`.
Runtime/artwork are unchanged. The test-only follow-up passed the selected Integration11 gate against accepted
3d54dc6 and was published as9ce92f1. Final hosted native11/11 passes127.141s,
including the unchanged complete quest journey in55.0s.

## Native M4 and asset evidence

Chromium/Apple M4/ANGLE Metal,1280×800/DPR1, three fresh contexts per mode,
30 warm/180 measured RAF intervals each:540 per mode. Normal production Warrior
and Classic both p50/p95/p99/max16.7/16.7/16.8/16.8ms, zero above25ms in the
recorded steady samples. Classic camera coordinates stay integral;181 distinct
positions per cohort. Normal corridor blocks input after41–42 distinct positions,
so these are matched display/input conditions with different geography, zoom,
UI and AI workload, not an equal-work performance-improvement claim.

A separate fourth recording cohort is excluded from timing. Side-by-side viewer,
movement recordings, timed video frames and raw metrics:
`/private/tmp/hollowbane-classic-integrated-native/review.html`, `profile.json`,
`cold-readiness.json`, `{normal,classic}-{start,move}.png`,
`{normal,classic}-movement.webm`, `motion-{1,2,3}.png`. Timed motion frames and
actual gameplay captures were inspected; no universal all-route shimmer clearance
or human display/controller acceptance is claimed. Prior pilot long shrine
requests (50–66.6ms) remain separate from these steady samples.

Measured starting candidate:34 named textures,73,847,884 calculated source RGBA
bytes (70.43MiB),7,626,134 encoded PNG/WebP resource bytes. Normal comparison:
69 textures,397,794,332 calculated RGBA bytes,27,675,071 encoded image bytes.
Calculations use physical image/canvas dimensions, include registered generated
sources, exclude GPU overhead/mip/framebuffers, and are **not measured GPU memory**.
Reload retains the same starting texture count. Other areas/classes may differ.
The Classic subset remains3,409,658PNG/42,348,544 calculated RGBA bytes including
contact, nine textures; incremental raster asset bytes:zero. Original provenance
and hashes remain in the existing manifests.

Cold-readiness measurements explicitly clear browser HTTP cache before each
navigation in both modes after fixture preparation. OS/filesystem/GPU caches are
not reset; the values are observed playable readiness including test polling.
Final cache-cold readiness cohorts: normal1079.5/964.8/964.2ms (median964.8),
Classic409.4/403.1/396.3ms (median403.1). Final native cache-cold plus movement/
recording checks pass2/2 in43.2s, zero skipped/flaky/errors. Raw conditions are
kept with the viewer.

## Final hosted comparison and performance

Viewer and movement recordings:
`/private/tmp/hollowbane-classic-act1-hosted/review.html`.
Static export: `hosted-comparison.png`; original `{normal,classic}-{start,move}.png`,
`{normal,classic}-movement.webm` and timed `motion-{1,2,3}.png` are alongside it.
The open painted candidate, larger clear player and reduced foreground tree
obstruction are visibly different from the dense normal forest. Camp/other areas
retain their existing presentation. Native Sorcerer/Ranger contact and the actual
claimed Edda reward were also inspected. Human art approval remains pending.

Native Chromium/Apple M4/ANGLE Metal,1280×800/DPR1, three fresh contexts each,
30 warm and180 measured RAF intervals; the fourth recording cohort is excluded:

| Measured item                                  | Normal production Warrior  | Classic candidate    |
| ---------------------------------------------- | -------------------------- | -------------------- |
| Layout fingerprint                             | 323b57eb                   | 00b39633             |
| Intervals                                      | 540                        | 540                  |
| Frame p50/p95/p99/max, ms                      | 16.7/16.8/16.8/16.8        | 16.7/16.7/16.8/16.8  |
| Frames above25ms                               | 0                          | 0                    |
| Distinct positions per cohort                  | 41/42/41, corridor-blocked | 181/181/181          |
| Integer camera coordinates                     | Existing fractional camera | All measured samples |
| Starting named textures                        | 69                         | 34                   |
| Calculated source RGBA bytes                   | 397794332                  | 73847884             |
| Observed encoded image bytes                   | 27675071                   | 7626134              |
| Observed encoded resources, excluding document | 28223757                   | 8219178              |

Maps, zoom, UI and AI workload differ; this is matched display/input evidence,
not equal work or a universal improvement claim. RGBA totals use physical source
sizes and are not measured GPU memory. The original Classic subset remains
3409658PNG/42348544 calculated RGBA bytes; incremental raster asset bytes:zero.

Hosted observed readiness was normal7019.2/4400.2/5157.2ms and
Classic1389.0/1617.1/1382.7ms. Both modes await actual network-idle asset completion
and their unchanged readiness marker before recording; these values include that
prerequisite. The first temporary probe hit its default five-second marker wait
while normal atlases were loading and produced no valid motion cohort; its
report/trace are retained. The corrected probe awaits the actual dependency in
both modes. These hosted observations are separate from the HTTP-cache-cold local
measurements above; OS/GPU cold cache is not claimed.

Raw accepted evidence: `release-verification.json`, `final-ci-state.json`,
`final-public-byte-verification.log`, `hosted-browser.json`,
`hosted-profile-results.json`, `final-native-summary.json`, `profile.json` and
failure/prerelease reports in the same folder. CI reports are retained in
`/private/tmp/hollowbane-classic-act1-final-accepted-ci-results/`; Full baseline
reports in `hollowbane-classic-act1-accepted-ci-results/`. The sealed final build
is `/private/tmp/hollowbane-classic-act1-release-9ce92f1/`.

## Review stop

Technical opt-in release is complete. Stop for human review; approval remains
false. Static idle/four-facing turns, shared ability/ranged body art, legacy class
differences, repeated ground, approximate corpse contact and historical shrine
request hitches remain. No universal shimmer or physical-controller acceptance.
Do not enable by default, migrate other areas, resume Q3-B or start new class/
monster art. All17 unrelated edits are preserved. This final documentation
checkpoint stays local; published runtime and test source are the exact SHA above.
