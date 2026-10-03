import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { HttpError } from "../lib/errors.ts";
import { parse, parseId } from "../lib/validate.ts";
import { aiRateLimit, requireDailyQuota } from "../middleware/limits.ts";
import { gradeMcq, attemptScore } from "../domain/grading.ts";
import { runInBackground } from "../services/jobs.ts";
import { processExam } from "../services/exams.ts";
import { gradeAttempt } from "../services/attempts.ts";

// Mounted at /api.
export const examsRouter = Router();

// What a student may see while taking an exam. An explicit allow-list means the
// answer key (correctIndex, modelAnswer, rubric, explanation) can't leak by accident.
export const publicQuestionSelect = {
  id: true,
  order: true,
  type: true,
  prompt: true,
  choices: true,
  topic: { select: { name: true } },
} as const;

const createExamBody = z.object({
  difficulty: z.enum(["STANDARD", "HARD", "CHALLENGE"]),
  questionCount: z.literal([5, 10, 25]),
  focusTopicIds: z.array(z.uuid()).max(8).default([]),
});

examsRouter.post("/notes/:id/exams", aiRateLimit, requireDailyQuota, async (req, res) => {
  const userId = req.userId!;
  const noteId = parseId(req.params);
  const body = parse(createExamBody, req.body);

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { status: true, summary: { select: { topics: { select: { id: true } } } } },
  });
  if (!note) throw new HttpError(404, "Note not found");
  if (note.status !== "READY" || !note.summary) throw new HttpError(409, "The summary isn't ready yet.");

  const validTopicIds = new Set(note.summary.topics.map((t) => t.id));
  if (body.focusTopicIds.some((id) => !validTopicIds.has(id))) {
    throw new HttpError(400, "focusTopicIds: every topic must belong to this note");
  }

  const exam = await prisma.exam.create({
    data: { noteId, userId, difficulty: body.difficulty, questionCount: body.questionCount, focusTopicIds: body.focusTopicIds },
    select: { id: true },
  });

  runInBackground(
    `exam ${exam.id}`,
    () => processExam(exam.id),
    (error) => prisma.exam.update({ where: { id: exam.id }, data: { status: "FAILED", error } }),
  );

  res.status(202).json({ id: exam.id });
});

examsRouter.get("/exams/:id", async (req, res) => {
  const id = parseId(req.params);
  const exam = await prisma.exam.findFirst({
    where: { id, userId: req.userId! },
    select: {
      id: true,
      difficulty: true,
      questionCount: true,
      status: true,
      error: true,
      createdAt: true,
      note: { select: { id: true, title: true } },
      questions: { orderBy: { order: "asc" }, select: publicQuestionSelect },
      attempts: {
        orderBy: { submittedAt: "desc" },
        select: { id: true, status: true, score: true, submittedAt: true },
      },
    },
  });
  if (!exam) throw new HttpError(404, "Exam not found");
  res.json(exam);
});

const submitBody = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.uuid(),
        selectedIndex: z.number().int().min(0).max(3).nullish(),
        text: z.string().max(3000).nullish(),
      }),
    )
    .max(100),
});

// Submit answers. Multiple choice is scored immediately; if there are written
// answers, they are graded by Claude in the background and the client polls.
examsRouter.post("/exams/:id/attempts", aiRateLimit, async (req, res) => {
  const userId = req.userId!;
  const examId = parseId(req.params);
  const body = parse(submitBody, req.body);

  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
    select: { status: true, questions: { select: { id: true, type: true, correctIndex: true } } },
  });
  if (!exam) throw new HttpError(404, "Exam not found");
  if (exam.status !== "READY") throw new HttpError(409, "This exam isn't ready yet.");

  const submitted = new Map(body.answers.map((a) => [a.questionId, a]));

  // One answer row per question, so unanswered questions count as 0 instead of vanishing.
  const answers = exam.questions.map((q) => {
    const a = submitted.get(q.id);
    if (q.type === "MCQ") {
      return { questionId: q.id, selectedIndex: a?.selectedIndex ?? null, ...gradeMcq(q.correctIndex, a?.selectedIndex) };
    }
    const text = a?.text?.trim() || null;
    // Blank written answers get 0 without spending an AI call on them.
    return text
      ? { questionId: q.id, text, score: null, isCorrect: null }
      : { questionId: q.id, text: null, score: 0, isCorrect: false, feedback: "No answer given." };
  });

  const needsGrading = answers.some((a) => a.score === null);
  const attempt = await prisma.attempt.create({
    data: {
      examId,
      userId,
      status: needsGrading ? "PROCESSING" : "READY",
      score: needsGrading ? null : attemptScore(answers.map((a) => a.score ?? 0)),
      answers: { create: answers },
    },
    select: { id: true },
  });

  if (needsGrading) {
    runInBackground(
      `attempt ${attempt.id}`,
      () => gradeAttempt(attempt.id),
      (error) => prisma.attempt.update({ where: { id: attempt.id }, data: { status: "FAILED", error } }),
    );
  }

  res.status(201).json({ id: attempt.id });
});

// Full review: the answer key is revealed only once an attempt has been submitted.
examsRouter.get("/attempts/:id", async (req, res) => {
  const id = parseId(req.params);
  const attempt = await prisma.attempt.findFirst({
    where: { id, userId: req.userId! },
    select: {
      id: true,
      status: true,
      error: true,
      score: true,
      submittedAt: true,
      answers: {
        select: { questionId: true, selectedIndex: true, text: true, score: true, isCorrect: true, feedback: true },
      },
      exam: {
        select: {
          id: true,
          difficulty: true,
          questionCount: true,
          note: { select: { id: true, title: true } },
          questions: {
            orderBy: { order: "asc" },
            select: {
              ...publicQuestionSelect,
              correctIndex: true,
              modelAnswer: true,
              explanation: true,
            },
          },
        },
      },
    },
  });
  if (!attempt) throw new HttpError(404, "Attempt not found");

  const answers = new Map(attempt.answers.map(({ questionId, ...a }) => [questionId, a]));
  const { questions, ...exam } = attempt.exam;
  res.json({
    id: attempt.id,
    status: attempt.status,
    error: attempt.error,
    score: attempt.score,
    submittedAt: attempt.submittedAt,
    exam,
    questions: questions.map((q) => ({ ...q, answer: answers.get(q.id) ?? null })),
  });
});
