# Meera rig spec · v2

This is the brief for rebuilding `rive/meera.riv` from Concept v2. The method doesn't change (PRD.md, "Character and rig"): generate RML from the parts, compile and check with the Rive CLI, and render every state to a contact sheet.

The approved design is "Meera · Concept v2" in Paper (file "JobBuddy screens", page "v2 key flows · Plum"). Paper stays read only.

What changed from v1:
- Framing: a video call tile, 328 × 430, with her face filling it.
- No bun and no halo. The hair is long and warm brown, with locks that swing. A soft lavender glow sits behind her.
- A clipboard held toward her: the pen hand works behind the board.
- Three arm poses.
- Parallax head turns.
- Alex-level motion: a talking loop, snappy eye darts, an overshooting nod, and a blink at the start of every reaction.
- A thinking mood and five new triggers.

## Files

| File | What it is |
| --- | --- |
| `parts/meera-parts.svg` | Every part as a named layer in the neutral pose. All mouths and arm poses are present; only the neutral ones are visible. Pivots are in `data-pivot` |
| `expressions.json` | Every control's value for the 12 expressions and 4 arm poses, the brow shapes, the blink and the writing path |
| `reference/expressions.png` | What each expression, arm pose, hair sway frame and viseme must look like. The contact sheet must match it |
| `reference/neutral.png` | The full neutral tile at 328 × 430 |
| `static/meera.svg` | The still image used outside calls. `build.js` copies it to `public/meera.svg` |
| `source/` | The scripts that make all of the above (`node rive/source/build.js`). Change the design there, never by hand in the SVG |

## Artboard

328 × 430. The whole drawing sits in the group `meera`, offset by (−36, −30). Every pivot in this file and in `expressions.json` is in the drawing's own coordinates, inside that group.

The background (`bg`: a plum rectangle plus the radial `glow`) is part of the file, so she reads the same anywhere. Keep it as its own layer.

## Layers and pivots

Draw order is bottom to top, as in the SVG.

| Group | Pivot | Moves by |
| --- | --- | --- |
| `bg` (bg_fill, glow) | | Static |
| `body` | 200 520 | Breathing, sitUp, talking bob, nod dip |
| `head` | 200 300 | Tilt, nod, leanIn, talking bob, breathing |
| `hair_back` | 200 250 | Parallax (moves against the turn) |
| `lock_L`, `lock_R` | 128 236, 272 236 | Rotation: hair follow-through |
| `hair_crown` | | Rides on hair_back |
| `ear_L`, `ear_R` | 110 202, 290 202 | Parallax tx; the far ear narrows (sx) |
| `face` | | Parallax tx (small) |
| `hair_front` (fringe, its shadow, two strands) | | Parallax tx |
| `features` (blush, brows, eyes, mouth) | | Parallax tx |
| `brow_L`, `brow_R` | 162 160, 238 160 | ty, rot, arch shape blend |
| `eye_L`, `eye_R` | 165 198, 235 198 | As in v1: pupils, lids, eye swap |
| `mouth` | 200 248 | 18 layers, one visible. mouthOpen scales it |
| `nose` | | Parallax tx (most) |
| `arm_R` (sleeve, wrist, watch, hand_R with pen) | 390 540 | Rest and writing: tx, ty |
| `clipboard` | 200 440 | Static, rotated −3° |
| `hand_L` | | Static (holds the board) |
| `arm_watch` | 340 390 | Pose swap, hidden at rest |
| `arm_hold` | 320 420 | Pose swap, hidden at rest |

Masks:
- `clip_eye_*` and `clip_lids_*` work as in v1.
- `clip_face` keeps the fringe shadow inside the face.
- Each open mouth has its own clip.

## Controls

All values in `expressions.json` are offsets from the neutral pose. New in v2:

- **turn** (−1 to 1, about ±4°) drives the parallax. Per unit of turn: nose +6.5 px, features +5, hair_front +2, face +1, hair_back −1.5, ears −1.2. The far ear's sx drops to 1 − 0.24 × |turn|. That's the right ear when turning left (negative), the left ear when turning right. Animate turn as one number, with all six groups keyed together, so the face never comes apart.
- **lock_L.rot, lock_R.rot**: the hair swing, both locks together.
- **arm.pose**: rest | writing | hold | watch.
  - Rest and writing move `arm_R`.
  - Hold and watch fade `arm_R` out and the pose group in over 120 ms. Her head and eyes animate into the pose over the same time, so the swap reads as one movement.

The v1 controls carry over unchanged: brows, both lids, pupils, the eye swap, mouth and blush.

## State machine layers

Seven layers run at once. Each adds its own wrapper on the parts it moves (see the WRAPPERS pattern in `rig/make-rig.js`), so their motions add up.

### 1. Mood

Loops hold until the mood changes, and cross-fade over 420 ms. Thinking cross-fades over 600 ms.

