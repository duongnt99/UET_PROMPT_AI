import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { CreateStaffForm, EditStaffForm, StaffDeleteBlock } from "@/components/admin/staff-account-form";

export default async function Page() {
  await requirePermission("users:manage");
  const reviewers = await prisma.roleAssignment.findMany({
    where: { role: "REVIEWER", revokedAt: null, user: { deletedAt: null } },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl">Reviewer</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tài khoản chấm vòng Audition. Sau khi tạo, gán bài tại Phân công chấm.
        </p>
      </div>
      <Card>
        <h2 className="font-semibold">Thêm reviewer</h2>
        <div className="mt-3">
          <CreateStaffForm role="REVIEWER" roleLabel="reviewer" />
        </div>
      </Card>
      <div className="space-y-3">
        {reviewers.length === 0 ? <p className="text-sm text-slate-600">Chưa có reviewer.</p> : null}
        {reviewers.map((item) => (
          <Card key={item.id} className="space-y-4">
            <p className="font-medium">
              {item.user.profile?.fullName || item.user.name || item.user.email}{" "}
              <span className="text-sm font-normal text-slate-600">— {item.user.email}</span>
            </p>
            <EditStaffForm
              userId={item.user.id}
              role="REVIEWER"
              email={item.user.email}
              name={item.user.profile?.fullName || item.user.name || ""}
            />
            <StaffDeleteBlock userId={item.user.id} role="REVIEWER" email={item.user.email} />
          </Card>
        ))}
      </div>
    </div>
  );
}
