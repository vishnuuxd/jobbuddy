"use client";

import { useConversation } from "@elevenlabs/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Meera, type MeeraStill } from "@/components/meera/Meera";
import { SelfView } from "@/components/SelfView";
import { Button } from "@/components/ui/Button";
import { CallControl, CallPill, ProgressSegments, QuestionCard } from "@/components/ui/CallParts";
import { Tag } from "@/components/ui/Chip";
import { CameraIcon, CheckIcon, CloseIcon, MicIcon } from "@/components/ui/icons";
import { createClientTools } from "@/lib/agent/clientTools";
import { createInterviewVM, type Trigger } from "@/lib/avatar/interviewVM";
import { callCopy, type CallStage } from "@/lib/call/callCopy";
import { hangUpReason } from "@/lib/call/close";
import { callConfig } from "@/lib/call/config";
import {
  lastQuestionAsked,
  nearlyUpUpdate,
  resumeFirstLine,
  resumeUpdate,
  retryFirstLine,
  retryUpdate,
  setupUpdate,
  timeUpUpdate,
} from "@/lib/call/context";
import { timeLimitSteps } from "@/lib/call/timeLimit";
import { stripVoiceTags } from "@/lib/call/voiceTags";
import { openingLine } from "@/lib/call/opening";
import { clearPendingCall, readPendingCall, setPendingCall, type PendingCall } from "@/lib/call/pending";
import { answeredQuestions, createCallSession, toCallRecord, totalQuestions } from "@/lib/call/session";
import { useSelfView } from "@/lib/call/useSelfView";
import { useVoiceVolume } from "@/lib/call/useVoiceVolume";
import { createLipSync } from "@/lib/lipsync/player";
import { liveConfig } from "@/lib/live/config";
import { createLiveRules } from "@/lib/live/rules";
import { buildScorecard, scoreRetry } from "@/lib/scorecard/request";
import { nextCallNumber } from "@/lib/home/callName";
import { getCall, listCalls, saveCall } from "@/lib/store/db";
import type { Call } from "@/lib/store/types";
import styles from "./call.module.css";

type Problem = "mic" | "failed" | "noSetup" | "dropped" | "cutShort" | "scoreFailed" | null;
type Reaction = { text: string; tone: "lime" | "pink" | "white" } | null;

const saveEveryMs = 1_000;
// How long a reaction sticker and the "checks the time" moment stay up. Display timing only.
const stickerMs = 2_600;
const watchingMs = 8_000;

const stickers: Partial<Record<Trigger, Reaction>> = {
  nod: { text: "Nice, keep going", tone: "lime" },
  checkWatch: { text: "Getting long", tone: "pink" },
};

function createCall() {
  const vm = createInterviewVM();
  const session = createCallSession(vm, liveConfig);
  const sendRef: { current: (text: string) => void } = { current: () => {} };
  const rules = createLiveRules(session, (text) => sendRef.current(text), liveConfig);
  return { vm, session, rules, sendRef, lips: createLipSync(vm), clientTools: createClientTools(session) };
}

