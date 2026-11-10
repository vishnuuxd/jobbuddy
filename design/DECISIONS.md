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

## Phase 2 · 1.1 Home: greeting
- Screen showed: "Good evening, Vishnu"
- Built instead: "Good evening", "Good afternoon" or "Good morning", with no name
- Why: the name comes from the setup sheet, which remembers it from phase 3

## Phase 2 · 1.1 Home: streak sticker
- Screen showed: "Day 4 streak" in the header
- Built instead: the sticker only shows when the streak is above 0. Until scorecards exist (phase 5), no call counts as completed, so it stays hidden
- Why: a "Day 0 streak" sticker would celebrate nothing

## Phase 2 · 1.1 Home: Meera card
- Screen showed: the Meera card with no visible button
- Built instead: the whole card is one link labelled "Call Meera", with the same pressed drop as the buttons. Until phase 3 it opens the call directly. After that it opens the setup sheet
- Why: the card is the only way to start a call, so the whole card should be the tap target

## Phase 2 · 1.1 Home: parts left out until their data exists
- Screen showed: "From your last call" with Practice this, "Run this again", and score pills on recent calls ("+1 Structure", "Evidence 3")
- Built instead: none of these yet. Recent calls show the title, day, length and a grey "Incomplete" pill. Rows aren't links yet
- Why: all of them need scorecards (phase 5) or the prefilled sheet (phase 3). When "Run this again" arrives, it goes on the most recent call's row (known issue 9)

## Phase 2 · 1.1 Home: first run
- Screen showed: no empty state (known issue 12)
- Built instead: "Your calls show up here." in place of the list. Nothing shows while the list loads, so the empty line never flashes
- Why: first-run Home was one of the missing states

## Phase 2 · 4.1 History: simple for now
- Screen showed: "7 of 9" as a big number, personal bests, badges and status pills
- Built instead: a "History" headline with "1 of 4 interviews completed" under it at 19 px bold, then every call, newest first. With no calls: "No interviews yet. Your first one takes five minutes." and a button to Home
- Why: the full History is phase 6. Empty History was a missing state (known issue 12)

## Phase 2 · 4.4 Profile: simple for now
- Screen showed: an avatar with your name, the streak and completion line, and "Delete all data"
- Built instead: a "Profile" headline with the completion line in ink (contrast decision B), the saved CV card, Replace and Remove, and "Everything stays on this phone" without the delete link. With no CV: a line and an "Upload a CV" button. CV upload works as before
- Why: the name, avatar and "Delete all data" are phase 6. Profile with no CV was a missing state (known issue 12)

## Part 2 · 1.1 Home: recent call pills
- Screen showed: "+1 Structure" and "Evidence 3" with no rule behind them
- Built instead: a mint "+N Skill" when a retry on that call improved a skill (the biggest gain), otherwise a cream pill with the call's weakest skill and its score. Incomplete calls are grey "Incomplete", and calls whose scorecard failed are pink "No scorecard yet"
- Why: each pill now says one true thing about the call. Calls with a scorecard, or a failed one to rebuild, open their scorecard screen

## Part 3 · 1.2 Setup sheet: roles and name
- Screen showed: four short role chips (Product designer, UX researcher, PM, Engineer) and no name field (known issue 5)
- Built instead: the PRD's seven roles plus "Other" with a text field. An optional "Your name" field sits after the length, so the required choices come first
- Why: the PRD lists the roles and the remembered name. The name feeds Meera's first line

## Part 3 · 1.2, 3.1, 3.2: one selection style
- Screen showed: selected role pink, level ink, length sun (known issue 4)
- Built instead: every selected chip and length tile is ink with white text. Pink is only the "Call Meera · 10 min" button, and sun only the stickers
- Why: one meaning per colour. Approved for chips on 8 Nov, and extended here to the length tiles

## Part 3 · 3.2 Night before: heading and sticker
- Screen showed: "Interview tomorrow" (known issue 3)
- Built instead: the sheet's heading follows the choices. With a job post and 20 minutes it reads "Full run with the real job post", with a "Job post added" sticker. Practice this reads "A quick one on {skill}", with "Focus · {your one thing}"
- Why: the app never learns an interview date, so the copy only says what it knows

