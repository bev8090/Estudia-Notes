// Pure exam logic: no database, no network. Kept separate so it can be unit tested.

export type GeneratedQuestion = {
  type: "MCQ" | "SHORT";
  topicNumber: number;
  prompt: string;
  choices: string[];
  correctChoice: number | null;
  modelAnswer: string | null;
  rubric: string | null;
  explanation: string;
};

// The row shape saved to the questions table (minus examId, which Prisma fills in).
export type QuestionRow = {
  order: number;
  type: "MCQ" | "SHORT";
  topicId: string | null;
  prompt: string;
  choices: string[];
  correctIndex: number | null;
  modelAnswer: string | null;
  rubric: string | null;
  explanation: string;
};

export class InvalidExamError extends Error {}

// About 30% short answer: 5 -> 2, 10 -> 3, 25 -> 8. The rest are multiple choice.
export function shortAnswerCount(questionCount: number) {
  return Math.round(questionCount * 0.3);
}

// Never trust model output blindly: check every question, drop malformed ones, and
// shuffle MCQ choices so the correct answer's position is truly random.
// Throws if fewer than questionCount usable questions remain (the caller retries).
export function buildQuestionRows(
  generated: GeneratedQuestion[],
  opts: { questionCount: number; topicIds: string[]; random?: () => number },
): QuestionRow[] {
  const random = opts.random ?? Math.random;
  const rows: QuestionRow[] = [];

  for (const q of generated) {
    if (rows.length === opts.questionCount) break;
    const prompt = q.prompt.trim();
    const explanation = q.explanation.trim();
    if (!prompt || !explanation) continue;
    // Topics are numbered from 1 in the prompt; map back to database ids.
    const topicId = opts.topicIds[q.topicNumber - 1] ?? null;

    if (q.type === "MCQ") {
      const choices = q.choices.map((c) => c.trim());
      const distinct = new Set(choices.map((c) => c.toLowerCase())).size;
      const correct = q.correctChoice;
      if (choices.length !== 4 || choices.some((c) => !c) || distinct !== 4) continue;
      if (correct == null || !Number.isInteger(correct) || correct < 0 || correct > 3) continue;

      const { choices: shuffled, correctIndex } = shuffleChoices(choices, correct, random);
      rows.push({
        order: rows.length,
        type: "MCQ",
        topicId,
        prompt,
        choices: shuffled,
        correctIndex,
        modelAnswer: null,
        rubric: null,
        explanation,
      });
    } else {
      const modelAnswer = q.modelAnswer?.trim();
      const rubric = q.rubric?.trim();
      if (!modelAnswer || !rubric) continue;
      rows.push({
        order: rows.length,
        type: "SHORT",
        topicId,
        prompt,
        choices: [],
        correctIndex: null,
        modelAnswer,
        rubric,
        explanation,
      });
    }
  }

  if (rows.length < opts.questionCount) {
    throw new InvalidExamError(`Expected ${opts.questionCount} valid questions, got ${rows.length}`);
  }
  return rows;
}

// Fisher–Yates shuffle that tracks where the correct choice ends up.
export function shuffleChoices(choices: string[], correctIndex: number, random: () => number) {
  const order = choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { choices: order.map((i) => choices[i]), correctIndex: order.indexOf(correctIndex) };
}
