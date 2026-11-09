# JobBuddy design: Plum

The visual direction for v2 from 9 Nov 2026. It replaces Tropical. The eight `.dc.html` files here are the reference screens, exported from Vishnu's design canvas. Read them for exact sizes, colours and copy. They are HTML mockups, not app code: rebuild them in the app's own components.

The authority order in `design/DESIGN.md` still holds: PRD.md decides behaviour, these screens decide the look, and you own the UI details in between. Log departures in `design/DECISIONS.md`.

## Screens

| File | Screen |
| --- | --- |
| Main.dc.html | Home |
| Setup.dc.html | Setup sheet |
| Call.dc.html | Call, listening |
| Writing.dc.html | Writing the scorecard |
| Scorecard.dc.html | Scorecard with the overall score gauge |
| Retry.dc.html | Retry result |
| History.dc.html | History |
| Profile.dc.html | Profile |

Screens not drawn here (call opening, long answer, retry call, streak screen, past call transcript, the four error screens) keep their current layouts and take the new tokens.

## Tokens

| Token | Hex | Use |
| --- | --- | --- |
| `plum` | #0B051D | Text, dark headers, call background, primary dark buttons, active tab |
| `plum-raised` | #2C2242 | Cards and controls on plum |
| `plum-line` | #373544 | Outlines on plum, dim progress segments |
| `lavender` | #AA89F2 | Meera, accent cards (What went well, retry header), selected length |
| `lime` | #E6FFA9 | Highlight cards (One thing, From your last call), streak, done states, gauge fill |
| `lime-tint` | #F2FFD2 | "Try this" bubble |
| `pink` | #FFA8CD | The one primary action per screen, with plum text |
| `pink-tint` | #FFE4EF | "You said" bubble |
| `bone` | #F9F8F5 | Page background |
| `white` | #FFFFFF | Cards, tab bar |
| `line` | #E2E2E7 | Hairline borders, tracks |
| `muted` | #615F6D | Secondary text |
| `soft` | #75727F | Captions, meta lines |
| `on-plum-muted` | #B3AFC2 and #D9D5E6 | Secondary text on plum |
| `danger` | #B3192F, tint #FDECEE | Destructive actions only (Remove, Delete all data) |

## Type

- Headlines: Inter Tight, 400 / 500 / 700, tight line height (1.05 to 1.2). Large sizes use weight 500.
- Everything else: Inter, 400 / 500 / 700.
- Load both with `next/font/google`.

## Shape

- Cards 16 px radius, hairline `line` border, no shadow.
- Dark headers: full bleed plum with a 32 px bottom radius.
- Buttons and chips are pills (radius 100). Pink for the one main action, plum for secondary actions, outline for options.
- Selected chips: plum fill, white text. Selected length tile: lavender.
- Tab bar: white, hairline top border. The active tab is a plum pill with icon and label.
- No hard offset shadows, rotated stickers or 2 px outlines. Those were Tropical.

## Meera

The same shapes and expressions as now, recoloured: a lavender body, plum eyes and mouth, and a lime dot. On plum backgrounds she sits directly on the plum.

## Layout changes in these screens

- Scorecard order: header with gauge and Meera's take, then Your one thing, then Skills and delivery numbers, then Moments to fix, then What went well, badges and actions.
- History header: the streak with a row of the last 7 days, not the completion rate.
- Badges and band words are plain text, never pill shaped, so they don't read as buttons.
