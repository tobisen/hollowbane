# M2-A player pause — DBL-004

Authorized after accepted M1-D `92df8c5200b1dec0404870533097a070cc4a04c8` /
[CI40106915374](https://github.com/tobisen/hollowbane/actions/runs/40106915374):
required Full/Pages/hosted acceptance, all41 public bytes and six hosted visual/input
cases15.0s passed; screenshots reviewed. No M2 work began before this acceptance.

`PlayerMenu` exists only for UUID character sessions, including inventory-only
legacy characters. Escape (outside existing dialogs/fullscreen), Pause Game and
the existing semantic Menu/Options/P/M/F2 route open one native dialog. Settings
reuses the current controller form in the same dialog; cancel returns to Pause
before resuming. Native keyboard/Tab/arrows/Enter and the existing semantic
controller navigator retain visible focus. Prompts reuse remapped device-aware
menu text. Other active dialogs/inventory/recovery keep ownership of their input;
Menu never closes them to open another screen. Developer routes retain the old
controller menu and pause behavior. Native fullscreen/context code is unchanged.

The scene owns the existing `paused` flag. Opening/resuming clears input intents,
queued movement/repetition, pending input casts and the frame accumulator through
the existing stop path. Already committed combat/cast phases, cooldowns, resources,
projectiles and statuses are retained; simulation ticks/AI/damage/timers do not
advance behind the menu. UI rendering/navigation remains live. Resume restores
world focus and requires neutral controller rearming. No simulation/save format,
balance, world, loot, item or Phaser4.2.1 change. Scene shutdown releases player-menu
listeners/DOM through its abort controller; existing page lifecycle remains intact.

Save & Exit is an explicitly disabled temporary action for M2-B. No unawaited
return-to-menu path is exposed for live progress. Existing controller settings are
available now; broader settings/audio/graphics integration remains M2-C. Original
CSS uses the released stone/bronze palette, accessible text and native controls;
no new asset/font/audio or dedicated gameplay animation is claimed.

## Focused verification

Fourteen existing combat timing/targeting domain cases pass, covering committed
phases, release, queued intent, movement cancellation and deterministic replay.
Two new browser contracts pass: actual live combat with an earned-point constructed
level24 fixture commits the existing self-targeted Oath Echo via keyboard; a bounded
render-frame observer clicks the ordinary Pause button at the real cast boundary.
Across12 render frames, all actor HP/positions/phases, tick, skill users/resources,
cooldowns, statuses, projectiles and events remain identical. Escape/keyboard focus
stay responsive; resume advances ticks without a new repeated attack. The other
case covers virtual Menu→Settings→back→resume, inventory priority, keyboard/gamepad
switching and no held movement after pause/resume in Ashen Refuge.

Two existing browser cases also pass unchanged: developer controller-menu/settings
navigation and native fullscreen Escape. Total4 browser cases13.3s,14 domain units,
TypeScript/build, affected ESLint/Prettier pass. Paused-combat screenshot reviewed.
No full local/campaign replay or physical-controller claim.

Initial new driver attempts failed before pause: a static pointer missed a moving
AI target, then a selected offensive cone was legitimately rejected out of range.
No production rule/assertion was weakened. The final fixture allocates an existing
self-targeted defensive node from its earned level24 point budget, avoiding unrelated
enemy acquisition. Original traces/screenshots retained under
`/private/tmp/hollowbane-menu-work/m2-a-*`. These are constructed fixture results,
not a genuine player campaign completion or balance evaluation.

Exact required CI/Pages/sealed-hosted bytes and hosted pause/input verification
must pass before M2-B. Preserve all unrelated local documentation edits, original
requirement dependencies and broader partial parents. Continue only through the
user-authorized M2-B/M2-C/M3 sequence; no Act2.