## Part 3 · 1.2 Setup sheet: CV and job post
- Screen showed: "Using your saved CV · Change" and a "+ Job post" tile
- Built instead: as shown, plus "Don't use a CV" and "Use my saved CV" to switch. A newly attached CV shows "Remember this CV for next time". The job post tile opens a paste box, then reads "Job post added · Tap to edit", with Remove
- Why: PRD.md asks for "Remember this CV". The switch lets a call go without the saved CV

## Part 3 · 1.2 → 1.3: the call starts from the sheet
- Screen showed: "Call Meera" on the sheet, then the call
- Built instead: the button is disabled until a role and level are chosen, with a hint under it. The call connects straight away on arrival, because the tap on the sheet counts as the gesture for the mic and audio. Opening `/call` directly, without a setup, offers "Set up a call", which goes to Home
- Why: known issue 12 (Call Meera disabled until role and seniority). No double tap to start

## Part 4 · 1.3 to 1.5, 2.1: no timer on the call
- Screen showed: "10 min", "6:12 left" in the pill (known issue 1)
- Built instead: the pill says where the call is. "Opening", then "Question 2 of 3", then "Call ended · 9:40" once it's over. A retry says "Just this one"
- Why: the PRD says no timer, only the question label. Meera closes at one minute left by herself

## Part 4 · 1.3 to 1.6, 2.1: titles and stickers follow what's happening
- Screen showed: fixed titles per screen
- Built instead: the title and subline follow the call: "Meera's saying hi", "Meera's listening", "Meera's talking", "Meera's making a note" after a flag, and "Meera checks the time" for 8 seconds after checkWatch, with "Getting long · land the result". Stickers appear for 2.6 seconds: "Hi there!" at the start, "Nice, keep going" on a nod, "Getting long" on checkWatch and "Go on, land it" on a retry. The question card shows her latest line
- Why: the screens are moments of one call, so the copy comes from the call's state. The 1.5 subline's answer timer ("1:48 into this answer") would need the live rules to expose their timer, and lib/live doesn't change

## Part 4 · 1.6 Writing the scorecard
- Screen showed: "3 answers · about 20 seconds" and three steps, two of them already ticked
- Built instead: "3 answers", with no time estimate (known issue 7). The first two steps are ticked because the app has already done them (transcript and delivery numbers). The third spins until the scorecard is back
- Why: every line on the screen is true

## Part 4 · 1.3 to 1.5: self view
- Screen showed: no self view tile
- Built instead: the PRD's self view tile, off by default, sits top right under the pill when the camera is on
- Why: PRD.md, Call: one tap to turn the camera on

## Part 5 · 1.7 Scorecard: a way out
- Screen showed: no close or back, and no tab bar (known issue 2)
- Built instead: a round close button top left. Straight after a call it closes to Home. From History it's a back arrow. The header line reads "Today · Senior product designer · 10 min", as on 4.2
- Why: every screen needs a way out

## Part 5 · 1.7 Scorecard: badges in one place
- Screen showed: badge stickers in the header and again under "Badges from this call" (known issue 6)
- Built instead: badges and the streak only in the header, as stickers. The bottom section is gone
- Why: the header is where the win is felt. Once is enough, and the page is shorter

## Part 5 · 1.7 Scorecard: moments and actions
- Screen showed: the first moment in full, the second short
- Built instead: as shown. The weakest answer is in full, with You said, Try this and "Retry this answer". The next one or two are short, with what changed, the reason and "Retry →". The strongest answer is never a moment. Once a retry improved a moment it shows "Improved +N", which opens the before and after. The main button is "Retry the weakest answer" until that one's retried, then "Run this again". Save is PDF (the print view without buttons) and Markdown (a text button)
- Why: PRD.md, Scorecard layout v2. Markdown is in the PRD's actions

## Part 5 · 1.6 → 1.7: when the scorecard is slow or fails
- Screen showed: the writing screen, then the scorecard
- Built instead: the writing screen stays until Gemini answers (about 30 seconds in tests). If it fails, the call is saved as scoring_failed and the screen offers "Build scorecard". Gemini is retried when it's busy or rate limited, then tried once on gemini-3.5-flash and once on gemini-flash-latest. A model that takes over 45 seconds counts as busy. All of this stays inside the route's 120 second limit
- Why: PRD.md, Edge cases: Scorecard request fails

