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
  const items = await prisma.fAQ.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">FAQ</h1>
          <p className="mt-1 text-sm text-slate-600">Hiện trên trang chủ và /faq khi trạng thái là Đã đăng.</p>
        </div>
        <Button asChild>
          <Link href="/admin/faqs/new">Tạo FAQ</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-600">Chưa có FAQ.</p> : null}
        {items.map((item) => (
          <Link key={item.id} href={`/admin/faqs/${item.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{item.question}</p>
                <p className="text-sm text-slate-600">Thứ tự {item.displayOrder}</p>
              </div>
              <Badge tone={tone(item.status)}>{item.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
