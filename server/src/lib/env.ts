import "dotenv/config";
import { z } from "zod";

// Fail fast on startup if configuration is missing, instead of on the first request.
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  // Browser origins allowed to call the API. Comma-separated, e.g.
  // "https://estudia-notes.vercel.app,http://localhost:3000"
  CLIENT_URL: z
    .string()
    .transform((value) => value.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean))
    .pipe(z.array(z.url()).min(1)),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  // One setting to switch models, e.g. to claude-opus-5-5 for harder exams.
  AI_MODEL: z.string().default("claude-sonnet-5-5"),
  // Max notes + exams one user can generate per 24 hours. Protects the API budget.
  DAILY_AI_LIMIT: z.coerce.number().int().positive().default(30),
  // Free demo (no account): study guides per IP address per 24 hours, and across all visitors.
  DEMO_PER_IP_PER_DAY: z.coerce.number().int().nonnegative().default(1),
  DEMO_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(100),
  // Mixed into the IP hash so stored hashes can't be matched against a list of IPs.
  DEMO_SALT: z.string().min(8).default("estudia-notes-demo-salt"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
