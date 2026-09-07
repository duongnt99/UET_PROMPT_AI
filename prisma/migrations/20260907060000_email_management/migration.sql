CREATE TYPE "EmailBatchStatus" AS ENUM ('PENDING', 'SENDING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED', 'CANCELLED');
CREATE TYPE "EmailRecipientType" AS ENUM ('ALL_USERS', 'ALL_PARTICIPANTS', 'SPECIFIC_USERS');

CREATE TABLE "EmailBatch" (
    "id" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "recipientType" "EmailRecipientType" NOT NULL,
    "recipientFilter" JSONB,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EmailBatchStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EmailOutbox" ADD COLUMN "batchId" TEXT;
ALTER TABLE "EmailOutbox" ADD COLUMN "userId" TEXT;
ALTER TABLE "EmailOutbox" ADD COLUMN "providerMessageId" TEXT;

CREATE UNIQUE INDEX "EmailBatch_idempotencyKey_key" ON "EmailBatch"("idempotencyKey");
CREATE INDEX "EmailBatch_createdAt_idx" ON "EmailBatch"("createdAt");
CREATE INDEX "EmailBatch_status_createdAt_idx" ON "EmailBatch"("status", "createdAt");
CREATE INDEX "EmailBatch_createdByAdminId_createdAt_idx" ON "EmailBatch"("createdByAdminId", "createdAt");
CREATE INDEX "EmailOutbox_batchId_status_idx" ON "EmailOutbox"("batchId", "status");
CREATE INDEX "EmailOutbox_userId_idx" ON "EmailOutbox"("userId");

ALTER TABLE "EmailBatch" ADD CONSTRAINT "EmailBatch_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "EmailBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
