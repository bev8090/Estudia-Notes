import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// The CLI (migrate, db pull, studio) uses the direct connection on port 5432.
// The app itself connects through the pooled DATABASE_URL in src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
