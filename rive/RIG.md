# Meera rig spec

This is the brief for building `rive/meera.riv`. It follows "Character and rig" in PRD.md: Claude Code generates the rig as RML from these parts, the Rive CLI compiles it, and every state is rendered to one contact sheet for review.

The approved design is "Meera · Concept v1" in Paper (file "JobBuddy screens", page "v2 key flows · Plum"). Paper stays read only.

## Files

| File | What it is |
| --- | --- |
| `parts/meera-parts.svg` | Every part as a named layer, in the neutral pose. All mouths are present; only `mouth_neutral` is visible. Pivots are in `data-pivot` |
| `expressions.json` | The value of every control for each expression, the brow shapes, and the blink |
| `reference/expressions.png` | What each expression and viseme must look like. The Rive contact sheet should match it |
| `reference/neutral.png` | The full neutral pose at 400 × 440 |
| `source/` | The scripts that made the parts and the reference (`node source/build.js`). Change the design there, never by hand in the SVG |

## Artboard

400 × 440, origin top left. The halo is part of the file, so she reads on the plum call screen. Keep it as its own layer so the app can hide it later.

## Layers and pivots

Draw order is bottom to top, as in the SVG.

| Group | Pivot | Moves by |
| --- | --- | --- |
| `halo` | | Static |
| `body` (neck, shirt, blazer, collars, lapels) | 200 440 | Breathing, sitUp |
| `head` | 200 300 | Tilt, nod, leanIn, breathing |
| `bun`, `hair_back`, ears, earrings, `face`, `hair_front`, shines | | Ride on `head` |
| `blush_L`, `blush_R` | | Opacity |
| `brow_L`, `brow_R` | 162 160, 238 160 | Translate Y, rotate, shape blend (arch) |
| `eye_L`, `eye_R` | 165 198, 235 198 | Contain everything below |
| `eye_open_*`, `eye_happy_*`, `eye_closed_*` | | One visible at a time |
| `pupil_*` (iris and two shines) | eye centre + 2 in Y | Translate, scale |
| `lid_upper_*` (skin and lash) | eye centre X, 178.68 | Translate Y, rotate |
| `lid_lower_*` (skin and line) | | Translate Y; the line's opacity |
| `lash_flick_*` | | Translate Y |
| `nose` | | Static |
| `mouth` | 200 248 | Holds 18 mouth layers, one visible |
| `notepad` | 130 400 | Static, rotated −8° |
| `arm_R` (sleeve, wrist, watch, `hand_R`, pen) | 330 440 | handUp, checkWatch, writing |
| `hand_R` | 282 372 | Small writing motion |

## Masks

Three kinds of clipping. All are plain ellipses or the mouth outline, already in the SVG.

- `clip_eye_*` (the eye white, rx 20 ry 23) clips the pupil and the eye ring.
- `clip_lids_*` (rx 24 ry 27) clips both lids and the lash. It's bigger than the eye on purpose: lids must cover the soft edge of the eye white, or a faint ring shows.
- Each open mouth has its own clip from its outline, for the teeth and tongue.

## Controls

All values in `expressions.json` are offsets from the neutral pose.

| Control | Unit | Notes |
| --- | --- | --- |
| `head.rot` | degrees | −7 to +6 in use |
| `blush.opacity` | 0 to 1 | Neutral 0.35 |
| `brow_*.ty`, `.rot` | px, degrees | Rotation is in world space. Positive rot lifts the inner end of the left brow |
| `brow_*.arch` | 0 to 1 | Shape blend between `arch_min` and `arch_max`. Neutral is 0.33. The paths share points, so Rive can tween the vertices |
| `lid_upper_*.ty`, `.rot` | px, degrees | 42.32 is fully closed. Negative opens wider than neutral (surprised) |
| `lid_lower_*.ty` | px | Negative pushes up. The line fades in when it's raised |
| `pupil_*.tx`, `.ty`, `.scale` | px, factor | Up to ±7 px |
| `eye_*` | enum | open, happy, closed |
| `mouth` | layer name | See Mouths |

## Expressions

All 12 are in `expressions.json`. Blend between them over 250 ms with ease in out, unless a trigger says otherwise.

listening, warmSmile, talking, expectant, interested, skeptical, writing, thinking, impressed, laughing, reassuring, surprised.

