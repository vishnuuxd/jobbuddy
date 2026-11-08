"use client";

import { useConversation } from "@elevenlabs/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Meera } from "@/components/meera/Meera";
import { SelfView } from "@/components/SelfView";
import { Button } from "@/components/ui/Button";
import { CallControl, CallPill, ProgressSegments, QuestionCard } from "@/components/ui/CallParts";
import { Sticker } from "@/components/ui/Chip";
import { CameraIcon, CheckIcon, MicIcon } from "@/components/ui/icons";
import { createClientTools } from "@/lib/agent/clientTools";
import { createInterviewVM, type Trigger } from "@/lib/avatar/interviewVM";
import { callCopy, type CallStage } from "@/lib/call/callCopy";
import { callConfig } from "@/lib/call/config";
import { oneMinuteLeftUpdate, retryFirstLine, retryUpdate, setupUpdate } from "@/lib/call/context";
import { openingLine } from "@/lib/call/opening";
import { clearPendingCall, readPendingCall, type PendingCall } from "@/lib/call/pending";
import { answeredQuestions, createCallSession, toCallRecord, totalQuestions } from "@/lib/call/session";
import { useSelfView } from "@/lib/call/useSelfView";
import { useVoiceVolume } from "@/lib/call/useVoiceVolume";
import { liveConfig } from "@/lib/live/config";
import { createLiveRules } from "@/lib/live/rules";
import { buildScorecard } from "@/lib/scorecard/request";
import { saveCall } from "@/lib/store/db";
import styles from "./call.module.css";

type Problem = "mic" | "failed" | "noSetup" | "dropped" | "cutShort" | "scoreFailed" | null;
type Reaction = { text: string; tone: "sun" | "mint" | "white" } | null;

const saveEveryMs = 1_000;
// How long a reaction sticker and the "checks the time" moment stay up. Display timing only.
const stickerMs = 2_600;
const watchingMs = 8_000;

const stickers: Partial<Record<Trigger, Reaction>> = {
  nod: { text: "Nice, keep going", tone: "mint" },
  checkWatch: { text: "Getting long", tone: "sun" },
};

function createCall() {
  const vm = createInterviewVM();
  const session = createCallSession(vm, liveConfig);
  const sendRef: { current: (text: string) => void } = { current: () => {} };
  const rules = createLiveRules(session, (text) => sendRef.current(text), liveConfig);
  return { vm, session, rules, sendRef, clientTools: createClientTools(session) };
}

