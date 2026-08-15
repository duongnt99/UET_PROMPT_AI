import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import { getUserRoles } from "@/server/services/auth-service";

async function requireUserOnRegistration(registrationId: string, userId: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { team: { include: { members: true } } },
  });
  if (!registration) throw new Error("Không tìm thấy hồ sơ đăng ký.");
  const onTeam = registration.team?.members.some((member) => member.userId === userId);
  if (registration.ownerUserId !== userId && !onTeam) {
    throw new Error("Tài khoản không thuộc hồ sơ này.");
  }
  return registration;
}

async function assertCanEditTarget(actorUserId: string, targetUserId: string) {
  const [actorRoles, targetRoles] = await Promise.all([
    getUserRoles(actorUserId),
    getUserRoles(targetUserId),
  ]);
  if (targetRoles.includes("SUPER_ADMIN") && !actorRoles.includes("SUPER_ADMIN")) {
    throw new Error("ADMIN không được đổi tài khoản SUPER_ADMIN.");
  }
}

export async function adminRenameTeam(params: {
  actorUserId: string;
  registrationId: string;
  teamName: string;
  reason: string;
}) {
  const name = params.teamName.trim();
  const reason = params.reason.trim();
  if (name.length < 2) throw new Error("Tên đội cần tối thiểu 2 ký tự.");
  if (!reason) throw new Error("Cần ghi lý do để lưu audit.");
  const registration = await prisma.registration.findUnique({
    where: { id: params.registrationId },
    include: { team: true },
  });
  if (!registration?.team) throw new Error("Hồ sơ này không phải đăng ký đội.");
  const before = registration.team.teamName;
  await prisma.team.update({
    where: { id: registration.team.id },
    data: { teamName: name, version: { increment: 1 } },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: registration.competitionId,
    action: "team.rename",
    entityType: "Team",
    entityId: registration.team.id,
    before: { teamName: before },
    after: { teamName: name },
    reason,
  });
  return { ok: true as const, teamName: name };
}

export async function adminSetUserPassword(params: {
  actorUserId: string;
  registrationId: string;
  userId: string;
  password: string;
  reason: string;
}) {
  const reason = params.reason.trim();
  if (!reason) throw new Error("Cần ghi lý do để lưu audit.");
  const password = normalizePasswordInput(params.password);
  if (password.length < 10) throw new Error("Mật khẩu mới cần tối thiểu 10 ký tự.");
  await requireUserOnRegistration(params.registrationId, params.userId);
  await assertCanEditTarget(params.actorUserId, params.userId);
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      passwordHash: await hashPassword(password),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "user.admin_set_password",
    entityType: "User",
    entityId: params.userId,
    after: { password: "[redacted]" },
    reason,
  });
  return { ok: true as const };
}

export async function adminChangeUserEmail(params: {
  actorUserId: string;
  registrationId: string;
  userId: string;
  email: string;
  reason: string;
}) {
  const reason = params.reason.trim();
  if (!reason) throw new Error("Cần ghi lý do để lưu audit.");
  const email = params.email.trim();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized.includes("@")) throw new Error("Email không hợp lệ.");
  await requireUserOnRegistration(params.registrationId, params.userId);
  await assertCanEditTarget(params.actorUserId, params.userId);
  const target = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  try {
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        email,
        emailNormalized,
        emailVerifiedAt: new Date(),
        status: target.status === "DISABLED" ? "DISABLED" : "ACTIVE",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Email này đã được dùng cho tài khoản khác.");
    }
    throw error;
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "user.admin_change_email",
    entityType: "User",
    entityId: params.userId,
    before: { email: target.email },
    after: { email: emailNormalized },
    reason,
  });
  return { ok: true as const };
}
