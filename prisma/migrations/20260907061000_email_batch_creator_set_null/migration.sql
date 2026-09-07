ALTER TABLE "EmailBatch" DROP CONSTRAINT "EmailBatch_createdByAdminId_fkey";
ALTER TABLE "EmailBatch" ALTER COLUMN "createdByAdminId" DROP NOT NULL;
ALTER TABLE "EmailBatch" ADD CONSTRAINT "EmailBatch_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