| mood | Expression | Loop |
| --- | --- | --- |
| idle | listening (turn 0) | Breathing only |
| intake | expectant | Bright, held. Hair lock −1.5° |
| listening | listening (turn 0.6) | 3.6 s: the turn drifts 0.6 → 0.75 and back. Every second loop, a slow double nod: head down 3.4 px, then 2.5 px |
| skeptical | skeptical | Held. The squint deepens slowly, lid +2 px over 2 s |
| writing | writing + arm writing | The arm plays `writingPath` (24 fps, 44 frames) on a loop |
| talking | talking | The talking motion (layer 2) |
| thinking (new) | thinking (turn 0.9) | Held, with a slow 2° tilt drift |

### 2. Talking motion

A 2 s irregular loop, on while mood is talking. Blend it in and out over 420 ms.

- head bobs down 4 px three times, at 0.3 s, 0.9 s and 1.6 s (uneven on purpose)
- head tilt goes +1.7°, −1°, +1.4°, +0.6°, back to 0
- turn sways ±0.3, making the nose move about ±1.9 px and the ears about ±0.4
- brows bounce up 2.5 px twice (at 0.4 s and 1.3 s)
- pupils shift ±1 px
- body bobs 1.5 px
- hair locks follow the tilt, 120 ms late, at 60% of its angle

Target: on Alex's measure (pixels changed per frame while talking), reach 5 to 6%, against Meera v1's 2%. Tune these amplitudes to hit it, not past it.

### 3. Reactions

One-shots, entered in 90 ms and left in 160 ms, unless a timing below says otherwise. **Every reaction starts with a quick blink**: 67 ms close, 33 ms hold, 100 ms open.

| Trigger | Plays | Timing |
| --- | --- | --- |
| nod | head down 5.9, up past rest by 0.8, down 3.8, settle. The body dips 1.5 with it | about 600 ms |
| smile | warmSmile | hold 1.2 s |
| browRaise | interested, but asymmetric: one brow up 8 px and tilted 5°, the other down 1 | hold 0.9 s |
| glanceDown | writing's eyes and lids only | hold 0.8 s |
| handUp | arm pose hold, plus hold's face | hold 1.2 s |
| checkWatch | arm pose watch, plus watch's face | hold 1.4 s |
| sitUp | body and head up 3 px, brows up 2. Stays for the call | 400 ms |
| leanIn | head scale 1.05, down 4 px, tilt 1.4°, interested eyes | hold 1.5 s |
| expectant | expectant | Holds until she speaks, or 2 s |
| think (new) | thinking | Holds until she speaks, or 2.5 s |
| impressed (new) | impressed | hold 1.2 s |
| laugh (new) | laughing, with the head bobbing twice (3 px) and the locks swinging ±3° | 1.4 s |
| reassure (new) | reassuring | hold 1.5 s |
| surprised (new) | surprised, the head pulling back up 3 px | hold 0.8 s |

### 4. Blink

Three timelines picked at random: waits of 2.5 to 5.5 s, 1 in 3 a double blink. The lids go to 42.32: 67 ms close, 33 ms hold, 100 ms open. No blink while the eyes are happy or closed.

### 5. Eye darts

While idle, listening or thinking: about 2 px in a random direction, made in 100 ms with ease (0.2, 0.9, 0.3, 1), then held 1.1 to 1.3 s. That makes three darts per 4 s.

### 6. Mouth and jaw

- **Visemes:** as in v1. The viseme wins while she's talking, otherwise the expression's mouth shows. Use a 40 ms crossfade.
- **Jaw:** mouthOpen scales `mouth` from 0.94 to 1.10 in Y.
- **Lip sync:** stays as built (lib/lipsync).

### 7. Breathing and follow-through

- **Breathing** is a 4 s loop. The body rises 1.7 px and swells 1% in height. The head drops 1.3 px, peaking at 1.83 s, and tilts 0.7°, peaking at 2.17 s. The offsets between the parts are what make it feel organic.
- **Hair follow-through:** whenever the head's rotation changes (from tilts, nods, laughs or the talking loop), the locks follow 120 ms late, overshoot by 40%, and settle in 300 ms. See the sway frames in the reference.

## Reduced motion

Turn off the talking motion, eye darts, hair follow-through, breathing, the nod's movement and lean movement. Keep the expressions, blinks, arm poses and visemes.

## InterviewVM changes

- **mood** gains `thinking`.
- **Triggers** gain `think`, `impressed`, `laugh`, `reassure` and `surprised`.
- Everything else is unchanged: viseme, mouthOpen, lipSync, reducedMotion and the nine existing triggers.

The app sets these as follows:

- **ElevenLabs `react` tool:** the five new names, which Vishnu adds in the dashboard.
- **think:** fired by the app when her reply takes over 600 ms after the user stops talking.
- **surprised:** fired by the app when the user cuts in while she's talking.
- **The thinking mood** is not sent by the agent. The app holds it while `think` is active.

## Done when

- The contact sheet matches `reference/expressions.png`, state by state, including the arm poses and sway frames.
- The Alex comparison shows talking motion at 5 to 6% per frame.
- She runs in the new call tile on a phone with no stutter, and the static image shows on Home and the scorecard.
