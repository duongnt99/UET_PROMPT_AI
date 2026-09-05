import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { Card } from "@/components/ui/form";
import { ChallengeForm } from "@/components/admin/challenge-form";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteChallengeAction } from "@/server/actions/admin-challenge-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("bracket:manage");
  const { id } = await params;
  const challenge = await prisma.matchChallenge.findUnique({
    where: { id },
    include: { matches: { select: { id: true, code: true } } },
  });
  if (!challenge) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm">
        <Link href="/admin/challenges" className="text-slate-600 underline">
          ← Kho đề thi
        </Link>
      </p>
      <h1 className="display text-3xl">Sửa đề thi</h1>
      {challenge.matches.length ? (
        <p className="text-sm text-slate-600">
          Đang gán cho: {challenge.matches.map((item) => item.code).join(", ")}. Sửa kho sẽ cập nhật đề trên các trận đang
          liên kết.
        </p>
      ) : null}
      <Card>
        <ChallengeForm
          challenge={{
            id: challenge.id,
            title: challenge.title,
            prompt: challenge.prompt,
            notes: challenge.notes,
          }}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Xóa đề khỏi kho</h2>
        <p className="mt-1 text-sm text-slate-600">
          Trận đã gán sẽ giữ nguyên nội dung đang hiển thị; liên kết kho bị gỡ.
        </p>
        <div className="mt-3">
          <AdminDeleteForm
            idPrefix={`challenge-${challenge.id}`}
            action={deleteChallengeAction}
            hidden={{ id: challenge.id }}
            warning="Xóa đề khỏi kho. Không xóa nội dung đã copy lên từng trận."
            submitLabel="Xóa đề thi"
          />
        </div>
      </Card>
    </div>
  );
}
