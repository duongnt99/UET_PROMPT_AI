import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import Link from "next/link";
import type { Metadata } from "next";
import { reviewStatusLabel } from "@/lib/status-labels";
import { getProductionCompetition } from "@/server/services/competition-service";
import {
  getActiveDraftReview,
  resolveReviewSubmissionLimit,
  reviewAttemptUsageLabel,
} from "@/server/domain/review-scoring";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function assignmentStatusLabel(item: {
  status: string;
  submittedAttemptCount: number;
  reviews: Array<{ status: "DRAFT" | "SUBMITTED"; attemptNumber: number }>;
}) {
  if (getActiveDraftReview(item.reviews)) {
    return "Đang có nháp";
  }
  return reviewStatusLabel(item.status);
}

export default async function Page() {
  const user = await requireAnyRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);
  const competition = await getProductionCompetition();
  const competitionDefault = competition?.settings.reviewSubmissionLimit ?? 1;
  const assignments = await prisma.reviewAssignment.findMany({
    where: user.roles.includes("REVIEWER") ? { reviewerId: user.id } : {},
    include: {
      submission: {
        include: { currentVersion: true, registration: true },
      },
      reviews: { select: { status: true, attemptNumber: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="display text-3xl">Reviewer</h1>
      <div className="mt-4 space-y-3">
        {assignments.map((item) => (
          <Link key={item.id} href={`/reviewer/${item.id}`}>
            <Card className="flex items-center justify-between gap-3">
              <div>
                <span>{item.submission.currentVersion?.submissionTitle || item.submission.registration.code}</span>
                {item.submittedAttemptCount > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {reviewAttemptUsageLabel(
                      item.submittedAttemptCount,
                      resolveReviewSubmissionLimit(item.submission.reviewSubmissionLimit, competitionDefault),
                    )}
                  </p>
                ) : null}
              </div>
              <Badge>{assignmentStatusLabel(item)}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
