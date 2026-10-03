import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../lib/env.ts";
import { HttpError } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";

// Every AI call costs money, so AI routes have two guards:

// 1. Burst limit: at most 10 AI requests per minute per user (stops runaway clicking or scripts).
export const aiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.userId!, // runs after requireAuth, so this is always set
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." },
});

// 2. Daily cap: notes + exams created in the last 24 hours, counted from the database.
// Known gap: deleting rows frees up quota. A usage-log table would close it if needed.
export const requireDailyQuota: RequestHandler = async (req, _res, next) => {
  const where = { userId: req.userId!, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
  const [notes, exams] = await Promise.all([prisma.note.count({ where }), prisma.exam.count({ where })]);
  if (notes + exams >= env.DAILY_AI_LIMIT) {
    throw new HttpError(429, `You've reached today's limit of ${env.DAILY_AI_LIMIT} AI generations. Please try again tomorrow.`);
  }
  next();
};
