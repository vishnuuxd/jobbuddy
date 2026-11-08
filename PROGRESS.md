# JobBuddy progress

PRD.md is the source of truth. This file tracks where the build is.

## Milestone 0: spike, closed Oct 31, 2026

- Agent connects through `/api/agent-session` and holds a conversation
- No tentative user transcripts exist, so word rules run when an answer ends
- "um" and "uh" survive in the transcript, so the filler rule stays
- All five client tools reach the app
- `onAudioAlignment` delivers character timing

### Deferred: test 5, the cut in

Runs A and B were skipped, so the cut in after a contextual update is unproven. The PRD fallback still applies: if it doesn't work, the long answer rule stops at checkWatch and she asks for the result after I finish.

The spike page moved to `/spike`, so these can still be run there. Still to test when this comes back:

- The cut in itself
- Whether she holds through a breath on Patient. The one recorded run was on Normal, where she took her turn at a 1 second breath
- The "about 3 seconds" before she takes her turn on Patient, which the expectant look at 1.5 seconds depends on

## Agent

Live agent checked against the PRD on Oct 31, 2026: Patient, take turn after silence 10 s, end conversation after silence 20 s, max duration 1200 s, hasCv and hasJd Boolean, addition, restart and check in prompt lines present. The duration message could not be confirmed through the API.

## Notes for later blocks

- Lip sync: `onAudioAlignment` arrives seconds ahead of the audio, and many events are empty. Try `onAudioAlignmentPlayback`, which fires as each chunk starts playing. Not tested yet
- Transcript delay was 0.75 to 2.3 s in the one recorded run, longer for short hesitant answers. The PRD says about 0.8 s

## What I threw away

- Course correction rule: it needs my words while I'm talking, and there are no tentative transcripts
- Filler burst in 20 seconds, live: now 6 fillers in one answer, checked when it ends
- Meera's rig and lip sync in v1: moved after v1, the orb stands in
- 6 second silence rule for leanIn: she now leans in when she checks in at 10 seconds
- 3 second resume window: replaced by the addition and restart rules, split at 15 seconds

## Deployment

Production: https://jobbuddy-app.vercel.app. Deployed with the Vercel CLI from this folder, so each update needs `vercel deploy --prod`. Keys are stored as Vercel secrets for production only.

## Day 1: Meera on a call

Changed Nov 2, 2026: Meera's design, the rig and lip sync moved to after v1. The orb stands in.

- [x] Orb behind the InterviewVM interface: `lib/avatar/interviewVM.ts` holds the values, `components/MeeraStage.tsx` is the avatar slot, and `components/Orb.tsx` is the only code that reads them for drawing. The rig replaces Orb in that slot. Preview of every state at `/orb`
- [x] mouthOpen from her voice volume: `lib/call/useVoiceVolume.ts`. `mouthOpenGain` in `lib/live/config.ts` is a guess until it's heard on a real call
- [x] react, setPhase, setSetup and nextQuestion wired through `lib/call/session.ts`, with unit tests (`npm test`). Not yet tried on a live call. flag still only logs, and is wired in Day 2
- [x] "Question 2 of 5" label, from the "Call, interview" artboard
- [x] setPhase("done") waits for her to finish speaking before it hangs up. For now the call just returns to the start screen, because the scorecard comes in Day 2
- [ ] Call screen: one full call on the Vercel link is still to do, credits are now added. Attach is disabled until Day 2. Call dropped and Reconnect are not built yet
- [x] Intake works by voice end to end

Deployed to production Nov 2, 2026. Check passed Nov 2, 2026 on Vishnu's phone: one full intake by voice, with the orb moving with her voice and reactions firing.

Settled Nov 2, 2026: the orb shows every reaction, as in the "V1 placeholder: the orb" table. There is no loading state: connecting shows idle with "Connecting" on the button.

## Day 2 morning: the interview

Built Nov 2, 2026. Tested with unit tests and in Chrome, not yet on a live call.

- [x] Live rules in `lib/live/rules.ts`, every number from `lib/live/config.ts`: the long answer ladder, filler and hedge bursts, expectant, addition and restart
- [x] flag tool, writing mood, flags ignored outside the interview phase. The rules also log client flags for filler, hedging and rambling
- [x] Full and short mode, "Question 2 of 5"
- [x] Attach: PDF and text extraction, context update, glanceDown and reading mood, held until the answer ends. Tapping attach asks CV or job description first
- [x] Profile: saved CV upload, replace, delete, at `/profile`. Sent at call start. Not designed in Paper. Reached by a temporary "Your CV" link until the bottom tabs exist
- [x] Dexie store saves the call record every second and at hang up. Status stays incomplete until the scorecard step sets it

Check, not passed yet: a short mode interview where a 2 minute answer gets the full ladder and the CV shapes one question. This is also the first real test of the deferred cut in.

Decisions to confirm:

- Starting again counts only on an `interruption` event. The PRD also counts "speech once she's back to listening", but that can't be told apart from answering her next question
- Writing and reading moods show over talking, because she usually calls flag while speaking. Her voice still moves the orb
- Call.lateAdditions and Metric.words are added to the PRD data model

## Change, 3 Nov 2026

Setup moves to a setup sheet, lengths of 5, 10 and 20 minutes replace the modes, and Home, History and Profile get bottom tabs. Not built yet: waiting for the Paper designs of Home, the setup sheet, History, the scorecard and Profile. The current `/profile` page is a placeholder to rebuild from that design.

