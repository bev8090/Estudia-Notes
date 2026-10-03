// Pure grading logic: no database, no network.

// Multiple choice is graded in code: instant, free, and always consistent.
export function gradeMcq(correctIndex: number | null, selectedIndex: number | null | undefined) {
  const isCorrect = selectedIndex != null && selectedIndex === correctIndex;
  return { score: isCorrect ? 1 : 0, isCorrect };
}

// Short answers get one of three verdicts from Claude, mapped to points here.
export const VERDICT_SCORES = { full: 1, partial: 0.5, none: 0 } as const;
export type Verdict = keyof typeof VERDICT_SCORES;

// Fraction of points earned, 0..1. Every question counts, including unanswered ones.
export function attemptScore(scores: number[]) {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
