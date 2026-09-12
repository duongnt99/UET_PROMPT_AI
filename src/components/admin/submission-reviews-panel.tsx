import { Badge, Card } from "@/components/ui/form";
import { formatScoreDisplay } from "@/server/domain/scoring";
import { reviewAttemptUsageLabel } from "@/server/domain/review-scoring";
import { reviewStatusLabel } from "@/lib/status-labels";

type Criterion = { id: string; titleVi: string; weight: string };

type ReviewAttempt = {
  attemptNumber: number;
  status: "DRAFT" | "SUBMITTED";
  overallComment: string;
  totalNormalized: string;
  submittedAt: string | null;
  items: Array<{
    criterionId: string;
    rawScore: string;
    comment: string;
  }>;
};

type ReviewAssignmentView = {
  id: string;
  reviewerLabel: string;
  status: string;
  submittedAttemptCount: number;
  submissionLimit: number;
  criteria: Criterion[];
  attempts: ReviewAttempt[];
};

function AttemptCard({
  attempt,
  criteria,
}: {
  attempt: ReviewAttempt;
  criteria: Criterion[];
}) {
  const criterionMap = new Map(criteria.map((c) => [c.id, c]));
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">Lượt #{attempt.attemptNumber}</p>
        <Badge>{attempt.status === "SUBMITTED" ? "Đã nộp" : "Nháp"}</Badge>
        {attempt.submittedAt ? (
          <span className="text-xs text-slate-500">
            {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
          </span>
        ) : null}
        <span className="text-xs text-slate-600">
          Tổng: {formatScoreDisplay(attempt.totalNormalized)}
        </span>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {attempt.items.map((item) => {
          const criterion = criterionMap.get(item.criterionId);
          return (
            <li key={item.criterionId} className="rounded-lg border border-white bg-white p-2">
              <p className="font-medium">
                {criterion?.titleVi ?? item.criterionId}
                {criterion ? ` (${criterion.weight}%)` : ""}
              </p>
              <p className="mt-1">Điểm: {item.rawScore}</p>
              {item.comment ? <p className="mt-1 text-slate-600">{item.comment}</p> : null}
            </li>
          );
        })}
      </ul>
      {attempt.overallComment ? (
        <div className="mt-3 rounded-lg border border-white bg-white p-2 text-sm">
          <p className="font-medium">Nhận xét tổng</p>
          <p className="mt-1 text-slate-700">{attempt.overallComment}</p>
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionReviewsPanel({ assignments }: { assignments: ReviewAssignmentView[] }) {
  if (assignments.length === 0) {
    return <p className="text-sm text-slate-600">Chưa có reviewer được phân công cho bài này.</p>;
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{assignment.reviewerLabel}</p>
              <p className="text-sm text-slate-600">
                {reviewAttemptUsageLabel(assignment.submittedAttemptCount, assignment.submissionLimit)}
              </p>
            </div>
            <Badge>{reviewStatusLabel(assignment.status)}</Badge>
          </div>
          {assignment.attempts.length === 0 ? (
            <p className="text-sm text-slate-500">Reviewer chưa bắt đầu chấm.</p>
          ) : (
            <div className="space-y-3">
              {assignment.attempts.map((attempt) => (
                <AttemptCard key={attempt.attemptNumber} attempt={attempt} criteria={assignment.criteria} />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