const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export function CallScreen() {
  const router = useRouter();
  const [{ vm, session, rules, sendRef, clientTools }] = useState(createCall);
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
  const pendingRef = useRef<PendingCall | null>(null);
  const autoStarted = useRef(false);
  const savedCall = useRef<Promise<unknown>>(Promise.resolve());
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
      if (pending.retry) {
        session.startRetry(crypto.randomUUID(), pending.setup, pending.retry, texts);
        conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
        conversation.sendContextualUpdate(retryUpdate(pending.retry.question));
        showReaction({ text: "Go on, land it", tone: "sun" });
      } else {
        session.start(crypto.randomUUID(), pending.setup, texts);
        conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
        showReaction({ text: "Hi there!", tone: "sun" });
      }
      setSessionOpen(true);
      setStage("live");
    },
    onDisconnect: () => {
      rules.finish();
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
      if (state.phase === "done" || answered >= 2) setStage("writing");
      else if (hangingUp.current) setProblem("cutShort");
      else setProblem("dropped");
      clearPendingCall();
    },
    onModeChange: ({ mode }) => {
      if (mode === "speaking") {
        herTurnStartedAt.current = Date.now();
        rules.herTurn();
      }
      session.setSpeaking(mode === "speaking");
    },
    onVadScore: ({ vadScore }) => rules.vad(vadScore),
    onInterruption: () => rules.interruption(),
    onMessage: ({ role, message }) => {
      if (role === "user") {
        session.noteUserMessage();
        session.addTranscript("user", message, Date.now());
        rules.userMessage(message);
      } else {
        session.addTranscript("agent", message, herTurnStartedAt.current || Date.now());
      }
    },
    onError: (message) => {
      console.warn("Call error", message);
      if (!inCallRef.current) setProblem("failed");
    },
  });

  useVoiceVolume(vm, conversation.getOutputVolume, inCall);
  sendRef.current = conversation.sendContextualUpdate;

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

  // Writing: build the scorecard once the call is saved, then open it.
  useEffect(() => {
    if (stage !== "writing" || !callId || call.retryOf) return;
    let cancelled = false;
    void savedCall.current.then(async () => {
      const result = await buildScorecard(callId);
      if (cancelled) return;
      if (result?.status === "completed") router.replace(`/scorecard/${callId}?fresh=1`);
      else setProblem("scoreFailed");
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

  // At one minute left she's told to finish the current question and close.
  useEffect(() => {
    const setup = session.get().setup;
    if (!inCall || !setup || session.get().retryOf) return;
    const timer = setTimeout(
      () => conversation.sendContextualUpdate(oneMinuteLeftUpdate),
      setup.durationMin * 60_000 - callConfig.oneMinuteLeftMs,
    );
    return () => clearTimeout(timer);
    // sendContextualUpdate stays valid for the whole call.
  }, [inCall]); // eslint-disable-line react-hooks/exhaustive-deps

  // After setPhase("done"), hang up once she's been quiet, so her last line isn't cut off.
  const callEnding = inCall && call.phase === "done";
  useEffect(() => {
    if (!callEnding) return;
    const startedAt = Date.now();
    let quietSince = startedAt;
    const timer = setInterval(() => {
      const now = Date.now();
      if (session.get().speaking) quietSince = now;
      const quietEnough = now - quietSince >= liveConfig.endCallQuietMs;
      if (quietEnough || now - startedAt >= liveConfig.endCallMaxWaitMs) {
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

    try {
      const res = await fetch("/api/agent-session", { cache: "no-store" });
      if (!res.ok) throw new Error(`Session route returned ${res.status}`);
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      const firstMessage = pending.retry ? retryFirstLine(pending.retry.question) : openingLine(pending.setup);
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
    const rebuild = () => {
      setProblem(null); // Back to the writing screen while it tries again.
      if (callId) {
        void buildScorecard(callId).then((result) =>
          result?.status === "completed" ? router.replace(`/scorecard/${callId}?fresh=1`) : setProblem("scoreFailed"),
        );
      }
    };
    return <CallProblem problem={problem} onRetry={problem === "scoreFailed" ? rebuild : () => void startCall()} />;
  }

  const segments = total ?? 0;
  const current = stage === "writing" ? segments + 1 : Math.max(call.question, 0);

  return (
    <main className={styles.call}>
      <div className={styles.top}>
        {retry ? (
          <Sticker tilt={-3}>Retry · Question {retry.questionIndex}</Sticker>
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
            <Sticker tone={reaction.tone} tilt={-5} onDark className={styles.reaction}>
              {reaction.text}
            </Sticker>
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
            <CallControl label="End" end onClick={inCall ? hangUp : () => router.push("/")} />
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

function CallProblem({ problem, onRetry }: { problem: Exclude<Problem, null>; onRetry: () => void }) {
  const copy = {
    mic: { title: "Meera can't hear you", sub: "Your mic is blocked for this site", action: "Try again" },
    failed: { title: "Couldn't start the call", sub: "Something went wrong connecting", action: "Try again" },
    noSetup: { title: "No call set up", sub: "Pick a role and a length first", action: null },
    dropped: { title: "Call dropped", sub: "Your answers so far are saved", action: null },
    cutShort: { title: "That was quick", sub: "Saved to History as incomplete", action: null },
    scoreFailed: { title: "Scorecard didn't build", sub: "Your transcript is saved", action: "Build scorecard" },
  }[problem];
  return (
    <main className={styles.call}>
      <div className={styles.top} />
      <div className={styles.middle}>
        <Meera still={{ mood: "listening" }} size={240} offline={problem === "dropped"} />
        <div className={styles.words}>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.sub}>{copy.sub}</p>
        </div>
      </div>
      <div className={styles.actions}>
        {copy.action ? (
          <Button variant="primary" onDark block onClick={onRetry}>
            {copy.action}
          </Button>
        ) : (
          <Button href="/" variant="primary" onDark block>
            Set up a call
          </Button>
        )}
        <Link href="/" className={styles.textLink}>
          Back home
        </Link>
      </div>
    </main>
  );
}
