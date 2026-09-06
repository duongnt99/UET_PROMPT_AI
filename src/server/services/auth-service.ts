import { prisma } from "@/lib/db/prisma";
import { hashPassword, normalizePasswordInput, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import type { Role as AppRole } from "@/server/domain/permissions";

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
      message: "Không thể tạo tài khoản với thông tin này. Nếu đã đăng ký, hãy đăng nhập hoặc đặt lại mật khẩu.",
    };
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email,
      emailNormalized: email,
      passwordHash,
      status: "ACTIVE",
      roleAssignments: { create: { role: "PARTICIPANT" } },
      profile: { create: {} },
    },
  });
  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.register",
    entityType: "User",
    entityId: user.id,
  });
  return { ok: true as const };
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
