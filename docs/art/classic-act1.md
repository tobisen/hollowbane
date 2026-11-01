# Classic Act 1 — playable integration candidate

2026-11-01 · DBL-035/375/379 · opt-in only

The reported URL fell through to the main menu because `main.ts` did not have a
Classic Act 1 route. The local candidate now launches real campaign gameplay at
`?classicAct1=1`, with optional `&class=warrior`, `sorcerer` or `ranger`.
Verified deployed runtime: `3d54dc6765047e9ea992174273ee9d640d2a42d5`,
CI41259279768 Full722 units/343 Chromium/15 compatibility, Pages, hosted critical
flow and release acceptance pass. All191 public files independently match the
sealed artifact. All11 additional native Metal hosted cases pass2.1m using the
existing run control for traversal. A test-only strategy follow-up is being
committed through the normal risk policy; final hosted comparison remains due.

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
Sorcerer/Ranger screenshots were inspected. This final visual fix supersedes the
pending de99c30/CI41256403152 candidate and requires a new Full release gate.

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
`/private/tmp/hollowbane-classic-long-leg/`. A new exact-commit Full release is
required; the blocked run is not publication acceptance.

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
format pass. Runtime and artwork are byte-identical; a new exact-commit Full,
Pages, hosted and complete-public-byte gate remains mandatory. Evidence:
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
Runtime/artwork are unchanged. This test-only follow-up must pass the selected
risk gate against the newly accepted3d54dc6 baseline before final publication.

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

## Release gate and exact next action

Commit/push only this coherent candidate. Require exact-commit Full CI, Pages,
hosted acceptance, dedicated Classic URL checks and normal/save protection.
Download its sealed `release-bundle` and use `tools/ci/release_artifact.py verify`
and `hosted` against that artifact for every public file. Run the focused Classic
suite against the hosted base URL, then capture hosted normal/Classic comparison.
Record exact run and SHA in STATUS and this page. Pending/failed jobs are not
acceptance. Stop for integrated human review after verification; never switch the
normal campaign default or migrate other areas. Preserve all17 unrelated edits.
