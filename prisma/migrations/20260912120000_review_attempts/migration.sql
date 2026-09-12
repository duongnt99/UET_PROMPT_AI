-- CreateEnum
CREATE TYPE "ReviewAttemptStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "attemptNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Review" ADD COLUMN "status" "ReviewAttemptStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ReviewAssignment" ADD COLUMN "submittedAttemptCount" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "Review_assignmentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_assignmentId_attemptNumber_key" ON "Review"("assignmentId", "attemptNumber");
CREATE INDEX "Review_assignmentId_status_idx" ON "Review"("assignmentId", "status");

-- At most one active DRAFT attempt per assignment (enforced at DB level).
CREATE UNIQUE INDEX "Review_one_draft_per_assignment_idx" ON "Review"("assignmentId") WHERE "status" = 'DRAFT';

-- Backfill attempt status from persisted review data (not assignment status alone).
UPDATE "Review"
SET "status" = 'SUBMITTED'
WHERE "submittedAt" IS NOT NULL;

-- Backfill submitted attempt counts from actual submitted review rows.
UPDATE "ReviewAssignment" ra
SET "submittedAttemptCount" = sub.cnt
FROM (
  SELECT "assignmentId", COUNT(*)::int AS cnt
  FROM "Review"
  WHERE "status" = 'SUBMITTED'
  GROUP BY "assignmentId"
) sub
WHERE ra.id = sub."assignmentId";
