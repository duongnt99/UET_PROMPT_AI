import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import { finalizeMatchIfReady } from "@/server/services/match-service";
import { formatScoreDisplay } from "@/server/domain/scoring";
import Link from "next/link";

export default async function Page() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ["SCORING", "VERDICT", "TIE_REVIEW", "NEEDS_VERDICT"] } },
    include: { judgeAssignments: { include: { scores: true } }, competitorA: true, competitorB: true },
  });
  const progress = await Promise.all(
    matches.map(async (match) => ({ match, summary: await finalizeMatchIfReady(match.id) })),
  );
  return (
    <div>
      <h1 className="display text-3xl">Chấm chung kết</h1>
      <p className="mt-2 text-sm text-slate-600">Điểm gộp = trung bình phiếu đã nộp. Cần đủ số giám khảo cấu hình mới chốt.</p>
      <div className="mt-4 space-y-3">
        {progress.length === 0 ? <p className="text-sm text-slate-600">Không có trận đang chấm.</p> : null}
        {progress.map(({ match, summary }) => (
          <Link key={match.id} href={`/admin/bracket/${match.id}`} className="block">
            <Card>
              <div className="flex justify-between">
                <p className="font-semibold">
                  {match.code}: {match.competitorA?.displayName ?? "TBD"} vs {match.competitorB?.displayName ?? "TBD"}
                </p>
                <Badge>{match.status}</Badge>
              </div>
              <p className="text-sm">
                Judge đã nộp: {match.judgeAssignments.filter((a) => a.status === "SUBMITTED").length}/
                {match.judgeAssignments.length}
              </p>
              {summary.ready ? (
                <p className="text-sm">
                  {match.competitorA?.displayName ?? "A"} {formatScoreDisplay(summary.aggregateA)} —{" "}
                  {match.competitorB?.displayName ?? "B"} {formatScoreDisplay(summary.aggregateB)} — {summary.tieState}
                </p>
              ) : (
                <p className="text-sm text-amber-700">Chưa đủ điểm để chốt.</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
