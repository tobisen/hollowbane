# M1-C character creation and selection — DBL-210 / DBL-004

User-authorized October24: continue sequentially through M1-C, M1-D, M2-A,
M2-B, M2-C and M3, with an exact CI/Pages/hosted gate between deliverables.
This supersedes the historical M1-B stopping instruction. Do not use the old
orchestrator. No Act2, additional services, engine migration or unrelated gameplay.
M1-B prerequisite `21f0f4863f7490c93703b1d52a70f54952dec0f5` and successful exact
[CI40081698959](https://github.com/tobisen/hollowbane/actions/runs/40081698959)
were independently rechecked against live main before implementation.
Pre-existing local documentation changes are preserved and excluded from task commits.
Original requirement IDs/dependencies and broader partial parents remain unchanged.

## Player flow and ownership

New Game and empty selection cards open class/name setup. Warrior, Sorcerer and
Ranger use the existing class definitions, starting attributes and skill-class
contracts. Preview shows identity, attributes, strengths and weaknesses. Names
use M1-B's trimmed 1–32 visible Unicode character validation and are rendered as
text, never markup. Review and explicit confirmation precede allocation.
A pure seeded factory creates a level-one, zero-XP, unspent-points campaign at
Ashen Refuge with empty inventory/equipment and no earned rewards. It does not
introduce a save engine or alter existing combat/resource/balance rules.

Eight cards expose name, class, level, last played and selection/focus. Listing
remains metadata-only; selecting validates that owner's complete snapshot and
shows available area/visited progress. Empty cards open creation; eight occupied
slots disable further creation. Deletion explicitly names the character, defaults
to Keep, archives only that owner through the M1-B transaction and frees a slot.
No automatic archive eviction or permanent erase is added.

World characters use `?world=1&character=UUID`; inventory-only legacy characters
retain `?inventory=1&advanced=1&character=UUID`. Startup rejects a mismatched mode
before activation or saving, rather than inventing a campaign. `CharacterCheckpoint`
permanently binds one owner, adapting the existing load/save/recovery interface
to M1-B operations.
The runtime prepares/restores the validated full session before activation records
last played. Revision CAS remains active for every autosave/manual save. Loading,
creation and listing alone never mark a character played. Duplicate confirmations
are guarded; a successfully allocated identity is retained if subsequent work fails.
Missing/corrupt/stale owners never start another character or write a legacy save.
A failed slot startup remains in recovery UI; its return link opens selection.
Normal gameplay does not gain an unawaited return link before M2-B Save & Exit.

Continue follows only the committed recent owner. A corrupt recent blocks Continue
and offers explicit same-owner backup recovery or manual selection. No valid older
character/backup is silently substituted. Recovery archives damaged originals and
may omit later progress. Full snapshot formats and transient HP/mana/combat restart
policy are unchanged; inventory, equipment, XP, attributes, skill trees/bar, gold,
local stash, quests, discoveries, waypoints, seeds/layouts and area state use the
existing capture/restore pipeline.

## Legacy and developer boundaries

A valid unmigrated legacy save offers explicit Import and Play confirmation.
Selection also offers import after another character has been played. Migration
uses M1-B's idempotent destination transaction, original raw retention and receipt.
It never modifies the old database or resurrects an explicitly deleted import.
Corrupt legacy data retains its existing explicit recovery route. Unsupported
formats remain unsupported; a concurrent changed source requires reconciliation.
Historical direct/developer routes retain their existing namespaces and do not
access the character registry. Appending developer/training/other options to a
real-character URL fails closed to selection before gameplay starts. Duplicate
identity/world query values and invalid UUIDs are likewise rejected.

## Input, artwork and lifecycle scope

Native buttons/input/dialogs support mouse, Tab/Enter, arrow navigation, Escape
and visible focus. Existing semantic controller actions support class/slot focus,
confirm/back, and switching to keyboard for naming. Xbox/PlayStation tests are
virtual; physical controllers, platform text entry and vibration are unverified.
Nested dialogs track their actual opening order and restore focus on close.
Pagehide releases storage/listeners/input; bfcache restoration revalidates on reload.

The G1-approved original cloister background remains temporary. Class Unicode
emblems and CSS frames are explicit original layout placeholders, not final
portraits. No raster art/audio is generated in M1-C. Final sanctuary/consistent
three-class artwork belongs to M1-D and must be provenance-tracked there.
Fullscreen/right-click implementations and Phaser4.2.1 are preserved.

## Verification and release

Focused local verification and exact publication evidence will be recorded here
before starting M1-D. Full is required for shared persistence/public contracts;
the classifier, assertions and release policy are unchanged. Do not repeat full
campaign/loot simulations locally when required CI provides the broad regression.

Initial failures were a round-trip test expecting runtime fields to remain absent
(the existing deserializer derives requirements/reserved IDs), and a genuine new
footer-selector error after appending a recovery link. The test now compares the
canonical persisted representation; the selector targets the actual final paragraph.
Failure traces are retained locally under `/private/tmp/hollowbane-menu-work`.
No existing save validation, assertion tolerance or deadline was weakened.

Local candidate:19 focused units (new-character/registry/serialization/progression),
34 unique affected Chromium cases (13 M1-C, seven title/legacy and14 existing
storage contracts), strict TypeScript, scoped ESLint/Prettier and production build
pass. Three final narrow/recovery/import reruns confirm the latest adjustments.
Reviewed desktop confirmation,360px creation/selection and2560px selection/title
captures; empty-card text wrapping was corrected after the first review.
Simulated quota/duplicate confirmation and real two-tab CAS rejection pass.
The updated M1-A tests retain raw legacy equality/item identity and now expect the
explicit import/setup steps requested by M1-C. No physical hardware claim.

Classifier dry-run requires Full for shared entry/save/public contracts. Exact
commit/CI/Pages/all hosted bytes and relevant hosted menu/session cases remain
pending. Last accepted deployment remains `21f0f48`. Never start M1-D before the
M1-C publication gate passes. Preserve local unrelated documentation edits when
staging; only this task's checkpoint additions belong in its commit.

## Publication checkpoint

Candidate `ee2b8caa6970c8727b2448d30a1bf15fbf2cb71f` committed/pushed;
[CI40100847783](https://github.com/tobisen/hollowbane/actions/runs/40100847783)
is running. Required Full/Pages/hosted acceptance remains pending. On success,
download `release-bundle` to `/private/tmp/hollowbane-m1-c-ee2b8ca`, verify its
sealed full SHA/all hosted bytes with `tools/ci/release_artifact.py`, and run
hosted `main-menu.spec.ts` / `menu-characters.spec.ts` (20 cases). Record the
accepted SHA before beginning M1-D. Last accepted deployment remains `21f0f48`.
This post-push evidence stays local to retain the exact running release identity.

CI progress: Fast static/contracts/build/initial browser smoke passed1m39s;
complete Full units/validators/tooling passed2m30s; all15 existing required
Chromium/Firefox/WebKit inventory cases passed3m39s. Four Chromium shards and
publication remain pending. Downloaded/sealed artifact verified at the directory
above; all34 files exactly equal the locally tested build. This is artifact
evidence, not hosted acceptance.

## Required release repair

Run40100847783 finished with one failure and was not accepted. All13 M1-C UI
cases passed in shard1 (69 passes, zero skips/flaky); shards3/4, complete units
and all15 compatibility cases passed. Shard2 had58 passes and one failure:
D08 genuine boss fight completed both phases/death with player51HP and exact
legacy sentinel retained, then its exact database inventory assertion found the
roster created by its initial root-title setup. The memory-only boss route itself
did not create that database. Original screenshot/trace/report retained under
`/private/tmp/hollowbane-menu-work/ci-chromium-2-failure` and visually reviewed.
Verify and Release acceptance failed; Pages/hosted were skipped.

Focused repair changes only D08's initial bootstrap from root to the existing
storage-free `?controller=1` route. All original combat, sentinel, exact database
assertions and deadlines remain intact. Both unchanged keyboard/mouse and virtual
controller boss contracts pass locally50.2s. TypeScript/relevant lint/format pass;
no application/engine/balance/save runtime change or redundant build. The existing
build's34 files remain the same locally tested/sealed application. Local unique
browser evidence is now36 cases; focused unit evidence remains19. Replacement
exact Full/Pages/hosted gate remains mandatory before M1-D.

Replacement test-only candidate `6177d740d5df2678df5131840292947434d46ddb`
committed/pushed. Exact [CI40102170416](https://github.com/tobisen/hollowbane/actions/runs/40102170416)
is running. Original40100847783 remains failed, not accepted or deployed. Download
replacement `release-bundle` to `/private/tmp/hollowbane-m1-c-6177d74`; require
Full/Pages/all34 hosted bytes/20 hosted menu-session cases before M1-D.

## Inventory-only legacy compatibility correction

A focused audit/reproduction found that the original M1-C world-only handoff
would introduce a world session for an inventory-only historical character. The
new regression first failed on6177d74's world URL. The corrected handoff chooses
the existing route from the validated snapshot's exploration presence, preserving
M1-A semantics. The slot adapter validates the mode before activation/saves and
blocks manual wrong-mode URLs. Only the two exact normal route shapes are allowed;
extra/developer/mixed/duplicate parameters still fail closed. No save schema or
legacy-source mutation is introduced. Failed entry disables save/export/import/close
until successful restoration, while explicit recovery/selection remain available.

Cancelled superseded CI40102170416 before publication after establishing the
compatibility issue. It is not accepted release evidence. Completed checks included
Fast, Full units/tooling, all15 compatibility cases and Chromium shards2/3, including
the repaired D08 isolation test; interrupted jobs are not passes. Last accepted
public build remains21f0f48. Original failure trace/screenshot is retained under
`/private/tmp/hollowbane-menu-work/inventory-route-failure`.

All21 focused menu/session browser cases pass1.5m, including the new inventory-only
legacy import/save/reload/Continue/mode-rejection case. Three final blocked-entry/
legacy/creation reruns pass15.3s; TypeScript/scoped lint/format/production build pass.
Local unique evidence is now37 browser cases plus19 focused units; unchanged
M1-B storage and boss regression results are retained, not repeated. Require a new
exact Full/Pages/34-file hosted verification and21 hosted menu/session cases before
M1-D. The application bytes changed in this correction;6177d74's sealed build is
retained for history and cannot stand in for the new candidate.

Final blocked-entry capture exposed the footer below the initial scroll position.
Failed startup now focuses its visible selection link, bringing the error/actions
into view. The existing missing-owner/forbidden-mode case passes6.9s with disabled
save/export controls; final screenshot reviewed. No normal-game return link is
exposed before awaited Save & Exit.

Corrected candidate `9e928a74ae34dcb0d628cc2b49990d32d8e4f699` committed/pushed.
Exact [CI40103889624](https://github.com/tobisen/hollowbane/actions/runs/40103889624)
is running. Download `release-bundle` to `/private/tmp/hollowbane-m1-c-9e928a7`;
require exact Full/Pages/all34 hosted bytes/21 hosted main-menu and menu-characters
cases before M1-D. Earlier candidates/failures/cancellation remain historical and
are not substituted for the corrected release's evidence.

## Accepted release — October24

Verified deployed SHA `9e928a74ae34dcb0d628cc2b49990d32d8e4f699`. Exact
[CI40103889624](https://github.com/tobisen/hollowbane/actions/runs/40103889624)
passed required Full units/tooling,215 Chromium cases (zero skipped/flaky), all15
required compatibility cases, verify, Pages, hosted smoke and Release acceptance.
Independently verified all34 public files against the sealed artifact. All21
hosted title/creation/selection/Continue/deletion/recovery/owner/mode/legacy cases
passed88.1s with zero skips/flaky results. Hosted responsive/recovery screenshots
reviewed. HEAD/cached/live main agree. Prior failure/cancellation evidence remains
historical and is not counted as green. No physical evidence or new raster art.

M1-C is technically released. Continue the authorized sequence with M1-D art/UI
polish, then each gated M2-A/B/C and M3; the full assignment remains incomplete.
Machine record `/private/tmp/hollowbane-m1-c-release.json`; hosted report
`/private/tmp/hollowbane-menu-work/m1-c-hosted.json`. Post-release evidence remains
local until the next authorized increment to retain this accepted identity.
