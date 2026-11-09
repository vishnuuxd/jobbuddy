# JobBuddy design: Plum

The visual rules for v2, from 9 Nov 2026. Plum replaces Tropical. Read this with `PRD.md`, `design/plum/README.md` and the eight reference screens in `design/plum`.

## How to use this

- **PRD.md decides what the app does.** Flows, rules, data, copy that carries meaning.
- **This file and the screens in `design/plum` decide how it looks and feels.** The Tropical screens in `design/screens` are history: use them only for layouts Plum doesn't draw.
- **Inside those limits, you own the UI and UX details.** Layout, spacing, hierarchy, copy, states, motion. The screens are a direction, not a spec. Fix problems you find instead of copying them.
- **Log every departure** from a reference screen in `design/DECISIONS.md`.
- **If a screen and the PRD disagree, the PRD wins.** Log it. If the fix changes behaviour, ask Vishnu first.
- **Never change a colour without asking Vishnu,** even to fix contrast. Propose options instead.
- The status bar in the mockups isn't built.

## Feel

Calm, grown up and still warm. Deep plum for the moments that matter, bone for planning, and a few bright accents used sparingly. Meera is a character, not a widget.

- **Plum headers** on Home, History, Profile and the scorecard: full bleed, 32 px bottom radius.
- **Plum screens for being on a call:** opening, listening, long answer, writing, retry call, the streak screen and the errors around a call.
- **Lavender for accents:** Meera, What went well, the retry result header, the selected length.
- **Lime for highlights:** Your one thing, From your last call, the streak, done states, the gauge fill.
- **Pink for the one main action per screen,** with plum text.

## Tokens

In `app/tokens.css`. Use the names, never raw hex.

| Token | Hex | Use |
| --- | --- | --- |
| `plum` | #0B051D | Text, dark headers, call background, dark buttons, active tab |
| `plum-raised` | #2C2242 | Cards and controls on plum, gauge track |
| `plum-line` | #373544 | Outlines on plum, dim progress segments, chip outlines, body text on lime |
| `lavender` | #AA89F2 | Meera, accent cards, selected length, the current progress segment |
| `lime` | #E6FFA9 | Highlight cards, streak, done states, gauge fill |
| `lime-tint` | #F2FFD2 | "Try this" bubble |
| `pink` | #FFA8CD | The one primary action per screen, with plum text |
| `pink-tint` | #FFE4EF | "You said" bubble, hedging lines in the transcript |
| `bone` | #F9F8F5 | Page background, the setup sheet |
| `white` | #FFFFFF | Cards, tab bar |
| `line` | #E2E2E7 | Hairline borders, tracks |
| `muted` | #615F6D | Secondary text |
| `soft` | #75727F | Captions, meta lines, dashed outlines |
| `on-plum-muted` | #B3AFC2 | Secondary text on plum |
| `on-plum-soft` | #D9D5E6 | Greetings and labels on plum |
| `danger` | #B3192F | Destructive actions only |
| `danger-tint` | #FDECEE | Background of destructive buttons |

Every text and background pair is listed with its contrast ratio on `/kit`.

### Type

- **Inter Tight** (400, 500, 700) for headlines and numbers. Large sizes use 500, with tight line height (1.05 to 1.2).
- **Inter** (400, 500, 700) for everything else.
- Both load with `next/font/google` as `--display` and `--text`.

| Role | Size / line height | Font |
| --- | --- | --- |
| Hero headline | 40 to 44 / 1.05 | Inter Tight 500 |
| Section title ("Skills", "Moments to fix") | 30 / 1.05 | Inter Tight 500 |
| Card title | 20 to 26 / 1.1 | Inter Tight 700 |
| Big numbers (score, streak, retry change) | 72 to 90 | Inter Tight 700 |
| Body | 15 / 1.45 | Inter 400 |
| Button | 15 (17 on big buttons) | Inter 500 (700 on big) |
| Small, meta | 13 | Inter 400 |
| Eyebrow | 12, uppercase, 0.06em | Inter 700 |

### Shape

- **Cards:** 16 px radius, hairline `line` border on white, no shadow.
- **Buttons and chips:** pills (radius 100). Pink for the one main action, plum for secondary actions, outline for options, red tint with a red border for destructive ones.
- **Selected chips:** plum fill, white text. **Selected length tile:** lavender.
- **Tab bar:** white with a hairline top. The active tab is a plum pill with its icon and label.
- **No hard offset shadows, rotated stickers or 2 px outlines.** Those were Tropical.

### Spacing

Screen side padding 20. Card padding 20 (16 on compact cards). Gap between sections 16, with 12 more above section titles. Respect safe areas top and bottom.

## Components

All in `components/ui`, with every state on `/kit`.

- **Button.** `primary` (pink), `secondary` and `ink` (plum), `quiet` (outline), `text`, `danger`. Sizes `big` (56), `small` (48), `compact` (44). States: pressed (a small press-in), disabled, loading. `onDark` for plum backgrounds.
- **SelectChip.** Outline pill, plum when selected. `tile` makes equal-width chips. `dashed` for "+ Other".
- **StatusPill.** Small pills for status: `plum`, `lime`, `grey`, `pink`.
- **Tag.** A flat pill for the streak and Meera's reactions. Never rotated, never outlined.
- **Badge.** Plain text with a small icon, for badges and wins. Never a pill, so it never reads as a button.
- **Card.** `white`, `lime`, `lavender`, `pink`, `dashed`, `plum`.
- **Meera.** Lavender body, plum eyes and mouth, a lime dot, directly on plum. Reads InterviewVM only. The expressions are in the PRD Character section.
- **ScoreGauge.** Plum-raised track, lime fill, white knob with a plum ring. Sweeps from 0 on every load, and shows the final state under reduced motion.
- **Sheet, HeroHeader, TabBar, SkillBar, StatTile, call parts.** As above, on Plum tokens.

## Screen map

| Plum file | Screen | Notes |
| --- | --- | --- |
| Main.dc.html | Home | Meera's card sits in the plum header |
| Setup.dc.html | Setup sheet | Bone sheet over plum, with a close button |
| Call.dc.html | Call, listening | Mic and camera left, "End call" right |
| Writing.dc.html | Writing the scorecard | |
| Scorecard.dc.html | Scorecard | The PRD's v2 order |
| Retry.dc.html | Retry result | Lavender header |
| History.dc.html | History | The streak and the last 7 days, no completion rate |
| Profile.dc.html | Profile | The completion rate lives here only |

**No Plum reference:** call opening, long answer, retry call, the streak screen, the past call transcript and the four error screens. They keep their Tropical layouts on the Plum tokens.

## What to look for while building

- One clear primary action per screen, in pink.
- Every state: loading, empty, error, disabled, pressed.
- Tap targets of at least 44 px.
- Copy in plain words. Meera sounds like a person, not a product.
- Motion that is small and springy, and respects reduced motion.
- Everything at 390 px wide first, then check 360 and 430.
