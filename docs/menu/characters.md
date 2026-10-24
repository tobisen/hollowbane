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

Normal play uses `?world=1&character=UUID`. `CharacterCheckpoint` permanently binds
one owner, adapting the existing load/save/recovery interface to M1-B operations.
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
