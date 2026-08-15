import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { RubricEditorForm } from "@/components/admin/rubric-form";
import { defaultCriteriaTemplate } from "@/server/services/rubric-service";

export default async function Page() {
  await requirePermission("settings:write");
  const competitions = await prisma.competition.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, isRehearsal: true },
    orderBy: { isRehearsal: "asc" },
  });
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/rubrics" className="text-slate-600 underline">
          ← Danh sách rubric
        </Link>
      </p>
      <h1 className="display text-3xl">Tạo rubric</h1>
      <Card>
        <RubricEditorForm competitions={competitions} mutable initialCriteria={defaultCriteriaTemplate()} />
      </Card>
      <p className="text-sm text-slate-600">
        Mẫu mặc định 40/30/30. Có thể đổi trọng số, thêm hoặc xóa tiêu chí trước khi lưu. Tổng phải bằng 100%.
      </p>
    </div>
  );
}
