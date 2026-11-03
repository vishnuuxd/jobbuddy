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

## Screens and flows

Six screens: Home, the setup sheet, Call, Scorecard, History and Profile. Home, History and Profile sit in a bottom tab bar. Mobile web, installable as an app, same as Unstuck. No sign in: everything is stored in the browser on my device.

**Home**

- A grid of interviewer cards. Each card: Meera's orb for now, her name and a one line style ("Meera · HR screen · direct, fair").
- Meera is the only live card. Two or three placeholder cards say "Not taking calls yet" and can't be tapped.
- Tapping Meera opens the setup sheet.
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

- Meera full screen. A small self view camera tile in the corner, off by default, one tap to turn on.
- Controls: mute, attach (CV or job description), camera, hang up.
- A small progress label once the interview starts: "Question 2 of 5". No timer.
- While the scorecard is being built: Meera's face stays on screen with "Writing up your scorecard" and her writing mood.

**Scorecard**

- Summary card on top: the pattern, the strongest answer, the one thing to practice, and delivery numbers.
- One card per answer underneath (see the Scorecard section).
- Actions: Retry a question, Run this again, Save as PDF or Markdown.
- Cut short screen instead, if fewer than two answers were given.

**History**

- At the top, the completion rate: "7 of 9 interviews completed".
- Every past call, newest first: interviewer, role and seniority, length, date, summary line.
- Tap to open the scorecard and the full transcript, with flagged moments highlighted.
- Delete a call by swiping or from its menu.

**Profile**

- Saved CV: upload, replace, delete. Shows file name and the date it was added. The setup sheet uses it automatically.
- Delete all data.
- The completion rate.
- No accounts in v1. The tab looks and works like the other two. Google sign in comes later, when the link is shared with others.

## Call behavior

The call has three phases: opening, interview and close. The app tracks the phase. Flags only count during the interview.

**Opening.** The app speaks her first line, built from the sheet, through the first message override. Keep it short, like a real interviewer. The app picks one at random:

- With a CV or job description: "Hi Vishnu, I'm Meera. Ten minute screen for the senior product designer role. I've seen your CV. Ready?"
- Without: "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role today. Shall we start?"
- No name given: "Hi, I'm Meera." in place of "Hi Vishnu, I'm Meera."

The setup also goes to her as a contextual update at connect. When I say I'm ready, she sits up, the phase moves to interview, and she asks the first question.

**Interview**

| Length | Main questions | Shape |
| --- | --- | --- |
| 5 min, Quick | 2 | Opener on background, one behavioral |
| 10 min, Standard (default) | 3 | Opener on background, one behavioral, why this role |
| 20 min, Full | 5 | Opener on background, three behavioral, why this role |

At one minute left, the app sends a contextual update and she closes after the current question. The 1200 s call limit in ElevenLabs stays as the hard stop.

- Questions come from the job description if there is one, otherwise from the usual competencies for that role and seniority.
- With a CV, at least one question is specific to it.
- Each question can have one follow up from her. Follow ups don't count toward the total.

**Close.** "Okay, that's everything I wanted to ask. Your scorecard's ready when you are." Phase moves to done, the call ends, and the scorecard is built.

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
    "pattern": "string, one sentence, the main weakness across answers",
    "strongest": { "questionIndex": "number", "why": "string" },
    "practiceNext": "string, one sentence"
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
        "atSeconds": "number"
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

One ElevenLabs agent. Pick a calm, warm voice with a natural pace. Turn settings: eagerness Patient, take turn after silence 10 s, end conversation after silence 20 s, max duration 1200 s, with the message "We're out of time for today. Your scorecard's ready when you are." First message override is on in Security, because the app writes her opening line. The system prompt is below. Context such as the saved CV, uploaded files and live rule events arrives through `sendContextualUpdate`.

**Client tools.** Configure them in the ElevenLabs dashboard with these exact names. None of them block the conversation.

| Tool | Parameters | What the app does |
| --- | --- | --- |
| react | name: nod, smile, browRaise, glanceDown, handUp, checkWatch, sitUp, leanIn | Fires that trigger on the rig |
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

INTERVIEW
- Call setPhase("interview") and react("sitUp"), then ask the first question with no extra preamble.
- Ask the number of main questions in the setup. 2: an opener on their background, then one behavioral question. 3: an opener, one behavioral question, then why this role. 5: an opener, three behavioral questions, then why this role.
- If you receive a context update saying about a minute is left, finish the current question and close. Never start a new main question then.
- Base behavioral questions on the job description. With none, use the usual competencies for this role and seniority. With a CV, make at least one question specific to it.
- Call nextQuestion before each main question. You may ask one follow up per question.
- If a story ends with no result, ask something like "So how did that turn out?"
- If they answer a different question, steer back once.
- Call flag for anything worth putting on the scorecard, with the type and their exact words.
- Call react("nod") when an answer lands.
- If you receive a context update saying an answer is running long, cut in at the next pause with one short sentence, like "Sorry, let me jump in. How did it end up?" Then let them continue.
- If they start talking again after you've moved on: for a short addition, acknowledge it in a few words and ask your question again. If they restart the whole story, let it run briefly, then redirect once, like "Let's hold that, I want to get to the next one", and flag it as rambling.
- If they say nothing for a while after your question, call react("leanIn") and check in with something like "Take your time. Want me to repeat the question?" Never say "You still there?"

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

