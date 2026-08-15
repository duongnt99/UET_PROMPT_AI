import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { FaqForm } from "@/components/admin/cms-forms";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteFaqAction } from "@/server/actions/admin-delete-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const faq = await prisma.fAQ.findUnique({ where: { id } });
  if (!faq) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/faqs" className="text-slate-600 underline">
          ← Danh sách FAQ
        </Link>
      </p>
      <h1 className="display text-3xl">Sửa FAQ</h1>
      <Card>
        <FaqForm
          faq={{
            id: faq.id,
            question: faq.question,
            answerMarkdown: faq.answerMarkdown,
            displayOrder: faq.displayOrder,
            status: faq.status,
          }}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Xóa FAQ</h2>
        <div className="mt-3">
          <AdminDeleteForm
            idPrefix={`faq-${faq.id}`}
            action={deleteFaqAction}
            hidden={{ id: faq.id }}
            warning="Câu hỏi biến mất khỏi /faq và trang chủ."
            submitLabel="Xóa FAQ"
          />
        </div>
      </Card>
    </div>
  );
}
