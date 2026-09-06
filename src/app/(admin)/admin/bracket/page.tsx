import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { CreateEightTeamBracketForm, CreateScoringMatchForm } from "@/components/admin/match-setup-form";
import { getProductionCompetition } from "@/server/services/competition-service";
import { matchStatusLabel } from "@/lib/status-labels";

export default async function Page() {
  await requirePermission("bracket:manage");
  const competition = await getProductionCompetition();
  const [matches, finalists, judges, rounds, challenges] = await Promise.all([
    prisma.match.findMany({
      where: competition ? { competitionId: competition.id, publicStatus: { not: "ARCHIVED" } } : { id: "__none__" },
      include: {
        round: true,
        competitorA: true,
        competitorB: true,
        judgeAssignments: { include: { judge: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.finalist.findMany({
      where: { competitionId: competition?.id ?? "__none__", registration: { status: "SELECTED" } },
      include: { registration: { include: { team: true, owner: { include: { profile: true } } } } },
      orderBy: { seed: "asc" },
    }),
    prisma.roleAssignment.findMany({
      where: { role: "JUDGE", revokedAt: null },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.finalRound.findMany({
      where: { competitionId: competition?.id ?? "__none__" },
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
        <h1 className="display text-3xl">Quản lý bảng đấu</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ghép hai đội vào từng trận, gán giám khảo và đề thi. Bảng đấu công khai tự cập nhật khi công bố đội thắng.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <h2 className="font-semibold">Khởi tạo sơ đồ loại trực tiếp</h2>
          <div className="mt-3"><CreateEightTeamBracketForm /></div>
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Bảng trình chiếu đang dùng dữ liệu trực tiếp</p>
            <p className="text-sm text-slate-600">Mở toàn màn hình để Ban Giám khảo theo dõi các đội đi tiếp.</p>
          </div>
          <Link href="/scoreboard" target="_blank" className="font-semibold text-blue-700 underline">Mở bảng đấu công khai</Link>
        </Card>
      )}

      <Card>
        <details>
          <summary className="cursor-pointer font-semibold">Tạo trận riêng lẻ (tùy chọn nâng cao)</summary>
          <p className="mt-2 text-sm text-slate-600">
            Dùng khi cần tạo thêm trận ngoài sơ đồ 8 đội. Chỉ hiện đội đã được chọn vào chung kết.
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
              label: `${item.displayName} (${matchStatusLabel(item.status)})`,
            }))}
            challenges={challenges}
            />
          </div>
        </details>
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
                  {match.competitorA?.displayName ?? "Chưa xác định"} gặp{" "}
                  {match.competitorB?.displayName ?? (match.isBye ? "Được miễn đấu" : "Chưa xác định")}
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
                {matchStatusLabel(match.status)}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
