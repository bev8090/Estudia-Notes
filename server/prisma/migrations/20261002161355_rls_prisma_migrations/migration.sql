-- Prisma creates _prisma_migrations itself, so the init migration couldn't cover it.
-- Hide it from Supabase's Data API; Prisma connects as postgres, which bypasses RLS.
-- Guarded because Prisma's shadow database may not have this table.
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._prisma_migrations FROM anon, authenticated;
  END IF;
END $$;
