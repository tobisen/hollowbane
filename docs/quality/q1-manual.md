# Q1 local manual finale playtest

Q1 is incomplete. These are the actual earned characters from local evidence
`14d5b95`, not the constructed functional fixtures. Nobody has completed Act 1
with these characters. No new human gameplay observation is claimed here.

## Open a character

From the repository root, run one command in a terminal:

```sh
Q1_CLASS=sorcerer npx playwright test --config playwright.manual.config.ts
```

Replace `sorcerer` with `warrior` or `ranger`. Start with Sorcerer. Dependencies
and Playwright Chromium must already be installed. The launcher starts/reuses
Vite at **http://127.0.0.1:4174/hollowbane/** and opens a visible Chromium window.
Close its inventory when ready to play. Close the browser to finish the session.
This command waits for the browser; it does not run a tactical player.

The three private profiles have been prepared locally under
`.local/q1-manual/CLASS/`. Reopening a profile resumes its current saved progress;
it **does not reimport or reset** the original character. Use one window per
class to avoid stale-save conflicts. Each class has independent browser storage.

On first use of a new profile, the launcher checks the recorded SHA256, validates
`/private/tmp/hollowbane-q1-sevra/CLASS-continuation.save`, and uses the game's
existing **Inventory → Import character snapshot** file input. It verifies saved
progression, equipment, quests, gold/stash/waypoints, position, seeds, layout
fingerprints, deaths and item ownership. No XP, gold, rank or item is granted.
Input saves are only read. Current HP/mana restart at300/350 and100 under the
existing policy; they are not continuous-combat snapshots.

If profiles or saves are unavailable, the launcher stops. `Q1_SAVE_DIR` may point
to a private directory containing byte-identical backups. To start a separate
manual branch, set `Q1_PROFILE_DIR` to a **new** private directory. An unmarked
existing profile is retained and rejected rather than overwritten. Do not clear
storage or alter checksums to bypass an error.

No saves are copied into `public/`, `dist/`, source fixtures or Git. Profiles,
exports and diagnostics remain local/ignored; nothing is deployed to Pages.
The normal permanent-save namespace is untouched: this uses the existing isolated
world-test seed42/camp storage namespace on a loopback origin.

## Starting state and remaining steps

| Class    | Level / XP | Gold | Remaining campaign work                                          |
| -------- | ---------- | ---- | ---------------------------------------------------------------- |
| Sorcerer | 3 /1115    | 310  | Light Below claimed; finale active; reach and defeat Sevra       |
| Warrior  | 3 /620     | 130  | Kills/treasure complete; beacon, return/claim, finale acceptance |
| Ranger   | 3 /635     | 132  | Kills/treasure complete; beacon, return/claim, finale acceptance |

All retain Iron Cap, Warded Bark Guard, original reward boots and their learned
primary rank. Warrior/Ranger also equip earned Ash Blade; Ranger carries the
cache Copper Band. Sorcerer's earlier unpicked blade remains in the crypt.
One earned skill point remains available; spend resources only through normal UI.

Warrior/Ranger: track **The Light Below** in J, follow the beacon marker on the
map, clear actual threats and press E near the beacon. Attune the crypt waypoint
near its ◈ anchor once departure is quiet, then use N to return to Ashen Refuge.
Ordinary crypt → graveyard → forest → camp exits also work. Approach Edda, press E,
open her journal and claim The Light Below. Accept **A Lantern Unbound** in camp
before returning to the crypt. Existing kills/chests need not be repeated.

Sorcerer already has A Lantern Unbound active and the crypt waypoint attuned.
Use the map to reach Sevra. A living nearby encounter can be **deferred after
reload** by the existing nine-unit safety radius. Move away normally until it
reactivates, then return; absence is not a saved kill. Do not change AI controls.

Sevra has840HP/two phases. Read the projected warnings: Seal rake → step behind;
Cold edict → step sideways; phase-two Vault toll → leave the ring;
Severing ray → cross the line. Clear pack pressure and respect action recovery.
After genuine death, collect eligible drops, return to Edda and claim the finale
once. Verify “Act 1 complete”, collect the real reward, save/export and reload.
Record HP/mana before reload separately from restart resources.

## Controls

- Click ground or WASD to move; R toggles run. Space stops queued movement/attacks.
- Click/hold left mouse on a hostile for basic attacks. Select a learned skill;
  right-click casts it. X activates assigned slot1; Q/1–4 the other slots.
  Release held basic attack and wait for idle/recovery before requesting a cast.
- E interacts, J journal, V inventory, N waypoints, Tab map, P/F2 pause/menu.
  Escape closes/cancels a dialog. Click the game to restore gameplay focus.
- Standard controller: left stick moves, right stick aims, L3 changes gait;
  follow displayed prompts for skills/interactions and Menu/Options. Menus use
  D-pad, confirm and back. Release controls after a modal to rearm. Physical
  controller/layout/vibration verification remains open.

## Save and capture a blocker

Scroll to the inventory footer for the save/import/export controls.
Use **Inventory → Save now** and wait for **Character checkpoint saved locally**.
Use **Export snapshot** after each important encounter. The launcher retains
exports in unique `export-*` directories inside that class's private profile.
Wait for an export to finish before closing the browser. Original Q1 files stay
untouched; the manual profile contains a separate advancing branch.

With a suspected blocker, pause safely, save/export if possible, then press Enter
in the launcher terminal. This reads state and writes `diagnostics.json`,
`latest-screen.png` and `latest-checkpoint.json` in the profile directory.
The latter is the last **persisted** checkpoint, not an invented live-state save.
Capture before closing; browser closure prevents further readout. Repeated
captures replace these diagnostic files, so copy the folder to retain an incident.

Record class, action/expected result, area/seed/position, remaining HP/mana,
selected target, cooldowns, quest/waypoint condition and browser errors. Keep
legitimate death, balance concerns and a reproducible software defect separate.
Do not reload repeatedly to claim uninterrupted survival, alter saves or disable
AI. Two Sorcerer deaths, Warrior beacon-route deaths and Ranger driver
navigation/selector failures remain the Q1 observations, not proof of boss balance.

Stop after the finale evaluation/report. Q2, Q3 and Act 2 remain excluded.
