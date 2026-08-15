import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import { getUserRoles } from "@/server/services/auth-service";
import { assertStaffRole, staffRoleLabel, type StaffRole } from "@/server/domain/admin-delete";
import { canChangeRole } from "@/server/domain/permissions";
import { hardDeleteUser } from "@/server/services/admin-delete-service";

function requireReason(reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) throw new Error("Cần ghi lý do (audit).");
  return trimmed;
}

export async function createStaffUser(params: {
  actorUserId: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
  reason: string;
}) {
  const role = assertStaffRole(params.role);
  const reason = requireReason(params.reason);
  const fullName = params.fullName.trim();
  if (fullName.length < 2) throw new Error("Tên cần tối thiểu 2 ký tự.");
  const password = normalizePasswordInput(params.password);
  if (password.length < 10) throw new Error("Mật khẩu cần tối thiểu 10 ký tự.");
  const email = params.email.trim();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized.includes("@")) throw new Error("Email không hợp lệ.");

  const actorRoles = await getUserRoles(params.actorUserId);
  const allowed = canChangeRole({
    actorRoles,
    targetCurrentRoles: [],
    nextRole: role,
  });
  if (!allowed.ok) throw new Error(allowed.message);

  const existing = await prisma.user.findUnique({
    where: { emailNormalized },
    include: { roleAssignments: { where: { revokedAt: null } } },
  });
  if (existing?.deletedAt) {
    throw new Error("Email này thuộc tài khoản đã vô hiệu hóa. Chọn email khác.");
  }
  if (existing) {
    if (existing.roleAssignments.some((item) => item.role === role)) {
      throw new Error(`Tài khoản này đã là ${staffRoleLabel(role)}.`);
    }
    await prisma.roleAssignment.create({ data: { userId: existing.id, role } });
    if (!existing.emailVerifiedAt || existing.status !== "ACTIVE") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerifiedAt: existing.emailVerifiedAt ?? new Date(), status: "ACTIVE", name: existing.name || fullName },
      });
    }
    await writeAuditLog({
      actorUserId: params.actorUserId,
      action: "staff.grant_role",
      entityType: "User",
      entityId: existing.id,
      reason,
      after: { email: existing.email, role },
    });
    return { id: existing.id, email: existing.email, created: false as const, role };
  }

  const user = await prisma.user.create({
    data: {
      email,
      emailNormalized,
      name: fullName,
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
      roleAssignments: { create: { role } },
      profile: { create: { fullName } },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "staff.create",
    entityType: "User",
    entityId: user.id,
    reason,
    after: { email: user.email, role },
  });
  return { id: user.id, email: user.email, created: true as const, role };
}

export async function updateStaffUser(params: {
  actorUserId: string;
  userId: string;
  email: string;
  fullName: string;
  password?: string;
  reason: string;
}) {
  const reason = requireReason(params.reason);
  const fullName = params.fullName.trim();
  if (fullName.length < 2) throw new Error("Tên cần tối thiểu 2 ký tự.");
  const email = params.email.trim();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized.includes("@")) throw new Error("Email không hợp lệ.");
  const password = params.password ? normalizePasswordInput(params.password) : "";
  if (password && password.length < 10) {
    throw new Error("Mật khẩu mới cần tối thiểu 10 ký tự.");
  }
  const [actorRoles, targetRoles] = await Promise.all([
    getUserRoles(params.actorUserId),
    getUserRoles(params.userId),
  ]);
  if (targetRoles.includes("SUPER_ADMIN") && !actorRoles.includes("SUPER_ADMIN")) {
    throw new Error("ADMIN không được sửa SUPER_ADMIN.");
  }
  const target = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.userId },
        data: {
          email,
          emailNormalized,
          name: fullName,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      }),
      prisma.participantProfile.upsert({
        where: { userId: params.userId },
        update: { fullName },
        create: { userId: params.userId, fullName },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Email này đã được dùng cho tài khoản khác.");
    }
    throw error;
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "staff.update",
    entityType: "User",
    entityId: params.userId,
    reason,
    before: { email: target.email, name: target.name },
    after: { email: emailNormalized, name: fullName, passwordChanged: Boolean(password) },
  });
  return { email: emailNormalized };
}

export async function revokeStaffRole(params: {
  actorUserId: string;
  userId: string;
  role: string;
  reason: string;
}) {
  const role = assertStaffRole(params.role);
  const reason = requireReason(params.reason);
  const targetRoles = await getUserRoles(params.userId);
  if (!targetRoles.includes(role)) throw new Error(`Tài khoản không có vai trò ${staffRoleLabel(role)}.`);
  await prisma.roleAssignment.updateMany({
    where: { userId: params.userId, role, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "staff.revoke_role",
    entityType: "User",
    entityId: params.userId,
    reason,
    after: { role },
  });
  return { role };
}

export async function deleteStaffUser(params: {
  actorUserId: string;
  userId: string;
  role: string;
  reason: string;
}) {
  assertStaffRole(params.role);
  return hardDeleteUser(params);
}

export type { StaffRole };
