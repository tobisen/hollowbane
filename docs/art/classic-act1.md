# Classic Act 1 — integration checkpoint

2026-10-31 · DBL-035/375/379 · Deliverable B started; not a playable release

## Foundation gate passed

Verified deployed SHA: `954032834f88ea2cc02570851ecca3d56f30e391`.
[CI41228393310](https://github.com/tobisen/hollowbane/actions/runs/41228393310)
passed Full715 units/158 files, validators/tooling, all 332 Chromium cases, 15 compatibility
cases, verify, Pages, hosted smoke and final release acceptance. Chromium reports
have zero skipped/flaky/failed cases or errors. All 189 public files match the
downloaded sealed CI artifact byte for byte.

Four additional hosted native Metal Chromium checks pass (34.4s), zero skipped,
flaky, failed or errors: Classic movement/combat/navigation; exact existing save
and owner-route protection; virtual controller pause/focus/resize; default new
Warrior creation using original production assets. Combat/bell/edge and default
camp screenshots inspected. This is functional native browser evidence, not a
new performance profile or physical-controller acceptance.

Raw final evidence: `/private/tmp/hollowbane-classic-foundation-public-verification.json`,
`hollowbane-classic-foundation-hosted.json`, `hollowbane-classic-foundation-hosted/`
and `hollowbane-classic-foundation-results/`. Exact artifact:
`/private/tmp/hollowbane-classic-foundation-release/`.

## B0 bounded layout

`src/simulation/classic-act1-layout.ts` adapts the approved four-clearing geometry
to an `AreaLayout`, with the existing forest area seed and camp/graveyard exits.
It retains all five approved blockers and changes no artwork. The existing
campaign encounter/container planners supply five packs/15 enemies (including
ranged roles), six containers and unchanged identity namespaces/rules. The
waypoint remains the spawn. Candidate exit placement is authored and reproducible;
no global generator rewrite or gameplay implementation.

Five focused tests pass, including the existing pinned-map/save roundtrip tests.
Candidate coverage uses seeds 0/42/43/uint32-max: whole-floor connectivity and prop
clearance, paths with swept actor-radius checks to every clearing/exit/arrival/
enemy/container, interactable containers, and waypoint availability. Existing
`WorldTravel` prepares/commits camp → candidate forest → graveyard → candidate
forest → camp with correct arrivals and single-use handles. Legacy/generated
campaign maps and fingerprints remain unchanged. TypeScript/scoped lint pass.

The first camp trigger at (4,29) was individually walkable but its containing
navigation cell overlapped the western rock. The unchanged connectivity check
rejected it; moving only the trigger to (4,28) resolves the defect. No geometry,
actor radius, validator or assertion was weakened. An initial test also passed
clearing metadata to the point API; it now supplies plain coordinates and retains
exact endpoint equality. No browser/UI behavior changed in B0.

## Exact next work

1. Establish an isolated candidate layout/ownership policy in existing
   `WorldSession`, travel and exploration validation; default providers must stay
   pinned. Candidate snapshots must never enter normal `CharacterStorage` or be
   accepted by normal map-bound save validation. No save-schema change.
2. Wire a dedicated `?classicAct1=1` entry to `startCombatArena`, reusing the real
   campaign systems. Provide isolated save/reload and optional character copies
   without writing experimental map state to the source owner. Preserve menu,
   title, camp NPC/quest and next-area flows. B0 is **not** wired into runtime.
3. Apply Classic projection/environment/actor presentation only to the candidate
   forest; use cast-aware Warrior selection and existing effects, both enemy
   pilots with readable ranged attacks, and stable Sorcerer/Ranger legacy fallback.
4. Complete real combat/loot/quest/container/waypoint/save/cross-class browser
   journeys and screenshots, then required Release B CI/Pages/hosted/protection/
   integrity acceptance. Only then begin C visual/motion/native performance review.

No `classicAct1` route is published yet. Default campaign, save schema, mechanics,
balance, Phaser4.2.1 and all 17 unrelated local edits are preserved. B0 is a local
recoverable increment; publish only a coherent playable Release B candidate.
Asset growth is zero; approved payload stays 3,409,658 PNG/42,348,544 calculated
RGBA bytes (40.39MiB), nine textures, not measured GPU memory. Four-facing turns,
static idle, approximate corpses and historical shrine 50–66.6ms hitches remain.
No integrated performance or full human campaign-playthrough claim.
