# Design decisions

Every place the build departs from a reference screen in `design/screens`. Newest at the bottom. Vishnu reviews this after each phase.

Format, one entry per change:

```
## <phase> · <screen file>
- Screen showed: <what the reference has>
- Built instead: <what the app does>
- Why: <the reason, in one line>
```

Entries start below.

## Phase 1 · all screens: fonts
- Screen showed: Bricolage Grotesque and Nunito Sans everywhere
- Built instead: both fonts load as CSS variables (`--display`, `--text`), and only v2 components use them. Screens not yet restyled keep Inter
- Why: phase 1 must not change any existing screen

## Phase 1 · all screens: button states
- Screen showed: only the resting state
- Built instead: pressed drops the button by its shadow and the shadow goes to 0. Disabled is `line` fill, `border` outline and muted text, with a flat `border` shadow. Loading keeps the width and swaps the label for a spinner, with `aria-busy`
- Why: none of these states were designed (known issue 12)

## Phase 1 · 1.2, 1.7: button sizes
- Screen showed: DESIGN.md says buttons are 17 px. Paper uses 19 px on the 58 px buttons and 17 px on the 50 px ones
- Built instead: `big` is 58 px with a 19 px label, radius 18 and a 5 px shadow. `small` is 50 px with a 17 px label, radius 16 and a 4 px shadow. `compact` is the 14 px ink "Practice this" button
- Why: Paper is the exact source. The 19 px label also counts as large text, which matters for contrast

## Phase 1 · 1.1: ink button
- Screen showed: "Practice this" is an ink button that DESIGN.md doesn't list
- Built instead: an `ink` button variant, used for a secondary action inside a tinted card
- Why: it's in the screens, and a pink button there would compete with the main action

## Phase 1 · 1.2: chip selection
- Screen showed: selected role was pink, selected level was ink, selected length was sun
- Built instead: every selected chip is ink fill with white text. Pink is kept for primary actions. Length tiles are restyled in phase 3
- Why: known issue 4, approved by Vishnu on 8 Nov

## Phase 1 · 5.2: buttons on ink
- Screen showed: Reconnect has a white outline and a white hard shadow
- Built instead: an `onDark` option on every button gives it a white edge. Quiet buttons on ink use `ink-raised`
- Why: an ink outline disappears on the ink background

## Phase 1 · call screens: dark tokens
- Screen showed: unnamed colours on the call screens
- Built instead: `ink-raised` #2A2442 (controls, pills), `ink-line` #3A3352 (upcoming segments, offline body), `ink-muted` #B9B3CC (sublines, 8.7:1 on ink, passes AA) and `ink-dim` #5A5272 (offline sun dot). `tile` #F7F5FA is the stat tile background. All taken exactly from Paper
- Why: DESIGN.md asked for exact values and a contrast check

## Phase 1 · 1.3 to 1.6, 5.2: Meera's drawing
- Screen showed: a separate static drawing of Meera per screen
- Built instead: one SVG on a 240 grid, with the body path converted from Paper's border radii and the sun dot, ring, notepad and pencil from Paper. Eyes and mouth change shape per expression, and one `size` prop gives 240, 92, 40 and 30. What each expression means is in the PRD Character section
- Why: one component that reads InterviewVM, so the rig can replace it later

## Phase 1 · 1.3 to 1.5: reaction stickers
- Screen showed: "Hi there!", "Nice, keep going" and "Getting long" stickers attached to Meera
- Built instead: a `Sticker` component the screen places next to Meera. The blob itself doesn't draw stickers
- Why: the sticker copy depends on the screen, not on InterviewVM

## Phase 1 · sheet
- Screen showed: the sheet over a pink background
- Built instead: a native modal dialog with a pink backdrop and a 28 px top radius. Focus stays inside, and Escape or a tap on the pink closes it. On iOS the sheet rises above the keyboard, and inputs are 16 px so Safari doesn't zoom
- Why: "Must work with the keyboard open" (DESIGN.md)

## Phase 1 · all screens: contrast, decided 8 Nov
Ratios are WCAG 2: 4.5 for normal text, 3 for large (24 px, or 18.66 px bold). No colours changed. Every pair is listed with its ratio in the Contrast section of `/kit`.

- **A, pink buttons:** screen showed white 17 px labels on the 50 px pink buttons (3.37, fails). Built instead: every pink button label is 19 px bold, which counts as large text, as on the big buttons. The pink End button on the call is 19 px too
- **B, pink headers:** screen showed small white text (13 to 15 px) in pink headers (3.37, fails). Built instead: white stays only where it counts as large text. Greetings and short lines like "Good evening, Vishnu" and "Meera says" are 19 px bold (`HeroGreeting`). Small meta lines like "Day 4 streak · 7 of 9 completed" are ink, 5.21 (`HeroMeta`)
- **C, pink text on white:** screen showed 13 to 15 px pink text on white, for example "Run this again", "Retry →" and "Meera asked" (3.37, fails). Built instead: `pink-deep`, 4.98
- **D, cream eyebrows:** screen showed `cream-ink` eyebrows on cream (3.26, fails). Built instead: `cream-chip`, 4.91
- **E, "You said":** screen showed a `pink-deep` label on pink tint (4.28, fails). Built instead: an ink label, 15.1
- **F, mint sticker:** screen showed white text on the mint "Filler free" sticker (3.08, fails). Built instead: ink text, 5.71
- Why: AA contrast, keeping every brand colour. Approved by Vishnu on 8 Nov

## Phase 1 · 5.2: Meera offline
- Screen showed: grey Meera with dash eyes when the call drops
- Built instead: `offline` is a prop on the avatar component, not an InterviewVM value. Question closed on 8 Nov
- Why: it's the connection state, not something Meera does, and the rig won't need it in its view model. Decided by Vishnu

## Phase 1 · 1.7: Meera on pink
- Screen showed: a white face with an ink outline next to "Meera says" in the pink header
- Built instead: a `tone="light"` option on the same Meera component: white body, 2 px ink outline at any size, no sun dot
- Why: the pink blob disappears on the pink header. One component keeps her face consistent everywhere

## Phase 1 · 1.3 to 1.5, 2.1: no attach button on the call
- Screen showed: four call controls: mic, attach, camera and End
- Built instead: three controls, mic, camera and End. The attach icon and its kit example are removed
- Why: the PRD and DESIGN.md changed on 8 Nov. The CV and job description only come in through the setup sheet, and Meera never asks for them
