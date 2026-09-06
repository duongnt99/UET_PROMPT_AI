import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { disableUserAction } from "@/server/actions/admin-delete-actions";
import { hardDeleteUserAction } from "@/server/actions/admin-staff-actions";
import { AccountPasswordResetForm } from "@/components/admin/account-password-reset-form";
import { accountStatusLabel } from "@/lib/status-labels";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("users:manage");
  const { q } = await searchParams;
  const query = q?.trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    include: { roleAssignments: { where: { revokedAt: null } } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="display text-3xl">Tài khoản</h1>
      <p className="mt-2 text-sm text-slate-600">
        Xóa hẳn dùng cho user test. Nếu user còn gắn trận, xóa trận trước. SUPER_ADMIN không xóa được. Vô hiệu hóa chỉ
        chặn đăng nhập.
      </p>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm email, tên"
          className="h-11 rounded-xl border px-3"
        />
      </form>
      <div className="mt-4 space-y-3">
        {users.length === 0 ? <p className="text-sm text-slate-600">Không có tài khoản khớp.</p> : null}
        {users.map((user) => {
          const roles = user.roleAssignments.map((item) => item.role);
          const protectedAccount = roles.includes("SUPER_ADMIN");
          return (
            <Card key={user.id} className="space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-slate-600">{user.name ?? "—"}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {roles.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))}
                  <Badge tone={user.deletedAt || user.status === "DISABLED" ? "red" : "slate"}>
                    {user.deletedAt ? "Đã xóa" : accountStatusLabel(user.status)}
                  </Badge>
                </div>
              </div>
              {protectedAccount ? (
                <p className="text-xs text-slate-500">Không thể xóa tài khoản quản trị viên cấp cao.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <AccountPasswordResetForm userId={user.id} />
                  <AdminDeleteForm
                    idPrefix={`purge-${user.id}`}
                    action={hardDeleteUserAction}
                    hidden={{ userId: user.id }}
                    warning="Xóa hẳn khỏi database: hồ sơ/bài nộp của user này (nếu không gắn trận)."
                    submitLabel="Xóa hẳn"
                  />
                  {!user.deletedAt ? (
                    <AdminDeleteForm
                      idPrefix={`disable-${user.id}`}
                      action={disableUserAction}
                      hidden={{ userId: user.id }}
                      warning="Chỉ chặn đăng nhập, giữ dữ liệu."
                      submitLabel="Vô hiệu hóa"
                    />
                  ) : null}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
