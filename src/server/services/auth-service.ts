import { prisma } from "@/lib/db/prisma";
import { createRawToken, hashPassword, hashToken, normalizePasswordInput, verifyPassword } from "@/lib/auth/password";
import { enqueueEmail } from "@/lib/email";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import { getEnv } from "@/config/env";
import type { Role as AppRole } from "@/server/domain/permissions";
import type { Role as DbRole } from "@prisma/client";

export async function registerAccount(params: {
  email: string;
  password: string;
  fullName: string;
}) {
  const email = normalizeEmail(params.email);
  const limit = await consumeRateLimit(`register:${email}`);
  if (!limit.ok) {
    return { ok: false as const, message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." };
  }
  const password = normalizePasswordInput(params.password);
  if (password.length < 10) {
    return { ok: false as const, message: "Mật khẩu cần tối thiểu 10 ký tự." };
  }
  const existing = await prisma.user.findUnique({ where: { emailNormalized: email } });
  if (existing) {
    return {
      ok: false as const,
      message: "Không thể tạo tài khoản với thông tin này. Nếu đã đăng ký, hãy đăng nhập hoặc đặt lại mật khẩu.",
    };
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email,
      emailNormalized: email,
      passwordHash,
      name: params.fullName,
      status: "PENDING_VERIFICATION",
      roleAssignments: { create: { role: "PARTICIPANT" } },
      profile: { create: { fullName: params.fullName } },
    },
  });
  await issueEmailVerification(user.id, user.email, params.fullName);
  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.register",
    entityType: "User",
    entityId: user.id,
  });
  return { ok: true as const };
}

export async function issueEmailVerification(userId: string, email: string, name: string) {
  const token = createRawToken();
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const verifyUrl = `${getEnv().APP_URL}/xac-minh-email?token=${token}`;
  await enqueueEmail({
    toEmail: email,
    templateCode: "verify_email",
    payload: { name, verifyUrl },
    idempotencyKey: `verify_email:${userId}:${new Date().toISOString().slice(0, 13)}`,
  });
  return token;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, message: "Liên kết xác minh không hợp lệ hoặc đã hết hạn." };
  }
  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
    }),
  ]);
  return { ok: true as const };
}

export async function requestPasswordReset(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  const limit = await consumeRateLimit(`reset:${email}`, 5);
  if (!limit.ok) {
    return { ok: true as const };
  }
  const user = await prisma.user.findUnique({ where: { emailNormalized: email } });
  if (!user || user.status === "DISABLED") {
    return { ok: true as const };
  }
  const token = createRawToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  await enqueueEmail({
    toEmail: user.email,
    templateCode: "reset_password",
    payload: {
      name: user.name ?? "bạn",
      resetUrl: `${getEnv().APP_URL}/dat-lai-mat-khau?token=${token}`,
    },
    idempotencyKey: `reset_password:${user.id}:${Date.now()}`,
  });
  return { ok: true as const };
}

export async function resetPassword(token: string, passwordRaw: string) {
  const password = normalizePasswordInput(passwordRaw);
  if (password.length < 10) {
    return { ok: false as const, message: "Mật khẩu cần tối thiểu 10 ký tự." };
  }
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." };
  }
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password), failedLoginCount: 0, lockedUntil: null },
    }),
  ]);
  await writeAuditLog({
    actorUserId: record.userId,
    action: "auth.password_reset",
    entityType: "User",
    entityId: record.userId,
  });
  return { ok: true as const };
}

export async function createStaffInvitation(params: {
  email: string;
  role: Exclude<AppRole, "PUBLIC" | "SUPER_ADMIN">;
  invitedById: string;
}) {
  const token = createRawToken();
  const invitation = await prisma.staffInvitation.create({
    data: {
      email: normalizeEmail(params.email),
      role: params.role as DbRole,
      tokenHash: hashToken(token),
      invitedById: params.invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const template = params.role === "JUDGE" ? "judge_invite" : "reviewer_invite";
  await enqueueEmail({
    toEmail: params.email,
    templateCode: template,
    payload: {
      inviteUrl: `${getEnv().APP_URL}/loi-moi?token=${token}`,
    },
    idempotencyKey: `staff_invite:${invitation.id}`,
  });
  return { token, id: invitation.id };
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await prisma.roleAssignment.findMany({
    where: { userId, revokedAt: null },
  });
  return rows.map((row) => row.role as AppRole);
}

export async function verifyLoginPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { emailNormalized: normalizeEmail(email) },
  });
  if (!user) return false;
  return verifyPassword(password, user.passwordHash);
}