- The opening phase keeps the `intake` mood name in InterviewVM, so the avatar interface doesn't change
- Code still to change for this: remove setSetup, rename the intake phase to opening, question counts of 2, 3 and 5, the app-written first line, and the one minute left update
- In ElevenLabs: delete the setSetup tool and turn on first message override in Security

## v2 phase 1: Foundation

Built Nov 8, 2026. Closed by Vishnu.

- [x] Bricolage Grotesque and Nunito Sans through `next/font`, as variables only. Screens not yet restyled keep Inter
- [x] Tokens in `app/tokens.css`: DESIGN.md colours, dark call colours from Paper, radii, shadows, spacing and type roles
- [x] Components in `components/ui`: Button, Chip (select, status pill, sticker), Card, TabBar, Sheet, HeroHeader, SkillBar, StatTile, InterviewerPlaceholder and the call parts
- [x] Meera's blob in `components/meera`, reading InterviewVM only. The mapping is in `lib/avatar/meeraFace.ts` and the PRD Character section, with unit tests. The call screen still uses the orb until phase 4
- [x] `/kit` shows every component and state
- [x] `/call`, `/profile` and `/orb` checked pixel for pixel against screenshots from before the phase: unchanged

- [x] Contrast decided 8 Nov: pink button labels 19 px bold, white header text only at 19 px bold or larger with small meta lines in ink, `pink-deep` for small pink text, `cream-chip` eyebrows, ink "You said" and ink on the mint sticker. No colours changed
- [x] Offline stays a prop on the avatar component, not in InterviewVM. Closed 8 Nov
- [x] Deployed to production for the check
- [x] Attach control removed from the call parts and `/kit`
- [x] Meera's opening line for the four cases (CV and job post, CV only, job post only, neither) in `lib/call/opening.ts`, with tests. Not wired yet: phase 3 sends it through the first message override

## v2 phase 3: to do

- Wire `openingLine` into the first message override when the sheet starts a call
- Update the scanned PDF message in `lib/attach/extract.ts` to the PRD copy: "Looks like a scan, I can't read it. Paste the text instead, or go without a CV."

## v2 phase 4: to do

- Remove the old attach flow from the call screen: the attach button, the CV or job description chooser, the held upload and its contextual update (`app/call/CallScreen.tsx`, `components/CallControls.tsx`, `session.attach`)
- Retire the reading mood and `readingHoldMs`, together with the attach flow so the current call keeps working until then. Update the PRD InterviewVM table and the blob mapping (keep glanceDown), the orb, `/kit` and the test

## v2 phase 2: App shell

Built Nov 8, 2026. Check, not passed yet: the tabs work on Vishnu's phone, and the bar never shows during a call.

- [x] Home, History and Profile in the `app/(tabs)` route group, which is the only place the tab bar renders. `/call`, `/orb` and `/spike` sit outside it
- [x] Home built to 1.1 from Dexie: greeting, streak sticker (from completed calls), the Meera card to `/call`, placeholders and the last three calls, with a first-run state
- [x] History and Profile are simple for now. The full screens are phase 6. CV upload is unchanged
- [x] `lib/home/format.ts`: titles, day labels, completion and streak, with tests
- [x] `/call` and `/orb` checked pixel for pixel against the screenshots from before the phase

## v2, one run (8 Nov 2026)

- [x] Part 2: v2 data model (setup, scorecard, retries), Dexie v2 upgrade for v1 calls, Home pills and links from real scores
- [x] Part 3: setup sheet with remembered choices, Run this again, Practice this and the night before heading. Calls start with Meera's opening line as the first message override, and the setup (with CV and job post text) as a contextual update. setSetup is gone, the phase is "opening" and the scanned PDF message is updated. Checked against a mocked ElevenLabs socket: each variant sends the right first line
- [x] Part 4: the call rebuilt on the v2 call parts with Meera's blob, the PRD's question label instead of a timer, reaction stickers, the writing screen, retry mode and the one minute left update. The old attach flow, the reading mood and `readingHoldMs` are gone. lib/live rules and thresholds unchanged. Checked with a scripted mock socket: opening, listening, long answer, writing and retry
- [x] Part 5: `/api/scorecard` on Gemini (`gemini-3.8-flash`, the newest stable Flash on the key, with a busy fallback to `gemini-flash-latest`), the PRD prompt and schema, a validator, scorecard screen v2, badges from config, personal bests, delivery tiles, PDF and Markdown. Real test with the key: a full scorecard came back valid in 34 s. The retry request hit Gemini "high demand" 503s on both models at the time, so it's retested later
- [x] Part 6: retry result (2.2), the streak screen once a day (2.3), History in full with personal bests, badges, Build scorecard and delete (4.1), Scorecard and Transcript tabs (4.2, 4.3), Profile in full with Delete all data (4.4). Checked with a mocked retry call from a past scorecard to its result and back, where the moment then shows "Improved +3"
- [x] Part 7: mic denied, call dropped with Reconnect, cut short with Jump back in, and scorecard failed with Build scorecard (5.1 to 5.4). Each was forced in Chrome against the mock socket. Reconnect sends "Sorry, we lost you. Where were we: …" and a RESUME context, then continues at the same question in the same call record
