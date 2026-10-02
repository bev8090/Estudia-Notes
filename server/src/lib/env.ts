import "dotenv/config";
import { z } from "zod";

// Fail fast on startup if configuration is missing, instead of on the first request.
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
