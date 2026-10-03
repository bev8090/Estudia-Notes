import "dotenv/config";
import { z } from "zod";

// Fail fast on startup if configuration is missing, instead of on the first request.
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  // One setting to switch models, e.g. to claude-opus-5-5 for harder exams.
  AI_MODEL: z.string().default("claude-sonnet-5-5"),
  // Max notes + exams one user can generate per 24 hours. Protects the API budget.
  DAILY_AI_LIMIT: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
