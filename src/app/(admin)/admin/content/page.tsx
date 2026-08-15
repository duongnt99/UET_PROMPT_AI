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
  const pages = await prisma.staticPage.findMany({ orderBy: { slug: "asc" } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Nội dung tĩnh</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thể lệ, giới thiệu, hướng dẫn Audition, liên hệ… Chỉ mục Đã đăng mới hiện trên website.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">Tạo trang</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {pages.length === 0 ? <p className="text-sm text-slate-600">Chưa có trang. Bấm Tạo trang.</p> : null}
        {pages.map((page) => (
          <Link key={page.id} href={`/admin/content/${page.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{page.title}</p>
                <p className="text-sm text-slate-600">/{page.slug}</p>
              </div>
              <Badge tone={tone(page.status)}>{page.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
