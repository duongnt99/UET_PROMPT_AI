import { prisma } from "@/lib/db/prisma";
import { autoAssignAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { AssignReviewerForm, UnassignReviewerForm } from "@/components/admin/review-assign-form";

export default async function Page() {
  await requirePermission("review:assign");
  const [items, submissions, reviewers] = await Promise.all([
    prisma.reviewAssignment.findMany({
      include: {
        reviewer: true,
        submission: { include: { registration: { include: { team: true } }, currentVersion: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.submission.findMany({
      where: { deletedAt: null, status: { not: "WITHDRAWN" } },
      include: { registration: { include: { team: true, owner: { include: { profile: true } } } }, currentVersion: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roleAssignment.findMany({
      where: { role: "REVIEWER", revokedAt: null, user: { deletedAt: null, status: { not: "DISABLED" } } },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl">Phân công chấm</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gán tay reviewer cho từng đội/hồ sơ có bài Audition, hoặc bấm tự động cân bằng tải.
        </p>
      </div>
      <Card>
        <h2 className="font-semibold">Gán tay</h2>
        <div className="mt-3">
          <AssignReviewerForm
            submissions={submissions.map((item) => ({
              id: item.id,
              label: `${item.registration.team?.teamName || item.registration.owner.profile?.fullName || item.registration.owner.email} · ${item.registration.code}${item.currentVersion?.submissionTitle ? ` · ${item.currentVersion.submissionTitle}` : ""}`,
            }))}
            reviewers={reviewers.map((item) => ({
              id: item.user.id,
              label: item.user.name ? `${item.user.name} — ${item.user.email}` : item.user.email,
            }))}
          />
        </div>
      </Card>
      <form action={autoAssignAction}>
        <Button type="submit" variant="outline">
          Tự động phân công cân bằng
        </Button>
      </form>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-slate-600">Chưa có phân công.</p> : null}
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {item.reviewer.email} → {item.submission.registration.team?.teamName || item.submission.registration.code}
              </p>
              <p className="text-sm text-slate-600">{item.submission.currentVersion?.submissionTitle || item.submission.registration.code}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.status}</Badge>
              {item.status !== "SUBMITTED" && item.status !== "LOCKED" ? (
                <UnassignReviewerForm assignmentId={item.id} />
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
