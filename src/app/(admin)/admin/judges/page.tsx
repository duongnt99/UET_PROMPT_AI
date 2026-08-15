import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { CreateStaffForm, EditStaffForm, StaffDeleteBlock } from "@/components/admin/staff-account-form";

export default async function Page() {
  await requirePermission("users:manage");
  const judges = await prisma.roleAssignment.findMany({
    where: { role: "JUDGE", revokedAt: null, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl">Giám khảo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tạo tài khoản đăng nhập được ngay. Gửi mật khẩu qua Zalo/email riêng. Gỡ vai trò nếu chỉ muốn bỏ quyền chấm;
          xóa hẳn nếu là tài khoản test.
        </p>
      </div>
      <Card>
        <h2 className="font-semibold">Thêm giám khảo</h2>
        <div className="mt-3">
          <CreateStaffForm role="JUDGE" roleLabel="giám khảo" />
        </div>
      </Card>
      <div className="space-y-3">
        {judges.length === 0 ? <p className="text-sm text-slate-600">Chưa có giám khảo.</p> : null}
        {judges.map((item) => (
          <Card key={item.id} className="space-y-4">
            <p className="font-medium">
              {item.user.profile?.fullName || item.user.name || item.user.email}{" "}
              <span className="text-sm font-normal text-slate-600">— {item.user.email}</span>
            </p>
            <EditStaffForm
              userId={item.user.id}
              role="JUDGE"
              email={item.user.email}
              name={item.user.profile?.fullName || item.user.name || ""}
            />
            <StaffDeleteBlock userId={item.user.id} role="JUDGE" email={item.user.email} />
          </Card>
        ))}
      </div>
    </div>
  );
}