## Part 6 · 2.2 Retry result: which number leads
- Screen showed: "+2" big, above "You landed it this time." and a per skill list (known issue 8)
- Built instead: the plain-words outcome leads ("You landed it this time.", or "Not quite yet."), and the total change sits beside it as a "+3 overall" sticker. The line under it names the biggest single skill change: "Structure went from 2 to 4 on stakeholder pushback." Then before and after, and up to three skills with their change. Confetti only when it went up. "New badge · Comeback" only the first time a retry on that call beats its original
- Why: the sentence is what you feel. The number is the evidence, and a sum of five skills isn't a scale people know

## Part 6 · 2.3 Streak screen
- Screen showed: Sun to Thu, starting on Sunday (known issue 11)
- Built instead: today and the next four real weekdays. It shows once, the day a completed call starts a new streak, when you close the scorecard. White text on pink is 19 px bold or larger, and the weekday labels are ink
- Why: real days, and contrast decision B

## Part 6 · 4.1 History
- Screen showed: "7 of 9" with "of 9" in a paler pink, best tiles with Clarity highlighted, badges with counts, and calls with pills or "Build scorecard"
- Built instead: as shown, all from real data. "of 9" is white too (pale pink on pink fails contrast). Every tile at the top personal best is highlighted. Badges not earned yet are dashed. Each row has a "⋯" button that opens a sheet to delete the call (known issue 12). A failed call shows "Build scorecard" in place of its pill
- Why: PRD.md: delete by swipe or menu. The menu works with screen readers and is harder to trigger by accident

## Part 6 · 4.2, 4.3 Past call
- Screen showed: Scorecard and Transcript tabs on a past call
- Built instead: the same tabs on every scorecard, straight after a call too. Flagged lines in the transcript are coloured by type: sun for no result and rambling, pink for hedging and fillers. They're marked "Flagged by Meera" or "Spotted live". Meera's name labels are pink-deep (contrast decision C)
- Why: the transcript is useful right after a call as well

## Part 6 · 4.4 Profile
- Screen showed: the avatar initial, the name and "Day 4 streak · 7 of 9 completed"
- Built instead: as shown. The name is the one the sheet remembers ("You" until there is one), and the meta line is ink. "Delete all data" opens a sheet to confirm it
- Why: contrast decision B. Deleting everything gets a second step

## Part 7 · 5.1 Mic denied
- Screen showed: "Tap the lock in the address bar, allow Microphone, then try again." (known issue 10)
- Built instead: steps for both browsers. "iPhone: tap aA in the address bar, then Website Settings, and allow Microphone. Chrome: tap the icon left of the address, then Permissions. Then try again." Meera has a mic-off badge
- Why: the lock isn't where Safari keeps site permissions

## Part 7 · 5.2 Call dropped
- Screen showed: "Meera picks up at the stakeholder question. No intro again."
- Built instead: the note quotes the question she was on. Reconnect starts a new session under the same call record. Her first line is "Sorry, we lost you. Where were we: …", and a RESUME context tells her the question number. "End here" builds the scorecard if there are two answers, otherwise it goes Home with the call saved as incomplete. Only a real connection error counts as a drop. If her side ends the call (silence, time limit), two answers get a scorecard and fewer show "That was quick"
- Why: PRD.md, Edge cases: a reconnect restarts at the current question, with no intake

## Part 7 · 5.3 Cut short
- Screen showed: "That was quick", "One answer isn't enough for a scorecard", "Jump back in"
- Built instead: as shown, with Meera's surprised face. "Jump back in" resumes the same call the same way as Reconnect
- Why: PRD.md, Call behavior: Cut short

## Part 7 · 5.4 Scorecard failed
- Screen showed: "Build scorecard" and "Read the transcript"
- Built instead: as shown, with Meera worried and a "?!" card. "Read the transcript" opens the call's page, which also has "Build scorecard" and the full transcript. History shows "Build scorecard" on the row too. A failed retry offers "Back to scorecard" instead
- Why: PRD.md, Edge cases: Scorecard request fails

