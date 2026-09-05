-- AlterTable
ALTER TABLE "Match" ADD COLUMN "problemTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Match" ADD COLUMN "problemPrompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Match" ADD COLUMN "challengeId" TEXT;

-- CreateTable
CREATE TABLE "MatchChallenge" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchChallenge_competitionId_idx" ON "MatchChallenge"("competitionId");

-- CreateIndex
CREATE INDEX "Match_challengeId_idx" ON "Match"("challengeId");

-- AddForeignKey
ALTER TABLE "MatchChallenge" ADD CONSTRAINT "MatchChallenge_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "MatchChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
