import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/form";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteSubmissionAction } from "@/server/actions/admin-delete-actions";
import { getProductionCompetition } from "@/server/services/competition-service";
import { resolveReviewSubmissionLimit } from "@/server/domain/review-scoring";
import { SubmissionReviewLimitForm } from "@/components/admin/submission-review-limit-form";
import { SubmissionReviewsPanel } from "@/components/admin/submission-reviews-panel";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("submission:manage");
  const { id } = await params;
  const competition = await getProductionCompetition();
  const item = await prisma.submission.findUnique({
    where: { id },
    include: {
      currentVersion: true,
      registration: { include: { team: true, owner: { include: { profile: true } } } },
      reviews: {
        include: {
          reviewer: { select: { email: true, name: true } },
          rubric: { include: { criteria: { orderBy: { displayOrder: "asc" } } } },
          reviews: {
            include: { items: true },
            orderBy: { attemptNumber: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!item || item.deletedAt) notFound();

  const competitionDefault = competition?.settings.reviewSubmissionLimit ?? 1;
  const effectiveLimit = resolveReviewSubmissionLimit(item.reviewSubmissionLimit, competitionDefault);

  const reviewAssignments = item.reviews.map((assignment) => ({
    id: assignment.id,
    reviewerLabel: assignment.reviewer.name
      ? `${assignment.reviewer.name} — ${assignment.reviewer.email}`
      : assignment.reviewer.email,
    status: assignment.status,
    submittedAttemptCount: assignment.submittedAttemptCount,
    submissionLimit: resolveReviewSubmissionLimit(item.reviewSubmissionLimit, competitionDefault),
    criteria: assignment.rubric.criteria.map((criterion) => ({
      id: criterion.id,
      titleVi: criterion.titleVi,
      weight: criterion.weight.toString(),
    })),
    attempts: assignment.reviews.map((attempt) => ({
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      overallComment: attempt.overallComment,
      totalNormalized: attempt.totalNormalized.toString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      items: attempt.items.map((score) => ({
        criterionId: score.criterionId,
        rawScore: score.rawScore.toString(),
        comment: score.comment,
      })),
    })),
  }));

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/admin/submissions" className="text-slate-600 underline">
          ← Danh sách bài nộp
        </Link>
      </p>
      <h1 className="display text-3xl">{item.currentVersion?.submissionTitle}</h1>
      <p className="text-sm text-slate-600">
        {item.registration.team?.teamName || item.registration.code} · {item.registration.code}
      </p>
      <Card className="whitespace-pre-wrap">{item.currentVersion?.solutionSummary}</Card>
      <Card>Gemini: {item.currentVersion?.geminiUsageSummary}</Card>
      <Card>Video: {item.currentVersion?.introVideoUrl ?? "—"}</Card>

      <Card>
        <h2 className="font-semibold">Giới hạn lượt nộp đánh giá</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cài đặt riêng cho bài này. Mỗi reviewer chỉ được nộp tối đa số lượt bạn đặt (lưu nháp không tính).
        </p>
        <div className="mt-4">
          <SubmissionReviewLimitForm
            submissionId={item.id}
            submissionLimit={item.reviewSubmissionLimit}
            competitionDefault={competitionDefault}
            effectiveLimit={effectiveLimit}
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Phiếu chấm của reviewer</h2>
        <p className="mt-1 text-sm text-slate-600">
          Điểm từng tiêu chí, nhận xét và lịch sử các lần nộp. Điểm tổng hợp dùng lượt SUBMITTED mới nhất của mỗi
          reviewer.
        </p>
        <div className="mt-4">
          <SubmissionReviewsPanel assignments={reviewAssignments} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Xóa bài nộp</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ẩn bài (WITHDRAWN). Đội có thể nộp lại. Review đã chấm được giữ trong hệ thống.
        </p>
        <div className="mt-4">
          <AdminDeleteForm
            idPrefix={`sub-${item.id}`}
            action={deleteSubmissionAction}
            hidden={{ submissionId: item.id }}
            warning="Không hiện trên danh sách Audition nữa."
            submitLabel="Xóa bài nộp"
          />
        </div>
      </Card>
    </div>
  );
}
