# Q3-B Warrior equipment compatibility — DBL-023/024/025

2026-10-28. User authorizes modular Warrior equipment work through public
Checkpoints A/B/C. This supersedes the earlier production-publication stop for
this scope. Other classes, monsters, balance, saves and Phaser4.2.1 remain intact.
This includes the shield proof, opt-in showcase and now the local campaign
vertical slice below. **Checkpoint A is verified** at
`8fece2b98325991e2116d6de25e12aba5908d089`; see the acceptance section below and
[warrior-production.md](warrior-production.md). Historical sections retain their
then-current counts and restrictions.

## Showcase startup candidate — 2026-10-29

The remaining failure is `equipment study switches and falls back without changing
the frozen encounter or opening saves`. It fails before selection: the45-file
Phaser preload is capped at **two** requests. Published native starts reproduce
**6.258s cold**, with two further fresh-context starts2.378/2.768s; cached reloads
0.533–0.548s. CDN/connection/OS/GPU caches were not reset. The five-second check
exposes actual loading, not a hidden control or incorrect quest state.

The developer-only queue is now bounded at **four**. No atlas is skipped, deferred,
duplicated or registered twice. Campaign loading is unchanged. Explicit events
`hollowbane-warrior-arena-startup` and Performance marks record page loaded,
assets loading/loaded, renderer ready, input ready, interactive and first trusted
control interaction. Public read-only diagnostics are
`window.hollowbaneWarriorArenaStartup`. Controls/stage remain inert until every
required texture (including Original) exists, handlers are bound, the real first
render completes and its state snapshot exists. Failed required resources leave
readiness false and input inert. `readyMs` now includes that first render.

Three balanced matched pairs on native M4/ANGLE Metal,1280×800/DPR1, controlled
150ms latency/20MiB/s download/10MiB/s upload:

| Queue | Cold interactive | Successful Pause observed | Reload interactive |
| ----- | ---------------- | ------------------------- | ------------------ |
| 2     | 6.111–6.168s     | 6.190–6.247s              | 5.316–5.594s       |
| 4     | 3.849–3.901s     | 3.927–3.980s              | 3.456–3.508s       |

These local-preview reloads revalidate under injected latency; they are **not**
the cached hosted reload measurements above. A generated local diagnostic bundle
switches only the cap2/4 in balanced orders, then restores it; no source/art is
modified by the comparison. Twelve cohorts each have45 completed files,44 unique
developer requests,42 textures and373.25MiB calculated base RGBA, zero runtime/
request errors and zero>25ms over720 post-ready frame intervals. Four-way loading
has a68.5ms maximum during reload versus35.3ms at two; cold maxima35.2/33.5ms.
This loading-stage tail increase remains explicit; no combat-stall improvement or
GPU-residency claim. Matched data precede only removal of the startup error
observer after completion; final published measurements are still required.

Two new browser cases hold a real required request and inject404, proving that
ready/input cannot appear early and that the first real click works. Existing
five-second startup/UI assertions and60s case bounds are unchanged. A wider
native run exposed an independent facing-driver reset race: trace reads stale
previous-gait distance2.4 after Reset while the new fixture is at0, holding Run
until excessive travel reaches an obstacle. The driver now waits for the normal
published0-distance reset snapshot; every displacement/gait/eight-facing/camera
assertion and deadline remains. The original failure is retained; the repaired
case passes three times.

**14 units/two files**, strict TypeScript, full lint, formatting and build pass.
**16 distinct native Chromium cases** pass across bounded runs (initial15,
repaired facing3×), plus **eight Firefox/WebKit** readiness/selection/resource
cases. Captures reviewed. Final164-file build retains161 accepted hashes; only
the arena/entry JavaScript and HTML entry reference change. Every approved image,
atlas JSON and campaign chunk is unchanged: art/PNG/atlas/RGBA delta0.

Local candidate; publication pending. Require the risk-based **Full** exact CI,
Pages, hosted smoke, all164 public hashes, the22 independent hosted cases and
three actual cold/cached-reload pairs before production weapon expansion. Last
verified deployed SHA remains **f28c16c8080959b3a7a95a50683b470f76994dc2**.
No new weapon category is supported; staff/bow/unarmed remain legacy and B/C are
incomplete. Shared sword-free body pilot follows the startup release gate.

Raw evidence: `/private/tmp/hollowbane-q3-startup/{baseline-hosted,matched-native,native-ui,facing-reset,compat-ui}`.
`measure.mjs` retains the exact protocol, real milestone/resource timings and
trusted Pause outcome; source changes are presentation-only. The preliminary
client comparison correctly allows the changed HTML entry reference alongside
two JavaScript chunks; all non-entry assets are byte-identical.

## CI recovery — 2026-10-29