## Mood mapping (InterviewVM.mood)

Moods hold until the mood changes.

| mood | Expression | Extra |
| --- | --- | --- |
| idle | listening | Breathing, blinks, small pupil drift |
| intake (the opening) | expectant | Warm, waiting for "I'm ready" |
| listening | listening | Pupil drift every 1.5 to 3 s, up to 0.15 of the range |
| skeptical | skeptical | |
| writing | writing | `hand_R` makes small writing strokes: ±2 px, 5 per second |
| talking | talking | The mouth comes from the viseme, not the expression |

Change from the concept: in Paper, "Thinking" is labelled "mood: intake". Intake is the opening, where she's greeting and waiting for "ready", so it plays **expectant**. Thinking is kept for the future `think` trigger below.

## Trigger mapping (InterviewVM triggers)

Triggers fire once, play, then hand back to the current mood.

| Trigger | What plays | Timing |
| --- | --- | --- |
| nod | `head` moves down 6 px and rotates +2°, then back | 180 ms down, 270 ms up |
| smile | warmSmile | 200 ms in, hold 1.2 s, 400 ms out |
| browRaise | interested | 150 ms in, hold 0.9 s, 300 ms out |
| glanceDown | writing, eyes and lids only | 150 ms in, hold 0.8 s |
| handUp | `arm_R` up 40 px and −10°: "one second" | 250 ms in, hold 1.2 s, 300 ms out |
| checkWatch | `arm_R` up 30 px, pupils to x 0.6 y 0.8, lids at 0.6 | 300 ms in, hold 1.4 s |
| sitUp | `body` and `head` up 3 px, brows up 2 px | 400 ms, then stays for the call |
| leanIn | `head` scales to 1.04 and moves down 4 px, with interested eyes | 300 ms in, hold 1.5 s |
| expectant | expectant | Holds until she speaks, or 2 s |

Future triggers. The poses exist, but these need the `react` tool's list and the app updated first, so leave them out of the first build:

- `think`: thinking, when she takes over 600 ms to reply
- `impressed`: impressed
- `laugh`: laughing
- `reassure`: reassuring
- `surprised`: surprised, when she's cut off

## Mouths

Two sets, all inside `mouth`:

- Expression mouths: `mouth_neutral`, `mouth_smile`, `mouth_laugh`, `mouth_flat`, `mouth_soft`, `mouth_expect`, `mouth_oh`, `mouth_ooh`, `mouth_hmm`.
- Visemes, one per InterviewVM.viseme value: `viseme_rest`, `viseme_closed`, `viseme_teeth`, `viseme_open`, `viseme_wide`, `viseme_round`, `viseme_pucker`, `viseme_fv`, `viseme_lth`.

Rules:

- While she's talking and the viseme isn't rest, the viseme layer wins. Otherwise the expression's mouth shows.
- Swap mouths with a 40 ms crossfade. Hard cuts flicker on fast speech.
- `mouthOpen` (0 to 100) scales `mouth` in Y from 0.92 to 1.08, around its pivot. Keep it subtle: the viseme does the real work.
- Lip sync timing stays as in PRD.md: shapes under 60 ms merge, each shows about 40 ms early.

## Always on

- **Blink.** Every 2.5 to 5.5 s at random; 1 in 10 is a double blink. `lid_upper_*.ty` goes to 42.32 and back: 70 ms close, 30 ms hold, 110 ms open. No blink while the eyes are happy or closed.
- **Breathing.** `body` moves up 1.5 px on a 4 s sine loop. `head` follows 120 ms later, by 1.2 px. `arm_R` follows the body.
- **Reduced motion.** Turn off breathing, nod and lean movement. Expressions and blinks stay.

## Build order (two day budget)

The PRD fallback holds. Day 1: parts imported, moods, blink, five visemes (rest, closed, open, wide, round), and four triggers (nod, browRaise, glanceDown, checkWatch). Day 2: the other visemes and triggers, breathing, and the contact sheet compared against `reference/expressions.png`.

## Done when

- The contact sheet matches `reference/expressions.png`, state by state.
- She runs in the call screen in place of the blob, reading the same InterviewVM values, with no other app changes.
- On a phone, at the size the call screen uses, she reads clearly at the smallest size the app shows her.