## 9 Nov · 1.7b Scorecard: overall score
- Screen showed: the call name and "Today · 10 min" by the back button, a gauge with "3.4/5", "Getting there" under it, then "Meera says" and her take
- Built instead: as shown, with the exact values from Paper. The gauge has an ink outline, a `pink-soft` #FFD1E0 track (a new token, taken from Paper), a sun fill and a white knob. The number is white at 76 px and "/5" is ink. The band word is plain ink text, not a pill. On every load the fill, the knob and the number sweep up together from 0 over 1.1 seconds. Under reduced motion they show the final score at once. "+0.2 after retries" sits on its own ink line under the word, because there's no room beside a 22 px word on a phone. Badges and the streak stay as stickers under Meera's take, which 1.7b doesn't show
- Why: PRD.md, Scorecard: Overall score. Ink text on pink keeps contrast decision B. The name and the 26 px take count as large text

## 9 Nov · 4.1 History rows: score
- Screen showed: no design for score rows yet
- Built instead: each scored call shows a small static gauge and its score on the right, with the band word in bold at the start of the summary line: "Interview ready · End with the result". Calls without a score keep their Incomplete pill or Build scorecard button
- Why: a gauge, the number and the word side by side squeezed the call name onto three lines at 390 px. With the word in the summary line, names fit on one

## 9 Nov · call names
- Screen showed: "Senior Product Designer 12" as the title on 1.7b
- Built instead: the name is the title on the scorecard, past call and History screens, and on Home's recent calls. Role words in capitals, like UX, stay as they are
- Why: PRD.md, History: call names

## 9 Nov · 4.1 History rows: simpler, at Vishnu's request
- Replaces the earlier "History rows: score" entry. Rows now show the name, day and time, length, and the score as "3.5/5". No small gauge, band word or summary line. The gauge and word stay on the scorecard
- Why: Vishnu asked for only what's needed to find a call in the list

# Plum, from 9 Nov 2026

Plum replaces Tropical. The entries above describe the Tropical build and stay as history. These entries compare the build with the eight references in `design/plum`.

## Plum · all screens: tokens, fonts and components
- Screen showed: the Plum tokens, Inter Tight and Inter, pill buttons, hairline cards
- Built instead: as shown. Every Tropical token is gone from `app/tokens.css`, and every component in `components/ui` is restyled. Stickers became flat `Tag`s with no rotation. Badges became plain `Badge` text with a medal icon. Hard shadows and 2 px outlines are removed everywhere
- Why: README.md, Shape

## Plum · Scorecard.dc.html: badges as text
- Screen showed: "No ramble" and "4 day streak" as filled pills under "Badges from this call"
- Built instead: plain text with a small medal or flame icon, under "Wins from this call"
- Why: PRD.md (Scorecard layout, 7. Wins) and the README say badges are plain text, never pills. The PRD wins

## Plum · Scorecard.dc.html: tabs and save
- Screen showed: no Scorecard and Transcript tabs. One "Save as PDF →" link
- Built instead: the tabs stay, as a white pill track with a plum selected tab. "Save as PDF →" and "Save as Markdown →" sit side by side
- Why: PRD.md: past calls show the full transcript, and Save covers PDF and Markdown

## Plum · Scorecard.dc.html: moments
- Screen showed: the weakest answer in full, with a plum "Retry this answer" button. The next one short, with an underlined "Retry this answer →"
- Built instead: as shown. The short one's link reads "Retry question 3" to screen readers, so the two retry buttons have different names. An improved moment shows "Improved +N" in plum and "Retry again" as an outline button
- Why: two buttons with the same name are ambiguous with a screen reader

## Plum · Main.dc.html: Run this again
- Screen showed: no "Run this again"
- Built instead: a quiet text link under the recent calls: "Run Senior Product Designer 12 again →". Recent calls show their score, like History
- Why: PRD.md, Home: "Run this again" on the most recent call. As a link under the list it doesn't compete with the score on the row

## Plum · Main.dc.html: placeholder cards
- Screen showed: "Arjun · soon" and "Lena · soon"
- Built instead: as shown, with "not taking calls yet" added for screen readers
- Why: "soon" alone doesn't say they can't be called

