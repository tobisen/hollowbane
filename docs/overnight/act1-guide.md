# Act 1 play and save guide

Open [Hollowbane Act 1](https://tobisen.github.io/hollowbane/?world=1). The character inspection/recovery screen settles before world interaction becomes available. Existing character data is retained; developer trials and seeded tests are separate contexts. Export a character from Inventory before experimenting with imports or recovery.

## Expedition

In Ashen Refuge, approach Edda Vey and interact to accept Act 1 tasks. Follow the journal through Haunted Forest, Forgotten Graveyard and Ancient Crypt. Report completed tasks at camp. The crypt beacon and its earlier quest must be reported before accepting **A Lantern Unbound**; this unlocks Sevra, the Vaultbound. Defeat Sevra, return safely, and claim Edda's final reward to persist Act 1 completion. A boss kill alone does not claim the campaign reward. Warnings show where and when an attack will land; during **Resisting interruption**, move out of danger instead of relying on another stagger.

Attune the ◈ waypoint near each area's arrival point before using it. N opens destinations. Only attuned, visited endpoints are selectable; departure requires a living idle character near the anchor and clear of nearby enemies, projectiles and pending spells. Ordinary exits still provide forward and return routes. Camp arrival is not automatically within an NPC's talking range: approach the named NPC.

Orren's merchant has finite stock and buys identified backpack items for less than their purchase cost. His camp stash is a grid for this character only. Inspect, confirm or cancel before transferring; embedded components stay with their host. Unequip gear before storing or selling. Backpack/stash transfers, purchases and sales preserve original item identities and are saved atomically through the existing character checkpoint.

## Controls

Click ground to move; hold the left mouse button on a hostile for ordinary repeated attacks. WASD moves while gameplay has focus; R toggles walking/running. Select learned skills on the bar and follow its displayed attack controls. X/Q/1–4 activate assigned slots. Spend earned attribute/skill points through Inventory; committing a class preserves that class identity.

E interacts nearby; J opens the quest journal, V inventory, N waypoints and Tab the map. P or F2 opens the controller/pause menu. Escape cancels or closes the current selection, then returns focus to gameplay. Modified browser/editor shortcuts do not activate gameplay actions.

Supported standard-compatible controllers use left stick movement, right stick facing/aim and L3 gait, with Menu/Options for pause and context-dependent map, interaction and skill actions. Follow the current device prompts and configured bindings. Menus support D-pad/stick navigation, confirm and back. Existing calibration, selection and unknown-layout recovery remain in Controller settings. Virtual tests do not establish physical-device layout or vibration behavior.

## Persistence and limits

Watch the actual save status. A successful world/item transaction can precede asynchronous disk persistence; **Character checkpoint saved locally** confirms storage completed. Inventory provides Save now, export/import and validated previous-snapshot recovery. Current/previous IndexedDB compare-and-swap protection rejects stale writes rather than silently overwriting another tab. Back up through the supported export path; do not clear browser storage to repair a character.

Defeated identities, quest claims, generated layouts/discovery, item ownership, merchant stock, stash and attuned endpoints persist. Living encounters restart on load; health/mana and temporary effects follow the existing runtime restart policy, not a saved continuous-combat timeline. For the earned acceptance build, a live restored actor starts at300 current/360 derived maximum HP; domain duel fixtures explicitly start at their derived maximum. These are different evidence scopes.

Historical two-area world versions retain their original availability and do not silently regenerate into four-area campaigns. Legacy items and validated saves remain supported. Four-area release acceptance uses world content2/seed42 and distinct preserved character checkpoints.

This is the scoped technical Act 1 release. Dedicated character/monster/boss animation and environmental audio/art follow-ups, physical controllers, reference hardware/native GPU performance and broader original roadmap parents remain open. Browser/software tests and code-drawn effects do not close those follow-ups. No Act II or additional campaign is implemented.
