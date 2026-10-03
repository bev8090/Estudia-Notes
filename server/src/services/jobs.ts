import { prisma } from "../lib/prisma.ts";
import { AiError } from "../lib/errors.ts";

// AI work takes 10–60s, longer than a request should hang. Routes save a row with
// status PROCESSING, respond right away, and hand the slow part to this runner.
// The browser polls the row until it becomes READY or FAILED.
export function runInBackground(
  label: string,
  job: () => Promise<void>,
  markFailed: (message: string) => Promise<unknown>,
) {
  const started = Date.now();
  job()
    .then(() => console.log(`[job] ${label} done in ${((Date.now() - started) / 1000).toFixed(1)}s`))
    .catch(async (err) => {
      console.error(`[job] ${label} failed:`, err);
      const message =
        err instanceof AiError ? err.message : "Something went wrong while processing. Please try again.";
      await markFailed(message).catch((e) => console.error(`[job] ${label} could not be marked failed:`, e));
    });
}

// Jobs live in this process's memory, so a restart kills any that were running.
// Without this, those rows would say PROCESSING forever. Safe because there is a
// single server instance; with several instances this would need a real job queue.
export async function failInterruptedJobs() {
  const data = { status: "FAILED" as const, error: "Interrupted by a server restart. Please try again." };
  const where = { status: "PROCESSING" as const };
  const [notes, exams, attempts] = await Promise.all([
    prisma.note.updateMany({ where, data }),
    prisma.exam.updateMany({ where, data }),
    prisma.attempt.updateMany({ where, data }),
  ]);
  const total = notes.count + exams.count + attempts.count;
  if (total > 0) console.log(`[job] marked ${total} interrupted job(s) as failed`);
}