## Plum · History.dc.html: badges kept
- Screen showed: no badges section
- Built instead: "Badges" stays, under personal bests, as plain text with a medal icon. Only earned badges are listed (changed 9 Nov at Vishnu's request: the "· not yet" rows and the "of 4" count are gone). With none earned, a quiet line says they show up here
- Why: PRD.md, journey 3: checking progress shows badges in History

## Plum · History.dc.html: the streak note
- Screen showed: "Practise today to make it 5. Your best is 9 days."
- Built instead: the note follows the data. "Practise today to make it N." if today has no call yet, "You practised today. Come back tomorrow to make it N." if it has, and "One completed call today starts a streak." at 0. "Your best is N days." only shows when the best beats the current streak. The 7 dots are lime for days with a completed call. Today is dashed lavender until it has one
- Why: the copy has to be true on every day, not only the day in the mockup

## Plum · History.dc.html: Build scorecard
- Screen showed: a small plum "Build scorecard" pill
- Built instead: a plum compact button with 13 px text, still 44 px tall, next to the "⋯" menu
- Why: at full size it pushed the call name onto two lines

## Plum · Profile.dc.html: destructive actions
- Screen showed: "Remove" in red, "Delete all data" as an underlined plum link
- Built instead: both "Remove" and "Delete all data" use the red destructive style (red tint, red border, red text, trash icon), and so do the "Delete this call" and "Delete everything?" confirmations
- Why: Vishnu asked for one red destructive style on 9 Nov. Destructive actions should look the same everywhere

## Plum · Call.dc.html: copy and stickers
- Screen showed: "Take your time" under "Meera's listening", and a "Nice, keep going" sticker rotated -4°
- Built instead: "Take your time" while listening, because the pill already names the question. The other states keep their own sublines. Reaction tags are flat: lime for "Nice, keep going" and "Go on, land it", pink for "Getting long", white for "Hi there!"
- Why: README.md: no rotated stickers

## Plum · Writing.dc.html: no "See your scorecard" button
- Screen showed: a "See your scorecard" button under the steps
- Built instead: no button. The screen moves to the scorecard by itself when it's ready
- Why: the button would do nothing until the scorecard exists. Waiting on the model is the only thing to do there

## Plum · Retry.dc.html: the number
- Screen showed: "+2" with "Structure, 2 → 4", then "You landed it this time."
- Built instead: as shown. The big number is the biggest single skill gain. When nothing improved it shows the overall change with "overall, across five skills", and "Not quite yet." A few lime, white, plum and pink dots pop in when it went up. Skill changes are plum pills, "same" is grey, a drop is pink
- Why: PRD.md asks for a celebration if it went up. This supersedes the Tropical "+3 overall" sticker decision

## Plum · Setup.dc.html: name field and roles
- Screen showed: five role chips, no name field
- Built instead: the PRD's seven roles plus "+ Other", and the optional name after the length, as before. The sheet's close button sits beside the title
- Why: PRD.md, Setup sheet

## Plum · no reference: streak, errors, call opening and retry call
- Screen showed: nothing in Plum
- Built instead: the Tropical layouts on plum. The streak flame is lime with a plum number and has no outline. The error badges (mic, "?!") are white with no outline or rotation. All of them use the pink primary button
- Why: README.md: screens without a reference keep their layout and take the new tokens

## Plum · no reference: app icon
- Screen showed: nothing, there's no icon reference
- Built instead: Meera's lavender body, plum eyes and the lime dot on plum, drawn from the Meera component's paths by `scripts/make-icons.mjs`. No mouth, and her "wide" eyes (19 × 30) rather than the resting ones, so the eyes still read at home screen size. The maskable icon keeps her inside the 80% safe circle
- Why: Vishnu asked for the blob, eyes and dot on plum. The iPhone status bar is translucent so the plum headers show through it, since "black" would be a pure black bar

## History, scorecard and call screen: a scorecard that fails or times out
- Screen showed: "Build scorecard" only, with no state for a request that never ends
- Built instead: the client gives up after 130 s and the button shows again. A short muted line says "Try again after some time." for a timeout or any other failure (Vishnu's wording). In History it sits under "All calls", above the list. The call screen's note and the scorecard page's line say the same
- Why: PRD.md, Scorecard: Building it. A spinner that never ends was the bug

## Meera's rig in the avatar slot (11 Nov)
- Screen showed: the blob, with dash eyes when offline, and the same blob at every size
- Built instead: the Rive rig. Below 160 px (Home's card at 64, the scorecard's "Meera says" at 34) she shows her head only, in a round avatar, the halo filling the circle: the whole bust is unreadable at those sizes. Offline greys her out at rest, since the rig has no dash eyes. Still previews keep breathing and blinking instead of freezing
- Why: rive/RIG.md, "Done when": she reads clearly at the smallest size the app shows her
