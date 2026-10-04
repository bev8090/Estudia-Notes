import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, db pull, studio) uses the direct connection on port 5432.
// The app itself connects through the pooled DATABASE_URL in src/lib/prisma.ts.
// Read with process.env (not Prisma's env(), which throws when unset) so that
// `prisma generate` works without database credentials, e.g. during `npm install`
// on a fresh clone or a build server. Migrate commands still fail clearly if it's missing.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
