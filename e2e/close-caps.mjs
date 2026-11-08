// The auto end after Meera's closing line, against a scripted ElevenLabs session.
// Run with the dev server up: npm run test:e2e
import { callPage, launch, setup } from "./mockcall.mjs";

const b = await launch();

async function runCase(name, afterDone) {
  const { page, agent, log } = await callPage(b, { pending: { setup, cvText: "CV" }, seedData: false });
  const warnings = [];
  page.on("console", (m) => m.type() === "warning" && /safety cap/.test(m.text()) && warnings.push(m.text()));
  await page.goto("http://localhost:3000/call", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  agent.say("Hi, I'm Meera. Ready?");
  agent.user("Ready.");
  agent.tool("setPhase", { name: "interview" });
  for (const i of [1, 2]) {
    agent.tool("nextQuestion", { index: i });
    agent.say(`Question ${i}?`);
    await page.waitForTimeout(150);
    agent.user(`Answer ${i}.`);
    await page.waitForTimeout(150);
  }
  agent.say("Okay, that's everything I wanted to ask. Your scorecard's ready when you are.");
  agent.tool("setPhase", { name: "done" });
  const doneAt = Date.now();
  await afterDone(agent, page);
  for (let i = 0; i < 300 && !log.closedAt; i++) await page.waitForTimeout(100);
  const endedAfter = log.closedAt ? ((log.closedAt - doneAt) / 1000).toFixed(1) : "never";
  console.log(`${name}: ended ${endedAfter} s after setPhase(done) | ${warnings.join(" ") || "no cap warning"} | errors ${log.errors.length}`);
  return log.closedAt ? (log.closedAt - doneAt) / 1000 : Infinity;
}

const failures = [];
const expect = (name, seconds, from, to) => {
  if (!(seconds >= from && seconds <= to)) failures.push(`${name}: ended at ${seconds} s, expected ${from} to ${to} s`);
};

// 1. No audio from Meera at all after setPhase("done"): the 3 s cap ends the call.
expect("no audio", await runCase("no audio", async () => {}), 2.9, 3.6);

// 2. Her audio starts 1 s after setPhase("done") and runs for 20 s: the 15 s cap ends the call.
expect("audio too long", await runCase("audio too long", async (agent, page) => {
  await page.waitForTimeout(1000);
  for (let i = 0; i < 4; i++) agent.audio(5, 100 + i); // 20 s queued
}), 14.9, 15.6);

// 3. Control: a normal 2 s closing line still ends 1 s after it stops.
expect("normal close", await runCase("normal close", async (agent, page) => {
  await page.waitForTimeout(500);
  agent.audio(2, 200);
}), 3.4, 4.5); // 0.5 s wait + 2 s of audio + 1 s quiet, plus playback buffering

await b.close();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("all close cases passed");
