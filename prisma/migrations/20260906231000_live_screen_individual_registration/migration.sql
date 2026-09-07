ALTER TABLE "ScreenShareSession"
ADD COLUMN "registrationId" TEXT;

UPDATE "ScreenShareSession" AS session
SET "registrationId" = registration.id
FROM "Registration" AS registration
WHERE registration."teamId" = session."teamId";

ALTER TABLE "ScreenShareSession"
ALTER COLUMN "registrationId" SET NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL;

DROP INDEX IF EXISTS "ScreenShareSession_contestSessionId_teamId_status_idx";
DROP INDEX IF EXISTS "ScreenShareSession_active_slot_key";
DROP INDEX IF EXISTS "ScreenShareSession_active_participant_key";

CREATE INDEX "ScreenShareSession_contestSessionId_registrationId_status_idx"
ON "ScreenShareSession"("contestSessionId", "registrationId", "status");

CREATE UNIQUE INDEX "ScreenShareSession_active_slot_key"
ON "ScreenShareSession"("contestSessionId", "registrationId", "slot")
WHERE "endedAt" IS NULL;

CREATE UNIQUE INDEX "ScreenShareSession_active_participant_key"
ON "ScreenShareSession"("contestSessionId", "registrationId", "participantId")
WHERE "endedAt" IS NULL;

ALTER TABLE "ScreenShareSession"
ADD CONSTRAINT "ScreenShareSession_registrationId_fkey"
FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
