import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition?.settings.publicScoreboardEnabled) {
    return NextResponse.json({ matches: [] });
  }
  const matches = await prisma.match.findMany({
    where: { competitionId: competition.id },
    include: { competitorA: true, competitorB: true, round: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({
    matches: matches.map((match) => ({
      code: match.code,
      round: match.round.displayName,
      status: match.status,
      competitorA: match.competitorA?.displayName ?? null,
      competitorB: match.competitorB?.displayName ?? null,
      scorePublished: competition.settings.publicScoresEnabled && match.publicStatus === "PUBLISHED",
    })),
  });
}
