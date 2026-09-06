import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";
import { requirePermission } from "@/lib/auth/guards";

export default async function Page() {
  await requirePermission("audit:read");
  const items = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="display text-3xl">Nhật ký hệ thống</h1>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <p className="font-semibold">{item.action}</p>
            <p className="text-sm text-slate-600">
              {item.entityType} {item.entityId} · {formatDateTime(item.createdAt)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
