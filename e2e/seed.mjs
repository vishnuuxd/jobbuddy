// Realistic v2 data for screenshots. Dates are relative to now.
const day = (n, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d; };
const s = (clarity, structure, evidence, relevance, delivery) => ({ clarity, structure, evidence, relevance, delivery });
const t = (speaker, text, startSec, questionIndex) => ({ speaker, text, startSec, endSec: startSec + 8, questionIndex });

const scorecard = {
  summary: {
    strongest: { questionIndex: 1, why: "Clear, calm openers. You named the problem before the solution every time." },
    practiceNext: "structure",
    meeraTake: "Good energy! Your stories stop right before the payoff.",
    oneThing: { pattern: "End with the result", evidence: "2 of 3 answers stopped before the outcome.", whyItMatters: "Say what changed, with a number." },
  },
  answers: [
    { questionIndex: 1, question: "Tell me about yourself", lateAddition: false, scores: s(4, 3, 3, 4, 3),
      flagged: { type: "rambling", quote: "I started in print, then moved to agencies, then a startup, then", atSeconds: 70, whyItMatters: "It sets the frame" },
      rewrite: { original: "I started in print, then moved to agencies, then a startup", improved: "I lead design for B2B tools. Most recently at GrayMatter, where I [your number]", whatChanged: "Lead with the role that fits this job" } },
    { questionIndex: 2, question: "Stakeholder pushback", lateAddition: false, scores: s(4, 2, 3, 4, 3),
      flagged: { type: "no_result", quote: "…so I aligned everyone and we moved on to the next sprint.", atSeconds: 220, whyItMatters: "They remember outcomes" },
      rewrite: { original: "…so I aligned everyone and we moved on to the next sprint.", improved: "…vendors now log their own requests, and the ops queue dropped by [your number].", whatChanged: "Ends with what changed" } },
    { questionIndex: 3, question: "Why this role", lateAddition: false, scores: s(5, 4, 3, 4, 4) },
  ],
};

const base = (id, n, mins, extra) => ({
  id, interviewerId: "meera", startedAt: day(n).toISOString(), endedAt: new Date(day(n).getTime() + mins * 60000).toISOString(),
  setup: { role: "Product designer", seniority: "Senior", name: "Vishnu", durationMin: 10, questionCount: 3, hasJd: false, hasCv: true },
  transcript: [
    t("agent", "Tell me about a time a stakeholder pushed back on your design. How did it end?", 124, 2),
    t("user", "So at GrayMatter the ops lead didn't want vendors touching the queue. Um, I ran three sessions with the team, we mapped every handoff, and, you know, basically I just kept showing the data.", 131, 2),
    t("user", "…so I aligned everyone and we moved on to the next sprint.", 220, 2),
    t("agent", "So how did that turn out?", 226, 2),
    t("user", "I think it kind of went well? I guess people were happier.", 232, 2),
  ],
  flags: [
    { type: "no_result", quote: "…so I aligned everyone and we moved on to the next sprint.", atSeconds: 220, source: "agent" },
    { type: "hedging", quote: "I think it kind of went well? I guess people were happier.", atSeconds: 232, source: "client" },
  ],
  metrics: [
    { questionIndex: 1, seconds: 84, words: 200, wpm: 143, fillers: 2, hedges: 0 },
    { questionIndex: 2, seconds: 108, words: 250, wpm: 139, fillers: 3, hedges: 2 },
    { questionIndex: 3, seconds: 96, words: 230, wpm: 144, fillers: 1, hedges: 0 },
  ],
  lateAdditions: [], status: "completed", scorecard, retries: [], ...extra,
});

export const calls = [
  base("today", 0, 9.6, { number: 12,
    retries: [{ questionIndex: 2, at: day(0, 10, 12).toISOString(), transcript: [],
      answer: { ...scorecard.answers[1], scores: s(4, 4, 4, 4, 3) } }],
  }),
  base("tue", 2, 20, { number: 4, setup: { role: "Product designer", seniority: "Lead", durationMin: 20, questionCount: 5, hasJd: true, hasCv: true } }),
  base("mon", 3, 12, { number: 2, status: "scoring_failed", scorecard: undefined, setup: { role: "UX researcher", seniority: "Mid", durationMin: 10, questionCount: 3, hasJd: false, hasCv: false } }),
  base("sun", 4, 3, { number: 11, status: "incomplete", scorecard: undefined, metrics: [{ questionIndex: 1, seconds: 60, words: 140, wpm: 140, fillers: 1, hedges: 0 }] }),
];
export const profile = { id: "me", cv: { fileName: "vishnu-cv.pdf", text: "Vishnu. Senior product designer. GrayMatter 2021 to now: led the ops tooling redesign.", addedAt: day(6).toISOString() }, lastSetup: { name: "Vishnu", role: "Product designer", seniority: "Senior", durationMin: 10 } };

/** Writes the seed into the app's IndexedDB. The page must have opened the db once. */
export async function seed(page, { withCalls = true, withProfile = true } = {}) {
  await page.evaluate(({ calls, profile, withCalls, withProfile }) => new Promise((resolve, reject) => {
    const open = indexedDB.open("jobbuddy");
    open.onsuccess = () => {
      const tx = open.result.transaction(["calls", "profile"], "readwrite");
      tx.objectStore("calls").clear(); tx.objectStore("profile").clear();
      if (withCalls) calls.forEach((c) => tx.objectStore("calls").put(c));
      if (withProfile) tx.objectStore("profile").put(profile);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  }), { calls, profile, withCalls, withProfile });
}
