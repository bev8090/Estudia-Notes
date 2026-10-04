import { prisma } from "../lib/prisma.ts";
import { AiError } from "../lib/errors.ts";
import { buildQuestionRows, InvalidExamError, type QuestionRow } from "../domain/exam.ts";
import { generateExamQuestions } from "./ai/generateExam.ts";

const MAX_TRIES = 2;

// Background half of "create an exam": generate questions from the note's summary,
// check them, and save them in one write.
export async function processExam(examId: string) {
  const exam = await prisma.exam.findUniqueOrThrow({
    where: { id: examId },
    select: {
      difficulty: true,
      questionCount: true,
      focusTopicIds: true,
      note: {
        select: {
          summary: {
            select: {
              overview: true,
              examPriorities: true,
              topics: {
                orderBy: { order: "asc" },
                select: { id: true, name: true, importance: true, keyPoints: true, keyTerms: true, examTips: true, pitfalls: true },
              },
            },
          },
        },
      },
    },
  });
  const summary = exam.note.summary;
  if (!summary) throw new AiError("This note doesn't have a summary yet.");

  const topicIds = summary.topics.map((t) => t.id);
  let rows: QuestionRow[] | undefined;

  // Model output is occasionally malformed (say, 3 choices instead of 4). Retry once
  // before giving up, rather than saving a broken exam.
  for (let attempt = 1; !rows; attempt++) {
    const { data } = await generateExamQuestions({
      overview: summary.overview,
      examPriorities: summary.examPriorities,
      topics: summary.topics.map((t) => ({
        name: t.name,
        importance: t.importance,
        keyPoints: t.keyPoints,
        keyTerms: t.keyTerms as { term: string; definition: string }[],
        examTips: t.examTips,
        pitfalls: t.pitfalls,
      })),
      difficulty: exam.difficulty,
      questionCount: exam.questionCount,
      focusTopicNumbers: exam.focusTopicIds.map((id) => topicIds.indexOf(id) + 1).filter((n) => n > 0),
    });
    try {
      rows = buildQuestionRows(data.questions, { questionCount: exam.questionCount, topicIds });
    } catch (err) {
      if (!(err instanceof InvalidExamError)) throw err;
      console.warn(`[exam ${examId}] try ${attempt}: ${err.message}`);
      if (attempt >= MAX_TRIES) throw new AiError("The generated exam didn't pass quality checks. Please try again.");
    }
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { status: "READY", error: null, questions: { create: rows } },
  });
}
