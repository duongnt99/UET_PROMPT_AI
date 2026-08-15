import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { AnnouncementForm } from "@/components/admin/cms-forms";

export default async function Page() {
  await requirePermission("content:manage");
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/announcements" className="text-slate-600 underline">
          ← Danh sách tin
        </Link>
      </p>
      <h1 className="display text-3xl">Tạo tin tức</h1>
      <Card>
        <AnnouncementForm />
      </Card>
    </div>
  );
}
