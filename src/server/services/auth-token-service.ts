import { prisma } from "@/lib/db/prisma";
import { createRawToken, hashToken } from "@/lib/auth/password";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

async function invalidateVerificationTokens(userId: string) {
  await prisma.verificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

async function invalidatePasswordResetTokens(userId: string) {
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function createVerificationToken(userId: string) {
  const token = createRawToken();
  await invalidateVerificationTokens(userId);
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });
  return token;
}

export async function verifyEmailWithToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { ok: false as const, message: "Liên kết xác minh không hợp lệ hoặc đã hết hạn." };
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || user.deletedAt) {
    return { ok: false as const, message: "Tài khoản không tồn tại." };
  }
  if (user.emailVerifiedAt) {
    await prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return { ok: true as const, alreadyVerified: true as const };
  }

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
    }),
  ]);

  return { ok: true as const, alreadyVerified: false as const };
}

export async function createPasswordResetToken(userId: string) {
  const token = createRawToken();
  await invalidatePasswordResetTokens(userId);
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return token;
}

export async function resetPasswordWithToken(rawToken: string, password: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { ok: false as const, message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." };
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || user.deletedAt || user.status === "DISABLED") {
    return { ok: false as const, message: "Tài khoản không khả dụng." };
  }

  const { hashPassword } = await import("@/lib/auth/password");
  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
  ]);

  return { ok: true as const };
}
