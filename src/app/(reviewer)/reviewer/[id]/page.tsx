import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/scoring/review-form";
import { Card } from "@/components/ui/form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAnyRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id },
    include: {
      rubric: { include: { criteria: { orderBy: { displayOrder: "asc" } } } },
      submissionVersion: true,
      submission: { include: { registration: true } },
    },
  });
  if (!assignment) notFound();
  if (user.roles.includes("REVIEWER") && assignment.reviewerId !== user.id) notFound();
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
          assignmentId={assignment.id}
          locked={assignment.status === "SUBMITTED" || assignment.status === "LOCKED"}
          criteria={assignment.rubric.criteria.map((c) => ({
            id: c.id,
            titleVi: c.titleVi,
            weight: c.weight.toString(),
            minScore: c.minScore.toString(),
            maxScore: c.maxScore.toString(),
          }))}
        />
      </div>
    </div>
  );
}
