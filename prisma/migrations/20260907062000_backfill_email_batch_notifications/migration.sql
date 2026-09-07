INSERT INTO "Notification" ("id", "userId", "title", "body", "createdAt")
SELECT
  'email-batch:' || batch."id" || ':' || delivery."userId",
  delivery."userId",
  batch."subject",
  batch."textContent",
  batch."createdAt"
FROM "EmailBatch" batch
JOIN "EmailOutbox" delivery ON delivery."batchId" = batch."id"
WHERE delivery."userId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
