import express from "express";
import cors from "cors";
import { env } from "./lib/env.ts";
import { prisma } from "./lib/prisma.ts";
import { requireAuth } from "./middleware/auth.ts";
//import { notesRouter } from "./routes/notes.ts";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "up" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ userId: req.userId });
});

//app.use("/api/notes", requireAuth, notesRouter);

// Express 5 forwards rejected promises from async handlers here.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
