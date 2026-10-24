# Menu and character experience

User-authorized October23: sequential autonomous M1/M2 releases through final
menu/character review. No Act2 or unrelated Q2/Q3 expansion. Preserve Phaser4.2.1,
existing characters/items and the accepted fullscreen/context-menu implementation.
Original DBL requirements remain stable and broader parents remain partial.

## Reconciliation

Local main, HEAD, cached origin/main and live remote main matched
`43b2c2c288a2a37e0f4f293d3e4bfc107807e7b3`. Exact
[CI39977726854](https://github.com/tobisen/hollowbane/actions/runs/39977726854)
succeeded including Full/Pages/hosted acceptance. Independently verified the
public manifest and all26 sealed files. Prior fullscreen/context-menu
release evidence remains in docs/quality/q2-a1.md. Existing unrelated local
documentation changes are preserved and excluded from menu commits.

Before this assignment, root launched the cloister prototype. Explicit world
routes start CombatArena/WorldSession; InventoryView owns InventoryStorage.
`hollowbane-character-v1` contains atomic current/previous snapshots and explicit
quarantine recovery. Revision CAS protects stale-tab writes. Schema5 supports
validated historical character schemas through existing deserialization, with
progression, skills, items, equipment and embedded world/quest/stash state.
There is no existing character-slot registry, display-name identity or menu.
Some inventory/developer routes currently share the legacy database; M1-B must
isolate these before creating real slots. Do not claim this isolation is finished.

## Release sequence

| Gate                   | Scope                                                                                                                  | State                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------- |
| M1-A / DBL-004         | Root title, navigation, validated legacy entry, focus/error/loading states                                             | Accepted2246206      |
| M1-B / DBL-210         | Eight stable-ID IndexedDB slots, metadata/CAS transactions, validated idempotent legacy migration, developer isolation | Local candidate      |
| M1-C / DBL-004/112/210 | Named class creation, preview, selection/deletion, successful activation/last played                                   | Pending M1-B release |
| M1-D / DBL-023/026/028 | Original background/consistent class portraits, manifest and final UI polish                                           | Pending M1-C release |
| M2-A / DBL-004         | Semantic pause/resume lifecycle and responsive UI                                                                      | Pending M1-D release |
| M2-B / DBL-210/004     | Awaited Save & Exit and complete existing settings integration                                                         | Pending M2-A release |

Each gate requires local relevant/static verification, commit/push, automatically
required CI tier, exact Pages artifact/hosted verification and recorded SHA before
the next release. No old overnight orchestrator. Split oversized persistence
work safely; no automatic deletion or silent recovery, and no unsupported legacy
compatibility claims.

## M1-A foundation

Root now renders an accessible title, with read-only validation through the
existing storage API. Continue and single legacy character selection resume the
validated save; a corrupt current never auto-selects its backup. Review recovery
opens the existing explicit recovery UI. Storage failure disables character
entry and offers Retry while Settings remains usable. No snapshot is written by
the menu. Settings embeds the existing controller settings form and uses its
existing global storage. Rendering/simulation and save contracts are unchanged.

During this foundation release New Game opens the existing Ashen Refuge entry
only when legacy storage is empty; it is hidden for an occupied/unreadable save.
Eight slots and named/class creation are deliberately later gates, and the whole
assignment is incomplete until they replace this single-character bridge. No
occupied-slot replacement or deletion is introduced here.

Native buttons/dialogs support mouse, Tab/Enter, arrow navigation and Escape;
semantic gamepad actions support D-pad/left stick, confirm/back and settings
adjustments, including remapped bindings. Menu navigation does not install the
in-game developer pause widget. Pagehide clears inputs/listeners; bfcache return
reloads and revalidates storage. Fullscreen/context handlers remain untouched.

Existing query modes remain available. `?cloister=1` explicitly preserves the old
root prototype. Existing cloister links and browser helper/navigation routes now
use that route; all original assertions remain. `?metrics=1`, quality/noMist,
world, controller, gallery, engine and combat/skill/inventory routes are retained.

The background temporarily reuses the original G1-approved cloister source,
`assets/source/cloister.png` via `public/assets/cloister.webp`; provenance remains
docs/art/prompts.md and the existing manifest record. CSS frames and system
Georgia title text are original lightweight styling. No new raster art/audio is
claimed; dedicated sanctuary artwork/three portraits and ambience remain M1-D.

## Verification / continuation

TypeScript, ESLint and production build pass. Eight focused existing
inventory/progression serialization units pass. Menu browser checks cover fresh
storage, exact legacy item identity/entry, corrupt current with valid backup,
unavailable storage/retry, virtual Xbox/PlayStation navigation, and360/2560-width
layout/settings. Existing cloister fullscreen/context compatibility is retained.
Screenshots are local test artifacts, never committed. No physical-controller
evidence. Initial browser startup hit sandbox EPERM; authorized elevated preview
ran normally. Initial new test failures were an ephemeral autosave-status
assertion and an incorrect one-cell assumption for a three-cell sword; tests now
check the anchored item's exact identity. No existing assertion was weakened.

All36 targeted Chromium cases pass (seven menu plus25 existing gamepad and
four fullscreen/cloister compatibility cases). Desktop,360px and2560px title/settings screenshots reviewed.
Classifier dry-run requires Full for shared root entry and new module/CSS;
policy is unchanged. No local Full run claimed.

Required CI tier and publication are pending until recorded below. Do not begin
M1-B before this release gate passes. Last accepted deployed SHA remains
`43b2c2c288a2a37e0f4f293d3e4bfc107807e7b3`.

## M1-A accepted — verified October24

Verified deployed SHA `2246206cc8c82935de36007e603a20e512762d20`.
Exact [CI39985296668](https://github.com/tobisen/hollowbane/actions/runs/39985296668)
passed its required Full tier, verify aggregate, Pages deployment, hosted smoke
and final Release acceptance. Independently matched the public manifest and all31
sealed application files. Ten hosted cases passed17.5s: seven main-menu cases
plus cloister surface compatibility, controller atelier/engine navigation and
controller return from diagnostics. Desktop/small title screenshots reviewed.
This supersedes the earlier pending release checkpoints. No physical evidence.
M1-B implementation began only after this acceptance.

## M1-B foundation candidate — October24

Storage/domain foundation only, scoped DBL-210. See [storage contracts and evidence](storage.md).
Eight stable-ID slots, metadata-only registry listing, per-owner full snapshots,
revision-CAS writes, explicit activation/recovery and archived deletion are locally
verified. Explicit versioned migration retains original legacy current/previous/
quarantine and commits one copied slot/receipt atomically; schemas1–5 tested.
No live menu migration or creation/selection UI is introduced. The hashed
production storage entry ships the actual API for subsequent integration.

Sixteen focused unit and21 affected browser cases, TypeScript/relevant lint,
formatting and build pass. Full CI/Pages/independent hosted verification remain
pending for this candidate. Last verified deployed SHA remains `2246206`.
Stop after M1-B release verification; do not start M1-C or M2 in this continuation.

## M1-C continuation — October24

The new six-hour request authorizes sequential M1-C, M1-D, M2-A, M2-B, M2-C and
M3 through final player-experience review. This supersedes the earlier M1-B stop;
each deliverable still requires exact CI/Pages/hosted acceptance before the next.
Current M1-C candidate/contracts and retained evidence: [characters.md](characters.md).
Original requirement parents remain partial; no Act2. Settings integration is
M2-C, separate from awaited Save & Exit in M2-B. No final artwork is claimed yet.
