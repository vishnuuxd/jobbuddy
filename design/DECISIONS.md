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

## Proposed, waiting for Vishnu: contrast

Built as designed for now. Each option is rendered in the Contrast section of `/kit`. Ratios are WCAG 2: 4.5 for normal text, 3 for large (24 px, or 18.66 px bold).

**A. White labels on 50 px pink buttons, 17 px: 3.37, fails**
1. Ink label on pink: 5.21
2. 19 px label, like the big button: counts as large, so 3.37 passes
3. Fill with `pink-deep`: 4.98. Changes the colour

Recommended: 2. It keeps the colours and matches the big button.

**B. Small white text in pink headers, 13 to 15 px ("Good evening, Vishnu", "Meera says", "Day 4 streak · 7 of 9 completed"): 3.37, fails**
1. Ink text: 5.21
2. 19 px bold: counts as large

Recommended: 1 for one-line labels. It reads well against the pink.

**C. Small pink text on white, 13 to 15 px ("Run this again", "Retry →", "Meera asked"): 3.37, fails**
1. `pink-deep`: 4.98

Recommended: 1.

**D. Eyebrow on cream, 13 px, `cream-ink` #B07F00: 3.26, fails**
1. `cream-chip` #8A6400: 4.91

Recommended: 1.

**E. "You said" label on pink tint, 12 px, `pink-deep`: 4.28, fails**
1. 14 px only: still 4.28, fails
2. Ink label: 15.1

Recommended: 2.

**F. White on the mint "Filler free" sticker, 13 px: 3.08, fails**
1. Ink text on mint: 5.71

Recommended: 1.
