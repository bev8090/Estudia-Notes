-- CreateEnum
CREATE TYPE "TopicImportance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "summaries" ADD COLUMN     "examPriorities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "examTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "importance" "TopicImportance" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "pitfalls" TEXT[] DEFAULT ARRAY[]::TEXT[];
