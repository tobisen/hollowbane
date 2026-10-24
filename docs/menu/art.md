# M1-D original artwork and menu presentation

Authorized after exact M1-C `9e928a74ae34dcb0d628cc2b49990d32d8e4f699` acceptance:
[CI40103889624](https://github.com/tobisen/hollowbane/actions/runs/40103889624)
required Full/Pages/hosted acceptance passed; independently matched34 hosted files
and21 hosted menu/session cases88.1s.215 Chromium and15 required compatibility
cases passed with zero skipped/flaky results. Full unit/tooling suite passed.
M1-C storage contracts remain [characters.md](characters.md).

Four new original built-in imagegen sources and seven WebP exports replace the
temporary menu background and named-class emblems. The class portraits share
framing, lighting, sanctuary background and rendering style, with distinct armor,
robe and hood/bow silhouettes. All generated outputs were visually reviewed;
full prompts, actual native resolutions, processing and provenance are in
[art/menu.md](../art/menu.md). Only original project art was supplied as a reference.
All project-referenced images are copied into the repository; generation outputs
are not left as external runtime dependencies. Four source PNGs add about9.9MB to
the repository, not to the browser download. No new service/dependency/font.

The scene provides negative space for readable accessible title/navigation text.
Original CSS ornamentation, bronze borders, hover/pressed/focus states, dark dialog
panels and a150ms opening transition retain native semantics. Reduced-motion
preferences disable transition/animation. Full portraits load only on class
preview; selection thumbnails are lazy. Entire new runtime set379234bytes (~370KiB),
with explicit512KiB/11MiB file/nominal-decoded caps. No FPS/GPU performance claim.
All prior G1/W3 asset checks/fingerprints remain intact; menu-specific formats,
dimensions, budgets, complete registry/audit coverage and fingerprints are checked.

Class metadata, naming, creation/confirmation, deletion, migration, route ownership,
Continue, save formats, balance and input semantics are unchanged. Artwork is
illustrative; creation explicitly says the starting inventory is empty. Unknown
legacy class identity retains a neutral symbol, and gameplay sprites/art follow-ups
remain open. No pause, Save & Exit, settings expansion, fullscreen or right-click
implementation work belongs to M1-D.

## Verification and release gate

Six focused Chromium cases cover title/keyboard/settings, virtual Xbox/PlayStation
class naming/cancel,360/760/2560-width selection/creation and all three decoded class
portraits. Root requests only the new background; full class images load on demand.
Maximum-length names wrap in narrow confirmation dialogs. Screenshots capture
settled transitions using Playwright's finite-animation completion, rather than
artificial delays. Initial review caught partially faded screenshots and a crowded
800px-high form; captures now settle and portrait height was reduced to leave room
for the form actions. No assertion, image tolerance or timeout was weakened.

Strict TypeScript/build, affected ESLint/Prettier and complete asset validation
pass. No simulation change requires repeated domain units locally. Exact CI tier,
Pages, all hosted bytes and relevant hosted presentation checks are still required
before M2-A. Original source requirements/dependencies and broader partial parents
remain unchanged; user authorizes sequential continuation through M3 only.
