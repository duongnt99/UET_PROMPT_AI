import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createPasswordResetToken,
  createVerificationToken,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from "@/server/services/auth-token-service";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length === 0) return;
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.verificationToken.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.roleAssignment.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.participantProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
});

describe("auth-token-service", () => {
  it("verifies email and activates pending user", async () => {
    const email = `verify-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        passwordHash: await hashPassword("password1234"),
        status: "PENDING_VERIFICATION",
        roleAssignments: { create: { role: "PARTICIPANT" } },
        profile: { create: {} },
      },
    });
    createdUserIds.push(user.id);

    const token = await createVerificationToken(user.id);
    const result = await verifyEmailWithToken(token);
    expect(result.ok).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.emailVerifiedAt).not.toBeNull();
  });

  it("resets password with valid token", async () => {
    const email = `reset-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        passwordHash: await hashPassword("oldpassword12"),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roleAssignments: { create: { role: "PARTICIPANT" } },
        profile: { create: {} },
      },
    });
    createdUserIds.push(user.id);

    const token = await createPasswordResetToken(user.id);
    const result = await resetPasswordWithToken(token, "newpassword12");
    expect(result.ok).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated).not.toBeNull();
    expect(await verifyPassword("newpassword12", updated!.passwordHash)).toBe(true);
  });
});