const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export function CallScreen() {
  const router = useRouter();
  const [{ vm, session, rules, sendRef, lips, clientTools }] = useState(createCall);
  const call = useSyncExternalStore(session.subscribe, session.get, session.get);
  const [stage, setStage] = useState<CallStage>("connecting");
  const [problem, setProblem] = useState<Problem>(null);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(null);
  const [watching, setWatching] = useState(false);
  const [endedAfterMs, setEndedAfterMs] = useState(0);
  const inCallRef = useRef(false);
  const hangingUp = useRef(false);
  const herTurnStartedAt = useRef(0);
  const herLastLineAt = useRef(0);
  const herVoiceStoppedAt = useRef(0);
  const pendingRef = useRef<PendingCall | null>(null);
  const autoStarted = useRef(false);
  const savedCall = useRef<Promise<unknown>>(Promise.resolve());
  const resumeRecord = useRef<Call | null>(null);
  const callNumber = useRef<number | undefined>(undefined);
  const [callId, setCallId] = useState<string | null>(null);
  const selfView = useSelfView();

  function setSessionOpen(open: boolean) {
    inCallRef.current = open;
    setInCall(open);
  }

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      const pending = pendingRef.current!;
      const texts = { cvText: pending.cvText, jdText: pending.jdText };
      if (pending.resume && resumeRecord.current) {
        const record = resumeRecord.current;
        session.resume(record);
        const last = lastQuestionAsked(record.transcript);
        conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
        conversation.sendContextualUpdate(resumeUpdate(last.question, last.text));
      } else if (pending.retry) {
        session.startRetry(crypto.randomUUID(), pending.setup, pending.retry, texts);
        conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
        conversation.sendContextualUpdate(retryUpdate(pending.retry.question));
        showReaction({ text: "Go on, land it", tone: "lime" });
      } else {
        session.start(crypto.randomUUID(), pending.setup, texts, callNumber.current);
        conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
        showReaction({ text: "Hi there!", tone: "white" });
      }
      setSessionOpen(true);
      setStage("live");
    },
    onDisconnect: (details) => {
      rules.finish();
      lips.stop();
      const state = session.get();
      const answered = answeredQuestions(state);
      setEndedAfterMs(Date.now() - state.startedAtMs);
      setSessionOpen(false);
      selfView.stop();

      if (state.retryOf) {
        // A retry is scored if I answered. Otherwise it was a false start.
        if (answered >= 1) setStage("writing");
        else router.replace(`/scorecard/${state.retryOf.callId}`);
        return;
      }
      if (state.id) {
        savedCall.current = saveCall(toCallRecord(state, new Date().toISOString()));
        setCallId(state.id);
      }
      // A real drop offers Reconnect. Otherwise two answers make a scorecard, and fewer is cut short.
      if (details.reason === "error" && state.phase !== "done") setProblem("dropped");
      else if (state.phase === "done" || answered >= 2) setStage("writing");
      else setProblem("cutShort");
    },
    onModeChange: ({ mode }) => {
      if (mode === "speaking") {
        herTurnStartedAt.current = Date.now();
        rules.herTurn();
      } else {
        herVoiceStoppedAt.current = Date.now(); // Her audio finished playing.
        lips.stop(); // Her next turn starts on the mouthOpen fallback until letters arrive.
      }
      session.setSpeaking(mode === "speaking");
    },
    onVadScore: ({ vadScore }) => rules.vad(vadScore),
    onInterruption: () => {
      lips.stop();
      rules.interruption();
    },
    // Lip sync: each chunk's letter timing, as that chunk starts playing.
    onAudioAlignmentPlayback: ({ alignment }) => lips.chunk(alignment),
    onMessage: ({ role, message }) => {
      if (role === "user") {
        session.noteUserMessage();
        session.addTranscript("user", message, Date.now());
        rules.userMessage(message);
      } else {
        herLastLineAt.current = Date.now();
        // Voice tags like "[calm]" never reach the caption, the transcript or the scorecard.
        const text = stripVoiceTags(message);
        if (text) session.addTranscript("agent", text, herTurnStartedAt.current || Date.now());
      }
    },
    onError: (message) => {
      console.warn("Call error", message);
      if (!inCallRef.current) setProblem("failed");
    },
  });

  useVoiceVolume(vm, conversation.getOutputVolume, inCall);
  useEffect(() => {
    if (!inCall) return;
    let frame = requestAnimationFrame(function tick() {
      lips.tick();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [inCall, lips]);
  sendRef.current = conversation.sendContextualUpdate;

  function scoreFailed() {
    setProblem("scoreFailed");
  }

  function showReaction(next: Reaction) {
    setReaction(next);
  }
  useEffect(() => {
    if (!reaction) return;
    const timer = setTimeout(() => setReaction(null), stickerMs);
    return () => clearTimeout(timer);
  }, [reaction]);

  // Reaction stickers and the "checks the time" moment follow InterviewVM triggers. Reading only.
  useEffect(
    () =>
      vm.onTrigger((name) => {
        const sticker = stickers[name];
        if (sticker) setReaction(sticker);
        if (name === "checkWatch") setWatching(true);
      }),
    [vm],
  );
  useEffect(() => {
    if (!watching) return;
    const timer = setTimeout(() => setWatching(false), watchingMs);
    return () => clearTimeout(timer);
  }, [watching]);

  // A retry: score the new answer and save it under the original call, then show the before and after.
  const retryTranscript = useRef<typeof call.transcript>([]);
  function scoreThisRetry() {
    const state = session.get();
    const retry = pendingRef.current?.retry;
    if (!state.retryOf || !retry) return;
    if (state.transcript.length) retryTranscript.current = state.transcript;
    void scoreRetry(retry.callId, retry.questionIndex, retry.question, retryTranscript.current).then((saved) => {
      if (saved) {
        clearPendingCall();
        router.replace(`/scorecard/${retry.callId}/retry/${retry.questionIndex}?fresh=1`);
      } else scoreFailed();
    });
  }
  useEffect(() => {
    if (stage === "writing" && call.retryOf) scoreThisRetry();
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Writing: build the scorecard once the call is saved, then open it.
  useEffect(() => {
    if (stage !== "writing" || !callId || call.retryOf) return;
    let cancelled = false;
    void savedCall.current.then(async () => {
      const result = await buildScorecard(callId);
      if (cancelled) return;
      if (result?.status === "completed") router.replace(`/scorecard/${callId}?fresh=1`);
      else scoreFailed();
    });
    return () => {
      cancelled = true;
    };
  }, [stage, callId]); // eslint-disable-line react-hooks/exhaustive-deps

  // The rules run on a timer, and the record saves as the call goes. A retry isn't a call record.
  useEffect(() => {
    if (!inCall) return;
    const rulesTimer = setInterval(rules.tick, 200);
    const saveTimer = setInterval(() => {
      if (!session.get().retryOf) void saveCall(toCallRecord(session.get()));
    }, saveEveryMs);
    return () => {
      clearInterval(rulesTimer);
      clearInterval(saveTimer);
    };
  }, [inCall, rules, session]);

  // The app owns the time limit. Two minutes left: no new main question. At the chosen
  // length: close now. 60 s after that, if she still hasn't called setPhase("done"),
  // the app ends the call itself, as complete. Retry calls have none of this.
  useEffect(() => {
    const setup = session.get().setup;
    if (!inCall || !setup || session.get().retryOf) return;
    const timers = timeLimitSteps(setup.durationMin, callConfig).map(({ atMs, step }) =>
      setTimeout(() => {
        if (session.get().phase === "done") return; // She's already closing.
        if (step === "nearlyUp") conversation.sendContextualUpdate(nearlyUpUpdate);
        else if (step === "timeUp") conversation.sendContextualUpdate(timeUpUpdate);
        else {
          console.warn("Call ended by the app: no setPhase(done) 60 s after time was up");
          session.setPhase("done"); // Complete, not incomplete: they did nothing wrong.
          conversation.endSession();
        }
      }, atMs),
    );
    return () => timers.forEach(clearTimeout);
    // sendContextualUpdate and endSession stay valid for the whole call.
  }, [inCall]); // eslint-disable-line react-hooks/exhaustive-deps

  // After setPhase("done"): hang up 1 second after her closing line has actually been heard.
  // Safety caps, counted from setPhase("done"): end anyway if her audio hasn't started
  // within 3 seconds, or hasn't finished within 15.
  const callEnding = inCall && call.phase === "done";
  useEffect(() => {
    if (!callEnding) return;
    const doneAt = Date.now();
    const timer = setInterval(() => {
      const reason = hangUpReason(
        {
          doneAt,
          speaking: session.get().speaking,
          lastLineAt: herLastLineAt.current,
          voiceStartedAt: herTurnStartedAt.current,
          voiceStoppedAt: herVoiceStoppedAt.current,
          now: Date.now(),
        },
        callConfig.hangUpAfterHerVoiceMs,
        liveConfig.endCallMaxWaitMs,
      );
      if (reason) {
        if (reason !== "spoken") console.warn(`Call ended by the safety cap: ${reason}`);
        clearInterval(timer);
        conversation.endSession();
      }
    }, 100);
    return () => clearInterval(timer);
    // endSession stays valid for the whole call.
  }, [callEnding]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startCall() {
    const pending = pendingRef.current;
    if (!pending) return setProblem("noSetup");
    setProblem(null);
    setStage("connecting");
    hangingUp.current = false;

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch {
      setProblem("mic");
      return;
    }

    // Picking up a dropped call: load what's saved so far.
    resumeRecord.current = pending.resume ? ((await getCall(pending.resume.callId)) ?? null) : null;
    // A new call gets its number now, so its name never changes later.
    if (!pending.resume && !pending.retry) callNumber.current = nextCallNumber(await listCalls(), pending.setup);

    try {
      const res = await fetch("/api/agent-session", { cache: "no-store" });
      if (!res.ok) throw new Error(`Session route returned ${res.status}`);
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      const firstMessage = resumeRecord.current
        ? resumeFirstLine(lastQuestionAsked(resumeRecord.current.transcript).text)
        : pending.retry
          ? retryFirstLine(pending.retry.question)
          : openingLine(pending.setup);
      conversation.startSession({ signedUrl, connectionType: "websocket", overrides: { agent: { firstMessage } } });
    } catch {
      setProblem("failed");
    }
  }

  // Start straight away: the tap on the sheet is the gesture. Once only, even in development.
  useEffect(() => {
    pendingRef.current = readPendingCall();
    if (!pendingRef.current) {
      setProblem("noSetup");
      return;
    }
    if (!autoStarted.current) {
      autoStarted.current = true;
      void startCall();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function hangUp() {
    hangingUp.current = true;
    conversation.endSession();
  }

  function toggleMute() {
    conversation.setMuted(!muted);
    setMuted(!muted);
  }

  const pending = pendingRef.current;
  const retry = call.retryOf ?? (pending?.retry ? { callId: pending.retry.callId, questionIndex: pending.retry.questionIndex } : null);
  const total = retry ? null : totalQuestions(call.setup ?? pending?.setup ?? null);
  const lastAgentLine = [...call.transcript].reverse().find((line) => line.speaker === "agent")?.text;
  const answered = answeredQuestions(call);
  const copy = callCopy({
    stage,
    phase: call.phase,
    speaking: call.speaking,
    writingNote: call.held === "writing",
    watching,
    retry: retry ? { questionIndex: retry.questionIndex, hint: pending?.retry?.hint } : null,
    question: call.question,
    total,
    answered,
    lastAgentLine,
    openingLine: pending && !pending.retry ? openingLine(pending.setup) : undefined,
    retryQuestion: pending?.retry?.question,
  });

  if (problem) {
    const state = session.get();
    const id = callId ?? state.id;
    const answeredSoFar = answeredQuestions(state);
    const resume = () => {
      const pending = pendingRef.current;
      if (!pending || !id) return;
      pendingRef.current = { ...pending, retry: undefined, resume: { callId: id } };
      setPendingCall(pendingRef.current);
      void startCall();
    };
    const rebuild = () => {
      setProblem(null); // Back to the writing screen while it tries again.
      if (session.get().retryOf) return scoreThisRetry();
      if (id) {
        void buildScorecard(id).then((result) =>
          result?.status === "completed" ? router.replace(`/scorecard/${id}?fresh=1`) : scoreFailed(),
        );
      }
    };
    const endHere = () => {
      clearPendingCall();
      if (answeredSoFar >= 2) {
        setProblem(null);
        setStage("writing");
      } else router.push("/");
    };
    const actions = {
      mic: { primary: { label: "Try again", run: () => void startCall() }, secondary: { label: "Back home", run: () => router.push("/") } },
      failed: { primary: { label: "Try again", run: () => void startCall() }, secondary: { label: "Back home", run: () => router.push("/") } },
      noSetup: { primary: { label: "Set up a call", run: () => router.push("/?sheet=new") }, secondary: { label: "Back home", run: () => router.push("/") } },
      dropped: { primary: { label: "Reconnect", run: resume }, secondary: { label: "End here", run: endHere } },
      cutShort: { primary: { label: "Jump back in", run: resume }, secondary: { label: "Back home", run: () => { clearPendingCall(); router.push("/"); } } },
      scoreFailed: {
        primary: { label: "Build scorecard", run: rebuild },
        secondary: state.retryOf
          ? { label: "Back to scorecard", run: () => router.push(`/scorecard/${state.retryOf!.callId}`) }
          : { label: "Read the transcript", run: () => router.push(`/scorecard/${id}?tab=transcript`) },
      },
    }[problem];
    return (
      <CallProblem
        problem={problem}
        total={total}
        question={state.question}
        answered={answeredSoFar}
        lastQuestion={state.question > 0 ? state.transcript.findLast((line) => line.speaker === "agent" && line.questionIndex === state.question)?.text : undefined}
        primary={actions.primary}
        secondary={actions.secondary}
      />
    );
  }

  const segments = total ?? 0;
  const current = stage === "writing" ? segments + 1 : Math.max(call.question, 0);

  return (
    <main className={styles.call}>
      <div className={styles.top}>
        {retry ? (
          <Tag tone="lime">Retry · Question {retry.questionIndex}</Tag>
        ) : segments > 0 ? (
          <ProgressSegments total={segments} current={current || 0} />
        ) : (
          <span />
        )}
        <CallPill>{stage === "writing" ? `Call ended · ${formatTime(endedAfterMs)}` : copy.pill}</CallPill>
      </div>

      <SelfView stream={selfView.stream} className={styles.selfView} />

      <div className={styles.middle}>
        <div className={styles.stage}>
          <Meera vm={vm} size={240} />
          {reaction && stage === "live" && (
            <Tag tone={reaction.tone} className={styles.reaction}>
              {reaction.text}
            </Tag>
          )}
        </div>
        <div className={styles.words} aria-live="polite">
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.sub}>{copy.sub}</p>
        </div>
      </div>

      {stage === "writing" ? (
        <WritingSteps />
      ) : (
        <>
          {copy.cardText && (
            <div className={styles.card}>
              <QuestionCard label={copy.cardLabel ?? ""}>{copy.cardText}</QuestionCard>
            </div>
          )}
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
            <CallControl label={muted ? "Unmute" : "Mute"} pressed={muted} onClick={toggleMute} disabled={!inCall}>
              <MicIcon off={muted} />
            </CallControl>
            <CallControl
              label={selfView.isOn ? "Turn camera off" : "Turn camera on"}
              pressed={selfView.isOn}
              onClick={selfView.toggle}
            >
              <CameraIcon />
            </CallControl>
            </div>
            <CallControl label="End call" end onClick={inCall ? hangUp : () => router.push("/")}>
              <CloseIcon />
            </CallControl>
          </div>
        </>
      )}
    </main>
  );
}

/** Screen 1.6: three honest steps. The first two are done by the app already. */
function WritingSteps() {
  return (
    <ol className={styles.steps}>
      <li>
        <span className={styles.stepDone}>
          <CheckIcon />
        </span>
        Reading back your answers
      </li>
      <li>
        <span className={styles.stepDone}>
          <CheckIcon />
        </span>
        Counting fillers and pace
      </li>
      <li className={styles.stepNow} aria-current="step">
        <span className={styles.stepRing} />
        Rewriting your weakest answers
      </li>
    </ol>
  );
}

type Action = { label: string; run: () => void };
type ProblemProps = {
  problem: Exclude<Problem, null>;
  total: number | null;
  question: number;
  answered: number;
  lastQuestion?: string;
  primary: Action;
  secondary: Action;
};

/** Screens 5.1 to 5.4: what went wrong, that nothing is lost, and one clear way back. */
function CallProblem({ problem, total, question, answered, lastQuestion, primary, secondary }: ProblemProps) {
  const answers = `${answered} ${answered === 1 ? "answer" : "answers"}`;
  const copy: Record<Exclude<Problem, null>, { title: string; sub: string; note?: string; pill: string; still: MeeraStill; offline?: boolean; badge?: "mic" | "oops" }> = {
    mic: {
      title: "Meera can't hear you",
      sub: "Your mic is blocked for this site",
      note: "iPhone: tap aA in the address bar, then Website Settings, and allow Microphone. Chrome: tap the icon left of the address, then Permissions. Then try again.",
      pill: "Before the call",
      still: { mood: "listening" },
      badge: "mic",
    },
    failed: { title: "Couldn't start the call", sub: "Meera's line didn't connect", note: "Check your connection and try again.", pill: "Before the call", still: { mood: "skeptical" } },
    noSetup: { title: "No call set up yet", sub: "Pick a role and a length first", pill: "Before the call", still: { mood: "listening" } },
    dropped: {
      title: "Call dropped",
      sub: "Your answers so far are saved",
      note: lastQuestion ? `Meera picks up at this question: "${lastQuestion}" No intro again.` : "Meera picks up where you stopped. No intro again.",
      pill: question > 0 ? `Paused at Q${question}` : "Paused",
      still: { mood: "listening" },
      offline: true,
    },
    cutShort: {
      title: "That was quick",
      sub: answered === 1 ? "One answer isn't enough for a scorecard" : "A scorecard needs two answers",
      note: "Saved to History as incomplete. Want to jump back in where we stopped?",
      pill: answers,
      still: { mood: "listening", trigger: "browRaise" },
    },
    scoreFailed: {
      title: "Scorecard didn't build",
      sub: "Your transcript is saved",
      note: "Try again after some time.",
      pill: "Call ended",
      still: { mood: "skeptical" },
      badge: "oops",
    },
  };
  const { title, sub, note, pill, still, offline, badge } = copy[problem];
  const segments = total ?? 0;
  const done = problem === "scoreFailed" ? segments + 1 : problem === "cutShort" ? answered + 1 : question;

  return (
    <main className={styles.call}>
      <div className={styles.top}>
        {segments > 0 && problem !== "mic" && problem !== "failed" && problem !== "noSetup" ? (
          <ProgressSegments total={segments} current={done} />
        ) : (
          <span />
        )}
        <CallPill>{pill}</CallPill>
      </div>
      <div className={styles.middle}>
        <div className={styles.stage}>
          <Meera still={still} size={240} offline={offline} />
          {badge === "mic" && (
            <span className={styles.micBadge} aria-hidden="true">
              <MicIcon off size={26} />
            </span>
          )}
          {badge === "oops" && (
            <span className={styles.oopsBadge} aria-hidden="true">
              ?!
            </span>
          )}
        </div>
        <div className={styles.words} role="alert">
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.sub}>{sub}</p>
        </div>
      </div>
      <div className={styles.actions}>
        {note && <p className={styles.note}>{note}</p>}
        <Button variant="primary" size="big" onDark block onClick={primary.run}>
          {primary.label}
        </Button>
        <button type="button" className={styles.textLink} onClick={secondary.run}>
          {secondary.label}
        </button>
      </div>
    </main>
  );
}
