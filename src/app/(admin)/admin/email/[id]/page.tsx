import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/dates";
import { pagination } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/form";
import { EmailRetryButton } from "@/components/admin/email-retry-button";
import { getEmailRuntimeInfo } from "@/server/email/email-service";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  await requirePermission("email:manage");
  const { id } = await params;
  const query = await searchParams;
  const paging = pagination(Number(query.page || 1), 100);
  const [batch, deliveries, deliveryCount, groupedErrors] = await Promise.all([
    prisma.emailBatch.findUnique({ where: { id }, include: { createdBy: { select: { name: true, email: true } } } }),
    prisma.emailOutbox.findMany({ where: { batchId: id }, orderBy: { createdAt: "asc" }, skip: paging.skip, take: paging.take }),
    prisma.emailOutbox.count({ where: { batchId: id } }),
    prisma.emailOutbox.groupBy({ by: ["lastError"], where: { batchId: id, lastError: { not: null } }, _count: { _all: true }, orderBy: { _count: { lastError: "desc" } }, take: 10 }),
  ]);
  if (!batch) notFound();
  const errors = groupedErrors.flatMap((item) => item.lastError ? [[item.lastError, item._count._all] as const] : []);
  const totalPages = Math.max(1, Math.ceil(deliveryCount / paging.pageSize));
  const emailRuntime = getEmailRuntimeInfo();

  return (
    <div>
      <Link href="/admin/email" className="text-sm underline">← Lịch sử email</Link>
      <h1 className="display mt-3 text-3xl">Chi tiết đợt gửi</h1>
      {emailRuntime.localSmtp ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Đợt này đang chạy qua Mailpit local. Mở <a className="font-semibold underline" href={emailRuntime.localInboxUrl ?? "#"} target="_blank" rel="noreferrer">hộp thư thử nghiệm</a> để xem email; thư không được chuyển ra Internet.</p> : null}
      <Card className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{batch.subject}</h2><p className="mt-1 text-sm text-slate-600">Tạo bởi {batch.createdBy?.name || batch.createdBy?.email || "tài khoản đã xóa"} · {formatDateTime(batch.createdAt)}</p></div><Badge tone={batch.status === "COMPLETED" ? "green" : batch.status.includes("FAILED") ? "red" : "gold"}>{batch.status}</Badge></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4"><div><p className="text-xs text-slate-500">Người nhận</p><strong>{batch.recipientCount}</strong></div><div><p className="text-xs text-slate-500">Bỏ qua</p><strong>{batch.skippedCount}</strong></div><div><p className="text-xs text-slate-500">Thành công</p><strong className="text-emerald-700">{batch.successCount}</strong></div><div><p className="text-xs text-slate-500">Thất bại</p><strong className="text-red-700">{batch.failedCount}</strong></div></div>
        <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm">{batch.textContent}</div>
        {batch.failedCount > 0 ? <div className="mt-5"><EmailRetryButton batchId={batch.id} /></div> : null}
      </Card>
      {errors.length > 0 ? <Card className="mt-5"><h2 className="font-semibold">Lỗi phổ biến</h2><ul className="mt-3 space-y-2 text-sm">{errors.map(([message, count]) => <li key={message}><strong>{count}×</strong> {message}</li>)}</ul></Card> : null}
      <Card className="mt-5 overflow-x-auto p-0"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-4">Email</th><th className="p-4">Trạng thái</th><th className="p-4">Số lần thử</th><th className="p-4">Thời gian gửi</th><th className="p-4">Lỗi</th></tr></thead><tbody>{deliveries.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4">{item.toEmail}</td><td className="p-4">{item.status}</td><td className="p-4">{item.attempts}</td><td className="p-4">{item.sentAt ? formatDateTime(item.sentAt) : "—"}</td><td className="max-w-md p-4 text-red-700">{item.lastError || "—"}</td></tr>)}</tbody></table></Card>
      {totalPages > 1 ? <nav className="mt-4 flex gap-3 text-sm"><Link className={paging.page <= 1 ? "pointer-events-none opacity-40" : "underline"} href={`/admin/email/${id}?page=${paging.page - 1}`}>Trang trước</Link><span>Trang {paging.page}/{totalPages}</span><Link className={paging.page >= totalPages ? "pointer-events-none opacity-40" : "underline"} href={`/admin/email/${id}?page=${paging.page + 1}`}>Trang sau</Link></nav> : null}
    </div>
  );
}
