import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";

export default async function Page() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-3xl">Thông báo</h1>
      <div className="mt-6 space-y-3">
        {items.length === 0 ? <p>Chưa có thông báo.</p> : null}
        {items.map((item) => (
          <Card key={item.id}>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-slate-600">{item.body}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
