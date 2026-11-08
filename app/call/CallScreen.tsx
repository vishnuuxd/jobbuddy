"use client";

import { useConversation } from "@elevenlabs/react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CallControls } from "@/components/CallControls";
import { MeeraStage } from "@/components/MeeraStage";
import { SelfView } from "@/components/SelfView";
import { createClientTools } from "@/lib/agent/clientTools";
import { createInterviewVM } from "@/lib/avatar/interviewVM";
import { AttachError, extractText } from "@/lib/attach/extract";
import { setupUpdate } from "@/lib/call/context";
import { openingLine } from "@/lib/call/opening";
import { clearPendingCall, readPendingCall, type PendingCall } from "@/lib/call/pending";
import { createCallSession, toCallRecord, totalQuestions } from "@/lib/call/session";
import { useSelfView } from "@/lib/call/useSelfView";
import { useVoiceVolume } from "@/lib/call/useVoiceVolume";
import { liveConfig } from "@/lib/live/config";
import { createLiveRules } from "@/lib/live/rules";
import { saveCall } from "@/lib/store/db";

type StartError = "mic" | "failed" | null;

type AttachKind = "cv" | "jd";
const attachNames = { cv: "CV", jd: "job description" };

const saveEveryMs = 1_000;

function createCall() {
  const vm = createInterviewVM();
  const session = createCallSession(vm, liveConfig);
  const sendRef: { current: (text: string) => void } = { current: () => {} };
  const rules = createLiveRules(session, (text) => sendRef.current(text), liveConfig);
  return { vm, session, rules, sendRef, clientTools: createClientTools(session) };
}

export function CallScreen() {
  const [{ vm, session, rules, sendRef, clientTools }] = useState(createCall);
  const call = useSyncExternalStore(session.subscribe, session.get, session.get);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<StartError>(null);
  // The SDK sets status to "error" on any error, even while the call carries on,
  // so the screen follows the session itself, not status.
  const [inCall, setInCall] = useState(false);
  const inCallRef = useRef(false);
  const selfView = useSelfView();
  const [attachKind, setAttachKind] = useState<AttachKind | null>(null);
  const [choosingAttach, setChoosingAttach] = useState(false);
  const [attachMessage, setAttachMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const heldAttachment = useRef<{ kind: AttachKind; text: string } | null>(null);
  const herTurnStartedAt = useRef(0);
  // The setup comes from the sheet on Home. Read once on mount, in the browser.
  const pendingRef = useRef<PendingCall | null>(null);
  const startCallRef = useRef<() => Promise<void>>(async () => {});
  const autoStarted = useRef(false);
  const [hasSetup, setHasSetup] = useState<boolean | null>(null);
  useEffect(() => {
    pendingRef.current = readPendingCall();
    setHasSetup(pendingRef.current !== null);
    // Once only, even when React runs effects twice in development.
    if (pendingRef.current && !autoStarted.current) {
      autoStarted.current = true;
      void startCallRef.current();
    }
  }, []);

  function setSessionOpen(open: boolean) {
    inCallRef.current = open;
    setInCall(open);
  }

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      const pending = pendingRef.current!;
      session.start(crypto.randomUUID(), pending.setup, { cvText: pending.cvText, jdText: pending.jdText });
      setSessionOpen(true);
      conversation.sendContextualUpdate(setupUpdate(pending.setup, pending));
    },
    onDisconnect: () => {
      rules.finish();
      heldAttachment.current = null;
      if (session.get().id) void saveCall(toCallRecord(session.get(), new Date().toISOString()));
      clearPendingCall();
      session.end();
      setSessionOpen(false);
      setChoosingAttach(false);
      setAttachMessage(null);
      selfView.stop();
      conversation.setMuted(false);
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
      if (!inCallRef.current) setStartError("failed");
    },
  });

  useVoiceVolume(vm, conversation.getOutputVolume, inCall);
  sendRef.current = conversation.sendContextualUpdate;


  function deliverAttachment(kind: AttachKind, text: string) {
    session.attach(kind, text);
    session.react("glanceDown");
    conversation.sendContextualUpdate(`The candidate attached their ${attachNames[kind]}:\n${text}`);
  }

  // The rules run on a timer, and the record saves as the call goes.
  useEffect(() => {
    if (!inCall) return;
    rules.setOnAnswerEnd(() => {
      const held = heldAttachment.current;
      heldAttachment.current = null;
      if (held) deliverAttachment(held.kind, held.text);
    });
    const rulesTimer = setInterval(rules.tick, 200);
    const saveTimer = setInterval(() => void saveCall(toCallRecord(session.get())), saveEveryMs);
    return () => {
      clearInterval(rulesTimer);
      clearInterval(saveTimer);
    };
    // sendContextualUpdate stays valid for the whole call.
  }, [inCall]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickAttachment(kind: AttachKind) {
    setAttachKind(kind);
    setChoosingAttach(false);
    fileInput.current?.click();
  }

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file || !attachKind) return;
    try {
      const text = await extractText(file);
      setAttachMessage(null);
      if (rules.answering()) heldAttachment.current = { kind: attachKind, text };
      else deliverAttachment(attachKind, text);
    } catch (error) {
      setAttachMessage(error instanceof AttachError ? error.message : "I can't read that one.");
    }
  }

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

  const total = totalQuestions(call.setup);
  const connecting = starting || conversation.status === "connecting";

  startCallRef.current = startCall;
  async function startCall() {
    setStarting(true);
    setStartError(null);

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch {
      setStartError("mic");
      setStarting(false);
      return;
    }

    try {
      const res = await fetch("/api/agent-session", { cache: "no-store" });
      if (!res.ok) throw new Error(`Session route returned ${res.status}`);
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      const pending = pendingRef.current;
      if (!pending) throw new Error("No setup");
      conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: { agent: { firstMessage: openingLine(pending.setup) } },
      });
    } catch {
      setStartError("failed");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="call">
      <MeeraStage vm={vm} />
      {inCall && call.question > 0 && (
        <p className="question-label">
          Question {call.question}
          {total !== null && ` of ${total}`}
        </p>
      )}
      <SelfView stream={selfView.stream} />

      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".pdf,.txt,.md,application/pdf,text/plain"
        onChange={(event) => void onFileChosen(event.target.files?.[0])}
      />
      {inCall && attachMessage && (
        <p className="attach-message" role="alert">
          {attachMessage}
        </p>
      )}
      {inCall && choosingAttach && (
        <div className="attach-choice">
          <button onClick={() => pickAttachment("cv")}>CV</button>
          <button onClick={() => pickAttachment("jd")}>Job description</button>
        </div>
      )}

      {inCall ? (
        <CallControls
          muted={conversation.isMuted}
          cameraOn={selfView.isOn}
          onToggleMute={() => conversation.setMuted(!conversation.isMuted)}
          onAttach={() => setChoosingAttach(!choosingAttach)}
          onToggleCamera={selfView.toggle}
          onHangUp={() => conversation.endSession()}
        />
      ) : (
        <div className="call-start">
          {startError === "mic" && (
            <p role="alert">
              Meera needs your microphone. Allow it for this site in your browser settings, then
              try again.
            </p>
          )}
          {startError === "failed" && <p role="alert">Couldn't start the call.</p>}
          {hasSetup === false ? (
            <Link className="call-start-button" href="/">
              Set up a call
            </Link>
          ) : (
            <button className="call-start-button" onClick={startCall} disabled={connecting}>
              {connecting ? "Connecting" : startError ? "Try again" : "Call Meera"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
