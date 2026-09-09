import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/server/domain/permissions";
import { RubricVersionActions } from "@/components/admin/rubric-form";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteRubricAction } from "@/server/actions/admin-rubric-actions";
import { rubricStageLabel } from "@/lib/status-labels";

type RubricListItem = Awaited<ReturnType<typeof getRubrics>>[number];

async function getRubrics() {
  return prisma.rubric.findMany({
    include: {
      criteria: { orderBy: { displayOrder: "asc" } },
      competition: { select: { name: true, isRehearsal: true } },
      _count: { select: { reviews: true, judgeScores: true, snapshots: true } },
    },
    orderBy: [{ competitionId: "asc" }, { stage: "asc" }, { versionNumber: "desc" }],
  });
}

function usageCount(rubric: RubricListItem) {
  return rubric._count.reviews + rubric._count.judgeScores + rubric._count.snapshots;
}

function RubricCard({ rubric, canWrite }: { rubric: RubricListItem; canWrite: boolean }) {
  const used = usageCount(rubric);
  const canDelete = !rubric.isActive && !rubric.lockedAt && used === 0;
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {rubric.name} · {rubricStageLabel(rubric.stage)} · phiên bản {rubric.versionNumber}
          </p>
          <p className="text-sm text-slate-600">
            {rubric.competition.name}
            {rubric.competition.isRehearsal ? " · Dữ liệu diễn tập" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rubric.isActive ? <Badge tone="green">Đang dùng</Badge> : <Badge>Nháp</Badge>}
          {canWrite ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/rubrics/${rubric.id}`}>Sửa</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <ul className="text-sm">
        {rubric.criteria.map((criterion) => (
          <li key={criterion.id}>
            {criterion.titleVi}: {criterion.weight.toString()}%
          </li>
        ))}
      </ul>
      {used > 0 ? (
        <p className="text-xs text-slate-500">
          Đang được lưu trong {rubric._count.reviews} lượt phân công, {rubric._count.judgeScores} phiếu điểm và{" "}
          {rubric._count.snapshots} lần chốt kết quả.
        </p>
      ) : null}
      {canWrite ? <RubricVersionActions rubricId={rubric.id} isActive={rubric.isActive} /> : null}
      {canWrite && canDelete ? (
        <details className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-red-800">Xóa phiên bản thừa</summary>
          <div className="mt-3">
            <AdminDeleteForm
              idPrefix={`rubric-list-${rubric.id}`}
              action={deleteRubricAction}
              hidden={{ id: rubric.id }}
              warning="Phiên bản này chưa được kích hoạt và chưa dùng để chấm nên có thể xóa an toàn."
              submitLabel="Xóa bộ tiêu chí"
            />
          </div>
        </details>
      ) : canWrite ? (
        <p className="text-xs text-slate-500">
          {rubric.isActive
            ? "Không thể xóa khi đang dùng. Hãy kích hoạt một phiên bản khác trước."
            : rubric.lockedAt || used > 0
              ? "Không thể xóa vì phiên bản đã được dùng; hệ thống giữ lại để bảo toàn lịch sử chấm."
              : null}
        </p>
      ) : null}
    </Card>
  );
}

export default async function Page() {
  const user = await requirePermission("settings:read");
  const canWrite = hasPermission(user.roles, "settings:write");
  const rubrics = await getRubrics();
  const officialRubrics = rubrics.filter((rubric) => !rubric.competition.isRehearsal);
  const rehearsalRubrics = rubrics.filter((rubric) => rubric.competition.isRehearsal);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Bộ tiêu chí chấm</h1>
          <p className="mt-1 text-sm text-slate-600">
            Trọng số các tiêu chí phải tổng 100%. Phiên bản đang dùng áp dụng cho phiếu chấm mới và trang tiêu chí
            công khai. Phiên bản đã gán cho người chấm thì sửa bằng cách tạo bản mới.
          </p>
        </div>
        {canWrite ? (
          <Button asChild variant="primary">
            <Link href="/admin/rubrics/new">Tạo bộ tiêu chí</Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {rubrics.length === 0 ? <p className="text-sm text-slate-600">Chưa có bộ tiêu chí.</p> : null}
        {officialRubrics.map((rubric) => <RubricCard key={rubric.id} rubric={rubric} canWrite={canWrite} />)}
        {rehearsalRubrics.length > 0 ? (
          <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer font-semibold text-slate-800">
              Bộ tiêu chí diễn tập ({rehearsalRubrics.length})
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Đây là dữ liệu mẫu phục vụ chạy thử, được thu gọn để không lẫn với cuộc thi chính thức.
            </p>
            <div className="mt-3 space-y-3">
              {rehearsalRubrics.map((rubric) => <RubricCard key={rubric.id} rubric={rubric} canWrite={canWrite} />)}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
