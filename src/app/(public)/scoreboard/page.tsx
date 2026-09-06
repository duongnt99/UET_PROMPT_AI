import { getProductionCompetition } from "@/server/services/competition-service";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { TournamentBracket, type PublicBracketData } from "@/components/live/tournament-bracket";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bảng đấu trực tiếp" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const competition = await getProductionCompetition();
  if (!competition?.settings.publicScoreboardEnabled) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="display text-4xl">Bảng đấu trực tiếp</h1>
        <Card className="mt-6">Bảng điểm chưa được mở công khai.</Card>
      </div>
    );
  }
  const rounds = await prisma.finalRound.findMany({
    where: { competitionId: competition.id, matches: { some: { publicStatus: { not: "ARCHIVED" } } } },
    include: { matches: { where: { publicStatus: { not: "ARCHIVED" } }, include: { competitorA: true, competitorB: true, winner: true }, orderBy: { code: "asc" } } },
    orderBy: { order: "asc" },
  });
  const initialData: PublicBracketData = {
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
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="display text-4xl">Bảng đấu trực tiếp</h1>
      <p className="mt-2 text-slate-600">Theo dõi hành trình từ tứ kết đến đội vô địch. Kết quả tự động hiện khi Ban Tổ chức chốt đội thắng.</p>
      <div className="mt-8"><TournamentBracket initialData={initialData} /></div>
    </div>
  );
}
