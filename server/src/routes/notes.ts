import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { HttpError } from "../lib/errors.ts";
import { parse, parseId } from "../lib/validate.ts";
import { aiRateLimit, requireDailyQuota } from "../middleware/limits.ts";
import { MAX_IMAGES, MAX_TOTAL_BYTES, prepareNoteInput } from "../services/extract.ts";
import { runInBackground } from "../services/jobs.ts";
import { processNote } from "../services/notes.ts";

export const notesRouter = Router();

// Files are kept in memory only long enough to send to Claude; nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_IMAGES, fileSize: MAX_TOTAL_BYTES, fieldSize: 2 * 1024 * 1024 },
});

const createNoteBody = z.object({
  title: z.string().trim().max(120).optional(),
  text: z.string().optional(),
});

// Create a note from pasted text or uploaded files. Responds 202 right away;
// the summary is generated in the background and the client polls GET /:id.
notesRouter.post("/", aiRateLimit, requireDailyQuota, upload.array("files", MAX_IMAGES), async (req, res) => {
  const userId = req.userId!;
  const body = parse(createNoteBody, req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const input = await prepareNoteInput(files, body.text);

  const userTitle = body.title || undefined;
  const fallbackTitle = files[0]?.originalname.replace(/\.[^.]+$/, "") || "New notes";
  const note = await prisma.note.create({
    data: { userId, title: userTitle ?? fallbackTitle, sourceType: input.sourceType, rawText: input.rawText },
    select: { id: true },
  });

  runInBackground(
    `note ${note.id}`,
    () => processNote(note.id, input, !userTitle),
    (error) => prisma.note.update({ where: { id: note.id }, data: { status: "FAILED", error } }),
  );

  res.status(202).json({ id: note.id });
});

notesRouter.get("/", async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      sourceType: true,
      status: true,
      error: true,
      createdAt: true,
      _count: { select: { exams: true } },
    },
  });
  res.json(notes.map(({ _count, ...n }) => ({ ...n, examCount: _count.exams })));
});

notesRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params);
  // Filtering by userId as well as id is what stops one user from reading another's notes.
  const note = await prisma.note.findFirst({
    where: { id, userId: req.userId! },
    select: {
      id: true,
      title: true,
      sourceType: true,
      status: true,
      error: true,
      createdAt: true,
      summary: {
        select: {
          overview: true,
          topics: {
            orderBy: { order: "asc" },
            select: { id: true, name: true, keyPoints: true, keyTerms: true },
          },
        },
      },
      exams: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          difficulty: true,
          questionCount: true,
          status: true,
          error: true,
          createdAt: true,
          attempts: { where: { status: "READY" }, select: { score: true } },
        },
      },
    },
  });
  if (!note) throw new HttpError(404, "Note not found");

  res.json({
    ...note,
    exams: note.exams.map(({ attempts, ...exam }) => ({
      ...exam,
      attemptCount: attempts.length,
      bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score ?? 0)) : null,
    })),
  });
});

notesRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params);
  // Deleting the note cascades to its summary, topics, exams, attempts and answers.
  const { count } = await prisma.note.deleteMany({ where: { id, userId: req.userId! } });
  if (count === 0) throw new HttpError(404, "Note not found");
  res.status(204).end();
});
