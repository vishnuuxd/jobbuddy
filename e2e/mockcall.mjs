// A scripted ElevenLabs socket, so the call screen can be driven without a real call.
// Needs the dev server on localhost:3000 and Chrome (CHROME_PATH overrides where it is).
import { chromium } from "playwright-core";
import { seed } from "./seed.mjs";

export async function launch() {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
}

export async function callPage(browser, { pending, seedData = true, micDenied = false, sessionStatus = 200 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: micDenied ? [] : ["microphone"],
  });
  const page = await ctx.newPage();
  const log = { sent: [], errors: [] };
  page.on("pageerror", (e) => log.errors.push(String(e)));
  if (micDenied) await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await page.route("**/api/agent-session", (r) =>
    sessionStatus === 200 ? r.fulfill({ json: { signedUrl: "wss://mock.elevenlabs.test/ws" } }) : r.fulfill({ status: sessionStatus, json: {} }));
  let socket;
  let toolId = 0;
  await page.routeWebSocket("wss://mock.elevenlabs.test/**", (ws) => {
    socket = ws;
    ws.onMessage((m) => log.sent.push(JSON.parse(m)));
    ws.onClose(() => { log.closedAt = Date.now(); });
    ws.send(JSON.stringify({ type: "conversation_initiation_metadata", conversation_initiation_metadata_event: { conversation_id: "mock", agent_output_audio_format: "pcm_16000", user_input_audio_format: "pcm_16000" } }));
  });
  const send = (event) => socket.send(JSON.stringify(event));
  const agent = {
    say: (text) => send({ type: "agent_response", agent_response_event: { agent_response: text } }),
    user: (text) => send({ type: "user_transcript", user_transcription_event: { user_transcript: text } }),
    tool: (tool_name, parameters) => send({ type: "client_tool_call", client_tool_call: { tool_name, tool_call_id: String(++toolId), parameters, expects_response: false } }),
    drop: () => socket.close({ code: 1006, reason: "network" }),
    // Her voice: PCM 16 kHz, 16 bit. Quiet noise, so playback really runs.
    audio: (seconds, id) => {
      const samples = Math.round(16000 * seconds);
      const buf = Buffer.alloc(samples * 2);
      for (let i = 0; i < samples; i++) buf.writeInt16LE(Math.round(Math.sin(i / 8) * 2000), i * 2);
      send({ type: "audio", audio_event: { audio_base_64: buf.toString("base64"), event_id: id } });
    },
  };
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  if (seedData) await seed(page);
  if (pending) await page.evaluate((p) => sessionStorage.setItem("jobbuddy.pendingCall", JSON.stringify(p)), pending);
  return { ctx, page, agent, log };
}

export const setup = { role: "Product designer", seniority: "Senior", name: "Vishnu", durationMin: 10, questionCount: 3, hasJd: false, hasCv: true };
