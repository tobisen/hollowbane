# M1-B character storage foundation — DBL-210

Authorized October24 after exact M1-A acceptance. Storage/domain scope only;
stop after M1-B release verification. No character creation/selection UI, art,
pause, Save & Exit, fullscreen or context-menu implementation changes.
Broader DBL-210 remains partial.

## Contracts

`src/simulation/character-registry.ts` contains pure validation, identity,
metadata and inspection contracts. It has no DOM, Phaser, clocks or randomness.
The browser adapter `src/rendering/character-storage.ts` supplies IndexedDB,
`crypto.randomUUID()` and timestamps. IDs are UUIDv4 strings; names are trimmed
1–32 Unicode characters without control/format characters. Names never become
storage keys; duplicate names are allowed. An uncommitted historical class is
explicitly null rather than an invented Warrior.

Database `hollowbane-characters-v1`, IndexedDB version1:

| Store      | Records                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------- |
| registry   | `current`: registry version1, revision, last-played ID, at most8 metadata entries        |
| characters | character ID → owner ID, snapshot revision, complete character snapshot text             |
| previous   | character ID → previous complete snapshot                                                |
| archives   | identity reservations, deleted/recovery records and legacy migration receipt/raw archive |

Metadata contains ID, name, class, level, snapshot revision, created/updated and
nullable last-played timestamps. `list()` reads only the registry; it never
loads all large saves. The registry is initialized in the database creation
transaction. Missing/future/malformed registries fail closed; orphaned snapshots
are retained instead of being treated as an empty game.

Creation, update, deletion, recovery and activation each use one read/write
transaction. Both snapshot and registry changes commit together. Snapshot
revisions reject stale writers; simultaneous updates to the same character
admit one commit. Different-character updates merge into the current registry
inside serialized IndexedDB transactions. Failed requests, quota errors or
aborts cannot report successful persistence or leave partial metadata/items.
No transaction callback awaits external promises.

Every operation names its owner ID. There is no mutable global active-character
record or shared stash. Each complete snapshot retains inventory/equipment,
embedded items/modifiers, gold, character-local stash, XP/attributes/skills/bar,
quests, waypoints/discoveries, campaign/world position/seeds/layout versions and
loot/container state. Existing item IDs are unchanged. Ownership is scoped by
character ID plus item ID; deterministic IDs from independent worlds are not
rewritten or transferred across characters. Existing snapshot validation rejects
duplicated ownership inside a character before any update transaction.

## API and recovery

- `create(name, session)`, `load(id)`, `update(id, expectedRevision, session)` and
  `delete(id, expectedRevision)` provide explicit per-owner operations.
- `activate(id, expectedRevision)` validates the complete current save and
  atomically records last played. Future gameplay callers must invoke activation
  only after accepting/preparing the selected session. Loading/listing/creation
  alone do not claim that gameplay started.
- `recent()` follows the committed last-played ID in one read transaction. An
  invalid current offers its own valid backup or an invalid state, never another
  character. No played character returns null; deleting the last-played character
  clears selection and requires an explicit choice.
- `recover(id, expectedRevision)` explicitly restores that character's validated
  backup, preserving damaged current, previous and metadata in an archive.
- Deletion archives that character's complete records and metadata. Permanent
  identity reservations prevent accidental ID reuse. Other characters and global
  application settings are unaffected.
- `archive(key)` exports retained recovery/deletion/migration material. Archive
  retention is intentional; storage exhaustion rejects writes rather than
  silently evicting historical evidence. No automatic archival deletion exists.

Timestamps remain monotonic against already stored metadata if the browser clock
moves backward. Character revisions and registry revisions are distinct;
activation changes selection metadata without invalidating a current snapshot
solely because its timestamp changed.

## Explicit legacy migration

`migrateLegacy(name?)` reads existing `hollowbane-character-v1` current, previous
and quarantine through the existing InventoryStorage infrastructure. It validates
the current with the existing character deserializer, then copies its exact text
under a reserved stable character ID. The snapshot, metadata, original raw
archive and version1 migration receipt commit in one destination transaction.
The original database/records are never deleted, replaced or marked writable by
migration. Schema5 payloads remain schema5; no item/progression format change.
Historical schemas1–5 supported by the existing deserializer are validated;
unsupported future/other formats are rejected, including L1 item archives.

Concurrent/repeated migrations consult the receipt, creating exactly one slot.
Retrying after edits to the migrated character does not overwrite it. Retrying
after explicit deletion does not resurrect it. A changed legacy current revision
or text rejects automatic reconciliation and retains both histories. A corrupt
current is not replaced with its backup automatically; recover it explicitly
through the existing legacy recovery flow before migration. Missing/corrupt
receipts or missing migrated targets are not silently rebuilt.

Source and destination are separate databases; this is an atomic destination
copy with source retention, not a cross-database transaction. Integration must
first unload legacy gameplay writers. If a legacy writer advances after the
read boundary, its original remains intact and a later migration retry detects
the changed source. This foundation does not automatically migrate or switch
the live M1-A menu: that UI/session handoff remains M1-C scope.

## Shipping and verification

Vite emits an explicit hashed `character-storage` production entry with preserved
exports. This ships the foundation without adding a UI route, global singleton,
automatic storage writes or premature menu integration. Future UI modules may
import the same source API. Browser tests discover and import the actual
production entry; hosted tests discover it from the sealed release manifest.
No source bundle is injected into hosted browsers.

Local evidence:16 focused registry/serialization unit cases, strict TypeScript,
relevant ESLint/Prettier and production build;21 affected Chromium cases include
12 new storage cases,2 existing IndexedDB/recovery cases and7 existing menu cases.
Tests cover eight slots/ninth rejection, metadata-only reads, all three classes,
detached loads, exact complete save equality, switching/reload, global settings,
same/different-owner contention, deletion/no ID reuse, corrupt recent selection,
explicit recovery/quarantine, duplicate item rejection, simulated quota rollback,
missing registry, schemas1–5 concurrent/idempotent migration, original archive
preservation, changed sources and unsupported formats. Existing developer
inventory save operations leave the new character registry untouched.

Quota failures are deliberately injected DOMExceptions, not physical disk-full
measurements. Initial new-test failures were a schema2 fixture declaring the
wrong historical content registry, and expecting a checksum error from plain
invalid JSON; corrected the fixtures/error expectation without changing existing
assertions or production legacy validation. No campaign playthrough, loot
distribution rerun, physical-controller or reference-hardware claim.

Full is required by the unchanged classifier for save/public contracts and the
production entry configuration. CI/Pages and independent hosted save verification
must pass before M1-B is considered released. No M1-C work is authorized in this
continuation.