Candidate `72155e6d62a83add0779d3e2662c9a80389499d4` failed exact
[CI40918355913](https://github.com/tobisen/hollowbane/actions/runs/40918355913)
only in Full Chromium shard3's Warrior D12 finale reload. Other three shards,
complete units/tooling and required compatibility passed; publication was blocked.
Recovery ancestor `8a48dc9` remains intact. Recovery deployment is now verified at
`f28c16c8080959b3a7a95a50683b470f76994dc2`; the broader independent Q3-B
showcase acceptance still has the startup follow-up recorded below.

Downloaded trace/screenshots prove the journal never opened after reload. At
trace207342.669ms, inventory owns the loading modal, status is `Loading character
checkpoint…`, the class is still the default level1, and the journal opener is
disabled. The test sends `j` at207345.805ms after checking only area metadata;
`QuestJournal.open()` correctly rejects input before `worldReady`. Storage restores
and releases inventory later, but the lost shortcut is not replayed. The empty
journal title and hidden Next button then persist. No competing final overlay,
failed quest event or duplicate reward: the first claim and save completed with
claimed finale, XP4248 and gold531. No drag occurs; its dialog-scoped click handler
cannot intercept this keyboard event. The recent drag repair is not this cause.

The focused test repair waits for the journal opener to become enabled and the
loading inventory to close, focuses gameplay, sends the original shortcut, and
asserts the journal is visible before navigation. It also asserts the final title.
Every original reward/class/XP/gold/item/loot/progression/reload assertion and all
deadlines remain. Application, simulation, save schema and art bytes are unchanged.
Ordinary and6×CPU original local runs pass; this is evidence of a missed readiness
contract, not a claim that those runs reproduced the failure. Raw CI trace,
screenshots/log and local diagnostic evidence: `/private/tmp/hollowbane-q3-ci-recovery`.

The isolated delayed-transaction reproduction now passes: hold the real
read-only IndexedDB completion notification, observe loading inventory/disabled
journal, send `j` and verify both journal/Next remain hidden, then release the
notification and run the repaired setup through all original reward/reload
assertions. No timer delay or live simulation/save mutation is used. An initial
request-event interception did not delay storage (which awaits transaction
completion); its diagnostic failure is retained separately, not counted as a pass.

Local verification: **17 units/four files**, strict TypeScript, full ESLint,
formatting and production build pass; **nine focused native Chromium cases**
pass (three earned finales, merchant, keyboard-after-drag, controller/mouse
handoff, six-configuration selection, resource cycles and real shield drag/equip/
save/reload). Completion/camp captures reviewed. All **164 client file hashes**
match the previously sealed candidate exactly; runtime/art delta is0. Required
CI remains **Full**, measured from the last accepted deployment including the
unaccepted inventory interaction change. Do not expand weapons before its exact
Full/Pages/hosted/integrity release gate passes.

Recovery fix **f28c16c8080959b3a7a95a50683b470f76994dc2** is committed and pushed by normal fast-forward,
preserving `8a48dc9`. Exact [CI40937358584](https://github.com/tobisen/hollowbane/actions/runs/40937358584)
**passes Full, Pages, hosted exact-SHA/file smoke and Release acceptance**:
**682 units/150 files,315 Chromium (89+75+59+92),15 required compatibility**,
static/asset/backlog/tooling/coverage gates. All315 Chromium results have zero
failures, skips or retries; all four D12 cases pass on Linux. Downloaded CI seal
and independent public comparison match **all164 files** to the tested bundle.
The workflow ran19:08:33–19:37:28UTC on2026-10-29. Last verified deployed SHA is
now **f28c16c8080959b3a7a95a50683b470f76994dc2**; this does **not** mark B/C or the
broader independent showcase acceptance complete.

### Independent hosted result / execution boundary

The additional visible native M4/Metal run has **21/22 passes**: **all16 production
cases**, all three earned finale/reload cases, the earned-gold merchant case and
three developer resource cycles pass. Real drag/click/equipment/save/exit/re-entry,
both abilities without duplicate effects, eight-way locomotion, three terrains,
actual waypoint/portal travel, natural held death and404 recovery remain correct.
Camp, real combat and corpse captures reviewed. No source art/save/simulation or
Phaser changes. All pre-existing STATUS edits and16 other unrelated working files
were independently compared and preserved byte for byte.

The **developer configuration-selection case fails its original5s startup
assertion**, before any selection. Initial screenshot shows `Loading developer
atlases ·98%`; focused traced reproduction shows93% and no runtime/request errors
before teardown. Downloads are still active after5s from navigation: shield PNG/
JSON finish at5257/5261ms and final queued resources are not finished at capture.
`Arena.create()` correctly withholds readiness until resources exist. This is a
reproduced cold hosted asset-loading/readiness boundary, not an invalid weapon
selection or a green22-case run. The original5s assertion and60s test bound were
not changed; the diagnostic adds only read-only errors/resource timing observers.
Do not promote a weapon or call full Q3-B acceptance passed from these results.

Native additional unmatched battle: **602 frames/16 actors/42 textures**, verified
Apple M4/ANGLE Metal,1280×800/DPR1/Full; p5016.7/p9518.2/p99281.4ms,
**9>25ms/max416.7ms**. Existing variable checkpoint stalls remain; no improvement
claim or new matched comparison. Resource cycles pass42→0→42 with unchanged
inventory;373.25MiB is calculated base RGBA, **not measured GPU memory**. Art,
PNG/atlas and calculated memory delta remains0.

**Safe execution checkpoint; keep evidence-only commits local.** Next resolve the
hosted developer asset-load precondition explicitly, preserving all six selection,
frozen-encounter/save-isolation and existing UI assertions. Observe real resource
completion and renderer readiness; do not force actions or raise global timeouts.
Run the smallest cold hosted selection/resource cases with trace, then any required
new exact CI/Pages/hosted/integrity gate for a committed fix. Only after the complete
acceptance passes, begin a bounded shared sword-free body/patch feasibility slice,
then genuine staff grip/two-hand motion; bow draw/release and unarmed choreography
remain subsequent. No new weapon is supported. No full Warrior rerender.

Raw evidence in `/private/tmp/hollowbane-q3-ci-recovery`: `accepted-ci.json`,
`accepted-units.log`, `fix-ci-bundle`, all four shard reports, `hosted-results.json`,
`hosted-native`, `hosted-battle-summary.json`, `hosted-startup-diagnostic` trace and
`startup-failure-timing.json`. The unchanged22-case native config is
`playwright.hosted.config.mts`; use `PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/`
and `WARRIOR_PRODUCTION_PROFILE=1`. Focused original-deadline startup reproduction
uses `playwright.startup.config.mts --grep 'equipment study switches' --trace on`.
These are temporary evidence/harness files, not committed test artifacts.

## Verified sword/shield baseline and completion continuation — 2026-10-29

Exact [CI40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405)
for **8fece2b98325991e2116d6de25e12aba5908d089** is successful: all four required
Full Chromium shards, complete units/validators/tooling, required compatibility,
Pages, exact-SHA hosted flow and Release acceptance pass. Independent comparison
matches **all163 public files** to the previously reviewed/tested CI bundle.
The local `7b1e4e2` recovery commit contains evidence only; it is preserved as an
ancestor, without resetting the branch or treating it as the deployed runtime.

All **16 independent hosted equipment cases** pass in visible Chromium on native
Apple M4/ANGLE Metal (3.2minutes). Reviewed camp, real forest combat and natural
crypt corpse captures at gameplay scale. The extra unmatched hosted battle sample
has631 frames,16 actors/42 textures,1280×800/DPR1: p5016.7/p9516.9/p9917.6ms,
three intervals>25ms, maximum416.6ms. This does not replace the matched comparisons
below or establish an improvement; existing checkpoint stalls remain. Raw CI
receipt, captures and battle sample: `/private/tmp/hollowbane-warrior-equipment/hosted-native-a`
and `hosted-a-ci-receipt.json`. Machine receipt: `equipment-production-review.json`.

The remaining real configurations are staff/empty offhand, bow/empty offhand,
empty hands and empty main/shield. No other main-hand/offhand category exists.
Staff is the first candidate to investigate because it retains melee semantics;
bow also needs a genuine projectile draw/release; empty-hand cases need unarmed
attacks. All require a **shared sword-free body solution** before any new category
can pass visual acceptance. The original source explicitly binds four sword
meshes to `handR`; all approved body PNGs flatten those meshes with the body.
The gauntlets use rigid mitten/finger plates, not independently articulated bow
fingers. Existing two-hand item metadata is a gameplay restriction, not an authored
two-hand grip. Simply attaching a staff/bow, hiding a sword under another picture,
or relabeling sword strikes fails this task's visual standard. No additional
weapon is promoted by this continuation; their legacy fallback stays explicit.

The completion increment adds the missing **empty main + bark-guard** appearance
choice, covering all six legal existing combinations. Labels use actual item
definitions; configuration diagnostics share the campaign selector. Each choice
explains its supported/fallback reason. Diagnostics also distinguish original
comparison and released/loading resources. The outdated campaign shield warning
is removed. Appearance controls remain disposable; primary/secondary, both
abilities, movement, hit/death, grip guides and comparison controls keep their
existing behavior. Campaign secondary remains its assigned skill, while the arena
also exposes the alternate melee clip. Actual shield drag/drop verification now
covers overflowing rejection and a valid grid move before equip/save/reload.

That trusted campaign test found a real interaction defect: replacing the grid
after a valid drag can remove its original click target, leaving `suppressClick`
to swallow the next deliberate item selection. The UI now clears that flag on a
new pointer gesture and allows keyboard activation (`detail:0`). The original
shield case fails before the fix and passes after it; immediate keyboard use and
virtual-pad→mouse handoff also pass. No timeout, ownership or simulation bypass.
Failure context remains in `completion-native`; passing results are in
`completion-drag-native`. A temporary runner initially used its own directory for
the preview server; explicit repository cwd fixes that configuration-only failure.

Seven focused suites/26 units, TypeScript, affected lint and build pass. Seven
distinct native Chromium scenarios pass across bounded runs, including real
secondary/Oath outcome parity and natural hit/death alongside the changed cases.
All eight focused Firefox/WebKit cases pass. Native and WebKit showcase captures
were reviewed. Publication is pending. The final164-file client retains158
accepted file hashes, including every approved Warrior PNG/atlas JSON. No new PNGs, atlases, decoded
payload, source-art edits, gameplay, save schema or Phaser changes are introduced.
This is an A acceptance/compatibility-showcase increment, **not completed B/C or
new bow/staff/unarmed artwork**. Next finish the focused browser checks, seal and
publish the coherent increment under the selected CI tier; require its exact
CI/Pages/hosted receipt. Then investigate a bounded shared sword-removal/body
patch proof and genuine staff grip/motion before considering production support.
Keep the accepted A release and all successful exports intact.

## Exact continuation release / safe resume checkpoint — 2026-10-29

Coherent candidate **72155e6d62a83add0779d3e2662c9a80389499d4** is committed and
pushed. The dry-run proved a normal fast-forward including `7b1e4e2`; no reset or
unrelated-document staging. Exact [CI40918355913](https://github.com/tobisen/hollowbane/actions/runs/40918355913)
is running; bounded inspection finds Fast static/contracts/smoke still in progress.
The repository classifier selects **Full**, including inventory UI integration;
no gate is lowered. Pages/hosted acceptance are pending. Last verified deployed
release remains **8fece2b98325991e2116d6de25e12aba5908d089**.

The final164-file tested bundle is sealed at
`/private/tmp/hollowbane-warrior-equipment/completion-tested-bundle` with this
candidate SHA. Keep this evidence-only recovery checkpoint local while the run
is active; another push cancels that run. Resume with:

```sh
gh run view 40918355913 --json headSha,status,conclusion,jobs
gh run download 40918355913 --name release-bundle --dir /private/tmp/hollowbane-warrior-equipment/completion-ci-bundle
python3 tools/ci/release_artifact.py verify --directory /private/tmp/hollowbane-warrior-equipment/completion-ci-bundle --sha 72155e6d62a83add0779d3e2662c9a80389499d4
```

Compare all164 CI file hashes to `completion-tested-bundle/release.json`; inspect
any mismatch. Require exact Full/Pages/hosted/Release acceptance. Then run the
existing hosted byte comparison against the downloaded bundle, all16 native
production cases (including the corrected real drag case), and the two updated
showcase selection/resource cases on the hosted developer route. Use the
preserved native/compatibility configs with `PLAYWRIGHT_BASE_URL` for hosted work;
review captures and record the accepted SHA. A failed required gate must be
repaired before proceeding. No B/C or new weapon art completion is claimed.
After exact acceptance, the next art slice is a bounded shared sword-free body
patch feasibility proof before genuine staff grip/motion. Do not relabel the
approved one-hand sword motion. Preserve all approved source/exported pixels,
explicit fallback categories and physical/GPU/human-playthrough limitations.

## Production sword/shield release candidate — 2026-10-29

The normal campaign now selects the original sword/shield candidate from actual
`ash-blade`/`bark-guard` equipment. Standard body frames remain shared; only the
late-death left arm uses the48 unique variants. Two optional, reference-counted
textures load after the existing40 finish, under the existing presentation
barrier. A single overlay follows the existing deterministic pose, root, actor
depth and hit tint. Hidden/disposed sprites restore their original textures
before release. Failed partial loads release all candidate textures, preserve
legacy presentation and do not retry every simulation tick; reload can recover.
No simulation, equipment rule/statistic, save format or Phaser4.2.1 change.

Empty offhand retains40 textures; shield uses42. Sorcerer/Ranger, bow/staff,
empty/unknown main, unknown offhand, committed projectiles, explicit legacy and
failed assets retain fallback. The original baked sword is never mislabeled as
another weapon. The source package's `productionApproved:false` describes its
immutable developer proof; the compact hash-pinned production descriptor is the
reviewed promotion path. Public acceptance remains separate and pending.

Full `npm run check` passes **682 tests/150 files**, TypeScript, lint,45 asset
records, backlog/dependency validation and build. **16 distinct production
Chromium scenarios** pass across bounded runs: character creation, existing
character, live inventory equip/unequip including persisted unequip, Save & Exit,
re-entry, three42→0→42 resource cycles, both missing-equipment-atlas recoveries,
cross-class isolation, actual movement/combat/both abilities, three terrains,
eight-way walk/run, natural held corpse, saved waypoint and actual portal travel.
Six additional Firefox/WebKit restore and failure/recovery cases pass. Earlier
14 developer Chromium/four compatibility cases remain recorded below. All tests
use real inputs and established simulation; no timing/stat/AI bypass was added.

The first local production invocation mistakenly selected hosted fixture mode
without a release receipt; corrected local invocation passed. The new travel
case initially called a developer-only route helper unavailable in campaign;
it now uses pure navigation and the existing trusted virtual-input driver.
Original arrival bounds remain. Native combat profiling preserves the already
approved Run/current-target driver; a snapshot/hash records that exact protocol.
All failure artifacts remain in the temporary evidence directory.

Gameplay-scale light/dark source, sixteen live walk/run facings, actual
camp/forest/marsh/crypt, melee/abilities and natural corpse captures were reviewed.
No demonstrated detached grip, body intersection or alpha halo remains in these
samples. Existing brisk cadence, rigid cloak and sculptural finish remain;
sampled geometry and automated motion do not replace a full human playthrough.

### Resource and native evidence

The two additional PNGs total **3688973 bytes**, plus313826 uncompressed atlas
JSON bytes and **24MiB calculated base RGBA**. Candidate total is42 textures,
373.25MiB calculated base RGBA. This is not GPU residency. Production requests
only the four hash-pinned aliases; no `/dev/` asset requests. Three tested cycles
release/reacquire cleanly; no general leak-free claim beyond these observations.

Native Chromium156.0.8078.4 /Apple M4/verified ANGLE Metal,1280×800/DPR1/Full,
HTTP cache disabled, balanced repeated orders and identical real shield snapshots:

| Measurement                                                    | Candidate                                                          | Same-equipment legacy baseline                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Movement (three pairs per keyboard/virtual-pad;420 frames/run) | p5016.7, p9518.6–18.7, p9918.7, max18.8ms;0>25                     | p9517.3–18.7, p9918.7, max18.8ms;0>25                             |
| Camera relative movement range                                 | 0px both axes                                                      | 0px both axes                                                     |
| Real16-actor forest combat (three pairs;584–619 frames/run)    | p5016.7, p9517.9–18.3, p9918.7–383.3, max415.7–416.5ms;5–13>25/run | p5016.7, p9517.8–18.4, p9918.7–267.4, max416.5–416.7ms;5–9>25/run |
| Cold navigation to renderer ready                              | 1699–1944ms; body492–558.4ms, extra shield38.5–54.8ms              | 1157–1178ms; no Warrior textures                                  |
| Production load                                                | 42PNG +2JSON;27147568 encoded PNG bytes/49721 encoded JSON bytes   | No Warrior requests                                               |
| Actual inventory equip click→observed ready (three pairs)      | 168.7–276.1ms; shield loader45.6–47.5ms                            | 121.4–123.9ms                                                     |
| Equip frame maximum                                            | 99.3–100.1ms                                                       | 99.9–100.1ms                                                      |
| Unequip click→observed ready                                   | 260.1–267.4ms                                                      | 263.4–268.8ms                                                     |
| Unequip frame maximum                                          | 200–216.6ms                                                        | 200–216.6ms                                                       |

Movement has5040 sampled frames total and16 actors. Each cohort proves actual
travel; prior idle-keyboard results are not reused. Combat includes real primary,
hit and both abilities. Legacy baseline is the last released fallback for this
same shield equipment, not a different body-only load. Existing variable
checkpoint/combat and inventory stalls remain; no tail-latency improvement or
globally hitch-free claim. No unrelated persistence optimization. Click-to-ready
includes browser driver observation/redraw overhead and two post-ready paint
intervals are retained in frame sampling. OS/GPU cache was not reset. Virtual
pads/browser keyboard/mouse are not physical-controller evidence.

Machine evidence: [equipment-production-review.json](equipment-production-review.json).
Raw renders, browser captures/results, matched movement, battle and inventory
switch samples plus a163-file tested client seal remain under
`/private/tmp/hollowbane-warrior-equipment`. Next commit/push this coherent
candidate, require exact **Full +Pages +hosted** acceptance and byte identity,
then record the published SHA before any B/C expansion. Candidate
`8fece2b98325991e2116d6de25e12aba5908d089` is pushed; exact Full CI
[40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405) is in progress. All163 locally tested client files match the exact CI artifact
byte for byte; its classification receipt confirms Full. No public A/B/C receipt
is claimed yet. Bows/staffs/unarmed still need a shared sword-free body and genuine
category-specific choreography; full armor production remains outside scope.

## Release continuation checkpoint — 2026-10-29

Pushed runtime: `8fece2b98325991e2116d6de25e12aba5908d089`.
Exact required Full run: [40790057405](https://github.com/tobisen/hollowbane/actions/runs/40790057405).
Static/build/smoke, complete unit/validators/tooling and all15 required
compatibility contracts have passed. At this checkpoint all four Chromium
shards are still running; Pages/hosted acceptance is not yet verified. All163
locally tested client files equal the downloaded exact CI artifact; its receipt
confirms Full. No equipment release is accepted yet. Last verified public
revision remains `ee03e81964bb597636aa2d96f64716268e5c1d81`.

Keep this evidence update local while that release run is active; pushing it
would cancel the current run. Resume by inspecting the exact run and failures,
not by starting more equipment work. If Full succeeds, require Pages and hosted
Release acceptance; compare all163 public bytes to
`/private/tmp/hollowbane-warrior-equipment/production-ci-bundle`, then run the16
production cases against the published URL using the native config
`/private/tmp/hollowbane-warrior-equipment/playwright.native.config.mts` and
`PLAYWRIGHT_BASE_URL=https://tobisen.github.io/hollowbane/`.
`WARRIOR_PRODUCTION_PROFILE=1` additionally verifies actual M4/Metal in battle.
Review hosted captures, record the accepted SHA, then publish the Markdown-only
evidence increment under the repository-selected tier and verify its own release.
Do not push this checkpoint while the prior run is active. If a required gate
fails, inspect its exact artifact and repair the demonstrated cause; do not skip
or lower the gate.

A remains incomplete; B/C have not begun. Bow/staff/unarmed remain legacy because
the baked sword/body and actual two-hand choreography are not interchangeable.
Next expansion must establish a shared sword-free body and genuine grips/motion,
not relabel the blade. Preserve successful exports and the48-frame shield death
repair. Physical controllers, GPU residency and full human Act1 remain unverified.
Unrelated pre-existing documentation edits remain unstaged.

## Packaged equipment / playable study — 2026-10-28

The original sword/shield candidate now has all784 unique shield overlays and48
limited death-body variants. A single cropped shield atlas supplies880 logical
frames; one cropped body atlas supplies64 logical late-death frames. All96
idle/settled aliases share pixels and preserve the appropriate body root.
The two atlases add **3688973PNG bytes /24MiB calculated base RGBA**, plus313826
atlas-JSON bytes. The approved40 body atlases remain byte-identical. No complete
880-frame body copy was made for this shield. These are developer assets, not new
campaign support or a GPU residency measurement.

The packer refuses incomplete/stale/failed proofs before writing. Every native
source raster is fingerprinted. Asset validation checks all cropped pixels,
source sizes, aliases/roots, atlas bounds and provenance. A944-frame round trip
(880 shield +64 body) reconstructs the native proof pixels exactly above the
existing alpha cutoff4. Native M4/Metal Phaser4.2.1 validates all880 trim/origin
contracts; its actual eight-way corpse captures were reviewed. All144 native
offline direction/clip/rate pairs observe every pose name;15 additional slow-idle
completion runs close the coverage missed by the initial short samples. Preview
combat/cast cadence remains diagnostic, not authoritative gameplay timing.

Local route: `?developer=1&warriorPilot=1&warriorArena=1&warriorEquipment=1`.
This opts into the existing playable arena with a visual-configuration selector,
grip marker and per-frame/fallback diagnostics. The same live pose selectors
drive both layers and the targeted late-death body. The overlay sits immediately
after its body at the same actor depth. Unsupported bow/staff/empty-hand choices
show legacy graphics; blade/empty offhand uses the approved body. These are real
base IDs on a disposable melee fixture, **not actual item transactions**. No
character owner, save, statistic or combat rule is changed by the selector.

Four new focused packing/asset cases, TypeScript, affected lint, asset validation
and build pass. **14 Chromium /4 Firefox-WebKit** cases pass across bounded runs:
all prior seven arena cases, live eight-way walk/run with bounded released-input
captures, actual secondary/Oath outcome parity, natural hit/lethal landing,
appearance/fallback switching, virtual controller, save isolation and resource
cycles. The initial new direction test incorrectly projected screen-relative
keyboard intent as world intent; its corrected expectation retains all original
movement/facing/overlay/camera assertions and5s bound. Failure evidence is retained.
No simulation or renderer repair was required for that test error.

Three unload/reload cycles return42→0→42 candidate textures, with stable total
texture counts and unchanged encounter state;168 PNG requests total across initial
load and three reloads. Developer resident payload is373.25MiB calculated RGBA.
Hidden sprites restore the original texture before removal. Ordinary entry and
the original arena request no equipment assets; the latter remains40 textures.
This is not measured GPU memory, a general leak proof or campaign switch latency.
Light/dark source proofs, actual ability/corpse captures and all16 live facing
captures were reviewed. Existing brisk cadence, rigid cloak and sculptural finish
remain. Physical-controller evidence is still absent.

Machine evidence: [equipment-review.json](equipment-review.json); source assets
and hashes: `public/dev/warrior-equipment/equipment.json`. Raw complete renders,
round-trip/Phaser checks,144 playback pairs/idle completions and browser captures
remain under `/private/tmp/hollowbane-warrior-equipment`. The earlier shield proof
below and `shield-review.json` retain their historical partial-render counts.

**Campaign shield selection remains legacy.** Conditional production ownership,
real equipment/save/reload/travel/death scenarios, cold/switch measurements,
matched native campaign profiling and exact CI/Pages/hosted publication are next.
The developer entry changes its route bundle; the earlier153-file identity claim
applies to the preceding offline-only increment, not this new developer build.
No public checkpoint is accepted and no release has been pushed. Do not advance
equipment expansion B/C past mandatory A acceptance.

## Shield proof checkpoint — 2026-10-28

Original `bark-guard` geometry and materials now have a fixed left-palm grip.
The plate is0.44×0.64×0.035m with0.14m hand clearance. All880 authored poses in
eight directions pass bone/root/foot checks, grip invariance, shield/body BVH
surface checks and shield-floor checks. Two independent executions have identical
core880-pose transforms/geometry diagnostics (canonical SHA256
`0df3b039aeddd400eeb8a4d106b2e8d7daf0d18f6a72eb9efdf264c6885ce64c`).
Whole JSONs differ in provenance and additional diagnostic fields; no byte-equality
claim is made for those files. See [shield-review.json](shield-review.json).

The original unchanged death arm **cannot fit this shield**: the rigid fit
intersects the forearm and sinks below ground. A73-angle handle sweep found no
valid late pose, including a narrower0.32m shield trial. A targeted left-arm
landing variant opens the arm nominally0.20m, constrained by the original two-bone
IK/reach, and turns the shield−20° around its physical handle over poses8–11.
Bone lengths, shoulder, hand orientation, all other bones, root, camera, combat
timing and simulation remain intact. Minimum sampled shield clearance0.010744m;
modified arm clearance0.037257m. Surface checks are not continuous collision proof.

This requires **48 unique late-death body variant images**, plus the two held
aliases per direction. All other body art reuses approved pixels. A shield-only
layer cannot fix the original death geometry. Do not cover or translate the
incorrect hand with arbitrary screen offsets or enable the unchanged death art.

`scripts/probe-warrior-shield.py` reuses the512-pose exporter via a read-only
observation callback. For procedural poses, it hash-checks and runs the existing
approved authoring scripts with one AST observation after `records.append`;
their pose code/assertions and source files are unchanged. The optional death-arm
candidate runs the existing IK in that callback. Renders use original body
geometry as camera holdouts, producing an equipment-only alpha overlay that can
be composited above the exact approved body. The probe rotates both rig **and
meshes** like the approved directional renderers; rotating only metadata wrists
does not rotate body geometry for this visual/depth test.

All96 packed idle/settled aliases are explicit, including root translation when
reusing a movement shield image in attack/ability/death cells. There are784 unique
equipment rasters to finish. Current proof contains126 unique overlays and138
composites: all110 SE poses and eight-way idle/primary/Oath/settled-death samples.
Light/dark stills and complete SE sequence strips were reviewed at gameplay scale.
Native Chromium passes18 offline playback cases (nine clips/two preview speeds),
with zero browser errors. Preview combat/cast cadence is diagnostic; these are not
actual campaign combat, controller or authoritative timing tests. Full eight-way
motion/transition review remains required.

`scripts/review-warrior-shield.mjs` verifies approved body hashes, handles alias
padding and emits comparison sheets, an isolated `motion.html` and pixel-depth
diagnostics. Sample West idle correctly hides1670 opaque shield pixels behind the
body; SE primary/Oath/death have front-facing overlaps. These samples do not prove
a single whole-sprite ordering fails within one frame. Per-pixel holdouts avoid
assuming one ordering for every pose. The full lit references and light/dark
composites retain no demonstrated gameplay-scale halo; shadow/contact appearance
and all remaining directions still need the developer/campaign review.

Four focused suites/14 tests, TypeScript, affected ESLint and build pass. All153
accepted runtime files match the new build byte for byte. No source blend,
approved PNG, renderer, save, balance or Phaser4.2.1 change. Runtime asset delta
remains0; the temporary138 composite overlays total924132PNG bytes **before**
tight atlas packing and are not a production payload/GPU residency measurement.
No new campaign/native performance or CI/Pages/hosted verification is claimed.

Raw evidence: `/private/tmp/hollowbane-warrior-equipment/shield-motion` (metadata,
overlays, limited body variants, depth references, light/dark sheets, motion HTML,
sequence strips and18-case browser results). Earlier `shield-rigid`,
`shield-corrected`, `shield-landing`, `shield-sweep`, `shield-narrow-sweep` and
`shield-arm-sweep` retain failed/diagnostic trials; do not count them as passes.

Next: preserve successful renders; finish only missing unique overlays and48
death body variants, package cropped alpha layers, review complete eight-way
motion/transitions and integrate in the isolated equipment showcase. Production
still supports only blade/empty offhand; shield/bow/staff/empty hands retain
legacy fallback. Then complete the actual sword/shield campaign vertical slice
and mandatory exact Checkpoint A CI/Pages/hosted gate before expansion B/C.

## Actual compatibility matrix

Only three main-hand bases and one offhand base exist. Names below are repository
base IDs; advanced/unique/set/socketed instances retain those bases. Level,
identification and configured attribute requirements still apply. There are no
class-specific equipment restrictions in `equipment.ts`.

| Configuration                 | Campaign renderer now     | New art needed                                      | Motion needed                                                                                          | Grip/attachment data                                          | Existing motion reuse                             | Temporary fallback                                          |
| ----------------------------- | ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `ash-blade`, empty offhand    | Yes                       | No; approved sword is baked in                      | No                                                                                                     | None for current baked renderer                               | All 72 clips                                      | Only debug override, failed loading or committed projectile |
| `ash-blade` + `bark-guard`    | Yes; A verified at8fece2b | Original shield and two shared optional atlases     | 48 unique late-death body variants; local and hosted campaign scenarios pass                           | Left-hand grip, full projected orientation and body occlusion | All 880 poses proven in developer assets          | Debug override, failed loading or committed projectile      |
| `reed-bow`, empty offhand     | No                        | Original bow plus shared sword-free body solution   | Bow draw/release and two-hand coordination; sword strikes do not establish compatibility               | Both-hand grip; projectile timeline alignment                 | Locomotion/hit/death may be reusable after review | Yes                                                         |
| `cinder-staff`, empty offhand | No                        | Original staff plus shared sword-free body solution | Actual melee staff choreography needs visual review; current sword strike is not accepted staff motion | Two-hand grip and staff/body occlusion                        | Locomotion/hit/death may be reusable after review | Yes                                                         |
| Empty main, empty offhand     | No                        | Shared sword-free body solution                     | Unarmed attack not authored                                                                            | Empty-hand pose data                                          | Non-attack states may be reusable                 | Yes                                                         |
| Empty main + `bark-guard`     | No                        | Shield and shared sword-free body solution          | Unarmed/shield coordination not authored                                                               | Left grip and occlusion                                       | Must be reviewed                                  | Yes                                                         |
| Bow/staff + offhand           | Invalid equipment         | —                                                   | —                                                                                                      | —                                                             | —                                                 | Existing transactions displace conflicting equipment        |
| Unknown future base           | No                        | Audit when introduced                               | Audit when introduced                                                                                  | Audit when introduced                                         | No assumption                                     | Yes, fail closed                                            |

`equipment-content.ts`: blade is one-handed; bow/staff are two-handed; shield
occupies `off`. Dual wield, axes, maces and other offhands are not current content.
`equipItem` stows offhand when equipping a two-handed weapon, or stows the
two-handed main when equipping a shield. Full inventory rejects the entire swap.
`validateCharacter` also rejects a two-hand/offhand conflict. These rules are
enforced, not merely descriptive metadata.

`equipment-stats.ts`: bow selects projectile/range6; staff/blade select
melee/range1.05. An empty main retains the captured class base weapon/range.
Committed attacks keep the previous simulation weapon until idle. Retain the
production selector's `committed-projectile` guard through equipment changes.

Warrior Sundering Fan (`iron-fan`) is class-derived single-target melee;
Oath Echo is self support. Skill definitions/casting do not impose an equipped
base category. This is gameplay permission, not proof the sword animation fits a
bow/staff. Normal secondary input keeps its assigned skill; the developer arena
also exposes the separate secondary melee clip.

## Armor and existing art

Ten slots exist: main/off, helmet/chest/gloves/boots/belt, ring1/ring2/amulet.
All contribute existing item statistics. No armor slot changes the world body
appearance. Preserve the approved static armor, cloth and materials. No per-item
transmog, socket graphics or armor variants are promised.

`inventory-view.ts` supplies original inline SVG symbols for blade/bow/staff/
shield and armor. These are inventory icons, not perspective-correct world art.
The Blender source contains four separate sword meshes (grip, crossguard,
pommel, blade), rigidly bound to `handR`, plus both gauntlets. Production PNGs
flatten them together with the body. No separate lit bow/staff/shield world mesh
or ready-to-use attachment atlas was found in the inspected Warrior pipeline.

## Attachment feasibility and smallest next step

The approved rig has 15 bones including `handL`/`handR`, forearms, upper arms,
torso/head, root and legs/feet. It has no authored shield socket or item-specific
grip. Bone origins are wrists, not a verified shield handle. Sword geometry uses
an authored rest-space offset from the right hand. Both hands' existing matrices
can produce deterministic projected transforms without new motion authoring.

`scripts/export-warrior-attachments.py` reads the hash-pinned movement/attack
blends with Blender4.5.3 and writes metadata only to a requested output path.
It exports all eight directions, 512 poses, both wrist origins, projected XYZ
bases, camera depth and world matrices. It checks shipped roots, bone lengths,
forearm/wrist continuity and directional foot positions. The full basis preserves
foreshortening that a single sprite angle cannot represent. No PNG or blend is
written and no approved source/provenance file is edited.

This is a feasibility probe, not a runtime attachment format. It excludes the
procedurally authored ability/hit/death poses (368 poses), weapon-specific grip
offsets, packed idle/settled-pose aliases and body occlusion. A hand's camera depth
alone cannot establish correct shield/torso overlap. Do not enable support from
this probe or treat it as a visual acceptance pass.

Audit's next step (now covered by the offline proof above): create one original
`bark-guard` mesh on a left-hand grip in a separate
developer source; prove shield/body visibility in eight idle views and moving
primary/Oath/death poses at gameplay scale, light and dark. Compare a small
equipment-only render with body depth/holdout against a projected attachment.
Pick the representation from that evidence; do not assume one whole-sprite
front/back depth toggle handles torso/arm occlusion. Reuse the existing sword
body for this first configuration. Bow/staff/unarmed require removing baked sword
pixels through a shared body solution; covering them with another icon is invalid.
Do not duplicate the entire body atlas set per weapon.

## Ownership and acceptance still required

`WarriorProduction` currently acquires one shared per-game lease, bounds downloads
to two, pauses at loading, preloads all40 state/direction atlases, restores the
legacy sprite before releasing textures, waits for pending loads, and cleans up
partial failures without per-frame retry. Unsupported equipment triggers that
release. Preserve this owner and extend the lease only after real visuals exist.
Equipment selection is reevaluated live; no simulation events originate here.
Keep reasons in developer diagnostics, outside normal player UI.

Asset delta for this increment: **0 PNG bytes, 0 runtime decoded bytes, 0 atlases**.
Baseline remains23,458,595PNG bytes/349.25MiB base RGBA/40 conditional atlases;
this is not measured GPU residency. No new native frame/load/switch measurements.
Prior native M4/Metal p9518.0–18.6ms and checkpoint stalls remain historical
baseline evidence, not equipment-extension results.

Checkpoint A still requires the first actual visual configuration, isolated
developer verification and exact CI/Pages/hosted acceptance. B/C additionally
require complete animation/transition/save/selection/area/death coverage,
repeat-switch resource bounds, added payload/load/switch measurements, matched
native p50/p95/p99/>25ms samples and production acceptance. No checkpoint may
advance past a failed mandatory gate. Physical controllers, actual GPU residency
and a full human Act1 playthrough remain unverified.

## Verified audit increment

Two independent Blender exports pass all512 pose checks and are byte-identical:
SHA256 `4460379c883fa32237df8af5f15c3d80f44975bb5ec5fe2481a18bca5b89ab8c`.
Raw JSON: `/private/tmp/hollowbane-warrior-equipment/attachments-1.json` and
`attachments-2.json`; temporary evidence is not committed. Blender initially
crashed in sandbox Metal initialization before running Python; the same approved
binary succeeds with normal native access. This is not a render/performance test.

Four focused suites pass14 tests: production selection/provenance, equipment
transactions, equipment content and derived statistics. TypeScript/production
build, ESLint and document formatting pass. Runtime, source art and saves are
unchanged; no browser screenshot/E2E or new native timing evidence is claimed.
No new CI/Pages/hosted run: this is a local recoverable audit increment preceding
public Checkpoint A. Continue from the shield proof checkpoint above: finish
missing rasters and all-direction motion before renderer integration. The full Q3-B
assignment remains incomplete; this checkpoint is a session-budget split.
