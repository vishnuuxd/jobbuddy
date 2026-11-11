# JobBuddy PRD v1

Oct 31, 2026 · @Vishnu

A mobile web app where you video call an AI HR interviewer, get called out live, and leave with a scorecard. Built in two days, for one tester: me.

## Overview

**Problem.** Interview prep happens in your head or in a doc. Nobody stops you when you ramble, and the feedback tools that exist only tell you afterwards.

**Product.** You call Meera, an AI HR interviewer, face to face. She sets up the interview by talking, runs it, reacts while you answer, and ends with a scorecard that rewrites your weakest answers.

**User for v1.** Me, testing it myself. No other users, no public link.

**Goal.** A working first version in two days, good enough to practice with and to write up as a case study.

**Success metric.** Session completion rate: calls that reach the scorecard, divided by calls started. This gets refined after testing.

**Non goals for v1.** Judging technical correctness, camera analysis, multiple live interviewers, sign in, sharing, payments.

## Version 2 focus

Version 2 is a showcase build: four key flows with polished, delightful UI, recorded as a 2 to 3 minute video for the case study.

- **Lead with the scorecard and the improvement loop.** The live reactions stay as supporting detail. Test 5, the cut in, runs later, and the plan adjusts if it fails.
- **Four flows to polish:** Home to setup sheet, the call, the end of the call into the scorecard, and retrying one question. History and Profile only need to look right.
- **Gamification:** the retry win, a practice streak, skill badges and personal bests. No XP and no leaderboards, because they reward time spent, not progress.
- **Meera comes after the flows.** An original character, built to Duolingo's level of motion quality, not their look. Her expressions come from what the settled flows need.
- **No call recording in v2.** Replaying the audio of a moment is a later stretch goal.
- **Decision for the case study:** the orb shipped in v1 to build and test fast, before investing in a character.
- **Visual direction: Plum (from 9 Nov, replacing Tropical).** Deep plum headers on a warm off white page, lime and lavender accent cards, one pink pill for the main action, hairline borders and no hard shadows. Inter Tight for headlines, Inter for text. The eight reference screens and the tokens live in `design/plum`. The Tropical screens in `design/screens` are kept for layout and flow only. The screens are a direction, not a spec. Claude Code refines them while building and logs each change in `design/DECISIONS.md`.

**Video plan, 2 to 3 minutes.** First practice, about 60 seconds. Daily practice, about 15 seconds. Checking progress, about 15 seconds. Retrying an old call, about 20 seconds. Then how it was built and what was cut.

## Screens and flows

Six screens: Home, the setup sheet, Call, Scorecard, History and Profile. Home, History and Profile sit in a bottom tab bar. Mobile web, installable as an app, same as Unstuck. No sign in: everything is stored in the browser on my device.

**Home**

- A grid of interviewer cards. Each card: Meera's orb for now, her name and a one line style ("Meera · HR screen · direct, fair").
- Meera is the only live card. Two or three placeholder cards say "Not taking calls yet" and can't be tapped.
- Tapping Meera opens the setup sheet.
- Under the cards: a "From your last call" card with the last call's practiceNext skill and a Practice this button. It opens the sheet prefilled for a 5 minute focus call. Hidden until the first scorecard exists.
- Under the grid: the last three calls, each opening its scorecard, plus "Run this again" on the most recent, which opens the sheet prefilled.
- Bottom tabs: Home, History, Profile.

**Setup sheet**

All setup happens here, before the call. Nothing is asked by voice.

- Opens from the bottom when I tap an interviewer.
- Name: optional, remembered for next time. Meera uses it in her opening line.
- Role: chips for common roles (Product designer, UX researcher, Software engineer, Product manager, Data analyst, Marketing, Sales) plus Other, which opens a text field. Required.
- Seniority: chips for Junior, Mid, Senior and Lead. Required.
- Length: three buttons, 5, 10 and 20 minutes. 10 is selected by default.
- Job description: a paste box. Optional.
- CV: attach a PDF or text file. Optional. If a CV is saved in Profile, it shows as "Using your saved CV · Change". A newly attached CV can be kept with "Remember this CV".
- Continue is active once role and seniority are chosen. It closes the sheet and starts the call.
- The sheet remembers my last choices.

**Call**

- Before she answers, a ringing screen, like an outgoing phone call (see Call behavior: Ringing).
- Meera fills a large rounded tile, like the other person on a video call. My self view camera sits small in the tile's top corner, off by default, one tap to turn on. What she's doing ("Meera's talking · Question 1 of 2") is a caption over the bottom of the tile, like a name label. The question card and the call controls stay below the tile.
- Controls: mute, camera, hang up. No attach button: the CV and job description only come in through the setup sheet, before the call. Meera never asks for them.
- A small progress label once the interview starts: "Question 2 of 5". No timer.
- While the scorecard is being built: Meera's face stays on screen with "Writing up your scorecard" and her writing mood.

**Scorecard**

- The v2 layout in the Scorecard section: Meera's take, your one thing, two or three moments with Retry, what went well, skills, delivery and wins.
- Actions: Retry a question, Run this again, Save as PDF or Markdown.
- Cut short screen instead, if fewer than two answers were given.

**History**

- At the top, the streak, with a row of the last 7 days and a nudge like "Practise today to make it 5. Your best is 9 days." The completion rate lives on Profile, not here.
- Every past call, newest first: its name, date and time, length, and overall score. Scored rows have no gauge, word or summary line.
- **Call names:** seniority, role and a number, with no separators: "Senior Product Designer 12". Role in title case. The number counts calls for that role and seniority, starting at 1, and is saved when the call starts, so deleting a call never renames the others. Retries stay under the original call and get no number of their own.
- The past call screen uses the name as its title next to the back button. Length and date go in a small line under it.
- Tap to open the scorecard and the full transcript, with flagged moments highlighted. Retry stays on each moment, so I can retry an old answer and see the before and after.
- Delete a call by swiping or from its menu.
- Badges: only the ones I've earned, with a count when earned more than once. Badges not earned yet aren't listed.

