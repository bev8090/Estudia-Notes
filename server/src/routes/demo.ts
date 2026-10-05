import { createHash } from "node:crypto";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../lib/env.ts";
import { prisma } from "../lib/prisma.ts";
import { AiError, HttpError } from "../lib/errors.ts";
import { parse, parseId } from "../lib/validate.ts";
import { requireAuth } from "../middleware/auth.ts";
import { DEMO_LIMITS, prepareNoteInput } from "../services/extract.ts";
import { summarizeNotes, type Summary } from "../services/ai/summarize.ts";

// The free demo: a visitor without an account can make ONE study guide from their own
// notes. Practice exams require an account. After signing up, the demo guide is copied
// into the new account ("claimed") so the user can keep going with it.
// Mounted at /api/demo, before the global login check.
export const demoRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 7; // unclaimed demo guides are deleted after this

type DemoGuideJson = Pick<Summary, "overview" | "examPriorities" | "topics"> & { model: string };

// Store only a salted one-way hash of the IP: enough to count free uses, not to identify anyone.
const hashIp = (ip: string | undefined) => createHash("sha256").update(`${env.DEMO_SALT}:${ip ?? "unknown"}`).digest("hex");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: DEMO_LIMITS.maxImages, fileSize: DEMO_LIMITS.maxTotalBytes, fieldSize: 256 * 1024 },
});

// Burst guard per IP (the default key), separate from the per-day limits below.
const demoBurstLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." },
});

// Checked before the upload is read, so a visitor who has used their free try
// doesn't upload a file only to be turned away.
const demoQuota: RequestHandler = async (req, res, next) => {
  const ipHash = hashIp(req.ip);
  const since = new Date(Date.now() - DAY_MS);
  const [mine, everyone] = await Promise.all([
    prisma.demoGuide.count({ where: { ipHash, createdAt: { gte: since } } }),
    prisma.demoGuide.count({ where: { createdAt: { gte: since } } }),
  ]);
  if (mine >= env.DEMO_PER_IP_PER_DAY) {
    throw new HttpError(
      429,
      "You've used your free study guide. Create a free account to make more and take practice exams.",
      "DEMO_USED",
    );
  }
  if (everyone >= env.DEMO_DAILY_LIMIT) {
    throw new HttpError(503, "The free demo is at capacity today. Create a free account to keep going.", "DEMO_BUSY");
  }
  res.locals.ipHash = ipHash;
  next();
};

// Add stable ids so the client can render topics the same way as a saved note.
const withTopicIds = (guide: DemoGuideJson) => ({
  overview: guide.overview,
  examPriorities: guide.examPriorities,
  topics: guide.topics.map((t, i) => ({ id: `demo-topic-${i + 1}`, ...t })),
});

demoRouter.post("/study-guide", demoBurstLimit, demoQuota, upload.array("files", DEMO_LIMITS.maxImages), async (req, res) => {
  const body = parse(z.object({ text: z.string().optional() }), req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const input = await prepareNoteInput(files, body.text, DEMO_LIMITS);

  void cleanupExpiredDemoGuides();

  // Reserve the visitor's free try before the slow AI call, so two requests at once
  // can't both get one. A failed attempt releases it again (see catch below).
  const row = await prisma.demoGuide.create({
    data: { ipHash: res.locals.ipHash as string, sourceType: input.sourceType, rawText: input.rawText },
    select: { id: true },
  });

  try {
    const { data, model } = await summarizeNotes(input.content);
    if (!data.usable || data.topics.length === 0) {
      throw new AiError(data.problem ?? "We couldn't find any study material in this upload.");
    }
    const guide: DemoGuideJson = { overview: data.overview, examPriorities: data.examPriorities, topics: data.topics, model };
    const title = data.title.slice(0, 120);
    await prisma.demoGuide.update({ where: { id: row.id }, data: { title, guide } });
    res.json({ id: row.id, title, sourceType: input.sourceType, guide: withTopicIds(guide) });
  } catch (err) {
    await prisma.demoGuide.delete({ where: { id: row.id } }).catch(() => {});
    if (err instanceof AiError) throw new HttpError(422, err.message);
    throw err;
  }
});

// Copy a demo study guide into the signed-in user's account as a normal note.
demoRouter.post("/:id/claim", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseId(req.params);
  const expired = new HttpError(404, "This demo study guide has expired.", "DEMO_EXPIRED");

  const demo = await prisma.demoGuide.findUnique({ where: { id } });
  if (!demo || !demo.guide || demo.createdAt < new Date(Date.now() - KEEP_DAYS * DAY_MS)) throw expired;
  if (demo.claimedBy) {
    // Claiming twice (e.g. a page reload) returns the same note instead of a copy.
    if (demo.claimedBy === userId && demo.claimedNote) {
      res.json({ noteId: demo.claimedNote });
      return;
    }
    throw expired;
  }

  const guide = demo.guide as unknown as DemoGuideJson;
  const noteId = await prisma.$transaction(async (tx) => {
    // Only one claim can win, even if two arrive at the same moment.
    const { count } = await tx.demoGuide.updateMany({ where: { id, claimedBy: null }, data: { claimedBy: userId } });
    if (count === 0) throw expired;
    const note = await tx.note.create({
      data: {
        userId,
        title: demo.title ?? "My notes",
        sourceType: demo.sourceType,
        rawText: demo.rawText,
        status: "READY",
        summary: {
          create: {
            overview: guide.overview,
            examPriorities: guide.examPriorities,
            model: guide.model,
            topics: {
              create: guide.topics.map((t, order) => ({
                name: t.name,
                order,
                importance: t.importance,
                keyPoints: t.keyPoints,
                keyTerms: t.keyTerms,
                examTips: t.examTips,
                pitfalls: t.pitfalls,
              })),
            },
          },
        },
      },
      select: { id: true },
    });
    await tx.demoGuide.update({ where: { id }, data: { claimedNote: note.id } });
    return note.id;
  });

  res.status(201).json({ noteId });
});

// Demo guides are only kept long enough to be claimed after sign-up.
export async function cleanupExpiredDemoGuides() {
  try {
    await prisma.demoGuide.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_DAYS * DAY_MS) } } });
  } catch (err) {
    console.error("[demo] cleanup failed:", err);
  }
}
