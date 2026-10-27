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
Playwright runs is **not accepted**: large stalls occur in both modes even with tracing disabled; they are not
attributed to tracing. A native CPU profile observes1198ms cumulative
`writeCheckpoint` work in a19s battle, including355ms session capture and842ms
save work. This identifies pre-existing checkpoint work as one contributor;
not every long interval is attributed. No checkpoint optimization or save-rule
change is included in the Warrior task. No invulnerability, stat,
damage, cooldown, AI or timing mutation was used. Natural crypt lethal damage,
held death15 and legacy/texture reload with unchanged corpse position/sequence
also pass; the gameplay-scale corpse capture was reviewed.

Thirty focused selector/arena cases pass after the active-projectile guard.
TypeScript, scoped lint and build pass. The complete corrected11-case local browser
suite passes (2.7m). Corrective candidate **d72d572247a0fd305a9253479f2e1db1a6f695b3**
is committed/pushed: [CI40573939227](https://github.com/tobisen/hollowbane/actions/runs/40573939227)
Fast, Full676 units/validators and required compatibility pass; Chromium shards1/2
failed as recorded below, so Pages/hosted acceptance was not reached. The sealed153-file local artifact is
`/private/tmp/hollowbane-warrior-production-corrective-tested`. A remains
unaccepted until the required release gate passes; final B remains incomplete.

## Verified native measurements — corrective runtime d72d572

Visible Chromium156.0.8078.4, Apple M4/Metal,1280×800, DPR1, Full detail,
normal owned level24 Warrior forest save, seed42,16 actors. Three alternating-order
pairs per input;60-frame warmup and420 measured intervals. The corrected tool
sends keyboard events to the focused game field and rejects a cohort without
actual displacement/walk poses. Both devices moved; axis ranges2.1213 world units.

| Scenario                | Warrior                  | Legacy                   |
| ----------------------- | ------------------------ | ------------------------ |
| Movement p50/p95/p99    | 16.7 /18.0–18.5 /≤18.6ms | 16.7 /18.1–18.5 /≤18.6ms |
| Movement>25ms / longest | 0 /18.7ms                | 0 /18.8ms                |
| Battle p50/p95          | 16.7 /18.3–18.6ms        | 16.7 /18.5–18.6ms        |
| Battle p99 / longest    | 18.7–381.4 /550.1ms      | 18.7–32.7 /634.4ms       |
| Battle>25ms per run     | 7–11                     | 7–10                     |

All six untraced battle cases pass actual melee, Oath and Fan with ordinary
interruptions. They travel the same authored forest route and keep16 actors;
inputs are browser-driven, not physical or bit-identical simulation replays.
Camera-relative drift is0px in the short movement cohorts. No warmed improvement
or globally hitch-free campaign claim. The sparse tail makes battle p99 variable;
large stalls occur in **both** renderers. Animation clip/facing-change windows
(±one RAF interval) have p95≤18.7ms; exposed update-CPU p95≤1.1ms and render-CPU
p95≤3.8ms. These are CPU/RAF envelopes, not isolated GPU timing.

A native CPU probe observes1198ms cumulative `writeCheckpoint` work in a19s
battle, including355ms capture and842ms save work. This identifies existing
checkpoint work as one contributor, not every long interval. Persistence/AI/
combat performance is unchanged by this presentation task; those baseline stalls
remain an explicit follow-up. Tracing-disabled results disprove the earlier
tracing-only hypothesis. Original A synthetic-keyboard rows stayed idle and are
**excluded** from movement evidence; replacement cohorts verify actual walking.

Fresh-context HTTP-cache-disabled local-origin candidate uploads take707–870ms,
navigation ready2513–3060ms versus legacy1778–1957ms. Exactly40 production PNG
requests,23,458,595 encoded /23,470,595 transfer bytes and349.25MiB base RGBA;
zero developer requests. Whole-page startup RAF maxima433–500ms versus legacy
433–484ms; these terrain/renderer/loading gaps are separate from warmed play and
are neither hosted nor machine-cold results. JS heap varies with GC and is not
GPU allocation or leak proof. Native maximum texture edge16384px; all atlases
≤2048px. Final native keyboard/pad captures reviewed at gameplay scale.

Raw evidence:

- `/private/tmp/hollowbane-warrior-production-native-verified/summary.json`
- `/private/tmp/hollowbane-warrior-production-native-untraced`
- `/private/tmp/hollowbane-warrior-production-cpu` (CPU probe, not pacing acceptance)
- Historical invalid/traced/failed trials retain their original directories.

Reproduce movement using `scripts/profile-warrior-production.mjs BASE_URL
CONSTRUCTED_FIXTURES_JSON UNTRACKED_OUTPUT`. Battle probe uses
`WARRIOR_PRODUCTION_PROFILE=1`, optional `WARRIOR_PRODUCTION_LEGACY=1` and
`WARRIOR_PRODUCTION_CPU=1`; require visible M4/Metal and disable Playwright tracing
for pacing. CPU sampling and screenshots must remain outside accepted pacing
cohorts. No live simulation mutation is used.

## Second input repair — required A gate still blocked

Corrective d72d572 /CI40573939227 also failed release acceptance: campaign Fan
reported **out-of-range**, and the old arena controller case's Oath was
interrupted after engagement. Full676 units, required compatibility and other
Chromium cases pass, but publication is not accepted. Retained contexts/logs:
`/private/tmp/hollowbane-warrior-production-corrective-ci-failure` and
`-corrective-failed.log`. The normal crypt death case passes on Linux too.

The campaign driver now reads public snapshots and approaches/selects an in-range
opponent through the normal virtual stick and target-cycle button, then emits the
usual Fan button only when idle/cooldown permit. Host polling no longer assumes a
retreating target remains in range. The arena self buff occurs before engagement;
the final exact-one-effect assertion is retained. Both exact failed cases pass
three local repetitions each; the arena end-count check also passes separately.
No actor, health, offense, AI, cooldown, damage or simulation timing is patched.
A new ordinary-campaign case verifies all eight facing directions for both walk
and run through the shared virtual input; its gameplay-scale captures are retained.
This is twelve production cases plus the existing seven arena cases across focused
runs. Four additional Firefox/WebKit creation and failed-asset fallback cases pass;
those captures and ordinary walk/run captures were reviewed. No full cross-engine
Act1 playthrough is claimed. Gate-repair candidate **f86d07597533d38066315a6d3b76c986c9458ddb** is committed/pushed.
[CI40583590744](https://github.com/tobisen/hollowbane/actions/runs/40583590744)
failed the bounded-direction observation as recorded below. Its153 sealed local files are
identical to the profiled corrective runtime; only tests/profiling/documentation
changed. Final acceptance remains pending.

## Final campaign coverage and limits

| Requirement                   | Evidence                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| New and historical Warrior    | Real owned-character creation/selection, existing slot, Save & Exit, Continue and reload                             |
| Locomotion/collision/camera   | All eight walk/run directions, existing controller waypoint/area-route contracts, native moving forest cohorts       |
| Combat/skills/reactions/death | Full16-actor forest melee and both abilities; normal interruptions; natural crypt lethal damage and held death15     |
| Equipment/inventory           | Live blade/bow/staff/shield/empty-hand switching, deferred projectile guard, strict unequip-save-load regression     |
| World/UI                      | Forest/graveyard/crypt captures, forest→graveyard→forest→camp route, NPC briefing and controller waypoint round trip |
| Legacy/other classes          | Three debug lease cycles, corpse mode switching, Sorcerer/Ranger no-atlas checks, independent character saves        |
| Asset lifecycle               | Conditional40-atlas ownership,0 after release/40 on reacquire, safe partial failure, no ordinary developer requests  |
| Browser coverage              | 12 production/seven shared-arena cases across focused local runs; four Firefox/WebKit startup/failure cases          |

These representative campaign checkpoints do not constitute a full Act1 human
playthrough. Physical-controller/vibration and actual GPU-memory/residency/leaks
remain unverified.40→0→40 texture-manager counts are lifecycle evidence, not a
claim about GPU-driver allocations. Existing combat checkpoint stalls, accepted
cloak stiffness/foreshortening and unchanged static armor appearance remain.
No next class/monster artwork, balance or campaign work is implied.

## Bounded-direction gate repair

Candidate f86d075 /CI40583590744 **FAILED** only the new eight-direction case.
Full676 units/147 files, required compatibility and three other Chromium shards
pass. The actual forest battle and natural crypt death pass Linux. Pages/hosted
were skipped; verified deployed remains3fd3525. This failed run is not acceptance.

The retained trace shows the first walk screenshot held the stick for another
1.25s, moving spawn0,0 to2.864,2.864. The first run screenshot then carried the
actor to3.8,3.8 at the normal camp boundary. The next requested diagonal was
correctly blocked by collision, so the gait observation timed out. This is an
unbounded test input, not a renderer/collision defect.

The browser observation now captures actual walking/gait/facing/displacement and
neutralizes the ordinary virtual stick at that observation, before host polling
or screenshot work. Both gait sets still require all eight distinct facings and
actual movement>0.15. No actor positions, collision, simulation clocks or stats
are patched. Captures are named after movement rather than claiming a moving
frame after input release. Three ordinary and three6×CPU-throttled local repetitions pass.
TypeScript/affected lint pass; all153 rebuilt runtime files remain identical. Failure evidence:
`/private/tmp/hollowbane-warrior-production-input-repair-failure` and
`-shard1-live.log`; correction evidence `-bounded-directions`.

## Existing miniboss input gate repair

Candidate04091d9 /CI40588421219 is blocked by Chromium shard3's existing
`overnight-d07b` mouse-fight approach, before combat. Its graveyard fixture retains
legacy presentation. The diagnostic shows actual walking speed, an unblocked live
actor and continued progress to6.878,3.5, only0.122 from7,3.5 when the original
10s waypoint deadline expires (precision0.1). Run was requested via keyboard
immediately after inventory interaction, then navigation switches to virtual input.
This is not evidence of a new Warrior rendering/collision failure.

The unchanged mouse case passes three local repetitions, confirming intermittent
input/timing rather than a persistent local failure. The test now requests Run
through the existing sampled virtual button10 helper, keeping approach input on
one device after the modal closes. No deadline, precision, route, damage, reward,
save or fight assertion changes. Both miniboss cases pass three repetitions each;
TypeScript and affected lint pass. Application/source assets remain unchanged.
Failed evidence `-bounded-shard3.log` / `-bounded-shard3-failure`; local baseline
`-existing-miniboss-baseline`; correction `-existing-miniboss-input-repair`.

## Existing short-phase and Ranger click gate repairs

Candidateef1ef92 /CI40592127397 **FAILED** Chromium shards3/4; Pages/hosted
were skipped. Full676 units/147 files, compatibility and shards1/2 pass,
including all12 production cases again. The repaired miniboss cases pass Linux
(45.2s mouse/31.0s controller). Current failures are existing legacy tests:

- `combat.spec` waited for a six-tick projectile windup after clicking. The retained
  screenshot shows a completed legitimate42-damage attack, idle actor, windup6,
  and software frame p9583.3ms. Pre-arming a snapshot alone passes ordinary/6×
  trials but fails a50×CPU stress; a short phase can complete within catch-up.
  The repair uses existing recorded phase events and a fully registered read-only
  observer after the normal trusted ground-pointer handler. It checks delivery
  during commitment, unchanged x/y, six inclusive windup ticks (entry consumes the
  first tick), full recovery timing, subsequent walking and keyboard stop/move.
  No simulation hook/clock/phase mutation or deadline increase. Three ordinary
  and three50×CPU stress repetitions pass. Failed intermediate experiments remain
  labelled; they are not acceptance evidence.
- `menu-characters` clicked a final short ground segment near a moving enemy.
  Its intended(-7.25,11.25) endpoint is already within0.36 of the preceding
  (-7.5,11) endpoint. The redundant click correctly became an attack: retained
  screenshot shows selected/damaged Thorn runner, not completed ground travel.
  The driver now lets that existing route finish rather than issuing another
  click when the segment is within its existing tolerance. Every waypoint still
  requires distance<0.36 within the original5s; actual starter-bow acquisition/
  damage assertions remain. The navigation repair passes three ordinary/two6× runs; a third6× run
  passes navigation but exposes a stale post-input acquisition false despite
  actual55-damage critical/death events in its retained diagnostic. The callback
  now re-reads its identical selected-or-damaged predicate after trusted input.
  The final version passes an ordinary case and three6× cases. Original5s
  acquisition and15s damage limits remain; no successful damage is fabricated.

TypeScript, affected lint and formatting pass. No application/art/save/balance
changes; all153 runtime file hashes remain the same profiled d72 runtime.
Raw failures `-miniboss-shard3.log` / `-miniboss-shard3-failure` and
`-miniboss-shard4.log` / `-miniboss-shard4-failure`. Corrected evidence
`-ground-history-armed`, `-ground-history-50x`, `-ranger-arrival-repair` and
`-ranger-arrival-slow`. Earlier pre-armed-only50×failure/interruption is retained
in `-ground-windup-50x`; the first history experiment's entry-tick arithmetic and
listener-registration race were corrected against the unchanged timeline source.

## Remaining release acceptance

Another exact required release gate is necessary for these two focused existing
browser-driver repairs. ef1ef92 is not accepted. Independent hosted12 campaign
checks, public153-file verification and final B evidence remain incomplete.
Last verified deployed remains3fd3525ebac49758946e547582663d4ccf0d576c.
