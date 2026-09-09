import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";

function tone(status: string) {
  if (status === "PUBLISHED") return "green" as const;
  if (status === "DRAFT") return "gold" as const;
  if (status === "SCHEDULED") return "blue" as const;
  return "slate" as const;
}

export default async function Page() {
  await requirePermission("content:manage");
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Thông báo / tin tức</h1>
          <p className="mt-1 text-sm text-slate-600">Hiện trên trang chủ và /tin-tuc khi Đã đăng.</p>
        </div>
        <Button asChild variant="primary">
          <Link href="/admin/announcements/new">Tạo tin</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-600">Chưa có tin.</p> : null}
        {items.map((item) => (
          <Link key={item.id} href={`/admin/announcements/${item.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-slate-600">/tin-tuc/{item.slug}</p>
              </div>
              <Badge tone={tone(item.status)}>{item.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
