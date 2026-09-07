import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Badge, Card } from "@/components/ui/form";
import { RubricEditorForm, RubricVersionActions } from "@/components/admin/rubric-form";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteRubricAction } from "@/server/actions/admin-rubric-actions";
import { isRubricMutable } from "@/server/services/rubric-service";
import { rubricStageLabel } from "@/lib/status-labels";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("settings:write");
  const { id } = await params;
  const rubric = await prisma.rubric.findUnique({
    where: { id },
    include: {
      criteria: { orderBy: { displayOrder: "asc" } },
      competition: { select: { name: true, isRehearsal: true } },
      _count: { select: { reviews: true, judgeScores: true, snapshots: true } },
    },
  });
  if (!rubric) notFound();
  const [mutable, competitions] = await Promise.all([
    isRubricMutable(rubric.id),
    prisma.competition.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, isRehearsal: true },
      orderBy: { isRehearsal: "asc" },
    }),
  ]);
  const usageCount = rubric._count.reviews + rubric._count.judgeScores + rubric._count.snapshots;
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/rubrics" className="text-slate-600 underline">
          ← Danh sách bộ tiêu chí
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">{rubric.name}</h1>
        {rubric.isActive ? <Badge tone="green">Đang dùng</Badge> : <Badge>Nháp</Badge>}
      </div>
      <p className="text-sm text-slate-600">
        {rubricStageLabel(rubric.stage)} · phiên bản {rubric.versionNumber} · {rubric.competition.name}
        {rubric.competition.isRehearsal ? " · Dữ liệu diễn tập" : ""}
      </p>
      <Card>
        <RubricVersionActions rubricId={rubric.id} isActive={rubric.isActive} />
      </Card>
      <Card>
        <RubricEditorForm
          mutable={mutable}
          competitions={competitions}
          rubric={{
            id: rubric.id,
            name: rubric.name,
            stage: rubric.stage,
            competitionId: rubric.competitionId,
            isActive: rubric.isActive,
            versionNumber: rubric.versionNumber,
            criteria: rubric.criteria.map((item) => ({
              id: item.id,
              code: item.code,
              titleVi: item.titleVi,
              titleEn: item.titleEn,
              description: item.description,
              guidance: item.guidance,
              weight: item.weight.toString(),
              minScore: item.minScore.toString(),
              maxScore: item.maxScore.toString(),
              scoreStep: item.scoreStep.toString(),
              isRequired: item.isRequired,
            })),
          }}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Xóa phiên bản</h2>
        {!rubric.isActive && mutable ? (
          <div className="mt-3">
            <AdminDeleteForm
              idPrefix={`rubric-${rubric.id}`}
              action={deleteRubricAction}
              hidden={{ id: rubric.id }}
              warning="Phiên bản này chưa được kích hoạt và chưa dùng để chấm nên có thể xóa an toàn."
              submitLabel="Xóa bộ tiêu chí"
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            {rubric.isActive
              ? "Phiên bản này đang dùng nên chưa thể xóa. Hãy kích hoạt một phiên bản khác cùng vòng trước."
              : `Phiên bản đã được lưu trong ${usageCount} dữ liệu chấm hoặc đã khóa, nên hệ thống giữ lại để bảo toàn lịch sử.`}
          </p>
        )}
      </Card>
    </div>
  );
}
