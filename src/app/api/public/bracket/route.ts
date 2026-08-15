import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition) return NextResponse.json({ rounds: [] });
  const rounds = await prisma.finalRound.findMany({
    where: { competitionId: competition.id },
    include: {
      matches: {
        include: { competitorA: true, competitorB: true },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({
    rounds: rounds.map((round) => ({
      name: round.displayName,
      matches: round.matches.map((match) => ({
        code: match.code,
        status: match.status,
        competitorA: match.competitorA?.displayName ?? null,
        competitorB: match.competitorB?.displayName ?? null,
      })),
    })),
  });
}
