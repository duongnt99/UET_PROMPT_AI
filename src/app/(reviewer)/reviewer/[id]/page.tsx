import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/scoring/review-form";
import { Card } from "@/components/ui/form";
import { parseCompetitionSettings } from "@/config/competition-settings";
import {
  canStartResubmit,
  getActiveDraftReview,
  getLatestSubmittedReview,
  resolveReviewSubmissionLimit,
} from "@/server/domain/review-scoring";

function mapReviewValues(
  review: {
    overallComment: string;
    totalNormalized: { toString(): string };
    submittedAt: Date | null;
    items: Array<{ criterionId: string; rawScore: { toString(): string }; comment: string }>;
  } | null,
) {
  if (!review) return null;
  return {
    overallComment: review.overallComment,
    totalNormalized: review.totalNormalized.toString(),
    submittedAt: review.submittedAt?.toISOString() ?? null,
    items: review.items.map((item) => ({
      criterionId: item.criterionId,
      rawScore: item.rawScore.toString(),
      comment: item.comment,
    })),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAnyRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id },
    include: {
      rubric: { include: { criteria: { orderBy: { displayOrder: "asc" } } } },
      submissionVersion: true,
      submission: { include: { registration: true } },
      competition: true,
      reviews: {
        include: { items: true },
        orderBy: { attemptNumber: "asc" },
      },
    },
  });
  if (!assignment) notFound();
  if (user.roles.includes("REVIEWER") && assignment.reviewerId !== user.id) notFound();

  const settings = parseCompetitionSettings(assignment.competition.settings);
  const submissionLimit = resolveReviewSubmissionLimit(
    assignment.submission.reviewSubmissionLimit,
    settings.reviewSubmissionLimit,
  );
  const activeDraft = getActiveDraftReview(assignment.reviews);
  const latestSubmitted = getLatestSubmittedReview(assignment.reviews);
  const mode =
    assignment.status === "LOCKED" || (assignment.status === "SUBMITTED" && !activeDraft)
      ? "readonly"
      : "edit";
  const canResubmit =
    mode === "readonly" && canStartResubmit(assignment.submittedAttemptCount, submissionLimit);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="display text-3xl">Chấm Audition</h1>
      <Card className="mt-4">
        <p className="font-semibold">{assignment.submissionVersion.submissionTitle}</p>
        <p className="mt-2 text-sm">{assignment.submissionVersion.solutionSummary}</p>
        <p className="mt-2 text-sm">Gemini: {assignment.submissionVersion.geminiUsageSummary}</p>
      </Card>
      <div className="mt-6">
        <ReviewForm
          key={`${assignment.id}-${activeDraft?.attemptNumber ?? latestSubmitted?.attemptNumber ?? 0}-${mode}`}
          assignmentId={assignment.id}
          mode={mode}
          submittedAttemptCount={assignment.submittedAttemptCount}
          submissionLimit={submissionLimit}
          canResubmit={canResubmit}
          initialReview={mapReviewValues(activeDraft ?? latestSubmitted)}
          latestSubmittedReview={mapReviewValues(latestSubmitted)}
          criteria={assignment.rubric.criteria.map((c) => ({
            id: c.id,
            titleVi: c.titleVi,
            weight: c.weight.toString(),
            minScore: c.minScore.toString(),
            maxScore: c.maxScore.toString(),
            scoreStep: c.scoreStep.toString(),
          }))}
        />
      </div>
    </div>
  );
}
