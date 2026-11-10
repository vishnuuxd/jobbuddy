// The app owns the time limit (PRD.md, Call behavior: Interview), and her voice tags never
// show. Against a scripted ElevenLabs session, with the page clock jumped forward.
// Run with the dev server up: npm run test:e2e
import { calls } from "./seed.mjs";
import { callPage, launch } from "./mockcall.mjs";

const b = await launch();
const failures = [];
const check = (name, ok) => (ok ? console.log(`ok: ${name}`) : failures.push(name));
const setup = { role: "Product designer", seniority: "Senior", name: "Vishnu", durationMin: 20, questionCount: 5, hasJd: false, hasCv: true };
const min = 60_000;
const updates = (log) => log.sent.filter((m) => m.type === "contextual_update").map((m) => m.text);

async function startCall(pending) {
  const run = await callPage(b, { pending, seedData: false });
  const { page, agent } = run;
  run.warnings = [];
  page.on("console", (m) => m.type() === "warning" && run.warnings.push(m.text()));
  await page.route("**/api/scorecard", (r) => r.fulfill({ json: { scorecard: calls[0].scorecard } }));
  await page.clock.install();
  await page.goto("http://localhost:3000/call", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  agent.say("[calm] Hi, I'm Meera. [laughs] Ready?");
  agent.user("Ready.");
  agent.tool("setPhase", { name: "interview" });
  for (const i of [1, 2]) {
    agent.tool("nextQuestion", { index: i });
    agent.say(`[curious] Question ${i}?`);
    await page.waitForTimeout(150);
    agent.user(`Answer ${i}.`);
    await page.waitForTimeout(150);
  }
  return run;
}

// 1. She never closes: two minutes left, then time up, then the app ends it 60 s later, as complete.
{
  const { page, log, warnings } = await startCall({ setup, cvText: "CV" });
  const caption = await page.locator("main").innerText();
  check("voice tags never show in the caption", !caption.includes("[") && caption.includes("Question 2?"));
  await page.clock.fastForward(17 * min);
  await page.waitForTimeout(300);
  check("nothing sent before two minutes left", !updates(log).some((t) => /two minutes|Time is up/.test(t)));
  await page.clock.fastForward(1 * min + 1_000);
  await page.waitForTimeout(300);
  check("two minutes left update at 18 min", updates(log).includes("About two minutes left. Don't start a new main question. Let them finish, then close."));
  await page.clock.fastForward(2 * min);
  await page.waitForTimeout(300);
  check("time up update at 20 min", updates(log).includes('Time is up. Say your closing line now and call setPhase("done").'));
  check("call still open at 20 min", !log.closedAt);
  await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/time-up-live.png` : "/dev/null" });
  await page.clock.fastForward(61_000);
  for (let i = 0; i < 50 && !log.closedAt; i++) await page.waitForTimeout(100);
  check("the app ends the call 60 s after time up", !!log.closedAt && warnings.some((w) => /Call ended by the app/.test(w)));
  await page.waitForURL(/\/scorecard\//, { timeout: 15_000 }).catch(() => {});
  const saved = await page.evaluate(async () => {
    const req = indexedDB.open("jobbuddy");
    const db = await new Promise((res) => (req.onsuccess = () => res(req.result)));
    const tx = db.transaction("calls").objectStore("calls").getAll();
    return new Promise((res) => (tx.onsuccess = () => res(tx.result)));
  });
  check("saved as completed, with a scorecard", saved.length === 1 && saved[0].status === "completed" && !!saved[0].scorecard);
  check("no voice tags in the saved transcript", saved[0].transcript.every((l) => !l.text.includes("[")));
  check("the tag-only words are tidy", saved[0].transcript[0].text === "Hi, I'm Meera. Ready?");
  await page.context().close();
}

// 2. She closes when told: the normal close runs, and the app's own end never fires.
{
  const { page, agent, log, warnings } = await startCall({ setup, cvText: "CV" });
  await page.clock.fastForward(20 * min + 1_000);
  await page.waitForTimeout(300);
  agent.say("Okay, that's time. Your scorecard's ready when you are.");
  agent.tool("setPhase", { name: "done" });
  await page.waitForTimeout(300);
  await page.clock.fastForward(4_000); // No audio in the mock: the 3 s cap ends it.
  for (let i = 0; i < 50 && !log.closedAt; i++) await page.waitForTimeout(100);
  check("closing after time up ends through the normal close", !!log.closedAt && !warnings.some((w) => /Call ended by the app/.test(w)));
  await page.context().close();
}

// 3. A retry call has no time limit updates.
{
  const retry = { callId: "today", questionIndex: 2, question: "Tell me about a stakeholder who pushed back." };
  const { page, log } = await startCall({ setup: { ...setup, durationMin: 5 }, retry });
  await page.clock.fastForward(7 * min);
  await page.waitForTimeout(300);
  check("retry calls get no time limit updates", !updates(log).some((t) => /two minutes|Time is up/.test(t)) && !log.closedAt);
  await page.context().close();
}

await b.close();
if (failures.length) {
  console.error(`FAILED:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("all time limit cases passed");
