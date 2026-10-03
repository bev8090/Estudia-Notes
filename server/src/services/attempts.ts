import { prisma } from "../lib/prisma.ts";
import { attemptScore } from "../domain/grading.ts";
import { gradeShortAnswers } from "./ai/gradeShortAnswers.ts";

// Background half of "submit an attempt": multiple choice and blank answers were
// already scored when the attempt was saved; this grades the written answers with
// Claude, then computes the final score.
export async function gradeAttempt(attemptId: string) {
  const pending = await prisma.answer.findMany({
    where: { attemptId, score: null },
    orderBy: { question: { order: "asc" } },
    select: { id: true, text: true, question: { select: { prompt: true, rubric: true, modelAnswer: true } } },
  });

  const grades = await gradeShortAnswers(
    pending.map((a) => ({
      prompt: a.question.prompt,
      rubric: a.question.rubric ?? "",
      modelAnswer: a.question.modelAnswer ?? "",
      studentAnswer: a.text ?? "",
    })),
  );

  await prisma.$transaction(
    pending.map((a, i) =>
      prisma.answer.update({
        where: { id: a.id },
        data: { score: grades[i].score, isCorrect: grades[i].score === 1, feedback: grades[i].feedback },
      }),
    ),
  );

  const all = await prisma.answer.findMany({ where: { attemptId }, select: { score: true } });
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { status: "READY", error: null, score: attemptScore(all.map((a) => a.score ?? 0)) },
  });
}
