# JobBuddy design: Tropical

The visual rules for v2. Read this with `PRD.md` and the screens in `design/screens`.

## How to use this

- **PRD.md decides what the app does.** Flows, rules, data, copy that carries meaning.
- **This file and `design/screens` decide how it looks and feels.**
- **Inside those limits, you own the UI and UX details.** Layout, spacing, hierarchy, copy, states, motion. The screens are a direction, not a spec. Fix problems you find instead of copying them.
- **Log every departure** from a reference screen in `design/DECISIONS.md`.
- **If a screen and the PRD disagree, the PRD wins.** Log it. If the fix changes behaviour, ask Vishnu first.
- The status bar in the screens is part of the mockup. Don't build it.

## Feel

Loud, warm and a little cheeky. Duolingo energy with adult copy. Meera is a character, not a widget.

- **Light screens for planning:** Home, setup, scorecard, History, Profile. Pink hero headers on scorecard, History and Profile.
- **Dark ink screens for being on a call:** opening, listening, long answer, writing the scorecard, retry call, and errors that happen around a call.
- **Full pink for celebration:** the streak screen and the top of the retry result.

## Tokens

Pulled from the Paper file. Use these names as CSS variables or Tailwind theme keys.

### Colour

| Token | Hex | Use |
| --- | --- | --- |
| `pink` | #FF3D7F | Primary buttons, hero headers, Meera, active tab icon |
| `pink-deep` | #D61F5E | Text on pink tint ("You said", Remove, Delete) |
| `pink-tint` | #FFE8EF | "You said" bubble, hedging flag |
| `sun` | #FFB800 | Stickers, streak, badges, selected length, Meera's dot |
| `cream` | #FFF4D6 | "Your one thing" card, "From your last call", flag highlight |
| `cream-ink` | #B07F00 | Eyebrow text on cream |
| `cream-chip` | #8A6400 | Chip text on cream |
| `ink` | #1A1530 | Text, outlines, hard shadows, call background |
| `body` | #3B3552 | Long text on light screens |
| `muted` | #6B6580 | Secondary text, inactive tabs |
| `line` | #F1EEF6 | Dividers, tab bar top line, skill bar track |
| `border` | #E4E1EC | Soft card outlines |
| `dashed` | #C9C4D6 | Placeholder and locked outlines |
| `mint` | #00A86B | Positive dots, done progress, filled skill bars |
| `mint-deep` | #00764B | Text on mint tint |
| `mint-tint` | #E6F7F0 | "Try this", "What went well", saved CV, Improved |
| `white` | #FFFFFF | Surfaces |

