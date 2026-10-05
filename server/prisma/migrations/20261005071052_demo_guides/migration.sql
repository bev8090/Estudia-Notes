-- CreateTable
CREATE TABLE "demo_guides" (
    "id" UUID NOT NULL,
    "ipHash" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "rawText" TEXT,
    "title" TEXT,
    "guide" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedBy" UUID,
    "claimedNote" UUID,

    CONSTRAINT "demo_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_guides_ipHash_createdAt_idx" ON "demo_guides"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "demo_guides_createdAt_idx" ON "demo_guides"("createdAt");

-- Lock the table away from Supabase's Data API, like every other table.
ALTER TABLE "demo_guides" ENABLE ROW LEVEL SECURITY;
