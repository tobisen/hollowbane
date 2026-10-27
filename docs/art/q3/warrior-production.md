# Warrior production integration — DBL-023/024/025/026

2026-10-27. The user approved the Release C Warrior art/playable candidate and
authorized production integration through Checkpoints A/B. This supersedes the
historical live-adoption stop in `warrior-combat.md`; no other class or monster
artwork, engine, balance or campaign expansion is authorized.

## Presentation and compatibility

The normal world renderer consumes the existing campaign actor, motion events,
cast and timeline. Shared `warrior-pose.ts` selects the previously tested
movement/attack/ability/hit/death frames; the developer arena uses the same
selector. No developer arena gameplay owner, simulation callback, independent
attack clock, save-schema change or new mechanic is introduced. Distance cadence,
directions, scale0.5 and authored ground roots are preserved. Shared hitstun is the
only actual stagger rule. A corpse without an observed death event settles rather
than replaying. Existing primary/secondary **input semantics are preserved**:
campaign secondary casts its assigned skill; it is not repurposed as a second
melee mechanic. The arena's alternate secondary melee clip remains available there.

The approved model has a straight sword in the right hand and an **empty offhand**;
armor, crimson cloth and materials are baked into every frame. `ash-blade` is the
one supported sword base, including starter/content-version9, legacy2/3 and the
existing advanced/socketed variants. Their statistics and effects remain owned
by equipment/combat. An empty main hand, bow, staff, unknown future base or any
offhand item selects the existing shared sprite. Sorcerer, Ranger and unclassed
legacy saves retain their existing presentation. All armor slots are stat-bearing;
the prior world renderer never promised visible per-item armor changes. No new
item artwork or modular-equipment system has been invented.

The active simulation weapon is also checked. Equipment statistics defer a weapon
change until the committed attack ends; a newly equipped blade cannot display a
sword while an earlier projectile attack still owns the timeline. That interval
retains legacy presentation (`committed-projectile`). A red/green selector
regression covers this guard; it does not change the original defer rule.

Developer tools, without normal-player controls:

```js
window.hollowbaneWarriorProduction.setLegacy(true); // recover old presentation
window.hollowbaneWarriorProduction.setLegacy(false); // resume supported Warrior
```

The override persists in sessionStorage key `hollowbane-warrior-legacy`; it never
changes character storage. Read `mode`, `reason`, `textures`, `decodedBytes`,
`loadMs` and `pose` for diagnostics. Equipment decisions are reevaluated live.

## Asset ownership and provenance

`warrior-assets.json` is a compact allowlist derived from the five approved
`public/dev/warrior-*/warrior.json` manifests. The Vite asset plugin verifies every
SHA256/byte count and emits the **same approved PNG bytes** under content-hashed
`assets/warrior/` paths. No source atlas or rig was edited, resized, recompressed
or rerendered. Tests verify hashes, roots, scale/cells and authored distance strides.
The original developer paths remain recoverable for their existing review routes;
normal production never fetches those paths or developer preview modules.

Only a restored, supported Warrior acquires the texture lease. Title/selection,
other classes, unsupported equipment and debug-legacy do not acquire it. A loading
screen pauses the real simulation at entry/reacquisition. All40 atlases preload
before play resumes: unpredictable eight-way first attacks, interruptions and
death must not wait for streaming. Less-frequent-state streaming is deliberately
deferred because it would introduce those first-use gaps. The download queue is
bounded to two, retaining the arena's startup pacing repair.

Shared leases protect active references. Equipment/debug fallback first detaches
the sprite, then releases textures after pending downloads settle. Shutdown does
the same; reload/area travel reuses the current lease. A failed atlas load yields
legacy graphics, releases partial resources and resumes ordinary gameplay. No
automatic per-frame retry loop. Unrelated environment/legacy textures are retained.

The complete set is **23,458,595 PNG bytes /40 atlases /349.25MiB base RGBA**.
This excludes transfer headers, driver overhead, mipmaps and caches and is **not
actual GPU memory**. Browser counts/heap and native measurements must be reported
separately. Publishing aliases increases hosted artifact size by the encoded set;
it does not increase ordinary client downloads beyond the selected route.

## Checkpoint A validation

