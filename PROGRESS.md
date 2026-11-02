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
