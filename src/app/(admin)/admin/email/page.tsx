import Link from "next/link";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/dates";
import { pagination } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/form";
import { EmailComposeForm } from "@/components/admin/email-compose-form";
import { countEmailRecipients } from "@/server/email/email-batch-service";
import { getEmailRuntimeInfo } from "@/server/email/email-service";

const statusLabels = {
  PENDING: "Đang chờ",
  SENDING: "Đang gửi",
  COMPLETED: "Hoàn tất",
  PARTIALLY_FAILED: "Hoàn tất một phần",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
} as const;
const recipientLabels = {
  ALL_USERS: "Tất cả người dùng",
  ALL_PARTICIPANTS: "Tất cả thí sinh",
  SPECIFIC_USERS: "Người dùng cụ thể",
} as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("email:manage");
  const params = await searchParams;
  const paging = pagination(Number(params.page || 1), 20);
  const emailRuntime = getEmailRuntimeInfo();
  const [users, allUsersCount, participantCount, batches, total] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    countEmailRecipients("ALL_USERS"),
    countEmailRecipients("ALL_PARTICIPANTS"),
    prisma.emailBatch.findMany({
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.emailBatch.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / paging.pageSize));

  return (
    <div>
      <h1 className="display text-3xl">Gửi thông báo email</h1>
      <p className="mt-2 text-sm text-slate-600">Mỗi lần gửi sẽ tạo cả thông báo trong tài khoản và email trong hàng đợi.</p>
      {emailRuntime.localSmtp ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Đang dùng hộp thư thử nghiệm Mailpit.</strong> Email chỉ được giữ trên máy local, không chuyển tới Gmail hay email trường. Xem thư tại <a href={emailRuntime.localInboxUrl ?? "#"} target="_blank" rel="noreferrer" className="font-semibold underline">localhost:8025</a>.
        </div>
      ) : emailRuntime.provider === "console" ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Đang dùng console transport.</strong> Hệ thống mô phỏng gửi thành công nhưng không phát email thật.</div>
      ) : emailRuntime.provider === "unconfigured" ? (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"><strong>Chưa cấu hình email provider.</strong> Thông báo nội bộ vẫn được tạo nhưng email sẽ thất bại.</div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">Provider email đang dùng: <strong>{emailRuntime.provider.toUpperCase()}</strong>.</div>
      )}
      <div className="mt-6"><EmailComposeForm users={users} allUsersCount={allUsersCount} participantCount={participantCount} initialIdempotencyKey={randomUUID()} /></div>

      <h2 className="mt-8 text-2xl font-semibold">Lịch sử gửi</h2>
      <p className="mt-1 text-sm text-slate-600">Bấm vào tiêu đề để xem lại đầy đủ nội dung và kết quả từng người nhận. “Thành công” nghĩa là transport/provider đã chấp nhận thư.</p>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600"><tr><th className="p-4">Thời gian</th><th className="p-4">Tiêu đề (bấm để xem)</th><th className="p-4">Người gửi</th><th className="p-4">Đối tượng</th><th className="p-4">Provider chấp nhận</th><th className="p-4">Trạng thái xử lý</th></tr></thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b last:border-0">
                <td className="p-4">{formatDateTime(batch.createdAt)}</td>
                <td className="p-4"><Link className="font-medium underline" href={`/admin/email/${batch.id}`}>{batch.subject}</Link></td>
                <td className="p-4">{batch.createdBy?.name || batch.createdBy?.email || "Tài khoản đã xóa"}</td>
                <td className="p-4">{recipientLabels[batch.recipientType]} ({batch.recipientCount})</td>
                <td className="p-4 text-emerald-700">{batch.successCount} thành công <span className="text-red-700">· {batch.failedCount} lỗi</span></td>
                <td className="p-4"><Badge tone={batch.status === "COMPLETED" ? "green" : batch.status.includes("FAILED") ? "red" : "gold"}>{statusLabels[batch.status]}</Badge></td>
              </tr>
            ))}
            {batches.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-500">Chưa có đợt gửi email.</td></tr> : null}
          </tbody>
        </table>
      </Card>
      {totalPages > 1 ? <nav className="mt-4 flex gap-3 text-sm"><Link className={paging.page <= 1 ? "pointer-events-none opacity-40" : "underline"} href={`/admin/email?page=${paging.page - 1}`}>Trang trước</Link><span>Trang {paging.page}/{totalPages}</span><Link className={paging.page >= totalPages ? "pointer-events-none opacity-40" : "underline"} href={`/admin/email?page=${paging.page + 1}`}>Trang sau</Link></nav> : null}
    </div>
  );
}
