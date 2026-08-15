import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/form";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteSubmissionAction } from "@/server/actions/admin-delete-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("submission:manage");
  const { id } = await params;
  const item = await prisma.submission.findUnique({
    where: { id },
    include: { currentVersion: true, versions: true, registration: true, reviews: true },
  });
  if (!item || item.deletedAt) notFound();
  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/admin/submissions" className="text-slate-600 underline">
          ← Danh sách bài nộp
        </Link>
      </p>
      <h1 className="display text-3xl">{item.currentVersion?.submissionTitle}</h1>
      <Card className="whitespace-pre-wrap">{item.currentVersion?.solutionSummary}</Card>
      <Card>Gemini: {item.currentVersion?.geminiUsageSummary}</Card>
      <Card>Video: {item.currentVersion?.introVideoUrl ?? "—"}</Card>
      <p className="text-sm">Số review: {item.reviews.length}</p>
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
