import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { StaticPageForm } from "@/components/admin/cms-forms";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteStaticPageAction } from "@/server/actions/admin-delete-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/content" className="text-slate-600 underline">
          ← Danh sách trang
        </Link>
        {page.status === "PUBLISHED" ? (
          <>
            {" · "}
            <Link href={`/${page.slug}`} className="text-slate-600 underline" target="_blank">
              Xem trang công khai
            </Link>
          </>
        ) : null}
      </p>
      <h1 className="display text-3xl">Sửa: {page.title}</h1>
      <Card>
        <StaticPageForm
          key={`${page.id}-${page.updatedAt.toISOString()}`}
          page={{
            id: page.id,
            slug: page.slug,
            title: page.title,
            bodyMarkdown: page.bodyMarkdown,
            status: page.status,
          }}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Xóa trang</h2>
        <div className="mt-3">
          <AdminDeleteForm
            idPrefix={`page-${page.id}`}
            action={deleteStaticPageAction}
            hidden={{ id: page.id }}
            warning="Trang biến mất khỏi website. Có thể tạo lại với cùng slug."
            submitLabel="Xóa trang"
          />
        </div>
      </Card>
    </div>
  );
}