Candidate **62907874bc427d0db4fedde0ff23e94bbeea096c** is committed/pushed.
[CI40567635119](https://github.com/tobisen/hollowbane/actions/runs/40567635119)
Fast/static, Full units/validators and required compatibility PASS; Chromium
shard1 FAILED, so A is **not accepted**. Pages/hosted acceptance is unverified.
Inspect `/private/tmp/hollowbane-warrior-production-a-failed.log` before advancing.
All153 sealed-CI/local files match byte for byte; the published runtime is not yet
verified. The sealed
local153-file artifact is retained at
`/private/tmp/hollowbane-warrior-production-a-tested`. The original controller
waypoint round-trip/reload case also passes (14s); no physical claim.

Initial focused validation:29 unit cases pass across selection, provenance,
shared mapping and existing real attack/skill/reaction/death/arena contracts.
TypeScript, affected lint and production build pass. Initial browser checks pass:
new Warrior, historical blade/live bow/staff fallback, three debug release/reload
cycles, save/reload/Save & Exit/Continue, other-class isolation and virtual pad
movement. Camp screenshot reviewed. The first equipment test's ambiguous DOM
locator was corrected; no product assertion was weakened.

Exact Full CI/Pages/hosted acceptance and Checkpoint B remain pending. No production
acceptance claim. Latest verified deployed release remains
`3fd3525ebac49758946e547582663d4ccf0d576c` (Release C developer candidate).

The broader local run completed **672/674** with two unchanged generated-campaign
cases exceeding their25s limits. Both files pass **12/12** when rerun unchanged
with one worker; assertions/timeouts were retained. TypeScript, lint, assets,
backlog and build pass separately. No green `npm run check` claim is made.
Seven shared-arena browser cases pass. Camp/forest/graveyard/crypt captures were
reviewed; these constructed checkpoints are not an Act1 human playthrough.

The expanded live shield/empty-hand check discovered an existing save defect:
`moveOwned` passes a discriminated grid destination into `addGrid`, whose object
spread retained transient `kind` in the item entry. The strict snapshot reader
correctly rejected it as "Unexpected save fields". A new actual unequip→save→load
regression reproduced the failure before the fix. `addGrid` now copies only
`item/x/y`; **20 focused inventory/equipment/runtime/save tests pass**. Item
identity, placement, restrictions, schema and strict reader remain unchanged.
The rebuilt artifact passes the live blade/bow/staff/shield/empty-hand changes,
three debug release/reload cycles, save/reload/Save & Exit/Continue and real forest
melee plus both abilities. Legitimate Fan interruptions are retained; the driver
waits for real recovery/cooldown before reissuing normal input. **All10 production
cases pass across the bounded runs, plus seven shared-arena cases.** Raw captures/
failure history are in `/private/tmp/hollowbane-warrior-production-local` and
`-fixed`; final camp/combat captures reviewed. No physical-controller claim.
One earlier browser run overlapped a rebuild and saw temporary404s; that run is
not stable-artifact release evidence. A navigation-race test driver and its use
of the campaign skill-button as melee were corrected without changing input rules.

## Corrective A — required release gate

CI40567635119 failed only the new battle case: Oath was requested after the
observed idle sample had already yielded to a committed state. The retained Linux
context says **"Oath Echo: committed"**. Full **675 units/147 files**, required
compatibility and the other three Chromium shards pass. Deployment/hosted jobs
were skipped; A6290787 is **not accepted**. Raw failed log and browser artifact:
`/private/tmp/hollowbane-warrior-production-a-failed.log` and `-a-ci-failure`.

The driver now prepares the actual self buff before engagement and uses supported
hold-to-repeat melee rather than assuming a one-shot attack cannot be interrupted.
Both ability-effect and actual melee assertions remain. Six visible M4/Metal
legacy/Warrior battle runs pass with those inputs. Timing from those particular
Playwright runs is **not accepted**: trace-enabled runs contain large stalls in
both modes; tracing-disabled confirmation is pending. No invulnerability, stat,
damage, cooldown, AI or timing mutation was used. Natural crypt lethal damage,
held death15 and legacy/texture reload with unchanged corpse position/sequence
also pass; the gameplay-scale corpse capture was reviewed.

Thirty focused selector/arena cases pass after the active-projectile guard.
TypeScript, scoped lint and build pass. The complete corrected11-case local browser
suite passes (2.7m); a corrective commit and exact Full/Pages/hosted verification
are required before marking A accepted or finishing B.

## Provisional native movement evidence

Exact A6290787 artifact: visible Chromium156.0.8078.4, Apple M4/Metal,1280×800,
DPR1, Full detail, normal owned level24 Warrior forest save, seed42,16 actors.
Three alternating-order pairs each for browser keyboard events and a virtual pad;
60-frame warmup and420 measured intervals. Candidate p5016.7/p9517.2–18.6/
p99≤18.7ms, zero>25ms; legacy p9517.2–17.8. Camera-relative range0px. No warmed
improvement claim; this is movement, not actual combat or a full campaign.

Fresh-context HTTP-cache-disabled local-origin uploads take485–597ms, navigation
ready1649–2105ms versus legacy1162–1227ms. Exactly40 production requests,
23,458,595 encoded/23,470,595 transfer bytes and349.25MiB base RGBA; zero developer
requests. Whole-page loading RAF maxima267–317ms versus legacy266–283ms;
5–9 versus6–9 loading intervals>25ms. These startup/terrain/renderer gaps are not
warmed-play results and do not establish machine-cold or hosted loading behavior.
JS heap samples vary with GC and are not GPU memory or leak proof. Native maximum
texture edge16384px, all atlases≤2048px. Native old/new captures reviewed.

Raw `/private/tmp/hollowbane-warrior-production-native/summary.json`; reproduce
with `scripts/profile-warrior-production.mjs BASE_URL CONSTRUCTED_FIXTURES_JSON
UNTRACKED_OUTPUT`. Later active-weapon-guard builds still need final confirmation.

## Remaining acceptance

Representative real campaign combat, NPC/door/waypoint/area transitions, forest/
graveyard/crypt visual inspection and native M4/Metal matched profiling must be
recorded before final production acceptance. Retain physical-controller,
actual GPU-memory/residency and full Act1 human-playthrough limitations unless
measured/performed. Previously accepted cloak stiffness/foreshortening remain.
