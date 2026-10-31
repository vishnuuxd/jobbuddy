"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { liveConfig } from "@/lib/live/config";

const CUT_IN_UPDATE = "The candidate's answer has run past 2 minutes. Cut in at the next pause.";
const MAX_ROWS_ON_SCREEN = 400;

// High-volume socket events that have their own callback or carry no signal.
const QUIET_EVENTS = new Set(["audio", "ping", "vad_score", "user_transcript", "agent_response"]);

type Kind = "tentative" | "final" | "tool" | "context" | "error" | "summary" | "info";
type Row = { id: number; kind: Kind; text: string };

export function Spike() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const allLines = useRef<string[]>([]);
  const nextId = useRef(0);
  const callStartedAt = useRef(0);
  const eventCounts = useRef<Record<string, number>>({});
  const mode = useRef("listening");
  const speaking = useRef(false);
  const speechStartedAt = useRef(0);
  const lastSpeechAt = useRef(0);
  const contextSentAt = useRef(0);
  const logEnd = useRef<HTMLDivElement>(null);

  const log = useCallback((kind: Kind, label: string, data?: unknown) => {
    const now = new Date();
    const sinceCall = callStartedAt.current
      ? `+${((now.getTime() - callStartedAt.current) / 1000).toFixed(2)}s`
      : "-";
    const detail = data === undefined ? "" : ` ${typeof data === "string" ? data : JSON.stringify(data)}`;
    const text = `${now.toISOString().slice(11, 23)} ${sinceCall} ${label}${detail}`;

    console.log(text);
    allLines.current.push(text);
    const id = nextId.current++;
    setRows((prev) => [...prev.slice(-(MAX_ROWS_ON_SCREEN - 1)), { id, kind, text }]);
  }, []);

  const conversation = useConversation({
    clientTools: {
      react: (parameters) => {
        log("tool", "CLIENT TOOL react", parameters);
        return "ok";
      },
    },
    onConnect: ({ conversationId }) => log("info", "CONNECTED", conversationId),
    onDisconnect: (details) => {
      log("info", "DISCONNECTED", details);
      log("summary", "SOCKET EVENT COUNTS", eventCounts.current);
    },
    onError: (message, context) => log("error", "ERROR", { message, context }),
    onStatusChange: ({ status }) => log("info", "STATUS", status),
    onModeChange: ({ mode: next }) => {
      mode.current = next;
      const afterContext =
        next === "speaking" && contextSentAt.current
          ? ` (${((Date.now() - contextSentAt.current) / 1000).toFixed(2)}s after contextual update)`
          : "";
      if (next === "speaking") contextSentAt.current = 0;
      log("info", `MODE ${next}${afterContext}`);
    },
    onMessage: (message) => {
      // The SDK only delivers finished transcripts here. Any tentative event
      // would show up in onIncomingEvent instead.
      const now = Date.now();
      const timing =
        message.role === "user" && speechStartedAt.current
          ? {
              msSinceSpeechStart: now - speechStartedAt.current,
              msSinceLastSpeech: now - lastSpeechAt.current,
            }
          : undefined;
      log("final", `onMessage FINAL ${message.role}`, { ...message, timing });
      if (message.role === "user") speechStartedAt.current = 0;
    },
    onAudioAlignment: (alignment) => {
      const { chars, char_start_times_ms: starts, char_durations_ms: durations } = alignment;
      log("info", "onAudioAlignment", {
        text: chars.join(""),
        count: chars.length,
        firstStartMs: starts[0],
        firstDurationsMs: durations.slice(0, 5),
      });
    },
    onVadScore: ({ vadScore }) => {
      const now = Date.now();
      const isSpeech = vadScore >= liveConfig.vadSpeechThreshold;
      if (isSpeech) {
        lastSpeechAt.current = now;
        if (!speechStartedAt.current) speechStartedAt.current = now;
      }
      if (isSpeech !== speaking.current) {
        speaking.current = isSpeech;
        log("info", `VAD ${isSpeech ? "speech" : "quiet"}`, vadScore.toFixed(2));
      }
    },
    onInterruption: (event) => log("info", "INTERRUPTION", event),
    onUnhandledClientToolCall: (call) => log("error", "UNHANDLED CLIENT TOOL", call),
    onIncomingEvent: (event) => {
      const type = event.type as string;
      eventCounts.current[type] = (eventCounts.current[type] ?? 0) + 1;

      if (/tentative|partial/i.test(type)) log("tentative", `SOCKET TENTATIVE ${type}`, event);
      else if (!QUIET_EVENTS.has(type)) log("info", `SOCKET ${type}`, event);
    },
  });

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "nearest" });
  }, [rows]);

  const isConnected = conversation.status === "connected";
  const isIdle = conversation.status === "disconnected" && !busy;

  async function call() {
    setBusy(true);
    callStartedAt.current = Date.now();
    eventCounts.current = {};
    speaking.current = false;
    speechStartedAt.current = 0;
    contextSentAt.current = 0;
    log("info", "CALL pressed");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const res = await fetch("/api/agent-session", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(body));
      log("info", "SIGNED URL received");

      conversation.startSession({ signedUrl: body.signedUrl, connectionType: "websocket" });
    } catch (error) {
      log("error", "CALL FAILED", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function sendCutIn() {
    contextSentAt.current = Date.now();
    conversation.sendContextualUpdate(CUT_IN_UPDATE);
    log("context", "CONTEXTUAL UPDATE sent", {
      text: CUT_IN_UPDATE,
      mode: mode.current,
      vadSpeaking: speaking.current,
    });
  }

  async function copyLog() {
    await navigator.clipboard.writeText(allLines.current.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function clearLog() {
    allLines.current = [];
    setRows([]);
  }

  return (
    <main className="spike">
      <div className="top">
        <img src="/placeholder.svg" alt="" />
        <div className="status">
          {conversation.status}
          {isConnected ? ` · ${conversation.mode}` : ""}
        </div>
      </div>

      <div className="row">
        <button className="call" onClick={call} disabled={!isIdle}>Call</button>
        <button className="hangup" onClick={() => conversation.endSession()} disabled={!isConnected}>
          Hang up
        </button>
        <button onClick={sendCutIn} disabled={!isConnected}>Send 2 min update</button>
        <button onClick={copyLog}>{copied ? "Copied" : "Copy log"}</button>
        <button onClick={clearLog}>Clear</button>
      </div>

      <div className="log" role="log">
        {rows.map((row) => (
          <div key={row.id} className={row.kind}>{row.text}</div>
        ))}
        <div ref={logEnd} />
      </div>
    </main>
  );
}