**Profile**

- Saved CV: upload, replace, delete. Shows file name and the date it was added. The setup sheet uses it automatically.
- Delete all data.
- The completion rate.
- No accounts in v1. The tab looks and works like the other two. Google sign in comes later, when the link is shared with others.

## User journeys

Six journeys. Four of them carry the video: first practice, daily practice, checking progress and retrying an old call. The diagram is in the PRD doc.

1. **First practice.** Home, tap Meera, setup sheet, call, scorecard, retry the weakest answer, see the improvement, and the streak starts.
2. **Daily practice.** Home shows the streak and last time's weak spot. "Practice this" starts a 5 minute call focused on that skill, with the sheet prefilled.
3. **Checking progress.** History with the streak, personal bests per skill, and badges.
4. **Retrying an old call.** History, a past call, retry an answer that was weak back then, and see the before and after. The past call's scorecard keeps Retry on its moments, so this needs no new screen.
5. **Night before an interview.** Paste the job description, choose 20 minutes, review the moments, retry two answers.
6. **When things go wrong.** Cut short, mic denied, call dropped or scorecard failed. Each has a clear way back: Try again, Reconnect or Build scorecard.

"Practice this" is the one new piece of scope here. It's a 5 minute call whose setup carries a focus skill, and Meera picks questions that test it.

## Call behavior

The call has three phases: opening, interview and close. The app tracks the phase. Flags only count during the interview.

**Ringing.** Before she answers, the call screen rings, like an outgoing phone call. Full plum, no tile, no animated rig. Centred: the static round Meera image at 140 px with three soft lavender rings pulsing outward, then "Meera" in the display font, "HR interviewer", and a status line: "Calling…", then "Ringing…" once the connection request is out. At the bottom, only the pink End call button, which cancels and goes home; mute and camera wait until she answers. A quiet ringback (two short rings on repeat) plays from the tap until she connects; on an iPhone the silent switch mutes it, and it's off with reduced motion. The ringing screen shows for at least 1.2 s (`callConfig.minRingMs`) so it never flashes: the session starts once that time is up. When she connects, the round avatar grows into the video call tile over 300 ms (`callConfig.answerMs`), with the static image riding the same path as it fades, so the rig, already loaded and idle underneath, takes over without a jump. Then the rest of the call screen fades in. With reduced motion: no pulsing rings, and a plain crossfade into the tile.

**Opening.** The app speaks her first line, built from the sheet, through the first message override. Keep it short, like a real interviewer. The app picks one at random:

- With a CV and a job post: "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role. I've read your CV and the job post. Ready?"
- With a CV only: "Hi Vishnu, I'm Meera. Ten minute screen for the senior product designer role. I've seen your CV. Ready?"
- With a job post only: "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role. I've read the job post. Ready?"
- Without: "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role today. Shall we start?"
- No name given: "Hi, I'm Meera." in place of "Hi Vishnu, I'm Meera."

The setup also goes to her as a contextual update at connect. When I say I'm ready, she sits up, the phase moves to interview, and she asks the first question.

**Interview**

| Length | Main questions | Shape |
| --- | --- | --- |
| 5 min, Quick | 2 | Opener on background, one behavioral |
| 10 min, Standard (default) | 3 | Opener on background, one behavioral, why this role |
| 20 min, Full | 5 | Opener on background, three behavioral, why this role |

The app owns the time limit, counted from connect. Retry calls have none of this.

- At two minutes left, it sends: "About two minutes left. Don't start a new main question. Let them finish, then close."
- At the chosen length, if the phase isn't done yet, it sends: "Time is up. Say your closing line now and call setPhase("done")." Then the normal close runs.
- If she still hasn't called setPhase("done") 60 s after that, the app ends the call itself. It counts as complete, not incomplete: I did nothing wrong.
- The timings live in `lib/call/config.ts`. The 1500 s max duration in ElevenLabs is only a backstop.

- Questions come from the job description if there is one, otherwise from the usual competencies for that role and seniority.
- With a CV, at least one question is specific to it.
- Each question can have one follow up from her. Follow ups don't count toward the total.

**Close.** "Okay, that's everything I wanted to ask. Your scorecard's ready when you are." Phase moves to done. The app ends the call itself: it waits until her voice actually stops, then 1 second, then hangs up. It never times this from the setPhase call, which can arrive before she finishes speaking. If she never calls setPhase("done"), the time limit above ends the call, and the 20 second silence rule in ElevenLabs is the backstop. Then the scorecard is built.

**Close safety net.** On a phone test on 11 Nov she said her closing line and never called setPhase("done"), so the call stayed open. Now, if she's on the last main question, her turn mentions the scorecard, and setPhase("done") hasn't come within 3 s of her audio stopping (`callConfig.closingLineWaitMs`), the app sets done itself and the normal close hangs up. The call counts as complete. Retry calls are left out: they close themselves after one line. Logic in `lib/call/closeNet.ts`.

Her text can carry voice tags like "[calm]" or "[laughs]". The app removes every square bracket tag before her words show in the caption, are saved to the transcript or go to the scorecard.

**Cut short.** If I hang up with fewer than two answers, no scorecard is built. The call is saved to History as incomplete: "That was quick. Want to jump back in where we stopped?"

**Retry a question.** From the scorecard, a short call where she asks only that question, with the same setup. No intake. The new answer gets its own card, saved under the original call.

## Live reactions

