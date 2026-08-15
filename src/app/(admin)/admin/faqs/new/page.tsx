import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { FaqForm } from "@/components/admin/cms-forms";

export default async function Page() {
  await requirePermission("content:manage");
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/faqs" className="text-slate-600 underline">
          ← Danh sách FAQ
        </Link>
      </p>
      <h1 className="display text-3xl">Tạo FAQ</h1>
      <Card>
        <FaqForm />
      </Card>
    </div>
  );
}
