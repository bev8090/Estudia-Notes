import { z } from "zod";
import { generateStructured } from "./client.ts";
import { shortAnswerCount } from "../../domain/exam.ts";

export type Difficulty = "STANDARD" | "HARD" | "CHALLENGE";

export const ExamSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["MCQ", "SHORT"]),
      topicNumber: z.number().int().describe("The number of the topic this question tests"),
      prompt: z.string(),
      choices: z.array(z.string()).describe("Exactly 4 choices for MCQ; empty for SHORT"),
      correctChoice: z.number().int().nullable().describe("0-3 index of the correct choice for MCQ; null for SHORT"),
      modelAnswer: z.string().nullable().describe("SHORT only: an ideal 1-3 sentence answer; null for MCQ"),
      rubric: z.string().nullable().describe("SHORT only: the key points needed for full credit and what earns partial credit; null for MCQ"),
      explanation: z.string().describe("Why the answer is correct, shown to the student after submitting"),
    }),
  ),
});

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  STANDARD:
    "STANDARD: Tests recall and understanding of the key points and definitions. A student who reviewed the summary should do well. Wrong choices are clearly wrong to someone who studied.",
  HARD:
    "HARD: Tests applying ideas to new examples and connecting two or more concepts. Wrong choices are plausible and reflect common misconceptions.",
  CHALLENGE:
    "CHALLENGE: Scenario-based questions that require analysis, comparing related ideas, spotting edge cases, and combining ideas across topics. Wrong choices are close to correct and only rule out with careful reasoning.",
};

const SYSTEM = `You write practice exams for students from a summary of their own notes.

Rules:
- Test only material in the summary. Never require outside knowledge.
- Follow the requested difficulty closely:
  ${Object.values(DIFFICULTY_GUIDE).join("\n  ")}
- Spread questions across the topics (or across the focus topics, if given), giving HIGH-importance topics and the exam priorities more questions than LOW ones. Do not repeat a question or test the same fact twice.
- Use each topic's "Be able to" tips as the skills to test, and its common mistakes as wrong choices, since those are the confusions a well-designed exam checks for.
- Multiple choice (MCQ): exactly 4 choices, exactly one correct. Wrong choices should be similar in length and style to the correct one. Never use "All of the above", "None of the above", or choices that refer to other choices, because the choices are shuffled after you write them.
- Explanations must refer to choices by their content, never by letter or position ("A", "the second option"), because the order changes. Say why the correct answer is right and, for MCQ, why the most tempting wrong choice is wrong.
- Short answer (SHORT): answerable in 1-3 sentences. The rubric lists the specific points required for full credit and what counts as partial credit.
- Questions should be clear and unambiguous, and must not give away their own answers.`;

export type ExamTopic = {
  name: string;
  importance: "HIGH" | "MEDIUM" | "LOW";
  keyPoints: string[];
  keyTerms: { term: string; definition: string }[];
  examTips: string[];
  pitfalls: string[];
};

const bullets = (label: string, items: string[]) =>
  items.length ? `\n${label}:\n${items.map((item) => `  - ${item}`).join("\n")}` : "";

export function generateExamQuestions(opts: {
  overview: string;
  examPriorities: string[];
  topics: ExamTopic[];
  difficulty: Difficulty;
  questionCount: number;
  focusTopicNumbers: number[];
}) {
  const short = shortAnswerCount(opts.questionCount);
  const summary = opts.topics
    .map(
      (t, i) =>
        `Topic ${i + 1}: ${t.name} (importance: ${t.importance})` +
        bullets("Key points", t.keyPoints) +
        bullets("Key terms", t.keyTerms.map((k) => `${k.term}: ${k.definition}`)) +
        bullets("Be able to", t.examTips) +
        bullets("Common mistakes", t.pitfalls),
    )
    .join("\n\n");
  const priorities = bullets("Exam priorities (most important first)", opts.examPriorities);
  const focus = opts.focusTopicNumbers.length
    ? `\nFocus only on these topics: ${opts.focusTopicNumbers.join(", ")}. The student has been getting them wrong.`
    : "";

  return generateStructured({
    task: `exam ${opts.difficulty} x${opts.questionCount}`,
    system: SYSTEM,
    content: [
      {
        type: "text",
        text:
          `<summary>\nOverview: ${opts.overview}${priorities}\n\n${summary}\n</summary>\n\n` +
          `Write exactly ${opts.questionCount} questions: ${opts.questionCount - short} MCQ and ${short} SHORT, mixed together.\n` +
          `Difficulty: ${opts.difficulty}.${focus}`,
      },
    ],
    schema: ExamSchema,
    // Good distractors and a real difficulty gap need careful thought, so use high effort here.
    effort: "high",
  });
}