The app reacts while I talk. The agent judges when I stop. That split matches what the [ElevenLabs React SDK](https://elevenlabs.io/docs/agents-platform/libraries/react) actually exposes.

**What the SDK gives us**

| Need | SDK feature | Use |
| --- | --- | --- |
| My words, after each answer | `onMessage` carries the final user transcript, about 0.8 s after I stop | Word rules at turn end |
| Whether I'm speaking or pausing | `onVadScore`, `onModeChange` | Pause and silence timers |
| Tell the agent what the app saw | `sendContextualUpdate`, which adds context without making her reply | "Answer at 2:10, rambling" |
| Her mouth timing | `onAudioAlignment`, character level timing for her speech | Lip sync |
| Her reactions and flags | `clientTools` | react, flag, setPhase |

The SDK has no method that makes her cut in while I'm still talking. So the v1 rule is: **the spoken interruption happens at my next pause, not mid word.** She's primed by a contextual update, and when I take a breath she says "Sorry, let me jump in." That's buildable and still feels live.

**Layer 1: client rules (live, no agent involved)**

| Rule | Trigger, starting value | Reaction |
| --- | --- | --- |
| Long answer, step 1 | 75 seconds into an answer | glanceDown |
| Long answer, step 2 | 105 seconds | checkWatch |
| Long answer, step 3 | 120 seconds | sendContextualUpdate so she cuts in at the next pause |
| Filler burst | 6 or more fillers in one answer, checked when it ends | browRaise, at most once per answer |
| Hedge burst | 3 or more hedges in one answer, checked when it ends | browRaise, at most once per answer |
| Pause after an answer | 1.5 seconds of silence after I've been talking. Turn eagerness is Patient, so she waits about 3 seconds before taking her turn | expectant: brows up slightly, head tilted |
| Course correction | Cut in v1, it needs my words while I'm talking | nod |

- Nothing fires in the first 20 seconds of an answer, except the expectant look.
- At most one spoken interruption per answer.
- If I start talking after she has taken her turn, she stops and listens. A short addition, up to 15 seconds, joins the previous answer: she acknowledges it in a few words and asks her question again. The scorecard notes that the result came late. Only an interruption event counts as starting again, so answering her next question is never mistaken for an addition.
- Longer than 15 seconds is a restart. At 15 seconds the app sends a contextual update, and at my next pause she lets it run briefly, redirects once, like "Let's hold that, I want to get to the next one", and flags it as rambling. Either way, the question label stays where it was and any nextQuestion she called on that turn is dropped. Her speaking time is left out of words per minute and answer length.
- All values live in one config file so I can tune them after testing.

**Layer 2: agent judgment (at turn boundaries)**

- A story that ends with no result: she asks "So how did that turn out?"
- An answer to a different question: she steers back once.
- She calls flag() for anything worth putting on the scorecard and react("nod") when an answer lands.

**Spike results.** Fillers survive in the transcript, so the filler count stays. There are no tentative transcripts, so every word based rule runs when an answer ends. Only the timers and the silence rule are truly live, driven by vad_score.

## Scorecard

**Layout, v2.** The scorecard answers one question: what do I fix, and can I fix it now. The wireframe is in the PRD doc.

1. **Overall score and Meera's take.** A gauge with the overall score at the top, then one honest sentence in her voice.
2. **Your one thing.** The main pattern with evidence, like "2 of 3 answers ended before the result", and one line on why it matters.
3. **Skills.** Five bars, with a marker for my personal best.
4. **Delivery.** Pace, fillers and average answer length.
5. **Moments, two or three.** The weakest answers only. Each shows the question, a short quote of my words, the rewrite with blanks for missing numbers, and Retry.
6. **What went well.** One real strength.
7. **Wins.** Badges from this call and the streak, as plain text with a small icon, never as pills.
8. **Actions.** Retry the weakest answer, new interview, save.

**Overall score.** One number for the whole interview, out of 5.

- The app works it out from the scorecard, not the model: the average of every skill score across every scored answer, to one decimal. It's ready the moment the scorecard arrives, with no extra request. Once saved, it never changes on a later visit.
- A word goes with it: under 2.5 "Not there yet", 2.5 to 3.4 "Getting there", 3.5 to 4.2 "Interview ready", 4.3 and up "Strong". The bands live in `lib/progress`.
- The gauge animates from 0 to the score each time the scorecard loads. With reduced motion, it shows the score straight away.
- Retries never change the original score. When a retry improves an answer, "+0.4 after retries" shows beside it.
- Incomplete calls and failed scorecards have no score. They keep their Incomplete or Build scorecard label.

**Building it.** The server route tries the fastest working Gemini model first, with fallbacks, and has 120 s. The client gives up at 130 s, a bit over the route's limit, so a lost request never spins forever. A timeout or any failure saves the call as scoring\_failed: "Build scorecard" shows again with "Try again after some time.", and the transcript is kept. If the transcript is long, what goes to Gemini is trimmed by shortening Meera's lines first. My answers are never cut.
- History shows each call's score in its row, as a number out of 5. The gauge and the word are on the scorecard only.

**The retry.** Tapping Retry starts a short call with only that question and the same setup. Afterwards: my old answer next to the new one, the score change per skill, and a celebration if it went up. The moment card then shows "Improved". The score change is worked out by comparing the retry's scores with the original answer's, so nothing extra is stored.

**Gamification data** is worked out from past calls, so nothing extra is stored. The thresholds live in their own badges group in `lib/live/config.ts`. Starting rules, to tune later:
- **Streak:** days in a row with at least one completed call. A missed day resets it quietly.
- **Badges:** Landed the result (every answer had one), No ramble (no answer over 2 minutes), Filler free (under 3 fillers per answer), Comeback (a retry scored higher).
- **Personal bests:** the best score per skill, shown on the scorecard and in History.
- **Streak screen:** when a completed call starts a new streak, a one time full screen moment follows the scorecard or the retry result: "Your streak starts today". On later days the streak shows on Home and the scorecard only.

Built after the call by one model request with a JSON schema. Input: the transcript with timestamps, all flags, the app's delivery metrics, the role, seniority, length, question count, CV text and job description text.

**Rubric.** Each answer gets 1 to 5 on five axes, judged against the seniority bar. A 3 is a passable answer at that level.

| Axis | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Clarity | Hard to follow what happened | Followable with effort | Clear on first listen |
| Structure | No situation, action or result | Two of the three | All three, in order, result last |
| Evidence | No specifics | Some specifics, no numbers | Specific with a number or concrete outcome |
| Relevance | Answers a different question | Mostly on the question | Directly answers it, nothing extra |
| Delivery | Heavy filler, hedging or rambling | Some filler or one long stretch | Steady pace, little filler, no hedging |

**Seniority bar.** Junior: what I did and learned. Mid: what I owned and the outcome. Senior and above: scope, decisions, influence, tradeoffs.

**Rewrite rules**

- Use only facts from my answer and my CV.
- Use the job description's language where it fits.
- Missing numbers become blanks: "\[your number\]". Never invent one.
- One rewrite per answer, for the weakest part, not the whole answer.

**Delivery metrics, computed by the app, not the model.** Words per minute per answer, filler count, hedge count, answer length in seconds.

**JSON schema**

```json
{
  "summary": {
    "strongest": { "questionIndex": "number", "why": "string" },
    "practiceNext": "clarity | structure | evidence | relevance | delivery, the suggested focus skill for Practice this",
    "meeraTake": "string, one honest sentence in her voice",
    "oneThing": { "pattern": "string", "evidence": "string, like 2 of 3 answers", "whyItMatters": "string, one line" }
  },
  "answers": [
    {
      "questionIndex": "number",
      "question": "string",
      "lateAddition": "boolean, true if a key detail came only after she had moved on",
      "scores": {
        "clarity": "1 to 5",
        "structure": "1 to 5",
        "evidence": "1 to 5",
        "relevance": "1 to 5",
        "delivery": "1 to 5"
      },
      "flagged": {
        "type": "rambling | off_question | no_result | filler | hedging | pace",
        "quote": "string, my exact words",
        "atSeconds": "number",
        "whyItMatters": "string, one line"
      },
      "rewrite": {
        "original": "string, my exact words",
        "improved": "string",
        "whatChanged": "string, one line"
      }
    }
  ]
}
```

The app adds the delivery metrics and the completion status before saving. If the model call fails, the transcript is saved and the scorecard can be rebuilt from History.

## Agent spec

One ElevenLabs agent. Pick a calm, warm voice with a natural pace. Voice model: V4 Turbo, with expressive mode off. Turn settings: eagerness Patient, take turn after silence 10 s, end conversation after silence 20 s, max duration 1500 s, with the message "We're out of time for today. Your scorecard's ready when you are." First message override is on in Security, because the app writes her opening line. The First message field in the dashboard is only a fallback: "Hi, I'm Meera. Shall we start?" It never asks for a CV or job description. The system prompt is below. Context such as the setup, the CV and job description text from the sheet, and live rule events arrives through `sendContextualUpdate`.

**Client tools.** Configure them in the ElevenLabs dashboard with these exact names. None of them block the conversation.

| Tool | Parameters | What the app does |
| --- | --- | --- |
| react | name: nod, smile, browRaise, glanceDown, handUp, checkWatch, sitUp, leanIn, impressed, laugh, reassure, think, surprised | Fires that trigger on the rig. think and surprised are normally fired by the app (see Character and rig), but the tool accepts them |
| flag | type, quote | Logs the flag with a timestamp. Plays the writing mood. Ignored outside the interview phase |
| setPhase | name: opening, interview, done | Sets the phase. done ends the call and starts the scorecard |
| setSetup | None | Removed. Setup now comes from the sheet. Delete this tool in ElevenLabs |
| nextQuestion | index | Advances "Question 2 of 3". The app counts questions itself and ignores a call if she hasn't asked a new question since the last one |

**System prompt**

```text
You are Meera, an experienced HR interviewer. You run screening interviews for any role. You are direct, calm and fair. You are not unkind, and you do not praise to be nice. When an answer lands, you nod and move on. When someone rambles, it shows on your face.

OPENING
- The app speaks your first line for you. It greets them, names the role and length, and asks if they're ready.
- At the start you receive the setup as a context update: their name, role, seniority, length, number of main questions, and whether there is a CV or job description.
- When they say they're ready, start the interview. If they ask something first, answer in one line, then start.
- Nothing before the interview is judged. Never call flag before setPhase("interview").
- Never ask for a CV or job description. If there is none, work from the role and seniority.

CONTEXT FROM THE APP
- FOCUS SKILL: pick main questions that test that skill. Don't name the skill or coach it.
- RETRY: ask only the question given, with no intro and no follow up. After their answer, say one short line and call setPhase("done").
- RESUME: the call dropped and they're back. No intro. Pick up at the question given, in a few words, like "Sorry, we lost you. Where were we: ..." Keep counting from there.

INTERVIEW
- Call setPhase("interview") and react("sitUp"), then ask the first question with no extra preamble.
- Ask the number of main questions in the setup. 2: an opener on their background, then one behavioral question. 3: an opener, one behavioral question, then why this role. 5: an opener, three behavioral questions, then why this role.
- If you receive a context update saying time is nearly up, don't start a new main question. Let them finish, then close. If it says time is up, close right away: say your closing line and call setPhase("done").
- Base behavioral questions on the job description. With none, use the usual competencies for this role and seniority. With a CV, make at least one question specific to it.
- Call nextQuestion before each main question. You may ask one follow up per question.
- If a story ends with no result, ask something like "So how did that turn out?"
- If they answer a different question, steer back once.
- Call flag for anything worth putting on the scorecard, with the type and their exact words.
- Call react("nod") when an answer lands.
- Call react("impressed") when an answer is genuinely strong: a clear result with numbers, or a sharp insight. At most twice in a call. Never on an answer you flagged.
- Call react("laugh") only when they make a joke or say something genuinely funny. Never laugh at them.
- Call react("reassure") when they're clearly struggling or apologise for losing the thread, before you steer them back.
- If you receive a context update saying an answer is running long, cut in at the next pause with one short sentence, like "Sorry, let me jump in. How did it end up?" Then let them continue.
- If they start talking again after you've moved on: for a short addition, acknowledge it in a few words and ask your question again. If they restart the whole story, let it run briefly, then redirect once, like "Let's hold that, I want to get to the next one", and flag it as rambling.
- If you get the turn because they've gone quiet, assume they're thinking, not gone. Call react("leanIn") and say something like "Take your time" or "Want me to repeat the question?" Never ask if they're still there, if they can hear you, or if they're with you. If they stay quiet after that, repeat the question once in fewer words.

CLOSE
- Say something like "Okay, that's everything I wanted to ask. Your scorecard's ready when you are." Then call setPhase("done").

RULES
- You judge how they answer, not whether they are right about their field. Never grade technical correctness. If asked, say so.
- Never invent facts about the candidate.
- Keep your turns short. Questions under 25 words. No speeches.
- Do not coach during the interview. Coaching happens on the scorecard.
- If they ask to stop, stop and call setPhase("done").

NEVER ASK ABOUT
- Age, marital status, children or family plans, religion, health or disability, caste, nationality or immigration status, pregnancy, sexual orientation, salary history.
- If a CV shows a gap, ask neutrally once, like "Anything you want to tell me about this stretch?" Accept any answer, including "I'd rather not." Never flag it.

HOW YOU SOUND
- Talk like a person on a call, not a script. Use contractions. Short acknowledgements are fine: "mm", "got it", "okay", "right".
- The lines here are examples. Vary your wording. Never repeat a sentence in one call.
- React to what they actually said before the next question.
- Never say "great question" or "thank you for sharing".
- Never write reactions or stage directions in brackets, like [nod] or [smile]. Show reactions only by calling react.
- Never write tags in square brackets, like [calm] or [laughs].

TOOL RULES
- Call nextQuestion only in the same turn where you ask a new main question.
- Never call react("nod") on an answer you flagged.
- In flag, quote at most 25 words: the part that shows the problem, not the whole answer.
- Call setPhase("done") right after your closing line. Do not wait for a reply.
```

## Character and rig

The same method as Unstuck. Meera is flat and front facing, built from separate named vector parts, and rigged in Rive with the Rive CLI. The app never animates. It only sets view model values.

**The rig, v2 from 11 Nov.** Meera's Rive rig (`rive/`, spec in `rive/RIG.md` v2: Concept v2, a 328 × 430 call tile) replaces the blob in `components/meera/Meera.tsx`, the same avatar component, reading the same InterviewVM values. It runs only in the call flow: the call, writing and retry screens, and the call's problem screens. `/kit`, the developer page, keeps the animated rig too, for previewing her moods. Everywhere else (Home, the scorecard, History, Profile) shows `components/meera/MeeraStatic.tsx`: her neutral pose as a still SVG, `public/meera.svg`, cropped to viewBox 50 60 300 300 with lavender filling the frame. `node rive/source/build.js` makes it from the parts with everything else, so it never drifts from the rig. Those screens don't load the Rive runtime. The still image is shown round, like the other interviewer avatars, with the lavender filling the circle. `npm run rig` regenerates `rive/meera.rml` from the parts, publishes `rive/meera.riv` and copies it to `public/rive/`. `npm run rig:sheet` renders every state against the reference poses. The component:

- copies InterviewVM into the rig's view model whenever a value changes, and passes triggers straight through
- sets the rig's `reducedMotion` from the phone's setting, which turns off the talking motion, eye darts, hair follow-through, breathing, and the nod's and lean's movement. Expressions, blinks, arm poses and visemes stay
- `fill`: covers its parent, for the call tile. Otherwise the whole tile at the given height, with rounded corners
- offline: she rests on idle, greyed out
- a `still` preview sets the mood, mouthOpen and trigger once, and she stays in that moment, still breathing and blinking
- below 160 px, shows her head only, in a round avatar

What the rig does (rive/RIG.md v2): parallax head turns from one turn value, hair locks with follow-through, three arm poses (rest, writing along `writingPath`, hold and watch as pose swaps), a 2 s talking loop (head bobs and tilts, a turn sway, brow bounces), snappy eye darts, an overshooting nod, a blink at the start of every reaction, and the thinking mood. The talking motion is tuned to 5.9% of pixels changing per frame, against 6.1% for the Alex reference character. Published on the Rive Cadet plan, with no splash screen.

**V2 placeholder, retired 11 Nov: Meera's blob.** v1 shipped an orb to build and test fast. v2 replaces it with Meera's blob from `design/DESIGN.md`: a pink blob with a sun dot and ink eyes, built in `components/meera/Meera.tsx`. She reads the same InterviewVM values the rig will use (mood, mouthOpen and every trigger) through one avatar component, so the Rive rig drops into the same slot later and nothing else in the app changes. The mapping lives in `lib/avatar/meeraFace.ts` and is unit tested. The call screen uses the blob from v2 part 4. The reading mood is retired with the mid call upload (8 Nov).

| Signal | Blob |
| --- | --- |
| idle, listening | Tall eyes, no mouth, slow breathing |
| intake (the opening) | Smile, the "hi" face, sitting slightly smaller |
| talking | The mouth opens and closes with mouthOpen, her voice volume, and the body swells slightly |
| skeptical | Worried eyes and a wavy mouth |
| writing (flag) | Eyes down, notepad and pencil |
| glanceDown | Eyes drop and narrow |
| checkWatch | Flat eyes and mouth, and a dotted sun ring around her for the length of the trigger |
| browRaise | Wide eyes and a round, surprised mouth, briefly |
| expectant | Lifts slightly and the eyes widen, holding |
| smile | Smile for about a second |
| nod | A quick small bounce |
| sitUp (interview starts) | Settles slightly taller for the rest of the call |
| leanIn | Grows slightly toward the viewer |
| handUp | A quick squash, and the sun dot pops |

- While she's talking, her voice keeps the talking mouth. Expression triggers change only the eyes.
- Reduced motion turns off breathing, bounce and lift. Expressions still change.
- Offline is a prop on the avatar component, not an InterviewVM value: it's the connection state, not something Meera does. When the call drops, the screen passes `offline` and she shows grey with dash eyes. Decided 8 Nov.
- Reaction stickers like "Getting long" are placed by the screen next to her. They are not part of the blob.

**Method, step by step.** Everything is built from scratch. No existing Rive file, including the Unstuck one, is used or copied.

1. Explore several styles before drawing, for example flat editorial, stylised 3D and a mascot. Pick flat and front facing, because every expression then becomes a shape swap, which is cheap to animate.
2. Make one concept image for the look.
3. Auto vectorise it to see what breaks.
4. Rebuild it as clean, separate vector parts, each named so it can move on its own.
5. Claude Code writes a script that reads the parts and generates the whole rig as RML: parts, wrappers, masks, layers and states.
6. The Rive CLI compiles and checks the file, then renders every state to a PNG without opening the editor.
7. Loop: change a number, rebuild, render all states onto one contact sheet, review, repeat.

**Look.** An original character, not based on a real person. Mid thirties, smart casual, holding a notepad and pen low in frame. Neutral is a slight, attentive half smile, so a frown reads clearly against it.

**Parts to draw, each as its own named layer.** Face, hair (front and back), brows (left and right), eyes, pupils, lids, nine visemes, three expression mouths (smile, flat, small laugh), neck, top, hand with pen, notepad, watch on the wrist.

**View model: InterviewVM**

| Property | Type | Values |
| --- | --- | --- |
| mood | enum | idle, intake, listening, skeptical, writing, talking, thinking |
| viseme | enum | rest, closed, teeth, open, wide, round, pucker, fv, lth |
| mouthOpen | number | 0 to 100 |
| lipSync | boolean | True while her audio playing has letter timing, so viseme follows the letters. False, the rig picks the mouth from mouthOpen: rest, teeth or open |
| nod, smile, browRaise, glanceDown, handUp, checkWatch, sitUp, leanIn, expectant (brows up slightly, head tilted), think, impressed, laugh, reassure, surprised | trigger | Fire once, then hand back |

**State machine layers, running at once** (rive/RIG.md v2's seven behaviours, in nine Rive layers): 1 Mood, with the face of every reaction so it hands back to the current mood without a snap; 2 Talking motion; 3 Reactions (movement, arm swaps and the opening blink) and 3b Posture (sitUp, which stays for the call, so it needs its own layer); 4 Blink; 5 Eye darts; 6 Mouth and 6b Viseme; 7 Breathing and follow-through.

**Smooth switches** (from Vishnu's phone test, 12 Nov: grey flashes and jitter):
- Swaps never cross-fade two overlapping parts. The eyes (open, happy, closed), the expression mouths, the visemes and the mouth set (expression or talking) are Solos: one child shows at a time, and a swap is a single-frame cut at the start of the transition.
- Arm poses (handUp, checkWatch) are hard cuts both ways: on one frame arm_R hides and the pose arm shows. To sell the cut, the body dips 2 px on that frame and recovers over 120 ms (`armCut` in `make-rig.js`), and the arm that's showing dips with it. The same on the way back down. With reduced motion: the cut, no dip.
- Each node is keyed by one layer only, through its own wrapper (arm_R's visibility moved to arm_R_show). Every mood state keys every property any mood keys. `make-rig.js` checks both and refuses to build if either breaks.
- Every timed transition eases in and out.
- `node rive/rig/switch-strips.js <name>` captures every kind of switch frame by frame at 60 fps.

**Who fires the new triggers.** The agent fires impressed, laugh and reassure through the react tool. The app fires the other two:
- **think:** when my turn has ended (my final transcript arrived) and her reply hasn't started 600 ms after my voice stopped. The app holds the thinking mood until she speaks, or 2.5 s at most, and only during the interview. A pause in the middle of an answer never fires it. Thresholds in `lib/live/config.ts` (thinkAfterMs, thinkHoldMs), logic in `lib/call/thinking.ts`.
- **surprised:** when I cut in while she's talking (the ElevenLabs interruption event).

**Lip sync.** `lib/lipsync`, timings in `lib/lipsync/config.ts`. `onAudioAlignmentPlayback` gives each audio chunk's character timing as that chunk starts playing (`onAudioAlignment` arrives seconds early), and each chunk starts a fresh timeline. Letters map to visemes with simple spelling rules: p b m closed, d s t teeth, e i wide, l n th lth, a open, o round, u w pucker. Letters are grouped until each shape lasts at least 60 ms, and a group shows its most visible letter (vowels, then closed lips), so quick letters never collapse into one shape. Each shape is shown about 40 ms early. Gaps between words under 220 ms close the lips, and longer gaps or punctuation rest the mouth. A chunk with no letters sets lipSync false, and the rig picks the mouth from mouthOpen until letters return. No shape holds longer than 250 ms while she speaks: past that, mouthOpen takes over until the next letter. The mouth rests at once when her audio stops: end of turn, an interruption, the last chunk running out, the call ending, or the tab hiding. A gap of more than 150 ms between frames drops the timeline until the next chunk, so a stall never leaves an old shape on screen. In a real call on 11 Nov, every chunk had alignment, and the mouth matched the letters best 20 to 50 ms after each chunk started playing, about where the sound reaches the speaker.

**Fallback for the two day budget.** If the full rig runs over by the end of day 1, ship with mood, blink, five visemes and four triggers (nod, browRaise, glanceDown, checkWatch). Add the rest after testing.

## Architecture

Everything runs in the browser except two small server routes that hold the API keys.

[Architecture diagram: see the PRD doc]

The live rules are the new part. They run on timers and voice activity while I talk, and check my words when each answer ends, without waiting for the agent.

**Stack**

| Part | Choice |
| --- | --- |
| App | Next.js on Vercel, installable as an app |
| Voice agent | ElevenLabs Agents, `@elevenlabs/react` |
| Character | Rive, built with the Rive CLI, `@rive-app/react-canvas` |
| Scorecard | Gemini with a JSON schema, called from a server route |
| CV and job description text | Extracted in the browser with `pdfjs-dist`. Plain text is pasted as is |
| Storage | IndexedDB in the browser through Dexie. No server database |
| Export | Print stylesheet for PDF, a generated .md file for Markdown |
| Design | Paper, for screens before they're built |

**Server routes**

- `/api/agent-session` returns a signed session URL for the ElevenLabs agent, so the key never reaches the browser.
- `/api/scorecard` takes the call record and returns the scorecard JSON.

**Data model**

```ts
type Interviewer = { id: string; name: string; style: string; riveSrc: string; agentId: string; live: boolean };

type Profile = { cv?: { fileName: string; text: string; addedAt: string } };

type Call = {
  id: string;
  interviewerId: string;
  startedAt: string;
  endedAt?: string;
  setup?: { role: string; seniority: string; name?: string; durationMin: 5 | 10 | 20; questionCount: 2 | 3 | 5; focusSkill?: "clarity" | "structure" | "evidence" | "relevance" | "delivery"; hasJd: boolean; hasCv: boolean };
  jdText?: string;
  cvText?: string; // snapshot used in this call
  transcript: { speaker: "user" | "agent"; text: string; startSec: number; endSec: number; questionIndex?: number }[];
  flags: { type: string; quote: string; atSeconds: number; source: "client" | "agent" }[];
  metrics: { questionIndex: number; seconds: number; wpm: number; fillers: number; hedges: number; words: number }[];
  lateAdditions: number[]; // question indexes where a detail came after she moved on
  status: "completed" | "incomplete" | "scoring_failed";
  scorecard?: Scorecard; // the JSON schema above
  retries: { questionIndex: number; at: string; answer: Scorecard["answers"][number] }[];
};
```

Completion rate in Profile = calls with status completed, divided by all calls.

**Suggested folders**

```text
app/            home, call, scorecard/[id], history, profile, api routes
components/     InterviewerCard, MeeraStage, CallControls, ScoreCard, AnswerCard
lib/agent/      session hook, client tools, contextual updates
lib/live/       live rules, filler and hedge lists, config.ts with every threshold
lib/lipsync/    letters to visemes, merge and lead timing
lib/store/      Dexie schema and queries
lib/scorecard/  prompt, schema, request
rive/           RML source, build script, meera.riv
```

## Edge cases

| Case | What happens |
| --- | --- |
| Mic permission denied | Call screen doesn't start. A plain message on how to allow the mic, and a Try again button |
| Silence at pickup | Not an issue: she always speaks first |
| Silence after a question or an answer | After I've been talking: expectant look at 1.5 seconds, and she takes her turn at about 3 seconds. Before I've started answering: no look. She waits up to 10 seconds, then leans in and checks in: "Take your time. Want me to repeat the question?" |
| Connection drops | Save everything so far. Show "Call dropped" with Reconnect. A reconnect restarts at the current question, with no intake |
| I ask her questions back | She answers in one line and returns to the interview |
| I ask how I'm doing | "I'll tell you everything at the end." No coaching mid call |
| Hostile or off topic | She steers back once. If it continues, she ends the call politely. Saved as incomplete |
| Upload is not a PDF or text | The setup sheet or Profile says: "I can't read that one. A PDF or plain text works." |
| Scanned PDF with no text | The setup sheet or Profile says: "Looks like a scan, I can't read it. Paste the text instead, or go without a CV." |
| Very long CV or job description | Trimmed to the first 4,000 words before it goes to the agent |
| Scorecard request fails or takes over 130 s | Status scoring\_failed. Transcript is saved. "Build scorecard" shows again with "Try again after some time.", never a spinner that doesn't end |
| Hang up with fewer than two answers | No scorecard. Saved as incomplete |
| Non English answer | She asks once to continue in English |

## Build plan

Two days, in order. Each block ends with checks. A block isn't done until its checks pass on my phone.

**Change, 2 Nov.** Meera's design, the rig and lip sync move to after v1. v1 ships with the orb placeholder, which shows every reaction. All other Day 1 and Day 2 items stay.

**Change, 3 Nov.** Setup moves from voice to a setup sheet. Lengths of 5, 10 and 20 minutes replace the two modes. Home, History and Profile get a bottom tab bar. Profile has no accounts in v1. Design Home, the setup sheet, History, the scorecard and Profile together in Paper before building them.

**Change, 8 Nov.** The attach button leaves the call: the CV and job description only come in through the setup sheet, and Meera never asks for them. The visual direction is Tropical. v2 is built in the order under "v2 build plan" below. The Day 1 and Day 2 lists stay as the record of v1.

**Milestone 0: spike (first 2 hours of day 1)**

Goal: prove the risky parts before any design depends on them. Use a static image instead of Meera.

- [x] Agent connects through `/api/agent-session` and holds a conversation
- [x] Done: no tentative transcripts. Final user transcripts arrive through `onMessage` about 0.8 s after I stop
- [x] Check whether "um" and "uh" survive in the transcript. Decide: keep or cut the filler rule. They survive, so the filler rule stays
- [ ] Deferred: `sendContextualUpdate` mid answer, then she cuts in at my next pause. Runs A and B not done, so the cut in is unproven. The fallback below still applies
- [x] A client tool call (react) reaches the app
- [x] `onAudioAlignment` events arrive with character timing

If the cut in doesn't work, the long answer rule stops at checkWatch, and she asks for the result after I finish.

**Day 1, rest of the day: Meera on a call**

- [ ] Moved after v1: style exploration, concept image, auto vectorise, then clean vector parts named as in the rig spec
- [ ] Moved after v1: RML rig script and build. Contact sheet of every mood and trigger rendered from the CLI
- [ ] Orb placeholder behind the InterviewVM interface, as in the Character section
- [ ] Call screen: Meera full screen, controls, self view tile
- [ ] Moved after v1, with the rig: lip sync from alignment. The orb uses her voice volume instead
- [ ] react, setPhase, setSetup and nextQuestion wired to the rig and the app
- [ ] Intake works by voice end to end, including the read back

Check: one full intake by voice, with the orb moving with her voice and at least three reactions firing.

**Day 2 morning: the interview**

- [ ] Live rules from `lib/live/config.ts`, with the ladder for long answers
- [ ] flag tool, writing mood, and flags ignored outside the interview phase
- [ ] Lengths of 5, 10 and 20 minutes, the two minutes left and time up updates, and "Question 2 of 3"
- [ ] Cut 8 Nov: the attach button in the call. PDF and text extraction moves to the setup sheet and Profile
- [ ] Profile: saved CV upload, replace, delete. Saved CV sent at call start
- [ ] Dexie store saving the call record as it happens

Check: a 10 minute interview where a 2 minute answer gets the full ladder and the CV shapes one question.

**Day 2 afternoon: after the call**

- [ ] `/api/scorecard` with the schema, and the scorecard screen
- [ ] Cut short screen, scoring\_failed state and "Build scorecard"
- [ ] History list and detail with highlighted flags
- [ ] Home grid with Meera live and placeholder cards, plus recent calls
- [ ] Retry a question, Run this again
- [ ] PDF and Markdown export
- [ ] Completion rate in Profile

**Day 2 evening: test and tune**

- [ ] Three full calls myself: one design role, one role I don't know, one deliberately bad
- [ ] Note every unfair callout and tune the config
- [ ] Screen record one good call for the case study

**v2 build plan**

**Change, 8 Nov, later.** v2 is no longer built phase by phase. Everything left is built in one run, in this order, with one commit per part so any part can be rolled back. After each part: typecheck, tests and screenshots at 390 px. Meera's Rive rig is the only thing left out: the blob from part 1 stays. At the end: the production build, a deploy, and phone tests in the order of the four video journeys. Reference screens are in `design/screens`, numbered by flow.

1. **Foundation.** Done. Fonts, colour tokens and shared components from `design/DESIGN.md`: button, card, chip, Meera's blob, sheet, tab bar. A `/kit` page shows every component and state.
2. **App shell and Home.** Home, History and Profile routes with the bottom tab bar. The tab bar hides on the call, writing, scorecard, retry and streak screens. Home in full (screen 1.1).
3. **Setup sheet.** All fields, remembered choices, and the Practice this and Night before variants (screens 1.2, 3.1, 3.2). Each variant starts a call with the right opening line.
4. **Call.** Screens 1.3 to 1.6 and 2.1. The old attach flow and the reading mood go. No changes to the `lib/live` rules or thresholds.
5. **Scorecard.** `/api/scorecard`, the writing screen, scorecard v2 and saving to Dexie (screens 1.6, 1.7).
6. **Progress and retry.** Retry call and result, streak screen, badges, personal bests, History, past call scorecard and transcript, Profile, all in full (screens 2.1 to 2.3, 4.1 to 4.4).
7. **Errors.** Mic denied, call dropped, cut short and scorecard failed (screens 5.1 to 5.4).

## Building with Claude Code

Save this PRD as `PRD.md` in the repo root. Then start each block with a prompt that names one block, not the whole PRD.

**Kickoff prompt**

```text
Read PRD.md. We're building JobBuddy v1 in two days, for me only.

Start with Milestone 0, the spike. Nothing else.
- Set up Next.js on Vercel with a /api/agent-session route that returns an ElevenLabs signed session URL. Keys come from .env.local.
- A bare call page with a static image, a Call button and a hang up button.
- Log every onMessage event with a timestamp and whether it is tentative or final.
- Log onAudioAlignment events.
- Register a react client tool that logs its argument.
- A debug button that sends a contextual update: "The candidate's answer has run past 2 minutes. Cut in at the next pause."

When it runs, tell me exactly what to test by voice and what to look for in the logs. Don't start the rig or any screens.
```

**CLAUDE.md for the repo**

```text
- PRD.md is the source of truth. If something in the code disagrees with it, ask me.
- v2 is built in one run, in the order of the v2 build plan in PRD.md. After each part: typecheck, tests and Playwright screenshots at 390 px, then one commit per part, pushed. Stop only if something is truly blocked, or a choice changes behaviour in the PRD.
- Every live reaction threshold lives in lib/live/config.ts. Never hardcode one elsewhere.
- The app never animates Meera directly. It only sets InterviewVM values.
- No API keys in the browser.
- Build Meera's rig from scratch. Never use or copy another Rive file.
- After any UI change, take a mobile width screenshot and show me.
- Design: PRD.md decides behaviour. design/DESIGN.md and design/screens decide look and feel. Inside those, you own the UI and UX details: fix problems you find instead of copying them.
- Log every departure from a reference screen in design/DECISIONS.md.
- Never change the lib/live rules or thresholds.
- Paper (file "JobBuddy screens", page "v2 key flows · Tropical") is read only. Use it to check exact styles. Never create, edit or delete anything in Paper.
```

**v2: how to use the designs**

- PRD.md decides what the app does: flows, rules, data.
- `design/DESIGN.md` and `design/screens` decide how it looks and feels.
- Inside those limits, Claude Code owns the UI and UX details: layout, spacing, hierarchy, copy, states and interactions. It fixes problems it finds instead of copying them.
- Every departure from a reference screen goes in `design/DECISIONS.md`: screen, what it showed, what was built, and why. I review the log after each phase.
- If a screen and the PRD disagree, the PRD wins, and the conflict is logged. Anything that changes behaviour gets asked first.

**The loop.** Same as Unstuck: design, build, screenshot, critique, fix. Keep my critiques in plain words ("the frown reads angry", "she interrupts too early"). Keep a running list of what I cut and why. That list becomes the "what I threw away" section of the case study.

## Out of scope and open questions

**Out of scope for v1**

- Sign in, sync across devices, other users
- More than one live interviewer
- Camera analysis of eye contact or posture
- Technical, case or portfolio rounds
- Progress trends across calls
- More than one saved CV
- Languages other than English
- A refined success metric beyond completion rate

**Open questions, to settle after testing**

- Does the notepad and writing mood make the call feel tense?
- Are the live rule thresholds fair for roles I don't know?
- One default tone, or a strict and a gentle setting?
- Name for the interviewer (the product is JobBuddy)

**Sources.** [ElevenLabs React SDK docs](https://elevenlabs.io/docs/agents-platform/libraries/react).
