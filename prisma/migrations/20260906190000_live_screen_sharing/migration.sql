CREATE TYPE "ScreenShareStatus" AS ENUM (
  'CONNECTING',
  'ACTIVE',
  'RECONNECTING',
  'STOPPED',
  'DISCONNECTED'
);

ALTER TABLE "InternalNote"
ADD COLUMN "contestSessionId" TEXT;

CREATE TABLE "ScreenShareSession" (
  "id" TEXT NOT NULL,
  "contestSessionId" TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "slot" INTEGER NOT NULL,
  "connectionId" TEXT NOT NULL,
  "status" "ScreenShareStatus" NOT NULL DEFAULT 'CONNECTING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreenShareSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalNote_contestSessionId_registrationId_createdAt_idx"
ON "InternalNote"("contestSessionId", "registrationId", "createdAt");

CREATE INDEX "ScreenShareSession_contestSessionId_teamId_status_idx"
ON "ScreenShareSession"("contestSessionId", "teamId", "status");

CREATE INDEX "ScreenShareSession_participantId_endedAt_idx"
ON "ScreenShareSession"("participantId", "endedAt");

CREATE INDEX "ScreenShareSession_lastSeenAt_idx"
ON "ScreenShareSession"("lastSeenAt");

CREATE UNIQUE INDEX "ScreenShareSession_active_slot_key"
ON "ScreenShareSession"("contestSessionId", "teamId", "slot")
WHERE "endedAt" IS NULL;

CREATE UNIQUE INDEX "ScreenShareSession_active_participant_key"
ON "ScreenShareSession"("contestSessionId", "teamId", "participantId")
WHERE "endedAt" IS NULL;

ALTER TABLE "InternalNote"
ADD CONSTRAINT "InternalNote_contestSessionId_fkey"
FOREIGN KEY ("contestSessionId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreenShareSession"
ADD CONSTRAINT "ScreenShareSession_contestSessionId_fkey"
FOREIGN KEY ("contestSessionId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreenShareSession"
ADD CONSTRAINT "ScreenShareSession_competitionId_fkey"
FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreenShareSession"
ADD CONSTRAINT "ScreenShareSession_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreenShareSession"
ADD CONSTRAINT "ScreenShareSession_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
