// The close safety net: her closing line on the last question, but no setPhase("done").
// Against a scripted ElevenLabs session. Run with the dev server up: npm run test:e2e
import { callPage, launch, setup } from "./mockcall.mjs";

const b = await launch();
const { page, agent, log } = await callPage(b, { pending: { setup, cvText: "CV" }, seedData: false });
const warnings = [];
page.on("console", (m) => m.type() === "warning" && warnings.push(m.text()));
await page.goto("http://localhost:3000/call", { waitUntil: "networkidle" });
await page.waitForTimeout(2500); // past the ringing screen
agent.say("Hi, I'm Meera. Ready?");
agent.user("Ready.");
agent.tool("setPhase", { name: "interview" });
for (const i of [1, 2, 3]) {
  agent.tool("nextQuestion", { index: i });
  agent.say(`Question ${i}?`);
  await page.waitForTimeout(150);
  agent.user(`Answer ${i}.`);
  await page.waitForTimeout(150);
}
agent.say("Okay, that's everything I wanted to ask. Your scorecard's ready when you are.");
await page.waitForTimeout(300);
agent.audio(2, 900); // her closing line plays; she never calls setPhase("done")
const sent = Date.now();
for (let i = 0; i < 120 && !log.closedAt; i++) await page.waitForTimeout(100);
const after = log.closedAt ? ((log.closedAt - sent) / 1000).toFixed(1) : "never";
const netFired = warnings.some((w) => /Call closed by the app/.test(w));
console.log(`closing line, no done: call ended ${after} s after her audio started | net fired: ${netFired}`);
await b.close();
// 2 s of audio, then 3 s wait, then the normal close's 1 s: about 6 s.
if (!log.closedAt || !netFired || (log.closedAt - sent) / 1000 > 8) process.exit(1);
console.log("close net passed");
