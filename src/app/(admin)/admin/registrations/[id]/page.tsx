import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/dates";
import {
  MemberAccountForms,
  RegistrationStatusForm,
  RenameTeamForm,
} from "@/components/admin/registration-support-forms";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import {
  deleteRegistrationAction,
  disableUserAction,
  removeTeamMemberAction,
} from "@/server/actions/admin-delete-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("registration:manage");
  const { id } = await params;
  const item = await prisma.registration.findUnique({
    where: { id },
    include: {
      owner: { include: { profile: true } },
      team: { include: { members: { include: { user: { include: { profile: true } } } } } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!item || item.deletedAt) notFound();

  const members: {
    id: string;
    email: string;
    name: string;
    roleLabel: string;
    memberStatus: string;
    isOwner: boolean;
    isLeader: boolean;
  }[] =
    item.team?.members.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      name: member.user.profile?.fullName || member.user.name || member.user.email,
      roleLabel: member.roleLabel ?? "Thành viên",
      memberStatus: member.status,
      isOwner: member.user.id === item.ownerUserId,
      isLeader: member.user.id === item.team?.leaderUserId,
    })) ?? [];
  if (!members.some((member) => member.id === item.owner.id)) {
    members.unshift({
      id: item.owner.id,
      email: item.owner.email,
      name: item.owner.profile?.fullName || item.owner.name || item.owner.email,
      roleLabel: item.type === "TEAM" ? "Chủ hồ sơ" : "Thí sinh",
      memberStatus: "OWNER",
      isOwner: true,
      isLeader: item.team?.leaderUserId === item.owner.id,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/admin/registrations" className="text-slate-600 underline">
          ← Danh sách đăng ký
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">{item.code}</h1>
        <Badge>{item.status}</Badge>
        <Badge tone="blue">{item.type === "TEAM" ? "Đội" : "Cá nhân"}</Badge>
      </div>
      <Card>
        <p>
          {item.owner.profile?.fullName} — {item.owner.email}
        </p>
        <p>Trường: {item.owner.profile?.institution ?? "—"}</p>
        <p>Nộp lúc: {formatDateTime(item.submittedAt)}</p>
        {item.team ? <p>Mã đội: {item.team.teamCode}</p> : null}
      </Card>

      {item.team ? (
        <Card>
          <h2 className="font-semibold">Đổi tên đội</h2>
          <p className="mt-1 text-sm text-slate-600">Dùng khi đội gõ nhầm lúc đăng ký. Có ghi audit.</p>
          <div className="mt-4">
            <RenameTeamForm registrationId={item.id} teamName={item.team.teamName} />
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Tài khoản thành viên</h2>
        <p className="mt-1 text-sm text-slate-600">
          Đặt mật khẩu mới hoặc sửa email khi thí sinh quên / gõ nhầm. Gửi mật khẩu cho họ ngoài hệ thống. Không hiện
          mật khẩu cũ.
        </p>
        <div className="mt-4 space-y-6">
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-slate-600">
                {member.email} · {member.roleLabel}
                {member.memberStatus !== "OWNER" ? ` · ${member.memberStatus}` : null}
              </p>
              <MemberAccountForms registrationId={item.id} userId={member.id} email={member.email} />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {!member.isOwner && !member.isLeader && member.memberStatus !== "REMOVED" ? (
                  <div className="rounded-xl border border-red-100 p-3">
                    <p className="text-sm font-medium">Gỡ khỏi đội</p>
                    <div className="mt-2">
                      <AdminDeleteForm
                        idPrefix={`remove-${member.id}`}
                        action={removeTeamMemberAction}
                        hidden={{ registrationId: item.id, userId: member.id }}
                        warning="Thành viên mất chỗ trong đội, có thể đăng ký hồ sơ khác."
                        submitLabel="Gỡ khỏi đội"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="rounded-xl border border-red-100 p-3">
                  <p className="text-sm font-medium">Vô hiệu hóa tài khoản</p>
                  <div className="mt-2">
                    <AdminDeleteForm
                      idPrefix={`disable-${member.id}`}
                      action={disableUserAction}
                      hidden={{ registrationId: item.id, userId: member.id }}
                      warning="Không đăng nhập được. Không xóa lịch sử hồ sơ/bài nộp."
                      submitLabel="Vô hiệu hóa tài khoản"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Cập nhật trạng thái hồ sơ</h2>
        <div className="mt-4">
          <RegistrationStatusForm registrationId={item.id} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Xóa hồ sơ đăng ký</h2>
        <p className="mt-1 text-sm text-slate-600">
          Hồ sơ chuyển WITHDRAWN, ẩn khỏi danh sách, xóa chỗ ngồi để user đăng ký lại. Không xóa nếu còn gắn trận.
        </p>
        <div className="mt-4">
          <AdminDeleteForm
            idPrefix={`reg-${item.id}`}
            action={deleteRegistrationAction}
            hidden={{ registrationId: item.id }}
            warning="Bài Audition của hồ sơ này cũng bị ẩn."
            submitLabel="Xóa hồ sơ"
          />
        </div>
      </Card>
    </div>
  );
}
