import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { ChallengeForm } from "@/components/admin/challenge-form";

export default async function Page() {
  await requirePermission("bracket:manage");
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/challenges" className="text-slate-600 underline">
          ← Kho đề thi
        </Link>
      </p>
      <h1 className="display text-3xl">Tạo đề thi</h1>
      <Card>
        <ChallengeForm />
      </Card>
    </div>
  );
}
