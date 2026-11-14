# Diablo II visual forensics

2026-11-14 · DBL-035/375/379 · research only; no new visual approval

## Finding and evidence standard

The strongest supported explanation for the desired atmosphere is **a ground
surface, boundary vegetation and built structures composed as one place**, with
consistent scale, contact and material treatment. A sharp actor on a uniformly
textured empty clearing does not provide that experience. Dense independent tree
sprites do not provide it either. This is a visual interpretation, not a recovered
Blizzard design document. The Hollowbane comparison and experiment translate it
into falsifiable changes.

Labels throughout these documents:

- **Observed (O):** inspected image, browser state or named source code.
- **Inferred (I):** explanation consistent with evidence; not verified internals.
- **Estimated (E):** approximate image measurement or planning range.
- **Unknown (U):** unavailable evidence; no implementation constant implied.

High confidence means directly supported and repeatable; medium means limited
samples or interpretation; low means an unresolved hypothesis. These labels apply
to each claim, not an overall claim to have reverse engineered the game.

## Exact supplied video: partial access, and an important distinction

[Supplied reference](https://www.youtube.com/watch?v=IY7ktRwopPw).
Browser title: **Diablo II Resurrected - Gameplay Demo No Commentary [HD 1080P]**.
The initial web-tool request failed. The ordinary YouTube player was subsequently
accessible in Chromium. Its poster is not counted as footage. One actual decoded
frame at **00:15** was inspected: dark interior ground, a central actor, a confined
pool of visibility and a warmer torch at lower left. This demonstrates the
reference's local lighting hierarchy, not Act 1 outdoor composition. Media state
reported 640×360 despite the title's 1080P label. Do not measure high-frequency
texture quality from that scaled frame.

Seeks to **01:00, 02:00, 03:00, 04:00 and 05:00** each failed the decoded-frame
readiness check. A separate direct 03:00 request met a consent overlay and failed
its ordinary play-button click. No frames at those times are claimed. Continuous
walk/run/attack playback and audio synchronization were not verified. The page
initially showed 5:42 and later 5:41; neither is used as an exact duration claim.

This is a **Resurrected** reference. Its modern 3D image must not be presented as
proof that original Diablo II used the same lighting or art pipeline. The outdoor
assessment below uses separately identified **legacy** images. Matching the
supplied video's outdoor fidelity remains an explicit evidence gap.

## Sources and rights ledger

All sources accessed 2026-11-14. No proprietary imagery, video, game data, code or
extracted assets is added to the repository. Private inspection captures stay in
`/private/tmp/hollowbane-visual-forensics/`; their availability is temporary.

| ID  | Source and access                                                                                                                                                                                                                                                                                                                                                                                | What it supports / limitation                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | [Exact YouTube reference](https://www.youtube.com/watch?v=IY7ktRwopPw&t=15s), ordinary player, decoded 00:15 frame                                                                                                                                                                                                                                                                               | O: modern presentation, interior local illumination. Only that time inspected; no outdoor motion conclusions.                                                                                                                                                                                                            |
| R2  | [Tradia author's Act 1 quest guide](https://tradia.me/diablo2/quest/4703882), dated 2020-10-15; [inspected Blood Moor image](https://attach.tradia.me/diablo2/files/attach/images/4703880/882/703/004/4c7e957de72844b09161078f11bff728.png)                                                                                                                                                      | O: author-posted gameplay still, visible v1.14d label, legacy Windows-framed rendering. Primary visual evidence, not authority on engine internals.                                                                                                                                                                      |
| R3  | [Game Developer historical article image](https://eu-images.contentstack.com/v3/assets/blt740a130ae3c5d529/blt85d93bbb30c9f73f/650eaf58ce47f9c58a322bf2/Diablo-II.jpg/)                                                                                                                                                                                                                          | O: second legacy-style Blood Moor still, 575×431, rain, grass/soil, tree boundary and actor shadows. Capture configuration and exact version unknown; corroboration only.                                                                                                                                                |
| R4  | [Blizzard's remaster announcement](https://blizzard.gamespress.com/Blizzard-Entertainment-to-Resurrect-Diablo-II-in-2021-for-PC-and-Conso)                                                                                                                                                                                                                                                       | Primary written distinction: original sprite-based 2D versus remaster 3D physically based rendering, dynamic lighting and revamped animation/effects. Not an original-engine technical specification.                                                                                                                    |
| R5  | [Kevin Todisco, GDC 2022 session](https://gdcvault.com/play/1027672/Resurrecting-a-Classic-Bringing-Diablo); [developer slide URL](https://media.gdcvault.com/GDC%2B2022/Speaker%2BSlides/Resurrecting%2Ba%2BClassic_Todisco_Kevin.pdf)                                                                                                                                                          | Session overview accessible; PDF direct fetch denied (111-byte denial, not a PDF). Search-indexed developer text explicitly reports 160×80 floor tiles, fixed-camera advantages and lighting departures from strict physical realism. These limited excerpts are not a complete slide review; no slide numbers invented. |
| R6  | [OpenDiablo2 README](https://github.com/OpenDiablo2/OpenDiablo2), [license](https://raw.githubusercontent.com/OpenDiablo2/OpenDiablo2/master/LICENSE), [renderer](https://raw.githubusercontent.com/OpenDiablo2/OpenDiablo2/master/d2core/d2map/d2maprenderer/renderer.go), [tile record](https://raw.githubusercontent.com/OpenDiablo2/OpenDiablo2/master/d2common/d2fileformats/d2dt1/tile.go) | O: independently authored GPL-3.0 project; lower/floor/shadow, entity, upper-wall and roof passes, tile metadata and 25 subcell flags. Architectural corroboration only, not recovered Blizzard source or code proposed for reuse. README separates game assets and requires a purchased game. No assets accessed.       |

The official legacy screenshot endpoints and original/expansion manual PDF fetches
were also unavailable. Search result descriptions and image-search captions were
not treated as inspected images. No conclusions use Project Diablo 2 mod images.

## World construction: what is visible

### Ground, paths and repetition

**O, high, R2/R3:** the playable field is not a single grass color. Dark green
clumps interleave with exposed brown soil, subdued short grass, stones and worn
tracks. In R2 the path crosses diagonally through grass with broken, irregular
edges. It remains visible as a material change without a bright border. Small
exposed ground areas recur inside grass, while grass intrudes into the track.

**I, medium:** coherence comes from correlated variation at three scales: a large
field/path division, intermediate patches and localized small marks. Material
changes explain the texture: wear along travel, accumulated growth at edges,
heavier darkness under vegetation. Uniform random detail would not reproduce this.

**Technical support, medium, R5/R6:** developer-indexed text gives a 160×80 legacy
floor diamond; OpenDiablo2 separately supports floors, shadows and upper features.
Do not confuse a floor tile with a collision cell, whole clearing or bitmap
bounding box. The actual art-section dimensions, blend algorithm, variant counts,
placement probabilities and original map grammar are **U** here. We did not inspect
proprietary terrain files. Apparent seamless transitions do not prove alpha
blending or shaders; authored edge variants can produce that result.

### Vegetation and traversable boundaries

**O, high, R2:** a large leafless tree left of the path has a branching irregular
silhouette, visible trunk/root region and a crown that projects into adjacent
screen space. Low dark ground growth connects it to the field. **O, R3:** trees
form a dark edge at lower right while much of the field stays open. These two
images do not support a universal claim that Act 1 is densely forested.

**I, medium:** the useful principle is alternating readable openings and substantial
boundary masses. Large trees are not uniformly sprinkled across the walking
surface; neither are all tall forms excluded from the entire visible play area.
Foreground overlap supplies enclosure and scale. Exact fade/roof-cutaway behavior
is **U** without motion; a still cannot establish whether an actor triggers
transparency. Avoid copying a guessed legacy occlusion rule.

### Space, architecture and rhythm

**O, R2:** track, tree, corpses and small stone/wood marks give a route several
local reference points. The visible automap overlay is not architecture and is
excluded from geometric measurements. **O, R3:** a pool/stone boundary at left and
a tree edge at right structure an otherwise broad field. Neither image establishes
whole-level clearing size or encounter spacing. No mean path width or universal
clearing radius can responsibly be reported from this sample.

**I, medium:** the atmosphere depends on interruption: open ground, an edge or
object, another opening, then a landmark. Architecture should contribute a
footprint, material transition and rooted shadow, rather than exist only as an
isolated icon. Detailed ruin/building perspective and roof behavior are **U** from
these inspected outdoor samples; validating architecture requires another image
before production. One original broken wall is included in the proposed experiment
to test integration, not to reconstruct a particular Diablo structure.

## Measurements and projection

Measurements below use R2's 600×469 image, including its Windows border; coordinates
are approximate manual readings with about ±5px uncertainty. Playfield is roughly
590px wide and 370px high above the lower interface. Normalize by **visible actor
body height H**, excluding cursor, shadow, weapon extension and HUD. Clothing and
pose make H uncertain; do not infer human meters from pixels.

| Quantity                | Observation / estimate                                                                         | Interpretation                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Actor body H            | E: about 40–45px, roughly 11–12% of playfield height                                           | A scale reference; not a universal character size.                                    |
| Left bare tree          | E: about 190–210px high, approximately 4–5H                                                    | A genuinely larger vertical form near playable space.                                 |
| Track near actor        | E: about 70–100px across, roughly 1.6–2.5H; perspective and irregular edges limit precision    | Traversable-looking wear is more localized than the whole field. Not collision width. |
| Terrain pixel frequency | O: both intermediate grass patches and smaller edge fragments are legible at native still size | No numerical spatial-frequency statistic was calculated.                              |
| Legacy floor aspect     | Reported by developer-indexed R5: 160:80 = 2:1                                                 | Half-axis screen slope ±0.5. Constant screen scale supports an axonometric reading.   |

For an equal-scale orthographic ground rotated 45°, the floor ratio corresponds
to `sin(elevation) = 0.5`, or 30°. This is a geometric **inference** under those
assumptions, not proof of every original asset's source camera. Do not confuse
this elevation with the visible axis slope `atan(0.5) = 26.565°`. Modern camera
reconstruction may introduce scale conversions; copying one angle alone will not
match scale, framing or actor proportions.

**O/I:** constant-looking scale and parallel ground axes make a fixed axonometric
presentation the appropriate baseline. Full camera follow lag, look-ahead,
subpixel sampling and visible world-unit extent are **U** in the inspected stills.
The supplied interior's character is near the central viewing area, but one frame
cannot establish a follow algorithm. Anchor sprites at their ground contact and
sort overlapping volumes consistently: that is a general requirement supported
by the visible overlaps, not a recovered implementation constant.

## Why the materials read as one world

**O, R2/R3:** vegetation is dark olive/green, soil brown/gray, rocks gray-brown;
bright pixels occupy small areas. Grass is broken into clumps and exposed dirt,
while the tree has branching forms. Those are different material structures,
not merely differently colored copies of one texture. R3's cast shadows give the
actors direction and contact. R1's torch introduces a localized warm emphasis in
an otherwise dark interior. No outdoor lighting falloff is inferred from R1.

**I, medium:** shared exposure and restrained highlight area let a small actor
remain readable without flattening the world. Large dark forms support smaller
material marks; sharpness is distributed across ground and props rather than
concentrated entirely in the actor. Dirt near roots and irregular ground edges
connect sprites visually. Strong atmosphere does not require atmospheric fog in
every frame: outdoor depth haze, exact palette constraints, color-management
settings and original light-transport implementation remain **U**.

The transferable direction is to author **relationships**: where grass stops,
how stone meets earth, which surfaces catch the key light, where shadows collect,
and how often a distinctive silhouette repeats. Increasing noise, saturation or
object count without those relationships has no supporting evidence here.

## Movement and combat: bounded conclusions

The inspected stills show distinguishable actor silhouettes and ground shadows.
They do not establish walk/run velocity, acceleration, stopping time, directional
coverage, cycle length, foot locking or attack timing. Those fields are **U** for
the reference, not remembered constants. R4 documents revamped remaster animation;
therefore legacy and remaster animation cannot silently share measurements.

The most consequential **hypotheses** to test later are orientation continuity,
foot/body contact during translation, and a stable silhouette when a windup
becomes a strike. For combat, compare an anticipation pose, the hit moment, victim
response and recovery in the same recording. Exact durations and sound/visual
alignment need accessible playback with a timestamped event sample. No combat
balancing, new effects or animation-production plan follows from this research.

See [actual Hollowbane gaps](hollowbane-visual-gap.md),
[technical options](visual-foundation-options.md) and the
[unimplemented decisive experiment](visual-experiment-spec.md).