Dark call screens use a lighter ink for control buttons, pills and the offline Meera (around #2A2442 and #3A3550 in the mockups). Pick exact values, check contrast, and log them.

### Type

- **Bricolage Grotesque, 800:** headlines, buttons, big numbers, Meera's name. Letter spacing -0.02em on 26 px and up.
- **Nunito Sans, 600 to 900:** everything else.
- Load both with `next/font`.

| Role | Size / line height | Font |
| --- | --- | --- |
| Hero headline | 34 / 36 | Bricolage 800 |
| Screen title | 26 / 30 | Bricolage 800 |
| Card title | 20 / 24 | Bricolage 800 |
| Button | 17 / 22 | Bricolage 800 |
| Body | 15 / 22 | Nunito 600 |
| Small | 13 / 18 | Nunito 600 to 700 |
| Eyebrow | 13 / 16, uppercase, 0.06em | Nunito 900 |
| Label in a list | 15 / 20 | Nunito 800 |

### Shape and depth

- **Outlines:** 2 px. Ink on things you act on or that matter most, `border` on calm cards, dashed `dashed` on placeholders and locked items.
- **Hard shadow, never a blur:** `0 5px 0 ink` on primary cards and big buttons, `0 4px 0 ink` on smaller buttons.
- **Radius:** hero header bottom 32, main card 24, cards 22, big buttons 18, buttons and bubbles 16, small buttons 14, chips and pills 999.
- **Bubbles:** 16 on three corners, 4 on the corner that points at the speaker.
- **Stickers:** sun or white pill, ink outline, rotated 2 to 4 degrees. Used for the streak, badges and Meera's reactions. Keep them rare so they stay special.

### Spacing

Screen side padding 22. Card padding 16 to 18. Gap between sections 18 to 24. Respect safe areas top and bottom.

## Components

Build these first, in the Foundation phase, with every state on a `/kit` page.

- **Button.** Primary (pink, ink outline, hard shadow, white Bricolage). Secondary (white, ink outline, hard shadow). Quiet (white, `border` outline, no shadow). Text button. States: pressed (moves down by the shadow, shadow goes to 0), disabled, loading. None of these states are designed yet.
- **Chip.** Selectable chip, status pill (tinted background, deep text), sticker.
- **Card.** Hero card (ink outline and shadow), calm card (`border` outline), tint card (cream, mint, pink tint).
- **Meera.** An asymmetric pink blob with a sun dot at the top right and ink eyes. She only reads InterviewVM values; the app never animates her directly. Expressions in the screens: hi (smile), listening, long answer (flat mouth, dotted sun ring), writing (notepad), worried (wavy mouth), surprised (round mouth), offline (grey, dash eyes). A reaction sticker can sit near her. This is the placeholder until the rig.
- **Interviewer placeholder.** Dashed outline, grey blob, "Not taking calls". Not tappable.
- **Tab bar.** Docked, white, 2 px `line` top border. Home, History, Profile. Active: icon filled pink with ink stroke, label ink 900. Inactive: `muted` 700. Hidden on the call, writing, scorecard, retry, streak and error screens.
- **Sheet.** White, rounded top, grabber, over a pink background. Must work with the keyboard open.
- **Call frame.** Ink background. Progress segments at the top (mint done, sun current, dim upcoming). Status pill top right. Meera in the middle, a title and a subline under her. Question card in white with a pink shadow edge. Controls: mic, camera, and a pink End. The attach button in the screens is dropped: the CV and job description come from the setup sheet.
- **Skill bar.** `line` track. Fill by score: pink at 1 to 2, sun at 3, mint at 4 to 5. An ink tick marks the personal best.
- **Stat tile.** Big Bricolage number, small label, soft background.
- **Hero header.** Pink, bottom radius 32, white text.

## Screen map

| File | Screen | PRD section |
| --- | --- | --- |
| 1.1-home | Home | Screens and flows: Home |
| 1.2-setup-sheet | Setup sheet | Setup sheet |
| 1.3-call-opening | Call, opening line | Call behavior: Opening |
| 1.4-call-listening | Call, listening | Live reactions |
| 1.5-call-long-answer | Call, long answer ladder | Live reactions: Layer 1 |
| 1.6-writing-scorecard | Writing the scorecard | Call |
| 1.7-scorecard | Scorecard | Scorecard: Layout v2 |
| 2.1-retry-call | Retry call | Scorecard: The retry |
| 2.2-retry-result | Retry result | Scorecard: The retry |
| 2.3-streak-starts | Streak screen | Scorecard: Gamification |
| 3.1-setup-practice-this | Sheet, Practice this | User journeys 2 |
| 3.2-setup-night-before | Sheet, night before | User journeys 5 |
| 4.1-history | History | History |
| 4.2-past-call-scorecard | Past call, scorecard tab | History |
| 4.3-past-call-transcript | Past call, transcript tab | History |
| 4.4-profile | Profile | Profile |
| 5.1-mic-denied | Mic denied | Edge cases |
| 5.2-call-dropped | Call dropped | Edge cases |
| 5.3-cut-short | Cut short | Call behavior: Cut short |
| 5.4-scorecard-failed | Scorecard failed | Edge cases |

## Known issues in the reference screens

Fix these as you build, and log what you did.

1. **Timer on the call.** Screens 1.3 to 1.5 and 2.1 show time left. The PRD says no timer, only "Question 2 of 3". Follow the PRD until Vishnu decides.
2. **No way out of the scorecard.** Screen 1.7 has no close or back, and the tab bar is hidden there. Add one.
3. **"Interview tomorrow" sticker** on 3.2. The app never learns an interview date. Use what it knows (job post added, 20 minutes) or drop the sticker.
4. **Three selection styles in one sheet.** Role selected is pink, level is ink, length is sun. Unify them, or make the difference mean something.
5. **Name field missing** from the setup sheet. The PRD keeps it as optional and remembered.
6. **Badges shown twice** on the scorecard: stickers in the header and "Badges from this call". Pick one place.
7. **"About 20 seconds"** on 1.6 has to be a real estimate or go.
8. **Retry result headline.** "+2" sits above a per skill list. Decide which number leads and why.
9. **"Run this again"** sits on the Recent calls header. The PRD puts it on the most recent call. Make the target clear.
10. **Mic denied steps** say "tap the lock in the address bar". That differs by browser. Detect it or write steps that hold on iOS Safari and Chrome.
11. **Streak day row** starts on Sunday. Use the real days.
12. **Missing states:** pressed, disabled and loading buttons, "Call Meera" disabled until role and seniority are set, first run Home with no calls, empty History, Profile with no CV, deleting a call from History.
13. **Contrast on dark screens.** Check muted text on ink against WCAG AA.

## What to look for while building

- One clear primary action per screen.
- Every state: loading, empty, error, disabled, pressed.
- Tap targets of at least 44 px.
- Copy in plain words. Meera sounds like a person, not a product.
- Motion that is small and springy, and respects reduced motion.
- Everything at 390 px wide first, then check 360 and 430.
