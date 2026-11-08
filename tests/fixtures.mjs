// Shared test data: a scored call shaped like the PRD schema.
export const scores = (clarity, structure, evidence, relevance, delivery) => ({ clarity, structure, evidence, relevance, delivery });

export function answer(questionIndex, s, extra = {}) {
  return { questionIndex, question: `Question ${questionIndex}`, lateAddition: false, scores: s, ...extra };
}

export function scoredCall(overrides = {}) {
  return {
    id: "c1",
    interviewerId: "meera",
    startedAt: new Date(2026, 10, 8, 10).toISOString(),
    endedAt: new Date(2026, 10, 8, 10, 10).toISOString(),
    setup: { role: "Product designer", seniority: "Senior", durationMin: 10, questionCount: 3, hasJd: false, hasCv: true },
    transcript: [],
    flags: [],
    metrics: [],
    lateAdditions: [],
    status: "completed",
    scorecard: {
      summary: {
        strongest: { questionIndex: 1, why: "Clear opener" },
        practiceNext: "structure",
        meeraTake: "Good energy! Your stories stop right before the payoff.",
        oneThing: { pattern: "End with the result", evidence: "2 of 3 answers", whyItMatters: "It's what they remember" },
      },
      answers: [answer(1, scores(4, 3, 3, 4, 3)), answer(2, scores(4, 2, 3, 4, 3)), answer(3, scores(4, 2, 3, 4, 4))],
    },
    retries: [],
    ...overrides,
  };
}
