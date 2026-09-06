import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/server/domain/permissions";
import { RubricVersionActions } from "@/components/admin/rubric-form";

export default async function Page() {
  const user = await requirePermission("settings:read");
  const canWrite = hasPermission(user.roles, "settings:write");
  const rubrics = await prisma.rubric.findMany({
    include: {
      criteria: { orderBy: { displayOrder: "asc" } },
      competition: { select: { name: true, isRehearsal: true } },
    },
    orderBy: [{ competitionId: "asc" }, { stage: "asc" }, { versionNumber: "desc" }],
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Bộ tiêu chí chấm</h1>
          <p className="mt-1 text-sm text-slate-600">
            Trọng số các tiêu chí phải tổng 100%. Phiên bản đang kích hoạt dùng cho phiếu chấm mới và trang tiêu chí
            công khai. Phiên bản đã gán cho reviewer/giám khảo thì sửa bằng cách tạo bản mới.
          </p>
        </div>
        {canWrite ? (
          <Button asChild>
            <Link href="/admin/rubrics/new">Tạo rubric</Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {rubrics.length === 0 ? <p className="text-sm text-slate-600">Chưa có rubric.</p> : null}
        {rubrics.map((rubric) => (
          <Card key={rubric.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {rubric.name} · {rubric.stage} v{rubric.versionNumber}
                </p>
                <p className="text-sm text-slate-600">
                  {rubric.competition.name}
                  {rubric.competition.isRehearsal ? " (rehearsal)" : ""}
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
            {canWrite ? <RubricVersionActions rubricId={rubric.id} isActive={rubric.isActive} /> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
