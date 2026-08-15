import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { AnnouncementForm } from "@/components/admin/cms-forms";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteAnnouncementAction } from "@/server/actions/admin-delete-actions";

function toDatetimeLocal(value: Date | null) {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const item = await prisma.announcement.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/announcements" className="text-slate-600 underline">
          ← Danh sách tin
        </Link>
        {item.status === "PUBLISHED" ? (
          <>
            {" · "}
            <Link href={`/tin-tuc/${item.slug}`} className="text-slate-600 underline" target="_blank">
              Xem tin công khai
            </Link>
          </>
        ) : null}
      </p>
      <h1 className="display text-3xl">Sửa tin</h1>
      <Card>
        <AnnouncementForm
          item={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            bodyMarkdown: item.bodyMarkdown,
            status: item.status,
            publishAt: toDatetimeLocal(item.publishAt ?? item.publishedAt),
          }}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Xóa tin</h2>
        <div className="mt-3">
          <AdminDeleteForm
            idPrefix={`news-${item.id}`}
            action={deleteAnnouncementAction}
            hidden={{ id: item.id }}
            warning="Tin biến mất khỏi /tin-tuc."
            submitLabel="Xóa tin"
          />
        </div>
      </Card>
    </div>
  );
}
