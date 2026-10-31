"use client";

import { useConversation } from "@elevenlabs/react";
import { useRef, useState } from "react";
import { CallControls } from "@/components/CallControls";
import { MeeraStage } from "@/components/MeeraStage";
import { SelfView } from "@/components/SelfView";
import { clientTools } from "@/lib/agent/clientTools";
import { useSelfView } from "@/lib/call/useSelfView";

type StartError = "mic" | "failed" | null;

export function CallScreen() {
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
    onConnect: () => setSessionOpen(true),
    onDisconnect: () => {
      setSessionOpen(false);
      selfView.stop();
      conversation.setMuted(false);
    },
    onError: (message) => {
      console.warn("Call error", message);
      if (!inCallRef.current) setStartError("failed");
    },
  });

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
      <MeeraStage />
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
