import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Badge, Card } from "@/components/ui/form";
import { RubricEditorForm, RubricVersionActions } from "@/components/admin/rubric-form";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteRubricAction } from "@/server/actions/admin-rubric-actions";
import { isRubricMutable } from "@/server/services/rubric-service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("settings:write");
  const { id } = await params;
  const rubric = await prisma.rubric.findUnique({
    where: { id },
    include: {
      criteria: { orderBy: { displayOrder: "asc" } },
      competition: { select: { name: true, isRehearsal: true } },
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
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/rubrics" className="text-slate-600 underline">
          ← Danh sách rubric
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">{rubric.name}</h1>
        {rubric.isActive ? <Badge tone="green">Đang dùng</Badge> : <Badge>Nháp</Badge>}
      </div>
      <p className="text-sm text-slate-600">
        {rubric.stage} · v{rubric.versionNumber} · {rubric.competition.name}
        {rubric.competition.isRehearsal ? " (rehearsal)" : ""}
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
      {!rubric.isActive && mutable ? (
        <Card>
          <h2 className="font-semibold">Xóa phiên bản</h2>
          <div className="mt-3">
            <AdminDeleteForm
              idPrefix={`rubric-${rubric.id}`}
              action={deleteRubricAction}
              hidden={{ id: rubric.id }}
              warning="Chỉ xóa được phiên bản chưa kích hoạt và chưa dùng để chấm."
              submitLabel="Xóa rubric"
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
