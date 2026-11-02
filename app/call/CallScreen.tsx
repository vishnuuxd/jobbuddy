"use client";

import { useConversation } from "@elevenlabs/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CallControls } from "@/components/CallControls";
import { MeeraStage } from "@/components/MeeraStage";
import { SelfView } from "@/components/SelfView";
import { createClientTools } from "@/lib/agent/clientTools";
import { createInterviewVM } from "@/lib/avatar/interviewVM";
import { createCallSession, totalQuestions } from "@/lib/call/session";
import { useSelfView } from "@/lib/call/useSelfView";
import { useVoiceVolume } from "@/lib/call/useVoiceVolume";
import { liveConfig } from "@/lib/live/config";

type StartError = "mic" | "failed" | null;

function createCall() {
  const vm = createInterviewVM();
  const session = createCallSession(vm);
  return { vm, session, clientTools: createClientTools(session) };
}

export function CallScreen() {
  const [{ vm, session, clientTools }] = useState(createCall);
  const call = useSyncExternalStore(session.subscribe, session.get, session.get);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<StartError>(null);
  // The SDK sets status to "error" on any error, even while the call carries on,
  // so the screen follows the session itself, not status.
  const [inCall, setInCall] = useState(false);
  const inCallRef = useRef(false);
  const selfView = useSelfView();

  function setSessionOpen(open: boolean) {
    inCallRef.current = open;
    setInCall(open);
  }

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      session.start();
      setSessionOpen(true);
    },
    onDisconnect: () => {
      session.end();
      setSessionOpen(false);
      selfView.stop();
      conversation.setMuted(false);
    },
    onModeChange: ({ mode }) => session.setSpeaking(mode === "speaking"),
    onMessage: ({ role }) => {
      if (role === "user") session.noteUserMessage();
    },
    onError: (message) => {
      console.warn("Call error", message);
      if (!inCallRef.current) setStartError("failed");
    },
  });

  useVoiceVolume(vm, conversation.getOutputVolume, inCall);

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
      conversation.startSession({ signedUrl, connectionType: "websocket" });
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

      {inCall ? (
        <CallControls
          muted={conversation.isMuted}
          cameraOn={selfView.isOn}
          onToggleMute={() => conversation.setMuted(!conversation.isMuted)}
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
          <button className="call-start-button" onClick={startCall} disabled={connecting}>
            {connecting ? "Connecting" : startError ? "Try again" : "Call Meera"}
          </button>
        </div>
      )}
    </main>
  );
}
