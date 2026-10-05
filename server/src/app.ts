import express from "express";
import cors from "cors";
import multer from "multer";
import { env } from "./lib/env.ts";
import { prisma } from "./lib/prisma.ts";
import { HttpError } from "./lib/errors.ts";
import { requireAuth } from "./middleware/auth.ts";
import { notesRouter } from "./routes/notes.ts";
import { examsRouter } from "./routes/exams.ts";
import { statsRouter } from "./routes/stats.ts";
import { demoRouter } from "./routes/demo.ts";
import { DEMO_LIMITS, FULL_LIMITS } from "./services/extract.ts";

// Builds the Express app without starting it, so tests can send requests to it directly.
export function createApp() {
  const app = express();

  // Hosts like Render sit behind one proxy; trust it so req.ip and the rate limiter
  // see the real client address instead of the proxy's.
  app.set("trust proxy", 1);
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (_req, res) => {
    res.send("Server is running");
  });

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  });

  // The free demo works without an account (its claim route checks login itself),
  // so it's mounted before the login check below.
  app.use("/api/demo", demoRouter);

  // Everything else under /api requires a signed-in user.
  app.use("/api", requireAuth);
  app.get("/api/me", (req, res) => {
    res.json({ userId: req.userId });
  });
  app.use("/api/notes", notesRouter);
  app.use("/api", examsRouter);
  app.use("/api", statsRouter);

  // Express 5 forwards errors thrown in async handlers here.
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...(err.code && { code: err.code }) });
      return;
    }
    if (err instanceof multer.MulterError) {
      const limits = req.originalUrl.startsWith("/api/demo") ? DEMO_LIMITS : FULL_LIMITS;
      const message =
        err.code === "LIMIT_FILE_SIZE" ? `Uploads are limited to ${Math.round(limits.maxTotalBytes / 1024 / 1024)} MB in total.`
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? `Upload one document at a time, or up to ${limits.maxImages} photos.`
        : "That upload couldn't be processed.";
      res.status(400).json({ error: message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
