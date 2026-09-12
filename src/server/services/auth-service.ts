import { prisma } from "@/lib/db/prisma";
import { hashPassword, normalizePasswordInput, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import type { Role as AppRole } from "@/server/domain/permissions";
import { sendVerificationEmail } from "@/server/services/auth-email-service";
import { createVerificationToken } from "@/server/services/auth-token-service";

export async function registerAccount(params: {
  email: string;
  password: string;
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
      message: "Email này đã được sử dụng để đăng ký tài khoản.",
    };
  }
  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        passwordHash,
        status: "PENDING_VERIFICATION",
        roleAssignments: { create: { role: "PARTICIPANT" } },
        profile: { create: {} },
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { ok: false as const, message: "Email này đã được sử dụng để đăng ký tài khoản." };
    }
    throw error;
  }
  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.register",
    entityType: "User",
    entityId: user.id,
  });

  const token = await createVerificationToken(user.id);
  const emailResult = await sendVerificationEmail({ to: email, token });

  return {
    ok: true as const,
    emailSent: emailResult.ok,
  };
}

export async function requestPasswordReset(email: string) {
  const normalized = normalizeEmail(email);
  const limit = await consumeRateLimit(`password-reset:${normalized}`);
  if (!limit.ok) {
    return { ok: true as const, message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." };
  }

  const user = await prisma.user.findUnique({
    where: { emailNormalized: normalized },
    include: { roleAssignments: { where: { revokedAt: null } } },
  });
  if (!user || user.deletedAt || user.status === "DISABLED") {
    return { ok: true as const, message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." };
  }

  const { createPasswordResetToken } = await import("@/server/services/auth-token-service");
  const { sendPasswordResetEmail } = await import("@/server/services/auth-email-service");
  const token = await createPasswordResetToken(user.id);
  await sendPasswordResetEmail({ to: user.email, token });

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: user.id,
  });

  return { ok: true as const, message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." };
}

export async function resendVerificationEmail(email: string) {
  const normalized = normalizeEmail(email);
  const limit = await consumeRateLimit(`verify-resend:${normalized}`);
  if (!limit.ok) {
    return { ok: false as const, message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." };
  }

  const user = await prisma.user.findUnique({ where: { emailNormalized: normalized } });
  if (!user || user.deletedAt || user.status === "DISABLED") {
    return { ok: false as const, message: "Không tìm thấy tài khoản cần xác minh." };
  }
  if (user.emailVerifiedAt) {
    return { ok: false as const, message: "Email này đã được xác minh. Bạn có thể đăng nhập." };
  }
  if (user.status !== "PENDING_VERIFICATION") {
    return { ok: false as const, message: "Không tìm thấy tài khoản cần xác minh." };
  }

  const token = await createVerificationToken(user.id);
  const emailResult = await sendVerificationEmail({ to: user.email, token });
  if (!emailResult.ok) {
    return { ok: false as const, message: "Không gửi được email xác minh. Vui lòng thử lại sau." };
  }

  return { ok: true as const, message: "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư." };
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user || user.deletedAt || user.status === "DISABLED") {
    return { ok: false as const, message: "Tài khoản không khả dụng." };
  }

  const valid = await verifyPassword(params.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false as const, message: "Mật khẩu hiện tại không đúng." };
  }

  const passwordHash = await hashPassword(params.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
  });

  return { ok: true as const, message: "Đã đổi mật khẩu thành công." };
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
