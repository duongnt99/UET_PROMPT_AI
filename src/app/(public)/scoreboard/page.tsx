import { getProductionCompetition } from "@/server/services/competition-service";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Scoreboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const competition = await getProductionCompetition();
  if (!competition?.settings.publicScoreboardEnabled) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="display text-4xl">Scoreboard</h1>
        <Card className="mt-6">Bảng điểm chưa được mở công khai.</Card>
      </div>
    );
  }
  const matches = await prisma.match.findMany({
    where: { competitionId: competition.id },
    include: { competitorA: true, competitorB: true, round: true },
    orderBy: { code: "asc" },
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="display text-4xl">Scoreboard</h1>
      <div className="mt-8 space-y-3">
        {matches.length === 0 ? <p>Chưa có trận đấu.</p> : null}
        {matches.map((match) => (
          <Card key={match.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                {match.round.displayName} · {match.code}
              </p>
              <p className="font-semibold">
                {match.competitorA?.displayName ?? "TBD"} vs {match.competitorB?.displayName ?? "TBD"}
              </p>
            </div>
            <Badge>{match.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
