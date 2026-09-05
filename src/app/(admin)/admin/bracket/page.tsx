import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { CreateScoringMatchForm } from "@/components/admin/match-setup-form";
import { getProductionCompetition } from "@/server/services/competition-service";

export default async function Page() {
  await requirePermission("bracket:manage");
  const competition = await getProductionCompetition();
  const [matches, finalists, judges, rounds, challenges] = await Promise.all([
    prisma.match.findMany({
      include: {
        round: true,
        competitorA: true,
        competitorB: true,
        judgeAssignments: { include: { judge: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.finalist.findMany({
      where: { registration: { status: "SELECTED" } },
      include: { registration: { include: { team: true, owner: { include: { profile: true } } } } },
      orderBy: { seed: "asc" },
    }),
    prisma.roleAssignment.findMany({
      where: { role: "JUDGE", revokedAt: null },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.finalRound.findMany({
      orderBy: { order: "asc" },
    }),
    competition
      ? prisma.matchChallenge.findMany({
          where: { competitionId: competition.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl">Bracket tùy biến</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chọn hai finalist, gán giám khảo, gán đề chung, tạo trận và mở chấm (SCORING). Bracket mặc định 8 đội, không bye.
        </p>
      </div>

      <Card>
        <h2 className="font-semibold">Tạo cặp đấu</h2>
        <p className="mt-2 text-sm text-slate-600">
          Chỉ hiện finalist đang SELECTED. Sau khi tạo, hệ thống mở trang chi tiết trận. Giám khảo vào{" "}
          <code>/judge</code>.
        </p>
        <div className="mt-4">
          <CreateScoringMatchForm
            judgesPerMatch={competition?.settings.numberOfJudgesPerMatch ?? 3}
            finalists={finalists.map((item) => ({
              id: item.id,
              label: `${item.displayName} (${item.registration.code})`,
            }))}
            judges={judges.map((item) => ({
              id: item.user.id,
              label: item.user.name ? `${item.user.name} — ${item.user.email}` : item.user.email,
            }))}
            rounds={rounds.map((item) => ({
              id: item.id,
              label: `${item.displayName} (${item.status})`,
            }))}
            challenges={challenges}
          />
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="font-semibold">Các trận hiện có</h2>
        {matches.length === 0 ? <p className="text-sm text-slate-600">Chưa có trận.</p> : null}
        {matches.map((match) => (
          <Link key={match.id} href={`/admin/bracket/${match.id}`} className="block">
            <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {match.round.displayName} · {match.code}
                </p>
                <p className="text-sm">
                  {match.competitorA?.displayName ?? "TBD"} vs{" "}
                  {match.competitorB?.displayName ?? (match.isBye ? "BYE" : "TBD")}
                </p>
                <p className="text-xs text-slate-500">
                  GK:{" "}
                  {match.judgeAssignments.length
                    ? match.judgeAssignments.map((item) => item.judge.email).join(", ")
                    : "chưa gán"}
                </p>
              </div>
              <Badge
                tone={
                  match.status === "SCORING" ? "gold" : match.status === "COMPLETED" ? "green" : "slate"
                }
              >
                {match.status}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
