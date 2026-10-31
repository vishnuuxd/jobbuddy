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
- 6 second silence rule for leanIn: she now leans in when she checks in at 10 seconds
- 3 second resume window: replaced by the addition and restart rules, split at 15 seconds

## Deployment

Production: https://jobbuddy-app.vercel.app. Deployed with the Vercel CLI from this folder, so each update needs `vercel deploy --prod`. Keys are stored as Vercel secrets for production only.

## Day 1: Meera on a call

- [ ] Style exploration, concept image, auto vectorise, vector parts (Vishnu)
- [ ] RML rig script and build, once the vector parts arrive
- [ ] Call screen: built at `/call` from the "Call, interview" artboard in the Paper file "JobBuddy screens". Mute, camera, hang up and audio passed on my phone. One full call on the Vercel link is still to do, blocked until ElevenLabs credits are added. The placeholder figure stays until the rig exists. Attach is disabled until Day 2. The progress label arrives with nextQuestion wiring. Call dropped and Reconnect are not built yet
- [ ] Lip sync from alignment
- [ ] react, setPhase, setSetup and nextQuestion wired to the rig and the app
- [ ] Intake works by voice end to end