TOOL RULES
- Call nextQuestion only in the same turn where you ask a new main question.
- Never call react("nod") on an answer you flagged.
- In flag, quote at most 25 words: the part that shows the problem, not the whole answer.
- Call setPhase("done") right after your closing line. Do not wait for a reply.
```

## Character and rig

The same method as Unstuck. Meera is flat and front facing, built from separate named vector parts, and rigged in Rive with the Rive CLI. The app never animates. It only sets view model values.

**V1 placeholder: the orb.** Meera's design moves to after v1. Until then, an animated orb, similar to a voice mode orb, stands in. It reads the same InterviewVM values the rig will use: mood, mouthOpen and every trigger. Build it as one avatar component behind that interface, so the Rive rig drops into the same slot later and nothing else in the app changes. Tests with the orb check the timing of reactions, not how they feel. That needs the face.

| Signal | Orb |
| --- | --- |
| talking | Wobbles and swells with her voice volume (mouthOpen) |
| listening, idle | Slow, calm breathing |
| intake | Softer and slightly smaller |
| sitUp (interview starts) | Firms up: crisper edge, slightly bigger |
| nod | A quick small bounce |
| expectant | Lifts slightly and brightens, holding |
| browRaise | A small sharp pulse |
| glanceDown, reading | Dims and shrinks a little |
| checkWatch | A ring sweeps once around the edge |
| writing (flag) | A subtle ripple |
| leanIn | Grows slightly toward the viewer |
| handUp, smile, skeptical | A matching variation of the above; keep each one distinct |

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
| mood | enum | idle, intake, listening, skeptical, writing, reading, talking |
| viseme | enum | rest, closed, teeth, open, wide, round, pucker, fv, lth |
| mouthOpen | number | 0 to 100 |
| nod, smile, browRaise, glanceDown, handUp, checkWatch, sitUp, leanIn, expectant (brows up slightly, head tilted) | trigger | Fire once, then hand back |

**State machine layers, running at once.** Mood (breathing, posture, head drift), reactions, blink on its own timer, mouth, jaw.

**Lip sync.** Same pipeline as Unstuck. `onAudioAlignment` gives character timing. Letters map to visemes with simple spelling rules. Shapes under 60 ms are merged. Each shape is shown about 40 ms early. Tiny gaps between words close the lips, and real pauses rest the mouth.

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
  setup?: { role: string; seniority: string; name?: string; durationMin: 5 | 10 | 20; questionCount: 2 | 3 | 5; hasJd: boolean; hasCv: boolean };
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
| Upload is not a PDF or text | "I can't read that one. A PDF or plain text works." |
| Scanned PDF with no text | "Looks like a scan, I can't read it. Want to just tell me about your experience?" |
| Upload mid answer | Held until my answer ends, then she glances down to read it |
| Very long CV or job description | Trimmed to the first 4,000 words before it goes to the agent |
| Scorecard request fails | Status scoring\_failed. Transcript is saved. History shows "Build scorecard" |
| Hang up with fewer than two answers | No scorecard. Saved as incomplete |
| Non English answer | She asks once to continue in English |

## Build plan

Two days, in order. Each block ends with checks. A block isn't done until its checks pass on my phone.

**Change, 2 Nov.** Meera's design, the rig and lip sync move to after v1. v1 ships with the orb placeholder, which shows every reaction. All other Day 1 and Day 2 items stay.

**Change, 3 Nov.** Setup moves from voice to a setup sheet. Lengths of 5, 10 and 20 minutes replace the two modes. Home, History and Profile get a bottom tab bar. Profile has no accounts in v1. Design Home, the setup sheet, History, the scorecard and Profile together in Paper before building them.

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
- [ ] Lengths of 5, 10 and 20 minutes, the one minute left update, and "Question 2 of 3"
- [ ] Attach button: PDF and text extraction, context update, glanceDown and reading mood
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
- Work one build plan block at a time. Stop at the block's checks and tell me how to verify them.
- Every live reaction threshold lives in lib/live/config.ts. Never hardcode one elsewhere.
- The app never animates Meera directly. It only sets InterviewVM values.
- No API keys in the browser.
- Build Meera's rig from scratch. Never use or copy another Rive file.
- After any UI change, take a mobile width screenshot and show me.
```

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
