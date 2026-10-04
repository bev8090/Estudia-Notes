import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { attemptScore } from "../domain/grading.ts";
import { topicStats } from "../domain/stats.ts";

// Mounted at /api.
export const statsRouter = Router();

// Enough history for a student's progress page; keeps the query bounded as usage grows.
const MAX_ATTEMPTS = 200;
const HISTORY_POINTS = 30;

// Progress across all of the user's graded attempts: headline numbers, score history,
// and per-topic accuracy grouped by note (so weak topics can be practiced per note).
statsRouter.get("/stats", async (req, res) => {
  const userId = req.userId!;

  const attempts = (
    await prisma.attempt.findMany({
      where: { userId, status: "READY" },
      orderBy: { submittedAt: "desc" },
      take: MAX_ATTEMPTS,
      select: {
        id: true,
        score: true,
        submittedAt: true,
        exam: { select: { id: true, difficulty: true, questionCount: true, note: { select: { id: true, title: true } } } },
        answers: { select: { score: true, question: { select: { topicId: true } } } },
      },
    })
  ).reverse(); // oldest first, for the chart

  const answers = attempts.flatMap((a) =>
    a.answers.map((ans) => ({ topicId: ans.question.topicId, score: ans.score ?? 0, submittedAt: a.submittedAt })),
  );
  const stats = topicStats(answers);

  const topics = await prisma.topic.findMany({
    where: { id: { in: stats.map((s) => s.topicId) } },
    select: { id: true, name: true, order: true, summary: { select: { note: { select: { id: true, title: true } } } } },
  });
  const topicInfo = new Map(topics.map((t) => [t.id, t]));

  // Group topics under their note; weakest topics (and the notes containing them) first.
  const notes = new Map<string, { noteId: string; noteTitle: string; topics: (ReturnType<typeof topicStats>[number] & { name: string })[] }>();
  for (const s of stats) {
    const info = topicInfo.get(s.topicId);
    if (!info) continue;
    const { id: noteId, title: noteTitle } = info.summary.note;
    const group = notes.get(noteId) ?? { noteId, noteTitle, topics: [] };
    group.topics.push({ ...s, name: info.name });
    notes.set(noteId, group);
  }
  const byNote = [...notes.values()]
    .map((n) => ({ ...n, topics: n.topics.sort((a, b) => a.accuracy - b.accuracy) }))
    .sort((a, b) => a.topics[0].accuracy - b.topics[0].accuracy);

  res.json({
    totals: {
      attempts: attempts.length,
      averageScore: attempts.length ? attemptScore(attempts.map((a) => a.score ?? 0)) : null,
      questionsAnswered: answers.length,
      topicsPracticed: stats.length,
      weakTopics: stats.filter((s) => s.weak).length,
    },
    history: attempts.slice(-HISTORY_POINTS).map((a) => ({
      attemptId: a.id,
      score: a.score ?? 0,
      submittedAt: a.submittedAt,
      difficulty: a.exam.difficulty,
      questionCount: a.exam.questionCount,
      noteTitle: a.exam.note.title,
    })),
    notes: byNote,
  });
});
