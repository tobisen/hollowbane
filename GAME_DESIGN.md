# Game design — foundation specification

## Pillars (DBL-001)

Responsive traversal: acknowledge a valid click in the next presented frame; movement is collision-aware and targetable. Deliberate action rhythm: windup, active strike and recovery are distinct simulation states. Loot creates tactical build choices, not only larger numbers. Progression grants observable choices in a ten-minute session. Dark atmosphere must retain silhouettes and readable hazards. Risk earns rewards through positioning, resource use and return-to-town decisions.

## Mechanics contract (DBL-002)

Attack/cast speed modifies integer tick timelines with published breakpoints; recovery cancels only at documented windows. Block consumes a defined reaction window; recovery has anti-stunlock protection. Resistances use explicit caps and typed damage ordering. Life reaching zero enters death exactly once; mana cannot become negative. Potion belt uses explicit quickslots and queued intents, with cooldown policy determined before combat implementation. Stamina is optional and cannot strand a character. Death penalties never destroy a valid save. Town portals retain safe return anchors; waypoints unlock explicitly. These are design requirements, not implemented mechanics. Initial numerical values require combat prototypes and approval.

## Reference encounters (DBL-003)

Melee: an Ashwarden faces six grave scavengers beside a narrow wall. Clicking an obscured foe should path to reachable range; switching targets during recovery follows the documented cancel rule. Slow and fast weapons produce distinguishable active/recovery timing. Repeated incoming hits cannot permanently lock the player. A belt potion provides visible feedback and deterministic resource changes. Victory drops one inspectable reward.

Caster: a Cinderweaver faces a marked elite and four flankers. Aimed projectiles respect walls; resource cost is committed at the defined cast frame, interruption follows one rule, resistance cues precede wasted attacks. A resistant elite allows alternate damage or retreat; no mandatory single build. Dangerous modifiers have readable shapes as well as colors.

## Camera and controls (DBL-004)

2:1 diamond projection, world-space collision independent of visible tile. Desktop left click moves/interacts/attacks according to hovered target; right click uses secondary skill; Shift requests stationary action; number keys address belt; remappable bindings and optional WASD planned. Avoid browser context-menu conflicts only inside game. Camera follows player with bounded zoom; reduced motion disables shake and decorative motion. Keyboard access, scalable text and redundant rarity cues are required. Current observatory has only engine links and pause control.

## Ten-minute fun test (DBL-005)

Record five consenting playtest sessions, inputs and seed. Measure click-to-visible feedback (target <=50 ms p95 on reference hardware), unintended target rate (<5%), ability to distinguish two weapon rhythms (4/5 testers), recognition of elite hazard (4/5), at least one meaningful gear/build choice and no forced recovery loop. Record subjective loot excitement (1–5) alongside observed decisions. Failures create issues; metrics do not replace G2 approval. Not executable until combat exists.
