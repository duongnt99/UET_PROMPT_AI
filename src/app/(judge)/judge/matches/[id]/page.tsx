import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/form";
import { getActiveRubric } from "@/server/services/review-service";
import { formatScoreDisplay } from "@/server/domain/scoring";
import { JudgeDraftForm, JudgeSubmitForm } from "@/components/scoring/judge-score-forms";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAnyRole(["JUDGE", "ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const assignment = await prisma.judgeAssignment.findFirst({
    where: { matchId: id, judgeId: user.id },
    include: {
      match: { include: { competitorA: true, competitorB: true } },
      scores: { include: { items: true } },
    },
  });
  if (!assignment) notFound();
  const rubric = await getActiveRubric(assignment.competitionId, "FINAL");
  const locked = assignment.status === "SUBMITTED";
  const competitors = [assignment.match.competitorA, assignment.match.competitorB].filter(Boolean);
  const draftedCount = assignment.scores.filter((score) =>
    competitors.some((competitor) => competitor!.id === score.competitorId),
  ).length;
  const canSubmit = draftedCount >= competitors.length && competitors.length > 0;
  const submittedAt = assignment.scores.find((score) => score.submittedAt)?.submittedAt;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <p className="text-sm">
        <Link href="/judge" className="text-slate-600 underline">
          ← Danh sách trận
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">Chấm trận {assignment.match.code}</h1>
        <Badge tone={locked ? "green" : "gold"}>{locked ? "Đã nộp phiếu" : "Chưa nộp"}</Badge>
      </div>
      <p className="text-sm text-slate-600">Trạng thái trận: {assignment.match.status}.</p>

      {locked ? (
        <Card className="mt-4 border-emerald-200 bg-emerald-50">
          <p className="font-semibold text-emerald-900">Phiếu của bạn đã được ghi nhận.</p>
          <p className="mt-1 text-sm text-emerald-800">
            {submittedAt
              ? `Nộp lúc ${submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`
              : null}{" "}
            Đây là điểm của riêng giám khảo này. Kết quả gộp (trung bình 3 giám khảo) do Ban Tổ chức xem tại{" "}
            <span className="font-medium">/admin/scoring</span> sau khi đủ phiếu.
          </p>
        </Card>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Chấm từng bên, bấm <strong>Lưu nháp</strong>, thấy thông báo xanh, rồi mới <strong>Nộp điểm trận</strong>.
        </p>
      )}

      {competitors.map((competitor) => {
        const draft = assignment.scores.find((score) => score.competitorId === competitor!.id);
        return (
          <Card key={competitor!.id} className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{competitor!.displayName}</h2>
              {draft ? (
                <Badge tone={locked ? "green" : "blue"}>
                  {locked ? "Đã nộp" : "Đã lưu nháp"} · tổng {formatScoreDisplay(draft.totalNormalized.toString())}
                </Badge>
              ) : (
                <Badge>Chưa lưu nháp</Badge>
              )}
            </div>
            {locked ? (
              <ul className="mt-3 space-y-1 text-sm">
                {rubric?.criteria.map((c) => {
                  const item = draft?.items.find((row) => row.criterionId === c.id);
                  return (
                    <li key={c.id}>
                      {c.titleVi}: {item ? item.rawScore.toString() : "—"} / 10
                    </li>
                  );
                })}
                {draft?.overallComment ? <li>Nhận xét: {draft.overallComment}</li> : null}
              </ul>
            ) : (
              <JudgeDraftForm
                assignmentId={assignment.id}
                competitorId={competitor!.id}
                matchId={assignment.matchId}
                locked={locked}
                overallComment={draft?.overallComment ?? ""}
                criteria={
                  rubric?.criteria.map((c) => ({
                    id: c.id,
                    titleVi: c.titleVi,
                    weight: c.weight.toString(),
                    rawScore: draft?.items.find((item) => item.criterionId === c.id)?.rawScore.toString() ?? "",
                  })) ?? []
                }
              />
            )}
          </Card>
        );
      })}

      {!locked ? (
        <JudgeSubmitForm
          assignmentId={assignment.id}
          matchId={assignment.matchId}
          locked={locked}
          canSubmit={canSubmit}
        />
      ) : null}
    </div>
  );
}
