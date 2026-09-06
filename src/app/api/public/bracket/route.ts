import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition?.settings.publicScoreboardEnabled) {
    return NextResponse.json({ enabled: false, updatedAt: new Date().toISOString(), rounds: [] });
  }
  const rounds = await prisma.finalRound.findMany({
    where: { competitionId: competition.id, matches: { some: { publicStatus: { not: "ARCHIVED" } } } },
    include: {
      matches: {
        where: { publicStatus: { not: "ARCHIVED" } },
        include: { competitorA: true, competitorB: true, winner: true },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({
    enabled: true,
    updatedAt: new Date().toISOString(),
    rounds: rounds.map((round) => ({
      id: round.id,
      name: round.displayName,
      matches: round.matches.map((match) => ({
        id: match.id,
        code: match.code,
        status: match.status,
        competitorA: match.competitorA?.displayName ?? null,
        competitorB: match.competitorB?.displayName ?? null,
        winner: match.winner?.displayName ?? null,
      })),
    })),
  });
}
