# M2-C shared player settings — DBL-208/004

M2-B `eca7b7d7eb7fff527dedafefd96949de996def5e` /
[Full CI40113225405](https://github.com/tobisen/hollowbane/actions/runs/40113225405)
attempt2, exact Pages/release acceptance, all41 independently matched public files
and five hosted exit/legacy/pause cases42.5s passed before this implementation.
The first attempt's unchanged D07b navigation failure remains in [exit.md](exit.md).

Main-menu and player-pause Settings share one adapter. Graphics Automatic/Balanced/
Full reuse the current bounded `renderSize` and camera/resize paths; Automatic
retains software-renderer detection and runtime fallback. Full respects an explicit
choice. Changes apply while simulation stays paused; no scene reload or save is
required. CombatAudio retains original recipes/voice budget/user-gesture activation
and adds bounded gain scaling plus zero-volume silence. Volume/mute and graphics
are stored in browser-global `hollowbane.presentation.v1`, never a character save.
The existing quick sound button writes the same preference. Blocked storage reports
page-only application honestly; keyboard settings keep prior bindings on failure.

Six movement/run/stop key selectors reuse the existing movement preference schema,
validation and storage. Normal character gameplay consumes physical codes/normalized
movement and the existing gait/stop commands. Arrow aliases remain available;
reserved skill, inventory, interact, quest, waypoint and menu shortcuts/conflicts
are rejected. Keyboard changes clear held input, apply live and retain existing
movement-speed tuning; player movement balance/saved progression are unchanged.
Developer routes retain their prior keyboard/audio/graphics behavior. Existing
controller device/layout, buttons, stick sensitivity/deadzones/curve/axes/vibration
form and persistence are embedded unchanged. Virtual tests are not physical evidence.

Pause Settings invokes only the accepted `#game-fullscreen` public click control,
observes its capability/pending/label state and preserves the pause/modal. The
main menu explains that fullscreen is available during gameplay. Existing fullscreen
and right-click implementations are unchanged. There is no music backend or track
in this build: the interface says so and exposes no ineffective music-volume
control. Broader DBL-208 music/master mixer/camera options remain partial.
No new art/audio assets, external services, simulation/save schema or Phaser changes.
Busy Save & Exit now shows “Saving… Please wait.” instead of idle cancel hints.

## Verification and release

Seventeen focused presentation/input/controller/audio/render-size unit cases pass,
including malformed preferences, reserved/duplicate keys and actual gain scaling/
zero-volume silence. Two new production-build browser cases verify saved settings
across root/gameplay/root, full/balanced canvas resolution, runtime volume/mute,
real remapped movement/stop/arrow fallback, unchanged owner snapshots during settings,
blocked-preference-storage page application, existing controller settings, native
fullscreen enter/exit while paused, virtual PS navigation and narrow layout.
Seven existing affected cases pass38.8s: both pause and both exit contracts, responsive
360/2560 menus, controller mapping/conflicts and native fullscreen Escape. Nine unique
local cases; no broad local campaign replay. TypeScript/affected ESLint/Prettier/build
pass; final settings/keyboard/busy-state screenshots reviewed before publication.

The first new browser attempt used an ambiguous canvas selector (game plus minimap).
Retained trace/screenshot under `/private/tmp/hollowbane-menu-work/m2-c-initial-selector-failure`;
corrected the selector to the actual game canvas without changing assertions or
deadlines. A settled real checkpoint precedes no-save-contamination comparisons.

Classifier requires Full for shared scene/controller/public contracts. Commit/push,
exact required CI/Pages, sealed hosted byte verification and focused hosted settings/
pause/exit/fullscreen smoke must pass before M3. Then complete final new/returning/
multiple-character/legacy/developer Full experience review and stop at its quality
gate. No Act2; preserve unrelated local documentation and original partial parents.
